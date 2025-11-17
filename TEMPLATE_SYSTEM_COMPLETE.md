# Template System - Complete Implementation Guide

## ✅ What's Been Completed

### 1. **Core Template System**
- ✅ DynamoDB table created: `green-pages-schema-templates`
- ✅ Template CRUD API endpoints
- ✅ Save/Load/Delete template functionality
- ✅ Bulk apply schemas to multiple ads

### 2. **Pre-Made Templates Created**
Six professional templates are now available:

1. **Full Page Ad** - Name, Dispensary/Brand, File Upload
2. **1/2 Page Ad** - Name, Dispensary/Brand, Document (250 words), Logo (vectors)
3. **1/4 Page Ad** - Name, Dispensary/Brand, Document (140 words), Logo (vectors)
4. **Belly Band** - Name, Dispensary/Brand, Logo (vectors)
5. **Back Cover** - Name, Dispensary/Brand, File Upload
6. **Single Listing** - Name, Dispensary/Brand, Document (100 words), Logo (vectors)

### 3. **Template Management Page**
- 📍 **URL**: `/admin/templates`
- View all templates
- Preview template fields
- Delete templates
- Access from main admin dashboard

### 4. **Dynamic Upload Integration**
- ✅ Upload pages now fetch schemas from ads
- ✅ Forms render dynamically based on configured schema
- ✅ Slot-based uploads work with dynamic schemas
- ✅ Backward compatible with ads that don't have schemas

### 5. **Fixed Issues**
- ✅ Upload status now checks slot completion correctly
- ✅ "Upload Now" button only shows when uploads are pending
- ✅ Schema editor PATCH endpoint working
- ✅ Bulk apply page created and functional

---

## 🎯 How to Use the System

### **For Admins**

#### **Using Pre-Made Templates**

1. Go to `/admin/ads`
2. Click the green gear icon (⚙️) next to any ad
3. Click **"LOAD TEMPLATE"** (purple button)
4. Select one of the pre-made templates:
   - Full Page Ad
   - 1/2 Page Ad
   - 1/4 Page Ad
   - Belly Band
   - Back Cover
   - Single Listing
5. Click **"SAVE SCHEMA"** to apply it to that ad

#### **Editing Templates**

Templates can be edited in two ways:

**Method 1: Edit via Schema Editor**
1. Load the template into any schema editor
2. Make your changes (add/remove/modify fields)
3. Click **"SAVE AS TEMPLATE"** with the same name to update it

**Method 2: View in Template Manager**
1. Go to `/admin/templates`
2. Preview fields for any template
3. Delete templates you no longer need
4. Note: Direct editing coming in future update

#### **Creating New Templates**

1. Design a schema in any ad's schema editor
2. Add fields, configure them
3. Click **"SAVE AS TEMPLATE"**
4. Give it a descriptive name
5. Template is now available everywhere

#### **Bulk Applying Schemas**

1. Design or load your perfect schema
2. Click **"APPLY TO MULTIPLE"** (orange button)
3. Select all target ads (e.g., all single listings across states)
4. Click "Apply Schema"
5. See results showing success/failure

---

## 📂 Files Created/Modified

### **New Files**
- `/app/api/admin/schema-templates/route.ts` - Template CRUD API
- `/app/api/admin/bulk-apply-schema/route.ts` - Bulk apply API
- `/app/admin/templates/page.tsx` - Template management page
- `/app/admin/ads/bulk-apply/page.tsx` - Bulk apply UI
- `/scripts/create-templates-table.js` - Table creation script
- `/scripts/seed-schema-templates.js` - Pre-made templates seeder

### **Modified Files**
- `/lib/types.ts` - Added SchemaTemplate interface
- `/app/admin/ads/schema/[state]/[adType]/page.tsx` - Added template buttons & modals
- `/app/api/admin/ads/[id]/route.ts` - Added PATCH method for schema updates
- `/app/account/orders/page.tsx` - Fixed upload status check
- `/components/MultiSlotUpload.tsx` - Refactored to use dynamic schemas
- `/app/admin/page.tsx` - Added Templates link
- `/.env.local` - Added SCHEMA_TEMPLATES_TABLE_NAME

---

## 🗂️ Database Schema

### **Templates Table**: `green-pages-schema-templates`
```javascript
{
  id: "template_1731778800000_abc123",
  name: "Full Page Ad",
  description: "Full page advertisement with basic info and file upload",
  schema: {
    schemaVersion: "1.0",
    fields: [
      {
        fieldName: "name",
        fieldType: "text",
        label: "Name",
        required: true,
        placeholder: "Your Name",
        helpText: ""
      },
      {
        fieldName: "dispensaryBrand",
        fieldType: "text",
        label: "Dispensary/Brand",
        required: true,
        placeholder: "Dispensary or Brand Name",
        helpText: ""
      },
      {
        fieldName: "adFile",
        fieldType: "file",
        label: "Ad File Upload",
        required: true,
        helpText: "Upload your full page ad file",
        acceptedFormats: [".pdf", ".ai", ".eps", ".psd", ".jpg", ".png"]
      }
    ]
  },
  createdAt: "2025-11-16T18:00:00Z",
  updatedAt: "2025-11-16T18:00:00Z"
}
```

---

## 🔄 Complete Workflow

