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
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md h-full bg-gray-900 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 bg-black">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white tracking-wider">
            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
            YOUR CART
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isLoading && !cart ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-pulse">Loading cart...</div>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="text-center py-8 px-4">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-2 text-sm sm:text-base font-medium">Your cart is empty</p>
              <p className="text-xs sm:text-sm text-gray-500">
                Browse our ads to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Section Header */}
              <h3 className="text-sm sm:text-base font-semibold text-gray-300 tracking-wide mb-3">
                ITEMS ({cart.itemCount}):
              </h3>

              {/* Cart Items */}
              {cart.items.map((item) => (
                <div
                  key={item.itemId}
                  className="bg-gray-800 rounded-md p-3 relative hover:bg-gray-750 transition-colors"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.itemId)}
                    disabled={removingItemId === item.itemId}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-300 disabled:opacity-50 p-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>

                  {/* Item Details */}
                  <div className="pr-8">
                    <h3 className="font-medium text-white text-xs sm:text-sm mb-1 leading-tight">
                      {item.title} {item.quantity > 1 && `× ${item.quantity}`}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-2">
                      {item.state} • {item.adType}
                    </p>
                    <div className="flex flex-col gap-1">
                      <p className="text-base sm:text-lg font-bold text-white font-display">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                      {item.quantity > 1 && (
                        <span className="text-[10px] sm:text-xs text-gray-500 font-display">
                          ${item.price.toLocaleString()} each
                        </span>
                      )}
                    </div>

                    {/* Reservation Timer */}
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-orange-400 mt-2">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
                  className="w-full text-red-400 hover:text-red-300 hover:bg-gray-800 border-gray-700 text-xs sm:text-sm"
                >
                  Clear Cart
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer - Cart Totals */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-gray-700 p-3 sm:p-4 bg-black">
            <div className="space-y-2 mb-3 sm:mb-4">
              {/* Subtotal */}
              <div className="bg-gray-800 p-2 sm:p-3 rounded-md">
                <div className="flex justify-between text-xs sm:text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white font-medium font-display">
                    ${cart.subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between text-base sm:text-lg font-bold border-t border-gray-700 pt-3">
                <span className="text-green-400 tracking-wide">TOTAL:</span>
                <span className="text-green-400 font-display">
                  ${cart.total.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base py-2.5 sm:py-3 font-bold tracking-wide"
            >
              CHECKOUT ({cart.itemCount})
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
