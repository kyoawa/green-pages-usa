'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import { CartModal } from './CartModal'

export function CartButton() {
  const { isSignedIn, user } = useUser()
  const [itemCount, setItemCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch cart on mount and when modal closes
  useEffect(() => {
    updateCartCount()

    // Listen for cart updates from guest additions
    const handleCartUpdate = () => {
      updateCartCount()
    }
    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [isSignedIn, isModalOpen])

  const updateCartCount = async () => {
    if (isSignedIn) {
      // Fetch from API for authenticated users
      try {
        const response = await fetch('/api/cart')
        if (response.ok) {
          const cart = await response.json()
          setItemCount(cart.itemCount || 0)
        }
      } catch (error) {
        console.error('Error fetching cart:', error)
      }
    } else {
      // Get from localStorage for guests
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
      const totalItems = guestCart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
      setItemCount(totalItems)
    }
  }

  // Always show cart button (for both guests and authenticated users)
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsModalOpen(true)}
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {itemCount}
          </span>
        )}
      </Button>

      <CartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCartUpdate={updateCartCount}
      />
    </>
  )
}
