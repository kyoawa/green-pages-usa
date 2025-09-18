"use client"

import React from 'react'

interface StateMapProps {
  stateName: string
  stateCode?: string
  className?: string
}

export default function StateMap({ stateName, stateCode, className = "" }: StateMapProps) {
  // If stateCode isn't provided, derive it from stateName
  const getStateCode = (name: string): string => {
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
    return stateNameToCode[name] || name
  }
  
  const code = stateCode || getStateCode(stateName)
  const fileName = `${code}.svg`
  
  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`}>
      <style jsx>{`
        .state-svg-container {
          position: relative;
          width: 100%;
          height: auto;
        }
        
        .state-svg {
          width: 100%;
          height: auto;
          /* Convert black SVG to bright green #54f104 */
          filter: brightness(0) saturate(100%) invert(68%) sepia(97%) saturate(1274%) hue-rotate(86deg) brightness(104%) contrast(106%);
          animation: state-glow 3s ease-in-out infinite alternate;
        }
        
        @keyframes state-glow {
          0% {
            filter: brightness(0) saturate(100%) invert(68%) sepia(97%) saturate(1274%) hue-rotate(86deg) brightness(104%) contrast(106%) drop-shadow(0 0 15px #54f104);
          }
          50% {
            filter: brightness(0) saturate(100%) invert(68%) sepia(97%) saturate(1274%) hue-rotate(86deg) brightness(104%) contrast(106%) drop-shadow(0 0 25px #54f104) drop-shadow(0 0 35px #54f104);
          }
          100% {
            filter: brightness(0) saturate(100%) invert(68%) sepia(97%) saturate(1274%) hue-rotate(86deg) brightness(104%) contrast(106%) drop-shadow(0 0 20px #54f104);
          }
        }
        
        /* Add a subtle background glow */
        .state-svg-container::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          height: 80%;
          background: radial-gradient(circle, rgba(84, 241, 4, 0.1) 0%, transparent 70%);
          animation: pulse-bg 3s ease-in-out infinite;
          pointer-events: none;
          z-index: -1;
        }
        
        @keyframes pulse-bg {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
      `}</style>
      
      <div className="state-svg-container">
        <img 
          src={`/${fileName}`}
          alt={`${stateName} state map`}
          className="state-svg"
          onError={(e) => {
            console.error(`Failed to load SVG for ${stateName} at /${fileName}`)
            // Optionally show a fallback
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      </div>
      
      {/* State name label */}
      <div className="text-center mt-4">
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
          {stateName}
        </h2>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-green-500 to-transparent mx-auto mt-2"></div>
      </div>
    </div>
  )
}