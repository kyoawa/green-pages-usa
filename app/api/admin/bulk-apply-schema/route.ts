import { NextRequest, NextResponse } from 'next/server'
import { InventoryDB } from '@/lib/dynamodb.js'

const db = new InventoryDB()

export async function POST(request: NextRequest) {
  try {
    const { schema, adIds } = await request.json()

    if (!schema || !adIds || !Array.isArray(adIds)) {
      return NextResponse.json(
        { error: 'Schema and adIds array are required' },
        { status: 400 }
      )
    }

    const results = []

    for (const adId of adIds) {
      try {
        // adId format: "STATE#adType" (e.g., "CA#single")
        const [state, adType] = adId.split('#')

        if (!state || !adType) {
          results.push({ adId, success: false, error: 'Invalid ad ID format' })
          continue
        }

        await db.updateAdDetails(state, adType, { uploadSchema: schema })
        results.push({ adId, success: true })
      } catch (error: any) {
        results.push({ adId, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      total: adIds.length,
      successCount,
      failCount,
      results
    })
  } catch (error) {
    console.error('Error bulk applying schema:', error)
    return NextResponse.json(
      { error: 'Failed to bulk apply schema' },
      { status: 500 }
    )
  }
}
