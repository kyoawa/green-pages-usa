# Green Pages - Dispensary Advertising Platform

A modern web platform for dispensary advertising across multiple states, built with Next.js and AWS.

##  Features

- **State-based Advertising**: Separate ad inventory and pricing for each state
- **Stripe Payments**: Secure payment processing with real-time inventory updates
- **Admin Dashboard**: Password-protected admin interface for managing ads and submissions
- **File Uploads**: Customer submission system with S3 storage
- **Dynamic Inventory**: Real-time inventory tracking and management
- **Responsive Design**: Mobile-friendly interface with dark theme

##  Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Node.js
- **Database**: AWS DynamoDB
- **Payments**: Stripe
- **Storage**: AWS S3
- **Deployment**: Vercel
- **Authentication**: Session-based admin auth

##  Quick Start

### Prerequisites

- Node.js 18+ 
- AWS Account
- Stripe Account
- Vercel Account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd green-pages
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file:
   ```env
   # Stripe
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

   # AWS
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   DYNAMODB_TABLE_NAME=green-pages-ads
   S3_BUCKET_NAME=green-pages-uploads
   ```

4. **Set up AWS Resources**
   
   Create DynamoDB table:
   - Table name: `green-pages-ads`
   - Partition key: `id` (String)
   
   Create S3 bucket:
   - Bucket name: `green-pages-uploads`
   - Enable public read access for uploads

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the site.

## 📁 Project Structure

```
green-pages/
├── app/                    # Next.js 14 app directory
│   ├── [state]/           # Dynamic state pages (e.g., /california)
│   ├── admin/             # Admin dashboard and management
│   ├── api/               # API routes
│   │   ├── admin/         # Admin API endpoints
│   │   ├── inventory/     # Inventory management
│   │   ├── create-payment-intent/
│   │   ├── confirm-payment/
│   │   └── update-inventory/
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── lib/                   # Utility functions and configs
├── public/               # Static assets
└── README.md
```

## 🔧 Admin Access

1. Navigate to `/admin`
2. Default password: `greenpages2024` (change in `app/admin/page.tsx`)
3. Admin features:
   - **Ad Management**: Create, edit, delete ad types per state
   - **Submissions**: View customer uploads and submissions  
   - **State Management**: Control which states are active
   - **Database Tools**: Initialize sample data

## 💳 Payment Flow

1. Customer selects state and ad type
2. Stripe payment intent created with metadata
3. Customer completes payment via Stripe Elements
4. Backend confirms payment and updates inventory
5. Customer proceeds to file upload requirements

## 🗄️ Database Schema

### green-pages-ads table
```
id (String, PK)          # UUID for admin-created ads
state (String)           # 2-letter state code (e.g., "CA")  
adType (String)          # Ad type (e.g., "single", "quarter")
title (String)           # Display name
price (Number)           # Price in dollars
inventory (Number)       # Available slots
totalSlots (Number)      # Total capacity
description (String)     # Ad description
active (Boolean)         # Whether ad is available
createdAt (String)       # ISO timestamp
updatedAt (String)       # ISO timestamp
```

##  Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure these are set in your deployment environment:
- All Stripe keys (use live keys for production)
- AWS credentials and region
- DynamoDB table name
- S3 bucket name

##  Common Tasks

### Add a New State
1. Go to `/admin/states`
2. Add the state
3. Create ad types at `/admin/ads`

### Update Ad Pricing
1. Go to `/admin/ads`
2. Find the ad by state
3. Edit price and save

### View Payment Logs
Check Vercel function logs or Stripe dashboard for payment debugging.

### Reset Inventory
Use the "Initialize Sample Data" button in admin dashboard.

##  Troubleshooting

**Payment failing with inventory error:**
- Check Vercel logs for detailed error messages
- Ensure ad exists for the state/adType combination
- Verify DynamoDB permissions

**Admin page not loading:**
- Check password in `app/admin/page.tsx`
- Clear browser session storage

**File uploads failing:**
- Verify S3 bucket permissions
- Check AWS credentials

##  License

This project is private and proprietary. 

##  Support

For technical support or questions, check the admin dashboard logs or contact the development team.

---

**Last Updated**: September 2025  
**Version**: 1.0.0
