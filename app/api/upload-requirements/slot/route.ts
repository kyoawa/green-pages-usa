import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { updateSlotSubmission } from '@/lib/orders'

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

    // Extract metadata fields
    const customerEmail = formData.get('customerEmail') as string
    const customerName = formData.get('customerName') as string
    const customerPhone = formData.get('customerPhone') as string
    const state = formData.get('state') as string
    const orderId = formData.get('orderId') as string
    const itemId = formData.get('itemId') as string
    const slotNumber = parseInt(formData.get('slotNumber') as string)
    const adType = formData.get('adType') as string
    const adTitle = formData.get('adTitle') as string

    // Extract all dynamic form fields (non-file, non-metadata)
    const dynamicFields: any = {}
    const files: { [key: string]: File | File[] } = {}

    const metadataKeys = ['customerEmail', 'customerName', 'customerPhone', 'state', 'orderId', 'itemId', 'slotNumber', 'adType', 'adTitle']

    for (const [key, value] of formData.entries()) {
      if (metadataKeys.includes(key)) continue

      // Check if it's a file
      if (value instanceof File && value.size > 0) {
        // Check if it's part of a multi-file upload
        if (key.endsWith('_count')) continue

        const match = key.match(/^(.+)_(\d+)$/)
        if (match) {
          // Multi-file upload: fieldName_0, fieldName_1, etc.
          const fieldName = match[1]
          if (!files[fieldName]) files[fieldName] = []
          ;(files[fieldName] as File[]).push(value)
        } else {
          // Single file upload
          files[key] = value
        }
      } else if (typeof value === 'string') {
        // Regular form field
        dynamicFields[key] = value
      }
    }

    // Create unique submission ID for this slot
    const sanitizedEmail = customerEmail.replace(/[^a-zA-Z0-9]/g, '_')
    const sanitizedItemId = itemId.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = Date.now()
    const submissionId = `${sanitizedEmail}_${sanitizedItemId}_slot${slotNumber}_${timestamp}`

    // Upload files to S3 with slot-specific path
    const s3Path = `submissions/${orderId}/${sanitizedItemId}/slot-${slotNumber}`
    const fileUrls: any = {}

    // Upload all files dynamically
    for (const [fieldName, fileData] of Object.entries(files)) {
      if (Array.isArray(fileData)) {
        // Multiple files for this field
        const urls: string[] = []
        for (let i = 0; i < fileData.length; i++) {
          const file = fileData[i]
          const buffer = Buffer.from(await file.arrayBuffer())
          const fileKey = `${s3Path}/${fieldName}_${i}_${file.name}`

          await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: file.type,
          }))

          urls.push(`https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`)
        }
        fileUrls[fieldName] = urls
      } else {
        // Single file
        const file = fileData
        const buffer = Buffer.from(await file.arrayBuffer())
        const fileKey = `${s3Path}/${fieldName}_${file.name}`

        await s3.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: file.type,
        }))

        fileUrls[fieldName] = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
      }
    }

    // Prepare submission data for DynamoDB
    const submissionData = {
      id: submissionId,
      orderId,
      itemId,
      slotNumber,
      adType,
      adTitle,
      customerEmail,
      customerName,
      customerPhone,
      state,
      submittedAt: new Date().toISOString(),
      status: 'pending', // Track submission status (pending, approved, published, etc.)
      fieldData: dynamicFields, // Store all dynamic form fields
      fileUrls, // Store all file URLs
    }

    // Save to DynamoDB submissions table
    await docClient.send(new PutCommand({
      TableName: SUBMISSIONS_TABLE,
      Item: submissionData
    }))

    // Update the order's slot tracking
    await updateSlotSubmission(orderId, itemId, slotNumber, submissionId)

    // Also upload the JSON data to S3 as backup
    const jsonKey = `${s3Path}/submission-data.json`
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: jsonKey,
      Body: JSON.stringify(submissionData, null, 2),
      ContentType: 'application/json',
    }))

    console.log('✅ Slot submission saved:', {
      orderId,
      itemId,
      slotNumber,
      submissionId
    })

    return NextResponse.json({
      success: true,
      submissionId,
      message: 'Slot upload successful'
    })

  } catch (error) {
    console.error('Slot upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
