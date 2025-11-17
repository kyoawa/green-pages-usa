"use client"

import { useState, useEffect } from 'react'
import { Download, Eye, Search, Filter, Trash2 } from 'lucide-react'

interface Submission {
  id: string
  orderId: string
  itemId: string
  slotNumber: number
  adType: string
  state: string
  customerEmail: string
  customerName: string
  submittedAt: string
  status: 'pending' | 'approved' | 'published'
  fieldData: { [key: string]: any }
  fileUrls: { [key: string]: string | string[] }
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    state: 'all',
    adType: 'all',
    status: 'all',
    search: ''
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filter.state !== 'all' && sub.state !== filter.state) return false
    if (filter.adType !== 'all' && sub.adType !== filter.adType) return false
    if (filter.status !== 'all' && sub.status !== filter.status) return false
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      const searchableText = `${sub.customerName || ''} ${sub.customerEmail || ''} ${sub.orderId || ''} ${sub.itemId || ''}`.toLowerCase()
      if (!searchableText.includes(searchLower)) return false
    }
    return true
  })

  const handleDeleteSubmission = async (submissionId: string, customerName: string) => {
    // Step 1: Set the ID to show confirmation
    if (deletingId !== submissionId) {
      setDeletingId(submissionId)
      return
    }

    // Step 2: Actually delete
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert(`Submission for ${customerName} deleted successfully`)
        fetchSubmissions()
        setDeletingId(null)
      } else {
        alert('Failed to delete submission')
      }
    } catch (error) {
      console.error('Error deleting submission:', error)
      alert('Error deleting submission')
    }
  }

  const exportToCSV = () => {
    if (filteredSubmissions.length === 0) return

    // Get all unique field names across all submissions
    // Support both fieldData (new) and formData (old) for backward compatibility
    const allFieldNames = new Set<string>()
    filteredSubmissions.forEach(sub => {
      const fields = sub.fieldData || (sub as any).formData || {}
      Object.keys(fields).forEach(key => allFieldNames.add(key))
    })

    // Create CSV header
    const headers = [
      'Order ID',
      'Item ID',
      'Slot',
      'State',
      'Ad Type',
      'Customer Name',
      'Customer Email',
      'Submitted At',
      'Status',
      ...Array.from(allFieldNames)
    ]

    // Create CSV rows
    const rows = filteredSubmissions.map(sub => [
      sub.orderId,
      sub.itemId,
      sub.slotNumber,
      sub.state,
      sub.adType,
      sub.customerName,
      sub.customerEmail,
      new Date(sub.submittedAt).toLocaleString(),
      sub.status,
      ...Array.from(allFieldNames).map(field => {
        // Support both fieldData (new) and formData (old) for backward compatibility
        const fields = sub.fieldData || (sub as any).formData || {}
        const value = fields[field]
        if (typeof value === 'object') return JSON.stringify(value)
        return value || ''
      })
    ])

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `submissions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get unique states and ad types for filters
  const uniqueStates = Array.from(new Set(submissions.map(s => s.state))).sort()
  const uniqueAdTypes = Array.from(new Set(submissions.map(s => s.adType))).sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading submissions...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-wider">
              SUBMISSIONS
            </h1>
            <p className="text-gray-400 mt-2">
              {filteredSubmissions.length} of {submissions.length} submissions
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={filteredSubmissions.length === 0}
            className="flex items-center bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5 mr-2" />
            EXPORT CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-green-400" />
            <h2 className="text-xl font-bold">FILTERS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Name, email, order ID..."
                  className="w-full pl-10 p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
                />
              </div>
            </div>

            {/* State Filter */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">State</label>
              <select
                value={filter.state}
                onChange={(e) => setFilter(prev => ({ ...prev, state: e.target.value }))}
                className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
              >
                <option value="all">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Ad Type Filter */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Ad Type</label>
              <select
                value={filter.adType}
                onChange={(e) => setFilter(prev => ({ ...prev, adType: e.target.value }))}
                className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
              >
                <option value="all">All Types</option>
                {uniqueAdTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-3 bg-gray-800 text-white border-2 border-gray-600 rounded-md focus:outline-none focus:border-green-400"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(filter.search || filter.state !== 'all' || filter.adType !== 'all' || filter.status !== 'all') && (
            <button
              onClick={() => setFilter({ state: 'all', adType: 'all', status: 'all', search: '' })}
              className="mt-4 text-sm text-gray-400 hover:text-white"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Submissions Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">No submissions found</p>
          </div>
        ) : (
          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b-2 border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-green-400 font-semibold">Order</th>
                    <th className="px-6 py-4 text-left text-green-400 font-semibold">Item/Slot</th>
                    <th className="px-6 py-4 text-left text-green-400 font-semibold">State</th>
                    <th className="px-6 py-4 text-left text-green-400 font-semibold">Ad Type</th>
                    <th className="px-6 py-4 text-left text-green-400 font-semibold">Customer</th>
                    <th className="px-6 py-4 text-left text-green-400 font-semibold">Submitted</th>
                    <th className="px-6 py-4 text-left text-green-400 font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-green-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission, index) => (
                    <tr
                      key={submission.id}
                      className={`border-b border-gray-800 ${index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'} hover:bg-gray-800`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-300">
                          {submission.orderId ? `${submission.orderId.slice(0, 20)}...` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-white">{submission.itemId}</div>
                          <div className="text-gray-400">Slot {submission.slotNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-sm">
                          {submission.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{submission.adType}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-white">{submission.customerName}</div>
                          <div className="text-gray-400 text-xs">{submission.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          submission.status === 'published' ? 'bg-green-900 text-green-300' :
                          submission.status === 'approved' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/admin/submissions/${submission.id}`, '_blank')}
                            className="flex items-center text-green-400 hover:text-green-300"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteSubmission(submission.id, submission.customerName)}
                            className={`flex items-center px-3 py-1 rounded transition-colors ${
                              deletingId === submission.id
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'text-red-400 hover:text-red-300'
                            }`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingId === submission.id ? 'Confirm?' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
