"use client"

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { CheckCircle } from 'lucide-react'

export default function BundleSuccessPage() {
  const { isSignedIn } = useUser()

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center max-w-lg mx-auto p-8">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />

        <h1 className="text-3xl font-bold text-white mb-4 tracking-wider">
          PAYMENT SUCCESSFUL
        </h1>

        <p className="text-gray-400 text-lg mb-2">
          Your custom bundle has been purchased successfully.
        </p>
        <p className="text-gray-500 text-base mb-8">
          You will receive a confirmation email with upload instructions shortly.
        </p>

        <div className="space-y-4">
          {isSignedIn ? (
            <Link
              href="/account/orders"
              className="inline-block bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-8 rounded-full text-lg tracking-wider transition-colors"
            >
              VIEW YOUR ORDERS
            </Link>
          ) : (
            <Link
              href="/sign-up"
              className="inline-block bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-8 rounded-full text-lg tracking-wider transition-colors"
            >
              CREATE ACCOUNT
            </Link>
          )}

          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-green-400 text-sm transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
