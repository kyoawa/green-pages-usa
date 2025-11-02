const { DynamoDBClient, DeleteTableCommand, CreateTableCommand, waitUntilTableNotExists } = require("@aws-sdk/client-dynamodb");

require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ORDERS_TABLE = process.env.ORDERS_TABLE_NAME || "green-pages-orders";

async function fixOrdersTable() {
  console.log(`Fixing Orders table: ${ORDERS_TABLE}`);

  try {
    // Delete existing table
    console.log("Deleting existing table...");
    await client.send(new DeleteTableCommand({ TableName: ORDERS_TABLE }));

    // Wait for table to be deleted
    console.log("Waiting for table to be deleted...");
    await waitUntilTableNotExists(
      {
        client,
        maxWaitTime: 60,
      },
      { TableName: ORDERS_TABLE }
    );
    console.log("Table deleted successfully");

    // Create new table with correct schema
    console.log("Creating new table with correct schema...");
    const params = {
      TableName: ORDERS_TABLE,
      KeySchema: [
        { AttributeName: "orderId", KeyType: "HASH" }, // Partition key (payment intent ID)
      ],
      AttributeDefinitions: [
        { AttributeName: "orderId", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "createdAt", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "UserOrdersIndex",
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };

    await client.send(new CreateTableCommand(params));
    console.log(`✅ Table ${ORDERS_TABLE} created successfully with correct schema`);
    console.log(`
Orders Table Schema:
- orderId (PK): Payment Intent ID
- userId: Clerk user ID
- customerEmail: Customer email
- customerName: Customer name
- customerPhone: Customer phone
- items: Array of purchased items
- subtotal: Order subtotal
- tax: Order tax
- total: Order total
- createdAt: Order timestamp
- uploadStatus: Object tracking upload completion per item

GSI: UserOrdersIndex
- userId (PK)
- createdAt (Sort Key)
    `);
  } catch (error) {
    console.error("❌ Error fixing table:", error);
    throw error;
  }
}

fixOrdersTable()
  .then(() => {
    console.log("\n✅ Orders table fixed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  });
