export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'green-pages-uploads'

export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType, orderId, itemId, slotNumber, fieldName } = await request.json()

    if (!fileName || !contentType || !orderId || !itemId || !fieldName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sanitizedItemId = itemId.replace(/[^a-zA-Z0-9]/g, '_')
    const s3Key = `submissions/${orderId}/${sanitizedItemId}/slot-${slotNumber}/${fieldName}_${fileName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })

    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`

    return NextResponse.json({ presignedUrl, s3Key, fileUrl })
  } catch (error: any) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
