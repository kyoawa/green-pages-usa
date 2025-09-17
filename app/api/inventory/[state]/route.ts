// app/api/inventory/[state]/route.ts
import { NextResponse } from 'next/server'
import { InventoryDB } from '@/lib/dynamodb'

export async function GET(
  request: Request,
  { params }: { params: { state: string } }
) {
  const { state } = params
  const db = new InventoryDB()
  
  try {
    // Handle both state codes (AL) and names (alabama)
    let stateCode = state.toUpperCase()
    
    // If it's not a 2-letter code, it's probably a name - use first 2 letters
    if (stateCode.length !== 2) {
      // For now, simple mapping - just take first 2 letters
      stateCode = stateCode.substring(0, 2)
    }
    
    console.log(`Fetching inventory for state: ${stateCode}`)
    
    const inventory = await db.getInventoryByState(stateCode)
    
    // Return empty array if no inventory (not an error)
    if (!inventory || inventory.length === 0) {
      return NextResponse.json([])
    }
    
    const formattedInventory = inventory.map((item: any) => ({
      id: item.adType || item.id,
      title: item.title,
      price: item.price,
      remaining: `${item.inventory}/${item.totalSlots} REMAINING`,
      inventory: item.inventory,
      total_slots: item.totalSlots || item.total_slots,
      description: item.description
    }))
    
    return NextResponse.json(formattedInventory)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json([])
  }
}