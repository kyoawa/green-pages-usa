# Green Pages USA - Admin Standard Operating Procedures (SOP)

**Version**: 2.2.0
**Last Updated**: November 16, 2025
**Platform**: Green Pages Dispensary Advertising Directory

---

## Table of Contents

1. [Admin Access & Login](#1-admin-access--login)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Managing Customer Orders](#3-managing-customer-orders)
4. [Managing Upload Submissions](#4-managing-upload-submissions)
5. [Managing Ad Inventory](#5-managing-ad-inventory)
6. [Upload Schema System](#6-upload-schema-system)
7. [Schema Templates](#7-schema-templates)
8. [State Management](#8-state-management)
9. [Data Export & Reporting](#9-data-export--reporting)
10. [Common Workflows](#10-common-workflows)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Admin Access & Login

### **Accessing the Admin Panel**

1. Navigate to: `https://yourdomain.com/admin`
2. Sign in with your admin Clerk account
3. You will be redirected to the admin dashboard

### **Admin Dashboard URL**
- Main Dashboard: `/admin`
- Direct access requires authentication

### **Logout**
- Click the red "Logout" button in the top-right corner of any admin page

---

## 2. Dashboard Overview

### **Main Dashboard** (`/admin`)

The dashboard provides quick access to all admin functions:

#### **Quick Stats**
- **Active States**: Current number of states with inventory
- **Total Ad Types**: Total ads across all states
- **Platform Status**: System health indicator

#### **Admin Sections**

| Section | Purpose | URL |
|---------|---------|-----|
| **Customer Orders** | View all customer purchases and payment details | `/admin/customers` |
| **Upload Submissions** | Review uploaded ad content, export data | `/admin/submissions` |
| **Ad Management** | Create/edit/delete ad types, control pricing & inventory | `/admin/ads` |
| **State Management** | Add/remove states from the platform | `/admin/states` |
| **Schema Templates** | Manage reusable upload form templates | `/admin/templates` |
| **Database Tools** | Initialize sample data for testing | `/admin` (bottom section) |

---

## 3. Managing Customer Orders

### **Viewing Customer Orders** (`/admin/customers`)

**Purpose**: Track customer purchases, payment status, and upload progress.

#### **What You Can See**
- Customer name, email, phone
- Order ID and payment intent ID
- Items purchased (state, ad type, quantity)
- Total amount paid
- Upload completion status per item

#### **Order Details**
Each order shows:
- **Order Date**: When the purchase was made
- **Items Ordered**: List of ad types purchased
- **Upload Status**: Whether customer has uploaded required files
- **Total Paid**: Amount charged via Stripe

#### **Actions Available**
- View order details
- See which items need uploads
- Track submission progress

---

## 4. Managing Upload Submissions

### **Submissions Dashboard** (`/admin/submissions`)

**Purpose**: Review all customer-uploaded content, filter by criteria, export data.

#### **Viewing Submissions**

1. Navigate to `/admin/submissions`
2. You'll see all submissions across all ads and states

#### **Filtering Submissions**

Use the filter controls to narrow results:

- **By State**: Select specific state (CA, MT, IL, etc.)
- **By Ad Type**: Filter by ad category (single, banner, full, etc.)
- **By Status**: Filter by approval status (pending, approved, published)
- **Search**: Search by customer name, email, or order ID

#### **Submission Details**

Each submission shows:
- **Customer Info**: Name, email, phone
- **Order Details**: Order ID, ad type, state
- **Slot Number**: Which slot this submission belongs to (for multi-quantity orders)
- **Upload Fields**: All data submitted by customer (dynamic based on schema)
- **File URLs**: S3 links to uploaded files
- **Timestamps**: When submitted and last edited
- **Status**: Current approval status

#### **Exporting Data**

**To export submissions to CSV:**

1. Apply any filters you want (state, ad type, etc.)
2. Click **"Export to CSV"** button
3. CSV file downloads with all visible submissions
4. Columns include all customer data, order info, and upload fields

**CSV Includes**:
- Customer contact information
- Order and item details
- All dynamic field data
- File URLs for downloads
- Submission timestamps
- Status information

---

## 5. Managing Ad Inventory

### **Ad Management** (`/admin/ads`)

**Purpose**: Create, edit, and delete ad types for each state. Control pricing and availability.

#### **Viewing Ads**

1. Navigate to `/admin/ads`
2. Ads are organized by state
3. Click state name to expand/collapse that state's ads

#### **Ad Information Displayed**

For each ad:
- **Title**: Display name (e.g., "SINGLE LISTINGS")
- **Type**: Internal identifier (e.g., "single")
- **Price**: Cost per unit ($)
- **Inventory**: Available slots remaining
- **Total Slots**: Maximum capacity
- **Description**: Ad description (if set)

#### **Creating a New Ad**

1. Click **"Add New Ad Type"** button
2. Fill in the form:
   - **State**: Select state (CA, MT, IL, MO, OK, NY)
   - **Ad Type**: Internal identifier (lowercase, no spaces)
   - **Title**: Display name (e.g., "PREMIUM LISTINGS")
   - **Price**: Price in dollars (e.g., 500)
   - **Inventory**: Currently available slots
   - **Total Slots**: Maximum capacity
   - **Description**: Optional description
3. Click **"Create Ad"**

#### **Editing an Ad**

1. Find the ad in the list
2. Click the **blue edit icon (✏️)** "Edit Ad Details"
3. Modify:
   - Title
   - Price
   - Inventory (available slots)
   - Total Slots
   - Description
4. Click **"Save Changes"**

#### **Deleting an Ad**

1. Find the ad in the list
2. Click the **red trash icon (🗑️)**
3. Confirm deletion
4. ⚠️ **Warning**: This cannot be undone

#### **Action Icons Reference**

| Icon | Color | Function | Purpose |
|------|-------|----------|---------|
| ⚙️ Settings | Green | Edit Upload Schema | Configure what customers upload |
| ✏️ Pencil | Blue | Edit Ad Details | Change price, inventory, title |
| 🗑️ Trash | Red | Delete Ad | Remove ad type permanently |

---

## 6. Upload Schema System

### **What is a Schema?**

A schema defines what information and files customers must upload when they purchase an ad. Each ad type can have its own custom upload form.

### **Accessing the Schema Editor**

**From Ad Management:**
1. Go to `/admin/ads`
2. Find the ad you want to configure
3. Click the **green gear icon (⚙️)** "Edit Upload Schema"
4. You'll be taken to `/admin/ads/schema/{STATE}/{ADTYPE}`

**Example**: Clicking the gear for "CA - SINGLE LISTINGS" takes you to `/admin/ads/schema/CA/single`

### **Schema Editor Overview**

The schema editor has 5 main buttons:

| Button | Color | Purpose |
|--------|-------|---------|
| **LOAD TEMPLATE** | Purple | Load a saved template |
| **SAVE AS TEMPLATE** | Yellow | Save current schema as reusable template |
| **APPLY TO MULTIPLE** | Orange | Apply schema to multiple ads at once |
| **ADD FIELD** | Green | Add a new upload field |
| **SAVE SCHEMA** | Blue | Save changes to this ad's schema |

### **Adding Fields to a Schema**

1. Click **"ADD FIELD"** (green button)
2. New field appears at the bottom
3. Configure the field:
   - **Field Name**: Internal identifier (e.g., "brandName")
   - **Label**: What the customer sees (e.g., "Brand Name")
   - **Field Type**: Select from dropdown
   - **Required**: Toggle on/off
   - **Placeholder**: Hint text (optional)
   - **Help Text**: Instructions for customer (optional)
   - **Additional Options**: Based on field type

#### **Field Types Available**

| Type | Use For | Special Options |
|------|---------|----------------|
| **text** | Single line text (names, addresses) | Max length |
| **textarea** | Multi-line text (descriptions) | Max length |
| **email** | Email addresses | Auto-validated |
| **phone** | Phone numbers | Auto-formatted |
| **url** | Website addresses | Auto-validated |
| **image** | Image files (photos, logos) | Accepted formats, max files |
| **file** | Any file (documents, PDFs, vectors) | Accepted formats, max files |

#### **Field Configuration Options**

**For Text Fields:**
- `maxLength`: Character limit (e.g., 100 for name, 500 for description)

**For File/Image Fields:**
- `acceptedFormats`: File types allowed (e.g., [".jpg", ".png", ".pdf"])
- `maxFiles`: Number of files (1 = single, >1 = multiple upload)

**Examples:**
- Logo: `.eps, .ai, .svg, .pdf` (vectors only)
- Document: `.doc, .docx, .txt, .pdf` (word documents)
- Photo: `.jpg, .png, .jpeg` (images)

### **Organizing Fields**

- **Move Up**: Click ↑ to move field higher in form
- **Move Down**: Click ↓ to move field lower in form
- **Remove**: Click "Remove Field" to delete

**Best Practice**: Arrange fields in logical order (e.g., name first, files last)

### **Previewing the Schema**

The schema editor shows a live preview of what customers will see when uploading.

### **Saving a Schema**

1. After adding/editing fields
2. Click **"SAVE SCHEMA"** (blue button)
3. Schema is saved to this ad's database record
4. Customers purchasing this ad will see your custom form

---

## 7. Schema Templates

### **What are Templates?**

Templates are reusable schemas you can apply to multiple ads. Instead of creating the same upload form for every state, create it once and reuse it.

### **Pre-Made Templates Available**

Six professional templates are pre-installed:

1. **Full Page Ad**
   - Name
   - Dispensary/Brand
   - Ad File Upload (.pdf, .ai, .eps, .psd, .jpg, .png)

2. **1/2 Page Ad**
   - Name
   - Dispensary/Brand
   - Document Upload (250 words max, .doc, .docx, .txt, .pdf)
   - Logo Upload (vectors: .eps, .ai, .svg, .pdf)

3. **1/4 Page Ad**
   - Name
   - Dispensary/Brand
   - Document Upload (140 words max, .doc, .docx, .txt, .pdf)
   - Logo Upload (vectors: .eps, .ai, .svg, .pdf)

4. **Belly Band**
   - Name
   - Dispensary/Brand
   - Logo Upload (vectors: .eps, .ai, .svg, .pdf)

5. **Back Cover**
   - Name
   - Dispensary/Brand
   - Ad File Upload (.pdf, .ai, .eps, .psd, .jpg, .png)

6. **Single Listing**
   - Name
   - Dispensary/Brand
   - Document Upload (100 words max, .doc, .docx, .txt, .pdf)
   - Logo Upload (vectors: .eps, .ai, .svg, .pdf)

### **Loading a Template**

**To apply a template to an ad:**

1. Go to the schema editor for any ad
2. Click **"LOAD TEMPLATE"** (purple button)
3. Modal appears with all available templates
4. Click **"Load"** next to the template you want
5. Confirm you want to replace current schema
6. Template fields populate the editor
7. Click **"SAVE SCHEMA"** to apply

### **Creating a New Template**

1. Design your schema in any schema editor
2. Add and configure all fields
3. Click **"SAVE AS TEMPLATE"** (yellow button)
4. Enter template details:
   - **Name**: Template name (e.g., "Premium Business Listing")
   - **Description**: What this template is for
5. Click "Save Template"
6. Template is now available everywhere

### **Editing a Template**

**Templates can be edited in two ways:**

**Method 1: Through Schema Editor**
1. Load the template into any schema editor
2. Make your changes (add/remove/modify fields)
3. Click **"SAVE AS TEMPLATE"**
4. Use the **exact same name** to update it
5. Confirm overwrite

**Method 2: Create New Version**
1. Load the template
2. Make changes
3. Save with a new name (e.g., "Premium Business Listing v2")

### **Viewing All Templates**

1. Navigate to `/admin/templates`
2. See all saved templates
3. View details:
   - Template name and description
   - Number of fields
   - Created and updated dates

**Actions Available:**
- **Preview**: Click eye icon to see all fields
- **Delete**: Click trash icon to remove template

### **Applying Templates to Multiple Ads**

**Scenario**: You want all "single" listings across all states to have the same upload requirements.

1. Go to any schema editor (e.g., CA single)
2. Load or design your perfect schema
3. Click **"APPLY TO MULTIPLE"** (orange button)
4. You're taken to `/admin/ads/bulk-apply`
5. Select target ads:
   - Check individual ads
   - Or click a state header to select all in that state
6. Use "Select All" / "Deselect All" for quick selection
7. Review schema preview at top
8. Click **"Apply to X Selected Ads"**
9. See results showing success/failure for each

**Example Use Cases:**
- Apply "Single Listing" template to all 6 states at once
- Update all banner ads to require new fields
- Standardize half-page ads across states

---

## 8. State Management

### **State Management** (`/admin/states`)

**Purpose**: Control which states appear on the platform and homepage.

#### **Viewing States**

1. Navigate to `/admin/states`
2. See list of all states
3. Each shows:
   - State code (e.g., CA)
   - State name (e.g., California)
   - Active/Inactive status

#### **Adding a New State**

1. Click **"Add State"** button
2. Enter:
   - **State Code**: 2-letter abbreviation (e.g., "TX")
   - **State Name**: Full name (e.g., "Texas")
3. Click "Add State"
4. State appears in dropdown menus

#### **Removing a State**

1. Find state in list
2. Click "Remove" or trash icon
3. Confirm deletion
4. ⚠️ **Note**: Only remove if no active inventory exists

---

## 9. Data Export & Reporting

### **Exporting Submission Data**

**Location**: `/admin/submissions`

#### **Basic Export**

1. Navigate to submissions page
2. Click **"Export to CSV"** button
3. Downloads all visible submissions

#### **Filtered Export**

1. Apply filters:
   - Select state (e.g., "Montana")
   - Select ad type (e.g., "single")
   - Select status (e.g., "pending")
2. Click **"Export to CSV"**
3. Downloads only filtered results

#### **CSV File Contents**

The exported CSV includes:
- Submission ID
- Customer name, email, phone
- Order ID
- State and ad type
- Slot number
- **All dynamic fields** (based on schema)
- File URLs (S3 links)
- Submission timestamp
- Last edited timestamp
- Status

#### **Downloading Uploaded Files**

**From Submissions Page:**
1. Find submission
2. Look for file URL fields
3. Click the S3 URL to download file directly

**From CSV Export:**
1. Open CSV in Excel/Google Sheets
2. File URL columns contain direct S3 links
3. Click or copy URL to download

---

## 10. Common Workflows

### **Workflow 1: Setting Up a New Ad Type**

**Scenario**: You want to add "Digital Banner Ads" to California.

1. **Create the Ad**
   - Go to `/admin/ads`
   - Click "Add New Ad Type"
   - Fill in:
     - State: CA
     - Ad Type: `banner`
     - Title: "DIGITAL BANNERS"
     - Price: 500
     - Inventory: 20
     - Total Slots: 30
   - Click "Create Ad"

2. **Configure Upload Schema**
   - Find "CA - DIGITAL BANNERS" in list
   - Click green gear icon (⚙️)
   - Option A: Click "LOAD TEMPLATE" → Select "Belly Band" or create custom
   - Option B: Click "ADD FIELD" to build from scratch
   - Add fields:
     - Name (text, required)
     - Dispensary/Brand (text, required)
     - Banner Image (image, required, .jpg/.png, 728x90px note in help text)
     - Click URL (url, required)
   - Click "SAVE SCHEMA"

3. **Test the Flow**
   - Make a test purchase (use Stripe test card)
   - Go through checkout
   - Upload files using the form
   - Verify submission appears in `/admin/submissions`

### **Workflow 2: Standardizing Upload Forms Across States**

**Scenario**: All "single listings" should require the same information.

1. **Design the Perfect Schema**
   - Go to `/admin/ads`
   - Click gear icon for "CA - SINGLE LISTINGS"
   - Click "LOAD TEMPLATE" → "Single Listing"
   - OR create custom schema
   - Verify all fields are correct

2. **Save as Template** (optional but recommended)
   - Click "SAVE AS TEMPLATE"
   - Name: "Standard Single Listing"
   - Description: "100-word document + vector logo"
   - Click "Save Template"

3. **Apply to All States**
   - Click "APPLY TO MULTIPLE" (orange button)
   - Select all single listing ads:
     - MT#single
     - IL#single
     - MO#single
     - OK#single
     - NY#single
   - Click "Apply Schema"
   - Verify success message

4. **Verify**
   - Check 2-3 different states
   - Click gear icon for each
   - Confirm they all have identical schemas

### **Workflow 3: Processing Customer Submissions**

**Scenario**: Customer uploaded files for their ad, you need to review and approve.

1. **View Submissions**
   - Go to `/admin/submissions`
   - Filter by state/ad type if needed
   - Find the customer's submission

2. **Review Content**
   - Check all uploaded data
   - Click file URLs to download and review files
   - Verify all required fields are complete

3. **Download Files**
   - Click S3 URLs to download images, PDFs, documents
   - Save to your local system for design work

4. **Update Status** (if status workflow exists)
   - Change from "pending" to "approved" or "published"
   - Or keep current workflow

5. **Export for Production**
   - Filter to show only approved submissions
   - Export to CSV
   - Use CSV data for magazine production

### **Workflow 4: Monthly Inventory Reset**

**Scenario**: New magazine issue, reset all inventory.

1. **Export Current Data**
   - Go to `/admin/submissions`
   - Export all submissions for record-keeping

2. **Update Inventory**
   - Go to `/admin/ads`
   - For each state, expand
   - For each ad, click blue edit icon
   - Update **Inventory** to match **Total Slots**
   - Click "Save"

3. **Archive Previous Issue**
   - Keep CSV exports organized by issue/date
   - Store in project management system

### **Workflow 5: Bulk Template Update**

**Scenario**: You need to add a new required field to all single listings.

1. **Update Template**
   - Load "Single Listing" template in any schema editor
   - Add new field (e.g., "Business Hours")
   - Click "SAVE AS TEMPLATE" with same name "Single Listing"
   - Confirm overwrite

2. **Apply to All Ads Using Template**
   - Click "LOAD TEMPLATE" → "Single Listing"
   - Click "APPLY TO MULTIPLE"
   - Select all single listing ads (CA, MT, IL, MO, OK, NY)
   - Click "Apply Schema"

3. **Verify**
   - Check a few states to confirm new field appears

---

## 11. Troubleshooting

### **Issue: Template not appearing in load list**

**Solution:**
1. Check `/api/admin/schema-templates` endpoint (visit URL directly)
2. Verify it returns templates
3. If not, check DynamoDB table exists: `green-pages-schema-templates`
4. Re-run seeding script if needed: `node -r dotenv/config scripts/seed-schema-templates.js dotenv_config_path=.env.local`

### **Issue: Schema isn't saving**

**Symptoms**: Clicking "SAVE SCHEMA" shows error or no change.

**Solutions:**
1. Check browser console for errors
2. Verify you're on the schema editor page (`/admin/ads/schema/{state}/{adtype}`)
3. Ensure at least one field is added
4. Try refreshing the page and re-adding fields
5. Check API endpoint `/api/admin/ads/{state}#{adtype}` accepts PATCH requests

### **Issue: Upload form not showing custom fields**

**Symptoms**: Customer sees old/wrong form after purchase.

**Solutions:**
1. Verify schema was saved:
   - Go to schema editor
   - Check if fields appear
   - Save again if needed

2. Check ad has schema in database:
   - Visit `/api/admin/ads/{state}#{adtype}`
   - Look for `uploadSchema` field in response

3. Clear browser cache or try incognito mode

4. Schema only applies to NEW uploads after it's saved

### **Issue: Bulk apply failed for some ads**

**Symptoms**: Some ads don't get the schema after bulk apply.

**Solutions:**
1. Check bulk apply results - shows which failed and why
2. Common reasons:
   - Ad doesn't exist
   - Wrong ID format
   - Permission issue
3. Manually apply schema to failed ads
4. Verify ad IDs are correct format: `STATE#adType`

### **Issue: Can't find schema editor**

**Solution:**
1. Go to `/admin/ads`
2. Find the ad in the list
3. Look for **green gear icon (⚙️)** (NOT the blue pencil)
4. Click the gear icon to access schema editor

### **Issue: CSV export has no data**

**Solutions:**
1. Check if filters are too restrictive
2. Clear all filters and try again
3. Verify submissions exist in database
4. Check `/api/admin/submissions` endpoint directly

### **Issue: Customer uploaded wrong files**

**Solutions:**
1. Customer can re-upload:
   - They go to `/account/orders`
   - Click "Upload Now" on the item
   - Select the slot
   - Submit new files (overwrites previous)

2. Or admin can manually request files via email

### **Issue: Inventory not decreasing after purchase**

**Solutions:**
1. Check `/api/update-inventory` endpoint
2. Verify Stripe webhook is firing
3. Check order confirmation flow
4. Manually adjust inventory:
   - Go to `/admin/ads`
   - Click blue edit icon
   - Update inventory number
   - Save

---

## Best Practices

### **Schema Design**

✅ **DO:**
- Keep forms simple and clear
- Use descriptive labels (not just "File 1", "File 2")
- Add helpful placeholder text
- Include format requirements in help text
- Test the form yourself before deploying

❌ **DON'T:**
- Make all fields required (frustrates customers)
- Use technical jargon in labels
- Create overly long forms
- Forget to specify accepted file formats
- Delete schemas that have active orders

### **Template Management**

✅ **DO:**
- Create templates for common ad types
- Use descriptive template names
- Add helpful descriptions
- Test templates before bulk applying
- Keep templates organized

❌ **DON'T:**
- Delete templates that are in use
- Create duplicate templates
- Use vague names like "Template 1"

### **Customer Support**

✅ **DO:**
- Export data regularly as backup
- Monitor submissions for completeness
- Respond to upload issues quickly
- Keep CSV archives organized
- Communicate schema changes to customers

❌ **DON'T:**
- Change schemas mid-issue without notifying customers
- Delete submissions without backup
- Ignore incomplete uploads

### **Data Management**

✅ **DO:**
- Export submissions before each magazine issue
- Keep organized CSV archives
- Download important files from S3
- Verify all data before production
- Track which issue each submission belongs to

❌ **DON'T:**
- Rely solely on database (always export)
- Delete submissions immediately
- Lose track of which data is for which issue

---

## Quick Reference

### **Key URLs**

| Page | URL | Purpose |
|------|-----|---------|
| Admin Dashboard | `/admin` | Main control panel |
| Customer Orders | `/admin/customers` | View purchases |
| Submissions | `/admin/submissions` | Review uploads |
| Ad Management | `/admin/ads` | Manage inventory |
| Schema Editor | `/admin/ads/schema/{state}/{type}` | Configure upload forms |
| Templates | `/admin/templates` | Manage templates |
| States | `/admin/states` | Manage states |
| Bulk Apply | `/admin/ads/bulk-apply` | Apply to multiple ads |

### **Button Colors**

| Color | Purpose |
|-------|---------|
| 🟢 Green | Add/Create actions |
| 🟣 Purple | Load templates |
| 🟡 Yellow | Save as template |
| 🟠 Orange | Bulk apply |
| 🔵 Blue | Save changes |
| 🔴 Red | Delete |

### **Field Types**

| Type | Best For |
|------|----------|
| text | Names, addresses, short answers |
| textarea | Descriptions, long text |
| email | Email addresses |
| phone | Phone numbers |
| url | Website links |
| image | Photos, logos, graphics |
| file | Documents, PDFs, vectors |

### **File Format Guide**

| File Type | Extensions |
|-----------|-----------|
| Vectors | `.eps`, `.ai`, `.svg`, `.pdf` |
| Images | `.jpg`, `.jpeg`, `.png`, `.tiff` |
| Documents | `.doc`, `.docx`, `.txt`, `.pdf` |
| Design Files | `.psd`, `.ai`, `.eps` |

---

## Contact & Support

**Technical Issues:**
- Check console errors (F12 in browser)
- Review this SOP
- Contact development team

**Platform Questions:**
- Refer to documentation files in project root
- Review related guides (see below)

**Feature Requests:**
- Document needed features
- Contact development team

---

## Related Documentation

- **[TEMPLATE_SYSTEM_COMPLETE.md](TEMPLATE_SYSTEM_COMPLETE.md)** - Complete template system guide
- **[SCHEMA_TEMPLATES_GUIDE.md](SCHEMA_TEMPLATES_GUIDE.md)** - Original template documentation
- **[DYNAMIC_UPLOAD_SCHEMA_SYSTEM.md](DYNAMIC_UPLOAD_SCHEMA_SYSTEM.md)** - Technical implementation details
- **[ADMIN_NAVIGATION_GUIDE.md](ADMIN_NAVIGATION_GUIDE.md)** - Navigation reference

---

## Appendix: Schema Examples

### **Example 1: Basic Business Listing**

**Use For**: Simple directory entries

**Fields:**
1. Business Name (text, required)
2. Address (text, required)
3. Phone (phone, required)
4. Website (url, optional)
5. Logo (image, required, .jpg/.png)

### **Example 2: Premium Full Profile**

**Use For**: Featured ads with complete information

**Fields:**
1. Brand Name (text, required)
2. Description (textarea, required, max 500 chars)
3. Address (text, required)
4. Phone (phone, required)
5. Email (email, required)
6. Website (url, required)
7. Instagram (text, optional)
8. Facebook (url, optional)
9. Logo (image, required, vectors)
10. Cover Photo (image, required)
11. Gallery Images (image, optional, max 5 files)
12. Menu PDF (file, optional, .pdf only)

### **Example 3: Magazine Ad Submission**

**Use For**: Print advertisements

**Fields:**
1. Business Name (text, required)
2. Contact Person (text, required)
3. Email (email, required)
4. Ad Design File (file, required, .pdf/.ai/.eps/.psd)
5. Alternative File Format (file, optional, backup format)
6. Special Instructions (textarea, optional)

---

**End of Admin SOP**

*For additional help, refer to the related documentation or contact your development team.*
