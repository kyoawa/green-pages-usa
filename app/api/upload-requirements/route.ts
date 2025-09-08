import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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
    const state = formData.get('state') as string // Add this line
    const selectedAd = formData.get('selectedAd') as string // This will be JSON
    
    // Extract files
    const documentFile = formData.get('documentFile') as File | null
    const photoFile = formData.get('photoFile') as File | null
    const logoFile = formData.get('logoFile') as File | null
    
    // Create unique directory
    const sanitizedEmail = customerEmail.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = Date.now()
    const submissionId = `${sanitizedEmail}_${timestamp}`
    const uploadDir = path.join(process.cwd(), 'uploads', submissionId)
    
    await mkdir(uploadDir, { recursive: true })
    
    // Save text data as JSON
    const submissionData = {
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
      selectedAd: selectedAd ? JSON.parse(selectedAd) : null
    }
    
    const dataPath = path.join(uploadDir, 'customer-data.json')
    await writeFile(dataPath, JSON.stringify(submissionData, null, 2))
    
    // Save files
    if (documentFile) {
      const documentPath = path.join(uploadDir, `document_${documentFile.name}`)
      await writeFile(documentPath, Buffer.from(await documentFile.arrayBuffer()))
    }
    
    if (photoFile) {
      const photoPath = path.join(uploadDir, `photo_${photoFile.name}`)
      await writeFile(photoPath, Buffer.from(await photoFile.arrayBuffer()))
    }
    
    if (logoFile) {
      const logoPath = path.join(uploadDir, `logo_${logoFile.name}`)
      await writeFile(logoPath, Buffer.from(await logoFile.arrayBuffer()))
    }
    
    console.log('✅ Submission saved:', submissionId, submissionData)
    
    return NextResponse.json({ 
      success: true, 
      submissionId 
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}