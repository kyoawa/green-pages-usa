import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

export async function DELETE(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    
    // Get current states
    const activeStates = await get('activeStates') || {}
    const statesList = await get('statesList') || []
    
    // Remove the state
    delete activeStates[code]
    const updatedStatesList = statesList.filter((s: any) => s.code !== code)
    
    // Update Edge Config
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'update',
              key: 'activeStates',
              value: activeStates
            },
            {
              operation: 'update',
              key: 'statesList',
              value: updatedStatesList
            }
          ]
        })
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to update Edge Config')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting state:', error)
    return NextResponse.json(
      { error: 'Failed to delete state' },
      { status: 500 }
    )
  }
}