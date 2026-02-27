export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getCustomBundle, markBundleAsPurchased, completeBundleReservations } from '@/lib/custom-bundles'
import { createOrder, initializeSlotSubmissions } from '@/lib/orders'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { paymentIntentId, customerData } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not yet succeeded' }, { status: 400 })
    }

    const { bundleId, bundleState, customerEmail, customerName, customerPhone } = paymentIntent.metadata

    if (!bundleId) {
      return NextResponse.json({ error: 'Missing bundle information in payment' }, { status: 400 })
    }

    const bundle = await getCustomBundle(bundleId)

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    if (bundle.status !== 'active') {
      return NextResponse.json({ error: 'Bundle already purchased or expired' }, { status: 400 })
    }

    // Complete reservations (marks them as completed so they stop counting as active holds)
    try {
      await completeBundleReservations(bundleId)
    } catch (error) {
      console.error('Failed to complete bundle reservations:', error)
    }

    // Update actual inventory counts for each item
    const updatePromises = bundle.items.map(async (item) => {
      const updateResponse = await fetch(`${new URL(request.url).origin}/api/update-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: bundleState,
          adType: item.adType,
          decreaseBy: item.quantity,
        }),
      })

      if (!updateResponse.ok) {
        console.error('Inventory update failed for:', item.adType, await updateResponse.text())
        throw new Error(`Failed to update inventory for ${bundleState}#${item.adType}`)
      }
    })

    try {
      await Promise.all(updatePromises)
    } catch (error: any) {
      console.error('MANUAL ACTION REQUIRED - Bundle inventory update failed:', {
        paymentIntentId,
        bundleId,
        items: bundle.items,
        error: error.message,
      })
      return NextResponse.json({
        error: 'Payment succeeded but some inventory updates failed',
      }, { status: 500 })
    }

    // Create order — proportionally allocate totalPrice across items by retail value
    const email = customerData?.email || customerEmail || paymentIntent.receipt_email || 'unknown'
    const name = customerData?.fullName || customerName || 'Unknown'
    const phone = customerData?.phone || customerPhone || ''
    const purchaserUserId = customerData?.userId || 'guest'

    const items = bundle.items.map(item => {
      const itemRetailTotal = item.unitPrice * item.quantity
      const proportion = bundle.retailValue > 0 ? itemRetailTotal / bundle.retailValue : 1 / bundle.items.length
      const allocatedPrice = Math.round(bundle.totalPrice * proportion * 100) / 100 / item.quantity

      return {
        itemId: `${bundleState}#${item.adType}`,
        state: bundleState,
        adType: item.adType,
        title: item.title,
        price: allocatedPrice,
        quantity: item.quantity,
        reservationId: '',
      }
    })

    const slotSubmissions: Record<string, any> = {}
    items.forEach(item => {
      const itemKey = item.itemId.replace(/[#]/g, '_')
      slotSubmissions[itemKey] = initializeSlotSubmissions(item.itemId, item.quantity)
    })

    const orderData = {
      orderId: paymentIntentId,
      userId: purchaserUserId,
      customerEmail: email,
      customerName: name,
      customerPhone: phone,
      items,
      subtotal: bundle.retailValue,
      total: bundle.totalPrice,
      createdAt: new Date().toISOString(),
      uploadStatus: {} as Record<string, boolean>,
      slotSubmissions,
      customBundleId: bundle.id,
      discountType: 'custom_bundle',
      discountAmount: bundle.retailValue - bundle.totalPrice,
      discountDescription: `Custom Bundle: ${bundle.name}`,
    }

    await createOrder(orderData as any)

    // Mark the bundle as purchased
    await markBundleAsPurchased(bundleId, paymentIntentId, purchaserUserId, email)

    return NextResponse.json({
      success: true,
      orderId: paymentIntentId,
      message: 'Payment confirmed and order created',
    })
  } catch (error: any) {
    console.error('Error confirming bundle payment:', error)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
