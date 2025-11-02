// app/api/inventory/[state]/route.ts
import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { calculateAvailableInventory } from '@/lib/reservations'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

export async function GET(
  request: Request,
  { params }: { params: { state: string } }
) {
  const { state } = params

  try {
    // Handle both state codes (AL) and names (alabama)
    let stateCode = state.toUpperCase()

    // If it's not a 2-letter code, it's probably a name - use first 2 letters
    if (stateCode.length !== 2) {
      // For now, simple mapping - just take first 2 letters
      stateCode = stateCode.substring(0, 2)
    }

    console.log(`Fetching inventory for state: ${stateCode}`)

    // Query the same table that admin uses (green-pages-ads)
    const command = new ScanCommand({
      TableName: 'green-pages-ads',
      FilterExpression: "#state = :state AND active = :active",
      ExpressionAttributeNames: {
        "#state": "state"
      },
      ExpressionAttributeValues: {
        ":state": stateCode,
        ":active": true
      }
    })

    const response = await docClient.send(command)
    const inventory = response.Items || []

    console.log(`Found ${inventory.length} ads for ${stateCode}`)

    // Return empty array if no inventory (not an error)
    if (!inventory || inventory.length === 0) {
      return NextResponse.json([])
    }

    // Calculate available inventory for each item (total - active reservations)
    const formattedInventoryPromises = inventory.map(async (item: any) => {
      const itemId = `${stateCode}#${item.adType}`
      const availableInventory = await calculateAvailableInventory(
        itemId,
        item.inventory
      )

      return {
        id: item.adType || item.id,
        title: item.title,
        price: item.price,
        remaining: `${availableInventory}/${item.totalSlots} REMAINING`,
        inventory: availableInventory, // Show available, not total
        totalInventory: item.inventory, // Include total for reference
        total_slots: item.totalSlots,
        description: item.description
      }
    })

    const formattedInventory = await Promise.all(formattedInventoryPromises)

    return NextResponse.json(formattedInventory)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json([])
  }
}