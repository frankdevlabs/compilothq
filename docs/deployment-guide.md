# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Compilo application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Database Setup](#database-setup)
4. [Authentication Configuration](#authentication-configuration)
5. [Environment Variables](#environment-variables)
6. [Deployment Steps](#deployment-steps)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying to production, ensure you have:

- [ ] Production database (PostgreSQL 17+)
- [ ] Redis instance for caching and sessions
- [ ] Domain name with SSL certificate
- [ ] Google Cloud Platform project for OAuth
- [ ] Resend account for transactional emails
- [ ] Deployment platform account (Vercel, Railway, AWS, etc.)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`pnpm test`)
- [ ] Production build succeeds (`pnpm build`)
- [ ] No console.log or debug code in production files
- [ ] TypeScript strict mode enabled and no errors
- [ ] ESLint passing with no warnings

### Security

- [ ] All secrets generated fresh for production
- [ ] Environment variables validated with Zod
- [ ] `.env` file in `.gitignore`
- [ ] No secrets committed to version control
- [ ] HTTPS enforced for all connections
- [ ] Database connections using SSL/TLS

### Features

- [ ] Database migration successfully applied
- [ ] NextAuth.js v5 configured correctly
- [ ] Google OAuth tested in staging
- [ ] Email delivery tested (magic links and invitations)
- [ ] Team management UI verified
- [ ] All critical user flows tested manually

---

## Database Setup

### 1. Provision Production Database

Choose a managed PostgreSQL provider:

**Option A: Vercel Postgres**

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Link to your Vercel project
vercel link

# Create Postgres database
vercel postgres create
```

**Option B: Neon**

1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Enable connection pooling for better performance

**Option C: Supabase**

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Navigate to Settings > Database
4. Copy connection string with pooler enabled

### 2. Run Database Migration

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migration
pnpm db:migrate:dev -- --name add-nextauth-models

# Verify migration
pnpm db:studio
```

### 3. Verify Database Schema

Confirm the following tables exist:

- `User`
- `Organization`
- `Account` (NextAuth.js)
- `Session` (NextAuth.js)
- `VerificationToken` (NextAuth.js)
- `Invitation`

---

## Authentication Configuration

### Google OAuth Setup (Production)

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/apis/credentials
   - Select your project (or create new one for production)

2. **Create OAuth 2.0 Client ID**
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "Compilo Production"

3. **Configure Authorized URLs**
   - **Authorized JavaScript origins:**
     - `https://your-domain.com`
   - **Authorized redirect URIs:**
     - `https://your-domain.com/api/auth/callback/google`

4. **Copy Credentials**
   - Save Client ID as `GOOGLE_CLIENT_ID`
   - Save Client Secret as `GOOGLE_CLIENT_SECRET`

5. **Test in Staging First**
   - Deploy to staging environment
   - Test complete OAuth flow
   - Verify account creation and linking

### Resend Email Setup (Production)

1. **Sign Up / Log In**
   - Go to: https://resend.com

2. **Add Production Domain**
   - Navigate to Domains
   - Click "Add Domain"
   - Enter your sending domain (e.g., `mail.your-domain.com`)

3. **Configure DNS Records**

   Add the following DNS records to your domain:

   **SPF Record (TXT)**

   ```
   Name: @
   Type: TXT
   Value: v=spf1 include:resend.com ~all
   ```

   **DKIM Records (TXT)**

   ```
   Name: resend._domainkey
   Type: TXT
   Value: [Provided by Resend]
   ```

   **DMARC Record (TXT)**

   ```
   Name: _dmarc
   Type: TXT
   Value: v=DMARC1; p=none; rua=mailto:dmarc@your-domain.com
   ```

4. **Verify Domain**
   - Wait for DNS propagation (5-30 minutes)
   - Click "Verify" in Resend dashboard
   - Confirm all records pass

5. **Generate Production API Key**
   - Navigate to API Keys
   - Click "Create API Key"
   - Name: "Compilo Production"
   - Permissions: "Sending access"
   - Save as `RESEND_API_KEY`

6. **Test Email Delivery**
   ```bash
   # Send test magic link email
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "no-reply@your-domain.com",
       "to": "test@example.com",
       "subject": "Test Email",
       "html": "<p>This is a test</p>"
     }'
   ```

---

## Environment Variables

### Required Variables

Create production environment variables based on `.env.production.example`:

```bash
# Core
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=...

# App
NEXT_PUBLIC_APP_NAME=Compilo
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Platform-Specific Setup

**Vercel:**

1. Go to Project Settings > Environment Variables
2. Add each variable
3. Set Environment to "Production"
4. Mark sensitive values as "Sensitive"

**Railway:**

1. Go to project settings
2. Click "Variables"
3. Add each variable (automatically encrypted)

**AWS:**

1. Use AWS Secrets Manager
2. Reference in ECS task definition or EC2 environment

---

## Deployment Steps

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Link Project**

   ```bash
   vercel link
   ```

3. **Set Environment Variables**

   ```bash
   # Set production variables (interactive)
   vercel env add NEXTAUTH_SECRET production
   vercel env add GOOGLE_CLIENT_ID production
   # ... repeat for all variables
   ```

4. **Deploy**

   ```bash
   # Preview deployment
   vercel

   # Production deployment
   vercel --prod
   ```

5. **Configure Custom Domain**
   - Go to Vercel dashboard
   - Project Settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

### Option 2: Railway

1. **Install Railway CLI**

   ```bash
   npm install -g @railway/cli
   ```

2. **Initialize Project**

   ```bash
   railway login
   railway init
   ```

3. **Add Services**
   - PostgreSQL: `railway add --database postgres`
   - Redis: `railway add --database redis`

4. **Set Variables**

   ```bash
   railway variables set NEXTAUTH_SECRET=...
   railway variables set GOOGLE_CLIENT_ID=...
   # ... repeat for all variables
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Option 3: Docker (Self-Hosted)

1. **Build Docker Image**

   ```bash
   docker build -t compilothq:latest .
   ```

2. **Run Container**

   ```bash
   docker run -d \
     --name compilothq \
     -p 3000:3000 \
     --env-file .env.production \
     compilothq:latest
   ```

3. **Use Docker Compose** (recommended)
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## Post-Deployment Verification

### Automated Tests

Run production health checks:

```bash
# Check application is accessible
curl https://your-domain.com/api/health

# Check authentication endpoint
curl https://your-domain.com/api/auth/csrf

# Run integration tests against production (with caution)
NEXT_PUBLIC_APP_URL=https://your-domain.com pnpm test:e2e
```

### Manual Testing Checklist

- [ ] **Homepage loads** correctly
- [ ] **Sign up with email** (magic link)
  - Email received within 1 minute
  - Magic link works
  - User created in database
  - Organization creation flow works
- [ ] **Sign up with Google OAuth**
  - OAuth consent screen appears
  - Successful authentication
  - User created and linked
- [ ] **Login with existing account**
  - Email magic link works
  - Google OAuth works
  - Session persists across page refresh
- [ ] **Protected routes**
  - `/dashboard` requires authentication
  - Unauthenticated users redirected to login
  - Callback URL preserved
- [ ] **Team invitations**
  - Send invitation from team settings
  - Email received by invitee
  - Invitation link works
  - User successfully joins organization
- [ ] **Sign out**
  - Session cleared correctly
  - Redirected to public page
- [ ] **Performance**
  - Page load times < 2 seconds
  - No console errors
  - No 404s in Network tab

### Database Verification

```bash
# Connect to production database
pnpm db:studio

# Verify tables exist
# Check sample data (if seeded)
# Confirm indexes created
```

### Monitoring Setup

1. **Configure Sentry** (Error Tracking)

   ```bash
   # Add to production environment
   NEXT_PUBLIC_SENTRY_DSN=https://...
   SENTRY_AUTH_TOKEN=...
   ```

2. **Configure PostHog** (Analytics)

   ```bash
   NEXT_PUBLIC_POSTHOG_KEY=phc_...
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

3. **Set Up Alerts**
   - Error rate > 5% in last hour
   - API response time > 2 seconds
   - Database connection failures
   - Failed authentication attempts > 10/minute

---

## Troubleshooting

### Build Failures

**Issue:** TypeScript errors during build

```bash
# Solution: Run type check locally
pnpm type-check

# Fix all TypeScript errors before deploying
```

**Issue:** Missing dependencies

```bash
# Solution: Verify package.json includes all required packages
pnpm install --frozen-lockfile
```

### Authentication Issues

**Issue:** Google OAuth shows "Error 400: redirect_uri_mismatch"

```
Solution:
1. Check NEXTAUTH_URL matches production domain exactly
2. Verify redirect URI in Google Console matches:
   https://your-domain.com/api/auth/callback/google
3. No trailing slashes
4. HTTPS (not HTTP) in production
```

**Issue:** Magic link emails not being received

```
Solution:
1. Check RESEND_API_KEY is production key
2. Verify domain is verified in Resend dashboard
3. Check DNS records (SPF, DKIM, DMARC) are correct
4. Look in spam folder
5. Test with Resend API directly
```

**Issue:** "Invalid session" or session not persisting

```
Solution:
1. Verify NEXTAUTH_SECRET is set and correct
2. Check database connection (sessions stored in DB)
3. Verify cookie settings (Secure, HttpOnly, SameSite)
4. Ensure NEXTAUTH_URL matches actual domain
```

### Database Issues

**Issue:** "Too many connections" error

```
Solution:
1. Enable connection pooling in DATABASE_URL
2. Add ?connection_limit=20 to connection string
3. Use PgBouncer for connection pooling
4. Scale database instance
```

**Issue:** Migration failed

```
Solution:
1. Check database user has CREATE TABLE permissions
2. Verify PostgreSQL version is 12+
3. Run migration manually:
   pnpm prisma migrate deploy
4. Check for conflicting schema changes
```

### Performance Issues

**Issue:** Slow page loads

```
Solution:
1. Enable Redis caching for sessions
2. Optimize database queries (check slow query log)
3. Add indexes to frequently queried columns
4. Enable CDN for static assets
5. Use Vercel Edge Functions for reduced latency
```

---

## Rollback Procedure

If deployment fails or critical issues arise:

1. **Revert Deployment**

   ```bash
   # Vercel
   vercel rollback

   # Railway
   railway rollback

   # Docker
   docker pull compilothq:previous-tag
   docker-compose up -d
   ```

2. **Rollback Database Migration** (if needed)

   ```bash
   # Revert last migration
   pnpm prisma migrate resolve --rolled-back migration_name
   ```

3. **Notify Users**
   - Post status update
   - Send email to active users
   - Update status page

---

## Support

For deployment assistance:

- **Documentation:** `/docs/authentication.md`
- **Issues:** GitHub Issues
- **Team Chat:** [Your team communication channel]
- **Emergency:** [Emergency contact info]

---

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Watch error rates
   - Monitor performance
   - Check user reports

2. **Set up regular backups**
   - Database backups every 6 hours
   - Point-in-time recovery enabled
   - Test backup restoration

3. **Configure CI/CD**
   - Automated testing on pull requests
   - Preview deployments for branches
   - Automated production deployments on merge to main

4. **Security hardening**
   - Enable rate limiting
   - Set up DDoS protection
   - Configure Web Application Firewall (WAF)
   - Regular security audits

5. **Performance optimization**
   - Analyze Core Web Vitals
   - Optimize largest contentful paint (LCP)
   - Reduce time to first byte (TTFB)
   - Implement incremental static regeneration (ISR)
