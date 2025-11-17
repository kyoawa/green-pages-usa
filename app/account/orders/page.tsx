"use client"

import { useState, useEffect, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react'

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

interface Order {
  orderId: string
  userId: string
  customerEmail: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  total: number
  createdAt: string
  uploadStatus: { [itemId: string]: boolean }
  slotSubmissions?: { [itemId: string]: SlotSubmission[] }
}

function AccountOrdersContent() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showPaymentSuccessMessage, setShowPaymentSuccessMessage] = useState(false)
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
      return
    }

    // Show success message if coming from upload flow
    if (searchParams.get('uploaded') === 'true') {
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }

    // Show payment success message if coming from checkout
    if (searchParams.get('uploaded') === 'false') {
      setShowPaymentSuccessMessage(true)
      const orderId = searchParams.get('orderId')
      if (orderId) {
        setHighlightOrderId(orderId)
      }
      setTimeout(() => {
        setShowPaymentSuccessMessage(false)
        setHighlightOrderId(null)
      }, 10000)
    }

    fetchOrders()
  }, [isSignedIn, router, searchParams])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        console.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getItemUploadStatus = (order: Order, itemId: string): boolean => {
    const sanitizedItemId = itemId.replace(/[#]/g, "_")

    // Check new slot-based tracking first
    if (order.slotSubmissions?.[sanitizedItemId]) {
      const slots = order.slotSubmissions[sanitizedItemId]
      // Check if all slots are completed
      const allSlotsCompleted = slots.every((slot: SlotSubmission) => slot.status === 'completed')
      return allSlotsCompleted
    }

    // Fallback to old uploadStatus for backward compatibility
    return order.uploadStatus?.[sanitizedItemId] || false
  }

  const getSlotCompletionForItem = (order: Order, item: OrderItem): { completed: number, total: number } => {
    const sanitizedItemId = item.itemId.replace(/[#]/g, "_")
    const slots = order.slotSubmissions?.[sanitizedItemId] || []

    if (slots.length === 0) {
      // Legacy: use old uploadStatus
      return {
        completed: getItemUploadStatus(order, item.itemId) ? item.quantity : 0,
        total: item.quantity
      }
    }

    return {
      completed: slots.filter(s => s.status === 'completed').length,
      total: item.quantity
    }
  }

  const handleUploadClick = (orderId: string, itemId?: string) => {
    if (itemId) {
      // Encode the itemId to handle special characters like #
      const encodedItemId = encodeURIComponent(itemId)
      router.push(`/upload/order/${orderId}/${encodedItemId}`)
    } else {
      router.push(`/upload/cart?paymentIntentId=${orderId}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="text-white text-xl">Loading your orders...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 tracking-wider">YOUR ORDERS</h1>

        {/* Upload Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-600/20 border-2 border-green-500 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <p className="text-green-400">Upload completed successfully! Thank you.</p>
          </div>
        )}

        {/* Payment Success Message */}
        {showPaymentSuccessMessage && (
          <div className="mb-6 p-4 bg-blue-600/20 border-2 border-blue-500 rounded-md">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-blue-400 mr-3" />
              <p className="text-blue-400 font-bold">Payment Successful!</p>
            </div>
            <p className="text-gray-300 text-sm">
              Your order has been placed. Please upload the required information for each item below.
            </p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl mb-4">No orders found</p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-8 rounded-full transition-colors"
            >
              START SHOPPING
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              // Check if all items have all slots completed
              const allItemsUploaded = order.items.every(item => {
                const slotCompletion = getSlotCompletionForItem(order, item)
                return slotCompletion.completed === slotCompletion.total
              })
              const uploadedCount = order.items.filter(item => {
                const slotCompletion = getSlotCompletionForItem(order, item)
                return slotCompletion.completed === slotCompletion.total
              }).length

              const isHighlighted = highlightOrderId === order.orderId

              return (
                <div
                  key={order.orderId}
                  className={`bg-gray-900 rounded-lg p-6 border-2 transition-all duration-300 ${
                    isHighlighted
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border-gray-700'
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b border-gray-700">
                    <div>
                      <p className="text-sm text-gray-400">Order ID</p>
                      <p className="font-mono text-green-400 text-sm">{order.orderId}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <p className="text-2xl font-bold text-green-400">${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Upload Status Banner */}
                  <div className={`mb-4 p-4 rounded-md border-2 ${
                    allItemsUploaded
                      ? 'bg-green-600/20 border-green-500'
                      : 'bg-yellow-600/20 border-yellow-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {allItemsUploaded ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                            <span className="text-green-400 font-semibold">
                              All requirements uploaded
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
                            <span className="text-yellow-400 font-semibold">
                              {uploadedCount} of {order.items.length} items uploaded
                            </span>
                          </>
                        )}
                      </div>
                      {!allItemsUploaded && (
                        <button
                          onClick={() => handleUploadClick(order.orderId)}
                          className="flex items-center bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-full transition-colors"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          UPLOAD NOW
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">Items Ordered:</h3>
                    {order.items.map((item, index) => {
                      const slotCompletion = getSlotCompletionForItem(order, item)
                      const allSlotsComplete = slotCompletion.completed === slotCompletion.total

                      return (
                        <div key={index} className="bg-gray-800 p-4 rounded-md">
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <div className="flex-1 min-w-[200px]">
                              <div className="flex items-center mb-1">
                                <p className="text-white font-medium">
                                  {item.title} {item.quantity > 1 && `× ${item.quantity}`}
                                </p>
                                {allSlotsComplete && (
                                  <CheckCircle className="h-4 w-4 text-green-400 ml-2" />
                                )}
                              </div>
                              <p className="text-gray-400 text-sm">
                                {item.state} • {item.adType}
                              </p>
                              {item.quantity > 1 && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-500">
                                      Slot Progress: {slotCompletion.completed} / {slotCompletion.total}
                                    </span>
                                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-[120px]">
                                      <div
                                        className="h-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${(slotCompletion.completed / slotCompletion.total) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4 flex flex-col items-end gap-2">
                              <p className="text-white font-bold">
                                ${(item.price * item.quantity).toLocaleString()}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-gray-500 text-xs">
                                  ${item.price.toLocaleString()} each
                                </p>
                              )}
                              {allSlotsComplete ? (
                                <span className="inline-block text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                                  ✓ Complete
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleUploadClick(order.orderId, item.itemId)}
                                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                                >
                                  <Upload className="h-3 w-3" />
                                  Upload {slotCompletion.completed > 0 ? 'Remaining' : 'Now'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-between text-lg font-bold text-green-400">
                      <span>Total</span>
                      <span>${(order.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AccountOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    }>
      <AccountOrdersContent />
    </Suspense>
  )
}
