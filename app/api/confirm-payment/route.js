import Stripe from "stripe"
import { NextResponse } from "next/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  // be resilient to bad JSON
  const body = await request.json().catch(() => ({}))
  const { paymentIntentId } = body || {}

  if (!paymentIntentId) {
    return NextResponse.json({ success: false, message: "paymentIntentId is required" }, { status: 400 })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { success: false, message: `Payment not successful (status: ${paymentIntent.status})` },
        { status: 400 }
      )
    }

    // Pull canonical values from metadata (e.g., state: "MT", adType: "half")
    const { state, adType } = paymentIntent.metadata || {}
    if (!state || !adType) {
      return NextResponse.json(
        { success: false, message: "Missing required metadata (state/adType) on PaymentIntent" },
        { status: 400 }
      )
    }

    // Build a reliable origin (works locally and on Vercel)
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host")
    const forwardedProto = request.headers.get("x-forwarded-proto") || "http"
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${forwardedProto}://${forwardedHost}`)

    // Update inventory for this purchase
    const updateResponse = await fetch(`${origin}/api/update-inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, adType, decreaseBy: 1 })
    })

    const updatePayload =
      (await updateResponse.json().catch(async () => ({ raw: await updateResponse.text() }))) || {}

    if (!updateResponse.ok) {
      // Bubble up exact reason so you can see “Not enough inventory available” vs other errors
      return NextResponse.json(
        {
          success: false,
          message: "Payment succeeded but inventory update failed",
          detail: updatePayload?.message || updatePayload?.raw || "Unknown error"
        },
        { status: 500 }
      )
    }

    // Success: include the new remaining inventory if your API returns it
    return NextResponse.json({
      success: true,
      message: "Payment confirmed and inventory updated",
      inventory: updatePayload?.newInventory ?? updatePayload?.inventory ?? null
    })
  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ success: false, message: "Error confirming payment" }, { status: 500 })
  }
}