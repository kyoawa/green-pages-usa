import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const STATES_FILE = path.join(process.cwd(), 'data', 'states.json')

export async function GET() {
  try {
    const data = await readFile(STATES_FILE, 'utf8')
    const states = JSON.parse(data)
    const activeStates = states.filter(state => state.active).map(state => state.code)
    return NextResponse.json(activeStates)
  } catch (error) {
    return NextResponse.json(['CA', 'MT', 'IL', 'MO', 'OK', 'NY'])
  }
}