import { NextResponse } from 'next/server'
import { InventoryDB } from '@/lib/dynamodb'

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to initialize data',
    instructions: 'Send a POST request to this endpoint to set up sample inventory data'
  })
}

export async function POST() {
  const db = new InventoryDB()

  try {
    await db.initializeSampleData()
    return NextResponse.json({ message: 'Sample data initialized successfully' })
  } catch (error) {
    console.error('Error initializing data:', error)
    return NextResponse.json({ message: 'Error initializing data', error: error.message }, { status: 500 })
  }
}