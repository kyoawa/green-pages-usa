import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

const states = [
  { code: 'CA', name: 'California' },
  { code: 'MT', name: 'Montana' },
  { code: 'IL', name: 'Illinois' },
  { code: 'MO', name: 'Missouri' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'NY', name: 'New York' }
]

export async function GET() {
  try {
    const activeStates = await get('activeStates') || {}
    
    const statesWithStatus = states.map(state => ({
      ...state,
      active: activeStates[state.code] !== false // Default to true
    }))
    
    return NextResponse.json(statesWithStatus)
  } catch (error) {
    console.error('Error fetching states:', error)
    const defaultStates = states.map(state => ({ ...state, active: true }))
    return NextResponse.json(defaultStates)
  }
}

// This PUT endpoint is optional - your toggle route handles individual updates
export async function PUT(request) {
  return NextResponse.json({ 
    message: 'Use individual toggle endpoints' 
  }, { status: 501 })
}