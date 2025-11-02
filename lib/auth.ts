import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Check if the current user is authenticated
 * Returns the userId if authenticated, or a 401 response if not
 */
export async function requireAuth() {
  const { userId } = await auth()

  if (!userId) {
    return {
      userId: null,
      unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return { userId, unauthorized: null }
}
