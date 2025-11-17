"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import MultiSlotUpload from '@/components/MultiSlotUpload'

interface OrderItem {
  itemId: string
  state: string
  adType: string
  title: string
  price: number
  quantity: number
  reservationId: string
}

interface SlotSubmission {
  slotNumber: number
  submissionId: string | null
  status: 'pending' | 'completed'
  submittedAt?: string
  lastEditedAt?: string
}

function CartUploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('paymentIntentId')

  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customerInfo, setCustomerInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [slotSubmissions, setSlotSubmissions] = useState<{ [itemId: string]: SlotSubmission[] }>({})

  useEffect(() => {
    if (!paymentIntentId) {
      alert('Missing payment information')
      router.push('/')
      return
    }

    fetchOrderDetails()
  }, [paymentIntentId, router])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${paymentIntentId}`)

      if (response.ok) {
        const order = await response.json()
        setOrderItems(order.items)
        setCustomerInfo({
          email: order.customerEmail,
          fullName: order.customerName,
          phone: order.customerPhone
        })

        // Initialize slot submissions from order data
        if (order.slotSubmissions) {
          setSlotSubmissions(order.slotSubmissions)
        }
      } else {
        alert('Could not load order details. Please contact support.')
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      alert('Error loading order details')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSlotComplete = async () => {
    // Refresh order data to get updated slot submissions
    await fetchOrderDetails()

    // Re-check after refresh to see if all items are complete
    const response = await fetch(`/api/orders/${paymentIntentId}`)
    if (response.ok) {
      const order = await response.json()
      const updatedSlotSubmissions = order.slotSubmissions || {}

      // Check if all items are complete
      const allComplete = orderItems.every(item => {
        const itemKey = item.itemId.replace(/[#]/g, "_")
        const itemSlots = updatedSlotSubmissions[itemKey] || []
        return itemSlots.length === item.quantity && itemSlots.every((s: any) => s.status === 'completed')
      })

      if (allComplete) {
        // All items uploaded - redirect to thank you page
        router.push('/thank-you')
      } else {
        // Move to next item if available
        if (currentItemIndex < orderItems.length - 1) {
          setCurrentItemIndex(currentItemIndex + 1)
        } else {
          // User clicked "finish later" - still go to thank you page
          router.push('/thank-you')
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (orderItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No items found</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-8 rounded-full transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const currentItem = orderItems[currentItemIndex]
  const existingSlots = slotSubmissions[currentItem.itemId] || []

  return (
    <div className="min-h-screen bg-black">
      {/* Progress Bar */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {orderItems.map((item, index) => {
                const itemSlots = slotSubmissions[item.itemId] || []
                const isComplete = itemSlots.length === item.quantity &&
                                 itemSlots.every(s => s.status === 'completed')
                const isCurrent = index === currentItemIndex

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isCurrent ? 'bg-green-500 text-black' :
                      isComplete ? 'bg-green-900 text-green-400' :
                      'bg-gray-800 text-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCurrent ? 'bg-black text-green-400' :
                      isComplete ? 'bg-green-400 text-black' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-bold text-sm">{item.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Slot Upload Component */}
      <MultiSlotUpload
        orderId={paymentIntentId!}
        orderItem={currentItem}
        customerInfo={customerInfo}
        existingSlots={existingSlots}
        onComplete={handleSlotComplete}
      />
    </div>
  )
}

export default function CartUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CartUploadContent />
    </Suspense>
  )
}
