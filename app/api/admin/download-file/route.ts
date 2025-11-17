import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'green-pages-uploads'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')

    console.log('📥 Download request received')
    console.log('File URL:', fileUrl)

    if (!fileUrl) {
      console.error('❌ No file URL provided')
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 })
    }

    // Extract the S3 key from the URL
    // URL format: https://green-pages-uploads.s3.us-west-2.amazonaws.com/submissions/...
    const urlParts = fileUrl.split('.amazonaws.com/')
    console.log('URL parts:', urlParts)

    if (urlParts.length < 2) {
      console.error('❌ Invalid S3 URL format')
      return NextResponse.json({ error: 'Invalid S3 URL' }, { status: 400 })
    }

    const s3Key = decodeURIComponent(urlParts[1])

    console.log('✅ Generating signed URL for S3 key:', s3Key)
    console.log('Bucket:', BUCKET_NAME)
    console.log('Region:', process.env.AWS_REGION)

    // Generate a signed URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl)

  } catch (error: any) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json({
      error: 'Failed to generate download URL',
      message: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
