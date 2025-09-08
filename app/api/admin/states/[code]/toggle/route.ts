import { NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const STATES_FILE = path.join(process.cwd(), 'data', 'states.json')

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    const { code } = params
    
    const data = await readFile(STATES_FILE, 'utf8')
    const states = JSON.parse(data)
    
    const stateIndex = states.findIndex(state => state.code === code)
    if (stateIndex === -1) {
      return NextResponse.json({ success: false, error: 'State not found' }, { status: 404 })
    }
    
    states[stateIndex].active = !states[stateIndex].active
    
    await writeFile(STATES_FILE, JSON.stringify(states, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      state: states[stateIndex] 
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to toggle state' }, { status: 500 })
  }
}