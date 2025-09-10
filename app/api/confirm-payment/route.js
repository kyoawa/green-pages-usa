import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  const { paymentIntentId } = await request.json()
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status === 'succeeded') {
      const { state, adType } = paymentIntent.metadata
      
      const updateResponse = await fetch(`${request.nextUrl.origin}/api/update-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          adType,
          decreaseBy: 1
        })
      })
      
      // Only read the body ONCE
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text() // Read as text for error
        console.error('Inventory update failed:', errorText)
        return NextResponse.json({ 
          success: false, 
          message: 'Payment succeeded but inventory update failed' 
        }, { status: 500 })
      }
      
      // If response is OK, read as JSON
      const result = await updateResponse.json()
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment confirmed and inventory updated',
        ...result
      })
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Payment not yet succeeded' 
    }, { status: 400 })
    
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ 
      message: 'Error confirming payment' 
    }, { status: 500 })
  }
}