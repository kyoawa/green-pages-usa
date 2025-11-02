# Green Pages USA - Current System Documentation

**Generated:** 2025-11-02
**Purpose:** Complete documentation of existing architecture before implementing cart & auth features

---

## 1. CURRENT ARCHITECTURE OVERVIEW

### Tech Stack
- **Framework:** Next.js 14.2.16 (App Router)
- **Auth:** Clerk (just implemented)
- **Payment:** Stripe
- **Database:** AWS DynamoDB (2 tables)
- **Storage:** AWS S3
- **Email:** Resend
- **Hosting:** Vercel

---

## 2. DATABASE SCHEMA (DynamoDB)

### Table 1: `green-pages-ads`
**Primary Key:** `id` (UUID)

**Schema:**
```javascript
{
  id: "uuid-v4",                    // Primary key
  state: "CA",                       // State code (2 letters)
  adType: "quarter",                 // Normalized: quarter|half|full|single
  title: "1/4 PAGE ADVERTORIAL - 1000",
  price: 1000,                       // USD (not cents!)
  inventory: 7,                      // Current remaining slots
  totalSlots: 10,                    // Total available slots
  description: "1/4 Page Advertorial",
  active: true,                      // Can be toggled by admin
  createdAt: "2025-11-02T...",
  updatedAt: "2025-11-02T..."
}
```

**Important Notes:**
- Composite key pattern: `{state}#{adType}` (e.g., "CA#quarter")
- **CRITICAL:** Prices are in DOLLARS, not cents (different from Stripe!)
- Inventory decrements on successful payment
- `active` field controls visibility (admin can hide ads)

### Table 2: `green-pages-submissions`
**Primary Key:** `id` (UUID)

**Schema:**
```javascript
{
  id: "uuid-v4",
  customerEmail: "user@example.com",
  customerName: "John Doe",
  customerPhone: "+1234567890",
  brandName: "Dispensary Name",
  dispensaryAddress: "123 Main St",
  webAddress: "https://...",
  phoneNumber: "+1234567890",
  instagram: "@handle",
  state: "CA",
  selectedAd: "quarter",
  submittedAt: "2025-11-02T...",
  documentUrl: "s3://...",           // AWS S3 URL
  photoUrl: "s3://...",              // AWS S3 URL
  logoUrl: "s3://..."                // AWS S3 URL
}
```

**File Storage:**
- Files uploaded to S3 bucket: `green-pages-uploads`
- Pre-signed URLs generated for uploads
- URLs stored in DynamoDB

---

## 3. PAYMENT FLOW (Stripe Integration)

### Current Payment Process

**Step 1: Create Payment Intent**
- **API:** `POST /api/create-payment-intent`
- **Input:**
  ```javascript
  {
    amount: 1080,        // $1000 ad + 8% tax = $1080
    state: "CA",         // Can be name or code
    adType: "quarter",   // Can be various formats
    adTitle: "1/4 PAGE ADVERTORIAL - 1000"
  }
  ```
- **Normalizes:**
  - State names → state codes (e.g., "California" → "CA")
  - Ad types → canonical keys (e.g., "1/4 page" → "quarter")
- **Converts:** Dollars to cents for Stripe (`$1080 → 108000 cents`)
- **Returns:** `clientSecret`, `paymentIntentId`
- **Metadata stored in Stripe:**
  ```javascript
  {
    state: "CA",
    adType: "quarter",
    adTitle: "...",
    originalState: "California",  // For debugging
    originalAdType: "1/4 page"    // For debugging
  }
  ```

**Step 2: Customer Completes Payment (Frontend)**
- EnhancedCheckout component handles Stripe Elements
- Collects: payment info, billing address, shipping address, email, phone
- Uses `stripe.confirmPayment()` with `redirect: 'if_required'`
- On success, frontend calls confirm-payment API

**Step 3: Confirm Payment & Update Inventory**
- **API:** `POST /api/confirm-payment`
- **Input:** `{ paymentIntentId }`
- **Process:**
  1. Retrieves payment intent from Stripe
  2. Checks status === 'succeeded'
  3. Extracts metadata (state, adType)
  4. Calls `/api/update-inventory` internally
  5. Returns success/failure

