"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Save, X, Tag } from 'lucide-react'

interface DiscountCode {
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  maxUses?: number
  currentUses: number
  expiresAt?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function DiscountCodesPage() {
  const router = useRouter()
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null)
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minOrderAmount: '',
    maxUses: '',
    expiresAt: ''
  })

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/discount-codes')
      if (response.ok) {
        const data = await response.json()
        setCodes(data)
      }
    } catch (error) {
      console.error('Error fetching discount codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined
      }

      if (editingCode) {
        // Update existing
        const response = await fetch(`/api/admin/discount-codes/${encodeURIComponent(editingCode.code)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, active: editingCode.active })
        })
        if (response.ok) {
          await fetchCodes()
          resetForm()
        }
      } else {
        // Create new
        const response = await fetch('/api/admin/discount-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (response.ok) {
          await fetchCodes()
          resetForm()
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to create discount code')
        }
      }
    } catch (error) {
      console.error('Error saving discount code:', error)
    }
  }

  const handleToggleActive = async (code: DiscountCode) => {
    try {
      const response = await fetch(`/api/admin/discount-codes/${encodeURIComponent(code.code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...code, active: !code.active })
      })
      if (response.ok) {
        await fetchCodes()
      }
    } catch (error) {
      console.error('Error toggling discount code:', error)
    }
  }

  const handleDelete = async (code: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return

    try {
      const response = await fetch(`/api/admin/discount-codes/${encodeURIComponent(code)}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchCodes()
      }
    } catch (error) {
      console.error('Error deleting discount code:', error)
    }
  }

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code)
    setForm({
      code: code.code,
      description: code.description,
      discountType: code.discountType,
      discountValue: code.discountValue,
      minOrderAmount: code.minOrderAmount?.toString() || '',
      maxUses: code.maxUses?.toString() || '',
      expiresAt: code.expiresAt?.split('T')[0] || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: '',
      maxUses: '',
      expiresAt: ''
    })
    setEditingCode(null)
    setShowForm(false)
  }

  const formatDiscount = (code: DiscountCode) => {
    if (code.discountType === 'percentage') {
      return `${code.discountValue}% off`
    }
    return `$${code.discountValue} off`
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
            <Tag size={32} color="#22c55e" />
            Discount Codes
          </h1>
          <p style={{ color: '#9ca3af' }}>
            Create promotional codes customers can apply at checkout
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Codes</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{codes.length}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Active Codes</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{codes.filter(c => c.active).length}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Uses</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{codes.reduce((sum, c) => sum + c.currentUses, 0)}</p>
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
            Add Discount Code
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  disabled={!!editingCode}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: editingCode ? '#374151' : '#111827',
                    border: '1px solid #374151',
                    color: '#fff',
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g., Holiday Sale"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Discount Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>
                  {form.discountType === 'percentage' ? 'Discount %' : 'Discount Amount ($)'}
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: parseInt(e.target.value) || 0 })}
                  min="1"
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Min Order Amount ($)</label>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder="Optional"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Max Uses</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="Unlimited"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#9ca3af' }}>Expires On</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSubmit}
                disabled={!form.code}
                style={{
                  backgroundColor: '#22c55e',
                  color: '#000',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: form.code ? 'pointer' : 'not-allowed',
                  fontWeight: '500',
                  opacity: form.code ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save size={16} />
                {editingCode ? 'Update Code' : 'Create Code'}
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

        {/* Codes List */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>All Discount Codes</h2>

          {codes.length === 0 ? (
            <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#9ca3af' }}>No discount codes yet. Create one above!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {codes.map((code) => (
                <div
                  key={code.code}
                  style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    padding: '16px',
                    borderRadius: '8px',
                    opacity: code.active ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#22c55e', fontFamily: 'monospace' }}>{code.code}</h3>
                        <span style={{
                          backgroundColor: code.active ? '#22c55e' : '#6b7280',
                          color: code.active ? '#000' : '#fff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {code.active ? 'Active' : 'Inactive'}
                        </span>
                        {code.description && (
                          <span style={{ color: '#9ca3af', fontSize: '14px' }}>{code.description}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '24px', color: '#9ca3af', fontSize: '14px', flexWrap: 'wrap' }}>
                        <span>Discount: <strong style={{ color: '#22c55e' }}>{formatDiscount(code)}</strong></span>
                        {code.minOrderAmount && (
                          <span>Min Order: <strong style={{ color: '#fff' }}>${code.minOrderAmount}</strong></span>
                        )}
                        <span>Uses: <strong style={{ color: '#fff' }}>{code.currentUses}{code.maxUses ? ` / ${code.maxUses}` : ''}</strong></span>
                        {code.expiresAt && (
                          <span>Expires: <strong style={{ color: new Date(code.expiresAt) < new Date() ? '#ef4444' : '#fff' }}>
                            {new Date(code.expiresAt).toLocaleDateString()}
                          </strong></span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleToggleActive(code)}
                        style={{
                          backgroundColor: code.active ? '#374151' : '#22c55e',
                          color: code.active ? '#fff' : '#000',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {code.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(code)}
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
                        onClick={() => handleDelete(code.code)}
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
