'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, ShoppingBag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface CartItem {
  itemId: string
  state: string
  adType: string
  title: string
  price: number
  quantity: number
  addedAt: string
  reservationId: string
}

interface Cart {
  items: CartItem[]
  subtotal: number
  total: number
  itemCount: number
}

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  onCartUpdate?: () => void
}

export function CartModal({ isOpen, onClose, onCartUpdate }: CartModalProps) {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchCart()
    }
  }, [isOpen])

  const fetchCart = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCart(data)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    setRemovingItemId(itemId)
    try {
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })

      if (response.ok) {
        await fetchCart()
        onCartUpdate?.()
      } else {
        alert('Failed to remove item from cart')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item from cart')
    } finally {
      setRemovingItemId(null)
    }
  }

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCart()
        onCartUpdate?.()
      } else {
        alert('Failed to clear cart')
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      alert('Failed to clear cart')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = () => {
    // TODO: Navigate to cart checkout page
    onClose()
    router.push('/checkout/cart')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md h-full bg-white shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && !cart ? (
            <div className="text-center py-8 text-gray-500">
              Loading cart...
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-400">
                Browse our ads to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              {cart.items.map((item) => (
                <div
                  key={item.itemId}
                  className="border rounded-lg p-4 relative"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.itemId)}
                    disabled={removingItemId === item.itemId}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Item Details */}
                  <div className="pr-8">
                    <h3 className="font-semibold text-sm mb-1">
                      {item.title} {item.quantity > 1 && `× ${item.quantity}`}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {item.state} • {item.adType}
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      ${(item.price * item.quantity).toLocaleString()}
                      {item.quantity > 1 && (
                        <span className="text-sm text-gray-500 ml-2">
                          (${item.price.toLocaleString()} each)
                        </span>
                      )}
                    </p>

                    {/* Reservation Timer */}
                    <div className="flex items-center gap-1 text-xs text-orange-600 mt-2">
                      <Clock className="h-3 w-3" />
                      <span>Reserved (expires in 15 min)</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              {cart.items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  disabled={isLoading}
                  className="w-full text-red-500 hover:text-red-700"
                >
                  Clear Cart
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer - Cart Totals */}
        {cart && cart.items.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  ${cart.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-green-600">
                  ${cart.total.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Checkout ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
