export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCustomBundle, updateCustomBundle, deleteCustomBundle } from '@/lib/custom-bundles'

// GET single custom bundle
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bundle = await getCustomBundle(params.id)
    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }
    return NextResponse.json(bundle)
  } catch (error) {
    console.error('Error fetching custom bundle:', error)
    return NextResponse.json({ error: 'Failed to fetch bundle' }, { status: 500 })
  }
}

// PUT update custom bundle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await getCustomBundle(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }
    if (existing.status === 'purchased') {
      return NextResponse.json({ error: 'Cannot edit a purchased bundle' }, { status: 400 })
    }

    const body = await request.json()
    const updated = await updateCustomBundle(params.id, body)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating custom bundle:', error)
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 })
  }
}

// DELETE custom bundle
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await getCustomBundle(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }
    if (existing.status === 'purchased') {
      return NextResponse.json({ error: 'Cannot delete a purchased bundle' }, { status: 400 })
    }

    await deleteCustomBundle(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom bundle:', error)
    return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 })
  }
}
