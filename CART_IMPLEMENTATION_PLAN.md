# Cart & Inventory Reservation Implementation Plan

**Created:** 2025-11-02
**Status:** AWAITING APPROVAL - DO NOT IMPLEMENT YET

---

## OVERVIEW

This plan implements:
1. User shopping carts (persistent, multi-item)
2. Real-time inventory reservations (prevent overselling)
3. Automatic reservation expiration (15-minute timer)
4. Updated payment flow for cart checkout

**Key Principle:** Minimize changes to existing working code

---

## PHASE 1: DATABASE SCHEMA (New Tables)

### Table 3: `green-pages-carts`
**Purpose:** Store user shopping carts (persistent across sessions)

**Primary Key:** `userId` (Clerk user ID)

**Schema:**
```javascript
{
  userId: "user_abc123",              // Clerk user ID (PK)
  items: [                             // Array of cart items
    {
      itemId: "CA#quarter",            // Matches ads table composite key
      state: "CA",
      adType: "quarter",
      title: "1/4 PAGE ADVERTORIAL - 1000",
      price: 1000,                     // USD (same as ads table)
      quantity: 1,                     // Always 1 for now (ads are unique)
      addedAt: "2025-11-02T12:00:00Z",
      reservationId: "res_xyz789"      // Links to reservation
    }
  ],
  createdAt: "2025-11-02T12:00:00Z",
  updatedAt: "2025-11-02T12:05:00Z"
}
```

**Indexes:** None needed (small dataset, queries by userId only)

### Table 4: `green-pages-reservations`
**Purpose:** Track inventory holds (with automatic expiration)

**Primary Key:** `reservationId` (UUID)
**GSI:** `itemId-expiresAt-index` (for cleanup queries)

**Schema:**
```javascript
{
  reservationId: "res_xyz789",        // UUID (PK)
  userId: "user_abc123",              // Who reserved it
  itemId: "CA#quarter",                // What was reserved
  state: "CA",
  adType: "quarter",
  quantity: 1,
  createdAt: "2025-11-02T12:00:00Z",
  expiresAt: "2025-11-02T12:15:00Z",  // 15 minutes from createdAt
  status: "active"                     // active | released | completed
}
```

**TTL:** Set on `expiresAt` field (DynamoDB auto-deletes)

**Important:** DynamoDB TTL can have up to 48-hour delay. We'll need manual cleanup too.

---

## PHASE 2: NEW API ROUTES

### 1. Cart Management APIs

#### `POST /api/cart/add`
**Purpose:** Add item to cart + create reservation

**Auth:** Clerk required

**Input:**
```javascript
{
  state: "CA",
  adType: "quarter"
}
```

**Process:**
1. Check if item already in user's cart → error if yes
2. Check current inventory (excluding existing reservations)
3. If inventory available:
   - Create reservation in `green-pages-reservations`
   - Add item to cart in `green-pages-carts`
   - Return success
4. If inventory unavailable → error

**Output:**
```javascript
{
  success: true,
  cart: {...},
  reservation: {...}
}
```

#### `DELETE /api/cart/remove`
**Purpose:** Remove item from cart + release reservation

**Auth:** Clerk required

**Input:**
```javascript
{
  itemId: "CA#quarter"
}
```

**Process:**
1. Remove item from `green-pages-carts`
2. Update reservation status to "released"
3. Return updated cart

#### `GET /api/cart`
**Purpose:** Get user's current cart

**Auth:** Clerk required

**Output:**
```javascript
{
  items: [...],
  subtotal: 2500,
  tax: 200,
  total: 2700,
  itemCount: 2
}
```

#### `DELETE /api/cart/clear`
**Purpose:** Clear entire cart + release all reservations

**Auth:** Clerk required

---

### 2. Reservation Management

#### `POST /api/reservations/cleanup`
**Purpose:** Manual cleanup of expired reservations (cron job)

**Auth:** Admin or internal only

**Process:**
1. Query `green-pages-reservations` where `expiresAt < now()` AND `status = "active"`
2. Update status to "released"
3. Delete from carts if still present

**Note:** Run every 5 minutes via Vercel cron or external service

---

### 3. Inventory APIs (Updates)

#### Update `GET /api/inventory/[state]`
**Changes:**
- Calculate "available" inventory: `inventory - activeReservations`
- Show real-time availability

**Example:**
```javascript
// Before: ad.inventory = 5
// Now:
//   ad.inventory = 5 (total in DB)
//   activeReservations = 3
//   ad.availableNow = 2 (shown to users)
```

---

## PHASE 3: PAYMENT FLOW UPDATES

### Current Flow (Single Item)
1. User selects ad → goes to checkout
2. Create payment intent for 1 item
3. Payment succeeds → update inventory for 1 item

