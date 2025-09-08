export interface AdInventory {
  id: string
  state_code: string
  state_name: string
  ad_type: string
  price: number // price in cents
  total_quantity: number
  remaining_quantity: number
  created_at: string
  updated_at: string
}

export interface CustomerOrder {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  company_name?: string
  billing_address: {
    street: string
    city: string
    state: string
    zip: string
  }
  shipping_address?: {
    street: string
    city: string
    state: string
    zip: string
  }
  state_code: string
  state_name: string
  ad_type: string
  ad_price: number // price in cents
  tax_amount: number // tax in cents
  total_amount: number // total in cents
  payment_status: "pending" | "paid" | "failed"
  order_status: "pending" | "confirmed" | "processing" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}
