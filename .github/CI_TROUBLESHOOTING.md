# CI Pipeline Troubleshooting Guide

This guide helps you diagnose and fix common CI pipeline issues.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
  - [Lint Job Failures](#lint-job-failures)
  - [Unit Test Failures](#unit-test-failures)
  - [Build Failures](#build-failures)
  - [E2E Test Failures](#e2e-test-failures)
  - [Cache Issues](#cache-issues)
  - [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [Getting Help](#getting-help)

## Quick Diagnostics

### Check CI Status

1. Go to GitHub Actions tab
2. Find your workflow run
3. Identify which job failed
4. Click on the failed job to see logs

### Reproduce Locally

```bash
# Run the same checks locally
pnpm turbo lint        # Lint
pnpm test:coverage     # Unit tests
pnpm turbo build       # Build
pnpm test:e2e          # E2E tests
```

### Check Docker Services

```bash
# Verify services are running
pnpm docker:ps

# Check service health
pnpm docker:health

# View logs
pnpm docker:logs
```

## Common Issues

### Lint Job Failures

#### Issue: ESLint errors

**Symptom:**
```
Error: Command failed: pnpm turbo lint
✗ @compilothq/web:lint failed
```

**Cause:** Code doesn't meet ESLint rules

**Solution:**
```bash
# Fix automatically
pnpm lint:fix

# Or manually fix the errors
pnpm lint
```

**Prevention:**
- Set up pre-commit hooks (already configured with Husky)
- Run `pnpm lint:strict` before pushing

#### Issue: Import order violations

**Symptom:**
```
Error: Run autofix to sort these imports!
```

**Cause:** Imports not sorted correctly

**Solution:**
```bash
# Auto-fix import order
pnpm lint:fix
```

**Prevention:**
- Configure your IDE to auto-sort imports on save
- VSCode: Use the ESLint extension

#### Issue: Type-aware linting errors

**Symptom:**
```
Error: Unsafe assignment of an `any` value
```

**Cause:** TypeScript type safety violations

**Solution:**
```bash
# Fix type issues
pnpm typecheck

# Then fix the reported errors
```

**Prevention:**
- Enable TypeScript in your IDE
- Run `pnpm lint:strict` before pushing

### Unit Test Failures

#### Issue: Database connection timeout

**Symptom:**
```
Error: Can't reach database server at localhost:5432
```

**Cause:** PostgreSQL service not ready or not running

**Solution (CI):**
- Wait step should handle this automatically
- Check if PostgreSQL service configuration is correct
- Verify health check passes

**Solution (Local):**
```bash
# Start Docker services
pnpm docker:up

# Wait for services
pnpm docker:health

# Run tests
pnpm test:unit
```

#### Issue: Migration failures

**Symptom:**
```
Error: Migration failed to apply cleanly to the shadow database
```

**Cause:** Migration conflicts or schema issues

**Solution (Local):**
```bash
# Reset database
pnpm docker:reset

# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate
```

**Solution (CI):**
- Check migration files for syntax errors
- Ensure migrations are idempotent
- Verify schema.prisma is valid

#### Issue: Seed data failures

**Symptom:**
```
Error: Seed command failed
```

**Cause:** Seed data conflicts or validation errors

**Solution:**
```bash
# Check seed script
cat packages/database/prisma/seed.ts

# Run seed locally to debug
pnpm db:seed
```

**Prevention:**
- Use `upsert` instead of `create` in seed scripts
- Handle duplicate entries gracefully
- Validate data before inserting

#### Issue: Coverage below threshold

**Symptom:**
```
Error: Coverage for lines (75%) does not meet threshold (80%)
```

**Cause:** Insufficient test coverage

**Solution:**
1. Identify uncovered code:
   ```bash
   pnpm test:coverage
   open coverage/index.html
   ```

2. Add tests for uncovered code

3. Verify coverage:
   ```bash
   pnpm test:coverage
   ```

**Prevention:**
- Write tests as you write code
- Use TDD (Test-Driven Development)
- Review coverage reports regularly

#### Issue: Flaky tests

**Symptom:**
Tests pass sometimes, fail other times

**Cause:**
- Race conditions
- Time-dependent tests
- Shared state between tests

**Solution:**
1. Identify the flaky test
2. Add proper waits/delays
3. Ensure test isolation
4. Mock time-dependent code

```typescript
// Bad: Time-dependent
expect(Date.now()).toBe(expectedTime)

// Good: Mocked time
vi.setSystemTime(new Date('2024-01-01'))
expect(Date.now()).toBe(new Date('2024-01-01').getTime())
```

### Build Failures

#### Issue: TypeScript compilation errors

**Symptom:**
```
Error: TS2322: Type 'string' is not assignable to type 'number'
```

**Cause:** Type errors in code

**Solution:**
```bash
# Check types
pnpm typecheck

# Fix reported errors
```

**Prevention:**
- Enable TypeScript in your IDE
- Run `pnpm typecheck` before pushing
- Use strict mode (already configured)

#### Issue: Missing dependencies

**Symptom:**
```
Error: Cannot find module '@compilothq/ui'
```

**Cause:** Dependency not installed or not built

**Solution (Local):**
```bash
# Install dependencies
pnpm install

# Build dependencies
pnpm turbo build
```

**Solution (CI):**
- Verify pnpm-lock.yaml is committed
- Check workspace configuration in pnpm-workspace.yaml
- Ensure package.json dependencies are correct

#### Issue: Build artifact verification fails

**Symptom:**
```
Error: Next.js build artifacts not found at apps/web/.next
```

**Cause:** Build didn't complete or output to wrong location

**Solution:**
1. Check build logs for errors
2. Verify build script in package.json
3. Ensure output directories are correct

```bash
# Verify build outputs
ls -la apps/web/.next
ls -la packages/*/dist
```

#### Issue: Next.js build memory issues

**Symptom:**
```
Error: FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Cause:** Next.js build exceeds memory limit

**Solution:**
Add to package.json build script:
```json
{
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}
```

Or in CI workflow, increase runner memory (if using self-hosted runners)

### E2E Test Failures

#### Issue: Playwright browser not found

**Symptom:**
```
Error: Executable doesn't exist at /home/runner/.cache/ms-playwright/chromium-1234/chrome-linux/chrome
```

**Cause:** Playwright browsers not installed

**Solution (Local):**
```bash
# Install Playwright browsers
pnpm --filter web exec playwright install --with-deps
```

**Solution (CI):**
Add installation step to workflow if not present:
```yaml
- name: Install Playwright browsers
  run: pnpm --filter web exec playwright install --with-deps
```

#### Issue: E2E test timeout

**Symptom:**
```
Error: Test timeout of 30000ms exceeded
```

**Cause:** Test took too long or stuck waiting

**Solution:**
1. Increase timeout if legitimate:
   ```typescript
   test('slow test', { timeout: 60000 }, async ({ page }) => {
     // test code
   })
   ```

2. Or optimize the test:
   - Use `page.waitForLoadState('networkidle')` sparingly
   - Mock slow API calls
   - Reduce unnecessary waits

#### Issue: Selector not found

**Symptom:**
```
Error: Timeout 30000ms exceeded waiting for selector "button[type='submit']"
```

**Cause:** Element doesn't exist or page didn't load

**Solution:**
1. Verify page loaded correctly:
   ```typescript
   await page.goto('/login')
   await expect(page).toHaveTitle(/Login/)
   ```

2. Use more reliable selectors:
   ```typescript
   // Bad: May change
   await page.click('.btn-primary')

   // Good: More stable
   await page.getByRole('button', { name: 'Submit' }).click()
   ```

3. Add explicit waits:
   ```typescript
   await page.waitForSelector('button[type="submit"]', { state: 'visible' })
   ```

#### Issue: Build artifacts not restored

**Symptom:**
```
Error: ENOENT: no such file or directory, open 'apps/web/.next/BUILD_ID'
```

**Cause:** Build artifacts not downloaded or restored incorrectly

**Solution:**
1. Verify Build job succeeded
2. Check artifact upload in Build job
3. Check artifact download in E2E job
4. Ensure artifact name matches exactly

### Cache Issues

#### Issue: Cache not restoring

**Symptom:**
CI takes full time even when nothing changed

**Cause:**
- Cache key doesn't match
- Cache expired (7 day limit)
- Cache corrupted

**Solution:**
1. Check cache key format in workflow
2. Verify lockfile committed
3. Try clearing cache:
   - Go to Actions tab → Caches
   - Delete old caches
   - Re-run workflow

#### Issue: Stale cache

**Symptom:**
Old files present after update

**Cause:** Cache not invalidated properly

**Solution:**
1. Check cache key includes correct hash
2. Ensure lockfile changes invalidate cache
3. Manual cache bust:
   ```yaml
   key: ${{ runner.os }}-pnpm-v2-${{ hashFiles('**/pnpm-lock.yaml') }}
   ```
   (Increment v2 to v3)

#### Issue: Turborepo cache too large

**Symptom:**
Warning about cache size

**Solution:**
Configure cache size in turbo.json:
```json
{
  "remoteCache": {
    "maximumBytes": 10485760
  }
}
```

### Database Issues

#### Issue: Migration conflicts

**Symptom:**
```
Error: Database migration failed
```

**Cause:** Multiple migrations created simultaneously

**Solution:**
1. Rebase your branch on main
2. Resolve migration conflicts
3. Regenerate Prisma Client:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

#### Issue: Seed data conflicts

**Symptom:**
```
Error: Unique constraint failed on the fields: (`email`)
```

**Cause:** Seed data tries to create duplicate entries

**Solution:**
Use `upsert` instead of `create`:
```typescript
await prisma.user.upsert({
  where: { email: 'test@example.com' },
  update: {},
  create: {
    email: 'test@example.com',
    name: 'Test User',
  },
})
```

#### Issue: Connection pool exhausted

**Symptom:**
```
Error: Can't reach database server at localhost:5432
```

**Cause:** Too many open connections

**Solution:**
Add connection limit to DATABASE_URL:
```
postgresql://postgres:password@localhost:5432/compilothq_test?connection_limit=10
```

## Performance Issues

### Issue: CI takes too long

**Target:** <10 minutes for full run, <3 minutes for cached

**Diagnosis:**
1. Check individual job durations
2. Identify bottlenecks
3. Check cache hit rates

**Solutions:**

#### Optimize dependencies
```bash
# Analyze bundle
pnpm --filter web exec next-bundle-analyzer

# Remove unused dependencies
pnpm prune

# Update slow dependencies
pnpm update
```

#### Improve cache hit rate
- Ensure lockfile is committed
- Use consistent cache keys
- Don't change root files unnecessarily

#### Parallelize more
Current setup already parallelizes Lint, Unit Tests, and Build.
Consider splitting large test suites.

#### Reduce test scope
Use Turborepo smart testing:
```bash
# Only test changed packages
pnpm turbo test:unit --filter="...[HEAD^]"
```

### Issue: Flaky network requests

**Symptom:**
Tests fail randomly with network errors

**Solution:**
1. Mock external API calls
2. Increase timeout for network requests
3. Add retry logic for flaky endpoints

```typescript
// Mock external API
vi.mock('some-api-client', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' })
}))
```

## Getting Help

### Check existing resources

1. **Documentation**
   - [CI Pipeline Documentation](CI_PIPELINE.md)
   - [Branch Protection Guide](BRANCH_PROTECTION.md)

2. **GitHub Actions logs**
   - Full logs available in Actions tab
   - Download logs for offline analysis

3. **Search issues**
   - Check repository issues
   - Search GitHub Actions community forums

### Report an issue

If you can't resolve the issue:

1. Create a GitHub issue with:
   - Description of the problem
   - Steps to reproduce
   - CI workflow run link
   - Error messages
   - What you've tried

2. Include:
   - Branch name
   - Commit SHA
   - Job that failed
   - Full error output

### Emergency bypass

If CI is blocking critical work and you can't fix it immediately:

1. **Option 1: Fix forward**
   ```bash
   # Create hotfix branch
   git checkout -b hotfix/ci-issue

   # Fix the issue
   # Push and merge
   ```

2. **Option 2: Temporary disable check** (NOT RECOMMENDED)
   - Requires admin access
   - Go to Settings → Branches
   - Temporarily remove failing check
   - RE-ENABLE IMMEDIATELY after merge

3. **Option 3: Skip CI** (EMERGENCY ONLY)
   ```bash
   git commit -m "fix: emergency fix [skip ci]"
   ```
   Note: This bypasses ALL checks - use only in emergency

## Preventive Maintenance

### Regular tasks

- **Weekly:**
  - Review CI performance metrics
  - Check cache hit rates
  - Monitor job durations

- **Monthly:**
  - Update dependencies
  - Review and optimize slow tests
  - Clean up old caches

- **Quarterly:**
  - Review CI pipeline architecture
  - Update GitHub Actions versions
  - Update service container versions

### Monitoring

Set up monitoring for:
- CI failure rate
- Average pipeline duration
- Cache hit rate
- Flaky test frequency

### Best practices

1. **Run CI locally before pushing**
   ```bash
   pnpm lint:strict && pnpm test:coverage && pnpm build
   ```

2. **Keep CI fast**
   - Every second counts
   - Developers wait for CI

3. **Fix failures immediately**
   - Don't let them accumulate
   - Broken CI trains the team to ignore it

4. **Monitor and optimize**
   - Track metrics
   - Continuously improve

5. **Document changes**
   - Update this guide
   - Share learnings with team

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
