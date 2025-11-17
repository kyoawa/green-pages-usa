"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, ExternalLink } from 'lucide-react'

interface Submission {
  id: string
  orderId: string
  itemId: string
  slotNumber: number
  adType: string
  state: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  submittedAt: string
  lastEditedAt?: string
  status: 'pending' | 'approved' | 'published'
  fieldData: { [key: string]: any }
  fileUrls: { [key: string]: string | string[] }
}

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmission()
  }, [params.id])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/submissions/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSubmission(data)
      } else {
        console.error('Failed to fetch submission')
      }
    } catch (error) {
      console.error('Error fetching submission:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = (url: string, fieldName: string) => {
    // Use our API endpoint to generate a signed URL
    const downloadUrl = `/api/admin/download-file?url=${encodeURIComponent(url)}`
    window.open(downloadUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading submission...</div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Submission Not Found</h1>
          <button
            onClick={() => router.back()}
            className="text-green-400 hover:text-green-300"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Submissions
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-wider mb-2">
                SUBMISSION DETAILS
              </h1>
              <p className="text-gray-400">ID: {submission.id}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                submission.status === 'published' ? 'bg-green-500 text-black' :
                submission.status === 'approved' ? 'bg-yellow-500 text-black' :
                'bg-gray-700 text-white'
              }`}>
                {submission.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-green-400 mb-4">ORDER INFORMATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Order ID</p>
              <p className="text-white font-mono">{submission.orderId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Item ID</p>
              <p className="text-white font-mono">{submission.itemId}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Slot Number</p>
              <p className="text-white">{submission.slotNumber}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">State</p>
              <p className="text-white">{submission.state}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Ad Type</p>
              <p className="text-white">{submission.adType}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Submitted At</p>
              <p className="text-white">{new Date(submission.submittedAt).toLocaleString()}</p>
            </div>
            {submission.lastEditedAt && (
              <div>
                <p className="text-gray-400 text-sm">Last Edited</p>
                <p className="text-white">{new Date(submission.lastEditedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-green-400 mb-4">CUSTOMER INFORMATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Name</p>
              <p className="text-white">{submission.customerName}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-white">{submission.customerEmail}</p>
            </div>
            {submission.customerPhone && (
              <div>
                <p className="text-gray-400 text-sm">Phone</p>
                <p className="text-white">{submission.customerPhone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Data */}
        {/* Support both fieldData (new) and formData (old) for backward compatibility */}
        {(() => {
          const fields = submission.fieldData || (submission as any).formData || {}
          return Object.keys(fields).length > 0 && (
            <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-green-400 mb-4">FORM DATA</h2>
              <div className="space-y-4">
                {Object.entries(fields).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-700 pb-3 last:border-b-0">
                    <p className="text-gray-400 text-sm mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-white whitespace-pre-wrap">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Uploaded Files */}
        {submission.fileUrls && Object.keys(submission.fileUrls).length > 0 && (
          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">UPLOADED FILES</h2>
            <div className="space-y-3">
              {Object.entries(submission.fileUrls).map(([fieldName, urls]) => {
                const urlArray = Array.isArray(urls) ? urls : [urls]
                return (
                  <div key={fieldName} className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2 capitalize">
                      {fieldName.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <div className="space-y-2">
                      {urlArray.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-900 p-3 rounded">
                          <div className="flex items-center gap-3">
                            <div className="text-green-400">
                              {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? '🖼️' : '📄'}
                            </div>
                            <div>
                              <p className="text-white text-sm font-mono truncate max-w-md">
                                {url.split('/').pop()?.split('?')[0] || `File ${index + 1}`}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'Image' : 'Document'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadFile(url, fieldName)}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
