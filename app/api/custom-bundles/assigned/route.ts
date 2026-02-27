export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCustomBundlesForUser } from '@/lib/custom-bundles'

// GET bundles assigned to the current user (active/unpurchased only)
export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bundles = await getCustomBundlesForUser(userId)
    const activeBundles = bundles.filter(b => {
      if (b.status !== 'active') return false
      if (b.expiresAt && new Date(b.expiresAt) < new Date()) return false
      return true
    })

    return NextResponse.json(activeBundles.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      state: b.state,
      items: b.items,
      retailValue: b.retailValue,
      totalPrice: b.totalPrice,
      accessToken: b.accessToken,
      expiresAt: b.expiresAt,
      createdAt: b.createdAt,
    })))
  } catch (error) {
    console.error('Error fetching assigned bundles:', error)
    return NextResponse.json([])
  }
}
