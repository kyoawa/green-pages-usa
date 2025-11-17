# Schema Templates System - Complete Guide

## Overview

You can now create reusable upload schema templates and apply them across multiple ad types and states without editing code!

---

## What's Been Implemented

### 1. **Template System** ✅
- Save any schema as a reusable template
- Load templates into any ad type
- Templates stored in DynamoDB `green-pages-schema-templates` table

### 2. **Schema Editor Enhancements** ✅
Located at: `/admin/ads/schema/{state}/{adType}`

**New Buttons Added**:
- 🟣 **LOAD TEMPLATE** - Choose from saved templates
- 🟡 **SAVE AS TEMPLATE** - Save current schema for reuse
- 🟠 **APPLY TO MULTIPLE** - Apply to many ads at once
- 🟢 **ADD FIELD** - Add new upload requirement
- 🔵 **SAVE SCHEMA** - Save to this specific ad

### 3. **API Routes Created** ✅
- `GET /api/admin/schema-templates` - List all templates
- `POST /api/admin/schema-templates` - Create new template
- `DELETE /api/admin/schema-templates?id={id}` - Delete template
- `POST /api/admin/bulk-apply-schema` - Apply schema to multiple ads

---

## How to Use

### Creating a Template

**Scenario**: You've designed a perfect schema for "Single Listings" in California and want to use it everywhere.

1. Go to `/admin/ads`
2. Find "CA - SINGLE LISTINGS"
3. Click the green gear icon (⚙️)
4. Design your upload form (add fields, configure them)
5. Click **"SAVE AS TEMPLATE"** (yellow button)
6. Enter template name: "Standard Business Listing"
7. Enter description: "Name, address, phone, website, logo, photo"
8. Click "Save Template"

✅ Template is now saved and can be reused!

### Loading a Template

**Scenario**: You want to apply the "Standard Business Listing" template to New York single listings.

1. Go to `/admin/ads`
2. Find "NY - SINGLE LISTINGS"
3. Click the green gear icon (⚙️)
4. Click **"LOAD TEMPLATE"** (purple button)
5. Click "Load" next to "Standard Business Listing"
6. Confirm you want to replace current schema
7. Click **"SAVE SCHEMA"** (blue button)

✅ New York now has the same upload form as California!

### Applying to Multiple Ads at Once

**Scenario**: You want all "Single Listings" across all states to have the same schema.

