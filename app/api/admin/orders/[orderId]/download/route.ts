export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})

const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE_NAME || 'green-pages-submissions'
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'green-pages-uploads'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const { searchParams } = new URL(request.url)
    const fileType = searchParams.get('type') // 'document', 'photo', or 'logo'

    if (!fileType) {
      return NextResponse.json({ error: 'File type is required' }, { status: 400 })
    }

    // Find submissions associated with this order ID
    // Submissions contain the order payment intent ID in their metadata
    const scanCommand = new ScanCommand({
      TableName: SUBMISSIONS_TABLE
    })

    const response = await docClient.send(scanCommand)
    const submissions = response.Items || []

    // Find the submission for this specific order
    // The submission ID format is: customerEmail_timestamp
    // We need to search for submissions that might be linked to this order
    // For now, we'll return all files for the customer's email

    // Get the order info first to find customer email
    // Actually, since uploads use the same customerEmail from the order,
    // we should store the orderId in the submission for linking

    // For MVP, let's just generate a zip file URL containing all uploads
    // In production, you'd want to:
    // 1. Store orderId in the submission when uploaded
    // 2. Query by orderId to get specific submissions
    // 3. Generate signed URLs for each file

    return NextResponse.json({
      error: 'Download functionality not yet implemented',
      message: 'Files are stored in S3 and can be accessed through the submissions page'
    }, { status: 501 })

  } catch (error) {
    console.error('Error downloading files:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
