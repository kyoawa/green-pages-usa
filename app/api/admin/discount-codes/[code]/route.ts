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
const TABLE_NAME = 'green-pages-discount-codes'

// PUT update discount code
export async function PUT(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const codeKey = decodeURIComponent(params.code).toUpperCase()

  try {
    const body = await request.json()
    const { description, discountType, discountValue, minOrderAmount, maxUses, expiresAt, active } = body

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { code: codeKey },
      UpdateExpression: 'SET description = :description, discountType = :discountType, discountValue = :discountValue, minOrderAmount = :minOrderAmount, maxUses = :maxUses, expiresAt = :expiresAt, active = :active, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':description': description || '',
        ':discountType': discountType,
        ':discountValue': Number(discountValue),
        ':minOrderAmount': minOrderAmount ? Number(minOrderAmount) : null,
        ':maxUses': maxUses ? Number(maxUses) : null,
        ':expiresAt': expiresAt || null,
        ':active': active,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    })

    const response = await docClient.send(command)
    return NextResponse.json(response.Attributes)
  } catch (error) {
    console.error('Error updating discount code:', error)
    return NextResponse.json({ error: 'Failed to update discount code' }, { status: 500 })
  }
}

// DELETE discount code
export async function DELETE(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const codeKey = decodeURIComponent(params.code).toUpperCase()

  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { code: codeKey }
    })

    await docClient.send(command)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting discount code:', error)
    return NextResponse.json({ error: 'Failed to delete discount code' }, { status: 500 })
  }
}
