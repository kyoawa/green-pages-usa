# Dynamic Upload Schema System

## Overview

The Green Pages USA platform now supports **custom upload requirements for each ad type**. You can define exactly what information customers need to provide when uploading their ad content - all through a visual admin interface, without touching code.

## Key Features

✅ **Custom Upload Forms** - Each ad type can have completely different upload requirements
✅ **No Code Changes** - Add/remove/modify fields through admin UI
✅ **Flexible Field Types** - Text, textarea, email, phone, URL, image, file uploads
✅ **Validation** - Required fields, max length, file format restrictions
✅ **Schema Versioning** - Track changes to upload requirements over time
✅ **Dynamic Exports** - CSV exports automatically include all custom fields
✅ **Backward Compatible** - Works alongside existing slot upload system

---

## Quick Start

### 1. Define Upload Schema for an Ad Type

1. Navigate to `/admin/ads/schema/{state}/{adType}` (e.g., `/admin/ads/schema/CA/single`)
2. Click "ADD FIELD" to create a new upload requirement
3. Configure the field:
   - **Field Name**: Internal identifier (e.g., `brandName`, `logoUrl`)
   - **Label**: What users see (e.g., "Brand Name", "Company Logo")
   - **Field Type**: text, textarea, email, phone, url, image, or file
   - **Required**: Check if this field must be filled out
   - **Placeholder**: Helper text shown in empty fields
   - **Help Text**: Additional instructions for users
4. Click "SAVE SCHEMA"

### 2. View Submissions

1. Navigate to `/admin/submissions`
2. Use filters to find specific submissions (by state, ad type, status)
3. Click "View" to see full submission details
4. Click "EXPORT CSV" to download all data

---

## System Architecture

### Database Schema

#### Ads Table (`green-pages-ads`)

```typescript
interface AdType {
  id: string                    // e.g., "CA#single"
  state: string                 // "CA"
  adType: string                // "single"
  title: string
  price: number
  inventory: number
  totalSlots: number
  description: string
  active: boolean
  uploadSchema?: UploadSchema   // NEW: Custom upload requirements
  createdAt: string
  updatedAt: string
}

interface UploadSchema {
  schemaVersion: string         // e.g., "1.0"
  fields: UploadField[]
}

interface UploadField {
  fieldName: string             // Internal identifier
  fieldType: FieldType          // 'text' | 'textarea' | 'email' | 'phone' | 'url' | 'image' | 'file'
  label: string                 // User-facing label
  required: boolean
  placeholder?: string
  helpText?: string
  maxLength?: number            // For text fields
  acceptedFormats?: string[]    // For files: ['.jpg', '.png', '.pdf']
  maxFiles?: number             // For multi-file uploads
}
```

#### Submissions Table (`green-pages-submissions`)

```typescript
interface Submission {
  id: string                    // Unique submission ID
  orderId: string
  itemId: string
  slotNumber: number
  adType: string
  state: string

  // Customer info
  customerEmail: string
  customerName: string
  customerPhone: string

  // Dynamic data (schemaless - stores ANY field)
  fieldData: { [fieldName: string]: any }

  // File URLs in S3
  fileUrls: { [fieldName: string]: string | string[] }

  // Metadata
  submittedAt: string
  lastEditedAt?: string
  status: 'pending' | 'approved' | 'published'
}
```

---

## Example Schemas

### Single Listing Ad (Full Contact Info)

