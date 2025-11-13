# CI Pipeline Documentation

## Overview

The CompiloHQ CI pipeline is a comprehensive continuous integration system built on GitHub Actions. It ensures code quality, type safety, and functionality across our monorepo before allowing merges to the main branch.

## Architecture

### Pipeline Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Push / Pull Request                       │
│                     to any branch                             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Parallel Execution                         │
├─────────────────┬─────────────────┬────────────────────────┤
│   Lint Job      │  Unit Tests Job │    Build Job          │
│   ~1-2 min      │  ~3-5 min       │    ~2-4 min           │
│                 │                 │                        │
│ • ESLint        │ • PostgreSQL    │ • TypeScript           │
│ • All packages  │ • Redis         │ • All packages         │
│ • Smart cache   │ • Migrations    │ • Next.js build        │
│                 │ • Seed data     │ • Artifacts upload     │
│                 │ • Coverage      │                        │
└─────────────────┴─────────────────┴────────┬───────────────┘
                                              │
                                              ▼
                                    ┌─────────────────────┐
                                    │   E2E Tests Job     │
                                    │   ~3-5 min          │
                                    │                     │
                                    │ • PostgreSQL        │
                                    │ • Redis             │
                                    │ • Playwright        │
                                    │ • Uses build        │
                                    │   artifacts         │
                                    └─────────────────────┘