#### Method 1: From Schema Editor
1. Design or load your perfect schema
2. Click **"APPLY TO MULTIPLE"** (orange button)
3. Select all the ads you want (CA#single, NY#single, IL#single, etc.)
4. Click "Apply Schema"
5. Confirms how many succeeded

#### Method 2: From Templates (Coming Soon)
1. Go to `/admin/templates` (planned)
2. Find your template
3. Click "Bulk Apply"
4. Select target ads
5. Confirm application

---

## Template Examples

### Example 1: Standard Business Listing
**Use For**: Single listings, basic ads
**Fields**:
- Brand Name (text, required)
- Address (text, required)
- Phone (phone, required)
- Website (url, optional)
- Instagram (text, optional)
- Logo (image, required, .jpg/.png/.svg)
- Photo (image, optional, .jpg/.png)

### Example 2: Banner Ad Only
**Use For**: Digital banner ads
**Fields**:
- Banner Image (image, required, .jpg/.png, exactly 728x90px)
- Click URL (url, required)

### Example 3: Premium Full Profile
**Use For**: Premium listings, featured ads
**Fields**:
- Brand Name (text, required)
- Description (textarea, required, max 500 chars)
- Address (text, required)
- Phone (phone, required)
- Email (email, required)
- Website (url, required)
- Instagram (text, optional)
- Facebook (url, optional)
- Logo (image, required)
- Cover Photo (image, required)
- Gallery Images (image, optional, max 5 files)
- Menu PDF (file, optional, .pdf only)

---

## Database Structure

### Schema Templates Table
**Table Name**: `green-pages-schema-templates`

```javascript
{
  id: "template_1234567_abc123",
  name: "Standard Business Listing",
  description: "Basic business info with logo and photo",
  schema: {
    schemaVersion: "1.0",
    fields: [
      { fieldName: "brandName", fieldType: "text", label: "Brand Name", required: true },
      { fieldName: "logo", fieldType: "image", label: "Logo", required: true, acceptedFormats: [".jpg", ".png"] },
      // ... more fields
    ]
  },
  createdAt: "2025-11-16T12:00:00Z",
  updatedAt: "2025-11-16T12:00:00Z"
}
```

### Ads Table (Updated)
**Table Name**: `green-pages-ads`

```javascript
{
  id: "CA#single",
  state: "CA",
  adType: "single",
  title: "SINGLE LISTINGS",
  price: 300,
  inventory: 60,
  totalSlots: 100,
  uploadSchema: {  // <-- Applied from template or custom
    schemaVersion: "1.0",
    fields: [...]
  },
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-11-16T12:00:00Z"
}
```

---

## How Schemas Flow to Upload Pages

### The Complete Journey

```
1. Admin creates schema in schema editor
   ↓
2. Schema saved to ad's uploadSchema field in DynamoDB
   ↓
3. Customer purchases ad and completes checkout
   ↓
4. Customer goes to /account/orders
   ↓
5. Clicks "Upload Now" on an item
   ↓
6. Upload page fetches order details from /api/orders/{orderId}
   ↓
7. Order includes items with state + adType info
   ↓
8. Upload component fetches ad details from /api/admin/ads/{state}#{adType}
   ↓
9. Ad includes uploadSchema field
   ↓
10. DynamicUploadForm renders based on schema
   ↓
11. Customer sees your custom upload form!
```

### Files Involved

**1. Schema Storage**
- `lib/dynamodb.js` - Stores uploadSchema in ads table
- Updated `createInventoryItem()` and `updateAdDetails()` methods

**2. Upload Pages**
- `/upload/order/[orderId]/[itemId]/page.tsx` - Post-checkout uploads
- `/components/MultiSlotUpload.tsx` - Per-slot upload interface
- `/components/DynamicUploadForm.tsx` - Renders forms from schema

**3. Schema Display**
Both upload pages need to:
1. Fetch ad details using `state` and `adType`
2. Check if `ad.uploadSchema` exists
3. If yes: Use `DynamicUploadForm` with the schema
4. If no: Use legacy hardcoded form

---

## Next Steps for Full Integration

### IMPORTANT: MultiSlotUpload Integration

Currently `MultiSlotUpload.tsx` uses a hardcoded form. To make it use dynamic schemas:

**Update Required** (in `/components/MultiSlotUpload.tsx`):

```typescript
// ADD: Fetch ad schema
const [adSchema, setAdSchema] = useState<UploadSchema | null>(null)

useEffect(() => {
  fetchAdSchema()
}, [orderItem.state, orderItem.adType])

const fetchAdSchema = async () => {
  try {
    const response = await fetch(`/api/admin/ads/${orderItem.state}#${orderItem.adType}`)
    if (response.ok) {
      const ad = await response.json()
      if (ad.uploadSchema) {
        setAdSchema(ad.uploadSchema)
      }
    }
  } catch (error) {
    console.error('Error fetching ad schema:', error)
  }
}

// REPLACE hardcoded form with:
{adSchema ? (
  <DynamicUploadForm
    schema={adSchema}
    onSubmit={handleSlotSubmit}
    initialData={existingSlotData}
    buttonText={`SAVE SLOT ${currentSlot}`}
    isSubmitting={isSubmitting}
  />
) : (
  // Fallback to hardcoded form for backward compatibility
  <HardcodedForm />
)}
```

### Environment Variables

Add to `.env.local`:

```env
# Existing
DYNAMODB_TABLE_NAME=green-pages-ads
ORDERS_TABLE_NAME=green-pages-orders
SUBMISSIONS_TABLE_NAME=green-pages-submissions

# NEW
SCHEMA_TEMPLATES_TABLE_NAME=green-pages-schema-templates
```

### Create DynamoDB Table

Run this AWS CLI command (or use AWS Console):

```bash
aws dynamodb create-table \
  --table-name green-pages-schema-templates \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

Or create manually in AWS Console:
- Table name: `green-pages-schema-templates`
- Partition key: `id` (String)
- Billing mode: On-demand

