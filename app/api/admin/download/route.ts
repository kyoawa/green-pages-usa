// app/api/admin/submissions/download/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'green-pages-uploads'

// Function to get MIME type based on file extension
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || ''
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'eps': 'application/postscript',
    'ai': 'application/postscript',
  }
  
  return mimeTypes[ext] || 'application/octet-stream'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('id')
    const fileType = searchParams.get('type')
    
    if (!submissionId || !fileType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }
    
    // List objects in S3 to find the file (since original filename is appended)
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `submissions/${submissionId}/${fileType}_`
    })
    
    const listResponse = await s3Client.send(listCommand)
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return NextResponse.json({ 
        error: 'File not found in S3', 
        searchingFor: `submissions/${submissionId}/${fileType}_`
      }, { status: 404 })
    }
    
    // Get the first matching file
    const s3Key = listResponse.Contents[0].Key!
    const fileName = s3Key.split('/').pop() || `${fileType}_download`
    
    // Sanitize filename for download
    const sanitizedFileName = fileName
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
    
    // Get correct MIME type
    const mimeType = getMimeType(fileName)
    
    console.log('S3 Key:', s3Key)
    console.log('Original filename:', fileName)
    console.log('Sanitized filename:', sanitizedFileName)
    console.log('MIME type:', mimeType)
    
    // Generate a signed URL for download
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${sanitizedFileName}"`,
      ResponseContentType: mimeType
    })
    
    // Create a signed URL that expires in 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600
    })
    
    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl)
    
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ 
      error: 'Download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}