"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, Copy, Loader2 } from 'lucide-react'
import type { UploadSchema } from '@/lib/types'

interface Ad {
  id: string
  state: string
  adType: string
  title: string
  price: number
  inventory: number
}

interface StateInfo {
  code: string
  name: string
}

export default function BulkApplySchemaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [schema, setSchema] = useState<UploadSchema | null>(null)
  const [adsByState, setAdsByState] = useState<Record<string, Ad[]>>({})
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    successCount: number
    failCount: number
    results: any[]
  } | null>(null)

  useEffect(() => {
    // Parse schema from URL
    const templateSchema = searchParams.get('templateSchema')
    if (templateSchema) {
      try {
        const parsedSchema = JSON.parse(decodeURIComponent(templateSchema))
        setSchema(parsedSchema)
      } catch (error) {
        console.error('Error parsing schema:', error)
      }
    }

    // Fetch all ads
    fetchAds()
  }, [searchParams])

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/admin/ads')
      if (response.ok) {
        const data = await response.json()

        // Group ads by state
        const grouped: Record<string, Ad[]> = {}
        data.forEach((ad: Ad) => {
          if (!grouped[ad.state]) {
            grouped[ad.state] = []
          }
          grouped[ad.state].push(ad)
        })

        setAdsByState(grouped)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
      setLoading(false)
    }
  }

  const toggleAd = (adId: string) => {
    setSelectedAds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(adId)) {
        newSet.delete(adId)
      } else {
        newSet.add(adId)
      }
      return newSet
    })
  }

  const toggleState = (state: string) => {
    const stateAds = adsByState[state] || []
    const stateAdIds = stateAds.map(ad => ad.id)
    const allSelected = stateAdIds.every(id => selectedAds.has(id))

    setSelectedAds(prev => {
      const newSet = new Set(prev)
      if (allSelected) {
        // Deselect all in this state
        stateAdIds.forEach(id => newSet.delete(id))
      } else {
        // Select all in this state
        stateAdIds.forEach(id => newSet.add(id))
      }
      return newSet
    })
  }

  const selectAll = () => {
    const allAdIds = Object.values(adsByState).flat().map(ad => ad.id)
    setSelectedAds(new Set(allAdIds))
  }

  const deselectAll = () => {
    setSelectedAds(new Set())
  }

  const applySchema = async () => {
    if (!schema || selectedAds.size === 0) return

    setApplying(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/bulk-apply-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema,
          adIds: Array.from(selectedAds)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)

        if (data.successCount > 0) {
          // Show success message
          setTimeout(() => {
            if (confirm(`Schema applied successfully to ${data.successCount} ads! Return to ads page?`)) {
              router.push('/admin/ads')
            }
          }, 500)
        }
      } else {
        alert('Failed to apply schema')
      }
    } catch (error) {
      console.error('Error applying schema:', error)
      alert('Error applying schema')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="text-center">
          <p className="text-red-400">No schema provided</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-8 font-mono">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Schema Editor
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Copy className="w-8 h-8" />
            BULK APPLY SCHEMA
          </h1>
          <p className="text-green-300">
            Apply this schema to multiple ads at once
          </p>
        </div>

        {/* Schema Preview */}
        <div className="mb-8 p-6 bg-gray-900 border-2 border-green-500 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Schema to Apply:</h2>
          <div className="space-y-2">
            <p className="text-green-300">
              <span className="text-yellow-400">Fields:</span> {schema.fields.length}
            </p>
            <div className="pl-4 space-y-1">
              {schema.fields.map((field, index) => (
                <div key={index} className="text-sm">
                  <span className="text-blue-400">{field.label}</span>
                  <span className="text-gray-500"> ({field.fieldType})</span>
                  {field.required && <span className="text-red-400"> *</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Deselect All
          </button>
          <div className="ml-auto">
            <button
              onClick={applySchema}
              disabled={selectedAds.size === 0 || applying}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {applying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Apply to {selectedAds.size} Selected Ad{selectedAds.size !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            result.failCount === 0 ? 'bg-green-900/20 border-green-500' : 'bg-yellow-900/20 border-yellow-500'
          }`}>
            <h3 className="font-bold mb-2">Results:</h3>
            <p className="text-green-300">✓ Successful: {result.successCount}</p>
            {result.failCount > 0 && (
              <p className="text-red-400">✗ Failed: {result.failCount}</p>
            )}
          </div>
        )}

        {/* Ads List by State */}
        <div className="space-y-6">
          {Object.entries(adsByState).map(([state, ads]) => {
            const stateAdIds = ads.map(ad => ad.id)
            const allStateSelected = stateAdIds.every(id => selectedAds.has(id))
            const someStateSelected = stateAdIds.some(id => selectedAds.has(id)) && !allStateSelected

            return (
              <div key={state} className="bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
                {/* State Header */}
                <div
                  className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-3 cursor-pointer hover:bg-gray-750"
                  onClick={() => toggleState(state)}
                >
                  <input
                    type="checkbox"
                    checked={allStateSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someStateSelected
                    }}
                    onChange={() => toggleState(state)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <h3 className="text-xl font-bold text-green-400">
                    {state}
                  </h3>
                  <span className="text-gray-500">
                    ({ads.length} ad{ads.length !== 1 ? 's' : ''})
                  </span>
                </div>

                {/* Ads in State */}
                <div className="p-4 space-y-2">
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      className={`p-3 rounded border-2 cursor-pointer transition-colors ${
                        selectedAds.has(ad.id)
                          ? 'bg-green-900/20 border-green-500'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => toggleAd(ad.id)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAds.has(ad.id)}
                          onChange={() => toggleAd(ad.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold">{ad.title}</span>
                            <span className="text-sm text-gray-500">
                              ({ad.state}#{ad.adType})
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            ${ad.price} • {ad.inventory} available
                          </div>
                        </div>
                        {selectedAds.has(ad.id) && (
                          <Check className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
