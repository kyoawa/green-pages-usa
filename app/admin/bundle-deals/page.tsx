"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Save, X, Package } from 'lucide-react'

interface BundleDeal {
  id: string
  name: string
  adType: string
  minQuantity: number
  discountPercent: number
  active: boolean
  createdAt: string
  updatedAt: string
}

const adTypes = [
  { value: 'all', label: 'All Ad Types' },
  { value: 'single', label: 'Single Listing' },
  { value: 'quarter', label: 'Quarter Page' },
  { value: 'half', label: 'Half Page' },
  { value: 'full', label: 'Full Page' },
  { value: 'double', label: 'Double Page Spread' },
  { value: 'premium', label: 'Premium Placement' },
  { value: 'banner', label: 'Banner Ad' },
]

export default function BundleDealsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<BundleDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<BundleDeal | null>(null)
  const [form, setForm] = useState({
    name: '',
    adType: 'all',
    minQuantity: 10,
    discountPercent: 10
  })

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/admin/bundle-deals')
      if (response.ok) {
        const data = await response.json()
        setDeals(data)
      }
    } catch (error) {
      console.error('Error fetching bundle deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (editingDeal) {
        // Update existing
        const response = await fetch(`/api/admin/bundle-deals/${editingDeal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, active: editingDeal.active })
        })
        if (response.ok) {
          await fetchDeals()
          resetForm()
        }
      } else {
        // Create new
        const response = await fetch('/api/admin/bundle-deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        if (response.ok) {
          await fetchDeals()
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving bundle deal:', error)
    }
  }

  const handleToggleActive = async (deal: BundleDeal) => {
    try {
      const response = await fetch(`/api/admin/bundle-deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...deal, active: !deal.active })
      })
      if (response.ok) {
        await fetchDeals()
      }
    } catch (error) {
      console.error('Error toggling bundle deal:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bundle deal?')) return

    try {
      const response = await fetch(`/api/admin/bundle-deals/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchDeals()
      }
    } catch (error) {
      console.error('Error deleting bundle deal:', error)
    }
  }

  const handleEdit = (deal: BundleDeal) => {
    setEditingDeal(deal)
    setForm({
      name: deal.name,
      adType: deal.adType,
      minQuantity: deal.minQuantity,
      discountPercent: deal.discountPercent
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setForm({ name: '', adType: 'all', minQuantity: 10, discountPercent: 10 })
    setEditingDeal(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Loading...</h1>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => router.push('/admin')}
            style={{ color: '#9ca3af', marginBottom: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back to Admin
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={32} color="#22c55e" />
            Bundle Deals
          </h1>
          <p style={{ color: '#9ca3af' }}>
            Create quantity-based discounts that automatically apply when customers buy in bulk
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Deals</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{deals.length}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Active Deals</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{deals.filter(d => d.active).length}</p>
          </div>
        </div>

        {/* Add Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowForm(!showForm)}
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
            Add Bundle Deal
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              {editingDeal ? 'Edit Bundle Deal' : 'Create Bundle Deal'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Deal Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., 10+ Single Ads Deal"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Ad Type</label>
                <select
                  value={form.adType}
                  onChange={(e) => setForm({ ...form, adType: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                >
                  {adTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Minimum Quantity</label>
                <input
                  type="number"
                  value={form.minQuantity}
                  onChange={(e) => setForm({ ...form, minQuantity: parseInt(e.target.value) || 0 })}
                  min="2"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Discount %</label>
                <input
                  type="number"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="100"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSubmit}
                disabled={!form.name}
                style={{
                  backgroundColor: '#22c55e',
                  color: '#000',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: form.name ? 'pointer' : 'not-allowed',
                  fontWeight: '500',
                  opacity: form.name ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save size={16} />
                {editingDeal ? 'Update Deal' : 'Create Deal'}
              </button>
              <button
                onClick={resetForm}
                style={{
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Deals List */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>All Bundle Deals</h2>

          {deals.length === 0 ? (
            <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#9ca3af' }}>No bundle deals yet. Create one above!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    padding: '16px',
                    borderRadius: '8px',
                    opacity: deal.active ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>{deal.name}</h3>
                        <span style={{
                          backgroundColor: deal.active ? '#22c55e' : '#6b7280',
                          color: deal.active ? '#000' : '#fff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {deal.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '24px', color: '#9ca3af', fontSize: '14px' }}>
                        <span>Ad Type: <strong style={{ color: '#fff' }}>{adTypes.find(t => t.value === deal.adType)?.label || deal.adType}</strong></span>
                        <span>Min Qty: <strong style={{ color: '#fff' }}>{deal.minQuantity}</strong></span>
                        <span>Discount: <strong style={{ color: '#22c55e' }}>{deal.discountPercent}% off</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleToggleActive(deal)}
                        style={{
                          backgroundColor: deal.active ? '#374151' : '#22c55e',
                          color: deal.active ? '#fff' : '#000',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {deal.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(deal)}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#3b82f6',
                          padding: '6px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(deal.id)}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          padding: '6px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
