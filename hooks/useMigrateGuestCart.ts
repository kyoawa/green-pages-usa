import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useMigrateGuestCart() {
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    const migrateCart = async () => {
      // Only migrate if user just signed in
      if (isSignedIn) {
        const guestCart = localStorage.getItem('guestCart')

        if (guestCart && guestCart !== '[]') {
          try {
            const items = JSON.parse(guestCart)

            // Add each item to the authenticated user's cart
            for (const item of items) {
              await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  state: item.state,
                  adType: item.adType,
                  quantity: item.quantity,
                }),
              })
            }

            // Clear guest cart after successful migration
            localStorage.removeItem('guestCart')

            // Trigger cart update event
            window.dispatchEvent(new Event('cartUpdated'))

            console.log('Guest cart migrated successfully')
          } catch (error) {
            console.error('Error migrating guest cart:', error)
          }
        }
      }
    }

    migrateCart()
  }, [isSignedIn, isLoaded])
}
