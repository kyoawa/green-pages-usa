import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getCartWithTotals } from "@/lib/cart"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get cart with calculated totals
    const cart = await getCartWithTotals(userId)

    if (!cart) {
      return NextResponse.json(
        {
          userId,
          items: [],
          subtotal: 0,
          total: 0,
          itemCount: 0,
          createdAt: null,
          updatedAt: null,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(cart, { status: 200 })
  } catch (error: any) {
    console.error("Error getting cart:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
