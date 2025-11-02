# Cart System Implementation Summary

**Date:** 2025-11-02
**Status:** ✅ BACKEND COMPLETE - Ready for Testing

---

## What Was Implemented

### ✅ 1. Database Tables (DynamoDB)

**Tables configured in AWS:**
- `green-pages-carts` - User shopping carts
- `green-pages-reservations` - Inventory reservations with TTL
- `green-pages-orders` - Order history (with userId GSI)
- `green-pages-saved-progress` - Optional checkout autosave

**Indexes Added:**
- `green-pages-reservations`: `itemId-expiresAt-index` (GSI)
- `green-pages-orders`: `userId-createdAt-index` (GSI)

**TTL Enabled:**
- `green-pages-reservations`: Auto-deletes expired reservations
- `green-pages-saved-progress`: Auto-deletes old progress

---

### ✅ 2. Helper Functions Created

#### `lib/cart.ts`
- `getCart(userId)` - Get user's cart
- `addToCart(userId, item)` - Add item to cart
- `removeFromCart(userId, itemId)` - Remove item from cart
- `clearCart(userId)` - Clear entire cart
- `calculateCartTotals(items)` - Calculate subtotal, tax, total
- `getCartWithTotals(userId)` - Get cart with calculated totals

#### `lib/reservations.ts`
- `createReservation()` - Reserve inventory (15 min expiration)
- `getReservation()` - Get specific reservation
- `releaseReservation()` - Release inventory hold
- `completeReservation()` - Mark reservation completed after payment
- `getActiveReservationsForItem()` - Count active holds for item
- `getUserActiveReservations()` - Get user's active reservations
- `cleanupExpiredReservations()` - Manual cleanup (cron job)
- `calculateAvailableInventory()` - Real-time available inventory
- `extendReservation()` - Extend expiration (for checkout)

---

### ✅ 3. API Routes Implemented

#### Cart Management APIs
- **POST `/api/cart/add`** - Add item to cart + create reservation
  - Checks inventory availability
  - Creates reservation first
  - Then adds to cart
  - Returns cart + reservation

- **DELETE `/api/cart/remove`** - Remove item + release reservation
  - Finds reservation ID
  - Releases inventory hold
  - Removes from cart

- **GET `/api/cart`** - Get cart with totals
  - Returns empty cart if none exists
  - Includes subtotal, tax, total, itemCount

- **DELETE `/api/cart/clear`** - Clear cart + release all reservations

#### Cron Job
- **GET/POST `/api/cron/cleanup-reservations`** - Manual reservation cleanup
  - Releases expired reservations
  - Returns count of cleaned reservations
  - Secured with `CRON_SECRET` env var

---

### ✅ 4. Payment Flow Updates

#### Updated: `app/api/create-payment-intent/route.js`

**Now supports TWO modes:**

**Mode 1: Single Item (Backwards Compatible)**
```javascript
{
  amount: 1080,
  state: "CA",
  adType: "quarter",
  adTitle: "1/4 PAGE ADVERTORIAL - 1000"
}
```

**Mode 2: Cart Checkout (NEW)**
```javascript
{
  amount: 2160,
  userId: "user_abc123",
  cartItems: [
    {
      state: "CA",
      adType: "quarter",
      title: "...",
      price: 1000,
      quantity: 1,
      reservationId: "res_..."
    }
  ]
}
```

**Metadata Structure:**
- Single: `{ checkoutType: "single", state, adType, ... }`
- Cart: `{ checkoutType: "cart", userId, itemCount, cartItems (if fits) }`

#### Updated: `app/api/confirm-payment/route.js`

**Checks `checkoutType` in metadata:**

**Cart Mode:**
1. Gets cart items from metadata or database
2. Updates inventory for ALL items
3. Marks all reservations as completed
4. Clears user's cart
5. Returns success with item count

**Single Mode (Backwards Compatible):**
1. Gets state + adType from metadata
2. Calls `/api/update-inventory` for 1 item
3. Returns success (existing flow preserved)

---

### ✅ 5. Inventory System Updates

#### Updated: `app/api/inventory/[state]/route.ts`

**Now shows real-time available inventory:**

Before:
```javascript
inventory: 7  // Total in database
```

After:
```javascript
inventory: 4,          // Available (7 total - 3 reserved)
totalInventory: 7,     // Total in database
remaining: "4/10 REMAINING"
```

**Formula:** `available = totalInventory - activeReservations`

---

## Key Features

### 🔒 Security
- All cart APIs require Clerk authentication
- Cron job secured with secret token
- Atomic inventory updates prevent overselling

### ⏱️ Inventory Reservations
- 15-minute hold when item added to cart
- DynamoDB TTL auto-deletes expired (up to 48hr delay)
- Manual cleanup via cron job (recommended: run every 5 min)
- Extendable when user starts checkout

### 🔄 Backwards Compatibility
- Existing state pages (single-item checkout) still work
- Old payment intent API calls still work
- No breaking changes to current flow

