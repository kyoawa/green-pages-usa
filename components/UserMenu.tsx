'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">
            Sign Up
          </Button>
        </SignUpButton>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "h-8 w-8"
          }
        }}
      >
        <UserButton.MenuItems>
          <UserButton.Link
            label="My Orders"
            labelIcon={<span>📦</span>}
            href="/account/orders"
          />
        </UserButton.MenuItems>
      </UserButton>
    </div>
  )
}
