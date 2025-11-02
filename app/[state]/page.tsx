// app/[state]/page.tsx - Complete file
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from 'next/navigation'
import { EnhancedCheckoutStep } from '@/components/EnhancedCheckout'
import UploadRequirements from '@/components/UploadRequirements'
import StateMap from '@/components/StateMap'
import { Loader2, ShoppingCart } from "lucide-react"
import { useUser } from '@clerk/nextjs'
import { CartButton } from '@/components/CartButton'
import { UserMenu } from '@/components/UserMenu'

interface AdData {
  id: string
  title: string
  price: number
  remaining: string
  description: string
  inventory: number
  total_slots: number
}

// Complete mapping for all 50 states
const STATE_MAPPING: { [key: string]: { code: string, name: string } } = {
  'alabama': { code: 'AL', name: 'Alabama' },
  'alaska': { code: 'AK', name: 'Alaska' },
  'arizona': { code: 'AZ', name: 'Arizona' },
  'arkansas': { code: 'AR', name: 'Arkansas' },
  'california': { code: 'CA', name: 'California' },
  'colorado': { code: 'CO', name: 'Colorado' },
  'connecticut': { code: 'CT', name: 'Connecticut' },
  'delaware': { code: 'DE', name: 'Delaware' },
  'florida': { code: 'FL', name: 'Florida' },
  'georgia': { code: 'GA', name: 'Georgia' },
  'hawaii': { code: 'HI', name: 'Hawaii' },
  'idaho': { code: 'ID', name: 'Idaho' },
  'illinois': { code: 'IL', name: 'Illinois' },
  'indiana': { code: 'IN', name: 'Indiana' },
  'iowa': { code: 'IA', name: 'Iowa' },
  'kansas': { code: 'KS', name: 'Kansas' },
  'kentucky': { code: 'KY', name: 'Kentucky' },
  'louisiana': { code: 'LA', name: 'Louisiana' },
  'maine': { code: 'ME', name: 'Maine' },
  'maryland': { code: 'MD', name: 'Maryland' },
  'massachusetts': { code: 'MA', name: 'Massachusetts' },
  'michigan': { code: 'MI', name: 'Michigan' },
  'minnesota': { code: 'MN', name: 'Minnesota' },
  'mississippi': { code: 'MS', name: 'Mississippi' },
  'missouri': { code: 'MO', name: 'Missouri' },
  'montana': { code: 'MT', name: 'Montana' },
  'nebraska': { code: 'NE', name: 'Nebraska' },
  'nevada': { code: 'NV', name: 'Nevada' },
  'newhampshire': { code: 'NH', name: 'New Hampshire' },
  'new-hampshire': { code: 'NH', name: 'New Hampshire' },
  'newjersey': { code: 'NJ', name: 'New Jersey' },
  'new-jersey': { code: 'NJ', name: 'New Jersey' },
  'newmexico': { code: 'NM', name: 'New Mexico' },
  'new-mexico': { code: 'NM', name: 'New Mexico' },
  'newyork': { code: 'NY', name: 'New York' },
  'new-york': { code: 'NY', name: 'New York' },
  'northcarolina': { code: 'NC', name: 'North Carolina' },
  'north-carolina': { code: 'NC', name: 'North Carolina' },
  'northdakota': { code: 'ND', name: 'North Dakota' },
  'north-dakota': { code: 'ND', name: 'North Dakota' },
  'ohio': { code: 'OH', name: 'Ohio' },
  'oklahoma': { code: 'OK', name: 'Oklahoma' },
  'oregon': { code: 'OR', name: 'Oregon' },
  'pennsylvania': { code: 'PA', name: 'Pennsylvania' },
  'rhodeisland': { code: 'RI', name: 'Rhode Island' },
  'rhode-island': { code: 'RI', name: 'Rhode Island' },
  'southcarolina': { code: 'SC', name: 'South Carolina' },
  'south-carolina': { code: 'SC', name: 'South Carolina' },
  'southdakota': { code: 'SD', name: 'South Dakota' },
  'south-dakota': { code: 'SD', name: 'South Dakota' },
  'tennessee': { code: 'TN', name: 'Tennessee' },
  'texas': { code: 'TX', name: 'Texas' },
  'utah': { code: 'UT', name: 'Utah' },
  'vermont': { code: 'VT', name: 'Vermont' },
  'virginia': { code: 'VA', name: 'Virginia' },
  'washington': { code: 'WA', name: 'Washington' },
  'westvirginia': { code: 'WV', name: 'West Virginia' },
  'west-virginia': { code: 'WV', name: 'West Virginia' },
  'wisconsin': { code: 'WI', name: 'Wisconsin' },
  'wyoming': { code: 'WY', name: 'Wyoming' }
}

