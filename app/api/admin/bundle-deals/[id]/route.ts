export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { auth } from '@clerk/nextjs/server'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = 'green-pages-bundle-deals'

// PUT update bundle deal
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, adType, minQuantity, discountPercent, active } = body

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: params.id },
      UpdateExpression: 'SET #name = :name, adType = :adType, minQuantity = :minQuantity, discountPercent = :discountPercent, active = :active, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':adType': adType,
        ':minQuantity': Number(minQuantity),
        ':discountPercent': Number(discountPercent),
        ':active': active,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    })

    const response = await docClient.send(command)
    return NextResponse.json(response.Attributes)
  } catch (error) {
    console.error('Error updating bundle deal:', error)
    return NextResponse.json({ error: 'Failed to update bundle deal' }, { status: 500 })
  }
}

// DELETE bundle deal
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id: params.id }
    })

    await docClient.send(command)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bundle deal:', error)
    return NextResponse.json({ error: 'Failed to delete bundle deal' }, { status: 500 })
  }
}
