# Development Authentication System

## Quick Start

### Generate Session (Browser Development)

```bash
pnpm dev:login --persona=DPO
```

Follow the instructions to copy the cookie into Chrome DevTools.

### Use in Playwright Tests

```typescript
import { setAuthCookie } from './__tests__/e2e/helpers/dev-auth'

test('protected feature', async ({ page }) => {
  await setAuthCookie(page, 'DPO')
  await page.goto('/dashboard')
  // ... test authenticated features
})
```

### Use in API Testing

```bash
# Get cookie header
pnpm dev:login --persona=DPO --format=cookie

# Use in curl
curl http://localhost:3000/api/trpc/user.me \
  -H "Cookie: authjs.session-token=<token>"
```

## Available Personas

- `DPO` - Data Protection Officer (highest authority)
- `PRIVACY_OFFICER` - Privacy Manager (day-to-day operations)
- `BUSINESS_OWNER` - Business stakeholder (submits activities)
- `IT_ADMIN` - IT Manager (technical management)
- `SECURITY_TEAM` - Information Security Officer
- `LEGAL_TEAM` - Legal Counsel

All personas are members of the "Compilo Dev" organization.

## Use Cases

### 1. Browser Testing During Development

**Scenario**: Testing protected features at localhost:3000

**Steps**:

1. Run `pnpm dev:login --persona=DPO`
2. Open Chrome DevTools → Application → Cookies
3. Create new cookie with values shown in the output
4. Refresh page - authenticated!

**Why**: Bypasses OAuth/email magic link flow for rapid iteration

**Example Output**:

```
🍪 BROWSER SETUP (Chrome DevTools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Open http://localhost:3000
2. Open DevTools → Application → Cookies → http://localhost:3000
3. Create new cookie with these values:

   Name:     authjs.session-token
   Value:    abc123...xyz789
   Path:     /
   HttpOnly: ✓
   SameSite: Lax

4. Refresh page - you're logged in!
```

---

### 2. Playwright E2E Tests

**Scenario**: Testing features that require authentication

**Steps**:

1. Import helper: `import { setAuthCookie } from './__tests__/e2e/helpers/dev-auth'`
2. In test: `await setAuthCookie(page, 'DPO')`
3. Navigate to protected route
4. Test authenticated features

**Why**: Avoids fragile authentication flows in E2E tests

**Example**:

```typescript
import { test, expect } from '@playwright/test'
import { setAuthCookie, DEV_PERSONAS } from './__tests__/e2e/helpers/dev-auth'

test('DPO can access team settings', async ({ page }) => {
  await setAuthCookie(page, DEV_PERSONAS.DPO)
  await page.goto('/settings/team')

  await expect(page.getByRole('heading', { name: /team settings/i })).toBeVisible()
  await expect(page.getByText('Dev DPO')).toBeVisible()
})

test('Business Owner can create activity', async ({ page }) => {
  await setAuthCookie(page, DEV_PERSONAS.BUSINESS_OWNER)
  await page.goto('/activities/new')

  await expect(page.getByRole('heading', { name: /new activity/i })).toBeVisible()
})
```

---

### 3. Manual API Testing (Postman/curl)

**Scenario**: Testing tRPC procedures directly

**Steps**:

1. Run `pnpm dev:login --persona=DPO --format=cookie`
2. Copy the cookie header value
3. Add to Postman/curl as Cookie header
4. Make authenticated API requests

**Why**: Enables testing API layer independently of UI

**Example with curl**:

```bash
# Get session token in cookie format
TOKEN=$(pnpm dev:login --persona=DPO --format=cookie)

# Test user.me endpoint
curl http://localhost:3000/api/trpc/user.me \
  -H "Cookie: $TOKEN" \
  -H "Content-Type: application/json"

# Test organization data
curl http://localhost:3000/api/trpc/organization.get \
  -H "Cookie: $TOKEN" \
  -H "Content-Type: application/json"
```

**Example with Postman**:

