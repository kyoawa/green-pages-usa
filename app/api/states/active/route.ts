export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { InventoryDB } from '@/lib/dynamodb'

// GET: Fetch active states for public display
export async function GET() {
  const db = new InventoryDB()
  
  try {
    const activeStates = await db.getActiveStates()
    return NextResponse.json(activeStates)
  } catch (error) {
    console.error('Error fetching active states:', error)
    
    // Fallback to default states if database fails
    const fallbackStates = [
      { code: 'CA', name: 'California' },
      { code: 'IL', name: 'Illinois' },
      { code: 'MO', name: 'Missouri' },
      { code: 'MT', name: 'Montana' },
      { code: 'NY', name: 'New York' },
      { code: 'OK', name: 'Oklahoma' }
    ]
    
    return NextResponse.json(fallbackStates)
  }
}