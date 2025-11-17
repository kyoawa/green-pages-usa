import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const ORDERS_TABLE = process.env.ORDERS_TABLE_NAME || "green-pages-orders"

export interface OrderItem {
  itemId: string // CA#quarter
  state: string
  adType: string
  title: string
  price: number
  quantity: number
  reservationId: string
}

export interface SlotSubmission {
  slotNumber: number // 1-based index (1, 2, 3, etc.)
  submissionId: string | null // ID in submissions table
  status: 'pending' | 'completed' // Whether this slot has been submitted
  submittedAt?: string
  lastEditedAt?: string
}

export interface Order {
  orderId: string // Payment Intent ID
  userId: string
  customerEmail: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  total: number
  createdAt: string
  uploadStatus: { [itemId: string]: boolean } // Track which items have been uploaded (deprecated)
  slotSubmissions?: { [itemId: string]: SlotSubmission[] } // Track per-slot submissions for each item
}

/**
 * Create a new order after successful payment
 */
export async function createOrder(orderData: Order): Promise<Order> {
  try {
    const command = new PutCommand({
      TableName: ORDERS_TABLE,
      Item: orderData,
    })

    await docClient.send(command)
    return orderData
  } catch (error) {
    console.error("Error creating order:", error)
    throw new Error("Failed to create order")
  }
}

/**
 * Get order by orderId (payment intent ID)
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const command = new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
    })

    const response = await docClient.send(command)

    if (!response.Item) {
      return null
    }

    return response.Item as Order
  } catch (error) {
    console.error("Error getting order:", error)
    throw new Error("Failed to get order")
  }
}

/**
 * Get all orders for a user
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const command = new QueryCommand({
      TableName: ORDERS_TABLE,
      IndexName: "UserOrdersIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // Most recent first
    })

    const response = await docClient.send(command)

    return (response.Items || []) as Order[]
  } catch (error) {
    console.error("Error getting user orders:", error)
    throw new Error("Failed to get user orders")
  }
}

/**
 * Mark an item as uploaded
 */
export async function markItemAsUploaded(orderId: string, itemId: string): Promise<void> {
  try {
    const command = new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: "SET uploadStatus.#itemId = :uploaded",
      ExpressionAttributeNames: {
        "#itemId": itemId.replace(/[#]/g, "_"), // DynamoDB doesn't like # in attribute names
      },
      ExpressionAttributeValues: {
        ":uploaded": true,
      },
    })

    await docClient.send(command)
  } catch (error) {
    console.error("Error marking item as uploaded:", error)
    throw new Error("Failed to mark item as uploaded")
  }
}

/**
 * Check if all items in an order have been uploaded
 */
export function isOrderFullyUploaded(order: Order): boolean {
  if (!order.uploadStatus) return false

  for (const item of order.items) {
    const itemKey = item.itemId.replace(/[#]/g, "_")
    if (!order.uploadStatus[itemKey]) {
      return false
    }
  }

  return true
}

/**
 * Initialize slot submissions for an order item
 */
export function initializeSlotSubmissions(itemId: string, quantity: number): SlotSubmission[] {
  const slots: SlotSubmission[] = []
  for (let i = 1; i <= quantity; i++) {
    slots.push({
      slotNumber: i,
      submissionId: null,
      status: 'pending'
    })
  }
  return slots
}

/**
 * Update slot submission status
 */
export async function updateSlotSubmission(
  orderId: string,
  itemId: string,
  slotNumber: number,
  submissionId: string
): Promise<void> {
  try {
    const order = await getOrder(orderId)
    if (!order) {
      throw new Error("Order not found")
    }

    const itemKey = itemId.replace(/[#]/g, "_")

    // Initialize slotSubmissions if it doesn't exist
    if (!order.slotSubmissions) {
      order.slotSubmissions = {}
    }

    // Initialize slots for this item if they don't exist
    if (!order.slotSubmissions[itemKey]) {
      const item = order.items.find(i => i.itemId === itemId)
      if (!item) {
        throw new Error("Item not found in order")
      }
      order.slotSubmissions[itemKey] = initializeSlotSubmissions(itemId, item.quantity)
    }

    // Find and update the specific slot
    const slotIndex = order.slotSubmissions[itemKey].findIndex(s => s.slotNumber === slotNumber)
    if (slotIndex === -1) {
      throw new Error("Slot not found")
    }

    const now = new Date().toISOString()
    order.slotSubmissions[itemKey][slotIndex] = {
      slotNumber,
      submissionId,
      status: 'completed',
      submittedAt: order.slotSubmissions[itemKey][slotIndex].submittedAt || now,
      lastEditedAt: now
    }

    // Update in DynamoDB
    const command = new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: "SET slotSubmissions.#itemKey = :slots",
      ExpressionAttributeNames: {
        "#itemKey": itemKey
      },
      ExpressionAttributeValues: {
        ":slots": order.slotSubmissions[itemKey]
      }
    })

    await docClient.send(command)
  } catch (error) {
    console.error("Error updating slot submission:", error)
    throw error
  }
}

/**
 * Get slot completion status for an order
 */
export function getSlotCompletionStatus(order: Order): {
  totalSlots: number
  completedSlots: number
  pendingSlots: number
  percentComplete: number
} {
  let totalSlots = 0
  let completedSlots = 0

  for (const item of order.items) {
    totalSlots += item.quantity

    const itemKey = item.itemId.replace(/[#]/g, "_")
    const slots = order.slotSubmissions?.[itemKey] || []

    completedSlots += slots.filter(s => s.status === 'completed').length
  }

  const pendingSlots = totalSlots - completedSlots
  const percentComplete = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0

  return {
    totalSlots,
    completedSlots,
    pendingSlots,
    percentComplete
  }
}
