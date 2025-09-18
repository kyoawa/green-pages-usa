// app/api/admin/ads/[id]/toggle/route.ts
import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { active } = body
    
    const command = new UpdateCommand({
      TableName: 'green-pages-ads',
      Key: { id },
      UpdateExpression: 'SET active = :active, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':active': active,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    })
    
    const response = await docClient.send(command)
    return NextResponse.json(response.Attributes)
  } catch (error) {
    console.error('Error toggling ad:', error)
    return NextResponse.json({ error: 'Failed to toggle ad' }, { status: 500 })
  }
}