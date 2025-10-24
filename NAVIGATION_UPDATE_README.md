# Navigation & Pages Update - Setup Instructions

## ✅ Changes Completed

1. **Updated Navigation** - Home page and state pages now only show ABOUT and CONTACT
2. **Created About Page** - Displays a PDF viewer at `/about`
3. **Created Contact Page** - Features a contact form at `/contact`
4. **Created Contact API** - Handles form submissions and saves to DynamoDB

## 📋 Next Steps - What You Need to Do

### 1. Upload Your About PDF

You need to add your PDF file to the public directory:

```bash
# From your project root:
cp /path/to/your/about-document.pdf /Users/kylea/green-pages-usa/public/about.pdf
```

**Important:** The PDF file MUST be named `about.pdf` and placed in the `/public` directory.

If you want to use a different filename, update line 32 in `/app/about/page.tsx`:
```typescript
// Change this line:
src="/about.pdf"
// To your filename:
src="/your-custom-name.pdf"
```

### 2. Create DynamoDB Table for Contact Submissions

The contact form saves to a DynamoDB table. You need to create it:

**Table Name:** `green-pages-contact-submissions`
**Partition Key:** `id` (String)

**AWS CLI Command:**
```bash
aws dynamodb create-table \
    --table-name green-pages-contact-submissions \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

**Or via AWS Console:**
1. Go to DynamoDB → Tables → Create table
2. Table name: `green-pages-contact-submissions`
3. Partition key: `id` (String)
4. Use default settings
5. Click "Create table"

### 3. Update Contact Information (Optional)

Edit `/app/contact/page.tsx` to update your actual contact information:

- **Email:** Line 105 - Change `info@greenpagesusa.com`
- **Phone:** Line 114 - Change `(800) 555-1234`
- **Address:** Lines 123-127 - Update your actual address
- **Business Hours:** Lines 136-140 - Update your hours

### 4. Test the Changes

1. **Start your development server:**
   ```bash
   cd /Users/kylea/green-pages-usa
   npm run dev
   ```

2. **Test the pages:**
   - Visit http://localhost:3000 - Check navigation shows only ABOUT and CONTACT
   - Visit http://localhost:3000/about - Verify PDF displays
   - Visit http://localhost:3000/contact - Test the contact form
   - Test from any state page to ensure navigation is consistent

3. **Test contact form submission:**
   - Fill out the form and submit
   - Check your DynamoDB table for the new entry
   - Verify no console errors

### 5. Deploy to Vercel

Once everything works locally:

```bash
git add .
git commit -m "Add About and Contact pages, update navigation"
git push origin main
```

Vercel will automatically deploy your changes.

## 📁 Files Created/Modified

### Created:
- `/app/about/page.tsx` - About page with PDF viewer
- `/app/contact/page.tsx` - Contact page with form
- `/app/api/contact/route.ts` - API endpoint for form submissions

### Modified:
- `/app/page.tsx` - Updated navigation (removed DIGITAL and PRINT)
- `/app/[state]/page.tsx` - Updated navigation to match

## 🎨 Design Notes

- Both pages maintain your dark theme (black background, green accents)
- Navigation is consistent across all pages
- Contact form includes validation and loading states
- PDF viewer is responsive and includes download fallback
- Forms save to DynamoDB using existing AWS credentials

## ⚠️ Important Reminders

1. **PDF File:** Must be uploaded to `/public/about.pdf`
2. **DynamoDB Table:** Must create `green-pages-contact-submissions` table
3. **AWS Credentials:** Contact form uses existing credentials from `.env.local`
4. **Contact Info:** Remember to update with your real contact details

## 🔧 Troubleshooting

**PDF not showing:**
- Verify file exists at `/public/about.pdf`
- Check browser console for errors
- Try the download link below the viewer

**Contact form not working:**
- Verify DynamoDB table exists
- Check AWS credentials in `.env.local`
- View Vercel function logs for errors

**Navigation links broken:**
- Ensure you're using `/about` and `/contact` (with leading slash)
- Clear browser cache and restart dev server

---

Need help? Let me know what issues you encounter!
