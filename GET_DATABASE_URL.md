# How to Get Your DATABASE_URL from Vercel Postgres

## Quick Steps

1. **Go to Vercel Dashboard**
   - Navigate to your project: `prj_u9ShzYLFKbqayCFHyp6PRwahmStt`

2. **Open Storage Tab**
   - Click on **Storage** in the left sidebar
   - Find your database: **prisma-nuclio-staging**
   - Click on it

3. **Get Connection String**
   - Click on the **.env.local** tab (or look for "Connection Strings")
   - You'll see:
     ```
     POSTGRES_URL=postgres://...
     POSTGRES_PRISMA_URL=postgres://...
     ```
   - **Copy the `POSTGRES_PRISMA_URL` value** (this is what you need!)

4. **Use in Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add: `DATABASE_URL` = (paste the POSTGRES_PRISMA_URL value)

## Alternative: Using Vercel CLI

If you prefer using the CLI:

```bash
# Pull all environment variables (includes database URLs)
vercel env pull .env.local --project=prj_u9ShzYLFKbqayCFHyp6PRwahmStt

# Then check .env.local for POSTGRES_PRISMA_URL
cat .env.local | grep POSTGRES_PRISMA_URL
```

## Important Notes

- ✅ Use `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
- ✅ This is the Prisma-optimized connection string
- ✅ Vercel may have already added it as an environment variable automatically
- ✅ Check Vercel → Settings → Environment Variables to see if it's already there

## If Vercel Auto-Added It

Vercel sometimes automatically adds the database connection strings. Check:
- Vercel Dashboard → Your Project → Settings → Environment Variables
- Look for `POSTGRES_PRISMA_URL` - if it's there, you can use that value for `DATABASE_URL`
