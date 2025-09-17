import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

// GET all ads
export async function GET() {
  try {
    const command = new ScanCommand({
      TableName: 'green-pages-ads'
    })
    
    const response = await docClient.send(command)
    return NextResponse.json(response.Items || [])
  } catch (error) {
    console.error('Error fetching ads:', error)
    // Return empty array if table doesn't exist yet
    return NextResponse.json([])
  }
}

// POST new ad
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { state, adType, title, price, inventory, totalSlots, description } = body
    
    const newAd = {
      id: uuidv4(),
      state,
      adType,
      title,
      price,
      inventory,
      totalSlots,
      description,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const command = new PutCommand({
      TableName: 'green-pages-ads',
      Item: newAd
    })
    
    await docClient.send(command)
    return NextResponse.json(newAd)
  } catch (error) {
    console.error('Error creating ad:', error)
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 })
  }
}

// PUT update ad
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, title, price, inventory, totalSlots, description } = body
    
    const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb')
    
    const command = new UpdateCommand({
      TableName: 'green-pages-ads',
      Key: { id },
      UpdateExpression: 'SET title = :title, price = :price, inventory = :inventory, totalSlots = :totalSlots, description = :description, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':title': title,
        ':price': price,
        ':inventory': inventory,
        ':totalSlots': totalSlots,
        ':description': description,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    })
    
    const response = await docClient.send(command)
    return NextResponse.json(response.Attributes)
  } catch (error) {
    console.error('Error updating ad:', error)
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 })
  }
}

// DELETE ad
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Ad ID required' }, { status: 400 })
    }
    
    const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb')
    
    const command = new DeleteCommand({
      TableName: 'green-pages-ads',
      Key: { id }
    })
    
    await docClient.send(command)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 })
  }
}