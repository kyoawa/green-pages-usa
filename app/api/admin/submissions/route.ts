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

export async function GET() {
  try {
    // Scan the submissions table to get all submissions
    const command = new ScanCommand({
      TableName: 'green-pages-submissions'
    })
    
    const response = await docClient.send(command)
    const submissions = response.Items || []
    
    // Format submissions for the frontend
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      customerEmail: submission.customerEmail,
      customerName: submission.customerName,
      customerPhone: submission.customerPhone,
      brandName: submission.brandName,
      dispensaryAddress: submission.dispensaryAddress,
      webAddress: submission.webAddress,
      phoneNumber: submission.phoneNumber,
      instagram: submission.instagram,
      state: submission.state || 'Unknown',
      submittedAt: submission.submittedAt,
      selectedAd: submission.selectedAd,
      hasFiles: {
        document: !!submission.documentUrl,
        photo: !!submission.photoUrl,
        logo: !!submission.logoUrl
      },
      // Include the S3 URLs for downloads
      documentUrl: submission.documentUrl,
      photoUrl: submission.photoUrl,
      logoUrl: submission.logoUrl
    }))
    
    // Sort by submission date (newest first)
    formattedSubmissions.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )
    
    return NextResponse.json(formattedSubmissions)
  } catch (error) {
    console.error('Error fetching submissions from DynamoDB:', error)
    
    // Return empty array if table doesn't exist or other errors
    return NextResponse.json([])
  }
}