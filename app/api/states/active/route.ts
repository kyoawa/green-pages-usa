import { get } from '@vercel/edge-config'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const activeStates = await get('activeStates')
    
    const statesArray = Object.entries(activeStates || {})
      .filter(([_, isActive]) => isActive)
      .map(([state]) => state)
    
    return NextResponse.json({ 
      states: statesArray,
      statesObject: activeStates 
    })
  } catch (error) {
    console.error('Error fetching states:', error)
    return NextResponse.json({ 
      states: ['CA', 'IL', 'MO', 'MT', 'NY', 'OK'],
      statesObject: {
        CA: true, IL: true, MO: true, 
        MT: true, NY: true, OK: true
      }
    })
  }
}