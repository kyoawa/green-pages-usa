import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import path from 'path'

// Helper function to detect state from address
function getStateFromAddress(address: string): string {
  if (!address) return 'Unknown'
  
  const addressUpper = address.toUpperCase()
  
  // Look for state abbreviations or full names
  if (addressUpper.includes(', CA') || addressUpper.includes('CALIFORNIA')) return 'CA'
  if (addressUpper.includes(', MT') || addressUpper.includes('MONTANA')) return 'MT'
  if (addressUpper.includes(', IL') || addressUpper.includes('ILLINOIS')) return 'IL'
  if (addressUpper.includes(', MO') || addressUpper.includes('MISSOURI')) return 'MO'
  if (addressUpper.includes(', OK') || addressUpper.includes('OKLAHOMA')) return 'OK'
  if (addressUpper.includes(', NY') || addressUpper.includes('NEW YORK')) return 'NY'
  
  return 'Unknown'
}

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const submissions = []

    try {
      const customerDirs = await readdir(uploadsDir)
      
      for (const customerDir of customerDirs) {
        const customerPath = path.join(uploadsDir, customerDir)
        const dataPath = path.join(customerPath, 'customer-data.json')
        
        try {
          const data = await readFile(dataPath, 'utf8')
          const submissionData = JSON.parse(data)
          
          // Check for uploaded files
          const files = await readdir(customerPath)
          const hasFiles = {
            document: files.some(f => f.startsWith('document_')),
            photo: files.some(f => f.startsWith('photo_')),
            logo: files.some(f => f.startsWith('logo_'))
          }
          
          // Determine state from the submission data
          let state = 'Unknown'
          
          // First, check if state is already stored in the data
          if (submissionData.state) {
            state = submissionData.state
          } 
          // If not, try to detect from dispensary address
          else if (submissionData.dispensaryAddress) {
            state = getStateFromAddress(submissionData.dispensaryAddress)
          }
          
          submissions.push({
            id: customerDir,
            ...submissionData,
            state, // Add the state field
            hasFiles
          })
        } catch (error) {
          console.log(`Could not read data for ${customerDir}:`, error)
        }
      }
    } catch (error) {
      console.log('Uploads directory does not exist yet')
    }

    // Sort by submission date (newest first)
    submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    
    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}