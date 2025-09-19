// app/api/create-payment-intent/route.js
import Stripe from "stripe"
import { NextResponse } from "next/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Helper functions remain the same...
const toStateCode = (s) => {
  if (!s) return s
  if (s.length === 2) return s.toUpperCase()
  const map = {
    Alabama:"AL", Alaska:"AK", Arizona:"AZ", Arkansas:"AR", California:"CA", Colorado:"CO",
    Connecticut:"CT", Delaware:"DE", Florida:"FL", Georgia:"GA", Hawaii:"HI", Idaho:"ID",
    Illinois:"IL", Indiana:"IN", Iowa:"IA", Kansas:"KS", Kentucky:"KY", Louisiana:"LA",
    Maine:"ME", Maryland:"MD", Massachusetts:"MA", Michigan:"MI", Minnesota:"MN",
    Mississippi:"MS", Missouri:"MO", Montana:"MT", Nebraska:"NE", Nevada:"NV",
    "New Hampshire":"NH", "New Jersey":"NJ", "New Mexico":"NM", "New York":"NY",
    "North Carolina":"NC", "North Dakota":"ND", Ohio:"OH", Oklahoma:"OK", Oregon:"OR",
    Pennsylvania:"PA", "Rhode Island":"RI", "South Carolina":"SC", "South Dakota":"SD",
    Tennessee:"TN", Texas:"TX", Utah:"UT", Vermont:"VT", Virginia:"VA", Washington:"WA",
    "West Virginia":"WV", Wisconsin:"WI", Wyoming:"WY",
  }
  return map[String(s).trim()] || String(s).toUpperCase()
}

const toAdKey = (t) => {
  const k = String(t ?? "").toLowerCase().replace(/\s+/g, "")
  if (["quarterpage","quarter","1/4","qtr"].includes(k)) return "quarter"
  if (["halfpage","half","1/2"].includes(k)) return "half"
  if (["fullpage","full"].includes(k)) return "full"
  if (["single","listing"].includes(k)) return "single"
  return k
}

export async function POST(request) {
  try {
    const payload = await request.json()
    const { amount, state, adType, adTitle } = payload
    
    console.log('=== CREATE PAYMENT INTENT ===')
    console.log('Original payload:', { amount, state, adType, adTitle })
    
    // Validation
    const errors = []
    if (amount == null || amount <= 0) errors.push("valid amount is required")
    if (!state) errors.push("state is required")
    if (!adType) errors.push("adType is required")
    
    if (errors.length) {
      console.error('Validation errors:', errors)
      return NextResponse.json({ 
        message: `Invalid payload: ${errors.join(", ")}` 
      }, { status: 400 })
    }
    
    // Normalize values
    const stateCode = toStateCode(state)
    const adKey = toAdKey(adType)
    
    console.log('Normalized values:', { 
      originalState: state, 
      normalizedState: stateCode,
      originalAdType: adType,
      normalizedAdType: adKey
    })
    
    // Convert to cents and ensure it's a valid number
    const cents = Math.round(Number(amount) * 100)
    
    if (!Number.isFinite(cents) || cents <= 0) {
      console.error('Invalid amount:', amount, 'cents:', cents)
      return NextResponse.json({ 
        message: "amount must be a positive number" 
      }, { status: 400 })
    }
    
    console.log('Creating payment intent:', { 
      amount, 
      cents, 
      state: stateCode, 
      adType: adKey 
    })
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: cents,
      currency: "usd",
      metadata: {
        state: stateCode,
        adType: adKey,
        adTitle: adTitle || "",
        // Keep originals for debugging
        originalState: state,
        originalAdType: adType
      },
      description: adTitle ? 
        `Ad purchase: ${adTitle} (${stateCode}/${adKey})` : 
        `Ad purchase (${stateCode}/${adKey})`
    })
    
    console.log('Payment intent created with metadata:', paymentIntent.metadata)
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
    
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ 
      message: "Error creating payment intent",
      error: error.message 
    }, { status: 500 })
  }
}