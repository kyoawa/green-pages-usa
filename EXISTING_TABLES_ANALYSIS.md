# Existing DynamoDB Tables Analysis

**Date:** 2025-11-02

## Discovery

You have **7 DynamoDB tables** already created, but only **2 are actively used** in your codebase!

---

## Tables Breakdown

### ACTIVELY USED ✅

#### 1. `green-pages-ads`
- **Partition Key:** `id` (S)
- **Used by:** Admin APIs, inventory APIs, payment system
- **Purpose:** Store ad inventory (quarter-page, half-page, etc.)
- **Status:** ✅ Fully implemented and working

#### 2. `green-pages-submissions`
- **Partition Key:** `id` (S)
- **Used by:** Submissions API, admin dashboard
- **Purpose:** Store customer form submissions after purchase
- **Status:** ✅ Fully implemented and working

---

### CREATED BUT NOT USED ⚠️

#### 3. `green-pages-carts`
- **Partition Key:** `userId` (S)
- **Current Status:** Table exists, but NO code references it
- **Proposed Use:** Store user shopping carts
- **Action Needed:** Implement cart functionality

#### 4. `green-pages-orders`
- **Partition Key:** `id` (S)
- **Has GSI:** 1 index configured
- **Current Status:** Table exists, but NO code references it
- **Proposed Use:** Store completed customer orders
- **Action Needed:** Link orders to payments

#### 5. `green-pages-reservations`
- **Partition Key:** `reservationId` (S)
- **Has GSI:** 1 index configured
- **Current Status:** Table exists, but NO code references it
- **Proposed Use:** Inventory reservation system
- **Action Needed:** Implement reservation logic

#### 6. `green-pages-inventory`
- **Partition Key:** `id` (S)
- **Current Status:** Referenced in code BUT **green-pages-ads is used instead**
- **Confusion:** Code defaults to `green-pages-inventory` but ENV sets `green-pages-ads`
- **Action Needed:** Clarify which table is the source of truth

#### 7. `green-pages-saved-progress`
- **Partition Key:** `userId` (S)
- **Current Status:** Table exists, but NO code references it
- **Proposed Use:** Save incomplete checkouts/form progress
- **Action Needed:** Implement progress saving

---

## Key Findings

### Good News 🎉
1. **Infrastructure already exists!** You don't need to create new tables
2. **Schema likely already designed** (partition keys are set)
3. **GSI indexes configured** on orders and reservations

### Concerns ⚠️
1. **No code uses these tables** - they're orphaned
2. **No documentation** on intended schema/structure
3. **Potential duplicate:** `green-pages-inventory` vs `green-pages-ads` confusion
4. **Unknown schemas:** What fields do these tables expect?

---

## Questions to Resolve

### Critical Questions:

1. **Were these tables created for a previous attempt at cart functionality?**
   - If yes, was there existing code that was removed?
   - Do you have schema documentation?

2. **What's the correct inventory table?**
   - `green-pages-inventory` (referenced in code)
   - `green-pages-ads` (actually used via ENV variable)
   - Should we consolidate?

3. **Do the existing tables have the right structure?**
   - What fields are in `green-pages-carts`?
   - What fields are in `green-pages-orders`?
   - What fields are in `green-pages-reservations`?

4. **Should we use these tables or create new ones?**
   - Pros of using existing: Infrastructure ready, GSIs configured
   - Cons of using existing: Unknown schema, might not match our needs

---

## Recommended Next Steps

### Option A: Use Existing Tables (Faster)
1. Inspect table schemas in AWS Console
2. Verify partition keys and GSIs match our needs
3. Implement code to use existing tables
4. Add documentation

**Pros:**
- No table creation needed
- GSIs already configured
- Faster implementation

**Cons:**
- Schema might not match our design
- Need to adapt to existing structure

### Option B: Start Fresh (Cleaner)
1. Delete unused tables or rename them
2. Create new tables with exact schema we need
3. Full control over structure

**Pros:**
- Clean slate
- Exact schema we want
- No confusion

**Cons:**
- More setup work
- Need to configure GSIs

---

## My Recommendation

**Use existing tables with verification:**

1. **Check schemas in AWS Console:**
   - What fields exist in each table?
   - What are the GSI configurations?

2. **Verify they match our needs:**
   - Compare to my implementation plan
   - Adjust plan if needed

3. **Implement incrementally:**
   - Start with `green-pages-carts`
   - Then `green-pages-reservations`
   - Then `green-pages-orders`
   - Each step can be tested independently

---

## Action Items

**Before proceeding, please:**

1. ✅ Share schema/fields from AWS Console for:
   - `green-pages-carts`
   - `green-pages-orders`
   - `green-pages-reservations`

2. ✅ Clarify: Were these created for a previous implementation attempt?

3. ✅ Decide: Use existing tables or start fresh?

4. ✅ Confirm: Is `green-pages-ads` the correct inventory table?
   (Should we delete/rename `green-pages-inventory`?)

---

## Updated Implementation Plan

Once we verify the table schemas, I'll update the implementation plan to:
- Use existing tables (if suitable)
- Skip table creation steps
- Focus on code implementation
- Potentially reduce timeline from 20 hours to ~15 hours

**Waiting for your input before proceeding!**
