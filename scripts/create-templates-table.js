const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb")

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

async function createTemplatesTable() {
  const command = new CreateTableCommand({
    TableName: "green-pages-schema-templates",
    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "id",
        KeyType: "HASH",
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  })

  try {
    const response = await client.send(command)
    console.log("✅ Schema templates table created successfully!")
    console.log("Table ARN:", response.TableDescription.TableArn)
    console.log("Table Status:", response.TableDescription.TableStatus)
  } catch (error) {
    if (error.name === "ResourceInUseException") {
      console.log("✅ Table already exists!")
    } else {
      console.error("❌ Error creating table:", error)
      throw error
    }
  }
}

createTemplatesTable()
