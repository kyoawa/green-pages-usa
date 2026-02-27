export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createCustomBundle, getAllCustomBundles, updateCustomBundle } from '@/lib/custom-bundles'

// GET all custom bundles
export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bundles = await getAllCustomBundles()

    // Auto-expire active bundles past their expiry date
    const now = new Date()
    for (const bundle of bundles) {
      if (bundle.status === 'active' && bundle.expiresAt && new Date(bundle.expiresAt) < now) {
        bundle.status = 'expired'
        updateCustomBundle(bundle.id, { status: 'expired' }).catch(() => {})
      }
    }

    return NextResponse.json(bundles)
  } catch (error) {
    console.error('Error fetching custom bundles:', error)
    return NextResponse.json([])
  }
}

// POST create new custom bundle
export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, state, items, totalPrice, deliveryMethod, assignedEmail, expiresAt } = body

    if (!name || !state || !items || !items.length || totalPrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let assignedUserId: string | undefined

    if (deliveryMethod === 'account' && assignedEmail) {
      const clerk = await clerkClient()
      const users = await clerk.users.getUserList({ emailAddress: [assignedEmail] })
      if (users.data.length === 0) {
        return NextResponse.json(
          { error: 'No account found for that email. The customer must sign up first, or use shareable link delivery instead.' },
          { status: 400 }
        )
      }
      assignedUserId = users.data[0].id
    }

    const bundle = await createCustomBundle({
      name,
      description,
      state,
      items,
      totalPrice: Number(totalPrice),
      deliveryMethod: deliveryMethod || 'link',
      assignedUserId,
      assignedEmail: deliveryMethod === 'account' ? assignedEmail : undefined,
      expiresAt: expiresAt || undefined,
      createdBy: userId,
    })

    return NextResponse.json(bundle)
  } catch (error) {
    console.error('Error creating custom bundle:', error)
    return NextResponse.json({ error: 'Failed to create custom bundle' }, { status: 500 })
  }
}
