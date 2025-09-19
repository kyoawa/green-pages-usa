import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  const { paymentIntentId } = await request.json()
  
  console.log('=== CONFIRM PAYMENT START ===')
  console.log('Payment Intent ID:', paymentIntentId)
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    console.log('Payment Intent Status:', paymentIntent.status)
    console.log('Payment Intent Metadata:', paymentIntent.metadata)
    
    if (paymentIntent.status === 'succeeded') {
      const { state, adType } = paymentIntent.metadata
      
      // Validate metadata exists
      if (!state || !adType) {
        console.error('Missing metadata:', { state, adType })
        return NextResponse.json({ 
          success: false, 
          message: 'Payment succeeded but missing order details' 
        }, { status: 500 })
      }
      
      console.log('Calling update-inventory with:', { state, adType })
      
      const updateResponse = await fetch(`${request.nextUrl.origin}/api/update-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          adType,
          decreaseBy: 1
        })
      })
      
      console.log('Update inventory response status:', updateResponse.status)
      
      // Only read the body ONCE
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text() // Read as text for error
        console.error('Inventory update failed:', errorText)
        
        // Log details for manual processing
        console.error('MANUAL ACTION REQUIRED - Update inventory manually:', {
          paymentIntentId,
          state,
          adType,
          customerEmail: paymentIntent.receipt_email,
          amount: paymentIntent.amount / 100,
          timestamp: new Date().toISOString()
        })
        
        return NextResponse.json({ 
          success: false, 
          message: 'Payment succeeded but inventory update failed' 
        }, { status: 500 })
      }
      
      // If response is OK, read as JSON
      const result = await updateResponse.json()
      console.log('Inventory update successful:', result)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment confirmed and inventory updated',
        ...result
      })
    }
    
    console.log('Payment not yet succeeded, status:', paymentIntent.status)
    return NextResponse.json({ 
      success: false, 
      message: 'Payment not yet succeeded' 
    }, { status: 400 })
    
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Error confirming payment' 
    }, { status: 500 })
  }
}