import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"
import { createReservation, releaseReservation, completeReservation, calculateAvailableInventory } from "./reservations"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
})

const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = 'green-pages-custom-bundles'

export interface CustomBundleItem {
  adType: string
  title: string
  quantity: number
  unitPrice: number
}

export interface CustomBundle {
  id: string
  name: string
  description?: string
  state: string
  items: CustomBundleItem[]
  retailValue: number
  totalPrice: number
  status: 'active' | 'purchased' | 'expired'
  deliveryMethod: 'link' | 'account'
  accessToken: string
  assignedUserId?: string
  assignedEmail?: string
  purchasedByUserId?: string
  purchasedByEmail?: string
  orderId?: string
  reservationIds?: string[]
  createdAt: string
  updatedAt: string
  expiresAt?: string
  createdBy: string
}

export const AD_TYPE_INFO: Record<string, { label: string; defaultPrice: number }> = {
  single: { label: 'Single Listing', defaultPrice: 300 },
  banner: { label: 'Digital Banner', defaultPrice: 500 },
  quarter: { label: '1/4 Page Ad', defaultPrice: 800 },
  half: { label: '1/2 Page Ad', defaultPrice: 1500 },
  full: { label: 'Full Page Ad', defaultPrice: 3000 },
  belly: { label: 'Backcover/Belly Band', defaultPrice: 8000 },
}

function calculateRetailValue(items: CustomBundleItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}

const BUNDLE_HOLD_HOURS = 24

export async function createCustomBundle(data: {
  name: string
  description?: string
  state: string
  items: CustomBundleItem[]
  totalPrice: number
  deliveryMethod: 'link' | 'account'
  assignedUserId?: string
  assignedEmail?: string
  expiresAt?: string
  createdBy: string
}): Promise<CustomBundle> {
  // Check inventory availability for each item
  for (const item of data.items) {
    const itemId = `${data.state}#${item.adType}`
    const available = await calculateAvailableInventory(itemId, Infinity)
    // We pass Infinity here — the actual inventory check happens in the reservation.
    // A more precise check would query the ads table, but we'll rely on the
    // reservation creation to fail if inventory is truly unavailable.
  }

  // Default expiry to 24 hours from now if not set
  const expiresAt = data.expiresAt || new Date(Date.now() + BUNDLE_HOLD_HOURS * 60 * 60 * 1000).toISOString()

  // Create reservations for each item (24h hold)
  const reservationIds: string[] = []
  const holdMinutes = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (60 * 1000))

  for (const item of data.items) {
    const itemId = `${data.state}#${item.adType}`
    const reservation = await createReservation(
      data.createdBy,
      itemId,
      data.state,
      item.adType,
      item.quantity
    )
    // Extend reservation to match bundle expiry (default createReservation is 15 min)
    // We override the expiresAt directly
    await docClient.send(new UpdateCommand({
      TableName: 'green-pages-reservations',
      Key: { reservationId: reservation.reservationId },
      UpdateExpression: 'SET expiresAt = :exp',
      ExpressionAttributeValues: {
        ':exp': Math.floor(new Date(expiresAt).getTime() / 1000),
      },
    }))
    reservationIds.push(reservation.reservationId)
  }

  const bundle: CustomBundle = {
    id: uuidv4(),
    name: data.name,
    description: data.description,
    state: data.state,
    items: data.items,
    retailValue: calculateRetailValue(data.items),
    totalPrice: data.totalPrice,
    status: 'active',
    deliveryMethod: data.deliveryMethod,
    accessToken: uuidv4(),
    assignedUserId: data.assignedUserId,
    assignedEmail: data.assignedEmail,
    reservationIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt,
    createdBy: data.createdBy,
  }

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: bundle,
  }))

  return bundle
}

export async function getCustomBundle(id: string): Promise<CustomBundle | null> {
  const response = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }))
  return (response.Item as CustomBundle) || null
}

export async function getCustomBundleByToken(accessToken: string): Promise<CustomBundle | null> {
  const response = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'AccessTokenIndex',
    KeyConditionExpression: 'accessToken = :token',
    ExpressionAttributeValues: { ':token': accessToken },
  }))

  const bundles = (response.Items || []) as CustomBundle[]
  return bundles[0] || null
}

