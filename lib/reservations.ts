import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE_NAME || "green-pages-reservations"

// Reservation duration in milliseconds (15 minutes)
const RESERVATION_DURATION_MS = 15 * 60 * 1000

export type ReservationStatus = "active" | "released" | "completed"

export interface Reservation {
  reservationId: string
  userId: string
  itemId: string // Composite key: "CA#quarter"
  state: string
  adType: string
  quantity: number
  createdAt: string
  expiresAt: number // Unix timestamp in seconds (for DynamoDB TTL)
  status: ReservationStatus
}

/**
 * Create a new inventory reservation
 */
export async function createReservation(
  userId: string,
  itemId: string,
  state: string,
  adType: string,
  quantity: number = 1
): Promise<Reservation> {
  try {
    const now = new Date()
    const expiresAt = Math.floor((now.getTime() + RESERVATION_DURATION_MS) / 1000) // Unix timestamp in seconds

    const reservation: Reservation = {
      reservationId: `res_${uuidv4()}`,
      userId,
      itemId,
      state,
      adType,
      quantity,
      createdAt: now.toISOString(),
      expiresAt,
      status: "active",
    }

    const command = new PutCommand({
      TableName: RESERVATIONS_TABLE,
      Item: reservation,
    })

    await docClient.send(command)
    return reservation
  } catch (error) {
    console.error("Error creating reservation:", error)
    throw new Error("Failed to create reservation")
  }
}

/**
 * Get a specific reservation by ID
 */
export async function getReservation(reservationId: string): Promise<Reservation | null> {
  try {
    const command = new GetCommand({
      TableName: RESERVATIONS_TABLE,
      Key: { reservationId },
    })

    const response = await docClient.send(command)

    if (!response.Item) {
      return null
    }

    return response.Item as Reservation
  } catch (error) {
    console.error("Error getting reservation:", error)
    throw new Error("Failed to get reservation")
  }
}

/**
 * Release a reservation (mark as released)
 */
export async function releaseReservation(reservationId: string): Promise<void> {
  try {
    const command = new UpdateCommand({
      TableName: RESERVATIONS_TABLE,
      Key: { reservationId },
      UpdateExpression: "SET #status = :released",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":released": "released",
      },
    })

    await docClient.send(command)
  } catch (error) {
    console.error("Error releasing reservation:", error)
    throw new Error("Failed to release reservation")
  }
}

/**
 * Mark reservation as completed (after successful payment)
 */
export async function completeReservation(reservationId: string): Promise<void> {
  try {
    const command = new UpdateCommand({
      TableName: RESERVATIONS_TABLE,
      Key: { reservationId },
      UpdateExpression: "SET #status = :completed",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":completed": "completed",
      },
    })

    await docClient.send(command)
  } catch (error) {
    console.error("Error completing reservation:", error)
    throw new Error("Failed to complete reservation")
  }
}

/**
 * Get all active reservations for a specific item
 * Used to calculate available inventory
 */
export async function getActiveReservationsForItem(itemId: string): Promise<Reservation[]> {
  try {
    const now = Math.floor(Date.now() / 1000) // Current time in seconds

    const command = new QueryCommand({
      TableName: RESERVATIONS_TABLE,
      IndexName: "itemId-expiresAt-index",
      KeyConditionExpression: "itemId = :itemId AND expiresAt > :now",
      FilterExpression: "#status = :active",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":itemId": itemId,
        ":now": now,
        ":active": "active",
      },
    })

    const response = await docClient.send(command)
    return (response.Items || []) as Reservation[]
  } catch (error) {
    console.error("Error getting active reservations for item:", error)
    throw new Error("Failed to get active reservations")
  }
}

/**
 * Get all active reservations for a user
 */
export async function getUserActiveReservations(userId: string): Promise<Reservation[]> {
  try {
    const now = Math.floor(Date.now() / 1000)

    const command = new ScanCommand({
      TableName: RESERVATIONS_TABLE,
      FilterExpression: "userId = :userId AND #status = :active AND expiresAt > :now",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":userId": userId,
        ":active": "active",
        ":now": now,
      },
    })

    const response = await docClient.send(command)
    return (response.Items || []) as Reservation[]
  } catch (error) {
    console.error("Error getting user active reservations:", error)
    throw new Error("Failed to get user reservations")
  }
}

/**
 * Cleanup expired reservations (manual cleanup, runs via cron)
 * DynamoDB TTL can take up to 48 hours, so we need manual cleanup
 */
export async function cleanupExpiredReservations(): Promise<number> {
  try {
    const now = Math.floor(Date.now() / 1000)

    // Find all active reservations that have expired
    const command = new ScanCommand({
      TableName: RESERVATIONS_TABLE,
      FilterExpression: "#status = :active AND expiresAt <= :now",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":active": "active",
        ":now": now,
      },
    })

    const response = await docClient.send(command)
    const expiredReservations = (response.Items || []) as Reservation[]

    // Release each expired reservation
    const releasePromises = expiredReservations.map((reservation) =>
      releaseReservation(reservation.reservationId)
    )

    await Promise.all(releasePromises)

    console.log(`Cleaned up ${expiredReservations.length} expired reservations`)
    return expiredReservations.length
  } catch (error) {
    console.error("Error cleaning up expired reservations:", error)
    throw new Error("Failed to cleanup expired reservations")
  }
}

/**
 * Calculate available inventory for an item
 * Takes total inventory and subtracts active reservations
 */
export async function calculateAvailableInventory(
  itemId: string,
  totalInventory: number
): Promise<number> {
  try {
    const activeReservations = await getActiveReservationsForItem(itemId)
    const reservedQuantity = activeReservations.reduce(
      (sum, res) => sum + res.quantity,
      0
    )

    const available = Math.max(0, totalInventory - reservedQuantity)
    return available
  } catch (error) {
    console.error("Error calculating available inventory:", error)
    throw new Error("Failed to calculate available inventory")
  }
}

/**
 * Extend reservation expiration (e.g., when user starts checkout)
 */
export async function extendReservation(
  reservationId: string,
  additionalMinutes: number = 15
): Promise<Reservation> {
  try {
    const reservation = await getReservation(reservationId)

    if (!reservation) {
      throw new Error("Reservation not found")
    }

    if (reservation.status !== "active") {
      throw new Error("Cannot extend non-active reservation")
    }

    const newExpiresAt = Math.floor(Date.now() / 1000) + additionalMinutes * 60

    const command = new UpdateCommand({
      TableName: RESERVATIONS_TABLE,
      Key: { reservationId },
      UpdateExpression: "SET expiresAt = :newExpiresAt",
      ExpressionAttributeValues: {
        ":newExpiresAt": newExpiresAt,
      },
      ReturnValues: "ALL_NEW",
    })

    const response = await docClient.send(command)
    return response.Attributes as Reservation
  } catch (error) {
    console.error("Error extending reservation:", error)
    throw error
  }
}
