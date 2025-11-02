"use client"

import { useState, useEffect } from 'react'
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
}

export default function AccountOrdersPage() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

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
    return order.uploadStatus?.[sanitizedItemId] || false
  }

  const handleUploadClick = (orderId: string) => {
    router.push(`/upload/cart?paymentIntentId=${orderId}`)
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

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-600/20 border-2 border-green-500 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <p className="text-green-400">Upload completed successfully! Thank you.</p>
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
              const allItemsUploaded = order.items.every(item =>
                getItemUploadStatus(order, item.itemId)
              )
              const uploadedCount = order.items.filter(item =>
                getItemUploadStatus(order, item.itemId)
              ).length

              return (
                <div key={order.orderId} className="bg-gray-900 rounded-lg p-6 border-2 border-gray-700">
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
                      const isUploaded = getItemUploadStatus(order, item.itemId)

                      return (
                        <div key={index} className="bg-gray-800 p-4 rounded-md">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <p className="text-white font-medium">
                                  {item.title} {item.quantity > 1 && `× ${item.quantity}`}
                                </p>
                                {isUploaded && (
                                  <CheckCircle className="h-4 w-4 text-green-400 ml-2" />
                                )}
                              </div>
                              <p className="text-gray-400 text-sm">
                                {item.state} • {item.adType}
                              </p>
                              <p className="text-gray-500 text-xs mt-1">
                                Item ID: {item.itemId}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-white font-bold">
                                ${(item.price * item.quantity).toLocaleString()}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-gray-500 text-xs">
                                  ${item.price.toLocaleString()} each
                                </p>
                              )}
                              {isUploaded ? (
                                <span className="inline-block mt-2 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                  Uploaded
                                </span>
                              ) : (
                                <span className="inline-block mt-2 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                                  Pending
                                </span>
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
