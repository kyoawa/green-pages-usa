"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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

const CheckoutForm = ({ cart, userId }: { cart: Cart; userId: string }) => {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showMobileSummary, setShowMobileSummary] = useState(false)

  const fillTestData = async () => {
    setEmail('test@greenpages.com')
    setFullName('Test User')
    setMobilePhone('555-123-4567')

    // Wait a bit for the elements to be ready
    setTimeout(() => {
      if (elements) {
        const addressElement = elements.getElement('address')
        if (addressElement) {
          // Use Stripe's setValue method to programmatically fill the address
          addressElement.update({
            value: {
              name: 'Test User',
              address: {
                line1: '123 Test Street',
                city: 'Los Angeles',
                state: 'CA',
                postal_code: '90210',
                country: 'US'
              },
              phone: '555-123-4567'
            }
          })
        }
      }
    }, 100)
  }

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

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
      // Confirm payment on backend
      try {
        const response = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id })
        })

        if (response.ok) {
          // Redirect to upload requirements page
          router.push(`/upload/cart?paymentIntentId=${paymentIntent.id}`)
        } else {
          setMessage('Payment succeeded but there was an issue updating inventory. Please contact support.')
        }
      } catch (error) {
        console.error('Error confirming payment:', error)
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

  // Order Summary Component
  const OrderSummary = ({ className = "" }) => (
    <div className={className}>
      <h2 className="text-2xl lg:text-4xl font-bold mb-4 lg:mb-8 tracking-wider">ORDER SUMMARY</h2>

      <div className="mb-4 lg:mb-8">
        <h3 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-4 tracking-wide text-gray-300">
          ADS ORDERED ({cart.itemCount}):
        </h3>

        {/* List all cart items */}
        <div className="space-y-3 mb-4">
          {cart.items.map((item) => (
            <div key={item.itemId} className="bg-gray-800 p-3 lg:p-4 rounded-md">
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1 mr-2">
                  <p className="text-white font-medium text-sm lg:text-base">
                    {item.title} {item.quantity > 1 && `× ${item.quantity}`}
                  </p>
                  <p className="text-gray-400 text-xs lg:text-sm">
                    {item.state} • {item.adType}
                  </p>
                </div>
                <p className="text-white font-bold text-sm lg:text-base whitespace-nowrap font-display">
                  ${(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
              {item.quantity > 1 && (
                <p className="text-gray-500 text-xs font-display">
                  ${item.price.toLocaleString()} each
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-800 p-3 lg:p-4 rounded-md">
          <div className="flex justify-between items-center text-xs lg:text-sm text-gray-400 mb-1">
            <span>Subtotal</span>
            <span className="font-display">${cart.subtotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 lg:pt-6">
        <div className="flex justify-between items-center">
          <span className="text-lg lg:text-2xl font-bold text-green-400">TOTAL:</span>
          <span className="text-lg lg:text-2xl font-bold text-green-400 font-display">
            ${cart.total.toFixed(2)}
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
            <span className="text-lg font-bold text-green-400 font-display">${cart.total.toFixed(2)}</span>
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
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold tracking-wider">
              CART CHECKOUT
            </h1>
            <button
              onClick={fillTestData}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-md text-sm transition-colors"
            >
              TEST DATA
            </button>
          </div>

          {/* Buyer Info Section */}
          <div className="mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-xl font-semibold mb-4 tracking-wide">BUYER INFO</h2>

            {/* Full Name */}
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

            {/* Email and Phone */}
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
                <>COMPLETE ORDER <span className="font-display">${cart.total.toFixed(2)}</span></>
              )}
            </button>
          </div>
        </div>

        {/* Right Side - Order Summary (Desktop Only) */}
        <div className="hidden lg:block w-96 bg-gray-900 p-8 border-l border-gray-700">
          <OrderSummary />

          {/* Desktop Submit Button */}
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
              <>COMPLETE ORDER <span className="font-display">${cart.total.toFixed(2)}</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CartCheckoutPage() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [clientSecret, setClientSecret] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
      return
    }

    // Fetch cart
    const fetchCart = async () => {
      try {
        const response = await fetch('/api/cart')
        if (response.ok) {
          const cartData = await response.json()

          if (!cartData || cartData.items.length === 0) {
            alert('Your cart is empty')
            router.push('/')
            return
          }

          setCart(cartData)

          // Create payment intent for cart
          const paymentResponse = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: cartData.total,
              cartItems: cartData.items,
              userId: user?.id
            })
          })

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json()
            setClientSecret(paymentData.clientSecret)
          } else {
            alert('Failed to initialize payment')
          }
        } else {
          alert('Failed to load cart')
          router.push('/')
        }
      } catch (error) {
        console.error('Error loading cart:', error)
        alert('Error loading cart')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [isSignedIn, user, router])

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

  const options = {
    clientSecret,
    appearance,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="text-white text-xl">Loading checkout...</div>
        </div>
      </div>
    )
  }

  if (!cart) {
    return null
  }

  return (
    <div className="bg-black min-h-screen">
      {clientSecret && cart && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm cart={cart} userId={user?.id || ''} />
        </Elements>
      )}
    </div>
  )
}