```javascript
{
  schemaVersion: "1.0",
  fields: [
    {
      fieldName: "brandName",
      fieldType: "text",
      label: "Business Name",
      required: true,
      placeholder: "Green Valley Dispensary",
      maxLength: 100
    },
    {
      fieldName: "address",
      fieldType: "text",
      label: "Physical Address",
      required: true,
      placeholder: "123 Main St, Los Angeles, CA 90210"
    },
    {
      fieldName: "phone",
      fieldType: "phone",
      label: "Phone Number",
      required: true,
      placeholder: "(555) 123-4567"
    },
    {
      fieldName: "website",
      fieldType: "url",
      label: "Website",
      required: false,
      placeholder: "https://greenpages.com"
    },
    {
      fieldName: "instagram",
      fieldType: "text",
      label: "Instagram Handle",
      required: false,
      placeholder: "@greenpagesusa"
    },
    {
      fieldName: "logo",
      fieldType: "image",
      label: "Company Logo",
      required: true,
      acceptedFormats: [".jpg", ".png", ".svg"],
      helpText: "Upload a square logo (minimum 500x500px)"
    },
    {
      fieldName: "photo",
      fieldType: "image",
      label: "Dispensary Photo",
      required: false,
      acceptedFormats: [".jpg", ".png"]
    }
  ]
}
```

### Banner Ad (Image Only)

```javascript
{
  schemaVersion: "1.0",
  fields: [
    {
      fieldName: "bannerImage",
      fieldType: "image",
      label: "Banner Image (728x90px)",
      required: true,
      acceptedFormats: [".jpg", ".png"],
      helpText: "Image must be exactly 728x90 pixels"
    },
    {
      fieldName: "clickUrl",
      fieldType: "url",
      label: "Click Destination URL",
      required: true,
      placeholder: "https://yourwebsite.com/promo"
    }
  ]
}
```

### Premium Listing (Extensive Info)

```javascript
{
  schemaVersion: "1.0",
  fields: [
    {
      fieldName: "brandName",
      fieldType: "text",
      label: "Business Name",
      required: true,
      maxLength: 100
    },
    {
      fieldName: "description",
      fieldType: "textarea",
      label: "Business Description",
      required: true,
      maxLength: 500,
      helpText: "Tell customers about your dispensary (max 500 characters)"
    },
    {
      fieldName: "address",
      fieldType: "text",
      label: "Address",
      required: true
    },
    {
      fieldName: "phone",
      fieldType: "phone",
      label: "Phone",
      required: true
    },
    {
      fieldName: "email",
      fieldType: "email",
      label: "Email",
      required: true
    },
    {
      fieldName: "website",
      fieldType: "url",
      label: "Website",
      required: true
    },
    {
      fieldName: "instagram",
      fieldType: "text",
      label: "Instagram Handle",
      required: false
    },
    {
      fieldName: "logo",
      fieldType: "image",
      label: "Logo",
      required: true,
      acceptedFormats: [".jpg", ".png", ".svg"]
    },
    {
      fieldName: "coverPhoto",
      fieldType: "image",
      label: "Cover Photo",
      required: true,
      acceptedFormats: [".jpg", ".png"]
    },
    {
      fieldName: "gallery",
      fieldType: "image",
      label: "Gallery Images (up to 5)",
      required: false,
      acceptedFormats: [".jpg", ".png"],
      maxFiles: 5
    },
    {
      fieldName: "menu",
      fieldType: "file",
      label: "Menu PDF",
      required: false,
      acceptedFormats: [".pdf"]
    }
  ]
}
```

---

## Admin Workflow

### Setting Up Upload Requirements

```
1. Go to admin dashboard
2. Select an ad type (e.g., "CA Single Listings")
3. Click "Edit Schema" button
4. Add/remove/modify fields as needed
5. Preview the form
6. Save changes
7. Schema immediately applies to all new uploads
```

### Viewing and Exporting Submissions

```
1. Navigate to /admin/submissions
2. See all submissions in table format
3. Filter by:
   - State (CA, NY, etc.)
   - Ad Type (single, banner, etc.)
   - Status (pending, approved, published)
   - Search (customer name, email, order ID)
4. Click "View" to see full submission details including files
5. Click "EXPORT CSV" to download all data
   - CSV automatically includes all custom fields from all ad types
   - File URLs are included in export
```

---

## Integration with Existing Slot System

The dynamic upload schema system works **alongside** the existing per-slot upload system:

### How It Works Together

1. **Customer purchases 10x Single Listing Ads**
   - System creates 10 slots (as before)
   - Each slot needs to be filled out separately

