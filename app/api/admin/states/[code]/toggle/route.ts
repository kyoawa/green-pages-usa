// app/api/admin/states/[code]/toggle/route.ts
import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    const { code } = params
    
    // Don't validate state code - accept any state
    // This allows newly added states to work
    
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
    
    // Also get the state name from statesList if available
    const statesList = await get('statesList') || []
    const stateInfo = statesList.find((s: any) => s.code === code)
    
    return NextResponse.json({
      success: true,
      state: {
        code,
        name: stateInfo?.name || code,
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