### New Flow (Cart)
1. User adds items to cart (creates reservations)
2. User goes to checkout
3. **Create payment intent for ENTIRE CART**
4. Payment succeeds → mark reservations as "completed" + update inventory for ALL items
5. Clear cart

### Updated APIs

#### `POST /api/create-payment-intent` (Modified)
**Old Input:**
```javascript
{
  amount: 1080,
  state: "CA",
  adType: "quarter",
  adTitle: "..."
}
```

**New Input (Backwards Compatible):**
```javascript
{
  // Option 1: Single item (legacy)
  amount: 1080,
  state: "CA",
  adType: "quarter",
  adTitle: "...",

  // Option 2: Cart (new)
  cartItems: [
    { state: "CA", adType: "quarter", price: 1000, title: "..." },
    { state: "NY", adType: "half", price: 1800, title: "..." }
  ]
}
```

**Changes:**
- If `cartItems` provided → calculate total amount from cart
- Store cart items in metadata (as JSON string if needed)
- **CRITICAL:** Keep metadata structure compatible with `/api/confirm-payment`

#### `POST /api/confirm-payment` (Modified)
**Current Process:**
1. Retrieve payment intent
2. Extract metadata (state, adType)
3. Call `/api/update-inventory` for 1 item

**New Process:**
1. Retrieve payment intent
2. Check if metadata has `cartItems` or single item
3. If cart: loop through items, update inventory for each
4. If single: use existing logic (backwards compatible)
5. Mark all reservations as "completed"
6. Clear user's cart

**Backwards Compatibility:** Existing state pages (single-item checkout) continue working

---

## PHASE 4: FRONTEND CHANGES

### New Components

#### `CartButton` (Header)
- Shows cart item count badge
- Clicking opens cart modal or navigates to `/cart`

#### `CartPage` or `CartModal`
- Lists cart items
- Shows subtotal, tax, total
- Remove item button
- Checkout button
- Reservation timer countdown

#### `InventoryBadge` (State Page)
- Shows "X available now" instead of raw inventory
- Updates in real-time (polling every 10 seconds)
- Red indicator if item in user's cart

### Modified Components

#### `DynamicStatePage` (`/[state]/page.tsx`)
**Changes:**
- "Buy Now" → "Add to Cart"
- After adding to cart → show success toast + update button to "In Cart"
- Disable "Add to Cart" if already in cart or no inventory

#### `EnhancedCheckout`
**Changes:**
- Accept cart items array OR single item
- Calculate total from cart
- On success, clear entire cart (not just 1 item)

---

## PHASE 5: REAL-TIME INVENTORY UPDATES

### Polling Strategy (Simple, No WebSockets)

**Frontend:**
- Every 10 seconds, fetch `/api/inventory/[state]`
- Update displayed inventory numbers
- Disable "Add to Cart" if inventory becomes 0

**Why Polling:**
- Simpler than WebSockets
- Vercel serverless friendly
- Low traffic (6 states, few concurrent users)

**Alternative (Future):** Vercel Edge Config or Pusher for real-time

---

## PHASE 6: IMPLEMENTATION ORDER (Step-by-Step)

### Step 1: Create DynamoDB Tables
- Create `green-pages-carts` table
- Create `green-pages-reservations` table with TTL
- Test table creation locally

### Step 2: Create Reservation Helper Functions
- `lib/reservations.ts`:
  - `createReservation(userId, itemId, state, adType)`
  - `releaseReservation(reservationId)`
  - `getActiveReservations(itemId)`
  - `cleanupExpiredReservations()`

### Step 3: Create Cart Helper Functions
- `lib/cart.ts`:
  - `getCart(userId)`
  - `addToCart(userId, item, reservationId)`
  - `removeFromCart(userId, itemId)`
  - `clearCart(userId)`

### Step 4: Implement Cart APIs
- `POST /api/cart/add`
- `DELETE /api/cart/remove`
- `GET /api/cart`
- `DELETE /api/cart/clear`
- Test each API with Postman/curl

### Step 5: Update Inventory API
- Modify `GET /api/inventory/[state]` to show available inventory
- Test with mock reservations

### Step 6: Update Payment Intent API
- Modify `/api/create-payment-intent` to accept cart items
- Keep backwards compatibility
- Test both single-item and cart flows

### Step 7: Update Confirm Payment API
- Modify `/api/confirm-payment` to handle cart items
- Mark reservations as completed
- Clear cart
- Test thoroughly

### Step 8: Create Cron Job for Cleanup
- `/api/reservations/cleanup`
- Set up Vercel cron (vercel.json)

### Step 9: Frontend - Cart UI
- Create `CartButton` component
- Create `CartPage` or `CartModal`
- Add to header