2. **Customer clicks "Upload Now"**
   - System checks if ad type has `uploadSchema` defined
   - If **YES**: Shows `DynamicUploadForm` with custom fields
   - If **NO**: Falls back to original upload form

3. **Customer fills out Slot 1**
   - Form shows only the fields defined in the schema
   - Required fields must be completed
   - Files are validated against accepted formats

4. **Submission is saved**
   - Data stored in `fieldData` object (schemaless)
   - Files uploaded to S3 at `submissions/{orderId}/{itemId}/slot-{N}/`
   - Slot marked as "completed"

5. **Customer continues to Slot 2-10**
   - Can save different information for each slot
   - Can edit previously completed slots

---

## API Endpoints

### GET `/api/admin/ads/{state}#{adType}`
- **Purpose**: Get ad details including upload schema
- **Response**: Ad object with `uploadSchema` field

### PATCH `/api/admin/ads/{state}#{adType}`
- **Purpose**: Update ad's upload schema
- **Body**: `{ uploadSchema: UploadSchema }`
- **Response**: Updated ad object

### GET `/api/admin/submissions`
- **Purpose**: Get all submissions across all ad types
- **Response**: Array of submission objects

### GET `/api/submissions/{submissionId}`
- **Purpose**: Get specific submission details (for editing)
- **Response**: Submission object with `fieldData` and `fileUrls`

---

## Components

### `DynamicUploadForm.tsx`

**Location**: `/components/DynamicUploadForm.tsx`

**Purpose**: Renders a form based on upload schema definition

**Props**:
```typescript
{
  schema: UploadSchema
  onSubmit: (data: FormData) => Promise<void>
  initialData?: { [fieldName: string]: any }
  buttonText?: string
  isSubmitting?: boolean
}
```

**Features**:
- Automatically validates required fields
- Enforces max length on text fields
- Validates email/URL formats
- Checks file types before upload
- Shows existing files when editing
- Responsive design

**Usage Example**:
```tsx
import DynamicUploadForm from '@/components/DynamicUploadForm'

const schema = {
  schemaVersion: "1.0",
  fields: [
    { fieldName: "brandName", fieldType: "text", label: "Brand Name", required: true },
    { fieldName: "logo", fieldType: "image", label: "Logo", required: true, acceptedFormats: [".png", ".jpg"] }
  ]
}

<DynamicUploadForm
  schema={schema}
  onSubmit={handleSubmit}
  buttonText="SAVE SLOT"
  isSubmitting={loading}
/>
```

---

## File Organization in S3

```
green-pages-uploads/
└── submissions/
    └── {orderId}/                          # e.g., pi_1234567890
        └── {itemId}/                       # e.g., CA_single
            ├── slot-1/
            │   ├── logo_company-logo.png
            │   ├── photo_storefront.jpg
            │   ├── gallery_0_image1.jpg
            │   ├── gallery_1_image2.jpg
            │   └── menu_product-menu.pdf
            ├── slot-2/
            │   ├── logo_different-logo.png
            │   └── photo_interior.jpg
            └── ...
```

---

## Migrations & Backward Compatibility

### Existing Ads Without Schema

- Ads without `uploadSchema` field work normally
- System falls back to hardcoded upload form
- No migration required

### Adding Schema to Existing Ad Type

```javascript
// Before: No schema defined
{
  id: "CA#single",
  title: "Single Listings",
  price: 300
  // ... no uploadSchema
}

// After: Schema added via admin UI
{
  id: "CA#single",
  title: "Single Listings",
  price: 300,
  uploadSchema: {
    schemaVersion: "1.0",
    fields: [/* custom fields */]
  }
}

// Result: New uploads use dynamic form, old submissions still accessible
```

### Schema Versioning

Track schema changes over time:

```javascript
{
  schemaVersion: "1.0"  // Initial version
}

{
  schemaVersion: "1.1"  // Added new optional field
}

{
  schemaVersion: "2.0"  // Major change - removed fields
}
```

Future enhancement: Show different views based on schema version when viewing old submissions.

---

