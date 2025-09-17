import { NextResponse } from 'next/server'
import { InventoryDB } from '@/lib/dynamodb'

export async function GET(request, { params }) {
  const { state } = params
  const db = new InventoryDB()
  
  try {
    // Try to use the new active-only method if it exists
    if (typeof db.getActiveInventoryByState === 'function') {
      const inventory = await db.getActiveInventoryByState(state.toUpperCase())
      return NextResponse.json(inventory)
    } 
    // Fallback to existing method and filter active ads
    else {
      const allInventory = await db.getInventoryByState(state.toUpperCase())
      // Filter out inactive ads (if active field exists and is false)
      const activeInventory = allInventory.filter(item => item.active !== false)
      
      // Format for compatibility with your existing UI
      const formattedInventory = activeInventory.map(item => ({
        id: item.adType || item.id,
        title: item.title,
        price: item.price,
        remaining: `${item.inventory}/${item.totalSlots} REMAINING`,
        inventory: item.inventory,
        total_slots: item.totalSlots,
        description: item.description,
        state: item.state,
        adType: item.adType
      }))
      
      return NextResponse.json(formattedInventory)
    }
  } catch (error) {
    console.error('Error fetching active inventory:', error)
    return NextResponse.json(
      { message: 'Error fetching inventory' }, 
      { status: 500 }
    )
  }
}