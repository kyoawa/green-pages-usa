export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const ORDERS_TABLE = process.env.ORDERS_TABLE_NAME || 'green-pages-orders'

export async function GET() {
  try {
    const command = new ScanCommand({
      TableName: ORDERS_TABLE
    })

    const response = await docClient.send(command)
    const orders = response.Items || []

    // Sort by creation date (newest first)
    orders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('Error fetching orders from DynamoDB:', error)
    return NextResponse.json({ success: false, orders: [], error: 'Failed to fetch orders' }, { status: 500 })
  }
}
