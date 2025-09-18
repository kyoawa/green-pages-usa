// app/api/admin/ads/[id]/route.ts
import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

// GET single ad
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const command = new GetCommand({
      TableName: 'green-pages-ads',
      Key: { id: params.id }
    })
    
    const response = await docClient.send(command)
    
    if (!response.Item) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }
    
    return NextResponse.json(response.Item)
  } catch (error) {
    console.error('Error fetching ad:', error)
    return NextResponse.json({ error: 'Failed to fetch ad' }, { status: 500 })
  }
}

// UPDATE ad
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, price, inventory, totalSlots, description } = body
    
    const command = new UpdateCommand({
      TableName: 'green-pages-ads',
      Key: { id: params.id },
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
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const command = new DeleteCommand({
      TableName: 'green-pages-ads',
      Key: { id: params.id }
    })
    
    await docClient.send(command)
    return NextResponse.json({ success: true, message: 'Ad deleted successfully' })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 })
  }
}