### Step 10: Frontend - State Page Updates
- Change "Buy Now" to "Add to Cart"
- Show "In Cart" state
- Add polling for real-time inventory

### Step 11: Frontend - Checkout Updates
- Update `EnhancedCheckout` to handle cart
- Test entire cart checkout flow

### Step 12: Testing & Edge Cases
- Test race conditions (2 users, 1 slot)
- Test reservation expiration
- Test payment failure scenarios
- Test backwards compatibility (old single-item flow)

---

## CRITICAL SAFEGUARDS

### 1. Atomic Operations
**All inventory changes MUST use:**
```javascript
ConditionExpression: "inventory >= :decrease"
```

### 2. Reservation Race Conditions
**When creating reservation:**
1. Lock check: Count active reservations for itemId
2. Check: `ads.inventory - activeReservations > 0`
3. Only then create reservation
4. Use DynamoDB transactions if possible

### 3. Payment Intent Metadata Limits
**Stripe metadata limit:** 500 characters per key, 50 keys max

**If cart > 10 items:** Store cart in DynamoDB, reference ID in metadata

### 4. Backwards Compatibility
**Test Cases:**
1. Old state page (single item) → checkout → works
2. New cart → checkout → works
3. Mix: user has cart, visits old state page → still works

### 5. Error Handling
**Scenarios:**
- Reservation created but cart add fails → rollback reservation
- Payment succeeds but inventory update fails → log for manual fix
- Payment fails → keep reservation active (don't release yet)

---

## ROLLBACK PLAN

### If Something Breaks

**Step 1:** Disable cart features via feature flag
```javascript
const ENABLE_CART = process.env.NEXT_PUBLIC_ENABLE_CART === 'true'
```

**Step 2:** Revert to old checkout flow
- Remove "Add to Cart" buttons
- Show "Buy Now" buttons
- Use old single-item payment intent API

**Step 3:** Release all active reservations
- Run cleanup script
- Update all reservations to "released"

---

## TESTING CHECKLIST

### Unit Tests
- [ ] Reservation creation
- [ ] Reservation expiration
- [ ] Cart add/remove
- [ ] Inventory calculation (with reservations)

### Integration Tests
- [ ] Add to cart → reservation created
- [ ] Remove from cart → reservation released
- [ ] Cart checkout → all items purchased
- [ ] Expired reservation → cart item removed

### End-to-End Tests
- [ ] User adds 2 items to cart
- [ ] User completes checkout
- [ ] Inventory updated correctly
- [ ] Cart cleared after payment
- [ ] Reservations marked completed

### Race Condition Tests
- [ ] 2 users, 1 remaining slot, both try to add to cart
- [ ] 1 user gets reservation, other gets error
- [ ] Inventory shows 0 available for second user

### Backwards Compatibility Tests
- [ ] Old state page single-item checkout still works
- [ ] Old payment intent API still works
- [ ] No breaking changes to existing flows

---

## TIMELINE ESTIMATE

| Phase | Estimated Time |
|-------|---------------|
| Database setup | 1 hour |
| Helper functions | 2 hours |
| Cart APIs | 3 hours |
| Payment API updates | 3 hours |
| Cron job | 1 hour |
| Frontend cart UI | 4 hours |
| Frontend state page updates | 2 hours |
| Testing & debugging | 4 hours |
| **TOTAL** | **20 hours** |

---

## RISKS & MITIGATION

### Risk 1: DynamoDB TTL Delay
**Problem:** TTL can take up to 48 hours
**Mitigation:** Manual cleanup cron job every 5 minutes

### Risk 2: Stripe Metadata Size
**Problem:** Large carts exceed metadata limit
**Mitigation:** Store cart in DB, reference ID in metadata

### Risk 3: Payment Success but Inventory Update Fails
**Problem:** User charged but inventory not updated
**Mitigation:**
- Transaction logs
- Manual review process
- Idempotency keys

### Risk 4: Reservation Expires During Checkout
**Problem:** User filling out payment form, reservation expires
**Mitigation:**
- Extend reservation when checkout starts (30 min)
- Show timer in checkout UI
- Alert user if < 2 min remaining

---

## QUESTIONS FOR REVIEW

1. **Reservation Duration:** 15 minutes OK, or different?
2. **Max Cart Size:** Limit to X items, or unlimited?
3. **Reservation Extension:** Allow user to extend reservation?
4. **Inventory Display:** Show exact number or just "Low Stock" / "In Stock"?
5. **Multi-Quantity:** Future feature? (e.g., buy 2 quarter-page ads)
6. **Abandoned Cart Email:** Send reminder emails?

---

**STATUS:** AWAITING APPROVAL BEFORE IMPLEMENTATION

Please review this plan and confirm before I proceed with any code changes.