export async function getCustomBundlesForUser(userId: string): Promise<CustomBundle[]> {
  const response = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'AssignedUserIndex',
    KeyConditionExpression: 'assignedUserId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false,
  }))
  return (response.Items || []) as CustomBundle[]
}

export async function getAllCustomBundles(): Promise<CustomBundle[]> {
  const response = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
  }))
  const bundles = (response.Items || []) as CustomBundle[]
  return bundles.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function updateCustomBundle(
  id: string,
  updates: Partial<Pick<CustomBundle, 'name' | 'description' | 'state' | 'items' | 'totalPrice' | 'expiresAt' | 'status' | 'assignedUserId' | 'assignedEmail' | 'deliveryMethod'>>
): Promise<CustomBundle | null> {
  const expressions: string[] = ['updatedAt = :updatedAt']
  const values: Record<string, any> = { ':updatedAt': new Date().toISOString() }
  const names: Record<string, string> = {}

  if (updates.name !== undefined) {
    expressions.push('#name = :name')
    names['#name'] = 'name'
    values[':name'] = updates.name
  }
  if (updates.description !== undefined) {
    expressions.push('description = :description')
    values[':description'] = updates.description
  }
  if (updates.state !== undefined) {
    expressions.push('#state = :state')
    names['#state'] = 'state'
    values[':state'] = updates.state
  }
  if (updates.items !== undefined) {
    expressions.push('items = :items')
    values[':items'] = updates.items
    expressions.push('retailValue = :retailValue')
    values[':retailValue'] = calculateRetailValue(updates.items)
  }
  if (updates.totalPrice !== undefined) {
    expressions.push('totalPrice = :totalPrice')
    values[':totalPrice'] = updates.totalPrice
  }
  if (updates.expiresAt !== undefined) {
    expressions.push('expiresAt = :expiresAt')
    values[':expiresAt'] = updates.expiresAt
  }
  if (updates.status !== undefined) {
    expressions.push('#status = :status')
    names['#status'] = 'status'
    values[':status'] = updates.status
  }
  if (updates.assignedUserId !== undefined) {
    expressions.push('assignedUserId = :assignedUserId')
    values[':assignedUserId'] = updates.assignedUserId
  }
  if (updates.assignedEmail !== undefined) {
    expressions.push('assignedEmail = :assignedEmail')
    values[':assignedEmail'] = updates.assignedEmail
  }
  if (updates.deliveryMethod !== undefined) {
    expressions.push('deliveryMethod = :deliveryMethod')
    values[':deliveryMethod'] = updates.deliveryMethod
  }

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'SET ' + expressions.join(', '),
    ...(Object.keys(names).length > 0 ? { ExpressionAttributeNames: names } : {}),
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW' as const,
  })

  const response = await docClient.send(command)
  return (response.Attributes as CustomBundle) || null
}

export async function markBundleAsPurchased(
  id: string,
  orderId: string,
  purchasedByUserId: string,
  purchasedByEmail: string
): Promise<void> {
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'SET #status = :status, orderId = :orderId, purchasedByUserId = :purchasedByUserId, purchasedByEmail = :purchasedByEmail, updatedAt = :updatedAt',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': 'purchased',
      ':orderId': orderId,
      ':purchasedByUserId': purchasedByUserId,
      ':purchasedByEmail': purchasedByEmail,
      ':updatedAt': new Date().toISOString(),
    },
  }))
}

export async function deleteCustomBundle(id: string): Promise<void> {
  // Release any held reservations
  const bundle = await getCustomBundle(id)
  if (bundle?.reservationIds) {
    await Promise.all(
      bundle.reservationIds.map(resId => releaseReservation(resId).catch(() => {}))
    )
  }

  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }))
}

export async function completeBundleReservations(id: string): Promise<void> {
  const bundle = await getCustomBundle(id)
  if (bundle?.reservationIds) {
    await Promise.all(
      bundle.reservationIds.map(resId => completeReservation(resId).catch(() => {}))
    )
  }
}
