"use client"

import React, { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { Facebook, Twitter, Instagram } from 'lucide-react'

// US states topology URL
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

export default function ReactSimpleMapsHomepage() {
  const [activeStates, setActiveStates] = useState<Array<{code: string, name: string}>>([])
  const [loading, setLoading] = useState(true)
  const [hoveredState, setHoveredState] = useState<string | null>(null)

  useEffect(() => {
    fetchActiveStates()
  }, [])

  const fetchActiveStates = async () => {
    try {
      const response = await fetch('/api/states/active')
      if (response.ok) {
        const data = await response.json()
        setActiveStates(data)
        console.log('Active states loaded:', data)
      } else {
        // Fallback to default states if API fails
        setActiveStates([
          { code: 'CA', name: 'California' },
          { code: 'IL', name: 'Illinois' },
          { code: 'MO', name: 'Missouri' },
          { code: 'OK', name: 'Oklahoma' },
          { code: 'MT', name: 'Montana' },
          { code: 'NY', name: 'New York' }
        ])
      }
    } catch (error) {
      console.error('Error fetching active states:', error)
      // Fallback to default states on error
      setActiveStates([
        { code: 'CA', name: 'California' },
        { code: 'IL', name: 'Illinois' },
        { code: 'MO', name: 'Missouri' },
        { code: 'OK', name: 'Oklahoma' },
        { code: 'MT', name: 'Montana' },
        { code: 'NY', name: 'New York' }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Convert geography ID to state code
  const getStateCodeFromGeo = (geo: any) => {
    const stateName = geo.properties.name
    return getStateCodeFromName(stateName)
  }

  const handleStateClick = (geo: any) => {
    const stateCode = getStateCodeFromGeo(geo)
    console.log('State clicked:', stateCode)
    
    // Find the active state object
    const activeState = activeStates.find(s => s.code === stateCode)
    
    if (activeState) {
      // Convert state name to URL-friendly format for dynamic routing
      const urlState = activeState.name.toLowerCase().replace(/\s+/g, '')
      
      // Navigate to dynamic [state] page
      setTimeout(() => {
        window.location.href = `/${urlState}`
      }, 300)
    } else {
      // State is not active - show message
      const stateName = geo.properties.name
      alert(`${stateName} is not currently available. Please check back later!`)
    }
  }

  const getStateStyle = (geo: any) => {
    const stateCode = getStateCodeFromGeo(geo)
    const isActive = activeStates.some(s => s.code === stateCode)
    const isHovered = hoveredState === stateCode
    
    if (isActive) {
      return {
        fill: isHovered ? '#54f104' : '#3d731e', // Bright green hover, dark green fill
        stroke: '#54f104', // Bright green border
        strokeWidth: 2.5,
        cursor: 'pointer',
        transition: 'fill 0.2s ease',
        outline: 'none'
      }
    } else {
      return {
        fill: 'transparent', // Transparent for inactive states
        stroke: '#54f104', // All states get green border
        strokeWidth: 2.5,
        cursor: 'not-allowed',
        transition: 'stroke 0.2s ease',
        outline: 'none'
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading available states...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Global styles for removing focus outlines and adding glow animation */}
      <style jsx global>{`
        /* Remove all focus outlines from map elements */
        path:focus,
        path:focus-visible,
        .rsm-geography:focus,
        .rsm-geography:focus-visible,
        svg path:focus,
        svg path:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
        
        /* Glowing text animation for SELECT */
        @keyframes pulse-glow {
          0%, 100% {
            text-shadow: 
              0 0 10px #54f104,
              0 0 20px #54f104,
              0 0 30px #54f104,
              0 0 40px #54f104;
            opacity: 1;
          }
          50% {
            text-shadow: 
              0 0 20px #54f104,
              0 0 30px #54f104,
              0 0 40px #54f104,
              0 0 50px #54f104,
              0 0 75px #54f104;
            opacity: 0.95;
          }
        }
        
        .glow-text {
          color: #54f104;
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <img
            src="/logo.svg"
            alt="Green Pages"
            className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
          />
        </div>
        <nav className="flex space-x-8">
          <a href="#" className="text-gray-300 hover:text-white">ABOUT</a>
          <a href="#" className="text-gray-300 hover:text-white">DIGITAL</a>
          <a href="#" className="text-gray-300 hover:text-white">PRINT</a>
          <a href="#" className="text-gray-300 hover:text-white">CONTACT</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Title with glowing SELECT */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="glow-text">SELECT</span>
              <span className="text-white"> YOUR STATE</span>
            </h1>
            <p className="text-gray-400 text-lg mb-2">
              Choose your state to view advertising opportunities
            </p>
            <p className="text-sm text-gray-500">
              {activeStates.length} state{activeStates.length !== 1 ? 's' : ''} available: {activeStates.map(s => s.code).join(', ')}
            </p>
          </div>

          {/* Interactive Map */}
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="max-w-4xl w-full">
                <ComposableMap 
                  projection="geoAlbersUsa" 
                  className="w-full h-auto"
                  style={{ background: "transparent" }}
                >
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const stateCode = getStateCodeFromGeo(geo)
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            style={{
                              default: getStateStyle(geo),
                              hover: getStateStyle(geo),
                              pressed: getStateStyle(geo)
                            }}
                            onClick={() => handleStateClick(geo)}
                            onMouseEnter={() => setHoveredState(stateCode)}
                            onMouseLeave={() => setHoveredState(null)}
                            tabIndex={-1}  // Prevents keyboard focus
                          />
                        )
                      })
                    }
                  </Geographies>
                </ComposableMap>
              </div>
            </div>
          </div>

          {/* State Grid (Alternative/Backup Navigation) */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-300">Or select from the list below:</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
              {activeStates.map((state) => (
                <button
                  key={state.code}
                  onClick={() => {
                    const urlState = state.name.toLowerCase().replace(/\s+/g, '')
                    window.location.href = `/${urlState}`
                  }}
                  className="bg-gray-800 hover:bg-green-700 text-white font-semibold py-4 px-3 rounded-lg transition-all duration-200 hover:scale-105 border border-gray-600 hover:border-green-500 group"
                >
                  <div className="text-lg font-bold">{state.code}</div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300 mt-1">
                    {state.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="text-center">
            <p className="text-xs text-gray-500 max-w-2xl mx-auto">
              Click on any highlighted state on the map or use the buttons above to view available advertising packages. 
              Green states are currently accepting new advertisers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 p-6 mt-16">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-400">
            PRESENTED BY CANNABIS NOW & LIONTEK MEDIA
          </div>
          <div className="flex space-x-4">
            <Facebook className="text-gray-400 hover:text-white cursor-pointer" size={20} />
            <Twitter className="text-gray-400 hover:text-white cursor-pointer" size={20} />
            <Instagram className="text-gray-400 hover:text-white cursor-pointer" size={20} />
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper functions
function getStateCodeFromName(stateName: string): string {
  const stateNameToCode: { [key: string]: string } = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY'
  }
  return stateNameToCode[stateName] || stateName
}

function getStateName(code: string): string {
  const stateNames: { [key: string]: string } = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming'
  }
  return stateNames[code?.toUpperCase()] || code
}