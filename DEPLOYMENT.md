# Vercel Staging Deployment Guide

This guide will help you deploy Nuclio to Vercel staging environment.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database** - You'll need a PostgreSQL database (options below)
3. **Resend Account** - For email sending (already configured)
4. **GitHub Repository** - Your code should be in a GitHub repo

## Step 1: Database Setup

You have several options for PostgreSQL:

### Option A: Vercel Postgres (Recommended for Vercel)
1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database → Postgres
3. Create a new Postgres database
4. Note the connection string (will be automatically added as `DATABASE_URL`)

### Option B: External PostgreSQL (Supabase, Neon, Railway, etc.)
1. Create a PostgreSQL database with your preferred provider
2. Get the connection string (format: `postgresql://user:password@host:port/database?sslmode=require`)
3. You'll add this as `DATABASE_URL` in Vercel environment variables

## Step 2: Environment Variables

Add these environment variables in your Vercel project settings (Project → Settings → Environment Variables):

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# NextAuth (Required for production)
NEXTAUTH_URL="https://your-staging-domain.vercel.app"  # Your Vercel deployment URL
NEXTAUTH_SECRET="generate-a-random-secret-here"  # Use: openssl rand -base64 32

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@nuclioapp.com"  # Or your verified domain email

# Optional: Cron Job Security (for batch notifications)
CRON_SECRET="another-random-secret"  # Optional but recommended

# Optional: OpenAI (if using AI features)
OPENAI_API_KEY="sk-xxxxxxxxxxxxx"  # Only if you're using AI features
```

### Staging gate (preview / branch deployments)

To require a password before anyone can access the app on **Preview** deployments (branch/PR deploys):

1. **STAGING_ACCESS_PASSWORD** – The secret password users must enter. Set this for the **Preview** environment in Vercel. The gate is enabled automatically on Preview via Vercel’s `VERCEL_ENV` (no `NEXT_PUBLIC_` var needed).

2. **Optional: NEXT_PUBLIC_STAGING_GATE_ENABLED** – Only if you need the gate on **Production** (e.g. a dedicated staging project). Set to `"true"` for that environment.

```bash
# Required for Preview: password for the staging gate (set for Preview env in Vercel)
STAGING_ACCESS_PASSWORD="your-staging-password"
```

Add `STAGING_ACCESS_PASSWORD` in Vercel → Project → Settings → Environment Variables, and select **Preview** so branch deployments use it.

### Generating Secrets

Run these commands to generate secure secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET (optional)
openssl rand -base64 32
```

## Step 3: Vercel Project Setup

1. **Connect Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the repository containing this code

2. **Configure Project**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (root)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Environment Variables**
   - Add all the environment variables from Step 2
   - Make sure to select the correct environment (Production, Preview, Development)
   - For staging, you might want to create a separate Vercel project or use Preview deployments

## Step 4: Database Migration

After your first deployment, you need to run Prisma migrations:

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Or create and run migrations
npx prisma migrate deploy
```

### Option B: Using Vercel Postgres Dashboard
1. Go to your Vercel project → Storage → Your Postgres database
2. Use the built-in SQL editor to run the schema
3. Or use Prisma Studio: `npx prisma studio` (after pulling env vars)

### Option C: Add Build Command Hook
You can add a postinstall script to automatically run migrations:

Update `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

Then in Vercel project settings, set Build Command to: `npm run vercel-build`

## Step 5: Vercel Configuration

The `vercel.json` file is already configured with:
- Cron job for batch notifications (runs every 2 hours)

Make sure your Vercel project has:
- **Node.js Version**: 18.x or 20.x (check in Project Settings → General)

## Step 6: Deploy

1. **First Deployment**
   - Push your code to GitHub
   - Vercel will automatically detect and deploy
   - Or manually trigger from Vercel dashboard

2. **After Deployment**
   - Visit your staging URL
   - Test the signup/login flow
   - Verify database connection
   - Test email sending

## Step 7: Post-Deployment Checklist

- [ ] Database schema is applied (check with Prisma Studio or database client)
- [ ] Can create a new user account
- [ ] Magic link emails are received
- [ ] Can create todos
- [ ] Calendar view works
- [ ] Settings page loads
- [ ] Logo image loads correctly
- [ ] Cron job is configured (check Vercel dashboard → Cron Jobs)

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Ensure SSL mode is set correctly (`?sslmode=require`)

### Email Not Sending
- Verify `RESEND_API_KEY` is correct
- Check `EMAIL_FROM` matches your verified domain in Resend
- Check Resend dashboard for email logs

### Build Failures
- Check Node.js version matches (18.x or 20.x)
- Verify all environment variables are set
- Check build logs in Vercel dashboard

### Cron Job Not Running
- Verify `vercel.json` is in the root directory
- Check Vercel dashboard → Cron Jobs section
- Ensure the route `/api/notifications/send-batch` exists

## Staging vs Production

For staging, consider:
- Using a separate Vercel project
- Using Preview deployments (automatic for PRs)
- Using different environment variables for staging
- Using a separate database for staging
- Enabling the **staging gate** (see “Staging gate” above) so only people with the password can open the app

### Landing at /login instead of the staging gate

If you see `/login` instead of the staging gate on a **Preview** deploy:

1. **Confirm it’s a Preview deployment** – Branch and PR deploys use Preview. Production deploys (e.g. from `main`) do not get the gate unless you set `NEXT_PUBLIC_STAGING_GATE_ENABLED=true` for Production.

2. **Set STAGING_ACCESS_PASSWORD** for the **Preview** environment in Vercel (Project → Settings → Environment Variables). The gate is enabled automatically on Preview via `VERCEL_ENV`.

3. **Redeploy** after changing env vars.

4. **Check the response header** – In DevTools → Network, open the first request (e.g. to `/`). Look for `X-Staging-Gate`:
   - `redirect` = gate is on and you were redirected to `/staging-gate` (you should see the gate).
   - `passed` = you already have the staging cookie.
   - `disabled` = gate is off (not a Preview deploy, or `VERCEL_ENV` isn’t `preview` in Edge).

## Next Steps

1. Set up custom domain (optional)
2. Configure production environment variables
3. Set up monitoring/analytics
4. Configure error tracking (Sentry, etc.)
