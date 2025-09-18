"use client"
import { useState, useEffect } from 'react'

interface Submission {
  id: string
  customerEmail: string
  customerName: string
  customerPhone: string
  brandName: string
  dispensaryAddress: string
  webAddress: string
  phoneNumber: string
  instagram: string
  state?: string
  selectedAd?: {
    title: string
    price: number
    description: string
  }
  submittedAt: string
  hasFiles: {
    document: boolean
    photo: boolean
    logo: boolean
  }
  // Add S3 URLs
  documentUrl?: string
  photoUrl?: string
  logoUrl?: string
}

interface StateInfo {
  code: string
  name: string
  active: boolean
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [states, setStates] = useState<StateInfo[]>([])
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set(['CA', 'MT']))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
    fetchStates()
  }, [])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStates = async () => {
    try {
      const response = await fetch('/api/admin/states')
      if (response.ok) {
        const data = await response.json()
        setStates(data)
      }
    } catch (error) {
      console.error('Error fetching states:', error)
    }
  }

  const toggleStateActive = async (stateCode: string) => {
    try {
      const response = await fetch(`/api/admin/states/${stateCode}/toggle`, { 
        method: 'POST' 
      })
      
      if (response.ok) {
        const result = await response.json()
        setStates(prevStates => 
          prevStates.map(state => 
            state.code === stateCode 
              ? { ...state, active: result.state.active }
              : state
          )
        )
        console.log(`State ${stateCode} toggled to: ${result.state.active ? 'ON' : 'OFF'}`)
      } else {
        // If toggle fails, show Edge Config message
        const data = await response.json()
        if (data.message) {
          alert(data.message)
        }
      }
    } catch (error) {
      console.error('Error toggling state:', error)
    }
  }

  const toggleStateExpansion = (stateCode: string) => {
    const newExpanded = new Set(expandedStates)
    if (newExpanded.has(stateCode)) {
      newExpanded.delete(stateCode)
    } else {
      newExpanded.add(stateCode)
    }
    setExpandedStates(newExpanded)
  }

  // Use API route for downloads instead of direct S3 access
  const handleDownload = (submissionId: string, fileType: 'document' | 'photo' | 'logo') => {
    const downloadUrl = `/api/admin/submissions/download?id=${submissionId}&type=${fileType}`
    window.open(downloadUrl, '_blank')
  }

  // Group submissions by state
  const submissionsByState = submissions.reduce((acc, submission) => {
    const stateCode = submission.state || 'Unknown'
    if (!acc[stateCode]) {
      acc[stateCode] = []
    }
    acc[stateCode].push(submission)
    return acc
  }, {} as Record<string, Submission[]>)

  // Calculate stats
  const totalSubmissions = submissions.length
  const totalRevenue = submissions.reduce((sum, sub) => sum + (sub.selectedAd?.price || 0), 0)
  const activeStates = states.filter(state => state.active).length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', color: '#fff' }}>
          Loading submissions...
        </h1>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
            Admin Dashboard
          </h1>
          <button 
            onClick={() => {
              fetchSubmissions()
              fetchStates()
            }} 
            style={{
              backgroundColor: '#22c55e',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Refresh
          </button>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Submissions</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{totalSubmissions}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Revenue</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>${totalRevenue.toLocaleString()}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Active States</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{activeStates}/{states.length}</p>
          </div>
        </div>

        {/* State Management */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>
            State Management
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#9ca3af', marginLeft: '12px' }}>
              (Controls what shows on homepage)
            </span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {states.map((state) => (
              <div key={state.code} style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontWeight: '600', color: '#fff' }}>{state.name}</h3>
                  <button
                    onClick={() => toggleStateActive(state.code)}
                    style={{
                      backgroundColor: state.active ? '#22c55e' : '#6b7280',
                      color: state.active ? '#000' : '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      minWidth: '40px'
                    }}
                  >
                    {state.active ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  <p>Code: {state.code}</p>
                  <p>Submissions: {submissionsByState[state.code]?.length || 0}</p>
                  <p style={{ color: state.active ? '#22c55e' : '#ef4444' }}>
                    {state.active ? 'Visible on homepage' : 'Hidden from homepage'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions by State */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>Submissions by State</h2>
          
          {states.map((state) => {
            const stateSubmissions = submissionsByState[state.code] || []
            const isExpanded = expandedStates.has(state.code)
            
            return (
              <div key={state.code} style={{ marginBottom: '16px' }}>
                {/* State Header */}
                <div 
                  onClick={() => toggleStateExpansion(state.code)}
                  style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    padding: '16px',
                    borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: state.active ? '#22c55e' : '#ef4444' 
                    }}></div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                      {state.name} ({state.code})
                    </h3>
                    <span style={{ 
                      backgroundColor: '#374151', 
                      color: '#fff', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {stateSubmissions.length} submissions
                    </span>
                    {!state.active && (
                      <span style={{ 
                        backgroundColor: '#ef4444', 
                        color: '#fff', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px' 
                      }}>
                        HIDDEN
                      </span>
                    )}
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: '20px' }}>
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>

                {/* State Submissions */}
                {isExpanded && (
                  <div style={{ 
                    backgroundColor: '#111827', 
                    border: '1px solid #374151', 
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '16px'
                  }}>
                    {stateSubmissions.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                        No submissions for this state yet
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {stateSubmissions.map((submission) => (
                          <div 
                            key={submission.id} 
                            style={{ 
                              backgroundColor: '#1f2937', 
                              border: '1px solid #374151', 
                              padding: '20px', 
                              borderRadius: '6px' 
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              {/* Customer & Business Info */}
                              <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e', marginBottom: '12px' }}>
                                  {submission.brandName || 'No Brand Name'}
                                </h3>
                                
                                {/* Ad Purchase Info */}
                                {submission.selectedAd && (
                                  <div style={{ backgroundColor: '#065f46', padding: '10px', borderRadius: '4px', marginBottom: '12px' }}>
                                    <h4 style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>Ad Purchased:</h4>
                                    <div style={{ color: '#fff', fontSize: '12px' }}>
                                      <div><strong>{submission.selectedAd.title}</strong></div>
                                      <div>${submission.selectedAd.price} - {submission.selectedAd.description}</div>
                                    </div>
                                  </div>
                                )}
                                
                                <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#e5e7eb' }}>
                                  <div><strong style={{ color: '#fff' }}>Customer:</strong> {submission.customerName}</div>
                                  <div><strong style={{ color: '#fff' }}>Email:</strong> {submission.customerEmail}</div>
                                  <div><strong style={{ color: '#fff' }}>Phone:</strong> {submission.customerPhone}</div>
                                  <div><strong style={{ color: '#fff' }}>Business Phone:</strong> {submission.phoneNumber || 'Not provided'}</div>
                                  <div><strong style={{ color: '#fff' }}>Address:</strong> {submission.dispensaryAddress || 'Not provided'}</div>
                                  <div><strong style={{ color: '#fff' }}>Website:</strong> {submission.webAddress || 'Not provided'}</div>
                                  <div><strong style={{ color: '#fff' }}>Instagram:</strong> {submission.instagram || 'Not provided'}</div>
                                  <div><strong style={{ color: '#fff' }}>Submitted:</strong> {new Date(submission.submittedAt).toLocaleDateString()}</div>
                                </div>
                              </div>

                              {/* Files Section */}
                              <div>
                                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#22c55e', marginBottom: '12px' }}>
                                  Uploaded Files
                                </h4>
                                
                                <div style={{ display: 'grid', gap: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#374151', padding: '8px 12px', borderRadius: '4px' }}>
                                    <span style={{ color: '#fff', fontSize: '13px' }}>Document File</span>
                                    {submission.documentUrl ? (
                                      <button 
                                        onClick={() => handleDownload(submission.id, 'document')}
                                        style={{
                                          backgroundColor: '#22c55e',
                                          color: '#000',
                                          padding: '4px 8px',
                                          borderRadius: '3px',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          fontWeight: '500'
                                        }}
                                      >
                                        Download
                                      </button>
                                    ) : (
                                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>Not uploaded</span>
                                    )}
                                  </div>
                                  
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#374151', padding: '8px 12px', borderRadius: '4px' }}>
                                    <span style={{ color: '#fff', fontSize: '13px' }}>Photo File</span>
                                    {submission.photoUrl ? (
                                      <button 
                                        onClick={() => handleDownload(submission.id, 'photo')}
                                        style={{
                                          backgroundColor: '#22c55e',
                                          color: '#000',
                                          padding: '4px 8px',
                                          borderRadius: '3px',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          fontWeight: '500'
                                        }}
                                      >
                                        Download
                                      </button>
                                    ) : (
                                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>Not uploaded</span>
                                    )}
                                  </div>
                                  
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#374151', padding: '8px 12px', borderRadius: '4px' }}>
                                    <span style={{ color: '#fff', fontSize: '13px' }}>Logo File</span>
                                    {submission.logoUrl ? (
                                      <button 
                                        onClick={() => handleDownload(submission.id, 'logo')}
                                        style={{
                                          backgroundColor: '#22c55e',
                                          color: '#000',
                                          padding: '4px 8px',
                                          borderRadius: '3px',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          fontWeight: '500'
                                        }}
                                      >
                                        Download
                                      </button>
                                    ) : (
                                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>Not uploaded</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {submissions.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '32px' }}>
            No submissions found.
          </div>
        )}
      </div>
    </div>
  )
}