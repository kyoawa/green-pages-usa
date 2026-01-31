// scripts/create-discount-tables.js
// Run with: node scripts/create-discount-tables.js

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb')

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

async function tableExists(tableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }))
    return true
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false
    }
    throw error
  }
}

async function createBundleDealsTable() {
  const tableName = 'green-pages-bundle-deals'

  if (await tableExists(tableName)) {
    console.log(`Table ${tableName} already exists`)
    return
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  })

  try {
    await client.send(command)
    console.log(`Created table: ${tableName}`)
  } catch (error) {
    console.error(`Error creating ${tableName}:`, error)
  }
}

async function createDiscountCodesTable() {
  const tableName = 'green-pages-discount-codes'

  if (await tableExists(tableName)) {
    console.log(`Table ${tableName} already exists`)
    return
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'code', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'code', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  })

  try {
    await client.send(command)
    console.log(`Created table: ${tableName}`)
  } catch (error) {
    console.error(`Error creating ${tableName}:`, error)
  }
}

async function main() {
  console.log('Creating discount tables...')
  await createBundleDealsTable()
  await createDiscountCodesTable()
  console.log('Done!')
}

main().catch(console.error)
