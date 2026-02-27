"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Save, X, Zap, Copy, Check, Link2, User, ExternalLink } from 'lucide-react'

interface CustomBundleItem {
  adType: string
  title: string
  quantity: number
  unitPrice: number
}

interface CustomBundle {
  id: string
  name: string
  description?: string
  state: string
  items: CustomBundleItem[]
  retailValue: number
  totalPrice: number
  status: 'active' | 'purchased' | 'expired'
  deliveryMethod: 'link' | 'account'
  accessToken: string
  assignedUserId?: string
  assignedEmail?: string
  purchasedByEmail?: string
  orderId?: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
}

const adTypes = [
  { value: 'single', label: 'Single Listing', price: 300 },
  { value: 'banner', label: 'Digital Banner', price: 500 },
  { value: 'quarter', label: '1/4 Page Ad', price: 800 },
  { value: 'half', label: '1/2 Page Ad', price: 1500 },
  { value: 'full', label: 'Full Page Ad', price: 3000 },
  { value: 'belly', label: 'Backcover/Belly Band', price: 8000 },
]

const states = [
  { code: 'CA', name: 'California' },
  { code: 'MT', name: 'Montana' },
  { code: 'IL', name: 'Illinois' },
  { code: 'MO', name: 'Missouri' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'NY', name: 'New York' },
]

const inputStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '4px',
  backgroundColor: '#111827',
  border: '1px solid #374151',
  color: '#fff',
  fontSize: '14px',
}

const labelStyle = {
  display: 'block' as const,
  marginBottom: '4px',
  fontSize: '14px',
  color: '#9ca3af',
}

