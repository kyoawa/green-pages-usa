import { NextResponse } from "next/server"
import { InventoryDB } from "@/lib/dynamodb"

export async function POST(request) {
  let payload = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const { state, adType } = payload || {}
  let { decreaseBy = 1 } = payload || {}

  // basic validation
  if (!state || !adType) {
    return NextResponse.json(
      { success: false, message: "Missing required fields: state and adType" },
      { status: 400 }
    )
  }

  decreaseBy = Number.isFinite(Number(decreaseBy)) ? Math.max(1, Math.floor(Number(decreaseBy))) : 1

  const db = new InventoryDB()

  try {
    // state should be a 2-letter code; adType should match your canonical id (e.g., "half")
    const updatedItem = await db.updateInventory(state, adType, decreaseBy)

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully",
      newInventory: updatedItem?.inventory ?? null,
      item: updatedItem ?? null
    })
  } catch (error) {
    // Normalize the known "out of stock" message
    const msg = String(error?.message || "")
    const isOOS =
      msg.toLowerCase().includes("not enough inventory") ||
      msg.toLowerCase().includes("insufficient inventory") ||
      msg.toLowerCase().includes("conditionalcheckfailed")

    if (isOOS) {
      return NextResponse.json(
        { success: false, message: "Not enough inventory available" },
        { status: 400 }
      )
    }

    console.error("Error updating inventory:", error)
    return NextResponse.json(
      { success: false, message: "Error updating inventory" },
      { status: 500 }
    )
  }
}