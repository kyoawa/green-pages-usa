export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { auth } from '@clerk/nextjs/server'
import { v4 as uuidv4 } from 'uuid'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = 'green-pages-bundle-deals'

// GET all bundle deals
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
    console.error('Error fetching bundle deals:', error)
    return NextResponse.json([])
  }
}

// POST new bundle deal
export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, adType, minQuantity, discountPercent } = body

    if (!name || !adType || !minQuantity || !discountPercent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newDeal = {
      id: uuidv4(),
      name,
      adType,
      minQuantity: Number(minQuantity),
      discountPercent: Number(discountPercent),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: newDeal
    })

    await docClient.send(command)
    return NextResponse.json(newDeal)
  } catch (error) {
    console.error('Error creating bundle deal:', error)
    return NextResponse.json({ error: 'Failed to create bundle deal' }, { status: 500 })
  }
}
