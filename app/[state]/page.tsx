// app/[state]/page.tsx - Updated with all 50 states
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from 'next/navigation'
import { EnhancedCheckoutStep } from '@/components/EnhancedCheckout'
import UploadRequirements from '@/components/UploadRequirements'
import { Loader2, Facebook, Twitter, Instagram } from "lucide-react"

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
  const [stateActive, setStateActive] = useState(true)
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

  // Check if state is active and fetch inventory
  useEffect(() => {
    checkStateActive()
    fetchInventory()
  }, [stateCode])

  const checkStateActive = async () => {
    try {
      const response = await fetch('/api/states/active')
      if (response.ok) {
        const activeStates = await response.json()
        const isActive = activeStates.some((s: any) => s.code === stateCode)
        
        if (!isActive) {
          setStateActive(false)
        }
      }
    } catch (error) {
      console.error('Error checking state status:', error)
    }
  }

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/inventory/${stateCode}`)
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      } else {
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
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
    } finally {
      setPaymentProcessing(false)
    }
  }

  const handleUploadSuccess = () => {
    setCurrentStep(3)
  }

  // If state is not active, show message
  if (!stateActive || (!loading && inventory.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">
            {!stateActive ? `${stateName} is not currently available` : `No ads available for ${stateName}`}
          </h1>
          <p className="text-gray-400 mb-4">
            {!stateActive ? 'This state has not been activated yet.' : 'Please check back later or contact support.'}
          </p>
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


// AdSelectionStep component
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
  const getStateSvg = (code: string) => {
    const stateMap: { [key: string]: string } = {
      MT: "/states/mt.svg",
      CA: "/states/ca.svg", 
      OK: "/states/ok.svg",
      NY: "/states/nyc.svg",
      IL: "/states/il.svg",
      MO: "/states/mo.svg"
    }
    return stateMap[code] || null
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
        <p className="text-gray-400">Loading {state} inventory...</p>
      </div>
    )
  }

  const stateSvg = getStateSvg(stateCode)

  return (
    <>
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          {stateSvg && (
            <img 
              src={stateSvg} 
              alt={`${state} outline`} 
              className="h-16 w-auto mr-4 opacity-80"
            />
          )}
          <h1 className="text-4xl font-bold">{state.toUpperCase()}</h1>
        </div>
        <p className="text-gray-400 text-lg">
          Choose your advertising package for {state}
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {inventory.map((ad) => (
          <div
            key={ad.id}
            className={`border rounded-lg p-6 transition-all duration-200 cursor-pointer ${
              ad.inventory > 0 
                ? "border-gray-700 hover:border-green-500 hover:bg-gray-900/50" 
                : "border-gray-800 opacity-50"
            }`}
            onClick={() => ad.inventory > 0 && onAdSelect(ad)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{ad.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{ad.description}</p>
                <div className="text-sm text-gray-500">{ad.remaining}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  ${ad.price.toLocaleString()}
                </div>
                <button 
                  disabled={ad.inventory === 0}
                  className={`font-semibold py-2 px-6 rounded-lg transition-colors ${
                    ad.inventory > 0
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (ad.inventory > 0) onAdSelect(ad)
                  }}
                >
                  {ad.inventory > 0 ? 'SELECT →' : 'SOLD OUT'}
                </button>
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