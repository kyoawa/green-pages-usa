"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function fetchInventory(stateName: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("ad_inventory").select("*").eq("state_name", stateName)

  if (error) {
    console.error("Error fetching inventory:", error)
    return { success: false, error: error.message }
  }

  const formattedAds = data.map((item) => ({
    id: item.id,
    title: `${item.ad_type.toUpperCase()} - $${item.price / 100}`,
    price: item.price / 100,
    remaining: `${item.remaining_quantity}/${item.total_quantity} REMAINING`,
    description: item.ad_type,
    quantity_available: item.remaining_quantity,
  }))

  return { success: true, data: formattedAds }
}

export async function createOrder(orderData: {
  orderNumber: string
  customerName: string
  customerEmail: string
  billingAddress: any
  shippingAddress: any
  stateCode: string
  stateName: string
  adType: string
  adPrice: number
  totalAmount: number
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("customer_orders")
    .insert({
      order_number: orderData.orderNumber,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      billing_address: orderData.billingAddress,
      shipping_address: orderData.shippingAddress,
      state_code: orderData.stateCode,
      state_name: orderData.stateName,
      ad_type: orderData.adType,
      ad_price: orderData.adPrice,
      total_amount: orderData.totalAmount,
      payment_status: "pending",
      order_status: "pending",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating order:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateOrderWithUploadData(
  orderId: string,
  uploadData: {
    companyName: string
    uploadRequirements: any
  },
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("customer_orders")
    .update({
      company_name: uploadData.companyName,
      upload_requirements: uploadData.uploadRequirements,
      order_status: "completed",
    })
    .eq("id", orderId)

  if (error) {
    console.error("Error updating order:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
