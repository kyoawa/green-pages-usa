# Per-Slot Upload System Documentation

## Overview

The Green Pages USA platform now supports **individual upload slots** for each ad quantity purchased. When a customer orders multiple ads (e.g., 10 single slot ads), they can upload separate information for each individual slot.

## Key Features

✅ **Per-Slot Upload Forms** - Each ad slot has its own dedicated upload form
✅ **Progress Tracking** - Visual progress bars showing completion status
✅ **Save & Resume** - Users can save progress and return later to complete remaining slots
✅ **Edit Existing Submissions** - Users can go back and edit any previously submitted slot
✅ **User Dashboard** - View all orders and their per-slot completion status
✅ **Backward Compatible** - Works with existing orders using legacy upload system

---

## Database Schema

### Orders Table (`green-pages-orders`)

```typescript
interface Order {
  orderId: string                    // Payment Intent ID (Primary Key)
  userId: string                     // Clerk user ID
  customerEmail: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  total: number
  createdAt: string
  uploadStatus: { [itemId: string]: boolean }  // Legacy field
  slotSubmissions?: {                           // NEW: Per-slot tracking
    [itemId: string]: SlotSubmission[]
  }
}

interface SlotSubmission {
  slotNumber: number                 // 1-based index (1, 2, 3...)
  submissionId: string | null        // Reference to submissions table
  status: 'pending' | 'completed'
  submittedAt?: string
  lastEditedAt?: string
}
```

### Submissions Table (`green-pages-submissions`)

```typescript
interface Submission {
  id: string                         // Unique submission ID (Primary Key)
  orderId: string                    // Links to order
  itemId: string                     // Links to specific order item
  slotNumber: number                 // Which slot this submission is for
  adType: string
  adTitle: string
  state: string

  // Customer info
  customerEmail: string
  customerName: string
  customerPhone: string

  // Upload data
  brandName: string
  dispensaryAddress: string
  webAddress: string
  phoneNumber: string
  instagram: string

  // File URLs in S3
  documentUrl?: string
  photoUrl?: string
  logoUrl?: string

  // Metadata
  submittedAt: string
  status: 'pending' | 'approved' | 'published'
}
```

---

## User Flow

### 1. Purchase Flow

```
1. User adds items to cart (e.g., 10x Single Slot Ads for California)
2. User checks out via Stripe
3. Payment succeeds
4. System creates Order with slotSubmissions initialized:
   {
     "CA_single": [
       { slotNumber: 1, submissionId: null, status: "pending" },
       { slotNumber: 2, submissionId: null, status: "pending" },
       ...
       { slotNumber: 10, submissionId: null, status: "pending" }
     ]
   }
```

### 2. Upload Flow

```
1. User navigates to /account/orders
2. Sees order with progress: "0 of 10 slots completed (0%)"
3. Clicks "Upload Now" button
4. Redirected to /upload/order/{orderId}/{itemId}
5. MultiSlotUpload component loads:
   - Shows slot selector (1-10)
   - Displays current slot form (Slot 1 of 10)
6. User fills out form for Slot 1 and clicks "SAVE SLOT"
7. System saves to S3 and DynamoDB
8. Progress updates: "1 of 10 slots completed (10%)"
9. Form automatically advances to Slot 2
10. User can continue or click "SAVE & FINISH LATER"
```

### 3. Edit Flow

```
1. User returns to /account/orders
2. Sees order with progress: "5 of 10 slots completed (50%)"
3. Clicks "Upload Remaining" button
4. MultiSlotUpload loads with existing progress
5. User clicks on Slot 3 (already completed)
6. Form pre-populates with existing data
7. User makes edits and clicks "UPDATE SLOT"
8. lastEditedAt timestamp is updated
```

---

## API Endpoints

### GET `/api/orders/user`
- **Auth**: Required (Clerk)
- **Returns**: All orders for the authenticated user
- **Response**: `{ orders: Order[] }`

### GET `/api/orders/[orderId]`
- **Auth**: Required (Clerk)
- **Returns**: Specific order details
- **Validates**: User owns the order
- **Response**: `Order`

### POST `/api/upload-requirements/slot`
- **Auth**: Implicit (order validation)
- **Body**: FormData with slot information and files
- **Actions**:
  1. Uploads files to S3 at `submissions/{orderId}/{itemId}/slot-{N}/`
  2. Saves submission data to DynamoDB
  3. Updates order's slotSubmissions array
- **Response**: `{ success: true, submissionId: string }`

### GET `/api/submissions/[submissionId]`
- **Auth**: None (for now)
- **Returns**: Submission details (used for editing)
- **Response**: `Submission`

---

## File Organization in S3

```
green-pages-uploads/
└── submissions/
    └── {orderId}/                          # e.g., pi_1234567890
        └── {itemId}/                       # e.g., CA_single
            ├── slot-1/
            │   ├── document_filename.pdf
            │   ├── photo_filename.jpg
            │   ├── logo_filename.svg
            │   └── submission-data.json
            ├── slot-2/
            │   ├── document_filename.pdf
            │   ├── photo_filename.jpg
            │   ├── logo_filename.svg
            │   └── submission-data.json
            └── ...
```

---

## Components

### `MultiSlotUpload.tsx`
**Location**: `/components/MultiSlotUpload.tsx`

