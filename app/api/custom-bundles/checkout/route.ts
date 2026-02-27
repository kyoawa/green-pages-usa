export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getCustomBundle } from '@/lib/custom-bundles'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { bundleId, customerEmail, customerName, customerPhone } = await request.json()

    if (!bundleId) {
      return NextResponse.json({ error: 'Bundle ID is required' }, { status: 400 })
    }

    const bundle = await getCustomBundle(bundleId)

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    if (bundle.status !== 'active') {
      return NextResponse.json({ error: 'This bundle is no longer available' }, { status: 410 })
    }

    if (bundle.expiresAt && new Date(bundle.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This bundle has expired' }, { status: 410 })
    }

    const cents = Math.round(bundle.totalPrice * 100)

    if (!Number.isFinite(cents) || cents <= 0) {
      return NextResponse.json({ error: 'Invalid bundle price' }, { status: 400 })
    }

    const itemsSummary = bundle.items.map(i => `${i.quantity}x ${i.title}`).join(', ')

    const paymentIntent = await stripe.paymentIntents.create({
      amount: cents,
      currency: 'usd',
      metadata: {
        checkoutType: 'custom_bundle',
        bundleId: bundle.id,
        bundleState: bundle.state,
        customerEmail: customerEmail || '',
        customerName: customerName || '',
        customerPhone: customerPhone || '',
      },
      description: `Custom Bundle: ${bundle.name} (${itemsSummary})`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating bundle payment intent:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
