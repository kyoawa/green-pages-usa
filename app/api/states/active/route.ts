import { NextResponse } from 'next/server'
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm'

const client = new SSMClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const allStates = ['CA', 'MT', 'IL', 'MO', 'OK', 'NY']

export async function GET() {
  try {
    const parameterNames = allStates.map(state => `/green-pages/states/${state}/active`)
    
    const command = new GetParametersCommand({
      Names: parameterNames
    })
    
    const response = await client.send(command)
    const parameters = response.Parameters || []
    
    const activeStates = allStates.filter(state => {
      const parameter = parameters.find(p => p.Name === `/green-pages/states/${state}/active`)
      // Default to true if parameter doesn't exist
      return parameter?.Value === 'true' : true
    })
    
    return NextResponse.json(activeStates)
  } catch (error) {
    console.error('Error fetching active states:', error)
    // Return all states as active if there's an error
    return NextResponse.json(allStates)
  }
}