// State codes to names mapping
const STATE_CODES: { [key: string]: string } = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming'
}

export default function DynamicStatePage() {
  const params = useParams()
  const router = useRouter()
  const stateParam = params.state as string
  
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null)
  const [inventory, setInventory] = useState<AdData[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<{email: string, fullName: string, phone: string} | null>(null)
  
  const steps = ["Choose Your Ad", "Checkout", "Upload Requirements", "Order Summary"]

  // Convert URL parameter to state info
  const getStateInfo = (urlParam: string) => {
    // Check if it's a 2-letter state code
    if (urlParam.length === 2) {
      const code = urlParam.toUpperCase()
      return { code, name: STATE_CODES[code] || urlParam }
    }
    
    // Otherwise look up in the mapping
    return STATE_MAPPING[urlParam.toLowerCase()] || { 
      code: urlParam.toUpperCase().substring(0, 2), 
      name: urlParam 
    }
  }

  const stateInfo = getStateInfo(stateParam)
  const stateCode = stateInfo.code
  const stateName = stateInfo.name

  // Fetch inventory for this state
  useEffect(() => {
    fetchInventory()
  }, [stateCode])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/inventory/${stateCode}`)
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      } else if (response.status === 404) {
        alert(`${stateName} is not currently available. Redirecting to home page.`)
        router.push('/')
        return
      } else {
        console.error('Failed to fetch inventory')
        setInventory([])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdSelect = (ad: AdData) => {
    if (ad.inventory > 0) {
      setSelectedAd(ad)
      setCurrentStep(1)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string, customerData: {email: string, fullName: string, phone: string}) => {
    try {
      setPaymentProcessing(true)
      setCustomerInfo(customerData)
      
      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId })
      })

      if (response.ok) {
        await fetchInventory()
        setCurrentStep(2)
      } else {
        alert('Payment succeeded but there was an issue updating inventory. Please contact support.')
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      alert('There was an issue processing your payment. Please contact support.')
    } finally {
      setPaymentProcessing(false)
    }
  }

  const handleUploadSuccess = () => {
    setCurrentStep(3)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="text-white text-xl">Loading {stateName} advertising options...</div>
        </div>
      </div>
    )
  }

  if (inventory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">No ads available for {stateName}</h1>
          <p className="text-gray-400 mb-4">This state may not be active yet.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <img
            src="/logo.svg"
            alt="Green Pages"
            className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/')}
          />
        </div>
        <nav className="flex space-x-8">
          <a href="/about" className="text-gray-300 hover:text-white">ABOUT</a>
          <a href="/magazine" className="text-gray-300 hover:text-white">MAGAZINE</a>
          <a href="/contact" className="text-gray-300 hover:text-white">CONTACT</a>
        </nav>
        <div className="flex items-center gap-3">
          <CartButton />
          <UserMenu />
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gray-900 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center ${
                  index <= currentStep ? "text-green-400" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 ${
                    index <= currentStep
                      ? "border-green-400 bg-green-400 text-black"
                      : "border-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                {step.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {currentStep === 0 && (
          <AdSelectionStep
            onAdSelect={handleAdSelect}
            state={stateName}
            stateCode={stateCode}
            inventory={inventory}
            loading={loading}
            onRefresh={fetchInventory}
          />
        )}

        {currentStep === 1 && selectedAd && (
          <EnhancedCheckoutStep 
            onPaymentSuccess={handlePaymentSuccess}
            state={stateName} 
            selectedAd={selectedAd}
            paymentProcessing={paymentProcessing}
          />
        )}

        {currentStep === 2 && (
          <UploadRequirements 
            onUploadSuccess={handleUploadSuccess}
            selectedAd={selectedAd}
            customerInfo={customerInfo}
          />
        )}

        {currentStep === 3 && (
          <OrderSummaryStep state={stateName} selectedAd={selectedAd} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-sm text-gray-400">
            © Green Pages USA 2025
          </div>
        </div>
      </footer>
    </div>
  )
}

// AdSelectionStep component with StateMap integration
function AdSelectionStep({
  onAdSelect,
  state,
  stateCode,
  inventory,
  loading,
  onRefresh
}: {
  onAdSelect: (ad: AdData) => void
  state: string
  stateCode: string
  inventory: AdData[]
  loading: boolean
  onRefresh: () => void
}) {
  const { isSignedIn } = useUser()
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  const handleQuantityChange = (adId: string, value: string) => {
    const numValue = parseInt(value) || 1
    setQuantities(prev => ({ ...prev, [adId]: numValue }))
  }

  const getQuantity = (adId: string) => {
    return quantities[adId] || 1
  }

  const handleAddToCart = async (ad: AdData, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isSignedIn) {
      alert('Please sign in to add items to your cart')
      return
    }

    const quantity = getQuantity(ad.id)

    if (quantity > ad.inventory) {
      alert(`Only ${ad.inventory} slots available`)
      return
    }

    setAddingToCart(ad.id)
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: stateCode,
          adType: ad.id,
          quantity: quantity,
        }),
      })

      if (response.ok) {
        alert(`${quantity}x ${ad.title} added to cart!`)
        setQuantities(prev => ({ ...prev, [ad.id]: 1 })) // Reset quantity to 1
        onRefresh() // Refresh inventory to show updated available count
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
        <p className="text-gray-400">Loading {state} inventory...</p>
      </div>
    )
  }

  return (
    <>
      {/* State Map with green glow effect */}
      <div className="mb-12">
        <StateMap stateName={state} stateCode={stateCode} className="mb-8" />
      </div>

      <div className="text-center mb-12">
        <p className="text-gray-400 text-xl font-light tracking-wide">
          Choose your advertising package for <span className="text-white font-semibold">{state}</span>
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent mx-auto mt-4 rounded-full" />
      </div>

      <div className="grid gap-4 max-w-5xl mx-auto px-4">
        {inventory.map((ad) => (
          <div
            key={ad.id}
            className={`group relative rounded-2xl transition-all duration-200 ${
              ad.inventory > 0
                ? "bg-[#1e293b] hover:bg-[#334155] shadow-lg hover:shadow-xl"
                : "bg-[#0f172a] opacity-60"
            }`}
          >
            {/* Mobile Layout */}
            <div className="md:hidden p-4">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white tracking-tight mb-2">{ad.title}</h3>
                <p className="text-slate-400 text-sm mb-2">{ad.description}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ad.inventory > 0 ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <span className="text-xs text-slate-500 font-medium">{ad.remaining}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="text-3xl font-bold text-green-500">
                  ${ad.price.toLocaleString()}
                </div>

                <div className="flex items-center gap-2">
                  {isSignedIn && ad.inventory > 0 && (
                    <>
                      <input
                        type="number"
                        min="1"
                        max={ad.inventory}
                        value={getQuantity(ad.id)}
                        onChange={(e) => handleQuantityChange(ad.id, e.target.value)}
                        placeholder="QTY"
                        className="w-14 h-10 px-2 bg-black border-2 border-slate-700 rounded-xl text-white text-center text-sm font-bold focus:outline-none focus:border-green-500 transition-colors placeholder:text-slate-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        disabled={addingToCart === ad.id}
                        className="w-10 h-10 rounded-xl bg-[#334155] hover:bg-[#475569] border-2 border-slate-700 text-white disabled:opacity-50 flex items-center justify-center transition-all duration-200"
                        onClick={(e) => handleAddToCart(ad, e)}
                        title="Add to Cart"
                      >
                        {addingToCart === ad.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}

                  <button
                    disabled={ad.inventory === 0}
                    className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center ${
                      ad.inventory > 0
                        ? "bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/30"
                        : "bg-[#334155] text-slate-600 cursor-not-allowed"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (ad.inventory > 0) onAdSelect(ad)
                    }}
                    title={ad.inventory > 0 ? "Buy Now" : "Sold Out"}
                  >
                    {ad.inventory > 0 ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between gap-6 p-5">
              {/* Left section - Title and Description */}
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-white tracking-tight mb-1.5">{ad.title}</h3>
                <p className="text-slate-400 text-sm mb-3">{ad.description}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ad.inventory > 0 ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <span className="text-xs text-slate-500 font-medium">{ad.remaining}</span>
                </div>
              </div>

              {/* Right section - Price, Quantity, and Actions */}
              <div className="flex items-center gap-6">
                {/* Price - Left justified */}
                <div className="text-left">
                  <div className="text-4xl font-bold text-green-500">
                    ${ad.price.toLocaleString()}
                  </div>
                </div>

                {/* Quantity + Buttons - Aligned horizontally */}
                <div className="flex items-center gap-3">
                  {/* Quantity Input */}
                  {isSignedIn && ad.inventory > 0 && (
                    <input
                      type="number"
                      min="1"
                      max={ad.inventory}
                      value={getQuantity(ad.id)}
                      onChange={(e) => handleQuantityChange(ad.id, e.target.value)}
                      placeholder="QTY"
                      className="w-16 h-12 px-2 bg-black border-2 border-slate-700 rounded-xl text-white text-center text-sm font-bold focus:outline-none focus:border-green-500 transition-colors placeholder:text-slate-600"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {/* Add to Cart Icon Button */}
                    {isSignedIn && ad.inventory > 0 && (
                      <button
                        disabled={addingToCart === ad.id}
                        className="w-12 h-12 rounded-xl bg-[#334155] hover:bg-[#475569] border-2 border-slate-700 text-white disabled:opacity-50 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                        onClick={(e) => handleAddToCart(ad, e)}
                        title="Add to Cart"
                      >
                        {addingToCart === ad.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-5 w-5" />
                        )}
                      </button>
                    )}

                    {/* Buy Now Icon Button */}
                    <button
                      disabled={ad.inventory === 0}
                      className={`w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center ${
                        ad.inventory > 0
                          ? "bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/30 hover:scale-110 active:scale-95"
                          : "bg-[#334155] text-slate-600 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (ad.inventory > 0) onAdSelect(ad)
                      }}
                      title={ad.inventory > 0 ? "Buy Now" : "Sold Out"}
                    >
                      {ad.inventory > 0 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// OrderSummaryStep component
function OrderSummaryStep({ state, selectedAd }: { state: string, selectedAd: AdData | null }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-8">ORDER COMPLETE!</h1>
      <div className="bg-gray-800 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-green-400 mb-4">Thank You!</h2>
        <p className="text-gray-300 mb-6">
          Your advertising order has been successfully submitted for {state}.
        </p>
        
        {selectedAd && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-bold mb-2">Order Details:</h3>
            <p className="text-gray-400">{selectedAd.title}</p>
            <p className="text-2xl font-bold text-green-400 mt-2">
              ${selectedAd.price.toLocaleString()}
            </p>
          </div>
        )}
        
        <div className="mt-8 text-sm text-gray-400">
          <p>You will receive a confirmation email shortly with next steps.</p>
          <p>Our team will contact you within 24 hours to finalize your advertisement.</p>
        </div>
      </div>
      
      <button
        onClick={() => window.location.href = '/'}
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold"
      >
        Return Home
      </button>
    </div>
  )
}