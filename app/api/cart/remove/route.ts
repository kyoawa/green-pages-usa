import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { removeFromCart, getCart } from "@/lib/cart"
import { releaseReservation } from "@/lib/reservations"

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { itemId } = body

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      )
    }

    // Get cart to find reservation ID
    const cart = await getCart(userId)

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    const cartItem = cart.items.find((item) => item.itemId === itemId)

    if (!cartItem) {
      return NextResponse.json(
        { error: "Item not in cart" },
        { status: 404 }
      )
    }

    // Release the reservation
    try {
      await releaseReservation(cartItem.reservationId)
    } catch (error) {
      console.error("Failed to release reservation:", error)
      // Continue with cart removal even if reservation release fails
    }

    // Remove from cart
    const updatedCart = await removeFromCart(userId, itemId)

    return NextResponse.json(
      {
        success: true,
        cart: updatedCart,
        message: "Item removed from cart",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error removing from cart:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