1. Create new request
2. Set URL: `http://localhost:3000/api/trpc/user.me`
3. Add Header: `Cookie: authjs.session-token=<token from CLI>`
4. Send request

---

### 4. Claude Code Validation

**Scenario**: Validating protected UI features with screenshots

**Steps**:

1. Generate session: `pnpm dev:login --persona=DPO`
2. Set cookie in browser (follow instructions)
3. Navigate to feature
4. Take screenshot for Claude Code validation

**Why**: Allows AI to validate authenticated experiences

**Example Workflow**:

```bash
# 1. Generate session
pnpm dev:login --persona=DPO

# 2. Open browser and set cookie (manual)
# 3. Navigate to protected page: http://localhost:3000/dashboard
# 4. Claude Code can now screenshot and validate the page
```

---

## Security

### How It's Protected

1. **NODE_ENV Check**: Only works in `development` or `test`
2. **Email Domain**: Dev users use `@dev.compilo.local` (never in prod)
3. **Organization Slug**: Dev org `compilo-dev` shouldn't exist in prod
4. **Seed Guards**: Development seeds automatically skip in production

### Error Messages

**Production Environment**:

```
❌ Development sessions are disabled in production.
This command is only available in NODE_ENV=development or NODE_ENV=test.
```

**Missing Dev Users**:

```
❌ Development user not found for persona: DPO
💡 Solution: Run "pnpm db:seed" to create development users
```

### Why This is Safe

- Production databases will never have `compilo-dev` organization
- Production databases will never have `@dev.compilo.local` email addresses
- Even if environment checks fail, dev users simply won't exist
- Database seeds skip automatically in production

---

## Troubleshooting

### "Development user not found"

**Cause**: Development users not seeded

**Solution**:

```bash
pnpm db:seed
```

This will create the "Compilo Dev" organization and all 6 dev users.

---

### "Development sessions disabled in production"

**Cause**: Trying to use in production environment

**Solution**: This is intentional. Use proper authentication flow in production.

---

### Session not working in browser

**Cause**: Cookie not set correctly

**Solution**:

1. Verify cookie name matches environment (`authjs.session-token` in dev)
2. Ensure `Path` is set to `/`
3. Check `HttpOnly` and `SameSite=Lax` are set
4. Clear all cookies and try again
5. Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)

---

### Playwright tests failing with authentication

**Cause**: Development users not seeded in test database

**Solution**: Global setup should seed users automatically. Check:

```bash
# Verify test database URL
echo $DATABASE_URL  # Should use port 5433

# Run global setup manually
pnpm --filter @compilothq/web test:e2e --debug
```

---

## Implementation Details

### Database Structure

**Development Organization**:

- ID: `org_dev_compilo_001`
- Name: `Compilo Dev`
- Slug: `compilo-dev`
- Status: `ACTIVE`

**Development Users** (6 total):

- `user_dev_dpo_001` → dpo@dev.compilo.local
- `user_dev_privacy_officer_002` → privacy-officer@dev.compilo.local
- `user_dev_business_owner_003` → business-owner@dev.compilo.local
- `user_dev_it_admin_004` → it-admin@dev.compilo.local
- `user_dev_security_team_005` → security-team@dev.compilo.local
- `user_dev_legal_team_006` → legal-team@dev.compilo.local

### Session Generation

1. Find user by persona + email domain + org slug
2. Delete existing sessions for user (clean slate)
3. Generate 32-byte hex token (matches NextAuth.js format)
4. Create Session record with 30-day expiration
5. Return token in multiple formats

### Files

- **Seeds**: `packages/database/prisma/seeds/devUsers.ts`
- **DAL**: `packages/database/src/dal/devSessions.ts`
- **CLI**: `scripts/dev-login.js`
- **Playwright**: `apps/web/__tests__/e2e/helpers/dev-auth.ts`
- **Global Setup**: `apps/web/__tests__/e2e/global-setup.ts`

---

## Advanced Examples

### Testing Permission Boundaries

