export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { validateDiscountCode, calculateCodeDiscount, getBestDiscount } from '@/lib/discounts'
import type { CartItem } from '@/lib/discounts'

// POST - Validate and calculate discount
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, items, subtotal } = body

    if (!items || !subtotal) {
      return NextResponse.json({ error: 'Missing cart data' }, { status: 400 })
    }

    // If no code provided, just return the best bundle discount
    if (!code) {
      const bestDiscount = await getBestDiscount(items as CartItem[], subtotal)
      return NextResponse.json({
        valid: bestDiscount.type !== 'none',
        discount: bestDiscount
      })
    }

    // Validate the discount code
    const validation = await validateDiscountCode(code, subtotal)

    if (!validation.valid) {
      // Still check for bundle discounts
      const bestDiscount = await getBestDiscount(items as CartItem[], subtotal)
      return NextResponse.json({
        valid: false,
        error: validation.error,
        discount: bestDiscount
      })
    }

    // Code is valid - calculate and compare with bundle
    const bestDiscount = await getBestDiscount(items as CartItem[], subtotal, code)

    // If bundle is better, let user know
    if (bestDiscount.type === 'bundle') {
      return NextResponse.json({
        valid: true,
        discount: bestDiscount,
        message: 'Your bundle discount is better than this code!'
      })
    }

    return NextResponse.json({
      valid: true,
      discount: bestDiscount
    })
  } catch (error) {
    console.error('Error applying discount:', error)
    return NextResponse.json({ error: 'Failed to apply discount' }, { status: 500 })
  }
}
