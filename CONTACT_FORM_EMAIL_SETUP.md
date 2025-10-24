# Contact Form Email Setup Instructions

## ✅ What Changed

1. **Contact Page:** Removed contact info boxes and business hours - now shows only the centered contact form
2. **Contact API:** Updated to send emails to `info@greenpagesusa.com` instead of saving to DynamoDB
3. **Email Service:** Using Resend for reliable email delivery

---

## 📋 Required Setup Steps

### Step 1: Install Resend Package

```bash
cd /Users/kylea/green-pages-usa
npm install resend
```

### Step 2: Get Resend API Key

1. **Sign up for Resend (FREE):**
   - Go to https://resend.com/signup
   - Sign up with your email
   - Verify your email address

2. **Create an API Key:**
   - Once logged in, go to "API Keys" in the dashboard
   - Click "Create API Key"
   - Name it "Green Pages Production"
   - Copy the API key (starts with `re_...`)

3. **Add to your `.env.local` file:**
   ```env
   # Add this line to your .env.local file
   RESEND_API_KEY=re_your_api_key_here
   ```

4. **Add to Vercel:**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add new variable:
     - Name: `RESEND_API_KEY`
     - Value: Your API key (starts with `re_...`)
   - Save and redeploy

### Step 3: Verify Your Domain (Optional but Recommended)

**With a verified domain, emails come from your domain (e.g., contact@greenpagesusa.com) instead of the default Resend domain.**

1. **In Resend Dashboard:**
   - Go to "Domains"
   - Click "Add Domain"
   - Enter: `greenpagesusa.com`
   - Follow the DNS setup instructions

2. **Update DNS Records:**
   - Add the DNS records that Resend provides
   - Wait for verification (usually 10-60 minutes)

3. **Update the API route (once verified):**
   - Edit `/app/api/contact/route.ts`
   - Change line 17 from:
     ```typescript
     from: 'Green Pages Contact Form <onboarding@resend.dev>',
     ```
   - To:
     ```typescript
     from: 'Green Pages Contact Form <contact@greenpagesusa.com>',
     ```

---

## 🧪 Testing

### Test Locally:

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000/contact

3. Fill out and submit the form

4. Check `info@greenpagesusa.com` for the email

### Test on Vercel:

1. Deploy your changes:
   ```bash
   git add .
   git commit -m "Update contact form to send emails via Resend"
   git push origin main
   ```

2. Once deployed, visit your live site's contact page

3. Submit a test message

4. Check your email inbox

---

## 📧 Email Format

When someone submits the contact form, you'll receive an email that looks like this:

**Subject:** Contact Form: [Their Subject]

**From:** Green Pages Contact Form

**Reply-To:** [Customer's Email] (so you can reply directly)

**Body:**
```
New Contact Form Submission
━━━━━━━━━━━━━━━━━━━━━━━━━

Name: John Doe
Email: john@example.com
Phone: (555) 123-4567
Subject: Interested in advertising

Message:
[Their message content here]

━━━━━━━━━━━━━━━━━━━━━━━━━
This message was sent from the Green Pages USA contact form.
You can reply directly to this email to respond to John Doe.
```

---

## 🗑️ Optional: Remove DynamoDB Contact Table

Since you're now using email instead of DynamoDB for contact submissions, you can optionally delete the `green-pages-contact-submissions` table to save costs:

**Via AWS Console:**
1. Go to DynamoDB
2. Find `green-pages-contact-submissions` table
3. Delete table (if you created it)

**Via AWS CLI:**
```bash
aws dynamodb delete-table --table-name green-pages-contact-submissions --region us-east-1
```

---

## 💰 Resend Pricing

**FREE TIER:**
- 3,000 emails per month
- Perfect for contact forms
- No credit card required

**Paid Plans:**
- Only needed if you exceed 3,000 emails/month
- Starting at $20/month for 50,000 emails

For a contact form, the free tier is more than enough!

---

## 🔧 Troubleshooting

**Email not sending:**
1. Check Vercel logs for errors
2. Verify `RESEND_API_KEY` is set in Vercel environment variables
3. Check Resend dashboard for delivery logs
4. Make sure you redeployed after adding the env variable

**Emails going to spam:**
1. Verify your domain in Resend (recommended)
2. Add SPF and DKIM records as provided by Resend
3. Send from your own domain instead of `onboarding@resend.dev`

**Form not submitting:**
1. Check browser console for errors
2. Verify API route is accessible at `/api/contact`
3. Check network tab in DevTools

---

## ✅ Summary

Your contact form now:
- ✅ Sends emails directly to `info@greenpagesusa.com`
- ✅ Includes all form data in a clean format
- ✅ Allows you to reply directly to the sender
- ✅ Works reliably with Resend's infrastructure
- ✅ No more DynamoDB storage needed for contacts
- ✅ Clean, centered form layout

---

## 🎯 Next Steps

1. Install Resend: `npm install resend`
2. Sign up at https://resend.com
3. Get your API key
4. Add to `.env.local` and Vercel
5. Test the form
6. (Optional) Verify your domain for better deliverability

Need help? Let me know!