export default function CustomBundlesPage() {
  const router = useRouter()
  const [bundles, setBundles] = useState<CustomBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBundle, setEditingBundle] = useState<CustomBundle | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    state: 'CA',
    items: [{ adType: 'single', quantity: 1 }] as { adType: string; quantity: number }[],
    totalPrice: 0,
    deliveryMethod: 'link' as 'link' | 'account',
    assignedEmail: '',
    expiresAt: '',
  })

  useEffect(() => {
    fetchBundles()
  }, [])

  const fetchBundles = async () => {
    try {
      const response = await fetch('/api/admin/custom-bundles')
      if (response.ok) {
        const data = await response.json()
        setBundles(data)
      }
    } catch (error) {
      console.error('Error fetching custom bundles:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRetailValue = () => {
    return form.items.reduce((sum, item) => {
      const adType = adTypes.find(t => t.value === item.adType)
      return sum + (adType?.price || 0) * item.quantity
    }, 0)
  }

  const handleSubmit = async () => {
    setError(null)
    setSaving(true)

    try {
      const items: CustomBundleItem[] = form.items.map(item => {
        const adType = adTypes.find(t => t.value === item.adType)
        return {
          adType: item.adType,
          title: adType?.label || item.adType,
          quantity: item.quantity,
          unitPrice: adType?.price || 0,
        }
      })

      const payload = {
        name: form.name,
        description: form.description || undefined,
        state: form.state,
        items,
        totalPrice: form.totalPrice,
        deliveryMethod: form.deliveryMethod,
        assignedEmail: form.deliveryMethod === 'account' ? form.assignedEmail : undefined,
        expiresAt: form.expiresAt || undefined,
      }

      if (editingBundle) {
        const response = await fetch(`/api/admin/custom-bundles/${editingBundle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Failed to update bundle')
          return
        }
      } else {
        const response = await fetch('/api/admin/custom-bundles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Failed to create bundle')
          return
        }
      }

      await fetchBundles()
      resetForm()
    } catch (err) {
      console.error('Error saving custom bundle:', err)
      setError('Failed to save bundle')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom bundle?')) return

    try {
      const response = await fetch(`/api/admin/custom-bundles/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchBundles()
      }
    } catch (error) {
      console.error('Error deleting custom bundle:', error)
    }
  }

  const handleEdit = (bundle: CustomBundle) => {
    setEditingBundle(bundle)
    setForm({
      name: bundle.name,
      description: bundle.description || '',
      state: bundle.state,
      items: bundle.items.map(i => ({ adType: i.adType, quantity: i.quantity })),
      totalPrice: bundle.totalPrice,
      deliveryMethod: bundle.deliveryMethod,
      assignedEmail: bundle.assignedEmail || '',
      expiresAt: bundle.expiresAt ? bundle.expiresAt.split('T')[0] : '',
    })
    setShowForm(true)
    setError(null)
  }

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      state: 'CA',
      items: [{ adType: 'single', quantity: 1 }],
      totalPrice: 0,
      deliveryMethod: 'link',
      assignedEmail: '',
      expiresAt: '',
    })
    setEditingBundle(null)
    setShowForm(false)
    setError(null)
  }

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { adType: 'single', quantity: 1 }] })
  }

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const updateItem = (index: number, field: 'adType' | 'quantity', value: string | number) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setForm({ ...form, items: newItems })
  }

  const copyLink = (bundle: CustomBundle) => {
    const url = `${window.location.origin}/bundle/${bundle.accessToken}`
    navigator.clipboard.writeText(url)
    setCopiedId(bundle.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e'
      case 'purchased': return '#3b82f6'
      case 'expired': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const formatItemsSummary = (items: CustomBundleItem[]) => {
    return items.map(i => `${i.quantity}x ${i.title}`).join(', ')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Loading...</h1>
      </div>
    )
  }

  const retailValue = getRetailValue()
  const savings = retailValue - form.totalPrice

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
            <Zap size={32} color="#22c55e" />
            Custom Bundles
          </h1>
          <p style={{ color: '#9ca3af' }}>
            Create custom ad packages for specific customers with flat pricing and shareable links
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Bundles</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{bundles.length}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Active</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{bundles.filter(b => b.status === 'active').length}</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Purchased</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{bundles.filter(b => b.status === 'purchased').length}</p>
          </div>
        </div>

        {/* Add Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => { setShowForm(!showForm); setError(null) }}
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
            }}
          >
            <Plus size={20} />
            Create Custom Bundle
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              {editingBundle ? 'Edit Custom Bundle' : 'Create Custom Bundle'}
            </h3>

            {error && (
              <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #ef4444', padding: '12px', borderRadius: '6px', marginBottom: '16px', color: '#fca5a5', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* Name & Description */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Bundle Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Acme Dispensary CA Package"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>State *</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  style={inputStyle}
                >
                  {states.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Internal notes about this bundle"
                style={inputStyle}
              />
            </div>

            {/* Items */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...labelStyle, marginBottom: '8px' }}>Bundle Items *</label>
              {form.items.map((item, index) => {
                const adType = adTypes.find(t => t.value === item.adType)
                const lineTotal = (adType?.price || 0) * item.quantity
                return (
                  <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <select
                      value={item.adType}
                      onChange={(e) => updateItem(index, 'adType', e.target.value)}
                      style={{ ...inputStyle, flex: 2 }}
                    >
                      {adTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label} (${t.price.toLocaleString()})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      style={{ ...inputStyle, flex: 0.5, textAlign: 'center' as const }}
                      placeholder="Qty"
                    />
                    <span style={{ color: '#9ca3af', fontSize: '14px', flex: 1, textAlign: 'right' as const }}>
                      ${lineTotal.toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeItem(index)}
                      disabled={form.items.length <= 1}
                      style={{
                        backgroundColor: 'transparent',
                        color: form.items.length <= 1 ? '#374151' : '#ef4444',
                        padding: '6px',
                        border: 'none',
                        cursor: form.items.length <= 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                )
              })}
              <button
                onClick={addItem}
                style={{
                  backgroundColor: 'transparent',
                  color: '#22c55e',
                  padding: '6px 12px',
                  border: '1px dashed #374151',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginTop: '4px',
                }}
              >
                + Add Item
              </button>
            </div>

            {/* Pricing */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Retail Value</label>
                <div style={{ ...inputStyle, backgroundColor: '#0f172a', color: '#9ca3af' }}>
                  ${retailValue.toLocaleString()}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Custom Price *</label>
                <input
                  type="number"
                  value={form.totalPrice || ''}
                  onChange={(e) => setForm({ ...form, totalPrice: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Savings</label>
                <div style={{
                  ...inputStyle,
                  backgroundColor: '#0f172a',
                  color: savings > 0 ? '#22c55e' : savings < 0 ? '#ef4444' : '#9ca3af'
                }}>
                  {savings > 0 ? `$${savings.toLocaleString()} off` : savings < 0 ? `$${Math.abs(savings).toLocaleString()} markup` : '$0'}
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...labelStyle, marginBottom: '8px' }}>Delivery Method *</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${form.deliveryMethod === 'link' ? '#22c55e' : '#374151'}`,
                  backgroundColor: form.deliveryMethod === 'link' ? '#052e16' : '#111827',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="link"
                    checked={form.deliveryMethod === 'link'}
                    onChange={() => setForm({ ...form, deliveryMethod: 'link' })}
                    style={{ accentColor: '#22c55e' }}
                  />
                  <Link2 size={16} color="#22c55e" />
                  Shareable Link
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${form.deliveryMethod === 'account' ? '#22c55e' : '#374151'}`,
                  backgroundColor: form.deliveryMethod === 'account' ? '#052e16' : '#111827',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="account"
                    checked={form.deliveryMethod === 'account'}
                    onChange={() => setForm({ ...form, deliveryMethod: 'account' })}
                    style={{ accentColor: '#22c55e' }}
                  />
                  <User size={16} color="#22c55e" />
                  Assign to Account
                </label>
              </div>
            </div>

            {/* Email for account delivery */}
            {form.deliveryMethod === 'account' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Customer Email *</label>
                <input
                  type="email"
                  value={form.assignedEmail}
                  onChange={(e) => setForm({ ...form, assignedEmail: e.target.value })}
                  placeholder="customer@example.com"
                  style={inputStyle}
                />
                <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                  Customer must have an existing account with this email
                </p>
              </div>
            )}

            {/* Expiration */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Expires (optional, defaults to 24 hours)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                style={{ ...inputStyle, maxWidth: '250px' }}
              />
              <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                Inventory is reserved until expiry. If not paid, it returns to the pool automatically.
              </p>
            </div>

            {/* Actions */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.totalPrice || saving}
                style={{
                  backgroundColor: '#22c55e',
                  color: '#000',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: (!form.name || !form.totalPrice || saving) ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: (!form.name || !form.totalPrice || saving) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : editingBundle ? 'Update Bundle' : 'Create Bundle'}
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
                  gap: '8px',
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bundles List */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>All Custom Bundles</h2>

          {bundles.length === 0 ? (
            <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#9ca3af' }}>No custom bundles yet. Create one above!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    padding: '16px',
                    borderRadius: '8px',
                    opacity: bundle.status === 'expired' ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' as const }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>{bundle.name}</h3>
                        <span style={{
                          backgroundColor: getStatusColor(bundle.status),
                          color: bundle.status === 'active' ? '#000' : '#fff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}>
                          {bundle.status.charAt(0).toUpperCase() + bundle.status.slice(1)}
                        </span>
                        <span style={{
                          backgroundColor: '#1e293b',
                          color: '#94a3b8',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          {bundle.deliveryMethod === 'link' ? <Link2 size={12} /> : <User size={12} />}
                          {bundle.deliveryMethod === 'link' ? 'Link' : bundle.assignedEmail}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{bundle.state}</span>
                      </div>

                      <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px' }}>
                        {formatItemsSummary(bundle.items)}
                      </div>

                      <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                        <span style={{ color: '#9ca3af' }}>
                          Retail: <span style={{ textDecoration: 'line-through' }}>${bundle.retailValue.toLocaleString()}</span>
                        </span>
                        <span style={{ color: '#22c55e', fontWeight: '600' }}>
                          Price: ${bundle.totalPrice.toLocaleString()}
                        </span>
                        {bundle.retailValue > bundle.totalPrice && (
                          <span style={{ color: '#f59e0b', fontSize: '13px' }}>
                            Saves ${(bundle.retailValue - bundle.totalPrice).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {bundle.status === 'purchased' && bundle.purchasedByEmail && (
                        <div style={{ color: '#3b82f6', fontSize: '13px', marginTop: '6px' }}>
                          Purchased by {bundle.purchasedByEmail}
                        </div>
                      )}

                      <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px' }}>
                        Created {new Date(bundle.createdAt).toLocaleDateString()}
                        {bundle.expiresAt && bundle.status === 'active' && (() => {
                          const hoursLeft = Math.max(0, Math.round((new Date(bundle.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
                          return ` · ${hoursLeft > 0 ? `${hoursLeft}h left to pay` : 'Expired'}`
                        })()}
                        {bundle.expiresAt && bundle.status !== 'active' && ` · Expired ${new Date(bundle.expiresAt).toLocaleDateString()}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
                      {bundle.status === 'active' && (
                        <button
                          onClick={() => copyLink(bundle)}
                          style={{
                            backgroundColor: copiedId === bundle.id ? '#22c55e' : '#374151',
                            color: copiedId === bundle.id ? '#000' : '#fff',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {copiedId === bundle.id ? <Check size={14} /> : <Copy size={14} />}
                          {copiedId === bundle.id ? 'Copied!' : 'Copy Link'}
                        </button>
                      )}
                      {bundle.status === 'active' && (
                        <a
                          href={`/bundle/${bundle.accessToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: 'transparent',
                            color: '#3b82f6',
                            padding: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      {bundle.status !== 'purchased' && (
                        <>
                          <button
                            onClick={() => handleEdit(bundle)}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#3b82f6',
                              padding: '6px',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(bundle.id)}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              padding: '6px',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
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
