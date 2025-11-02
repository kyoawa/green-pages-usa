import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { addToCart } from "@/lib/cart"
import { createReservation, calculateAvailableInventory } from "@/lib/reservations"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const ADS_TABLE = process.env.DYNAMODB_TABLE_NAME || "green-pages-ads"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { state, adType, quantity = 1 } = body

    if (!state || !adType) {
      return NextResponse.json(
        { error: "State and adType are required" },
        { status: 400 }
      )
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
        { status: 400 }
      )
    }

    // Create composite item ID
    const itemId = `${state}#${adType}`

    // Get ad details from database
    const scanCommand = new ScanCommand({
      TableName: ADS_TABLE,
      FilterExpression: "#state = :state AND adType = :adType AND active = :active",
      ExpressionAttributeNames: {
        "#state": "state",
      },
      ExpressionAttributeValues: {
        ":state": state,
        ":adType": adType,
        ":active": true,
      },
    })

    const scanResponse = await docClient.send(scanCommand)

    if (!scanResponse.Items || scanResponse.Items.length === 0) {
      return NextResponse.json(
        { error: "Ad not found or not available" },
        { status: 404 }
      )
    }

    const ad = scanResponse.Items[0]

    // Check available inventory (total - active reservations)
    const availableInventory = await calculateAvailableInventory(
      itemId,
      ad.inventory
    )

    if (availableInventory < quantity) {
      return NextResponse.json(
        { error: `Only ${availableInventory} slots available` },
        { status: 400 }
      )
    }

    // Create reservation first
    const reservation = await createReservation(
      userId,
      itemId,
      state,
      adType,
      quantity
    )

    // Add to cart with reservation ID
    try {
      const cart = await addToCart(userId, {
        itemId,
        state,
        adType,
        title: ad.title,
        price: ad.price, // Price in USD
        quantity: quantity,
        reservationId: reservation.reservationId,
      })

      return NextResponse.json(
        {
          success: true,
          cart,
          reservation,
          message: "Item added to cart successfully",
        },
        { status: 200 }
      )
    } catch (cartError: any) {
      // If cart add fails, release the reservation
      // We'll let TTL handle this, but log it
      console.error("Failed to add to cart after creating reservation:", cartError)

      return NextResponse.json(
        { error: cartError.message || "Failed to add item to cart" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error("Error adding to cart:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
