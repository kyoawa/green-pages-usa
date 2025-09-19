"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, Package, Users, FileText, Settings, BarChart, Database, ArrowRight, Lock, Eye, EyeOff, LogOut } from 'lucide-react'

const ADMIN_PASSWORD = "IGotFanuzzled" // Change this to whatever you want

export default function AdminPage() {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Check if already authenticated on page load
  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated')
    if (authenticated === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_authenticated', 'true')
      setError('')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_authenticated')
    setPassword('')
  }

  const initializeData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/init-data', { method: 'POST' })
      const data = await response.json()
      setMessage(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#1f2937', padding: '32px', borderRadius: '8px', border: '1px solid #374151', width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
            <Lock style={{ height: '48px', width: '48px', color: '#22c55e' }} />
          </div>
          
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px' }}>Green Pages Admin</h1>
          
          <form onSubmit={handleLogin} style={{ marginBottom: '0' }}>
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                style={{
                  width: '100%',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  padding: '12px 48px 12px 16px',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {error && (
              <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>{error}</div>
            )}
            
            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: '#22c55e',
                color: '#000',
                fontWeight: 'bold',
                padding: '12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Your existing admin dashboard
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header with Logout Button */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#22c55e' }}>
              Green Pages Admin
            </h1>
            <p style={{ color: '#9ca3af' }}>Manage your dispensary advertising platform</p>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Active States</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>6</p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>CA, MT, IL, MO, OK, NY</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Ad Types</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>30</p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Across all states</p>
          </div>
          <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Platform Status</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>Live</p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>All systems operational</p>
          </div>
        </div>

        {/* Admin Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          {/* Submissions Management */}
          <Link href="/admin/submissions" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              padding: '24px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#22c55e'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#374151'}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <FileText style={{ color: '#22c55e', marginRight: '12px' }} size={24} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>Submissions</h2>
              </div>
              <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
                View customer submissions, manage state visibility, and download uploaded files.
              </p>
              <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                View Submissions <ArrowRight size={16} style={{ marginLeft: '4px' }} />
              </div>
            </div>
          </Link>

          {/* Ad Management */}
          <Link href="/admin/ads" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              padding: '24px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#22c55e'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#374151'}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Package style={{ color: '#22c55e', marginRight: '12px' }} size={24} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>Ad Management</h2>
              </div>
              <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
                Add, edit, or remove ad types for each state. Control pricing and inventory.
              </p>
              <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                Manage Ads <ArrowRight size={16} style={{ marginLeft: '4px' }} />
              </div>
            </div>
          </Link>

          {/* State Management */}
          <Link href="/admin/states" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              padding: '24px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#22c55e'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#374151'}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Settings style={{ color: '#22c55e', marginRight: '12px' }} size={24} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>State Management</h2>
              </div>
              <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
                Add or remove states, control which states appear on the homepage.
              </p>
              <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                Manage States <ArrowRight size={16} style={{ marginLeft: '4px' }} />
              </div>
            </div>
          </Link>
        </div>

        {/* Database Tools */}
        <div style={{ 
          backgroundColor: '#1f2937', 
          border: '1px solid #374151', 
          padding: '24px', 
          borderRadius: '8px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <Database style={{ color: '#22c55e', marginRight: '12px' }} size={24} />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>Database Tools</h2>
          </div>
          <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
            Initialize sample inventory data for testing. This will create ad types for all states.
          </p>
          <button
            onClick={initializeData}
            disabled={loading}
            style={{
              backgroundColor: '#22c55e',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? "Initializing..." : "Initialize Sample Data"}
          </button>
          {message && (
            <pre style={{ 
              marginTop: '16px', 
              padding: '16px', 
              backgroundColor: '#111827', 
              borderRadius: '6px', 
              fontSize: '12px',
              overflow: 'auto',
              color: '#9ca3af'
            }}>
              {message}
            </pre>
          )}
        </div>

        {/* Quick Links */}
        <div style={{ 
          display: 'flex', 
          gap: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #374151'
        }}>
          <Link href="/" style={{ color: '#22c55e', fontSize: '14px' }}>
            ← Back to Site
          </Link>
          <Link href="/api/admin/submissions" style={{ color: '#9ca3af', fontSize: '14px' }}>
            API: Submissions
          </Link>
          <Link href="/api/admin/ads" style={{ color: '#9ca3af', fontSize: '14px' }}>
            API: Ads
          </Link>
          <Link href="/api/admin/states" style={{ color: '#9ca3af', fontSize: '14px' }}>
            API: States
          </Link>
        </div>
      </div>
    </div>
  )
}