import { NextRequest, NextResponse } from "next/server"
import { markItemAsUploaded } from "@/lib/orders"

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const body = await request.json()
    const { itemId } = body

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      )
    }

    await markItemAsUploaded(orderId, itemId)

    return NextResponse.json({
      success: true,
      message: "Item marked as uploaded"
    })
  } catch (error) {
    console.error("Error marking item as uploaded:", error)
    return NextResponse.json(
      { error: "Failed to mark item as uploaded" },
      { status: 500 }
    )
  }
}
