import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb"

// --- Client ---
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  // If you're running on AWS with a role, you can omit credentials
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
})
const docClient = DynamoDBDocumentClient.from(client)

// --- Helpers (canonicalize inputs to match your table) ---
const toStateCode = (s) => {
  if (!s) return s
  if (s.length === 2) return s.toUpperCase()
  const map = {
    Alabama:"AL", Alaska:"AK", Arizona:"AZ", Arkansas:"AR", California:"CA", Colorado:"CO",
    Connecticut:"CT", Delaware:"DE", Florida:"FL", Georgia:"GA", Hawaii:"HI", Idaho:"ID",
    Illinois:"IL", Indiana:"IN", Iowa:"IA", Kansas:"KS", Kentucky:"KY", Louisiana:"LA",
    Maine:"ME", Maryland:"MD", Massachusetts:"MA", Michigan:"MI", Minnesota:"MN",
    Mississippi:"MS", Missouri:"MO", Montana:"MT", Nebraska:"NE", Nevada:"NV",
    "New Hampshire":"NH", "New Jersey":"NJ", "New Mexico":"NM", "New York":"NY",
    "North Carolina":"NC", "North Dakota":"ND", Ohio:"OH", Oklahoma:"OK", Oregon:"OR",
    Pennsylvania:"PA", "Rhode Island":"RI", "South Carolina":"SC", "South Dakota":"SD",
    Tennessee:"TN", Texas:"TX", Utah:"UT", Vermont:"VT", Virginia:"VA", Washington:"WA",
    "West Virginia":"WV", Wisconsin:"WI", Wyoming:"WY",
  }
  return map[String(s).trim()] || String(s).toUpperCase()
}

const toAdKey = (t) => {
  const k = String(t ?? "").toLowerCase()
  if (["quarterpage","quarter","1/4","qtr"].includes(k)) return "quarter"
  if (["halfpage","half","1/2"].includes(k)) return "half"
  if (["fullpage","full"].includes(k)) return "full"
  if (["single","listing"].includes(k)) return "single"
  return k // assume already "quarter" | "half" | "full" | "single"
}

const makeId = (state, adType) => `${toStateCode(state)}#${toAdKey(adType)}`

