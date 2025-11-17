import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})
const docClient = DynamoDBDocumentClient.from(client)

const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE_NAME || 'green-pages-submissions'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const { userId } = await auth()
    // if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')

    const command = new ScanCommand({
      TableName: SUBMISSIONS_TABLE
    })

    const response = await docClient.send(command)
    let submissions = response.Items || []

    // Filter by orderId if provided
    if (orderId) {
      submissions = submissions.filter((sub: any) => sub.orderId === orderId)
    }

    return NextResponse.json({
      submissions,
      count: submissions.length
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
