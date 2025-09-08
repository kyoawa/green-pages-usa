import { NextResponse } from "next/server"
import { InventoryDB } from "@/lib/dynamodb"

// If you prefer stronger freshness on Vercel/app router:
export const dynamic = "force-dynamic"

const AD_ORDER = { single: 0, quarter: 1, half: 2, full: 3 }

export async function GET(request, { params }) {
  const rawState = params?.state
  if (!rawState) {
    return NextResponse.json({ message: "Missing state param" }, { status: 400 })
  }

  const db = new InventoryDB()

  try {
    const inventory = await db.getInventoryByState(String(rawState).trim())

    if (!inventory || inventory.length === 0) {
      return NextResponse.json(
        { message: "No inventory for this state" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      )
    }

    // Stable, user-friendly ordering
    inventory.sort((a, b) => {
      const ao = AD_ORDER[a?.adType] ?? 99
      const bo = AD_ORDER[b?.adType] ?? 99
      if (ao !== bo) return ao - bo
      // tie-break by price ascending
      return (a?.price ?? 0) - (b?.price ?? 0)
    })

    // Shape for frontend (kept exactly as you had it)
    const formattedInventory = inventory.map((item) => ({
      id: item.adType, // canonical id your checkout uses
      title: item.title,
      price: item.price,
      remaining: `${item.inventory}/${item.totalSlots} REMAINING`,
      inventory: item.inventory,      // number remaining
      total_slots: item.totalSlots,   // snake_case to match AdData
      description: item.description,
    }))

    return new NextResponse(JSON.stringify(formattedInventory), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // ensure fresh counts right after purchases
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ message: "Error fetching inventory" }, { status: 500 })
  }
}