**Step 4: Update Inventory**
- **API:** `POST /api/update-inventory` (internal call)
- **Input:**
  ```javascript
  {
    state: "CA",
    adType: "quarter",
    decreaseBy: 1
  }
  ```
- **Process:**
  1. Scans `green-pages-ads` table for matching state + adType
  2. Uses DynamoDB `UpdateCommand` with **conditional expression:**
     ```
     ConditionExpression: "attribute_exists(inventory) AND inventory >= :decrease"
     ```
  3. This prevents race conditions (atomic decrement)
  4. If inventory insufficient, returns 400 error
  5. Updates `inventory` and `updatedAt` fields

**Critical Error Handling:**
- If inventory update fails AFTER payment succeeds:
  - Logs error with customer email, paymentIntentId, state, adType
  - Returns error to frontend
  - **Manual intervention required** (no auto-refund)

---

## 4. INVENTORY SYSTEM

### Current Inventory Flow

**Fetching Inventory (Public)**
- **API:** `GET /api/inventory/[state]`
- Returns only `active: true` ads
- Accepts state code or name
- Real-time inventory numbers

**Admin Inventory Management**
- **API:** `GET /api/admin/ads` (Clerk auth required)
- Returns ALL ads (including inactive)
- Admin can:
  - Toggle `active` status
  - Update price, inventory, totalSlots
  - Add new ad types
  - Delete ad types

### Inventory Table Used
**`green-pages-inventory` vs `green-pages-ads`:**
- Code references both table names inconsistently
- **ACTUAL TABLE:** `green-pages-ads` (confirmed by admin APIs)
- `green-pages-inventory` exists in code but may not be used

### Current Limitations (Why Cart is Needed)
1. **No Reservation:** Inventory shown is NOT reserved
2. **Race Conditions:** Two users can see "1 remaining" simultaneously
3. **Checkout Failure:** User enters payment info, but ad sells out before payment completes
4. **No Multi-Item:** Users can only buy 1 ad at a time
5. **No User Accounts:** No order history, no saved carts

---

## 5. API ROUTES INVENTORY

### Public APIs (No Auth)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/inventory/[state]` | GET | Get available ads for state |
| `/api/states/active` | GET | Get list of active states |
| `/api/create-payment-intent` | POST | Create Stripe payment intent |
| `/api/confirm-payment` | POST | Confirm payment & update inventory |
| `/api/contact` | POST | Send contact form email |
| `/api/upload-requirements` | POST | Upload files to S3 |

### Admin APIs (Clerk Auth Required)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/ads` | GET/POST/PUT/DELETE | Manage ad inventory |
| `/api/admin/ads/[id]` | GET/PUT/DELETE | Single ad operations |
| `/api/admin/states` | GET/POST | Manage states |
| `/api/admin/states/[code]` | GET/PUT/DELETE | Single state ops |
| `/api/admin/states/[code]/toggle` | POST | Toggle state visibility |
| `/api/admin/states/add` | POST | Add new state |
| `/api/admin/submissions` | GET | View customer submissions |
| `/api/admin/submissions/download` | GET | Download submission files |
| `/api/admin/download` | GET | Download files from S3 |
| `/api/admin/init-data` | POST | Initialize sample data |

### Internal APIs (Called by other APIs)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/update-inventory` | POST | Decrement inventory (atomic) |

---

## 6. AWS CONFIGURATION

### Environment Variables (Vercel/Local)
```bash
# AWS
AWS_ACCESS_KEY_ID=AKIA5RHD7VRBJFRTC2RC
AWS_REGION=us-west-2
AWS_SECRET_ACCESS_KEY=[redacted]
DYNAMODB_TABLE_NAME=green-pages-ads
S3_BUCKET_NAME=green-pages-uploads
SUBMISSIONS_TABLE_NAME=green-pages-submissions

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Resend
RESEND_API_KEY=re_...

# Vercel
VERCEL_API_TOKEN=[redacted]
VERCEL_OIDC_TOKEN=[redacted]
EDGE_CONFIG=[redacted]
```

