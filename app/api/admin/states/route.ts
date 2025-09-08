import { NextResponse } from 'next/server'
import { SSMClient, GetParametersCommand, PutParameterCommand } from '@aws-sdk/client-ssm'

const client = new SSMClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

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
    const parameterNames = states.map(state => `/green-pages/states/${state.code}/active`)
    
    const command = new GetParametersCommand({
      Names: parameterNames
    })
    
    const response = await client.send(command)
    const parameters = response.Parameters || []
    
    const statesWithStatus = states.map(state => {
      const parameter = parameters.find(p => p.Name === `/green-pages/states/${state.code}/active`)
      return {
        ...state,
        active: parameter?.Value === 'true' : true
      }
    })
    
    return NextResponse.json(statesWithStatus)
  } catch (error) {
    console.error('Error fetching states:', error)
    
    // Return default active states if parameters don't exist yet
    const defaultStates = states.map(state => ({ ...state, active: true }))
    return NextResponse.json(defaultStates)
  }
}

export async function PUT(request: Request) {
  try {
    const statesData = await request.json()
    
    for (const state of statesData) {
      const command = new PutParameterCommand({
        Name: `/green-pages/states/${state.code}/active`,
        Value: state.active.toString(),
        Type: 'String',
        Overwrite: true
      })
      
      await client.send(command)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating states:', error)
    return NextResponse.json({ success: false, error: 'Failed to update states' }, { status: 500 })
  }
}