---

## Common Workflows

### Workflow 1: Same Schema for All States

**Goal**: All "Single Listings" across all states have identical upload requirements

1. Design schema for CA#single
2. Click "SAVE AS TEMPLATE" → Name: "Standard Single Listing"
3. For each other state (NY, IL, MO, etc.):
   - Go to that state's single listing schema editor
   - Click "LOAD TEMPLATE"
   - Select "Standard Single Listing"
   - Click "SAVE SCHEMA"

**Or use bulk apply**:
1. Design schema for CA#single
2. Click "APPLY TO MULTIPLE"
3. Select: NY#single, IL#single, MO#single, OK#single, MT#single
4. Click "Apply Schema"
5. Done in one click!

### Workflow 2: Ad Type-Specific Schemas

**Goal**: Different ad types have different requirements

**Templates to Create**:
- "Single Listing Schema" - Basic contact info
- "Banner Ad Schema" - Just image + URL
- "Quarter Page Schema" - Medium detail
- "Half Page Schema" - More detail
- "Full Page Schema" - Maximum detail

**Apply Process**:
1. Load appropriate template for each ad type
2. Customize as needed per state
3. Save

### Workflow 3: State-Specific Customization

**Goal**: California needs extra fields that other states don't

1. Load "Standard Single Listing" template
2. Add California-specific fields (e.g., "CA License Number")
3. Save schema (only affects CA#single)
4. Other states keep standard template

---

## Testing Checklist

- [ ] Create a template with 3-4 fields
- [ ] Load template into different ad (different state/type)
- [ ] Verify fields appear correctly
- [ ] Make a test purchase
- [ ] Go to upload page after checkout
- [ ] Verify custom form appears (not hardcoded form)
- [ ] Fill out and submit form
- [ ] Check submission in `/admin/submissions`
- [ ] Verify data matches schema fields
- [ ] Export CSV and check columns
- [ ] Apply schema to multiple ads at once
- [ ] Verify all targeted ads updated

---

## Troubleshooting

**Q: Template not appearing in load list**
**A**: Check `/api/admin/schema-templates` returns data. Verify DynamoDB table exists.

**Q: Schema saved but upload form still shows old form**
**A**: Clear browser cache. Check `MultiSlotUpload.tsx` is fetching ad schema (see integration code above).

**Q: Bulk apply failed for some ads**
**A**: Check API response for which ads failed and why. Usually means ad doesn't exist or wrong ID format.

**Q: Upload form not showing custom fields**
**A**:
1. Verify ad has `uploadSchema` field in DynamoDB
2. Check upload component is using `DynamicUploadForm`
3. Ensure ad's state/adType matches exactly (case-sensitive)

---

## Future Enhancements

1. **Template Manager Page** (`/admin/templates`)
   - View all templates
   - Edit templates
   - Delete templates
   - See which ads use each template

2. **Template Preview**
   - Live preview before applying
   - Side-by-side comparison with current schema

3. **Version Control**
   - Track schema changes over time
   - Rollback to previous versions

4. **Import/Export**
   - Export templates as JSON
   - Import templates from file
   - Share templates between environments

5. **Bulk Operations**
   - Apply template to all ads of a type
   - Apply template to all ads in a state
   - Clear all schemas

6. **Template Analytics**
   - See which templates are most used
   - Track completion rates per schema
   - Identify problematic fields

---

## Summary

✅ **What Works Now**:
- Create and save schema templates
- Load templates into any ad
- Templates persist in DynamoDB
- Schema editor has template UI
- Bulk apply API ready

🔄 **Integration Needed**:
- Update `MultiSlotUpload.tsx` to fetch and use ad schemas
- Create DynamoDB table for templates
- Add environment variable
- Test full purchase → upload flow

📝 **Documentation**:
- This guide
- [DYNAMIC_UPLOAD_SCHEMA_SYSTEM.md](DYNAMIC_UPLOAD_SCHEMA_SYSTEM.md)
- [ADMIN_NAVIGATION_GUIDE.md](ADMIN_NAVIGATION_GUIDE.md)

---

Last Updated: November 2025
Version: 2.1.0
