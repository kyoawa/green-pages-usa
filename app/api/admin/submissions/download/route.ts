// app/api/admin/submissions/download/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'

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
    
    console.log('Download request:', { submissionId, fileType, BUCKET_NAME })
    
    if (!submissionId || !fileType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }
    
    // List objects in S3 to find the file
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `submissions/${submissionId}/${fileType}_`
    })
    
    console.log('Listing S3 objects with prefix:', `submissions/${submissionId}/${fileType}_`)
    
    const listResponse = await s3Client.send(listCommand)
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return NextResponse.json({ 
        error: 'File not found in S3', 
        searchingFor: `submissions/${submissionId}/${fileType}_`,
        bucket: BUCKET_NAME
      }, { status: 404 })
    }
    
    // Get the first matching file
    const s3Key = listResponse.Contents[0].Key!
    const fileName = s3Key.split('/').pop() || `${fileType}_download`
    
    console.log('Found S3 object:', s3Key)
    
    // Sanitize filename for download
    const sanitizedFileName = fileName
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
    
    // Get the file from S3
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    })
    
    console.log('Getting object from S3...')
    const s3Response = await s3Client.send(getCommand)
    
    // Convert the stream to a buffer
    const chunks: Uint8Array[] = []
    const stream = s3Response.Body as any
    
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    
    const buffer = Buffer.concat(chunks)
    
    // Get correct MIME type
    const mimeType = getMimeType(fileName)
    
    console.log('Success! Sending file:', {
      fileName: sanitizedFileName,
      mimeType,
      size: buffer.length
    })
    
    // Return the file directly
    return new NextResponse(buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${sanitizedFileName}"`,
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
      },
    })
    
  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ 
      error: 'Download failed',
      message: error.message || 'Unknown error',
      code: error.Code || 'UNKNOWN',
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION
    }, { status: 500 })
  }
}