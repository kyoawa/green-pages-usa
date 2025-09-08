import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm'

const client = new SSMClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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

async function initParameters() {
  for (const state of states) {
    try {
      const command = new PutParameterCommand({
        Name: `/green-pages/states/${state.code}/active`,
        Value: 'true',
        Type: 'String',
        Description: `Active status for ${state.name} state`,
        Overwrite: false // Don't overwrite if it already exists
      })
      
      await client.send(command)
      console.log(`✓ Initialized parameter for ${state.name}`)
    } catch (error) {
      if (error.name === 'ParameterAlreadyExists') {
        console.log(`- Parameter for ${state.name} already exists`)
      } else {
        console.error(`✗ Error initializing ${state.name}:`, error)
      }
    }
  }
}

initParameters()