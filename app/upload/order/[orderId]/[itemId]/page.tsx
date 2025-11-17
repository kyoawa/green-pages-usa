"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import MultiSlotUpload from '@/components/MultiSlotUpload'
import { Order, OrderItem, SlotSubmission } from '@/lib/orders'

export default function UploadOrderItemPage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItem, setOrderItem] = useState<OrderItem | null>(null)
  const [existingSlots, setExistingSlots] = useState<SlotSubmission[]>([])

  const orderId = params.orderId as string
  const itemId = decodeURIComponent(params.itemId as string)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
      return
    }

    fetchOrderData()
  }, [isSignedIn, orderId, itemId])

  const fetchOrderData = async () => {
    try {
      // Fetch the order
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Order not found')
      }

      const orderData = await response.json()
      setOrder(orderData)

      console.log('Looking for item:', itemId)
      console.log('Available items:', orderData.items.map((i: OrderItem) => i.itemId))

      // Find the specific item
      const item = orderData.items.find((i: OrderItem) => i.itemId === itemId)
      if (!item) {
        throw new Error('Item not found in order')
      }

      setOrderItem(item)

      // Get existing slot submissions
      const sanitizedItemId = itemId.replace(/[#]/g, "_")
      const slots = orderData.slotSubmissions?.[sanitizedItemId] || []
      setExistingSlots(slots)

    } catch (error) {
      console.error('Error fetching order:', error)
      alert('Failed to load order. Redirecting to orders page.')
      router.push('/account/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    // Redirect to orders page with success message
    router.push('/account/orders?uploaded=true')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="text-white text-xl">Loading upload form...</div>
        </div>
      </div>
    )
  }

  if (!order || !orderItem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <button
            onClick={() => router.push('/account/orders')}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded"
          >
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <MultiSlotUpload
      orderId={orderId}
      orderItem={orderItem}
      customerInfo={{
        email: order.customerEmail,
        fullName: order.customerName,
        phone: order.customerPhone
      }}
      existingSlots={existingSlots}
      onComplete={handleComplete}
    />
  )
}
