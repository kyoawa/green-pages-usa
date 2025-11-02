"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Download, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Package } from 'lucide-react'

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

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/customers')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const getItemUploadStatus = (order: Order, itemId: string): boolean => {
    const sanitizedItemId = itemId.replace(/[#]/g, "_")
    return order.uploadStatus?.[sanitizedItemId] || false
  }

  const handleDownloadUploads = (orderId: string) => {
    // TODO: Implement download functionality for uploaded files
    alert(`Download functionality for order ${orderId} - Coming soon!`)
  }

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalOrders = orders.length
  const uniqueCustomers = new Set(orders.map(o => o.customerEmail)).size
  const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <RefreshCw size={32} style={{ color: '#22c55e', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: '24px', color: '#fff' }}>Loading customers...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <Link href="/admin" style={{ color: '#22c55e', fontSize: '14px', display: 'flex', alignItems: 'center', marginBottom: '12px', textDecoration: 'none' }}>
              <ArrowLeft size={16} style={{ marginRight: '4px' }} />
              Back to Admin Dashboard
            </Link>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
              Customer Orders
            </h1>
            <p style={{ color: '#9ca3af', marginTop: '4px' }}>
              View all customer orders, track uploads, and download submitted files
            </p>
          </div>
          <button
            onClick={fetchOrders}
            style={{
              backgroundColor: '#22c55e',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Orders</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{totalOrders}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Unique Customers</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{uniqueCustomers}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Items</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{totalItems}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Revenue</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Orders List */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>All Orders</h2>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}>
              <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '18px' }}>No orders found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {orders.map((order) => {
                const isExpanded = expandedOrders.has(order.orderId)
                const allItemsUploaded = order.items.every(item => getItemUploadStatus(order, item.itemId))
                const uploadedCount = order.items.filter(item => getItemUploadStatus(order, item.itemId)).length

                return (
                  <div key={order.orderId} style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', overflow: 'hidden' }}>

                    {/* Order Header */}
                    <div
                      onClick={() => toggleOrderExpansion(order.orderId)}
                      style={{
                        padding: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: isExpanded ? '#111827' : '#1f2937'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                            {order.customerName}
                          </h3>
                          {allItemsUploaded ? (
                            <span style={{
                              backgroundColor: '#22c55e',
                              color: '#000',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle size={12} />
                              All Uploaded
                            </span>
                          ) : (
                            <span style={{
                              backgroundColor: '#fbbf24',
                              color: '#000',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <AlertCircle size={12} />
                              {uploadedCount}/{order.items.length} Uploaded
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '20px', fontSize: '13px', color: '#9ca3af' }}>
                          <div>
                            <strong style={{ color: '#fff' }}>Email:</strong> {order.customerEmail}
                          </div>
                          <div>
                            <strong style={{ color: '#fff' }}>Phone:</strong> {order.customerPhone || 'N/A'}
                          </div>
                          <div>
                            <strong style={{ color: '#fff' }}>Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                            ${order.total.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '24px' }}>
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>
                    </div>

                    {/* Order Details (Expanded) */}
                    {isExpanded && (
                      <div style={{ padding: '20px', borderTop: '1px solid #374151', backgroundColor: '#111827' }}>

                        {/* Order Info */}
                        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '6px' }}>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Order ID</div>
                          <div style={{ fontFamily: 'monospace', color: '#22c55e', fontSize: '14px' }}>{order.orderId}</div>
                        </div>

                        {/* Items */}
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#22c55e', marginBottom: '12px' }}>Order Items</h4>
                        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                          {order.items.map((item, index) => {
                            const isUploaded = getItemUploadStatus(order, item.itemId)

                            return (
                              <div key={index} style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '6px', border: '1px solid #374151' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                      <h5 style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                                        {item.title} {item.quantity > 1 && `× ${item.quantity}`}
                                      </h5>
                                      {isUploaded && <CheckCircle size={14} style={{ color: '#22c55e' }} />}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                      {item.state} • {item.adType}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', fontFamily: 'monospace' }}>
                                      {item.itemId}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                                      ${(item.price * item.quantity).toLocaleString()}
                                    </div>
                                    {item.quantity > 1 && (
                                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                        ${item.price.toLocaleString()} each
                                      </div>
                                    )}
                                    <div style={{ marginTop: '8px' }}>
                                      {isUploaded ? (
                                        <span style={{
                                          backgroundColor: '#22c55e20',
                                          color: '#22c55e',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          fontSize: '11px',
                                          fontWeight: '600'
                                        }}>
                                          Uploaded
                                        </span>
                                      ) : (
                                        <span style={{
                                          backgroundColor: '#fbbf2420',
                                          color: '#fbbf24',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          fontSize: '11px',
                                          fontWeight: '600'
                                        }}>
                                          Pending
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Order Summary */}
                        <div style={{ padding: '16px', backgroundColor: '#1f2937', borderRadius: '6px', border: '1px solid #374151' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#22c55e', marginBottom: '12px' }}>Order Summary</h4>
                          <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', color: '#22c55e' }}>
                              <span>Total</span>
                              <span>${(order.total || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {allItemsUploaded && (
                          <div style={{ marginTop: '16px' }}>
                            <button
                              onClick={() => handleDownloadUploads(order.orderId)}
                              style={{
                                backgroundColor: '#22c55e',
                                color: '#000',
                                padding: '10px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                justifyContent: 'center'
                              }}
                            >
                              <Download size={16} />
                              Download All Uploads
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #374151' }}>
          <Link href="/admin" style={{ color: '#22c55e', fontSize: '14px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <ArrowLeft size={16} style={{ marginRight: '4px' }} />
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
