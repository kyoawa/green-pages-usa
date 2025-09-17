"use client"
import { useState, useEffect } from 'react'
import { Package, DollarSign, Eye, EyeOff, Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react'

interface Ad {
  id: string
  state: string
  adType: string
  title: string
  price: number
  inventory: number
  totalSlots: number
  description: string
  active: boolean
  createdAt: string
  updatedAt: string
}

interface NewAdForm {
  state: string
  adType: string
  title: string
  price: number
  inventory: number
  totalSlots: number
  description: string
}

const states = [
  { code: 'CA', name: 'California' },
  { code: 'MT', name: 'Montana' },
  { code: 'IL', name: 'Illinois' },
  { code: 'MO', name: 'Missouri' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'NY', name: 'New York' }
]

const adTypes = [
  { value: 'single', label: 'Single Listing' },
  { value: 'quarter', label: 'Quarter Page' },
  { value: 'half', label: 'Half Page' },
  { value: 'full', label: 'Full Page' },
  { value: 'double', label: 'Double Page Spread' },
  { value: 'premium', label: 'Premium Placement' },
  { value: 'featured', label: 'Featured Ad' },
  { value: 'banner', label: 'Banner Ad' },
  { value: 'spotlight', label: 'Spotlight Feature' }
]

export default function AdminAdsPage() {
  const [adsByState, setAdsByState] = useState<Record<string, Ad[]>>({})
  const [loading, setLoading] = useState(true)
  const [editingAd, setEditingAd] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Ad>>({})
  const [showNewAdForm, setShowNewAdForm] = useState(false)
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set(['CA']))
  const [newAdForm, setNewAdForm] = useState<NewAdForm>({
    state: 'CA',
    adType: 'single',
    title: '',
    price: 0,
    inventory: 0,
    totalSlots: 0,
    description: ''
  })

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/ads')
      if (response.ok) {
        const data = await response.json()
        // Group ads by state
        const grouped = data.reduce((acc: Record<string, Ad[]>, ad: Ad) => {
          if (!acc[ad.state]) acc[ad.state] = []
          acc[ad.state].push(ad)
          return acc
        }, {})
        setAdsByState(grouped)
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
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

  const handleCreateAd = async () => {
    try {
      const response = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdForm)
      })
      
      if (response.ok) {
        await fetchAds()
        setShowNewAdForm(false)
        setNewAdForm({
          state: 'CA',
          adType: 'single',
          title: '',
          price: 0,
          inventory: 0,
          totalSlots: 0,
          description: ''
        })
      }
    } catch (error) {
      console.error('Error creating ad:', error)
    }
  }

  const handleUpdateAd = async (adId: string) => {
    try {
      const response = await fetch(`/api/admin/ads/${adId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (response.ok) {
        await fetchAds()
        setEditingAd(null)
        setEditForm({})
      }
    } catch (error) {
      console.error('Error updating ad:', error)
    }
  }

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return
    
    try {
      const response = await fetch(`/api/admin/ads/${adId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchAds()
      }
    } catch (error) {
      console.error('Error deleting ad:', error)
    }
  }

  const toggleAdActive = async (adId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/ads/${adId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus })
      })
      
      if (response.ok) {
        await fetchAds()
      }
    } catch (error) {
      console.error('Error toggling ad:', error)
    }
  }

  // Calculate totals
  const totalAds = Object.values(adsByState).flat().length
  const activeAds = Object.values(adsByState).flat().filter(ad => ad.active).length
  const totalInventory = Object.values(adsByState).flat().reduce((sum, ad) => sum + ad.inventory, 0)
  const totalRevenuePotential = Object.values(adsByState).flat().reduce((sum, ad) => sum + (ad.price * ad.inventory), 0)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', color: '#fff' }}>
          Loading ads...
        </h1>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>Ad Management</h1>
          <p style={{ color: '#9ca3af' }}>Configure advertising packages for each state</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Ad Types</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalAds}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Active Ads</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{activeAds}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Inventory</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalInventory}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Revenue Potential</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>${totalRevenuePotential.toLocaleString()}</p>
          </div>
        </div>

        {/* Add New Ad Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowNewAdForm(!showNewAdForm)}
            style={{
              backgroundColor: '#22c55e',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={20} />
            Add New Ad Type
          </button>
        </div>

        {/* New Ad Form */}
        {showNewAdForm && (
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Create New Ad Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>State</label>
                <select 
                  value={newAdForm.state}
                  onChange={(e) => setNewAdForm({...newAdForm, state: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                >
                  {states.map(state => (
                    <option key={state.code} value={state.code}>{state.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Ad Type</label>
                <select 
                  value={newAdForm.adType}
                  onChange={(e) => setNewAdForm({...newAdForm, adType: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                >
                  {adTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Title</label>
                <input 
                  type="text"
                  value={newAdForm.title}
                  onChange={(e) => setNewAdForm({...newAdForm, title: e.target.value})}
                  placeholder="e.g., Premium Quarter Page"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Price ($)</label>
                <input 
                  type="number"
                  value={newAdForm.price}
                  onChange={(e) => setNewAdForm({...newAdForm, price: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Available Inventory</label>
                <input 
                  type="number"
                  value={newAdForm.inventory}
                  onChange={(e) => setNewAdForm({...newAdForm, inventory: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Total Slots</label>
                <input 
                  type="number"
                  value={newAdForm.totalSlots}
                  onChange={(e) => setNewAdForm({...newAdForm, totalSlots: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Description</label>
                <textarea 
                  value={newAdForm.description}
                  onChange={(e) => setNewAdForm({...newAdForm, description: e.target.value})}
                  placeholder="Describe what's included in this ad package..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCreateAd}
                style={{
                  backgroundColor: '#22c55e',
                  color: '#000',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Create Ad
              </button>
              <button
                onClick={() => setShowNewAdForm(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Ads by State */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Ads by State</h2>
          
          {states.map((state) => {
            const stateAds = adsByState[state.code] || []
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
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                      {state.name}
                    </h3>
                    <span style={{ 
                      backgroundColor: '#374151', 
                      color: '#fff', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {stateAds.length} ad types
                    </span>
                    {stateAds.length > 0 && (
                      <span style={{ 
                        backgroundColor: '#22c55e', 
                        color: '#000', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        ${stateAds.reduce((sum, ad) => sum + ad.price, 0).toLocaleString()} total value
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
                </div>

                {/* State Ads */}
                {isExpanded && (
                  <div style={{ 
                    backgroundColor: '#111827', 
                    border: '1px solid #374151', 
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '16px'
                  }}>
                    {stateAds.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                        No ads configured for this state yet
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {stateAds.map((ad) => (
                          <div 
                            key={ad.id} 
                            style={{ 
                              backgroundColor: '#1f2937', 
                              border: '1px solid #374151', 
                              padding: '16px', 
                              borderRadius: '6px' 
                            }}
                          >
                            {editingAd === ad.id ? (
                              // Edit Mode
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                                <input 
                                  type="text"
                                  value={editForm.title || ''}
                                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                  style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                                />
                                <input 
                                  type="number"
                                  value={editForm.price || 0}
                                  onChange={(e) => setEditForm({...editForm, price: parseInt(e.target.value) || 0})}
                                  style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                                />
                                <input 
                                  type="number"
                                  value={editForm.inventory || 0}
                                  onChange={(e) => setEditForm({...editForm, inventory: parseInt(e.target.value) || 0})}
                                  style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                                />
                                <input 
                                  type="number"
                                  value={editForm.totalSlots || 0}
                                  onChange={(e) => setEditForm({...editForm, totalSlots: parseInt(e.target.value) || 0})}
                                  style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                                />
                                <textarea 
                                  value={editForm.description || ''}
                                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                  style={{ gridColumn: 'span 2', padding: '6px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => handleUpdateAd(ad.id)}
                                    style={{
                                      backgroundColor: '#22c55e',
                                      color: '#000',
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAd(null)
                                      setEditForm({})
                                    }}
                                    style={{
                                      backgroundColor: '#6b7280',
                                      color: '#fff',
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                                      {ad.title}
                                    </h4>
                                    <span style={{
                                      backgroundColor: ad.active ? '#22c55e' : '#ef4444',
                                      color: ad.active ? '#000' : '#fff',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: '500'
                                    }}>
                                      {ad.active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span style={{
                                      backgroundColor: '#374151',
                                      color: '#fff',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '12px'
                                    }}>
                                      {adTypes.find(t => t.value === ad.adType)?.label || ad.adType}
                                    </span>
                                  </div>
                                  
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '8px' }}>
                                    <div>
                                      <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Price</p>
                                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>${ad.price}</p>
                                    </div>
                                    <div>
                                      <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Available</p>
                                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: ad.inventory > 0 ? '#fff' : '#ef4444' }}>
                                        {ad.inventory}/{ad.totalSlots}
                                      </p>
                                    </div>
                                    <div>
                                      <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Sold</p>
                                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                                        {ad.totalSlots - ad.inventory}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {ad.description && (
                                    <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
                                      {ad.description}
                                    </p>
                                  )}
                                </div>
                                
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => toggleAdActive(ad.id, ad.active)}
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: ad.active ? '#22c55e' : '#6b7280',
                                      padding: '6px',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                    title={ad.active ? 'Deactivate' : 'Activate'}
                                  >
                                    {ad.active ? <Eye size={18} /> : <EyeOff size={18} />}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAd(ad.id)
                                      setEditForm(ad)
                                    }}
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: '#3b82f6',
                                      padding: '6px',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                    title="Edit"
                                  >
                                    <Edit size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAd(ad.id)}
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: '#ef4444',
                                      padding: '6px',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            )}
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
      </div>
    </div>
  )
}