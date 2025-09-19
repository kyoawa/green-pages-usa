import { NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

export async function POST(request) {
  let payload = {}
  
  console.log('=== UPDATE INVENTORY START ===')
  
  try {
    payload = await request.json()
    console.log('Received payload:', payload)
  } catch {
    console.error('Invalid JSON body')
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const { state, adType } = payload || {}
  let { decreaseBy = 1 } = payload || {}

  console.log('Processing:', { state, adType, decreaseBy })

  // basic validation
  if (!state || !adType) {
    console.error('Missing required fields:', { state, adType })
    return NextResponse.json(
      { success: false, message: "Missing required fields: state and adType" },
      { status: 400 }
    )
  }

  decreaseBy = Number.isFinite(Number(decreaseBy)) ? Math.max(1, Math.floor(Number(decreaseBy))) : 1

  try {
    console.log('Searching for ad in green-pages-ads table...')
    
    // Find the ad by state and adType in the same table as admin
    const scanCommand = new ScanCommand({
      TableName: 'green-pages-ads',
      FilterExpression: "#state = :state AND adType = :adType AND active = :active",
      ExpressionAttributeNames: { 
        "#state": "state" 
      },
      ExpressionAttributeValues: { 
        ":state": state,
        ":adType": adType,
        ":active": true
      }
    })
    
    const scanResponse = await docClient.send(scanCommand)
    const items = scanResponse.Items || []
    
    console.log(`Found ${items.length} matching ads for ${state} ${adType}`)
    
    if (items.length === 0) {
      console.error('No matching ad found for:', { state, adType })
      return NextResponse.json(
        { success: false, message: `No active ad found for ${state} ${adType}` },
        { status: 404 }
      )
    }
    
    const adItem = items[0] // Take the first match
    console.log('Found ad:', { id: adItem.id, inventory: adItem.inventory })
    
    if (adItem.inventory < decreaseBy) {
      console.error('Not enough inventory:', { available: adItem.inventory, requested: decreaseBy })
      return NextResponse.json(
        { success: false, message: "Not enough inventory available" },
        { status: 400 }
      )
    }
    
    // Update the inventory using the ad's UUID
    const updateCommand = new UpdateCommand({
      TableName: 'green-pages-ads',
      Key: { id: adItem.id },
      UpdateExpression: "SET inventory = inventory - :decrease, updatedAt = :now",
      ConditionExpression: "attribute_exists(inventory) AND inventory >= :decrease",
      ExpressionAttributeValues: {
        ":decrease": decreaseBy,
        ":now": new Date().toISOString()
      },
      ReturnValues: "ALL_NEW"
    })
    
    console.log('Updating inventory for ad ID:', adItem.id)
    const updateResponse = await docClient.send(updateCommand)
    const updatedItem = updateResponse.Attributes
    
    console.log('Successfully updated inventory:', {
      id: updatedItem.id,
      newInventory: updatedItem.inventory
    })

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully",
      newInventory: updatedItem.inventory,
      item: {
        id: updatedItem.id,
        state: updatedItem.state,
        adType: updatedItem.adType,
        inventory: updatedItem.inventory
      }
    })
    
  } catch (error) {
    console.error('Error updating inventory:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    // Handle conditional check failure (race condition where inventory was bought by someone else)
    if (error.name === "ConditionalCheckFailedException") {
      return NextResponse.json(
        { success: false, message: "Not enough inventory available" },
        { status: 400 }
      )
    }

    console.error("Unhandled error updating inventory:", error)
    return NextResponse.json(
      { success: false, message: `Error updating inventory: ${error.message}` },
      { status: 500 }
    )
  }
}