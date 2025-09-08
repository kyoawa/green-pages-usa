import { NextResponse } from 'next/server'
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm'

const client = new SSMClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const stateNames: { [key: string]: string } = {
  'CA': 'California',
  'MT': 'Montana', 
  'IL': 'Illinois',
  'MO': 'Missouri',
  'OK': 'Oklahoma',
  'NY': 'New York'
}

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    const { code } = params
    
    if (!stateNames[code]) {
      return NextResponse.json({ success: false, error: 'Invalid state code' }, { status: 400 })
    }
    
    const parameterName = `/green-pages/states/${code}/active`
    
    // Get current value
    let currentValue = true // default to true if parameter doesn't exist
    
    try {
      const getCommand = new GetParameterCommand({ Name: parameterName })
      const response = await client.send(getCommand)
      currentValue = response.Parameter?.Value === 'true'
    } catch (error) {
      // Parameter doesn't exist yet, will create it with opposite of default
      console.log(`Parameter ${parameterName} doesn't exist, creating it`)
    }
    
    // Toggle the value
    const newValue = !currentValue
    
    const putCommand = new PutParameterCommand({
      Name: parameterName,
      Value: newValue.toString(),
      Type: 'String',
      Overwrite: true,
      Description: `Active status for ${stateNames[code]} state`
    })
    
    await client.send(putCommand)
    
    return NextResponse.json({
      success: true,
      state: {
        code,
        name: stateNames[code],
        active: newValue
      }
    })
  } catch (error) {
    console.error('Error toggling state:', error)
    return NextResponse.json({ success: false, error: 'Failed to toggle state' }, { status: 500 })
  }
}