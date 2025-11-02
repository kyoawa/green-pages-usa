import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { clearCart, getCart } from "@/lib/cart"
import { releaseReservation } from "@/lib/reservations"

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get cart to find all reservation IDs
    const cart = await getCart(userId)

    if (cart && cart.items.length > 0) {
      // Release all reservations
      const releasePromises = cart.items.map((item) =>
        releaseReservation(item.reservationId).catch((error) => {
          console.error(`Failed to release reservation ${item.reservationId}:`, error)
          // Continue even if some reservations fail to release
        })
      )

      await Promise.all(releasePromises)
    }

    // Clear the cart
    await clearCart(userId)

    return NextResponse.json(
      {
        success: true,
        message: "Cart cleared successfully",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error clearing cart:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
