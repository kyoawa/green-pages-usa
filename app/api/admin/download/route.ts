export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import path from 'path'

// Function to get MIME type based on file extension
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  
  const mimeTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.eps': 'application/postscript',
    '.ai': 'application/postscript',
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
    
    const uploadDir = path.join(process.cwd(), 'uploads', submissionId)
    const files = await readdir(uploadDir)
    
    // Find the file by type
    const fileName = files.find(f => f.startsWith(`${fileType}_`))
    
    if (!fileName) {
      return NextResponse.json({ 
        error: 'File not found', 
        availableFiles: files,
        searchingFor: `${fileType}_`
      }, { status: 404 })
    }
    
    const filePath = path.join(uploadDir, fileName)
    const fileBuffer = await readFile(filePath)
    
    // Sanitize filename for download
    const sanitizedFileName = fileName
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
    
    // Get correct MIME type
    const mimeType = getMimeType(fileName)
    
    console.log('Original filename:', fileName)
    console.log('Sanitized filename:', sanitizedFileName)
    console.log('MIME type:', mimeType)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${sanitizedFileName}"`,
        'Content-Type': mimeType, // Set correct MIME type instead of generic octet-stream
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}