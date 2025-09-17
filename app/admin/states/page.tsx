"use client"
import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'

interface State {
  code: string
  name: string
  active: boolean
  totalAds?: number
  totalSubmissions?: number
}

const allUSStates = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
]

export default function StateManagementPage() {
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddState, setShowAddState] = useState(false)
  const [selectedNewState, setSelectedNewState] = useState('')
  const [addingState, setAddingState] = useState(false)

  useEffect(() => {
    fetchStates()
  }, [])

  const fetchStates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/states')
      if (response.ok) {
        const data = await response.json()
        setStates(data)
      }
    } catch (error) {
      console.error('Error fetching states:', error)
    } finally {
      setLoading(false)
    }
  }

  const addState = async () => {
    if (!selectedNewState) return
    
    const stateToAdd = allUSStates.find(s => s.code === selectedNewState)
    if (!stateToAdd) return
    
    setAddingState(true)
    try {
      const response = await fetch('/api/admin/states/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: stateToAdd.code,
          name: stateToAdd.name
        })
      })
      
      if (response.ok) {
        await fetchStates()
        setShowAddState(false)
        setSelectedNewState('')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to add state')
      }
    } catch (error) {
      console.error('Error adding state:', error)
      alert('Failed to add state')
    } finally {
      setAddingState(false)
    }
  }

  const removeState = async (stateCode: string) => {
    if (!confirm(`Are you sure you want to remove ${stateCode}? This will delete all ads and data for this state.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/states/${stateCode}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchStates()
      }
    } catch (error) {
      console.error('Error removing state:', error)
    }
  }

  const toggleState = async (stateCode: string) => {
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
      }
    } catch (error) {
      console.error('Error toggling state:', error)
    }
  }

  // Get available states (not already added)
  const availableStates = allUSStates.filter(
    us => !states.find(s => s.code === us.code)
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Loading states...</h1>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>State Management</h1>
          <p style={{ color: '#9ca3af' }}>Add or remove states from your system</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total States</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{states.length}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Active States</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{states.filter(s => s.active).length}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Available to Add</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{availableStates.length}</p>
          </div>
        </div>

        {/* Add State Button */}
        <button
          onClick={() => setShowAddState(!showAddState)}
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
            gap: '8px',
            marginBottom: '24px'
          }}
        >
          <Plus size={20} />
          Add New State
        </button>

        {/* Add State Form */}
        {showAddState && (
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Add New State</h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>
                  Select State to Add
                </label>
                <select
                  value={selectedNewState}
                  onChange={(e) => setSelectedNewState(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    color: '#fff'
                  }}
                >
                  <option value="">Choose a state...</option>
                  {availableStates.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addState}
                disabled={!selectedNewState || addingState}
                style={{
                  backgroundColor: selectedNewState ? '#22c55e' : '#6b7280',
                  color: selectedNewState ? '#000' : '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: selectedNewState ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                {addingState ? 'Adding...' : 'Add State'}
              </button>
              <button
                onClick={() => {
                  setShowAddState(false)
                  setSelectedNewState('')
                }}
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

        {/* States List */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Current States</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {states.map((state) => (
              <div
                key={state.code}
                style={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  padding: '16px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontWeight: '600', color: '#fff', fontSize: '16px' }}>
                    {state.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Code: {state.code}
                  </p>
                  <p style={{ fontSize: '12px', color: state.active ? '#22c55e' : '#ef4444' }}>
                    {state.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleState(state.code)}
                    style={{
                      backgroundColor: 'transparent',
                      color: state.active ? '#22c55e' : '#6b7280',
                      padding: '6px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title={state.active ? 'Deactivate' : 'Activate'}
                  >
                    {state.active ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => removeState(state.code)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      padding: '6px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="Remove State"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}