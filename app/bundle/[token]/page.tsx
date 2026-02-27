"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface BundleItem {
  adType: string
  title: string
  quantity: number
  unitPrice: number
}

interface BundleData {
  id: string
  name: string
  description?: string
  state: string
  items: BundleItem[]
  retailValue: number
  totalPrice: number
  expiresAt?: string
}

const BundleCheckoutForm = ({ bundle, userId }: { bundle: BundleData; userId?: string }) => {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const params = useParams()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showMobileSummary, setShowMobileSummary] = useState(false)

  const savings = bundle.retailValue - bundle.totalPrice

  const handleSubmit = async () => {
    if (!stripe || !elements) return

    setIsLoading(true)
    setMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: fullName,
            email: email,
            phone: mobilePhone,
          }
        }
      },
      redirect: 'if_required'
    })

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Payment failed")
      } else {
        setMessage("An unexpected error occurred.")
      }
      setIsLoading(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        const response = await fetch('/api/custom-bundles/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            customerData: {
              email,
              fullName,
              phone: mobilePhone,
              userId: userId || 'guest',
            }
          })
        })

        if (response.ok) {
          router.push(`/bundle/${params.token}/success`)
        } else {
          setMessage('Payment succeeded but there was an issue creating your order. Please contact support.')
        }
      } catch (err) {
        console.error('Error confirming bundle payment:', err)
        setMessage('There was an issue processing your payment. Please contact support.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const paymentElementOptions = {
    layout: "tabs" as const,
    paymentMethodOrder: ['card', 'us_bank_account'] as const,
    fields: {
      billingDetails: 'auto' as const
    }
  }

  const addressElementOptions = {
    mode: 'shipping' as const,
    allowedCountries: ['US'] as const,
    fields: {
      phone: 'always' as const,
    },
    validation: {
      phone: {
        required: 'always' as const,
      },
    },
  }

  const OrderSummary = ({ className = "" }) => (
    <div className={className}>
      <h2 className="text-2xl lg:text-4xl font-bold mb-4 lg:mb-8 tracking-wider">ORDER SUMMARY</h2>

      <div className="mb-4 lg:mb-6">
        <h3 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-4 tracking-wide text-green-400">
          {bundle.name}
        </h3>
        <p className="text-gray-400 text-sm mb-4">{bundle.state} Edition</p>
      </div>

      <div className="mb-4 lg:mb-8">
        <h3 className="text-base font-semibold mb-2 lg:mb-4 tracking-wide text-gray-300">
          PACKAGE INCLUDES:
        </h3>

        <div className="space-y-3 mb-4">
          {bundle.items.map((item, index) => (
            <div key={index} className="bg-gray-800 p-3 lg:p-4 rounded-md">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-2">
                  <p className="text-white font-medium text-sm lg:text-base">
                    {item.title} {item.quantity > 1 && `x ${item.quantity}`}
                  </p>
                </div>
                <p className="text-gray-400 text-sm font-display line-through">
                  ${(item.unitPrice * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-800 p-3 lg:p-4 rounded-md space-y-2">
          <div className="flex justify-between items-center text-xs lg:text-sm text-gray-400">
            <span>Retail Value</span>
            <span className="font-display line-through">${bundle.retailValue.toLocaleString()}</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between items-center text-xs lg:text-sm text-green-400">
              <span>Bundle Savings</span>
              <span className="font-display">-${savings.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 lg:pt-6">
        <div className="flex justify-between items-center">
          <span className="text-lg lg:text-2xl font-bold text-green-400">TOTAL:</span>
          <span className="text-lg lg:text-2xl font-bold text-green-400 font-display">
            ${bundle.totalPrice.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Order Summary Toggle */}
      <div className="lg:hidden bg-gray-900 border-b border-gray-700">
        <button
          onClick={() => setShowMobileSummary(!showMobileSummary)}
          className="w-full p-4 flex justify-between items-center"
        >
          <span className="text-lg font-semibold">Order Total</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-400 font-display">${bundle.totalPrice.toLocaleString()}</span>
            {showMobileSummary ? <ChevronUp /> : <ChevronDown />}
          </div>
        </button>

        {showMobileSummary && (
          <div className="px-4 pb-4">
            <OrderSummary />
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Side - Checkout Form */}
        <div className="flex-1 p-4 lg:p-8 max-w-full lg:max-w-2xl mx-auto w-full">
          <h1 className="text-2xl lg:text-4xl font-bold tracking-wider mb-6 lg:mb-8">
            BUNDLE CHECKOUT
          </h1>

          {/* Buyer Info Section */}
          <div className="mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-xl font-semibold mb-4 tracking-wide">BUYER INFO</h2>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 lg:p-4 bg-green-600 text-white placeholder-green-200 border-2 border-green-500 rounded-md focus:outline-none focus:border-green-400 text-base"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 lg:mb-6">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-3 lg:p-4 bg-green-600 text-white placeholder-green-200 border-2 border-green-500 rounded-md focus:outline-none focus:border-green-400 text-base"
                style={{ fontSize: '16px' }}
              />
              <input
                type="tel"
                placeholder="Mobile Phone"
                value={mobilePhone}
                onChange={(e) => setMobilePhone(e.target.value)}
                className="p-3 lg:p-4 bg-green-600 text-white placeholder-green-200 border-2 border-green-500 rounded-md focus:outline-none focus:border-green-400 text-base"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-xl font-semibold mb-4 tracking-wide">SHIPPING ADDRESS</h2>
            <div className="border-2 border-green-500 rounded-md p-3 lg:p-4 bg-green-600/20">
              <AddressElement options={addressElementOptions} />
            </div>
          </div>

          {/* Billing Address Section */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
              <h2 className="text-lg lg:text-xl font-semibold tracking-wide">BILLING ADDRESS</h2>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="w-5 h-5 text-green-500 bg-green-600 border-green-500 rounded focus:ring-green-500 mr-2"
                />
                <span className="text-green-400 text-sm lg:text-base">Same as Shipping</span>
              </label>
            </div>

            {!sameAsShipping && (
              <div className="border-2 border-green-500 rounded-md p-3 lg:p-4 bg-green-600/20">
                <AddressElement options={{ mode: 'billing', allowedCountries: ['US'] }} />
              </div>
            )}
          </div>

          {/* Payment Info Section */}
          <div className="mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-xl font-semibold mb-4 tracking-wide">PAYMENT INFO</h2>
            <div className="border-2 border-green-500 rounded-md p-3 lg:p-4 bg-green-600/20">
              <PaymentElement options={paymentElementOptions} />
            </div>
          </div>

          {/* Error Message */}
          {message && (
            <div className="mb-4 p-3 lg:p-4 bg-red-600/20 border-2 border-red-500 rounded-md">
              <p className="text-red-400 text-sm lg:text-base">{message}</p>
            </div>
          )}

          {/* Mobile Submit Button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !stripe || !elements}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-6 rounded-full text-lg tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  PROCESSING...
                </div>
              ) : (
                <>COMPLETE ORDER <span className="font-display">${bundle.totalPrice.toLocaleString()}</span></>
              )}
            </button>
          </div>
        </div>

        {/* Right Side - Order Summary (Desktop Only) */}
        <div className="hidden lg:block w-96 bg-gray-900 p-8 border-l border-gray-700">
          <OrderSummary />

          <button
            onClick={handleSubmit}
            disabled={isLoading || !stripe || !elements}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-6 px-8 rounded-full text-2xl tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-3 h-6 w-6" />
                PROCESSING...
              </div>
            ) : (
              <>COMPLETE ORDER <span className="font-display">${bundle.totalPrice.toLocaleString()}</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BundlePage() {
  const params = useParams()
  const { user } = useUser()
  const [bundle, setBundle] = useState<BundleData | null>(null)
  const [clientSecret, setClientSecret] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        const response = await fetch(`/api/custom-bundles/${params.token}`)

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Bundle not found')
          return
        }

        const bundleData = await response.json()
        setBundle(bundleData)

        // Create payment intent
        const paymentResponse = await fetch('/api/custom-bundles/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bundleId: bundleData.id,
          })
        })

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json()
          setClientSecret(paymentData.clientSecret)
        } else {
          setError('Failed to initialize payment')
        }
      } catch (err) {
        console.error('Error loading bundle:', err)
        setError('Error loading bundle')
      } finally {
        setLoading(false)
      }
    }

    if (params.token) {
      fetchBundle()
    }
  }, [params.token])

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#22c55e',
      colorBackground: '#1f2937',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '6px',
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="text-white text-xl">Loading bundle...</div>
        </div>
      </div>
    )
  }

  if (error || !bundle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold text-white mb-4">Bundle Unavailable</h1>
          <p className="text-gray-400 text-lg mb-8">{error || 'This bundle is no longer available.'}</p>
          <a
            href="/"
            className="inline-block bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-8 rounded-full text-lg tracking-wider transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen">
      {clientSecret && bundle && (
        <Elements options={{ clientSecret, appearance }} stripe={stripePromise} key={clientSecret}>
          <BundleCheckoutForm bundle={bundle} userId={user?.id} />
        </Elements>
      )}
    </div>
  )
}