**Props**:
```typescript
{
  orderId: string
  orderItem: OrderItem
  customerInfo: { email, fullName, phone }
  existingSlots?: SlotSubmission[]
  onComplete: () => void
}
```

**Features**:
- Visual slot selector grid (1-10)
- Green checkmarks for completed slots
- Progress bar showing completion percentage
- Auto-advances to next pending slot after save
- Pre-loads existing data when editing
- "SAVE & FINISH LATER" button

**State Management**:
- `currentSlot`: Which slot is being edited
- `slots`: Array of all slot statuses
- `formData`: Current form field values
- `isSubmitting`: Loading state

---

## Helper Functions

### `initializeSlotSubmissions(itemId, quantity)`
**Location**: `/lib/orders.ts`

Creates initial slot array for a new order:
```typescript
[
  { slotNumber: 1, submissionId: null, status: 'pending' },
  { slotNumber: 2, submissionId: null, status: 'pending' },
  ...
]
```

### `updateSlotSubmission(orderId, itemId, slotNumber, submissionId)`
**Location**: `/lib/orders.ts`

Updates a specific slot's status in DynamoDB:
```typescript
// Marks slot as completed and records submission ID
slotSubmissions[itemKey][slotIndex] = {
  slotNumber,
  submissionId,
  status: 'completed',
  submittedAt: ...,
  lastEditedAt: ...
}
```

### `getSlotCompletionStatus(order)`
**Location**: `/lib/orders.ts`

Calculates overall completion statistics:
```typescript
{
  totalSlots: 10,
  completedSlots: 7,
  pendingSlots: 3,
  percentComplete: 70
}
```

---

## User Dashboard Features

### Order Card Display

Shows for each order:
- Order ID and date
- Total amount paid
- Overall upload status banner:
  - ✅ Green: "All requirements uploaded" (if 100% complete)
  - ⚠️ Yellow: "X of Y items uploaded" (if incomplete)
- Per-item breakdown with:
  - Item title and quantity
  - Price
  - Slot progress bar (for quantities > 1)
  - "✓ Complete" badge OR "Upload Now/Remaining" button

---

## Admin Considerations

### Viewing Submissions

Admins can query submissions by:
- **Order ID**: Get all slots for an order
- **Item ID**: Get all slots for a specific item
- **Status**: Filter by pending/completed
- **Slot Number**: View specific slot

### S3 File Access

All submission files are organized by:
1. Order ID
2. Item ID
3. Slot number

Making it easy to locate and download customer uploads.

---

## Migration & Backward Compatibility

### Existing Orders
- Old orders without `slotSubmissions` field will still work
- System checks for `slotSubmissions` first, falls back to `uploadStatus`
- `getSlotCompletionForItem()` handles both cases

### Database Updates
No migration required! New field `slotSubmissions` is optional and added automatically to new orders.

---

## Testing Checklist

- [ ] Order 1 item with quantity 1 → Should show simple upload
- [ ] Order 1 item with quantity 10 → Should show 10 slots
- [ ] Complete 5 of 10 slots → Progress should show 50%
- [ ] Save and close → Return later to see progress preserved
- [ ] Edit a completed slot → Should load existing data
- [ ] Complete all slots → Should show 100% and green checkmark
- [ ] View orders page → Should show accurate progress bars
- [ ] Order multiple different items → Each should track separately
- [ ] Test on mobile → Slot grid should be responsive

---

## Environment Variables Required

```env
# AWS (existing)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# DynamoDB Tables
ORDERS_TABLE_NAME=green-pages-orders
SUBMISSIONS_TABLE_NAME=green-pages-submissions
CART_TABLE_NAME=green-pages-carts

# S3
S3_BUCKET_NAME=green-pages-uploads

# Stripe (existing)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## Future Enhancements

### Potential Features:
1. **Email Notifications** - Remind users of incomplete slots
2. **Admin Dashboard** - View all submissions with filters
3. **Bulk Upload** - Upload CSV for multiple slots at once
4. **Template System** - Save common submissions as templates
5. **Approval Workflow** - Admin review before publishing
6. **Expiration Dates** - Auto-archive old submissions

---

## Support & Troubleshooting

### Common Issues

**Q: Slot progress not updating?**
A: Check browser console for API errors. Verify DynamoDB permissions.

**Q: Files not uploading?**
A: Verify S3 bucket permissions and CORS settings.

**Q: Can't edit existing slot?**
A: Ensure `/api/submissions/[id]` endpoint is accessible.

**Q: Progress showing 0% for old orders?**
A: Legacy orders use `uploadStatus` field. Migration not required.

---

## Code References

### Key Files:
- [lib/orders.ts](lib/orders.ts) - Order management and slot tracking
- [components/MultiSlotUpload.tsx](components/MultiSlotUpload.tsx) - Main upload component
- [app/account/orders/page.tsx](app/account/orders/page.tsx) - User dashboard
- [app/upload/order/[orderId]/[itemId]/page.tsx](app/upload/order/[orderId]/[itemId]/page.tsx) - Upload page
- [app/api/upload-requirements/slot/route.ts](app/api/upload-requirements/slot/route.ts) - Slot upload API
- [app/api/confirm-payment/route.js](app/api/confirm-payment/route.js) - Order creation

---

**Last Updated**: November 2025
**Version**: 2.0.0
