export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
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

// GET all discount codes
export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    })

    const response = await docClient.send(command)
    return NextResponse.json(response.Items || [])
  } catch (error) {
    console.error('Error fetching discount codes:', error)
    return NextResponse.json([])
  }
}

// POST new discount code
export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, description, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = body

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().trim()

    const newCode = {
      code: normalizedCode,
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
      currentUses: 0,
      expiresAt: expiresAt || undefined,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: newCode,
      ConditionExpression: 'attribute_not_exists(code)'
    })

    await docClient.send(command)
    return NextResponse.json(newCode)
  } catch (error: any) {
    console.error('Error creating discount code:', error)
    if (error.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'A discount code with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create discount code' }, { status: 500 })
  }
}
