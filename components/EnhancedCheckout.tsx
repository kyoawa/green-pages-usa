"use client"

import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface AdData {
  id: string
  title: string
  price: number
  remaining: string
  description: string
  inventory: number
  total_slots: number
}

interface CheckoutStepProps {
	onPaymentSuccess: (paymentIntentId: string, customerData: {email: string, fullName: string, phone: string}) => void
  state: string
  selectedAd: AdData | null
  paymentProcessing: boolean
}

const CheckoutForm = ({ onPaymentSuccess, state, selectedAd, paymentProcessing }: CheckoutStepProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [paymentType, setPaymentType] = useState('card')
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
		onPaymentSuccess(paymentIntent.id, {
		    email: email,
		    fullName: fullName, 
		    phone: mobilePhone
		  })
		}

    setIsLoading(false)
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

  const subtotal = selectedAd?.price || 0
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Side - Checkout Form */}
      <div className="flex-1 p-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 tracking-wider">CHECKOUT - {state.toUpperCase()}</h1>
        
        {/* Buyer Info Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 tracking-wide">BUYER INFO</h2>
          
          {/* Full Name */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-4 bg-green-600 text-white placeholder-green-200 border-2 border-green-500 rounded-md focus:outline-none focus:border-green-400"
            />
          </div>
          
          {/* Email and Phone Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-4 bg-green-600 text-white placeholder-green-200 border-2 border-green-500 rounded-md focus:outline-none focus:border-green-400"
            />
            <input
              type="tel"
              placeholder="Mobile Phone"
              value={mobilePhone}
              onChange={(e) => setMobilePhone(e.target.value)}
              className="p-4 bg-green-600 text-white placeholder-green-200 border-2 border-green-500 rounded-md focus:outline-none focus:border-green-400"
            />
          </div>
        </div>

        {/* Shipping Address Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 tracking-wide">SHIPPING ADDRESS</h2>
          <div className="border-2 border-green-500 rounded-md p-4 bg-green-600/20">
            <AddressElement options={addressElementOptions} />
          </div>
        </div>

        {/* Billing Address Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold tracking-wide mr-4">BILLING ADDRESS</h2>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sameAsShipping}
                onChange={(e) => setSameAsShipping(e.target.checked)}
                className="w-5 h-5 text-green-500 bg-green-600 border-green-500 rounded focus:ring-green-500 mr-2"
              />
              <span className="text-green-400">Same as Shipping</span>
            </label>
          </div>
          
          {!sameAsShipping && (
            <div className="border-2 border-green-500 rounded-md p-4 bg-green-600/20">
              <AddressElement options={{ mode: 'billing', allowedCountries: ['US'] }} />
            </div>
          )}
        </div>

        {/* Payment Info Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 tracking-wide">PAYMENT INFO</h2>
          
          {/* Payment Element */}
          <div className="border-2 border-green-500 rounded-md p-4 bg-green-600/20">
            <PaymentElement options={paymentElementOptions} />
          </div>
        </div>

        {/* Error Message */}
        {message && (
          <div className="mb-4 p-4 bg-red-600/20 border-2 border-red-500 rounded-md">
            <p className="text-red-400">{message}</p>
          </div>
        )}
      </div>

      {/* Right Side - Order Summary */}
      <div className="w-96 bg-gray-900 p-8 border-l border-gray-700">
        <h2 className="text-4xl font-bold mb-8 tracking-wider">ORDER SUMMARY</h2>
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 tracking-wide text-gray-300">ADS ORDERED:</h3>
          
          <div className="bg-gray-800 p-4 rounded-md mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-white font-medium">{selectedAd?.title || '1/4 Page Advertorial'}</p>
                <p className="text-gray-400 text-sm">{selectedAd?.description || 'w/ Single Listing + Digital Impressions'}</p>
              </div>
              <p className="text-white font-bold">USD {subtotal.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-md">
            <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
              <span>Tax</span>
              <span>USD {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-green-400">
              <span>Digital Impressions</span>
              <span>Included</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-2xl font-bold text-green-400">TOTAL:</span>
            <span className="text-2xl font-bold text-green-400">USD {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !stripe || !elements}
          className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-6 px-8 rounded-full text-2xl tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              PROCESSING...
            </div>
          ) : (
            `COMPLETE ORDER $${total.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  )
}

// Main export - keeps same name for drop-in replacement
export function EnhancedCheckoutStep(props: CheckoutStepProps) {
  const [clientSecret, setClientSecret] = useState("")

  useEffect(() => {
    if (!props.selectedAd) return

	const getStateCode = (stateName: string): string => {
	  const stateMap: { [key: string]: string } = {
	    'California': 'CA',
	    'Montana': 'MT', 
	    'Illinois': 'IL',
	    'Missouri': 'MO',
	    'Oklahoma': 'OK',
	    'New York': 'NY'
	  }
	  return stateMap[stateName] || stateName
	}

    // Create PaymentIntent using your existing API route
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ 
		  amount: (props.selectedAd.price + (props.selectedAd.price * 0.00)),
		  state: getStateCode(props.state),  // ← Convert state name to code
		  adType: props.selectedAd.id,
		  adTitle: props.selectedAd.title
		}),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch((error) => {
        console.error("Error:", error)
      })
  }, [props.selectedAd, props.state])

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

  return (
    <div className="bg-black min-h-screen">
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm {...props} />
        </Elements>
      )}
    </div>
  )
}