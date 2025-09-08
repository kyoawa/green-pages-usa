import { NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import path from 'path'

const STATES_FILE = path.join(process.cwd(), 'data', 'states.json')

const defaultStates = [
  { code: 'CA', name: 'California', active: true },
  { code: 'MT', name: 'Montana', active: true },
  { code: 'IL', name: 'Illinois', active: true },
  { code: 'MO', name: 'Missouri', active: true },
  { code: 'OK', name: 'Oklahoma', active: true },
  { code: 'NY', name: 'New York', active: true }
]

async function ensureStatesFile() {
  try {
    await readFile(STATES_FILE, 'utf8')
  } catch (error) {
    const dataDir = path.dirname(STATES_FILE)
    await mkdir(dataDir, { recursive: true })
    await writeFile(STATES_FILE, JSON.stringify(defaultStates, null, 2))
  }
}

export async function GET() {
  try {
    await ensureStatesFile()
    const data = await readFile(STATES_FILE, 'utf8')
    const states = JSON.parse(data)
    return NextResponse.json(states)
  } catch (error) {
    return NextResponse.json(defaultStates)
  }
}

export async function PUT(request: Request) {
  try {
    const states = await request.json()
    await ensureStatesFile()
    await writeFile(STATES_FILE, JSON.stringify(states, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update states' }, { status: 500 })
  }
}