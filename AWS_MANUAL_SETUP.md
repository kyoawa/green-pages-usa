# Manual AWS DynamoDB Table Setup

Since AWS CLI is not installed, you can create these tables in the AWS Console manually.

## Go to AWS Console

1. Navigate to: https://console.aws.amazon.com/dynamodbv2/
2. Make sure you're in region: **us-west-2**
3. Click "Create table" for each table below

---

## Table 1: green-pages-carts

**Click "Create table" and enter:**

- **Table name:** `green-pages-carts`
- **Partition key:** `userId` (String)
- **Sort key:** Leave blank
- **Table settings:** Default settings (or customize)
- **Table class:** Standard
- **Capacity mode:** On-demand

**Click "Create table"**

---

## Table 2: green-pages-reservations

### IMPORTANT: Delete old table first!

1. Find existing `green-pages-reservations` table
2. Click on it → Actions → Delete table
3. Type "delete" to confirm
4. Wait for deletion to complete

### Create new table:

**Click "Create table" and enter:**

- **Table name:** `green-pages-reservations`
- **Partition key:** `reservationId` (String)
- **Sort key:** Leave blank
- **Table settings:** Default settings
- **Capacity mode:** On-demand

**Click "Create table"**

### After table is created, add GSI:

1. Click on the `green-pages-reservations` table
2. Go to "Indexes" tab
3. Click "Create index"
4. Enter:
   - **Partition key:** `itemId` (String)
   - **Sort key:** `expiresAt` (Number)
   - **Index name:** `itemId-expiresAt-index`
   - **Projected attributes:** All
5. Click "Create index"

### Enable TTL:

1. Still in the table, go to "Additional settings" tab
2. Find "Time to Live (TTL)" section
3. Click "Enable"
4. **TTL attribute name:** `expiresAt`
5. Click "Enable TTL"

---

## Table 3: green-pages-orders

**This table already exists**, but we need to add a GSI:

1. Click on existing `green-pages-orders` table
2. Go to "Indexes" tab
3. Click "Create index"
4. Enter:
   - **Partition key:** `userId` (String)
   - **Sort key:** `createdAt` (String)
   - **Index name:** `userId-createdAt-index`
   - **Projected attributes:** All
5. Click "Create index"

---

## Table 4: green-pages-saved-progress (OPTIONAL)

**Only if you want autosave checkout feature**

**Click "Create table" and enter:**

- **Table name:** `green-pages-saved-progress`
- **Partition key:** `userId` (String)
- **Sort key:** Leave blank
- **Table settings:** Default settings
- **Capacity mode:** On-demand

**Click "Create table"**

### Enable TTL:

1. Click on the table
2. Go to "Additional settings" tab
3. Find "Time to Live (TTL)" section
4. Click "Enable"
5. **TTL attribute name:** `expiresAt`
6. Click "Enable TTL"

---

## Summary Checklist

- [ ] Created `green-pages-carts` table
- [ ] Deleted old `green-pages-reservations` table
- [ ] Created new `green-pages-reservations` table
- [ ] Added `itemId-expiresAt-index` GSI to reservations
- [ ] Enabled TTL on reservations table
- [ ] Added `userId-createdAt-index` GSI to orders table
- [ ] (Optional) Created `green-pages-saved-progress` table
- [ ] (Optional) Enabled TTL on saved-progress table

---

## Next Step

After creating the tables, add these to your `.env.local`:

```bash
CART_TABLE_NAME=green-pages-carts
RESERVATIONS_TABLE_NAME=green-pages-reservations
ORDERS_TABLE_NAME=green-pages-orders
SAVED_PROGRESS_TABLE_NAME=green-pages-saved-progress
```

Then let me know and I'll create the cart implementation code!
