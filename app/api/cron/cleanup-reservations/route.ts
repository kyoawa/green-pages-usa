import { NextRequest, NextResponse } from "next/server"
import { cleanupExpiredReservations } from "@/lib/reservations"

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for security)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Running reservation cleanup cron job...")

    const cleanedCount = await cleanupExpiredReservations()

    return NextResponse.json(
      {
        success: true,
        cleanedCount,
        message: `Cleaned up ${cleanedCount} expired reservations`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error in cleanup cron job:", error)
    return NextResponse.json(
      { error: error.message || "Failed to cleanup reservations" },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
