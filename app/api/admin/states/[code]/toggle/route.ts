import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

const stateNames = {
  'CA': 'California',
  'MT': 'Montana', 
  'IL': 'Illinois',
  'MO': 'Missouri',
  'OK': 'Oklahoma',
  'NY': 'New York'
}

export async function POST(request, { params }) {
  try {
    const { code } = params
    
    if (!stateNames[code]) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid state code' 
      }, { status: 400 })
    }
    
    // Get current states
    const activeStates = await get('activeStates') || {}
    const currentValue = activeStates[code] !== false
    const newValue = !currentValue
    
    // Update Edge Config
    const updateStates = {
      ...activeStates,
      [code]: newValue
    }
    
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            operation: 'update',
            key: 'activeStates',
            value: updateStates
          }]
        })
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Vercel API error:', error)
      throw new Error('Failed to update Edge Config')
    }
    
    return NextResponse.json({
      success: true,
      state: {
        code,
        name: stateNames[code],
        active: newValue
      }
    })
  } catch (error) {
    console.error('Error toggling state:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to toggle state' 
    }, { status: 500 })
  }
}