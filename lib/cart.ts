import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const CART_TABLE = process.env.CART_TABLE_NAME || "green-pages-carts"

export interface CartItem {
  itemId: string // Composite key: "CA#quarter"
  state: string
  adType: string
  title: string
  price: number // USD (not cents!)
  quantity: number
  addedAt: string
  reservationId: string
}

export interface Cart {
  userId: string
  items: CartItem[]
  createdAt: string
  updatedAt: string
}

/**
 * Get user's cart from DynamoDB
 */
export async function getCart(userId: string): Promise<Cart | null> {
  try {
    const command = new GetCommand({
      TableName: CART_TABLE,
      Key: { userId },
    })

    const response = await docClient.send(command)

    if (!response.Item) {
      return null
    }

    return response.Item as Cart
  } catch (error) {
    console.error("Error getting cart:", error)
    throw new Error("Failed to get cart")
  }
}

/**
 * Add item to cart (or create new cart if doesn't exist)
 * If item already exists, increase its quantity
 */
export async function addToCart(
  userId: string,
  item: Omit<CartItem, "addedAt">
): Promise<Cart> {
  try {
    const existingCart = await getCart(userId)
    const now = new Date().toISOString()

    if (existingCart) {
      // Check if item already in cart
      const existingItemIndex = existingCart.items.findIndex((i) => i.itemId === item.itemId)

      if (existingItemIndex !== -1) {
        // Item exists - update quantity
        const newQuantity = existingCart.items[existingItemIndex].quantity + item.quantity

        const command = new UpdateCommand({
          TableName: CART_TABLE,
          Key: { userId },
          UpdateExpression: `SET #items[${existingItemIndex}].quantity = :newQuantity, updatedAt = :now`,
          ExpressionAttributeNames: {
            "#items": "items",
          },
          ExpressionAttributeValues: {
            ":newQuantity": newQuantity,
            ":now": now,
          },
          ReturnValues: "ALL_NEW",
        })

        const response = await docClient.send(command)
        return response.Attributes as Cart
      } else {
        // Item doesn't exist - add new item
        const cartItem: CartItem = {
          ...item,
          addedAt: now,
        }

        const command = new UpdateCommand({
          TableName: CART_TABLE,
          Key: { userId },
          UpdateExpression: "SET #items = list_append(#items, :newItem), updatedAt = :now",
          ExpressionAttributeNames: {
            "#items": "items",
          },
          ExpressionAttributeValues: {
            ":newItem": [cartItem],
            ":now": now,
          },
          ReturnValues: "ALL_NEW",
        })

        const response = await docClient.send(command)
        return response.Attributes as Cart
      }
    } else {
      // Create new cart
      const cartItem: CartItem = {
        ...item,
        addedAt: now,
      }

      const newCart: Cart = {
        userId,
        items: [cartItem],
        createdAt: now,
        updatedAt: now,
      }

      const command = new PutCommand({
        TableName: CART_TABLE,
        Item: newCart,
      })

      await docClient.send(command)
      return newCart
    }
  } catch (error) {
    console.error("Error adding to cart:", error)
    throw error
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  userId: string,
  itemId: string
): Promise<Cart> {
  try {
    const cart = await getCart(userId)

    if (!cart) {
      throw new Error("Cart not found")
    }

    const itemIndex = cart.items.findIndex((i) => i.itemId === itemId)

    if (itemIndex === -1) {
      throw new Error("Item not in cart")
    }

    const command = new UpdateCommand({
      TableName: CART_TABLE,
      Key: { userId },
      UpdateExpression: `REMOVE #items[${itemIndex}] SET updatedAt = :now`,
      ExpressionAttributeNames: {
        "#items": "items",
      },
      ExpressionAttributeValues: {
        ":now": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })

    const response = await docClient.send(command)
    return response.Attributes as Cart
  } catch (error) {
    console.error("Error removing from cart:", error)
    throw error
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(userId: string): Promise<void> {
  try {
    const command = new DeleteCommand({
      TableName: CART_TABLE,
      Key: { userId },
    })

    await docClient.send(command)
  } catch (error) {
    console.error("Error clearing cart:", error)
    throw new Error("Failed to clear cart")
  }
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal // No tax for services

  return {
    subtotal,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

/**
 * Get cart with calculated totals
 */
export async function getCartWithTotals(userId: string) {
  const cart = await getCart(userId)

  if (!cart) {
    return null
  }

  const totals = calculateCartTotals(cart.items)

  return {
    ...cart,
    ...totals,
  }
}
