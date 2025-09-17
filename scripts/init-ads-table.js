const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const sampleAds = [
  {
    id: 'ca-single-1',
    state: 'CA',
    adType: 'single',
    title: 'Single Listing',
    price: 100,
    inventory: 60,
    totalSlots: 60,
    description: 'Basic listing in the directory',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ca-quarter-1',
    state: 'CA',
    adType: 'quarter',
    title: 'Quarter Page Ad',
    price: 500,
    inventory: 7,
    totalSlots: 8,
    description: 'Quarter page advertisement',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ca-half-1',
    state: 'CA',
    adType: 'half',
    title: 'Half Page Ad',
    price: 900,
    inventory: 3,
    totalSlots: 4,
    description: 'Half page advertisement',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ca-full-1',
    state: 'CA',
    adType: 'full',
    title: 'Full Page Ad',
    price: 1500,
    inventory: 1,
    totalSlots: 2,
    description: 'Full page advertisement',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function initAds() {
  for (const ad of sampleAds) {
    try {
      const command = new PutCommand({
        TableName: 'green-pages-ads',
        Item: ad
      });
      
      await docClient.send(command);
      console.log(`✓ Created ad: ${ad.title} for ${ad.state}`);
    } catch (error) {
      console.error(`✗ Error creating ad ${ad.title}:`, error);
    }
  }
}

initAds();