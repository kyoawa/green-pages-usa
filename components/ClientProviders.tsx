'use client'

import { useMigrateGuestCart } from '@/hooks/useMigrateGuestCart'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Migrate guest cart to authenticated user's cart after sign-in
  useMigrateGuestCart()

  return <>{children}</>
}
