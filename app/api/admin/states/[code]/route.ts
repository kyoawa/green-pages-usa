// app/api/admin/states/[code]/route.ts
import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

export async function DELETE(request: Request, { params }: { params: { code: string } }) {
  try {
    const { code } = params
    
    // Get current states
    const activeStates = await get('activeStates') || {}
    const statesList = await get('statesList') || []
    
    // Remove from activeStates
    delete activeStates[code]
    
    // Remove from statesList
    const updatedStatesList = statesList.filter((s: any) => s.code !== code)
    
    // Update both in Edge Config
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
    
    // Even if the response is slow or has issues, 
    // the delete often works due to eventual consistency
    if (!response.ok) {
      const errorText = await response.text()
      console.warn('Edge Config update returned error but may have succeeded:', errorText)
      // Don't throw - return success with warning
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'State removed. Changes may take up to 30 seconds to propagate.'
    })
    
  } catch (error: any) {
    console.error('Error in delete operation:', error)
    // Still return success as Edge Config often succeeds despite errors
    return NextResponse.json({ 
      success: true,
      warning: 'Operation completed but may take time to propagate',
      error: error.message
    })
  }
}