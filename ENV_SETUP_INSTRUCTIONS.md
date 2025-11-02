# Environment Variables Setup for Vercel

## Instructions

The file `.env.vercel` contains all the environment variables needed for deployment. This file is **NOT** committed to git for security reasons.

### How to Import to Vercel:

1. Go to your Vercel project dashboard: https://vercel.com/kyoawas-projects/green-pages-usa
2. Navigate to **Settings** → **Environment Variables**
3. Copy each variable from `.env.vercel` and add them to Vercel
4. Make sure to add them for all environments: **Production**, **Preview**, and **Development**

### Required Environment Variables:

#### AWS Configuration
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

#### DynamoDB Tables
- `DYNAMODB_TABLE_NAME`
- `CART_TABLE_NAME`
- `RESERVATIONS_TABLE_NAME`
- `ORDERS_TABLE_NAME`
- `SAVED_PROGRESS_TABLE_NAME`
- `SUBMISSIONS_TABLE_NAME`

#### S3 Storage
- `S3_BUCKET_NAME`

#### Stripe Payment
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

#### Clerk Authentication
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

#### Resend Email
- `RESEND_API_KEY`

#### Cron Jobs
- `CRON_SECRET` (generate a new random string for production!)

### Important Notes:

1. **CRON_SECRET**: Change this to a strong random string in production
2. **Vercel Auto-Variables**: These are automatically set by Vercel, don't add manually:
   - `EDGE_CONFIG`
   - `EDGE_CONFIG_ID`
   - `VERCEL_API_TOKEN`
   - `VERCEL_OIDC_TOKEN`

3. **Contact Form**: The contact form sends emails to `info@greenpagesusa.com` using Resend

## Current Deployment Status

- Repository: https://github.com/kyoawa/green-pages-usa
- Branch: `main`
- Latest changes:
  - Modern ad card design with clean horizontal layout
  - Contact form with email functionality
  - About and Contact pages
  - Tax removed from checkout
  - Full cart and payment system

## After Deployment

Test the following features:
1. User authentication (Clerk)
2. Ad browsing by state
3. Add to cart functionality
4. Checkout and payment (Stripe test mode)
5. Contact form submission
6. About page image display
