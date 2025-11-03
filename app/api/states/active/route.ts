export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

export async function GET() {
  try {
    // Get your activeStates from Edge Config (exactly what you have in the screenshot)
    const activeStates = await get('activeStates') || {}
    
    // Convert to array format for your frontend
    const statesList = []
    
    const stateNames: Record<string, string> = {
      'CA': 'California',
      'IL': 'Illinois',
      'MO': 'Missouri',
      'MT': 'Montana',
      'NY': 'New York',
      'OK': 'Oklahoma',
      'AL': 'Alabama',
      'HI': 'Hawaii',
      'GA': 'Georgia',
      'MA': 'Massachusetts',
      'CT': 'Connecticut',
      'LA': 'Louisiana',
      'FL': 'Florida'
    }
    
    // Build array of active states only
    for (const [code, isActive] of Object.entries(activeStates)) {
      if (isActive === true) {
        statesList.push({
          code: code,
          name: stateNames[code] || code
        })
      }
    }
    
    return NextResponse.json(statesList)
    
  } catch (error) {
    console.error('Error fetching active states from Edge Config:', error)
    
    // Fallback if Edge Config fails
    return NextResponse.json([
      { code: 'CA', name: 'California' },
      { code: 'MT', name: 'Montana' },
      { code: 'AL', name: 'Alabama' },
      { code: 'HI', name: 'Hawaii' },
      { code: 'GA', name: 'Georgia' }
    ])
  }
}