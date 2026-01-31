// app/api/admin/ads/[id]/route.ts
import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { auth } from '@clerk/nextjs/server'

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
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Decode URL-encoded ID (e.g., "CA%23single" -> "CA#single")
  const decodedId = decodeURIComponent(params.id)
  console.log('🔍 [API] GET /api/admin/ads/[id] called with id:', decodedId)
  try {
    const command = new GetCommand({
      TableName: 'green-pages-ads',
      Key: { id: decodedId }
    })

    console.log('📡 [API] Querying DynamoDB for ad:', decodedId)
    const response = await docClient.send(command)

    console.log('📦 [API] DynamoDB response:', response.Item ? 'Item found' : 'Item not found')

    if (!response.Item) {
      console.log('❌ [API] Ad not found, returning 404')
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    console.log('✅ [API] Returning ad data with uploadSchema:', response.Item.uploadSchema ? 'present' : 'missing')
    return NextResponse.json(response.Item)
  } catch (error) {
    console.error('💥 [API] Error fetching ad:', error)
    return NextResponse.json({ error: 'Failed to fetch ad' }, { status: 500 })
  }
}

// UPDATE ad
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Decode URL-encoded ID
  const decodedId = decodeURIComponent(params.id)

  try {
    const body = await request.json()
    const { title, price, inventory, totalSlots, description } = body

    const command = new UpdateCommand({
      TableName: 'green-pages-ads',
      Key: { id: decodedId },
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

// PATCH ad (for partial updates like uploadSchema)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Decode URL-encoded ID
  const decodedId = decodeURIComponent(params.id)

  try {
    const body = await request.json()

    // Build dynamic update expression
    const updateExpressions: string[] = []
    const expressionAttributeValues: Record<string, any> = {}

    if (body.uploadSchema !== undefined) {
      updateExpressions.push('uploadSchema = :uploadSchema')
      expressionAttributeValues[':uploadSchema'] = body.uploadSchema
    }

    if (updateExpressions.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Always update the updatedAt timestamp
    updateExpressions.push('updatedAt = :updatedAt')
    expressionAttributeValues[':updatedAt'] = new Date().toISOString()

    const command = new UpdateCommand({
      TableName: 'green-pages-ads',
      Key: { id: decodedId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
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
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Decode URL-encoded ID
  const decodedId = decodeURIComponent(params.id)

  try {
    const command = new DeleteCommand({
      TableName: 'green-pages-ads',
      Key: { id: decodedId }
    })

    await docClient.send(command)
    return NextResponse.json({ success: true, message: 'Ad deleted successfully' })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 })
  }
}