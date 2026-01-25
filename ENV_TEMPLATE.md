# Environment Variables Template

Copy these and fill in your values for Vercel:

## Quick Setup Checklist

### 1. Database Connection String
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```
**Where to get it:**
- Vercel Postgres: Project → Storage → Postgres → Copy connection string
- Supabase: Project Settings → Database → Connection string
- Neon: Dashboard → Connection string
- Railway: Database → Connect → Postgres connection URL

### 2. NextAuth Configuration
```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Email Configuration (Resend)
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@nuclioapp.com
```

**Where to get:**
- Resend Dashboard → API Keys → Create API Key
- EMAIL_FROM should match your verified domain in Resend

### 4. Optional: Cron Job Security
```
CRON_SECRET=<generate-another-random-secret>
```

**Generate CRON_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Optional: OpenAI (if using AI features)
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

## All Variables at Once

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=<generated-secret>
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@nuclioapp.com
CRON_SECRET=<generated-secret>
OPENAI_API_KEY=sk-...  # Optional
```

## What I Need From You

To help you set this up, please provide:

1. **Database Provider Choice:**
   - [ ] Vercel Postgres
   - [ ] Supabase
   - [ ] Neon
   - [ ] Railway
   - [ ] Other: ___________

2. **Resend API Key:** (if you have it)
   - Already have: `re_...`
   - Need to create one

3. **Staging Domain Preference:**
   - Use Vercel default: `your-app-name.vercel.app`
   - Custom domain: `staging.yourdomain.com`

4. **OpenAI API Key:** (only if using AI features)
   - [ ] Yes, I have one
   - [ ] No, skip AI features

Once you provide these, I can help you:
- Set up the database
- Configure all environment variables
- Run the initial migrations
- Test the deployment
