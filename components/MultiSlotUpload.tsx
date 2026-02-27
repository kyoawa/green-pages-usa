"use client"

import React, { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, Circle, Edit2 } from 'lucide-react'
import DynamicUploadForm from './DynamicUploadForm'
import type { UploadSchema } from '@/lib/types'

interface OrderItem {
  itemId: string
  state: string
  adType: string
  title: string
  price: number
  quantity: number
}

interface SlotSubmission {
  slotNumber: number
  submissionId: string | null
  status: 'pending' | 'completed'
  submittedAt?: string
  lastEditedAt?: string
}

interface MultiSlotUploadProps {
  orderId: string
  orderItem: OrderItem
  customerInfo: {
    email: string
    fullName: string
    phone: string
  }
  existingSlots?: SlotSubmission[]
  onComplete: () => void
}

export default function MultiSlotUpload({
  orderId,
  orderItem,
  customerInfo,
  existingSlots = [],
  onComplete
}: MultiSlotUploadProps) {
  const [currentSlot, setCurrentSlot] = useState(1)
  const [slots, setSlots] = useState<SlotSubmission[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [adSchema, setAdSchema] = useState<UploadSchema | null>(null)
  const [loadingSchema, setLoadingSchema] = useState(true)
  const [existingData, setExistingData] = useState<any>(null)

  // Fetch ad schema on mount
  useEffect(() => {
    fetchAdSchema()
  }, [orderItem.state, orderItem.adType])

  // Initialize slots on mount
  useEffect(() => {
    if (existingSlots.length > 0) {
      setSlots(existingSlots)
      // Find first pending slot
      const firstPending = existingSlots.find(s => s.status === 'pending')
      if (firstPending) {
        setCurrentSlot(firstPending.slotNumber)
      }
    } else {
      // Create new slots
      const newSlots: SlotSubmission[] = []
      for (let i = 1; i <= orderItem.quantity; i++) {
        newSlots.push({
          slotNumber: i,
          submissionId: null,
          status: 'pending'
        })
      }
      setSlots(newSlots)
    }
  }, [orderItem.quantity, existingSlots])

  // Load existing submission data when editing
  useEffect(() => {
    const currentSlotData = slots.find(s => s.slotNumber === currentSlot)
    if (currentSlotData?.submissionId && currentSlotData.status === 'completed') {
      loadSubmissionData(currentSlotData.submissionId)
    } else {
      // Reset for new slot
      setExistingData(null)
    }
  }, [currentSlot])

  const fetchAdSchema = async () => {
    try {
      const adId = `${orderItem.state}#${orderItem.adType}`
      console.log('🔍 Fetching schema for ad ID:', adId)
      const response = await fetch(`/api/admin/ads/${encodeURIComponent(adId)}`)
      console.log('📡 Response status:', response.status)
      if (response.ok) {
        const ad = await response.json()
        console.log('📦 Ad data received:', ad)
        console.log('📋 Upload schema:', ad.uploadSchema)
        if (ad.uploadSchema) {
          setAdSchema(ad.uploadSchema)
          console.log('✅ Schema loaded successfully')
        } else {
          console.warn('⚠️ No upload schema found for this ad.')
        }
      } else {
        console.error('❌ Failed to fetch ad, status:', response.status)
      }
    } catch (error) {
      console.error('💥 Error fetching ad schema:', error)
    } finally {
      setLoadingSchema(false)
    }
  }

  const loadSubmissionData = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`)
      if (response.ok) {
        const data = await response.json()
        setExistingData(data)
      }
    } catch (error) {
      console.error('Error loading submission:', error)
    }
  }

  const handleSlotSubmit = async (formData: FormData) => {
    if (!customerInfo?.email) {
      throw new Error('No customer information found')
    }

    setIsSubmitting(true)

    try {
      // Add required metadata to formData
      formData.append('customerEmail', customerInfo.email)
      formData.append('customerName', customerInfo.fullName)
      formData.append('customerPhone', customerInfo.phone)
      formData.append('state', orderItem.state)
      formData.append('orderId', orderId)
      formData.append('itemId', orderItem.itemId)
      formData.append('slotNumber', currentSlot.toString())
      formData.append('adType', orderItem.adType)
      formData.append('adTitle', orderItem.title)

      const response = await fetch('/api/upload-requirements/slot', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Update slot status locally
        const updatedSlots = slots.map(slot =>
          slot.slotNumber === currentSlot
            ? {
                ...slot,
                submissionId: result.submissionId,
                status: 'completed' as const,
                submittedAt: slot.submittedAt || new Date().toISOString(),
                lastEditedAt: new Date().toISOString()
              }
            : slot
        )
        setSlots(updatedSlots)

        // Move to next pending slot or complete
        const nextPendingSlot = updatedSlots.find(s => s.slotNumber > currentSlot && s.status === 'pending')
        if (nextPendingSlot) {
          setCurrentSlot(nextPendingSlot.slotNumber)
          setExistingData(null)
        } else {
          // Check if all slots are now completed
          const allComplete = updatedSlots.every(s => s.status === 'completed')
          if (allComplete) {
            onComplete()
          } else {
            // Stay on current slot (user is editing an existing submission)
            alert('Slot saved successfully!')
          }
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSlotClick = (slotNumber: number) => {
    setCurrentSlot(slotNumber)
  }

  const completedCount = slots.filter(s => s.status === 'completed').length
  const totalSlots = slots.length

  if (loadingSchema) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading upload form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
        <h1 className="text-3xl lg:text-5xl font-bold text-center mb-4 lg:mb-6">
          UPLOAD REQUIREMENTS
        </h1>

        {/* Order Info */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <p className="text-green-400 text-sm lg:text-base font-bold mb-1">
            {orderItem.title} - {orderItem.state}
          </p>
          <p className="text-gray-400 text-xs lg:text-sm">
            Customer: {customerInfo.fullName} ({customerInfo.email})
          </p>
          <p className="text-gray-400 text-xs lg:text-sm mt-1">
            Progress: {completedCount} of {totalSlots} slots completed ({Math.round((completedCount / totalSlots) * 100)}%)
          </p>
        </div>

        {/* Slot Navigation */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold mb-3">Select Slot to Edit:</h2>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.slotNumber}
                onClick={() => handleSlotClick(slot.slotNumber)}
                className={`aspect-square rounded-lg border-2 transition-all duration-200 flex items-center justify-center relative ${
                  slot.slotNumber === currentSlot
                    ? 'border-green-400 bg-green-400 text-black scale-110'
                    : slot.status === 'completed'
                    ? 'border-green-600 bg-green-900 text-green-400 hover:border-green-500'
                    : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="font-bold">{slot.slotNumber}</span>
                {slot.status === 'completed' && (
                  <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-green-400 bg-black rounded-full" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            <Circle className="inline w-3 h-3 mr-1" /> Pending ·
            <CheckCircle2 className="inline w-3 h-3 ml-2 mr-1" /> Completed ·
            <Edit2 className="inline w-3 h-3 ml-2 mr-1" /> Editing
          </p>
        </div>

        {/* Current Slot Info */}
        <div className="bg-gradient-to-r from-green-900/30 to-gray-900/30 rounded-lg p-4 mb-6 border border-green-700">
          <h2 className="text-xl lg:text-2xl font-bold text-green-400">
            SLOT {currentSlot} of {totalSlots}
            {slots[currentSlot - 1]?.status === 'completed' && (
              <span className="text-sm text-gray-400 ml-3">(Editing existing submission)</span>
            )}
          </h2>
        </div>

        {/* Upload Form */}
        {adSchema ? (
          <div>
            <DynamicUploadForm
              schema={adSchema}
              onSubmit={handleSlotSubmit}
              initialData={existingData}
              buttonText={slots[currentSlot - 1]?.status === 'completed' ? 'UPDATE SLOT' : `SAVE SLOT ${currentSlot}`}
              isSubmitting={isSubmitting}
              orderId={orderId}
              itemId={orderItem.itemId}
              slotNumber={currentSlot}
            />

            {/* Save & Finish Later Button */}
            {completedCount > 0 && completedCount < totalSlots && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={onComplete}
                  className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold rounded-full transition-colors"
                >
                  SAVE & FINISH LATER
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-6 text-center">
            <p className="text-yellow-400 font-bold mb-2">No Upload Schema Configured</p>
            <p className="text-gray-400 text-sm">
              The administrator has not yet configured an upload form for this ad type.
              Please contact support for assistance.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
