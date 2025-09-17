import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

export async function POST(request: Request) {
  try {
    const { code, name } = await request.json()
    
    // Get current states from Edge Config
    const activeStates = await get('activeStates') || {}
    
    // Add the new state
    const updatedStates = {
      ...activeStates,
      [code]: true
    }
    
    // Update Edge Config via Vercel API
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
            value: updatedStates
          }]
        })
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Vercel API error:', error)
      throw new Error('Failed to update Edge Config')
    }
    
    // Also store the state metadata
    const statesList = await get('statesList') || []
    const updatedStatesList = [...statesList, { code, name }]
    
    await fetch(
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
            key: 'statesList',
            value: updatedStatesList
          }]
        })
      }
    )
    
    return NextResponse.json({
      success: true,
      state: { code, name, active: true }
    })
  } catch (error: any) {
    console.error('Error adding state:', error)
    return NextResponse.json(
      { error: 'Failed to add state' },
      { status: 500 }
    )
  }
}