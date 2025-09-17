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
    const stateMap: { [key: string]: { code: string, name: string } } = {
      'california': { code: 'CA', name: 'California' },
      'illinois': { code: 'IL', name: 'Illinois' },
      'missouri': { code: 'MO', name: 'Missouri' },
      'montana': { code: 'MT', name: 'Montana' },
      'newyork': { code: 'NY', name: 'New York' },
      'new-york': { code: 'NY', name: 'New York' },
      'oklahoma': { code: 'OK', name: 'Oklahoma' },
      'texas': { code: 'TX', name: 'Texas' },
      'florida': { code: 'FL', name: 'Florida' },
      'washington': { code: 'WA', name: 'Washington' },
      'oregon': { code: 'OR', name: 'Oregon' },
      'nevada': { code: 'NV', name: 'Nevada' },
      'arizona': { code: 'AZ', name: 'Arizona' },
      'colorado': { code: 'CO', name: 'Colorado' },
      'utah': { code: 'UT', name: 'Utah' },
      'newmexico': { code: 'NM', name: 'New Mexico' }
    }
    
    if (urlParam.length === 2) {
      const code = urlParam.toUpperCase()
      return { code, name: getStateName(code) }
    }
    
    return stateMap[urlParam.toLowerCase()] || { code: urlParam.toUpperCase(), name: urlParam }
  }

  const getStateName = (code: string) => {
    const stateNames: { [key: string]: string } = {
      'CA': 'California', 'IL': 'Illinois', 'MO': 'Missouri', 
      'MT': 'Montana', 'NY': 'New York', 'OK': 'Oklahoma',
      'TX': 'Texas', 'FL': 'Florida', 'WA': 'Washington',
      'OR': 'Oregon', 'NV': 'Nevada', 'AZ': 'Arizona',
      'CO': 'Colorado', 'UT': 'Utah', 'NM': 'New Mexico'
    }
    return stateNames[code] || code
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
          <a href="#" className="text-gray-300 hover:text-white">ABOUT</a>
          <a href="#" className="text-gray-300 hover:text-white">DIGITAL</a>
          <a href="#" className="text-gray-300 hover:text-white">PRINT</a>
          <a href="#" className="text-gray-300 hover:text-white">CONTACT</a>
        </nav>
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
      <footer className="p-6 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">PRESENTED BY CANNABIS NOW & LIONTEK MEDIA</div>
          <div className="flex space-x-4">
            <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
          </div>
        </div>
      </footer>
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