```typescript
test('BUSINESS_OWNER cannot access admin settings', async ({ page }) => {
  await setAuthCookie(page, 'BUSINESS_OWNER')
  await page.goto('/settings/admin')

  // Should redirect or show permission denied
  await expect(page).not.toHaveURL(/\/settings\/admin/)
})
```

### Testing Multi-User Workflows

```typescript
test('DPO can approve activity submitted by BUSINESS_OWNER', async ({ browser }) => {
  // Create activity as Business Owner
  const boPage = await browser.newPage()
  await setAuthCookie(boPage, 'BUSINESS_OWNER')
  await boPage.goto('/activities/new')
  // ... submit activity ...

  // Approve as DPO
  const dpoPage = await browser.newPage()
  await setAuthCookie(dpoPage, 'DPO')
  await dpoPage.goto('/activities/pending')
  // ... approve activity ...
})
```

### Testing API Access with Different Personas

```bash
# As DPO (full access)
TOKEN_DPO=$(pnpm dev:login --persona=DPO --format=token)
curl "http://localhost:3000/api/trpc/team.list" \
  -H "Cookie: authjs.session-token=$TOKEN_DPO"

# As BUSINESS_OWNER (limited access)
TOKEN_BO=$(pnpm dev:login --persona=BUSINESS_OWNER --format=token)
curl "http://localhost:3000/api/trpc/team.list" \
  -H "Cookie: authjs.session-token=$TOKEN_BO"
# Should return different data or 403
```

---

## Output Formats

### `--format=all` (default)

Full instructions for browser setup, API testing, and raw values.

### `--format=token`

Just the session token:

```
abc123def456...xyz789
```

### `--format=cookie`

Just the cookie header value:

```
authjs.session-token=abc123...xyz789; Path=/; HttpOnly; SameSite=Lax
```

### `--format=json`

JSON object with all data:

```json
{
  "token": "abc123...xyz789",
  "cookieName": "authjs.session-token",
  "cookieValue": "authjs.session-token=abc123...xyz789; Path=/; HttpOnly; SameSite=Lax",
  "user": {
    "id": "user_dev_dpo_001",
    "name": "Dev DPO",
    "email": "dpo@dev.compilo.local",
    "organizationId": "org_dev_compilo_001",
    "primaryPersona": "DPO"
  },
  "expires": "2025-02-25T12:00:00.000Z"
}
```

---

## Integration with Development Workflow

### Daily Development

```bash
# Start development server
pnpm dev

# In another terminal, generate session
pnpm dev:login --persona=DPO

# Set cookie in browser and start coding
```

### Testing

```typescript
// In your E2E tests
import { setAuthCookie } from './__tests__/e2e/helpers/dev-auth'

test.beforeEach(async ({ page }) => {
  // Authenticate before each test
  await setAuthCookie(page, 'DPO')
})
```

### API Development

```bash
# Test API endpoint while developing
pnpm dev:login --persona=DPO --format=cookie
# Copy cookie and use in Postman/curl
```

---

## FAQ

**Q: Can I use this in production?**
A: No. Multiple layers of security prevent this. It only works in development/test environments.

**Q: What if I need a different persona?**
A: All 6 personas are available. Choose the one that matches your use case.

**Q: Do sessions expire?**
A: Yes, after 30 days (matching NextAuth.js default). Generate a new session when needed.

**Q: Can I have multiple sessions active?**
A: Yes. Each persona gets their own session. Creating a new session for the same persona invalidates the old one.

**Q: How do I clear all dev sessions?**
A: Use the DAL function: `clearDevSessions()` (only available in code, not CLI).

**Q: Can I customize the organization or users?**
A: The seed data is hardcoded for consistency. For custom test data, use the test factories.

**Q: What happens if I delete the dev org?**
A: Run `pnpm db:seed` again to recreate it.

---

## Summary

The development authentication system provides a frictionless way to:

- Test protected features during development
- Write E2E tests without authentication complexity
- Test API endpoints manually
- Validate UI with Claude Code

All while maintaining production security through multiple layers of protection.
