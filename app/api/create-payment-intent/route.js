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
    const { amount, state, adType, adTitle, cartItems, userId, discount, discountCode } = payload

    console.log('=== CREATE PAYMENT INTENT ===')
    console.log('Original payload:', { amount, state, adType, adTitle, hasCartItems: !!cartItems, discount, discountCode })

    // Check if this is a cart checkout or single-item checkout
    const isCartCheckout = cartItems && Array.isArray(cartItems) && cartItems.length > 0

    if (isCartCheckout) {
      // CART CHECKOUT MODE
      console.log('Cart checkout mode with', cartItems.length, 'items')

      // Validation for cart
      if (amount == null || amount <= 0) {
        return NextResponse.json({
          message: "Valid amount is required"
        }, { status: 400 })
      }

      if (!userId) {
        return NextResponse.json({
          message: "userId is required for cart checkout"
        }, { status: 400 })
      }

      // Convert to cents
      const cents = Math.round(Number(amount) * 100)

      if (!Number.isFinite(cents) || cents <= 0) {
        return NextResponse.json({
          message: "amount must be a positive number"
        }, { status: 400 })
      }

      // Prepare cart items for metadata (normalize each item)
      const normalizedCartItems = cartItems.map(item => ({
        state: toStateCode(item.state),
        adType: toAdKey(item.adType),
        title: item.title,
        price: item.price,
        quantity: item.quantity || 1,
        reservationId: item.reservationId
      }))

      // Store cart items as JSON string (Stripe metadata has limits)
      const cartItemsJson = JSON.stringify(normalizedCartItems)

      // If cart is too large for metadata (500 char limit), store reference instead
      const metadata = {
        checkoutType: "cart",
        userId: userId,
        itemCount: cartItems.length.toString()
      }

      // Add discount info to metadata if present
      if (discount && discount.amount > 0) {
        metadata.discountType = discount.type
        metadata.discountAmount = discount.amount.toString()
        metadata.discountDescription = discount.description
        if (discountCode) {
          metadata.discountCode = discountCode
        }
      }

      // Try to fit cart items in metadata, otherwise just store user ID
      if (cartItemsJson.length < 450) {
        metadata.cartItems = cartItemsJson
      }

      console.log('Creating cart payment intent:', { cents, itemCount: cartItems.length })

      const paymentIntent = await stripe.paymentIntents.create({
        amount: cents,
        currency: "usd",
        metadata,
        description: `Cart checkout - ${cartItems.length} item(s)`
      })

      console.log('Cart payment intent created')

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })

    } else {
      // SINGLE ITEM CHECKOUT MODE (backwards compatible)
      console.log('Single item checkout mode')

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
          checkoutType: "single",
          state: stateCode,
          adType: adKey,
          adTitle: adTitle || "",
          userId: userId || "",
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
    }

  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({
      message: "Error creating payment intent",
      error: error.message
    }, { status: 500 })
  }
}