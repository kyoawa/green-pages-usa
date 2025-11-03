import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb"

// --- Client Setup ---
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
})
const docClient = DynamoDBDocumentClient.from(client)

// --- Helper Functions ---
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
  const k = String(t ?? "").toLowerCase().replace(/\s+/g, "")
  if (["quarterpage","quarter","1/4","qtr"].includes(k)) return "quarter"
  if (["halfpage","half","1/2"].includes(k)) return "half"
  if (["fullpage","full"].includes(k)) return "full"
  if (["single","listing"].includes(k)) return "single"
  return k
}

const makeId = (state, adType) => `${toStateCode(state)}#${toAdKey(adType)}`

// --- Main InventoryDB Class ---
export class InventoryDB {
  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE_NAME || "green-pages-inventory"
  }

  // ===== EXISTING CORE METHODS =====

  /**
   * Used by your state pages to render available ads.
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
   */
  async updateInventory(state, adType, decreaseBy = 1) {
    try {
      const id = makeId(state, adType)
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
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
        throw new Error("Not enough inventory available")
      }
      console.error("Error updating inventory:", error)
      throw error
    }
  }

  /**
   * Create/seed an inventory item.
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
        active: data.active !== false, // Default to true
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
   * Initialize sample data for all states
   */
  async initializeSampleData() {
    const sampleData = [
      // California - Ordered from cheapest to most expensive
      { state: "CA", adType: "single",  title: "SINGLE LISTINGS",              price: 300,  inventory: 60, totalSlots: 100, description: "Single Slot Listing" },
      { state: "CA", adType: "banner",  title: "DIGITAL BANNERS",              price: 500,  inventory: 20, totalSlots: 50,  description: "Digital Banner - 50k impressions" },
      { state: "CA", adType: "quarter", title: "1/4 PAGE AD",                  price: 800,  inventory: 7,  totalSlots: 10,  description: "1/4 Page Ad" },
      { state: "CA", adType: "half",    title: "1/2 PAGE AD",                  price: 1500, inventory: 3,  totalSlots: 5,   description: "1/2 Page Ad" },
      { state: "CA", adType: "full",    title: "FULL PAGE AD",                 price: 3000, inventory: 2,  totalSlots: 10,  description: "Full Page Ad" },
      { state: "CA", adType: "belly",   title: "BACKCOVER/BELLY BAND",         price: 8000, inventory: 1,  totalSlots: 2,   description: "Backcover/Belly Band" },

      // Illinois - Ordered from cheapest to most expensive
      { state: "IL", adType: "single",  title: "SINGLE LISTINGS",              price: 300,  inventory: 45, totalSlots: 100, description: "Single Slot Listing" },
      { state: "IL", adType: "banner",  title: "DIGITAL BANNERS",              price: 500,  inventory: 18, totalSlots: 50,  description: "Digital Banner - 50k impressions" },
      { state: "IL", adType: "quarter", title: "1/4 PAGE AD",                  price: 800,  inventory: 8,  totalSlots: 10,  description: "1/4 Page Ad" },
      { state: "IL", adType: "half",    title: "1/2 PAGE AD",                  price: 1500, inventory: 4,  totalSlots: 5,   description: "1/2 Page Ad" },
      { state: "IL", adType: "full",    title: "FULL PAGE AD",                 price: 3000, inventory: 3,  totalSlots: 10,  description: "Full Page Ad" },
      { state: "IL", adType: "belly",   title: "BACKCOVER/BELLY BAND",         price: 8000, inventory: 1,  totalSlots: 2,   description: "Backcover/Belly Band" },

      // Missouri - Ordered from cheapest to most expensive
      { state: "MO", adType: "single",  title: "SINGLE LISTINGS",              price: 300,  inventory: 50, totalSlots: 100, description: "Single Slot Listing" },
      { state: "MO", adType: "banner",  title: "DIGITAL BANNERS",              price: 500,  inventory: 22, totalSlots: 50,  description: "Digital Banner - 50k impressions" },
      { state: "MO", adType: "quarter", title: "1/4 PAGE AD",                  price: 800,  inventory: 6,  totalSlots: 10,  description: "1/4 Page Ad" },
      { state: "MO", adType: "half",    title: "1/2 PAGE AD",                  price: 1500, inventory: 2,  totalSlots: 5,   description: "1/2 Page Ad" },
      { state: "MO", adType: "full",    title: "FULL PAGE AD",                 price: 3000, inventory: 1,  totalSlots: 10,  description: "Full Page Ad" },
      { state: "MO", adType: "belly",   title: "BACKCOVER/BELLY BAND",         price: 8000, inventory: 1,  totalSlots: 2,   description: "Backcover/Belly Band" },

      // Oklahoma - Ordered from cheapest to most expensive
      { state: "OK", adType: "single",  title: "SINGLE LISTINGS",              price: 300,  inventory: 55, totalSlots: 100, description: "Single Slot Listing" },
      { state: "OK", adType: "banner",  title: "DIGITAL BANNERS",              price: 500,  inventory: 25, totalSlots: 50,  description: "Digital Banner - 50k impressions" },
      { state: "OK", adType: "quarter", title: "1/4 PAGE AD",                  price: 800,  inventory: 9,  totalSlots: 10,  description: "1/4 Page Ad" },
      { state: "OK", adType: "half",    title: "1/2 PAGE AD",                  price: 1500, inventory: 4,  totalSlots: 5,   description: "1/2 Page Ad" },
      { state: "OK", adType: "full",    title: "FULL PAGE AD",                 price: 3000, inventory: 5,  totalSlots: 10,  description: "Full Page Ad" },
      { state: "OK", adType: "belly",   title: "BACKCOVER/BELLY BAND",         price: 8000, inventory: 1,  totalSlots: 2,   description: "Backcover/Belly Band" },

      // Montana - Ordered from cheapest to most expensive
      { state: "MT", adType: "single",  title: "SINGLE LISTINGS",              price: 300,  inventory: 40, totalSlots: 100, description: "Single Slot Listing" },
      { state: "MT", adType: "banner",  title: "DIGITAL BANNERS",              price: 500,  inventory: 15, totalSlots: 50,  description: "Digital Banner - 50k impressions" },
      { state: "MT", adType: "quarter", title: "1/4 PAGE AD",                  price: 800,  inventory: 5,  totalSlots: 10,  description: "1/4 Page Ad" },
      { state: "MT", adType: "half",    title: "1/2 PAGE AD",                  price: 1500, inventory: 3,  totalSlots: 5,   description: "1/2 Page Ad" },
      { state: "MT", adType: "full",    title: "FULL PAGE AD",                 price: 3000, inventory: 4,  totalSlots: 10,  description: "Full Page Ad" },
      { state: "MT", adType: "belly",   title: "BACKCOVER/BELLY BAND",         price: 8000, inventory: 1,  totalSlots: 2,   description: "Backcover/Belly Band" },

      // New York - Ordered from cheapest to most expensive
      { state: "NY", adType: "single",  title: "SINGLE LISTINGS",              price: 300,  inventory: 35, totalSlots: 100, description: "Single Slot Listing" },
      { state: "NY", adType: "banner",  title: "DIGITAL BANNERS",              price: 500,  inventory: 12, totalSlots: 50,  description: "Digital Banner - 50k impressions" },
      { state: "NY", adType: "quarter", title: "1/4 PAGE AD",                  price: 800,  inventory: 6,  totalSlots: 10,  description: "1/4 Page Ad" },
      { state: "NY", adType: "half",    title: "1/2 PAGE AD",                  price: 1500, inventory: 2,  totalSlots: 5,   description: "1/2 Page Ad" },
      { state: "NY", adType: "full",    title: "FULL PAGE AD",                 price: 3000, inventory: 3,  totalSlots: 10,  description: "Full Page Ad" },
      { state: "NY", adType: "belly",   title: "BACKCOVER/BELLY BAND",         price: 8000, inventory: 1,  totalSlots: 2,   description: "Backcover/Belly Band" },
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

  // ===== NEW ADMIN MANAGEMENT METHODS =====

  /**
   * Get all ads for admin dashboard (includes inactive ones)
   */
  async getAllAdsForAdmin() {
    try {
      const command = new ScanCommand({
        TableName: this.tableName
      })
      const response = await docClient.send(command)
      
      const items = response.Items || []
      
      // Group by state for easier admin management
      const adsByState = items.reduce((acc, item) => {
        if (!acc[item.state]) {
          acc[item.state] = []
        }
        acc[item.state].push({
          id: item.id,
          state: item.state,
          adType: item.adType,
          title: item.title,
          price: item.price,
          inventory: item.inventory,
          totalSlots: item.totalSlots,
          description: item.description,
          active: item.active !== false, // default to true for existing records
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString()
        })
        return acc
      }, {})
      
      return adsByState
    } catch (error) {
      console.error("Error getting all ads for admin:", error)
      throw error
    }
  }

  /**
   * Toggle an ad type active/inactive
   */
  async toggleAdActive(state, adType, active) {
    try {
      const id = makeId(state, adType)
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: "SET active = :active, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":active": active,
          ":updatedAt": new Date().toISOString()
        },
        ReturnValues: "ALL_NEW"
      })
      
      const response = await docClient.send(command)
      return response.Attributes
    } catch (error) {
      console.error("Error toggling ad active status:", error)
      throw error
    }
  }

  /**
   * Create a new ad type
   */
  async createNewAdType(state, adType, title, price, inventory, totalSlots, description) {
    try {
      const id = makeId(state, adType)
      const now = new Date().toISOString()
      
      const item = {
        id,
        state: toStateCode(state),
        adType: toAdKey(adType),
        title,
        price,
        inventory,
        totalSlots,
        description,
        active: true,
        createdAt: now,
        updatedAt: now
      }
      
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: "attribute_not_exists(id)" // Prevent overwriting existing ads
      })
      
      await docClient.send(command)
      return item
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Ad type ${adType} already exists for state ${state}`)
      }
      console.error("Error creating new ad type:", error)
      throw error
    }
  }

  /**
   * Update ad details (price, inventory, title, etc.)
   */
  async updateAdDetails(state, adType, updateData) {
    try {
      const id = makeId(state, adType)
      
      // Build update expression dynamically based on provided fields
      const updateExpressions = []
      const expressionAttributeValues = {
        ":updatedAt": new Date().toISOString()
      }
      
      if (updateData.title !== undefined) {
        updateExpressions.push("title = :title")
        expressionAttributeValues[":title"] = updateData.title
      }
      
      if (updateData.price !== undefined) {
        updateExpressions.push("price = :price")
        expressionAttributeValues[":price"] = updateData.price
      }
      
      if (updateData.inventory !== undefined) {
        updateExpressions.push("inventory = :inventory")
        expressionAttributeValues[":inventory"] = updateData.inventory
      }
      
      if (updateData.totalSlots !== undefined) {
        updateExpressions.push("totalSlots = :totalSlots")
        expressionAttributeValues[":totalSlots"] = updateData.totalSlots
      }
      
      if (updateData.description !== undefined) {
        updateExpressions.push("description = :description")
        expressionAttributeValues[":description"] = updateData.description
      }
      
      updateExpressions.push("updatedAt = :updatedAt")
      
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
      
      const response = await docClient.send(command)
      return response.Attributes
    } catch (error) {
      console.error("Error updating ad details:", error)
      throw error
    }
  }

  /**
   * Delete an ad type completely
   */
  async deleteAdType(state, adType) {
    try {
      const id = makeId(state, adType)
      
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id }
      })
      
      await docClient.send(command)
      return { success: true }
    } catch (error) {
      console.error("Error deleting ad type:", error)
      throw error
    }
  }

  /**
   * Get active ads only (for public-facing pages)
   */
  async getActiveInventoryByState(state) {
    try {
      const stateCode = toStateCode(state)
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: "#state = :state AND (attribute_not_exists(active) OR active = :active)",
        ExpressionAttributeNames: { 
          "#state": "state"
        },
        ExpressionAttributeValues: {
          ":state": stateCode,
          ":active": true
        }
      })
      
      const response = await docClient.send(command)
      
      return response.Items.map(item => ({
        id: item.adType,
        title: item.title,
        price: item.price,
        remaining: `${item.inventory}/${item.totalSlots} REMAINING`,
        inventory: item.inventory,
        totalSlots: item.totalSlots,
        description: item.description,
        state: item.state,
        adType: item.adType
      }))
    } catch (error) {
      console.error("Error getting active inventory by state:", error)
      
      // Fallback to original method if something goes wrong
      const allInventory = await this.getInventoryByState(state)
      return allInventory
        .filter(item => item.active !== false)
        .map(item => ({
          id: item.adType,
          title: item.title,
          price: item.price,
          remaining: `${item.inventory}/${item.totalSlots} REMAINING`,
          inventory: item.inventory,
          totalSlots: item.totalSlots,
          description: item.description,
          state: item.state,
          adType: item.adType
        }))
    }
  }

  /**
   * Get a single ad item by state and adType
   */
  async getAdItem(state, adType) {
    try {
      const id = makeId(state, adType)
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { id }
      })
      
      const response = await docClient.send(command)
      return response.Item
    } catch (error) {
      console.error("Error getting ad item:", error)
      throw error
    }
  }

  /**
   * Bulk update multiple ads at once
   */
  async bulkUpdateAds(updates) {
    const results = []
    
    for (const update of updates) {
      try {
        const { state, adType, ...updateData } = update
        const result = await this.updateAdDetails(state, adType, updateData)
        results.push({ success: true, state, adType, result })
      } catch (error) {
        results.push({ success: false, state: update.state, adType: update.adType, error: error.message })
      }
    }
    
    return results
  }

  /**
   * Get inventory statistics for admin dashboard
   */
  async getInventoryStats() {
    try {
      const command = new ScanCommand({
        TableName: this.tableName
      })
      const response = await docClient.send(command)
      const items = response.Items || []
      
      const activeAds = items.filter(item => item.active !== false)
      const totalRevenuePotential = activeAds.reduce((sum, item) => sum + (item.price * item.totalSlots), 0)
      const totalInventoryRemaining = activeAds.reduce((sum, item) => sum + item.inventory, 0)
      const totalSlots = activeAds.reduce((sum, item) => sum + item.totalSlots, 0)
      const soldSlots = totalSlots - totalInventoryRemaining
      
      return {
        totalAds: items.length,
        activeAds: activeAds.length,
        inactiveAds: items.length - activeAds.length,
        totalRevenuePotential,
        totalInventoryRemaining,
        totalSlots,
        soldSlots,
        salesPercentage: totalSlots > 0 ? Math.round((soldSlots / totalSlots) * 100) : 0
      }
    } catch (error) {
      console.error("Error getting inventory stats:", error)
      throw error
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Reset all inventory to full capacity (useful for new editions/seasons)
   */
  async resetAllInventory() {
    try {
      const command = new ScanCommand({
        TableName: this.tableName
      })
      const response = await docClient.send(command)
      const items = response.Items || []
      
      const updates = []
      for (const item of items) {
        updates.push({
          state: item.state,
          adType: item.adType,
          inventory: item.totalSlots
        })
      }
      
      return await this.bulkUpdateAds(updates)
    } catch (error) {
      console.error("Error resetting all inventory:", error)
      throw error
    }
  }

  /**
   * Export all inventory data (for backups or reporting)
   */
  async exportAllInventory() {
    try {
      const command = new ScanCommand({
        TableName: this.tableName
      })
      const response = await docClient.send(command)
      return {
        exportDate: new Date().toISOString(),
        totalItems: response.Items?.length || 0,
        data: response.Items || []
      }
    } catch (error) {
      console.error("Error exporting inventory:", error)
      throw error
    }
  }
}