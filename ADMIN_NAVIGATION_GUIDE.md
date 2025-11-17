# Admin Navigation Guide

## Complete Admin Panel Structure

### Main Admin Dashboard
**URL**: `/admin`

From here you can access:

1. **Customer Orders** → `/admin/customers`
   - View all customer orders
   - Track upload status
   - Download submitted files

2. **Upload Submissions** → `/admin/submissions`
   - View all upload submissions across all ad types
   - Filter by state, ad type, status
   - Search by customer name/email/order ID
   - Export to CSV

3. **Ad Management** → `/admin/ads`
   - View/edit all ad types by state
   - Control pricing and inventory
   - **NEW**: Access upload schema editor for each ad

4. **State Management** → `/admin/states`
   - Add or remove states
   - Control which states appear on homepage

5. **Database Tools** (on admin page)
   - Initialize sample data
   - API endpoints listed at bottom

---

## Upload Schema System Navigation

### From Ad Management Page

1. Go to `/admin/ads`
2. Expand a state (e.g., "California")
3. Find the ad you want to configure (e.g., "SINGLE LISTINGS")
4. Click the **green gear icon (⚙️)** next to the edit button
5. This takes you to `/admin/ads/schema/{state}/{adType}`

**Example**: `/admin/ads/schema/CA/single`

### Schema Editor Page

**URL Pattern**: `/admin/ads/schema/{state}/{adType}`

**Actions Available**:
- ← Back to Ads (returns to `/admin/ads`)
- **ADD FIELD** - Add new upload requirement
- **SAVE SCHEMA** - Save changes to database
- Move fields up/down to reorder
- Remove fields
- Live preview of upload form

**Field Configuration**:
- Field Name (internal identifier)
- Label (shown to users)
- Field Type (text, textarea, email, phone, url, image, file)
- Required (yes/no)
- Placeholder text
- Help text
- Max length (for text fields)
- Accepted formats (for files/images)
- Max files (for multi-file uploads)

---

## Complete Navigation Map

```
/admin (Main Dashboard)
├── /admin/customers
│   └── Customer orders and upload tracking
│
├── /admin/submissions
│   ├── View all submissions
│   ├── Filter by state/type/status
│   ├── Export to CSV
│   └── /admin/submissions/{submissionId}
│       └── View individual submission details
│
├── /admin/ads
│   ├── View all ads by state
│   ├── Create/Edit/Delete ads
│   └── For each ad → /admin/ads/schema/{state}/{adType}
│       ├── Define upload requirements
│       ├── Add/remove/reorder fields
│       └── Preview upload form
│
└── /admin/states
    └── Manage which states are active
```

---

## Quick Access Links

From any admin page:

- **Main Admin Dashboard**: `/admin`
- **Ad Management**: `/admin/ads`
- **Upload Submissions**: `/admin/submissions`
- **Customer Orders**: `/admin/customers`
- **State Management**: `/admin/states`

---

## Schema Editor Access Methods

### Method 1: Via Ad Management (Recommended)
1. `/admin` → Click "Ad Management"
2. `/admin/ads` → Expand state → Click gear icon (⚙️) on ad
3. `/admin/ads/schema/{state}/{adType}` → Configure upload form

### Method 2: Direct URL
Navigate directly to: `/admin/ads/schema/{STATE}/{AD_TYPE}`

Examples:
- `/admin/ads/schema/CA/single` - California Single Listings
- `/admin/ads/schema/NY/banner` - New York Banner Ads
- `/admin/ads/schema/IL/quarter` - Illinois Quarter Page Ads

---

## Icon Reference

On the `/admin/ads` page, each ad has 3 action buttons:

| Icon | Color | Function | Tooltip |
|------|-------|----------|---------|
| ⚙️ (Settings/Gear) | Green | Edit Upload Schema | "Edit Upload Schema" |
| ✏️ (Edit/Pencil) | Blue | Edit Ad Details | "Edit Ad Details" |
| 🗑️ (Trash) | Red | Delete Ad | "Delete" |

**Always use the GREEN GEAR ICON to access the upload schema editor!**

---

## Typical Workflow

### Setting Up a New Ad Type

1. **Create the Ad**
   - Go to `/admin/ads`
   - Click "Add New Ad Type"
   - Fill in: State, Ad Type, Title, Price, Inventory, Total Slots, Description
   - Click "Create Ad"

2. **Define Upload Requirements**
   - Find the new ad in the list
   - Click the **green gear icon (⚙️)**
   - Click "ADD FIELD" for each piece of information you need
   - Configure field properties
   - Arrange fields in desired order
   - Click "SAVE SCHEMA"

3. **Test the Upload Form**
   - Make a test purchase on the site
   - Go through checkout
   - Click "Upload Now" on your order
   - Verify the form shows your custom fields

4. **View Submissions**
   - Go to `/admin/submissions`
   - Filter by your ad type
   - View uploaded data
   - Export to CSV if needed

---

## Tips

✅ **DO**:
- Use the green gear icon to edit upload schemas
- Use the blue edit icon for pricing/inventory changes
- Test your schemas with a real purchase
- Export submissions regularly as backups

❌ **DON'T**:
- Confuse the schema editor (green gear) with ad details editor (blue pencil)
- Delete ads that have active orders
- Make all fields required (frustrates users)
- Forget to save your schema after making changes

---

## Troubleshooting

**Q: I can't find the schema editor**
**A**: Look for the GREEN GEAR ICON (⚙️) on each ad in `/admin/ads`

**Q: My schema isn't saving**
**A**: Make sure you clicked "SAVE SCHEMA" (blue button at top right)

**Q: Upload form not showing my fields**
**A**: Schema only applies to NEW uploads. Existing orders use old form.

**Q: Can I change a schema after people have uploaded?**
**A**: Yes! New uploads will use the new schema. Old submissions keep their original data structure.

---

Last Updated: November 2025
