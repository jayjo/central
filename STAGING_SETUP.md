# Staging Setup Guide - staging.nuclioapp.com

## Step-by-Step Setup Instructions

### Step 1: Create Vercel Postgres Database

1. Go to your Vercel dashboard
2. Navigate to your project (or create a new one)
3. Go to **Storage** tab → Click **Create Database** → Select **Postgres**
4. Name it something like `nuclio-staging-db`
5. Choose a region closest to you
6. Click **Create**
7. **Important**: Vercel will automatically add `POSTGRES_URL` and `POSTGRES_PRISMA_URL` environment variables
8. Note: We'll use `POSTGRES_PRISMA_URL` as our `DATABASE_URL`

### Step 2: Set Up Custom Domain (staging.nuclioapp.com)

1. In your Vercel project, go to **Settings** → **Domains**
2. Add `staging.nuclioapp.com`
3. Follow Vercel's DNS instructions:
   - Add a CNAME record pointing to Vercel's domain
   - Or add the A record if provided
4. Wait for DNS propagation (usually a few minutes)

### Step 3: Get Your Resend API Key

1. Go to [resend.com](https://resend.com) and log in
2. Navigate to **API Keys** in the dashboard
3. Click **Create API Key**
4. Name it something like "Nuclio Staging"
5. Copy the API key (starts with `re_`)
6. **Important**: Make sure `nuclioapp.com` is verified in Resend
   - Go to **Domains** in Resend
   - Verify `nuclioapp.com` is added and verified

### Step 4: Generate Required Secrets

Run these commands in your terminal to generate secure secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET (optional but recommended)
openssl rand -base64 32
```

Copy both outputs - you'll need them for Step 5.

### Step 5: Configure Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

#### Required Variables:

```bash
# Database (Vercel Postgres automatically adds POSTGRES_PRISMA_URL)
# Use that value for DATABASE_URL
DATABASE_URL=<value-from-POSTGRES_PRISMA_URL>

# NextAuth
NEXTAUTH_URL=https://staging.nuclioapp.com
NEXTAUTH_SECRET=<paste-generated-secret-from-step-4>

# Email (Resend)
RESEND_API_KEY=re_<your-resend-api-key>
EMAIL_FROM=noreply@nuclioapp.com

# Optional: Cron Job Security
CRON_SECRET=<paste-generated-secret-from-step-4>
```

**Important Notes:**
- For `DATABASE_URL`: Use the value from `POSTGRES_PRISMA_URL` that Vercel created
- Make sure to select the correct environment (Production, Preview, or Development)
- For staging, you might want to add these to **Production** environment

### Step 6: Update Vercel Build Settings

1. Go to **Settings** → **General**
2. Under **Build & Development Settings**:
   - **Build Command**: `npm run vercel-build` (or leave default and it will use package.json)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
   - **Node.js Version**: 18.x or 20.x

### Step 7: Deploy

1. Push your code to GitHub (if not already)
2. Connect the repository to Vercel (if not already)
3. Vercel will automatically deploy
4. Or manually trigger a deployment from the Vercel dashboard

### Step 8: Run Database Migrations

After the first deployment, you need to set up the database schema:

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

**Option B: Using Vercel Postgres Dashboard**

1. Go to Vercel → Your Project → Storage → Your Postgres Database
2. Click on **.env.local** tab or use the SQL Editor
3. The schema will be created automatically on first connection, or you can run migrations manually

### Step 9: Verify Deployment

Check these after deployment:

- [ ] Visit `https://staging.nuclioapp.com` - site loads
- [ ] Try signing up with a new email
- [ ] Check email inbox for magic link
- [ ] Verify magic link works and logs you in
- [ ] Create a test todo
- [ ] Check calendar view works
- [ ] Verify logo loads correctly

### Step 10: Verify Cron Job

1. Go to Vercel dashboard → Your Project → **Cron Jobs**
2. Verify `/api/notifications/send-batch` is listed
3. Check it's scheduled for every 2 hours (`0 */2 * * *`)

## Quick Reference: All Environment Variables

Here's everything you need in one place:

```bash
# Database (from Vercel Postgres)
DATABASE_URL=<from-POSTGRES_PRISMA_URL>

# NextAuth
NEXTAUTH_URL=https://staging.nuclioapp.com
NEXTAUTH_SECRET=<generated-secret>

# Email
RESEND_API_KEY=<your-resend-key>
EMAIL_FROM=noreply@nuclioapp.com

# Optional
CRON_SECRET=<generated-secret>
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` matches `POSTGRES_PRISMA_URL` from Vercel
- Check database is created and active in Vercel dashboard

### Domain Not Working
- Verify DNS records are correct
- Check domain is added in Vercel project settings
- Wait a few minutes for DNS propagation

### Email Not Sending
- Verify `nuclioapp.com` is verified in Resend
- Check `EMAIL_FROM` matches verified domain
- Verify `RESEND_API_KEY` is correct

### Build Fails
- Check Node.js version (18.x or 20.x)
- Verify all environment variables are set
- Check build logs in Vercel dashboard

## Next Steps After Staging is Live

1. Test all features thoroughly
2. Set up monitoring/error tracking
3. Configure production environment (when ready)
4. Set up backups for database