### **Admin Configures Template**
1. Create or load template in schema editor
2. Save as template (e.g., "Standard Single Listing")

### **Admin Applies to Ads**
3. Load template into CA single listing → Save
4. Use "Apply to Multiple" for NY, IL, MO, OK, MT single listings

### **Customer Purchases**
5. Customer buys 4x Single Listings in Montana

### **Customer Uploads**
6. After checkout, goes to `/account/orders`
7. Clicks "Upload Now" on Montana Single Listings
8. Sees 4 slot buttons (one per listing purchased)
9. Selects Slot 1
10. **Upload form displays dynamically** based on template:
    - Name (text field)
    - Dispensary/Brand (text field)
    - Document Upload (file, .doc/.docx/.txt/.pdf, 100 words max)
    - Logo Upload (file, vectors only)
11. Fills out form, uploads files
12. Clicks "Save Slot 1"
13. Repeats for Slots 2, 3, 4

### **Admin Reviews**
14. Admin goes to `/admin/submissions`
15. Filters by Montana + Single Listing
16. Sees 4 submissions with dynamic field data
17. Exports to CSV with all custom fields

---

## 🎨 Field Types Available

When creating/editing templates, you can use:

- **text** - Single line text input
- **textarea** - Multi-line text area
- **email** - Email input with validation
- **phone** - Phone number input
- **url** - URL input with validation
- **image** - Image file upload (.jpg, .png, etc.)
- **file** - Any file upload (documents, vectors, etc.)

### **Field Options**
- `required` - Make field mandatory
- `placeholder` - Hint text in input
- `helpText` - Instructions below field
- `maxLength` - Character limit (text fields)
- `acceptedFormats` - File type restrictions (e.g., [".pdf", ".docx"])
- `maxFiles` - Number of files allowed (for multi-file uploads)

---

## 📋 Navigation Map

```
/admin (Main Dashboard)
├── Customer Orders → /admin/customers
├── Upload Submissions → /admin/submissions
├── Ad Management → /admin/ads
│   └── For each ad → /admin/ads/schema/{state}/{adType}
│       ├── ADD FIELD (green)
│       ├── LOAD TEMPLATE (purple)
│       ├── SAVE AS TEMPLATE (yellow)
│       ├── APPLY TO MULTIPLE (orange)
│       └── SAVE SCHEMA (blue)
├── State Management → /admin/states
└── Schema Templates → /admin/templates ⭐ NEW
    ├── View all templates
    ├── Preview fields
    └── Delete templates
```

---

## 🚀 Quick Start Commands

### **Create Templates Table** (Already Done)
```bash
node -r dotenv/config scripts/create-templates-table.js dotenv_config_path=.env.local
```

### **Seed Pre-Made Templates** (Already Done)
```bash
node -r dotenv/config scripts/seed-schema-templates.js dotenv_config_path=.env.local
```

### **View Templates**
Navigate to: `http://localhost:3000/admin/templates`

---

## ✨ What Makes This Special

1. **Completely Dynamic** - No hardcoded forms, everything driven by schema
2. **Reusable** - Create once, use everywhere
3. **Flexible** - Each ad can have its own schema or share templates
4. **Bulk Operations** - Apply one schema to 50 ads in seconds
5. **Pre-Made Templates** - Start with professional templates
6. **Edit Anywhere** - Load, modify, save templates from any schema editor
7. **Full Integration** - Works end-to-end from admin to customer upload

---

## 📝 Example: Updating All Single Listings

**Scenario**: You want all Single Listings across all states to require the same info.

1. Load "Single Listing" template in CA schema editor
2. Click "APPLY TO MULTIPLE"
3. Select: `CA#single`, `MT#single`, `IL#single`, `MO#single`, `OK#single`, `NY#single`
4. Click "Apply Schema"
5. ✅ Done! All 6 states now have identical upload requirements

When customers purchase:
- Montana customer sees: Name, Dispensary/Brand, Document (100 words), Logo
- California customer sees: Name, Dispensary/Brand, Document (100 words), Logo
- All submissions come in with the same structured data

---

## 🔧 Environment Variables

Required in `.env.local`:
```env
SCHEMA_TEMPLATES_TABLE_NAME="green-pages-schema-templates"
```

---

## 🎯 Next Steps (Optional Enhancements)

Future improvements you might want:

1. **Template Editing UI** - Direct edit in `/admin/templates` instead of loading into schema editor
2. **Template Categories** - Organize templates by type (print ads, digital, listings)
3. **Template Versioning** - Track changes to templates over time
4. **Template Usage Stats** - See which ads use which templates
5. **Import/Export** - Share templates between environments
6. **Template Preview Mode** - See how the upload form will look before applying

---

## 📚 Related Documentation

- [SCHEMA_TEMPLATES_GUIDE.md](SCHEMA_TEMPLATES_GUIDE.md) - Original template guide
- [DYNAMIC_UPLOAD_SCHEMA_SYSTEM.md](DYNAMIC_UPLOAD_SCHEMA_SYSTEM.md) - Technical docs
- [ADMIN_NAVIGATION_GUIDE.md](ADMIN_NAVIGATION_GUIDE.md) - Admin navigation

---

**System Status**: ✅ Fully Operational

Last Updated: November 16, 2025
Version: 2.2.0
