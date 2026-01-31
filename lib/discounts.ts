import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
})

const docClient = DynamoDBDocumentClient.from(client)

const BUNDLE_DEALS_TABLE = 'green-pages-bundle-deals'
const DISCOUNT_CODES_TABLE = 'green-pages-discount-codes'

// Types
export interface BundleDeal {
  id: string
  name: string
  adType: string // "single", "quarter", etc. or "all"
  minQuantity: number
  discountPercent: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface DiscountCode {
  code: string // Primary key
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  maxUses?: number
  currentUses: number
  expiresAt?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  itemId: string
  state: string
  adType: string
  title: string
  price: number
  quantity: number
}

export interface AppliedDiscount {
  type: 'bundle' | 'code' | 'none'
  name: string
  amount: number
  description: string
}

// Fetch all active bundle deals
export async function getActiveBundleDeals(): Promise<BundleDeal[]> {
  try {
    const command = new ScanCommand({
      TableName: BUNDLE_DEALS_TABLE,
      FilterExpression: 'active = :active',
      ExpressionAttributeValues: {
        ':active': true
      }
    })
    const response = await docClient.send(command)
    return (response.Items || []) as BundleDeal[]
  } catch (error) {
    console.error('Error fetching bundle deals:', error)
    return []
  }
}

// Fetch a discount code by code
export async function getDiscountCode(code: string): Promise<DiscountCode | null> {
  try {
    const command = new GetCommand({
      TableName: DISCOUNT_CODES_TABLE,
      Key: { code: code.toUpperCase() }
    })
    const response = await docClient.send(command)
    return response.Item as DiscountCode || null
  } catch (error) {
    console.error('Error fetching discount code:', error)
    return null
  }
}

// Validate a discount code
export async function validateDiscountCode(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; error?: string; discount?: DiscountCode }> {
  const discount = await getDiscountCode(code)

  if (!discount) {
    return { valid: false, error: 'Invalid discount code' }
  }

  if (!discount.active) {
    return { valid: false, error: 'This discount code is no longer active' }
  }

  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    return { valid: false, error: 'This discount code has expired' }
  }

  if (discount.maxUses && discount.currentUses >= discount.maxUses) {
    return { valid: false, error: 'This discount code has reached its usage limit' }
  }

  if (discount.minOrderAmount && subtotal < discount.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order of $${discount.minOrderAmount} required for this code`
    }
  }

  return { valid: true, discount }
}

// Calculate discount amount from a discount code
export function calculateCodeDiscount(subtotal: number, discount: DiscountCode): number {
  if (discount.discountType === 'percentage') {
    return Math.round((subtotal * discount.discountValue / 100) * 100) / 100
  } else {
    return Math.min(discount.discountValue, subtotal) // Can't discount more than subtotal
  }
}

// Calculate bundle discount for cart items
export function calculateBundleDiscount(
  items: CartItem[],
  bundleDeals: BundleDeal[]
): { amount: number; appliedBundles: { deal: BundleDeal; itemsAffected: number; discount: number }[] } {
  const appliedBundles: { deal: BundleDeal; itemsAffected: number; discount: number }[] = []
  let totalDiscount = 0

  // Group items by adType
  const itemsByType: Record<string, { totalQty: number; totalPrice: number }> = {}

  for (const item of items) {
    if (!itemsByType[item.adType]) {
      itemsByType[item.adType] = { totalQty: 0, totalPrice: 0 }
    }
    itemsByType[item.adType].totalQty += item.quantity
    itemsByType[item.adType].totalPrice += item.price * item.quantity
  }

  // Check each bundle deal
  for (const deal of bundleDeals) {
    if (!deal.active) continue

    // Check if deal applies to specific ad type or all
    const applicableTypes = deal.adType === 'all'
      ? Object.keys(itemsByType)
      : [deal.adType]

    for (const adType of applicableTypes) {
      const typeData = itemsByType[adType]
      if (!typeData) continue

      // Check if quantity meets minimum
      if (typeData.totalQty >= deal.minQuantity) {
        const discount = Math.round((typeData.totalPrice * deal.discountPercent / 100) * 100) / 100
        totalDiscount += discount
        appliedBundles.push({
          deal,
          itemsAffected: typeData.totalQty,
          discount
        })
      }
    }
  }

  return { amount: totalDiscount, appliedBundles }
}

// Get the best discount (bundle vs code) - only one applies
export async function getBestDiscount(
  items: CartItem[],
  subtotal: number,
  discountCode?: string
): Promise<AppliedDiscount> {
  // Get bundle discount
  const bundleDeals = await getActiveBundleDeals()
  const bundleResult = calculateBundleDiscount(items, bundleDeals)

  // Get code discount if provided
  let codeDiscount = 0
  let codeDetails: DiscountCode | null = null

  if (discountCode) {
    const validation = await validateDiscountCode(discountCode, subtotal)
    if (validation.valid && validation.discount) {
      codeDetails = validation.discount
      codeDiscount = calculateCodeDiscount(subtotal, validation.discount)
    }
  }

  // Return the better discount
  if (bundleResult.amount > 0 && bundleResult.amount >= codeDiscount) {
    // Bundle wins
    const bundleNames = bundleResult.appliedBundles.map(b => b.deal.name).join(', ')
    return {
      type: 'bundle',
      name: bundleNames,
      amount: bundleResult.amount,
      description: `Bundle Deal: ${bundleNames}`
    }
  } else if (codeDiscount > 0 && codeDetails) {
    // Code wins
    return {
      type: 'code',
      name: codeDetails.code,
      amount: codeDiscount,
      description: `Discount Code: ${codeDetails.code}`
    }
  }

  // No discount
  return {
    type: 'none',
    name: '',
    amount: 0,
    description: ''
  }
}

// Increment discount code usage (call after successful payment)
export async function incrementDiscountCodeUsage(code: string): Promise<boolean> {
  try {
    const command = new UpdateCommand({
      TableName: DISCOUNT_CODES_TABLE,
      Key: { code: code.toUpperCase() },
      UpdateExpression: 'SET currentUses = currentUses + :inc, updatedAt = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':now': new Date().toISOString()
      }
    })
    await docClient.send(command)
    return true
  } catch (error) {
    console.error('Error incrementing discount code usage:', error)
    return false
  }
}