### DynamoDB Tables
- **Table 1:** `green-pages-ads` (ad inventory)
- **Table 2:** `green-pages-submissions` (customer submissions)
- **Region:** us-west-2
- **Access:** IAM credentials (not role-based)

### S3 Bucket
- **Name:** `green-pages-uploads`
- **Region:** us-west-2
- **Access:** Pre-signed URLs for uploads
- **File Types:** Documents, photos, logos

---

## 7. FRONTEND FLOW (State Pages)

### User Journey
1. **Homepage:** User selects state from map/list
2. **State Page (`/[state]`):** Shows available ads
3. **Ad Selection:** User clicks "Buy Now" on an ad
4. **Checkout:** EnhancedCheckout component
   - Collects payment info (Stripe Elements)
   - Collects billing/shipping address
   - Collects email, name, phone
5. **Payment:** Stripe processes payment
6. **Upload Requirements:** User uploads files
7. **Order Summary:** Confirmation screen

### State Page Steps (4-step wizard)
```javascript
steps = [
  "Choose Your Ad",        // Step 0: Browse inventory
  "Checkout",              // Step 1: Payment with EnhancedCheckout
  "Upload Requirements",   // Step 2: File uploads to S3
  "Order Summary"          // Step 3: Confirmation
]
```

### Critical Frontend State
- `selectedAd`: Currently selected ad
- `inventory`: Array of available ads (refreshed after payment)
- `currentStep`: Wizard progress (0-3)
- `customerInfo`: Saved after payment

---

## 8. CRITICAL ISSUES TO PRESERVE

### 1. Payment Intent Metadata
**MUST preserve these exact metadata keys:**
- `state` (normalized state code)
- `adType` (normalized ad type)
- `adTitle` (display title)

**Reason:** `/api/confirm-payment` depends on this metadata to call `/api/update-inventory`

### 2. Inventory Update Atomicity
**MUST use conditional expression:**
```javascript
ConditionExpression: "attribute_exists(inventory) AND inventory >= :decrease"
```

**Reason:** Prevents overselling if two payments happen simultaneously

### 3. Price Conversion
**CRITICAL MATH:**
- DynamoDB stores prices in **DOLLARS**
- Stripe requires prices in **CENTS**
- Frontend displays prices with 8% tax
- Formula: `stripeCents = (dbDollars * 1.08) * 100`

### 4. State/AdType Normalization
**Must normalize BEFORE creating payment intent:**
- "California" → "CA"
- "1/4 page" → "quarter"
- "Half Page" → "half"

**Reason:** Ensures metadata matches DynamoDB queries

### 5. Admin API Protection
**ALL `/api/admin/**` routes MUST check Clerk auth:**
```javascript
const { userId } = await auth()
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Reason:** Just implemented Clerk auth; breaking this breaks admin panel

---

## 9. WHAT NEEDS TO BE ADDED (Cart + Real-time Inventory)

### Requirements
1. **User Carts:**
   - Save cart in DynamoDB (linked to Clerk userId)
   - Persist cart across sessions
   - Allow multiple ads in cart

2. **Inventory Reservations:**
   - Reserve inventory when ad added to cart
   - Expiration timer (e.g., 15 minutes)
   - Auto-release if cart abandoned
   - Real-time inventory updates

3. **User Accounts:**
   - Clerk already implemented
   - Need to link orders to userId
   - Order history view

4. **Updated Payment Flow:**
   - Create payment intent for ENTIRE cart
   - Update inventory for ALL cart items on success
   - Clear cart after successful payment

5. **New DynamoDB Table:**
   - `green-pages-carts` for user carts
   - `green-pages-reservations` for inventory holds

### Challenges
- **Stripe Payment Intent:** Currently handles 1 item, needs cart items
- **Inventory Atomicity:** Must reserve/release atomically
- **Expiration:** Need background job or TTL for expired reservations
- **Real-time:** Frontend needs to poll or use websockets for inventory updates

---

## 10. NEXT STEPS

1. Design cart + reservation schema
2. Plan API changes (minimize breaking changes)
3. Implement reservation system with TTL
4. Update payment flow for multiple items
5. Add user account features
6. Thorough testing of race conditions

---

**End of Documentation**
