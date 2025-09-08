"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { EnhancedCheckoutStep } from '@/components/EnhancedCheckout'
import UploadRequirements from '@/components/UploadRequirements'
import { ArrowRight, Facebook, Twitter, Instagram, Loader2 } from "lucide-react"

interface AdData {
  id: string
  title: string
  price: number
  remaining: string
  description: string
  inventory: number
  total_slots: number
}

export default function IllinoisPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null)
  const [inventory, setInventory] = useState<AdData[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<{email: string, fullName: string, phone: string} | null>(null)
  
  const steps = ["Choose Your Ad", "Checkout", "Upload Requirements", "Order Summary"]

  // Fetch inventory on component mount
  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/IL')
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <img
            src="/logo.svg"
            alt="Green Pages"
            className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => (window.location.href = "/")}
          />
        </div>
        <nav className="flex space-x-8">
          <a href="#" className="text-gray-300 hover:text-white">ABOUT</a>
          <a href="#" className="text-gray-300 hover:text-white">DIGITAL</a>
          <a href="#" className="text-gray-300 hover:text-white">PRINT</a>
          <a href="#" className="text-gray-300 hover:text-white">CONTACT</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {currentStep === 0 && (
          <AdSelectionStep 
            onAdSelect={handleAdSelect} 
            state="Illinois" 
            stateCode="IL"
            inventory={inventory}
            loading={loading}
            onRefresh={fetchInventory}
          />
        )}

        {currentStep === 1 && (
          <EnhancedCheckoutStep 
            onPaymentSuccess={handlePaymentSuccess}
            state="Illinois" 
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
          <OrderSummaryStep state="Illinois" selectedAd={selectedAd} />
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
      MO: "/states/mo.svg",
    }
    return stateMap[code] || null
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>Loading inventory...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <img src={getStateSvg(stateCode) || "/placeholder.svg"} alt={`${state} state`} className="w-full h-auto" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">CHOOSE YOUR AD</h1>
              <h2 className="text-2xl text-green-500">{state.toUpperCase()} ADS AVAILABLE</h2>
            </div>
            <Button 
              onClick={onRefresh}
              variant="outline" 
              size="sm"
              className="border-gray-600 hover:border-green-500"
            >
              Refresh
            </Button>
          </div>

          <div className="space-y-6">
            {inventory.map((ad) => (
              <AdOption key={ad.id} ad={ad} onSelect={() => onAdSelect(ad)} />
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-400 mb-4">*INCLUDES GEOTARGETED DIGITAL IMPRESSIONS & SINGLE LISTING</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdOption({ ad, onSelect }: { ad: AdData; onSelect: () => void }) {
  const isOutOfStock = ad.inventory <= 0
  
  return (
    <Card className={`border p-6 ${isOutOfStock ? 'bg-gray-800 border-gray-600' : 'bg-gray-900 border-gray-700'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={`text-xl font-bold mb-2 ${isOutOfStock ? 'text-gray-400' : 'text-white'}`}>
            {ad.title}
          </h3>
          <p className={`${isOutOfStock ? 'text-red-500' : 'text-green-500'}`}>
            {isOutOfStock ? 'SOLD OUT' : ad.remaining}
          </p>
        </div>
        <Button 
          onClick={onSelect} 
          disabled={isOutOfStock}
          className={`${
            isOutOfStock 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isOutOfStock ? 'SOLD OUT' : `BUY $${ad.price}`} 
          {!isOutOfStock && <ArrowRight className="ml-2 w-4 h-4" />}
        </Button>
      </div>
    </Card>
  )
}

function OrderSummaryStep({ state, selectedAd }: { state: string; selectedAd: AdData | null }) {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-8">ORDER CONFIRMATION</h1>
      
      <Card className="bg-gray-900 border-gray-700 p-8 mb-8">
        <div className="text-green-400 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold mb-4">Thank you for your order!</h2>
        
        {selectedAd && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-2">Order Details</h3>
            <p className="text-gray-300">{selectedAd.title}</p>
            <p className="text-gray-400">{state} - {selectedAd.description}</p>
            <p className="text-green-400 text-xl font-bold mt-2">${selectedAd.price}</p>
          </div>
        )}

        <p className="text-gray-400 mb-4">
          You will receive a confirmation email shortly with your order details and next steps.
        </p>

        <Button
          onClick={() => (window.location.href = "/")}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold"
        >
          PLACE ANOTHER ORDER
        </Button>
      </Card>
    </div>
  )
}