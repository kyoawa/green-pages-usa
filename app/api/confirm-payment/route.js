import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getCart, clearCart, calculateCartTotals } from "@/lib/cart"
import { completeReservation } from "@/lib/reservations"
import { createOrder, initializeSlotSubmissions } from "@/lib/orders"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  const { paymentIntentId, customerData } = await request.json()

  console.log('=== CONFIRM PAYMENT START ===')
  console.log('Payment Intent ID:', paymentIntentId)
  console.log('Customer Data:', customerData)

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    console.log('Payment Intent Status:', paymentIntent.status)
    console.log('Payment Intent Metadata:', paymentIntent.metadata)

    if (paymentIntent.status === 'succeeded') {
      const checkoutType = paymentIntent.metadata.checkoutType || 'single'

      if (checkoutType === 'cart') {
        // CART CHECKOUT MODE
        console.log('Processing cart checkout')

        const { userId, cartItems: cartItemsJson } = paymentIntent.metadata

        if (!userId) {
          console.error('Missing userId in cart checkout')
          return NextResponse.json({
            success: false,
            message: 'Payment succeeded but missing user information'
          }, { status: 500 })
        }

        // Get cart items (either from metadata or from database)
        let cartItems = []
        if (cartItemsJson) {
          cartItems = JSON.parse(cartItemsJson)
        } else {
          // Fallback: get from database
          const cart = await getCart(userId)
          if (cart) {
            cartItems = cart.items.map(item => ({
              state: item.state,
              adType: item.adType,
              quantity: item.quantity,
              reservationId: item.reservationId
            }))
          }
        }

        if (cartItems.length === 0) {
          console.error('No cart items found')
          return NextResponse.json({
            success: false,
            message: 'Payment succeeded but no items found'
          }, { status: 500 })
        }

        console.log('Updating inventory for', cartItems.length, 'items')

        // Update inventory for each item
        const updatePromises = cartItems.map(async (item) => {
          const updateResponse = await fetch(`${request.nextUrl.origin}/api/update-inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              state: item.state,
              adType: item.adType,
              decreaseBy: item.quantity || 1
            })
          })

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text()
            console.error('Inventory update failed for item:', item, errorText)
            throw new Error(`Failed to update inventory for ${item.state}#${item.adType}`)
          }

          return await updateResponse.json()
        })

        try {
          await Promise.all(updatePromises)
          console.log('All inventory updates successful')
        } catch (error) {
          console.error('MANUAL ACTION REQUIRED - Some inventory updates failed:', {
            paymentIntentId,
            userId,
            cartItems,
            customerEmail: paymentIntent.receipt_email,
            amount: paymentIntent.amount / 100,
            timestamp: new Date().toISOString(),
            error: error.message
          })

          return NextResponse.json({
            success: false,
            message: 'Payment succeeded but some inventory updates failed'
          }, { status: 500 })
        }

        // Mark all reservations as completed
        const reservationPromises = cartItems
          .filter(item => item.reservationId)
          .map(item => completeReservation(item.reservationId).catch(err => {
            console.error('Failed to complete reservation:', item.reservationId, err)
          }))

        await Promise.all(reservationPromises)

        // Get full cart data for order creation
        let fullCart = null
        try {
          fullCart = await getCart(userId)
        } catch (error) {
          console.error('Failed to get cart for order:', error)
        }

        // Create order in database
        try {
          const items = fullCart ? fullCart.items.map(item => ({
            itemId: item.itemId,
            state: item.state,
            adType: item.adType,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            reservationId: item.reservationId
          })) : cartItems.map(item => ({
            itemId: `${item.state}#${item.adType}`,
            state: item.state,
            adType: item.adType,
            title: item.title || 'Unknown',
            price: item.price || 0,
            quantity: item.quantity || 1,
            reservationId: item.reservationId || ''
          }))

          // Initialize slot submissions for each item
          const slotSubmissions = {}
          items.forEach(item => {
            const itemKey = item.itemId.replace(/[#]/g, "_")
            slotSubmissions[itemKey] = initializeSlotSubmissions(item.itemId, item.quantity)
          })

          const orderData = {
            orderId: paymentIntentId,
            userId: userId,
            customerEmail: paymentIntent.receipt_email || paymentIntent.metadata.customerEmail || 'unknown',
            customerName: paymentIntent.metadata.customerName || 'Unknown',
            customerPhone: paymentIntent.metadata.customerPhone || '',
            items: items,
            subtotal: fullCart ? fullCart.subtotal : (paymentIntent.amount / 100),
            total: paymentIntent.amount / 100,
            createdAt: new Date().toISOString(),
            uploadStatus: {},
            slotSubmissions: slotSubmissions
          }

          await createOrder(orderData)
          console.log('Order created successfully with slot tracking:', paymentIntentId)
        } catch (error) {
          console.error('Failed to create order record:', error)
          // Don't fail the whole payment, just log it
        }

        // Clear the cart
        try {
          await clearCart(userId)
          console.log('Cart cleared successfully')
        } catch (error) {
          console.error('Failed to clear cart:', error)
          // Not critical, cart will be cleared on next login
        }

        return NextResponse.json({
          success: true,
          message: 'Payment confirmed, inventory updated, and cart cleared',
          itemCount: cartItems.length,
          orderId: paymentIntentId
        })

      } else {
        // SINGLE ITEM CHECKOUT MODE (backwards compatible)
        console.log('Processing single item checkout')

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

        // Create order in database for single item checkout
        try {
          const { state, adType, adTitle, userId, quantity } = paymentIntent.metadata
          const itemQuantity = parseInt(quantity) || 1

          const itemId = `${state}#${adType}`
          const items = [{
            itemId: itemId,
            state: state,
            adType: adType,
            title: adTitle || 'Unknown',
            price: paymentIntent.amount / 100 / itemQuantity,
            quantity: itemQuantity,
            reservationId: ''
          }]

          // Initialize slot submissions
          const itemKey = itemId.replace(/[#]/g, "_")
          const slotSubmissions = {
            [itemKey]: initializeSlotSubmissions(itemId, itemQuantity)
          }

          const orderData = {
            orderId: paymentIntentId,
            userId: userId || 'guest',
            customerEmail: customerData?.email || paymentIntent.receipt_email || 'unknown',
            customerName: customerData?.fullName || 'Unknown',
            customerPhone: customerData?.phone || '',
            items: items,
            subtotal: paymentIntent.amount / 100,
            total: paymentIntent.amount / 100,
            createdAt: new Date().toISOString(),
            uploadStatus: {},
            slotSubmissions: slotSubmissions
          }

          await createOrder(orderData)
          console.log('Single item order created successfully:', paymentIntentId)
        } catch (error) {
          console.error('Failed to create single item order:', error)
          // Don't fail the payment, just log it
        }

        return NextResponse.json({
          success: true,
          message: 'Payment confirmed and inventory updated',
          ...result
        })
      }
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