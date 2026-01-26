# Database URL Clarification

## Which Connection String to Use

In Vercel, you'll see these variables for your `prisma-nuclio-staging` database:

1. **`PRISMA_DATABASE_URL`** (with `postgres://`) ✅ **USE THIS ONE**
   - Format: `postgres://user:password@host:port/database?sslmode=require`
   - This is the standard Prisma connection string
   - **This is what you need for `DATABASE_URL`**

2. **`PRISMA_DATABASE_URL`** (with `prisma+postgres://`) ❌ Don't use this
   - Format: `prisma+postgres://accelerate.prisma-data.net/?api_key=...`
   - This is for Prisma Accelerate (a different service)
   - Not needed for basic Prisma setup

3. **`POSTGRES_URL`** (direct connection) ⚠️ Not recommended
   - Direct PostgreSQL connection
   - Prisma prefers the PRISMA_DATABASE_URL format

## Quick Answer

**Use the `PRISMA_DATABASE_URL` that starts with `postgres://`**

Example:
```
DATABASE_URL=what is listed in POSTGRES_DATABASE_URL in Vercel Project Storage
```

## In Vercel Environment Variables

You can either:

**Option A:** Use the existing variable name
- Keep `PRISMA_DATABASE_URL` as-is
- Prisma will automatically use it

**Option B:** Create a `DATABASE_URL` variable
- Copy the value from `PRISMA_DATABASE_URL` (the `postgres://` one)
- Create new variable: `DATABASE_URL` = (paste the value)

Both work, but Option B is clearer since Prisma looks for `DATABASE_URL` by default.