## Common Use Cases

### Use Case 1: Simple Banner Ad

**Requirement**: Only need banner image and click URL

**Schema**:
```javascript
{
  fields: [
    { fieldName: "bannerImage", fieldType: "image", label: "Banner (728x90)", required: true },
    { fieldName: "clickUrl", fieldType: "url", label: "Destination URL", required: true }
  ]
}
```

**User Experience**: Ultra-simple 2-field form

---

### Use Case 2: Full Business Profile

**Requirement**: Comprehensive business information

**Schema**: 15+ fields including text, images, files

**User Experience**: Detailed form with sections, helps build complete business profile

---

### Use Case 3: Product Showcase

**Requirement**: Multiple product images with descriptions

**Schema**:
```javascript
{
  fields: [
    { fieldName: "productImages", fieldType: "image", label: "Product Photos", required: true, maxFiles: 10 },
    { fieldName: "description", fieldType: "textarea", label: "Product Description", required: true, maxLength: 1000 }
  ]
}
```

**User Experience**: Upload up to 10 product photos with detailed description

---

## Best Practices

### Schema Design

✅ **DO**:
- Keep forms as simple as possible
- Use clear, descriptive labels
- Provide helpful placeholder text
- Set reasonable max lengths
- Specify accepted file formats
- Group related fields together

❌ **DON'T**:
- Ask for unnecessary information
- Use technical jargon in labels
- Make everything required
- Set unrealistic file size limits

### Field Naming

```javascript
// Good
{ fieldName: "brandName", label: "Business Name" }
{ fieldName: "logoUrl", label: "Company Logo" }
{ fieldName: "instagramHandle", label: "Instagram" }

// Bad
{ fieldName: "field1", label: "Name" }
{ fieldName: "img", label: "pic" }
{ fieldName: "social", label: "social media" }
```

### Validation

Always include:
- Required flags for critical fields
- Max length for text inputs (prevent abuse)
- File format restrictions (security)
- Help text for complex fields

---

## Testing Checklist

- [ ] Create schema with all field types
- [ ] Test required field validation
- [ ] Test file format validation
- [ ] Test max length enforcement
- [ ] Upload files and verify S3 storage
- [ ] Edit existing submission
- [ ] Export CSV and verify all fields present
- [ ] Test with quantity > 1 (multiple slots)
- [ ] Verify old ads without schema still work
- [ ] Test mobile responsiveness

---

## Troubleshooting

### Issue: Fields not showing in upload form

**Cause**: Schema not saved or not loaded

**Fix**:
1. Check `/api/admin/ads/{state}#{adType}` returns `uploadSchema`
2. Verify schema saved successfully
3. Clear browser cache

### Issue: File uploads failing

**Cause**: S3 permissions or file type mismatch

**Fix**:
1. Check S3 bucket permissions
2. Verify file extension matches `acceptedFormats`
3. Check file size limits

### Issue: CSV export missing columns

**Cause**: Different ad types have different fields

**Solution**: This is expected! CSV includes ALL fields from ALL submissions. Empty cells appear for fields not in a particular ad type's schema.

---

## Future Enhancements

### Potential Features

1. **Conditional Fields** - Show field B only if field A is filled
2. **Field Groups** - Organize fields into collapsible sections
3. **Default Values** - Pre-fill fields for faster submission
4. **Templates** - Save common submissions as templates
5. **Bulk Import** - Upload CSV to fill multiple slots at once
6. **Rich Text Editor** - For description fields
7. **Image Cropping** - Built-in image editor
8. **Field Dependencies** - Make field required based on another field's value

---

## Support

### For Admins

- Schema editor: `/admin/ads/schema/{state}/{adType}`
- Submissions viewer: `/admin/submissions`
- API docs: This file

### For Developers

- Type definitions: `lib/types.ts`
- Dynamic form component: `components/DynamicUploadForm.tsx`
- Database helpers: `lib/dynamodb.js`
- Admin API: `app/api/admin/`

---

**Last Updated**: November 2025
**Version**: 1.0.0
