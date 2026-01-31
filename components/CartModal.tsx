'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, ShoppingBag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

interface CartItem {
  itemId: string
  state: string
  adType: string
  title: string
  price: number
  quantity: number
  addedAt?: string
  reservationId?: string
}

interface Cart {
  items: CartItem[]
  subtotal: number
  total: number
  itemCount: number
}

interface AppliedDiscount {
  type: 'bundle' | 'code' | 'none'
  name: string
  amount: number
  description: string
}

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  onCartUpdate?: () => void
}

export function CartModal({ isOpen, onClose, onCartUpdate }: CartModalProps) {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)
  const [discount, setDiscount] = useState<AppliedDiscount>({ type: 'none', name: '', amount: 0, description: '' })

  useEffect(() => {
    if (isOpen) {
      fetchCart()
    }
  }, [isOpen, isSignedIn])

  const fetchCart = async () => {
    setIsLoading(true)
    try {
      if (isSignedIn) {
        // Fetch from API for authenticated users
        const response = await fetch('/api/cart')
        if (response.ok) {
          const data = await response.json()
          setCart(data)

          // Fetch bundle discounts
          if (data && data.items.length > 0) {
            const discountResponse = await fetch('/api/checkout/apply-discount', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: data.items,
                subtotal: data.subtotal
              })
            })
            if (discountResponse.ok) {
              const discountData = await discountResponse.json()
              if (discountData.discount) {
                setDiscount(discountData.discount)
              } else {
                setDiscount({ type: 'none', name: '', amount: 0, description: '' })
              }
            }
          } else {
            setDiscount({ type: 'none', name: '', amount: 0, description: '' })
          }
        }
      } else {
        // Get from localStorage for guests
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
        const subtotal = guestCart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        const itemCount = guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0)

        setCart({
          items: guestCart,
          subtotal,
          total: subtotal,
          itemCount
        })
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
      if (isSignedIn) {
        // Remove from API for authenticated users
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
      } else {
        // Remove from localStorage for guests
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
        const updatedCart = guestCart.filter((item: any) => item.itemId !== itemId)
        localStorage.setItem('guestCart', JSON.stringify(updatedCart))
        await fetchCart()
        onCartUpdate?.()
        window.dispatchEvent(new Event('cartUpdated'))
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
      if (isSignedIn) {
        const response = await fetch('/api/cart/clear', {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchCart()
          onCartUpdate?.()
        } else {
          alert('Failed to clear cart')
        }
      } else {
        // Clear localStorage for guests
        localStorage.removeItem('guestCart')
        await fetchCart()
        onCartUpdate?.()
        window.dispatchEvent(new Event('cartUpdated'))
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      alert('Failed to clear cart')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = () => {
    if (!isSignedIn) {
      // Guest user - prompt to sign up
      onClose()
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent('/checkout/cart')}`
      return
    }

    // Authenticated user - proceed to checkout
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
                    <p className="text-xs text-gray-400 mb-2">
                      {item.state}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-green-400">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        ${item.price.toLocaleString()} each
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              {cart.items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="w-full text-center text-xs text-red-400 hover:text-red-300 py-2 transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-gray-700 p-3 sm:p-4 bg-black space-y-3">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal:</span>
                <span className="text-white font-medium">${cart.subtotal.toLocaleString()}</span>
              </div>
              {discount.amount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>{discount.description}</span>
                  <span>-${discount.amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base sm:text-lg font-bold border-t border-gray-700 pt-2">
                <span className="text-white">Total:</span>
                <span className="text-green-400">${(cart.subtotal - discount.amount).toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 sm:py-4 rounded-full transition-colors text-sm sm:text-base"
            >
              {isSignedIn ? 'PROCEED TO CHECKOUT' : 'SIGN UP TO CHECKOUT'}
            </Button>

            {!isSignedIn && (
              <p className="text-xs text-center text-gray-500">
                Create an account to complete your purchase
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
