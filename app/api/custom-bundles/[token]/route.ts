export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCustomBundleByToken, updateCustomBundle } from '@/lib/custom-bundles'

// GET bundle by access token (public, no auth required)
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const bundle = await getCustomBundleByToken(params.token)

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    if (bundle.status !== 'active') {
      return NextResponse.json({ error: 'This bundle is no longer available' }, { status: 410 })
    }

    if (bundle.expiresAt && new Date(bundle.expiresAt) < new Date()) {
      // Mark as expired so inventory reservations are clearly released
      await updateCustomBundle(bundle.id, { status: 'expired' }).catch(() => {})
      return NextResponse.json({ error: 'This bundle has expired. The reserved inventory has been released.' }, { status: 410 })
    }

    // Return only customer-facing fields
    return NextResponse.json({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      state: bundle.state,
      items: bundle.items,
      retailValue: bundle.retailValue,
      totalPrice: bundle.totalPrice,
      expiresAt: bundle.expiresAt,
    })
  } catch (error) {
    console.error('Error fetching bundle by token:', error)
    return NextResponse.json({ error: 'Failed to fetch bundle' }, { status: 500 })
  }
}
