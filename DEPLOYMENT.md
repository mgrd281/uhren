# Deployment Guide - Vercel Setup

## Problem: "Fehler beim Laden des Produkts" (Database Connection Error)

The application requires PostgreSQL database connection to function. If you see this error on Vercel, it means the environment variables are not configured.

## Solution: Configure Vercel Environment Variables

### Step 1: Open Vercel Project Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find and click on your project `uhren`
3. Click on **Settings** tab

### Step 2: Add Environment Variables
Go to **Environment Variables** and add these variables:

#### Required Variables:

**DATABASE_URL** (Production Database)
```
postgresql://username:password@host:port/database_name
```
- Example: `postgresql://postgres:mypassword@db.postgres.database.azure.com:5432/uhren_prod`
- This is your main PostgreSQL connection string

**DIRECT_URL** (Direct Connection)
```
postgresql://username:password@host:port/database_name
```
- Usually the same as DATABASE_URL
- Some database providers require a separate direct URL (e.g., Azure, Supabase)
- If unsure, use the same value as DATABASE_URL

#### Optional Variables:

**SHOPIFY_STORE**
```
45dv93-bk.myshopify.com
```
- Your Shopify store domain

**SHOPIFY_ACCESS_TOKEN**
```
your_shopify_api_token_here
```
- Your Shopify API access token (Admin API)

### Step 3: Redeploy
After adding environment variables:
1. Click **Deployments** tab
2. Find the latest deployment
3. Click the three dots menu → **Redeploy**
4. Confirm redeploy

Or simply push new code to GitHub's `main` branch to trigger automatic deployment.

## Verifying Configuration

After deployment completes:
1. Open your app: https://uhren-mu.vercel.app
2. Navigate to **Produkte** (Products)
3. Click on any product card
4. If the product page loads with details, the database is connected ✅

## Database Connection String Examples

### Supabase
```
postgresql://postgres:your_password@db.supabase.co:5432/postgres
```

### PostgreSQL (Local/Standard)
```
postgresql://username:password@localhost:5432/database_name
```

### Azure Database for PostgreSQL
```
postgresql://username@servername:password@servername.postgres.database.azure.com:5432/database_name
```

### Railway
```
postgresql://user:password@containers-us-west-1.railway.app:port/database_name
```

## Troubleshooting

### Still getting database error after redeploy?
1. Check that DATABASE_URL is not empty
2. Verify the database server is accessible from Vercel
3. Ensure Prisma client is generated: `npx prisma generate`

### Connection timeout?
- Add connection pooling if available in your database provider
- Use PgBouncer for connection pooling

### For Supabase users:
- Use the "Connection Pooling" string from Supabase dashboard
- The one labeled "Transaction mode" or "Session mode"
- Replace the port (usually 6543) in standard connection string

## Local Testing

To test locally with your own `.env.local` file:
```
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"
SHOPIFY_ACCESS_TOKEN="your_token"
```

Then run:
```bash
npm run dev
```

---

**Need help?** Check your database provider's documentation for the correct connection string format.