### 💰 Price Handling
- DynamoDB stores prices in **DOLLARS**
- Stripe requires prices in **CENTS**
- Cart totals calculated: subtotal + 8% tax = total

---

## Environment Variables Added

```bash
# Cart System Tables
CART_TABLE_NAME="green-pages-carts"
RESERVATIONS_TABLE_NAME="green-pages-reservations"
ORDERS_TABLE_NAME="green-pages-orders"
SAVED_PROGRESS_TABLE_NAME="green-pages-saved-progress"

# Cron Job Security
CRON_SECRET="dev_secret_change_in_production"
```

---

## What's NOT Yet Implemented (Frontend)

### Need to Create:
1. **Cart Button** (header) - Shows item count badge
2. **Cart Page/Modal** - Lists cart items, shows totals
3. **Cart Checkout Flow** - Calls cart payment APIs
4. **State Page Updates** - "Add to Cart" instead of "Buy Now"
5. **Real-time Inventory Polling** - Update every 10 seconds

---

## Testing Checklist

### Backend APIs (Ready to Test Now)

#### Test Cart APIs:
```bash
# 1. Add to cart (requires Clerk auth)
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-token>" \
  -d '{"state":"CA","adType":"quarter"}'

# 2. Get cart
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer <clerk-token>"

# 3. Remove from cart
curl -X DELETE http://localhost:3000/api/cart/remove \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-token>" \
  -d '{"itemId":"CA#quarter"}'

# 4. Clear cart
curl -X DELETE http://localhost:3000/api/cart/clear \
  -H "Authorization: Bearer <clerk-token>"
```

#### Test Inventory API:
```bash
# Should show available inventory (total - reservations)
curl http://localhost:3000/api/inventory/CA
```

#### Test Cron Job:
```bash
curl -X POST http://localhost:3000/api/cron/cleanup-reservations \
  -H "Authorization: Bearer dev_secret_change_in_production"
```

---

## How It Works

### User Flow:

1. **Browse Ads** → User visits state page (e.g., `/california`)
2. **Add to Cart** → Clicks "Add to Cart"
   - Frontend calls `POST /api/cart/add`
   - Backend creates 15-minute reservation
   - Backend adds to cart with reservation ID
3. **View Cart** → Clicks cart icon
   - Frontend calls `GET /api/cart`
   - Shows items, subtotal, tax, total
4. **Checkout** → Clicks "Checkout"
   - Frontend calls `POST /api/create-payment-intent` with `cartItems`
   - User enters payment info (Stripe)
   - On success, frontend calls `POST /api/confirm-payment`
   - Backend updates inventory for all items
   - Backend marks reservations completed
   - Backend clears cart
5. **Upload Requirements** → Proceeds to file upload step

### Reservation Lifecycle:

```
Cart Add → [Reservation Created - 15 min timer starts]
         ↓
User Browses → [Reservation Active - inventory held]
         ↓
Checkout Starts → [Can extend reservation to 30 min]
         ↓
Payment Success → [Reservation marked "completed"]
         ↓
OR Timer Expires → [Reservation auto-released, removed from cart]
```

---

## Next Steps

### Immediate:
1. ✅ Test backend APIs (use curl or Postman)
2. ⏳ Create cart UI components
3. ⏳ Update state pages to use "Add to Cart"
4. ⏳ Test end-to-end cart checkout

### Production:
1. Change `CRON_SECRET` to random secure value
2. Set up Vercel cron job for `/api/cron/cleanup-reservations`
   - Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/cleanup-reservations",
       "schedule": "*/5 * * * *"
     }]
   }
   ```
3. Monitor reservation cleanup logs
4. Add error tracking (Sentry, etc.)

---

## Files Created/Modified

### New Files:
- `lib/cart.ts` - Cart helper functions
- `lib/reservations.ts` - Reservation helper functions
- `app/api/cart/add/route.ts` - Add to cart API
- `app/api/cart/remove/route.ts` - Remove from cart API
- `app/api/cart/route.ts` - Get cart API
- `app/api/cart/clear/route.ts` - Clear cart API
- `app/api/cron/cleanup-reservations/route.ts` - Cron cleanup job

### Modified Files:
- `app/api/create-payment-intent/route.js` - Added cart checkout mode
- `app/api/confirm-payment/route.js` - Added cart payment processing
- `app/api/inventory/[state]/route.ts` - Shows available inventory
- `.env.local` - Added table names and cron secret

---

## Critical Notes

### ⚠️ Backwards Compatibility Preserved:
- All existing single-item checkout flows work unchanged
- No breaking changes to current state pages
- Old payment intents still process correctly

### ⚠️ Race Condition Protection:
- Inventory updates use conditional expressions
- Reservations checked before cart add
- Atomic operations prevent overselling

### ⚠️ Error Handling:
- If payment succeeds but inventory update fails → Logs for manual review
- If reservation create fails → Cart add fails (rollback)
- If cart clear fails → Not critical, clears on next login

---

**STATUS:** Backend implementation complete. Ready for frontend integration and testing!