export class InventoryDB {
  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE_NAME || "green-pages-inventory"
  }

  /**
   * Used by your state pages to render available ads.
   * Returns an array of items for the given state code/label.
   * Shape is compatible with your UI (id, title, price, inventory, totalSlots, description, state, adType).
   */
  async getInventoryByState(state) {
    try {
      const stateCode = toStateCode(state)
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: "#state = :state",
        ExpressionAttributeNames: { "#state": "state" },
        ExpressionAttributeValues: { ":state": stateCode }
      })
      const response = await docClient.send(command)
      return response.Items || []
    } catch (error) {
      console.error("Error fetching inventory:", error)
      throw error
    }
  }

  /**
   * Decrement remaining inventory for a specific state + adType.
   * Uses the correct composite key: "<STATE>#<adType>" (e.g., "MT#half").
   * Throws "Not enough inventory available" when inventory < decreaseBy or row missing.
   */
  async updateInventory(state, adType, decreaseBy = 1) {
    try {
      const id = makeId(state, adType)
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id }, // matches createInventoryItem
        UpdateExpression: "SET inventory = inventory - :decrease, updatedAt = :now",
        ConditionExpression: "attribute_exists(inventory) AND inventory >= :decrease",
        ExpressionAttributeValues: {
          ":decrease": Math.max(1, Number(decreaseBy) || 1),
          ":now": new Date().toISOString()
        },
        ReturnValues: "ALL_NEW"
      })
      const response = await docClient.send(command)
      return response.Attributes
    } catch (error) {
      if (error.name === "ConditionalCheckFailedException") {
        // Normalize to the message your API expects
        throw new Error("Not enough inventory available")
      }
      console.error("Error updating inventory:", error)
      throw error
    }
  }

  /**
   * Create/seed an inventory item.
   * Persists with the same composite id your UI expects.
   */
  async createInventoryItem(data) {
    try {
      const stateCode = toStateCode(data.state)
      const adKey = toAdKey(data.adType)
      const itemKey = `${stateCode}#${adKey}`

      const item = {
        id: itemKey,
        state: stateCode,
        adType: adKey,
        title: data.title,
        price: Number(data.price) || 0,
        inventory: Number(data.inventory) ?? 0,
        totalSlots: Number(data.totalSlots) || 0,
        description: data.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const command = new PutCommand({ TableName: this.tableName, Item: item })
      await docClient.send(command)
      return item
    } catch (error) {
      console.error("Error creating inventory item:", error)
      throw error
    }
  }

  /**
   * Optional: initialize sample rows (unchanged shape, normalized keys).
   */
  async initializeSampleData() {
    const sampleData = [
      // California
      { state: "CA", adType: "single",  title: "SINGLE SLOT LISTING - 300",   price: 500,  inventory: 60, totalSlots: 100, description: "Single Slot Listing" },
      { state: "CA", adType: "quarter", title: "1/4 PAGE ADVERTORIAL - 1000", price: 1000, inventory: 7,  totalSlots: 10,  description: "1/4 Page Advertorial" },
      { state: "CA", adType: "half",    title: "1/2 PAGE ADVERTORIAL - 1800", price: 1800, inventory: 3,  totalSlots: 5,   description: "1/2 Page Advertorial" },
      { state: "CA", adType: "full",    title: "FULL PAGE AD - 2500",         price: 2500, inventory: 2,  totalSlots: 10,  description: "Full Page Ad" },

      // Illinois
      { state: "IL", adType: "single",  title: "SINGLE SLOT LISTING - 300",   price: 500,  inventory: 45, totalSlots: 100, description: "Single Slot Listing" },
      { state: "IL", adType: "quarter", title: "1/4 PAGE ADVERTORIAL - 1000", price: 1000, inventory: 8,  totalSlots: 10,  description: "1/4 Page Advertorial" },
      { state: "IL", adType: "half",    title: "1/2 PAGE ADVERTORIAL - 1800", price: 1800, inventory: 4,  totalSlots: 5,   description: "1/2 Page Advertorial" },
      { state: "IL", adType: "full",    title: "FULL PAGE AD - 2500",         price: 2500, inventory: 3,  totalSlots: 10,  description: "Full Page Ad" },

      // Missouri
      { state: "MO", adType: "single",  title: "SINGLE SLOT LISTING - 300",   price: 500,  inventory: 50, totalSlots: 100, description: "Single Slot Listing" },
      { state: "MO", adType: "quarter", title: "1/4 PAGE ADVERTORIAL - 1000", price: 1000, inventory: 6,  totalSlots: 10,  description: "1/4 Page Advertorial" },
      { state: "MO", adType: "half",    title: "1/2 PAGE ADVERTORIAL - 1800", price: 1800, inventory: 2,  totalSlots: 5,   description: "1/2 Page Advertorial" },
      { state: "MO", adType: "full",    title: "FULL PAGE AD - 2500",         price: 2500, inventory: 1,  totalSlots: 10,  description: "Full Page Ad" },

      // Oklahoma
      { state: "OK", adType: "single",  title: "SINGLE SLOT LISTING - 300",   price: 500,  inventory: 55, totalSlots: 100, description: "Single Slot Listing" },
      { state: "OK", adType: "quarter", title: "1/4 PAGE ADVERTORIAL - 1000", price: 1000, inventory: 9,  totalSlots: 10,  description: "1/4 Page Advertorial" },
      { state: "OK", adType: "half",    title: "1/2 PAGE ADVERTORIAL - 1800", price: 1800, inventory: 4,  totalSlots: 5,   description: "1/2 Page Advertorial" },
      { state: "OK", adType: "full",    title: "FULL PAGE AD - 2500",         price: 2500, inventory: 5,  totalSlots: 10,  description: "Full Page Ad" },

      // Montana
      { state: "MT", adType: "single",  title: "SINGLE SLOT LISTING - 300",   price: 500,  inventory: 40, totalSlots: 100, description: "Single Slot Listing" },
      { state: "MT", adType: "quarter", title: "1/4 PAGE ADVERTORIAL - 1000", price: 1000, inventory: 5,  totalSlots: 10,  description: "1/4 Page Advertorial" },
      { state: "MT", adType: "half",    title: "1/2 PAGE ADVERTORIAL - 1800", price: 1800, inventory: 3,  totalSlots: 5,   description: "1/2 Page Advertorial" },
      { state: "MT", adType: "full",    title: "FULL PAGE AD - 2500",         price: 2500, inventory: 4,  totalSlots: 10,  description: "Full Page Ad" },

      // New York
      { state: "NY", adType: "single",  title: "SINGLE SLOT LISTING - 300",   price: 500,  inventory: 35, totalSlots: 100, description: "Single Slot Listing" },
      { state: "NY", adType: "quarter", title: "1/4 PAGE ADVERTORIAL - 1000", price: 1000, inventory: 6,  totalSlots: 10,  description: "1/4 Page Advertorial" },
      { state: "NY", adType: "half",    title: "1/2 PAGE ADVERTORIAL - 1800", price: 1800, inventory: 2,  totalSlots: 5,   description: "1/2 Page Advertorial" },
      { state: "NY", adType: "full",    title: "FULL PAGE AD - 2500",         price: 2500, inventory: 3,  totalSlots: 10,  description: "Full Page Ad" },
    ]

    for (const item of sampleData) {
      try {
        await this.createInventoryItem(item)
        console.log(`Created inventory item: ${item.state} - ${item.adType}`)
      } catch {
        console.log(`Item already exists or error: ${item.state} - ${item.adType}`)
      }
    }
  }
}