```

### Job Dependency Graph

- **Lint**, **Unit Tests**, and **Build** run in parallel for maximum speed
- **E2E Tests** runs only after **Build** succeeds (needs build artifacts)
- All jobs are blocking - failures prevent merge

### Performance Targets

| Scenario | Target Time | Description |
|----------|-------------|-------------|
| Clean run | <10 minutes | All packages, no cache hits |
| Cached run | <3 minutes | No changes, full cache utilization |
| Single package | <5 minutes | One package changed, smart testing |

## Jobs

### 1. Lint Job

**Purpose:** Validate code quality with ESLint across all packages

**Runtime:** ~1-2 minutes

**Steps:**
1. Checkout code with full history (for Turborepo)
2. Setup Node.js 24.11.0 and pnpm
3. Restore Turborepo cache
4. Run `pnpm turbo lint`

**What it checks:**
- ESLint rules across all TypeScript/JavaScript files
- Import sorting and organization
- TypeScript type-aware linting
- Security vulnerabilities
- Code complexity

**Cache strategy:**
- pnpm dependencies cached by lockfile hash
- Turborepo task cache for lint results

**Failure scenarios:**
- ESLint errors in any package
- Import order violations
- Security rule violations

### 2. Unit Tests Job

**Purpose:** Run unit tests with database services and generate coverage

**Runtime:** ~3-5 minutes

**Services:**
- PostgreSQL 17 (port 5432)
- Redis 7 (port 6379)

**Steps:**
1. Checkout code with full history
2. Setup Node.js and pnpm
3. Restore Turborepo cache
4. Wait for PostgreSQL readiness
5. Generate Prisma Client
6. Run database migrations
7. Seed database with test data
8. Run unit tests with coverage
9. Upload coverage artifacts

**What it tests:**
- Database layer (Prisma queries, DAL)
- UI components (React, hooks)
- Validation schemas (Zod)
- Business logic
- API route handlers

**Coverage requirements:**
- Minimum 80% across all metrics (statements, branches, functions, lines)
- Coverage threshold is blocking - failures prevent merge

**Cache strategy:**
- pnpm dependencies cached
- Turborepo task cache for test results
- Database migrations are idempotent

**Failure scenarios:**
- Any unit test fails
- Coverage below 80% threshold
- Database migrations fail
- Seed data fails to load

### 3. Build Job

**Purpose:** Build all packages and verify type safety

**Runtime:** ~2-4 minutes

**Steps:**
1. Checkout code with full history
2. Setup Node.js and pnpm
3. Restore Turborepo cache
4. Restore Next.js build cache
5. Run `pnpm turbo build`
6. Verify build artifacts exist
7. Upload build artifacts

**What it builds:**
- `@compilothq/database` - Database package
- `@compilothq/ui` - UI component library
- `@compilothq/validation` - Validation schemas
- `apps/web` - Next.js application

**Type checking:**
- Implicit through build process (no separate typecheck job)
- TypeScript strict mode enforced
- All packages must compile successfully

**Artifact verification:**
- Checks for `apps/web/.next` (Next.js build)
- Checks for `packages/*/dist` (Package builds)
- Fails if critical artifacts missing

**Cache strategy:**
- pnpm dependencies cached
- Turborepo task cache for build results
- Next.js build cache (.next/cache)

**Failure scenarios:**
- TypeScript compilation errors
- Build process fails
- Missing build artifacts

### 4. E2E Tests Job

**Purpose:** Run end-to-end tests with Playwright

**Runtime:** ~3-5 minutes

**Dependencies:** Build job (downloads build artifacts)

**Services:**
- PostgreSQL 17 (port 5432)
- Redis 7 (port 6379)

**Steps:**
1. Checkout code with full history
2. Setup Node.js and pnpm
3. Restore Turborepo cache
4. Download build artifacts from Build job
5. Wait for PostgreSQL readiness
6. Generate Prisma Client
7. Run database migrations
8. Seed database with test data
9. Run `pnpm test:e2e`

**What it tests:**
- Full user workflows
- UI interactions
- API integrations
- Database state changes
- Authentication flows

**Cache strategy:**
- pnpm dependencies cached
- Turborepo task cache for test results
- Reuses build artifacts from Build job

**Failure scenarios:**
- Any E2E test fails
- Playwright test timeout
- Database connection issues

## Smart Testing with Turborepo

### How it works

Turborepo analyzes your git history to determine which packages have changed and only runs tasks (lint, test, build) for affected packages and their dependents.

### Configuration

See `turbo.json` for task definitions and caching rules.

### Example scenarios

#### Scenario 1: No changes

```bash
# All tasks cached, minimal work
pnpm turbo lint   # ✓ 3 tasks (CACHED)
pnpm turbo build  # ✓ 4 tasks (CACHED)
```

**Result:** <1 minute total

#### Scenario 2: Single package change

```bash
# Only @compilothq/ui changed
pnpm turbo build
# ✓ @compilothq/ui (build)
# ✓ apps/web (build, depends on ui)
# ✓ packages/database (CACHED)
# ✓ packages/validation (CACHED)
```

**Result:** ~2-3 minutes

#### Scenario 3: Shared package change

```bash
# @compilothq/validation changed
pnpm turbo build
# ✓ @compilothq/validation (build)
# ✓ @compilothq/database (build, depends on validation)
# ✓ @compilothq/ui (build, depends on validation)
# ✓ apps/web (build, depends on all)
```

**Result:** ~3-5 minutes (all packages affected)

#### Scenario 4: Root config change

```bash
# tsconfig.json changed
pnpm turbo build
# All packages rebuild (no cache)
```

**Result:** Full rebuild time

## Caching Strategy

### Three-layer caching

1. **pnpm dependencies** - Cached by `pnpm-lock.yaml` hash
2. **Turborepo task cache** - Cached by task inputs (source files)
3. **Next.js build cache** - Cached by app source files

### Cache keys

```yaml
# pnpm dependencies
key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}

# Turborepo cache
key: ${{ runner.os }}-turbo-lint-${{ github.sha }}

# Next.js build cache
key: ${{ runner.os }}-nextjs-${{ hashFiles('apps/web/**/*.{ts,tsx,js,jsx}') }}
```

### Cache invalidation

- pnpm cache: Invalidates when lockfile changes
- Turborepo cache: Invalidates when task inputs change
- Next.js cache: Invalidates when app source files change

### Cache hit rates

Expected cache hit rates with CI optimization:

| Scenario | pnpm | Turborepo | Next.js |
|----------|------|-----------|---------|
| No changes | 100% | 100% | 100% |
| Single package | 100% | 75% | 0% |
| Shared package | 100% | 25% | 0% |
| Root config | 100% | 0% | 0% |
| Lockfile change | 0% | 0% | 0% |

## Database Management

### Migration strategy

Migrations run before every test execution to ensure schema is up-to-date.

**Idempotency:**
- Migrations are designed to run multiple times safely
- `prisma migrate dev` handles already-applied migrations
- No need to track migration state between jobs

### Seed data

Seed data provides realistic test scenarios.

**Idempotency:**
- Seed script uses `upsert` operations
- Safe to run multiple times
- Ensures consistent test data

### Connection strings

```bash
# CI environment (GitHub Actions)
DATABASE_URL=postgresql://postgres:password@localhost:5432/compilothq_test

# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/compilothq_test
```

**Note:** CI uses port 5432, local dev uses 5433 to avoid conflicts.

## Environment Variables

### Required variables

All jobs set these environment variables:

```yaml
DATABASE_URL: postgresql://postgres:password@localhost:5432/compilothq_test
REDIS_URL: redis://localhost:6379
CI: true
NODE_ENV: test
NEXTAUTH_URL: http://localhost:3000
NEXTAUTH_SECRET: test-secret-key-minimum-16-characters-required
NEXT_PUBLIC_APP_NAME: Compilo Test
NEXT_PUBLIC_APP_URL: http://localhost:3000
NEXT_PUBLIC_FEATURE_QUESTIONNAIRES: true
NEXT_PUBLIC_FEATURE_DOCUMENT_GENERATION: true
NEXT_PUBLIC_FEATURE_AI_ASSISTANCE: true
```

### Variable sources

- **Inline:** Most variables defined directly in workflow
- **Repository secrets:** Sensitive values (when needed)
- **.env.test:** Template for local testing

## Running Locally

### Full pipeline simulation

```bash
# 1. Start Docker services
pnpm docker:up

# 2. Run linting
pnpm turbo lint

# 3. Run unit tests with coverage
pnpm test:coverage

# 4. Build all packages
pnpm turbo build

# 5. Run E2E tests
pnpm test:e2e
```

### Individual jobs

```bash
# Lint only
pnpm turbo lint

# Unit tests only
pnpm test:unit

# Build only
pnpm turbo build

# E2E tests only
pnpm test:e2e
```

### With smart testing

```bash
# Only lint changed packages
pnpm turbo lint --filter="...[HEAD^]"

# Only test changed packages
pnpm turbo test:unit --filter="...[HEAD^]"

# Only build changed packages
pnpm turbo build --filter="...[HEAD^]"
```

## Troubleshooting

See [CI_TROUBLESHOOTING.md](CI_TROUBLESHOOTING.md) for detailed troubleshooting guide.

### Quick checks

```bash
# Verify Docker services
pnpm docker:ps

# Check service health
pnpm docker:health

# View service logs
pnpm docker:logs

# Reset everything
pnpm docker:reset
```

## Performance Monitoring

### Key metrics to track

1. **Total pipeline duration** - Target: <10 minutes
2. **Cache hit rate** - Target: >80%
3. **Time to first failure** - Target: <3 minutes
4. **Job-specific duration** - Monitor trends

### Optimization opportunities

1. **Reduce dependencies** - Fewer deps = faster installs
2. **Improve cache hit rate** - Better cache keys
3. **Parallelize more** - Independent jobs run together
4. **Reduce test scope** - Focus on affected packages
5. **Optimize database** - Faster migrations and seeds

## Best Practices

1. **Keep CI fast** - Developers wait for CI, make it quick
2. **Fail fast** - Lint first, catch errors early
3. **Cache aggressively** - Every second counts
4. **Test what matters** - Focus on critical paths
5. **Monitor and optimize** - Regular performance reviews
6. **Keep services up to date** - Update PostgreSQL, Redis, Node versions
7. **Document changes** - Update this doc when modifying CI

## Additional Resources

- [Branch Protection Guide](BRANCH_PROTECTION.md)
- [Troubleshooting Guide](CI_TROUBLESHOOTING.md)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
