import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"

// Initialize S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})

// Initialize DynamoDB
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'green-pages-uploads'
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE_NAME || 'green-pages-submissions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract customer info and form data
    const customerEmail = formData.get('customerEmail') as string
    const customerName = formData.get('customerName') as string
    const customerPhone = formData.get('customerPhone') as string
    const brandName = formData.get('brandName') as string
    const dispensaryAddress = formData.get('dispensaryAddress') as string
    const webAddress = formData.get('webAddress') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const instagram = formData.get('instagram') as string
    const state = formData.get('state') as string
    const selectedAd = formData.get('selectedAd') as string
    
    // Extract files
    const documentFile = formData.get('documentFile') as File | null
    const photoFile = formData.get('photoFile') as File | null
    const logoFile = formData.get('logoFile') as File | null
    
    // Create unique submission ID
    const sanitizedEmail = customerEmail.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = Date.now()
    const submissionId = `${sanitizedEmail}_${timestamp}`
    
    // Prepare file URLs object
    const fileUrls: any = {}
    
    // Upload files to S3
    if (documentFile && documentFile.size > 0) {
      const documentBuffer = Buffer.from(await documentFile.arrayBuffer())
      const documentKey = `submissions/${submissionId}/document_${documentFile.name}`
      
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: documentKey,
        Body: documentBuffer,
        ContentType: documentFile.type,
      }))
      
      fileUrls.documentUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${documentKey}`
    }
    
    if (photoFile && photoFile.size > 0) {
      const photoBuffer = Buffer.from(await photoFile.arrayBuffer())
      const photoKey = `submissions/${submissionId}/photo_${photoFile.name}`
      
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: photoKey,
        Body: photoBuffer,
        ContentType: photoFile.type,
      }))
      
      fileUrls.photoUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${photoKey}`
    }
    
    if (logoFile && logoFile.size > 0) {
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer())
      const logoKey = `submissions/${submissionId}/logo_${logoFile.name}`
      
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: logoKey,
        Body: logoBuffer,
        ContentType: logoFile.type,
      }))
      
      fileUrls.logoUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${logoKey}`
    }
    
    // Prepare submission data for DynamoDB
    const submissionData = {
      id: submissionId,
      customerEmail,
      customerName,
      customerPhone,
      brandName,
      dispensaryAddress,
      webAddress,
      phoneNumber,
      instagram,
      state,
      submittedAt: new Date().toISOString(),
      selectedAd: selectedAd ? JSON.parse(selectedAd) : null,
      ...fileUrls,
      status: 'pending' // Track submission status
    }
    
    // Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: SUBMISSIONS_TABLE,
      Item: submissionData
    }))
    
    // Also upload the JSON data to S3 as backup
    const jsonKey = `submissions/${submissionId}/customer-data.json`
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: jsonKey,
      Body: JSON.stringify(submissionData, null, 2),
      ContentType: 'application/json',
    }))
    
    console.log('✅ Submission saved to S3 and DynamoDB:', submissionId, submissionData)
    
    return NextResponse.json({ 
      success: true, 
      submissionId,
      message: 'Upload successful'
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}