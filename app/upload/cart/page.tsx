"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'

interface OrderItem {
  itemId: string
  state: string
  adType: string
  title: string
  price: number
  quantity: number
  reservationId: string
}

interface UploadFormData {
  brandName: string
  documentFile: File | null
  photoFile: File | null
  dispensaryAddress: string
  webAddress: string
  phoneNumber: string
  instagram: string
  logoFile: File | null
}

function CartUploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('paymentIntentId')

  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customerInfo, setCustomerInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [uploadedItems, setUploadedItems] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<UploadFormData>({
    brandName: '',
    documentFile: null,
    photoFile: null,
    dispensaryAddress: '',
    webAddress: '',
    phoneNumber: '',
    instagram: '',
    logoFile: null
  })

  useEffect(() => {
    if (!paymentIntentId) {
      alert('Missing payment information')
      router.push('/')
      return
    }

    // Fetch order details from database
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/${paymentIntentId}`)

        if (response.ok) {
          const order = await response.json()
          setOrderItems(order.items)
          setCustomerInfo({
            email: order.customerEmail,
            fullName: order.customerName,
            phone: order.customerPhone
          })
        } else {
          alert('Could not load order details. Please contact support.')
          router.push('/')
        }
      } catch (error) {
        console.error('Error fetching order details:', error)
        alert('Error loading order details')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [paymentIntentId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof UploadFormData) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }))
  }

  const resetForm = () => {
    setFormData({
      brandName: '',
      documentFile: null,
      photoFile: null,
      dispensaryAddress: '',
      webAddress: '',
      phoneNumber: '',
      instagram: '',
      logoFile: null
    })
  }

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      router.push('/account/orders')
      return
    }

    const currentItem = orderItems[currentItemIndex]

    if (!customerInfo?.email) {
      alert('Error: No customer information found. Please contact support.')
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = new FormData()

      submitData.append('customerEmail', customerInfo.email)
      submitData.append('customerName', customerInfo.fullName)
      submitData.append('customerPhone', customerInfo.phone)
      submitData.append('state', currentItem.state)
      submitData.append('adType', currentItem.adType)
      submitData.append('selectedAd', JSON.stringify({
        id: currentItem.adType,
        title: currentItem.title,
        price: currentItem.price
      }))

      // Link submission to order and item
      submitData.append('orderId', paymentIntentId)
      submitData.append('itemId', currentItem.itemId)

      submitData.append('brandName', formData.brandName)
      submitData.append('dispensaryAddress', formData.dispensaryAddress)
      submitData.append('webAddress', formData.webAddress)
      submitData.append('phoneNumber', formData.phoneNumber)
      submitData.append('instagram', formData.instagram)

      if (formData.documentFile) {
        submitData.append('documentFile', formData.documentFile)
      }
      if (formData.photoFile) {
        submitData.append('photoFile', formData.photoFile)
      }
      if (formData.logoFile) {
        submitData.append('logoFile', formData.logoFile)
      }

      const response = await fetch('/api/upload-requirements', {
        method: 'POST',
        body: submitData
      })

      const result = await response.json()

      if (result.success) {
        // Mark current item as uploaded in database
        try {
          await fetch(`/api/orders/${paymentIntentId}/mark-uploaded`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: currentItem.itemId })
          })
        } catch (error) {
          console.error('Failed to mark item as uploaded:', error)
        }

        // Mark current item as uploaded locally
        setUploadedItems(prev => new Set(prev).add(currentItemIndex))

        // Move to next item or finish
        if (currentItemIndex < orderItems.length - 1) {
          setCurrentItemIndex(currentItemIndex + 1)
          resetForm()
        } else {
          // All items uploaded
          router.push('/account/orders?uploaded=true')
        }
      } else {
        alert('Upload failed: ' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('There was an error uploading your files. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    if (currentItemIndex < orderItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
      resetForm()
    } else {
      router.push('/account/orders')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="text-white text-xl">Loading upload requirements...</div>
        </div>
      </div>
    )
  }

  if (orderItems.length === 0 || !customerInfo) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">No items to upload</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  const currentItem = orderItems[currentItemIndex]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-center mb-4">
            UPLOAD REQUIREMENTS
          </h1>

          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <p className="text-green-400 text-sm lg:text-base">
              Uploading for item {currentItemIndex + 1} of {orderItems.length}
            </p>
            <p className="text-white font-bold mt-2">
              {currentItem.title} - {currentItem.state}
            </p>
            {currentItem.quantity > 1 && (
              <p className="text-gray-400 text-sm">
                Quantity: {currentItem.quantity}
              </p>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2 mb-6">
            {orderItems.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full ${
                  uploadedItems.has(index)
                    ? 'bg-green-600'
                    : index === currentItemIndex
                    ? 'bg-green-400'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 1/4 Page Advertorial Section */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">1/4 PAGE ADVERTORIAL</h2>

          <div className="space-y-4">
            <input
              type="text"
              name="brandName"
              placeholder="Dispensary/Brand Name"
              value={formData.brandName}
              onChange={handleInputChange}
              className="w-full p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
              style={{ fontSize: '16px' }}
            />

            <div>
              <label className="block">
                <div className="bg-green-600 rounded-md p-3 lg:p-4 cursor-pointer hover:bg-green-700 transition-colors">
                  <input
                    type="file"
                    accept=".txt,.docx,.pdf"
                    onChange={(e) => handleFileChange(e, 'documentFile')}
                    className="hidden"
                  />
                  <span className="text-black text-base block truncate">
                    {formData.documentFile ? formData.documentFile.name : 'Document Upload: .TXT .DOCX .PDF'}
                  </span>
                </div>
              </label>
              <p className="text-gray-400 text-xs lg:text-sm mt-1 ml-2">
                Document Requirements: 50 - 60 Words
              </p>
            </div>

            <div>
              <label className="block">
                <div className="bg-green-600 rounded-md p-3 lg:p-4 cursor-pointer hover:bg-green-700 transition-colors">
                  <input
                    type="file"
                    accept=".jpeg,.jpg,.png,.tiff"
                    onChange={(e) => handleFileChange(e, 'photoFile')}
                    className="hidden"
                  />
                  <span className="text-black text-base block truncate">
                    {formData.photoFile ? formData.photoFile.name : 'Photo Upload: .JPEG .PNG .TIFF'}
                  </span>
                </div>
              </label>
              <p className="text-gray-400 text-xs lg:text-sm mt-1 ml-2">
                Photo Requirements: Landscape - min 1600px x 900px
              </p>
            </div>
          </div>
        </div>

        {/* Single Listing Section */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">SINGLE LISTING</h2>

          <div className="space-y-4">
            <input
              type="text"
              name="dispensaryAddress"
              placeholder="Dispensary Address"
              value={formData.dispensaryAddress}
              onChange={handleInputChange}
              className="w-full p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
              style={{ fontSize: '16px' }}
            />

            <input
              type="url"
              name="webAddress"
              placeholder="Web Address"
              value={formData.webAddress}
              onChange={handleInputChange}
              className="w-full p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
              style={{ fontSize: '16px' }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
                style={{ fontSize: '16px' }}
              />
              <input
                type="text"
                name="instagram"
                placeholder="Instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                className="p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Digital Listing Section */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">DIGITAL LISTING</h2>

          <div>
            <label className="block">
              <div className="bg-green-600 rounded-md p-3 lg:p-4 cursor-pointer hover:bg-green-700 transition-colors">
                <input
                  type="file"
                  accept=".eps,.ai,.svg,.pdf"
                  onChange={(e) => handleFileChange(e, 'logoFile')}
                  className="hidden"
                />
                <span className="text-black text-base block truncate">
                  {formData.logoFile ? formData.logoFile.name : 'Logo Upload: .EPS .AI .SVG .PDF'}
                </span>
              </div>
            </label>
            <p className="text-gray-400 text-xs lg:text-sm mt-1 ml-2">
              Logo Requirements: Vector File ONLY
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-10 lg:mt-12">
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white text-xl font-bold rounded-full transition-colors disabled:cursor-not-allowed"
          >
            SKIP
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-12 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-black text-xl font-bold rounded-full transition-colors disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'UPLOADING...' : currentItemIndex < orderItems.length - 1 ? 'SUBMIT & NEXT' : 'SUBMIT & FINISH'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CartUploadPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    }>
      <CartUploadContent />
    </Suspense>
  )
}
