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
    if (isSignedIn) {
      fetchCartCount()
    }
  }, [isSignedIn, isModalOpen])

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const cart = await response.json()
        setItemCount(cart.itemCount || 0)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }

  if (!isSignedIn) {
    return null // Don't show cart button if not logged in
  }

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
        onCartUpdate={fetchCartCount}
      />
    </>
  )
}
