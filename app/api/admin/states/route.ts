export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

const defaultStateNames: Record<string, string> = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming'
}

export async function GET() {
  try {
    // Get active states status
    const activeStates = await get('activeStates') || {}
    
    // Get states list (with names)
    const statesList = await get('statesList') || []
    
    // Combine the data
    const statesMap = new Map()
    
    // Add states from statesList first (these have been explicitly added)
    statesList.forEach((state: any) => {
      statesMap.set(state.code, {
        code: state.code,
        name: state.name || defaultStateNames[state.code],
        active: activeStates[state.code] !== false
      })
    })
    
    // Add any states that are in activeStates but not in statesList
    Object.keys(activeStates).forEach(code => {
      if (!statesMap.has(code)) {
        statesMap.set(code, {
          code,
          name: defaultStateNames[code] || code,
          active: activeStates[code]
        })
      }
    })
    
    // If no states exist, return defaults
    if (statesMap.size === 0) {
      const defaultStates = ['CA', 'MT', 'IL', 'MO', 'OK', 'NY']
      defaultStates.forEach(code => {
        statesMap.set(code, {
          code,
          name: defaultStateNames[code],
          active: true
        })
      })
    }
    
    const states = Array.from(statesMap.values())
    states.sort((a, b) => a.name.localeCompare(b.name))
    
    return NextResponse.json(states)
  } catch (error) {
    console.error('Error fetching states:', error)
    const defaultStates = ['CA', 'MT', 'IL', 'MO', 'OK', 'NY'].map(code => ({
      code,
      name: defaultStateNames[code],
      active: true
    }))
    return NextResponse.json(defaultStates)
  }
}