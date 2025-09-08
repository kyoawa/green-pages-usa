import Stripe from "stripe"
import { NextResponse } from "next/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ---- helpers: normalize to canonical values your DB expects ----
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
  return k // assume already canonical: "half" | "quarter" | "full" | "single"
}

export async function POST(request) {
  // be resilient to bad JSON
  const payload = await request.json().catch(() => ({}))
  let { amount, state, adType, adTitle, payment_method_types } = payload

  // ---- basic validation ----
  const errors = []
  if (amount == null) errors.push("amount is required")
  if (!state) errors.push("state is required")
  if (!adType) errors.push("adType is required")
  if (errors.length) {
    return NextResponse.json({ message: `Invalid payload: ${errors.join(", ")}` }, { status: 400 })
  }

  // normalize into the canonical values your DB uses
  const stateCode = toStateCode(state)               // e.g. "MT"
  const adKey = toAdKey(adType)                      // e.g. "half"

  // convert to integer cents and sanity-check
  const cents = Math.round(Number(amount) * 100)
  if (!Number.isFinite(cents) || cents <= 0) {
    return NextResponse.json({ message: "amount must be a positive number" }, { status: 400 })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: cents,
      currency: "usd",
      payment_method_types: payment_method_types || ["card", "us_bank_account"],
      // IMPORTANT: store canonical values for confirm → update-inventory
      metadata: {
        state: stateCode,       // "MT", "CA", ...
        adType: adKey,          // "half" | "quarter" | "full" | "single"
        adTitle: adTitle || ""
      },
      description: adTitle ? `Ad purchase: ${adTitle} (${stateCode}/${adKey})` : `Ad purchase (${stateCode}/${adKey})`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ message: "Error creating payment intent" }, { status: 500 })
  }
}