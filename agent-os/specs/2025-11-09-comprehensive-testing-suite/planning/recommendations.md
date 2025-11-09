# Testing Strategy Recommendations for Compilot HQ

**Date:** 2025-11-09
**Author:** Claude Code (after comprehensive research)
**Status:** Ready for Review

---

## Direct Answers to Your Questions

### 1. Testing Layer Priority

**RECOMMENDATION: Incremental layered approach starting with existing code**

**Phase 1 (Week 1-2): Foundation + Unit Tests**

- Set up testing infrastructure (Vitest, Playwright, configs)
- Write unit tests for existing DAL functions (packages/database/src/dal/\*.ts)
- **Rationale:** DAL functions already exist and are critical for data integrity
- **Target:** 90% coverage for DAL layer

**Phase 2 (Week 3-4): Integration Tests**

- Test DAL functions against real PostgreSQL test database
- Test GDPR-specific logic (e.g., getCountriesByGdprStatus with various edge cases)
- **Rationale:** Database interactions are where bugs hide (null handling, JSON queries, etc.)
- **Target:** Cover all DAL functions with integration tests

**Phase 3 (Week 5-6): API Layer (as you build)**

- Add tRPC procedure tests as routers are implemented
- Use createCallerFactory pattern for integration testing
- **Rationale:** Test API contracts as you build them, prevent regressions
- **Target:** 85% coverage for tRPC procedures

**Phase 4 (Week 7-10): E2E Tests (after core features exist)**

- Implement 5-10 critical user flows with Playwright
- Focus on revenue-critical paths (questionnaire, document generation)
- **Rationale:** E2E tests require stable UI, defer until features are built
- **Target:** 100% coverage of critical user journeys

**Why NOT "all three equally":**

- You can't write E2E tests for features that don't exist yet
- Unit tests give fastest ROI (catch bugs early, run in milliseconds)
- Integration tests protect against database/API integration bugs
- E2E tests are expensive to maintain, should be strategic

**Why NOT "focus on one layer first":**

- Unit tests alone miss integration bugs
- Need integration tests for database logic (Prisma queries can behave differently in tests)
- Combination provides safety net without excessive overhead

---

### 2. Coverage Targets

**RECOMMENDATION: Tiered coverage based on risk level**

**Critical Compliance Logic: 95-100% coverage**

- Validation rules (Zod schemas)
- GDPR classification logic (getCountriesByGdprStatus, etc.)
- Document generation templates
- Legal basis determination
- **Enforcement:** Make these files "required" in coverage config, CI fails if <95%

**API Layer (tRPC Procedures): 85-90% coverage**

- All tRPC query/mutation procedures
- Server Actions
- Input validation at API boundaries
- **Enforcement:** Overall API coverage gate in CI

**DAL Functions: 90-95% coverage**

- All database access functions
- Edge cases (null handling, empty results)
- Complex queries (JSON filtering, joins)
- **Enforcement:** Package-level coverage gate

**UI Components: 60-70% coverage**

- Critical user interactions (forms, navigation)
- Error states and loading states
- **Rationale:** Don't test implementation details, focus on user behavior
- **No enforcement:** Guidelines only, discretionary

**Utilities & Helpers: 75-85% coverage**

- Pure functions (formatters, validators, transformers)
- Shared libraries
- **Rationale:** High reuse means bugs amplify across codebase

**Example vitest.config.ts:**

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Global thresholds (will fail CI if not met)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      // Per-file thresholds for critical files
      perFile: true,
      // Exclude non-critical files from strict thresholds
      exclude: ['**/*.config.ts', '**/*.d.ts', '**/types/**', '**/__tests__/**'],
    },
  },
})
```

**Critical files list (enforce 95%+):**

```typescript
// In CI script:
const criticalFiles = [
  'packages/validation/src/schemas/**/*.ts',
  'packages/database/src/dal/**/*gdpr*.ts',
  'apps/web/src/lib/document-generation/**/*.ts',
]
// Run: vitest --coverage --coverage.thresholds.lines=95 --coverage.include=<criticalFiles>
```

**Why NOT 80% everywhere:**

- GDPR compliance has legal consequences, demands higher rigor
- UI components change frequently, 80% creates maintenance burden
- Different code has different risk profiles

---

### 3. Test Organization

**RECOMMENDATION: Separate tests by type (not colocated)**

**Structure:**

```
packages/database/
├── src/
│   └── dal/
│       ├── countries.ts
│       ├── dataNatures.ts
│       └── ...
├── __tests__/
│   ├── unit/
│   │   └── dal/
│   │       ├── countries.test.ts            # Unit tests (mocked Prisma)
│   │       └── dataNatures.test.ts
│   ├── integration/
│   │   └── dal/
│   │       ├── countries.integration.test.ts  # Real DB
│   │       └── dataNatures.integration.test.ts
│   ├── factories/
│   │   ├── index.ts                         # Export all factories
│   │   ├── country.factory.ts
│   │   ├── dataNature.factory.ts
│   │   └── ...
│   └── utils/
│       ├── test-db.ts                       # DB setup/teardown
│       └── test-helpers.ts
├── prisma/schema.prisma
└── vitest.config.ts

apps/web/
├── src/
│   ├── app/
│   ├── components/
│   ├── server/routers/
│   └── lib/
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   └── lib/
│   ├── integration/
│   │   └── server/
│   │       └── routers/
│   │           ├── activity.test.ts         # tRPC integration tests
│   │           └── ...
│   └── e2e/
│       ├── auth.spec.ts                     # Playwright E2E
│       ├── questionnaire.spec.ts
│       └── document-generation.spec.ts
├── test-utils/
│   ├── trpc-test-utils.ts                   # createCaller helpers
│   ├── auth-test-utils.ts                   # Mock sessions
│   └── msw/
│       └── handlers.ts                      # API mocks for components
├── vitest.config.ts
└── playwright.config.ts
```

**Benefits of this structure:**

1. **Run test types independently:**

   ```bash
   pnpm test:unit          # Fast, run locally
   pnpm test:integration   # Slower, run in CI
   pnpm test:e2e          # Slowest, run on PRs only
   ```

2. **Clear intent:** File location tells you what kind of test it is

3. **Easy CI configuration:**

   ```yaml
   - name: Unit tests
     run: pnpm --filter "@compilothq/*" test __tests__/unit
   - name: Integration tests
     run: pnpm --filter "@compilothq/*" test __tests__/integration
   ```

4. **Shared test utilities:** factories/ and utils/ available to all test types

5. **Build exclusion:** Automatically excluded from production builds

**Why NOT colocated:**

- Harder to run specific test types
- Mixing test and source code in same directory feels cluttered
- Monorepo benefits from standardized structure across packages

**Why NOT fully separated traditional:**

- Colocating within package maintains ownership
- Easier to share factories and utilities
- Package-level test configuration (vitest.config.ts per package)

---

### 4. Testing Database Strategy

**RECOMMENDATION: Docker Compose with dedicated test database (PostgreSQL 17)**

**Setup:**

Create `docker/docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:17-alpine
    container_name: compilot-postgres-test
    environment:
      POSTGRES_DB: compilot_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres_test
    ports:
      - '5433:5432' # Map to 5433 to avoid conflict with dev DB (5432)
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - postgres-test-data:/var/lib/postgresql/data

volumes:
  postgres-test-data:
```

**Test environment variables (.env.test):**

```bash
DATABASE_URL="postgresql://postgres:postgres_test@localhost:5433/compilot_test?schema=public"
NODE_ENV="test"
```

**Test database utilities (packages/database/**tests**/utils/test-db.ts):**

```typescript
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

export async function setupTestDatabase() {
  // Run migrations on test database
  execSync('pnpm prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  })
}

export async function teardownTestDatabase() {
  await prisma.$disconnect()
}

export async function clearDatabase() {
  // Delete all data in reverse dependency order
  const tables = [
    'Country',
    'DataNature',
    'ProcessingAct',
    'TransferMechanism',
    'RecipientCategory',
    'User',
  ]

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
  }
}

export { prisma }
```

**Test setup (vitest.setup.ts):**

```typescript
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { setupTestDatabase, teardownTestDatabase, clearDatabase } from './__tests__/utils/test-db'

beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await teardownTestDatabase()
})

beforeEach(async () => {
  await clearDatabase() // Clean slate for each test
})
```

**Why Docker Compose (not SQLite):**

- ✅ **Production parity:** PostgreSQL 17 in both dev and test
- ✅ **Feature coverage:** Tests actual PostgreSQL features (JSON queries, etc.)
- ✅ **Simple setup:** One `docker compose -f docker-compose.test.yml up -d`
- ✅ **CI support:** GitHub Actions has native Docker Compose support
- ✅ **Already using it:** Leverage existing Docker setup

**Why NOT SQLite:**

- ❌ Different SQL dialect (Prisma abstracts some, but not all)
- ❌ Missing PostgreSQL features (JSON operators, full-text search, etc.)
- ❌ Different performance characteristics
- ❌ Risk: Tests pass with SQLite but fail in production PostgreSQL

**Why NOT PGLite (yet):**

- ⚠️ Released June 2025, very new (wait for maturity)
- ⚠️ WebAssembly implementation may have edge case differences
- ✅ Reconsider in 6-12 months once ecosystem stabilizes

**Local development workflow:**

```bash
# Terminal 1: Start test database
docker compose -f docker/docker-compose.test.yml up

# Terminal 2: Run tests
pnpm test:integration
```

**CI workflow:**

```yaml
services:
  postgres:
    image: postgres:17-alpine
    env:
      POSTGRES_PASSWORD: postgres_test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
```

---

### 5. E2E Test Scope

**RECOMMENDATION: 5-10 critical user flows (strategic, not comprehensive)**

**Must-Have E2E Tests (Implement in Phase 4):**

**1. Authentication Flow** (Priority: CRITICAL)

```typescript
// __tests__/e2e/auth.spec.ts
test('User can sign up, verify email, and log in', async ({ page }) => {
  // Sign up → Email verification → Login → Dashboard
  // Covers: Auth.js flow, session management, email integration
})

test('User can reset forgotten password', async ({ page }) => {
  // Request reset → Click email link → Set new password → Login
  // Covers: Password reset flow, token validation
})

test('Session persists across page reloads', async ({ page }) => {
  // Login → Reload → Still logged in
  // Covers: Cookie/session persistence
})
```

**2. Discovery Questionnaire** (Priority: HIGH - Primary Entry Point)

```typescript
// __tests__/e2e/questionnaire.spec.ts
test('User completes discovery questionnaire end-to-end', async ({ page }) => {
  // Start → Answer all questions → Review → Submit → See recommendations
  // Covers: Form state management, validation, conditional logic, data persistence
})

test('User saves progress and resumes later', async ({ page }) => {
  // Start → Answer 3 questions → Save → Logout → Login → Resume → Complete
  // Covers: Draft saving, state restoration
})

test('User sees validation errors for invalid answers', async ({ page }) => {
  // Enter invalid data → See error messages → Correct → Submit successfully
  // Covers: Client-side and server-side validation
})
```

**3. Document Generation** (Priority: CRITICAL - Core Value Proposition)

```typescript
// __tests__/e2e/document-generation.spec.ts
test('User generates GDPR compliance document', async ({ page }) => {
  // Select template → Fill required fields → Preview → Generate → Download Word
  // Covers: Template rendering, docxtemplater, file download
})

test('User generates PDF compliance report', async ({ page }) => {
  // Configure report → Generate → Download PDF → Verify content
  // Covers: PDF generation with Puppeteer
})

test('Document generation handles missing data gracefully', async ({ page }) => {
  // Attempt generation with incomplete data → See helpful error → Complete data → Retry
  // Covers: Error handling, user guidance
})
```

**4. Processing Activity Management** (Priority: HIGH - Core Feature)

```typescript
// __tests__/e2e/processing-activities.spec.ts
test('User creates and manages processing activity', async ({ page }) => {
  // Create activity → Add data categories → Link processors → Add legal basis → Save
  // Covers: Multi-step form, relationships, data persistence
})

test('User views processing activity list with filters', async ({ page }) => {
  // Navigate to list → Apply filters → Sort → Paginate → View details
  // Covers: Table functionality, TanStack Table, filtering
})
```

**5. Compliance Dashboard** (Priority: MEDIUM - Business Intelligence)

```typescript
// __tests__/e2e/compliance-dashboard.spec.ts
test('User views compliance dashboard with risk metrics', async ({ page }) => {
  // Login → Dashboard loads → See risk charts → Drill into details
  // Covers: Dashboard rendering, data visualization, navigation
})
```

**Nice-to-Have (Defer to Phase 5 or later):**

- Advanced search across all compliance documents
- Bulk operations (bulk delete, bulk export)
- Settings/preferences management (can test via API)
- Admin user management (low priority for MVP)
- Notification preferences

**Why ONLY 5-10 tests:**

- E2E tests are slow (each test: 30-60 seconds)
- E2E tests are brittle (UI changes break them)
- E2E tests are expensive to maintain
- Most bugs should be caught by unit/integration tests
- E2E tests validate "happy paths" and critical error states only

**Performance target:**

- 10 E2E tests × 60 seconds = 10 minutes (sequential)
- With 3x parallelization = ~3-4 minutes
- Acceptable for PR checks

**Playwright configuration:**

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 3 : 5, // More workers locally
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium', // Start with Chromium only
      use: { ...devices['Desktop Chrome'] },
    },
    // Add Firefox/Safari later if needed
  ],
})
```

---

### 6. Mock Data Strategy

**RECOMMENDATION: Shared factory pattern with Fishery + Faker.js**

**Implementation:**

**Step 1: Install dependencies**

```bash
pnpm add -D -w fishery @faker-js/faker
```

**Step 2: Create factories (packages/database/**tests**/factories/)**

```typescript
// packages/database/__tests__/factories/country.factory.ts
import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import type { Country } from '@prisma/client'

export const CountryFactory = Factory.define<Country>(({ sequence, params }) => ({
  id: params.id ?? `country_${sequence}`,
  name: params.name ?? faker.location.country(),
  isoCode: params.isoCode ?? faker.location.countryCode('alpha-2'),
  isoCode3: params.isoCode3 ?? faker.location.countryCode('alpha-3'),
  gdprStatus: params.gdprStatus ?? ['Third Country'],
  description: params.description ?? faker.lorem.sentence(),
  isActive: params.isActive ?? true,
  createdAt: params.createdAt ?? new Date(),
  updatedAt: params.updatedAt ?? new Date(),
}))

// Predefined variants for common scenarios
export const EUCountryFactory = CountryFactory.params({
  gdprStatus: ['EU', 'EEA'],
})

export const AdequateCountryFactory = CountryFactory.params({
  gdprStatus: ['Third Country', 'Adequate'],
})
```

```typescript
// packages/database/__tests__/factories/index.ts
export { CountryFactory, EUCountryFactory, AdequateCountryFactory } from './country.factory'
export { DataNatureFactory } from './dataNature.factory'
export { ProcessingActFactory } from './processingAct.factory'
export { UserFactory } from './user.factory'
// ... export all factories
```

**Step 3: Use in tests**

```typescript
// packages/database/__tests__/unit/dal/countries.test.ts
import { describe, it, expect, vi } from 'vitest'
import { CountryFactory, EUCountryFactory } from '../../factories'
import { getCountriesByGdprStatus } from '../../../src/dal/countries'

describe('getCountriesByGdprStatus', () => {
  it('filters countries by EU status', async () => {
    // Arrange: Create test data
    const euCountries = EUCountryFactory.buildList(3)
    const thirdCountries = CountryFactory.buildList(2, { gdprStatus: ['Third Country'] })

    vi.mocked(prisma.country.findMany).mockResolvedValue([...euCountries, ...thirdCountries])

    // Act
    const result = await getCountriesByGdprStatus('EU')

    // Assert
    expect(result).toHaveLength(3)
    expect(result).toEqual(expect.arrayContaining(euCountries))
  })

  it('handles empty gdprStatus arrays', async () => {
    const countryWithEmptyStatus = CountryFactory.build({ gdprStatus: [] })
    vi.mocked(prisma.country.findMany).mockResolvedValue([countryWithEmptyStatus])

    const result = await getCountriesByGdprStatus('EU')

    expect(result).toHaveLength(0) // Empty array should not match 'EU'
  })
})
```

**Step 4: Integration test with real DB**

```typescript
// packages/database/__tests__/integration/dal/countries.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { CountryFactory, EUCountryFactory } from '../../factories'
import { getCountriesByGdprStatus } from '../../../src/dal/countries'
import { prisma, clearDatabase } from '../../utils/test-db'

describe('getCountriesByGdprStatus (integration)', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  it('filters countries from real database', async () => {
    // Arrange: Insert into real database
    const euCountries = await Promise.all(
      EUCountryFactory.buildList(3).map((country) => prisma.country.create({ data: country }))
    )

    await Promise.all(
      CountryFactory.buildList(2, { gdprStatus: ['Third Country'] }).map((country) =>
        prisma.country.create({ data: country })
      )
    )

    // Act: Query real database
    const result = await getCountriesByGdprStatus('EU')

    // Assert: Verify real results
    expect(result).toHaveLength(3)
    expect(result.map((c) => c.id)).toEqual(expect.arrayContaining(euCountries.map((c) => c.id)))
  })
})
```

**Why Fishery:**

- ✅ Type-safe: TypeScript checks factory definitions
- ✅ Flexible: Easy overrides per test
- ✅ Variants: Predefined scenarios (EU countries, special data, etc.)
- ✅ DRY: One source of truth for test data

**Why NOT inline test data:**

- ❌ Duplication across tests
- ❌ Schema changes break many tests
- ❌ Harder to maintain
- ❌ Less realistic data

**Factory organization:**

```
packages/database/__tests__/factories/
├── index.ts                    # Barrel export
├── country.factory.ts
├── dataNature.factory.ts
├── processingAct.factory.ts
├── transferMechanism.factory.ts
├── recipientCategory.factory.ts
└── user.factory.ts

apps/web/test-utils/factories/
├── index.ts
├── processingActivity.factory.ts  # Domain models (if different from DB models)
└── questionnaire.factory.ts
```

**Shared across packages:**

- All packages can import from `@compilothq/database/__tests__/factories`
- Add to `package.json` exports if needed

---

### 7. CI/CD Integration

**RECOMMENDATION: Tiered testing in GitHub Actions (unit always, integration on PR, E2E on PR)**

**Workflow structure:**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Job 1: Unit tests (FAST - run on every push and PR)
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit
        env:
          NODE_ENV: test

      - name: Upload unit coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/unit/lcov.info
          flags: unit
          name: unit-coverage

  # Job 2: Integration tests (MEDIUM - run on every PR, optional on push)
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'

    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: compilot_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run migrations
        run: pnpm --filter @compilothq/database prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres_test@localhost:5433/compilot_test

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres_test@localhost:5433/compilot_test
          NODE_ENV: test

      - name: Upload integration coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/integration/lcov.info
          flags: integration
          name: integration-coverage

  # Job 3: E2E tests (SLOW - run only on PRs)
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: compilot_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm --filter @compilothq/web playwright install --with-deps chromium

      - name: Run migrations
        run: pnpm --filter @compilothq/database prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres_test@localhost:5433/compilot_test

      - name: Build Next.js app
        run: pnpm --filter @compilothq/web build
        env:
          DATABASE_URL: postgresql://postgres:postgres_test@localhost:5433/compilot_test

      - name: Run E2E tests
        run: pnpm --filter @compilothq/web test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres_test@localhost:5433/compilot_test
          NEXTAUTH_URL: http://localhost:3000
          NEXTAUTH_SECRET: test_secret_key_for_ci

      - name: Upload Playwright artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 7

      - name: Upload E2E coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/e2e/lcov.info
          flags: e2e
          name: e2e-coverage

  # Job 4: Coverage report (combine all coverage)
  coverage-report:
    name: Coverage Report
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests]
    if: github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v4

      - name: Download all coverage reports
        uses: actions/download-artifact@v4

      - name: Merge coverage reports
        run: npx nyc merge coverage coverage/merged.json

      - name: Check coverage thresholds
        run: npx nyc check-coverage --lines 80 --functions 80 --branches 80

      - name: Comment PR with coverage
        uses: codecov/codecov-action@v4
        with:
          flags: all
          name: combined-coverage

  # Job 5: Lint and type check
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run TypeScript type check
        run: pnpm type-check
```

**Package.json scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run __tests__/unit",
    "test:integration": "vitest run __tests__/integration",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit"
  }
}
```

**Why this structure:**

✅ **Fast feedback on every push:**

- Unit tests run in ~10-30 seconds
- Developers get immediate feedback
- Low CI cost (no database, no browser)

✅ **Comprehensive testing on PRs:**

- Integration tests ensure DB logic works
- E2E tests validate critical flows
- Coverage reports show gaps

✅ **Cost optimization:**

- E2E only on PRs (saves CI minutes on feature branch pushes)
- Can skip E2E on draft PRs (add `if: github.event.pull_request.draft == false`)

✅ **Parallel execution:**

- All jobs run in parallel (fast overall time)
- Unit, integration, lint can run simultaneously

✅ **Branch protection:**

- Require `unit-tests` to pass before merge (always)
- Require `integration-tests` to pass on PRs
- Require `lint` to pass

**Alternative: Run integration on every push (if team prefers)**

Change `if:` condition:

```yaml
if: always() # Run on all pushes and PRs
```

**Future optimization: Affected tests only**

With Nx or Turborepo:

```yaml
- name: Run affected tests
  run: pnpm nx affected --target=test --base=origin/main
```

Only tests packages that changed (huge time savings in large monorepos).

---

### 8. What's Out of Scope

**RECOMMENDATION: Explicitly defer these to save time and reduce complexity**

**Defer Indefinitely (or until specific need arises):**

1. **Third-Party API Integration Tests**
   - ❌ Don't test Resend email sending in CI
   - ❌ Don't test S3/MinIO file uploads to real buckets
   - ❌ Don't test external GDPR data sources
   - ✅ DO mock these with MSW or vi.mock()
   - **Rationale:** Slow, flaky, requires credentials, external dependency

   **Exception:** Can add "smoke tests" that run nightly:

   ```yaml
   # .github/workflows/smoke-tests.yml
   on:
     schedule:
       - cron: '0 2 * * *' # 2 AM daily
   ```

2. **Storybook Visual Regression Testing**
   - ❌ Don't set up Chromatic or Percy initially
   - ✅ DO use Storybook for component development (no tests)
   - **Rationale:** Component library is nascent, high maintenance burden
   - **Future:** Add after components are stable (6+ months)

3. **Performance/Load Testing**
   - ❌ Don't test API response times under load
   - ❌ Don't run k6 or Artillery scenarios
   - **Rationale:** Premature optimization, handle after MVP launch
   - **Future:** Add if performance issues arise

4. **Database Query Performance Benchmarks**
   - ❌ Don't measure query execution time in tests
   - ✅ DO use Prisma's logging to spot slow queries in dev
   - **Rationale:** Database is small, optimize when needed
   - **Future:** Add when dataset grows (10k+ records)

5. **Mutation Testing**
   - ❌ Don't use Stryker or similar mutation testing tools
   - **Rationale:** Extremely time-consuming, diminishing returns
   - **Future:** Consider for critical compliance logic only

6. **Cross-Browser E2E (initially)**
   - ❌ Don't test Firefox, Safari in E2E suite
   - ✅ DO test Chromium only (90% of enterprise users)
   - **Rationale:** Reduce test time, focus on functionality first
   - **Future:** Add Firefox/Safari after stable E2E suite (1-2 browsers at a time)

7. **Mobile Responsive E2E**
   - ❌ Don't test mobile viewports in E2E
   - ✅ DO use Playwright's responsive testing for critical flows only
   - **Rationale:** Desktop-first product, defer mobile until needed

8. **Accessibility Audits (manual)**
   - ❌ Don't do manual WCAG audits yet
   - ✅ DO add automated axe-core checks in component tests:

   ```typescript
   import { axe, toHaveNoViolations } from 'jest-axe'
   expect.extend(toHaveNoViolations)

   it('should not have accessibility violations', async () => {
     const { container } = render(<MyComponent />)
     const results = await axe(container)
     expect(results).toHaveNoViolations()
   })
   ```

   - **Rationale:** Automated catches 30-40% of issues cheaply

**Explicitly Mock (Don't Test Real Integrations):**

| Service              | How to Mock         | Library                   |
| -------------------- | ------------------- | ------------------------- |
| **Resend email**     | Mock API calls      | MSW (Mock Service Worker) |
| **S3/MinIO storage** | In-memory store     | Custom mock or memfs      |
| **Auth.js sessions** | Mock session object | vi.mock()                 |
| **External APIs**    | Mock responses      | MSW                       |
| **Date/time**        | Freeze time         | vi.setSystemTime()        |

**Example MSW setup:**

```typescript
// apps/web/test-utils/msw/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Resend email API
  http.post('https://api.resend.com/emails', () => {
    return HttpResponse.json({ id: 'mock_email_id', success: true })
  }),

  // Mock S3 upload
  http.put('https://s3.amazonaws.com/*', () => {
    return HttpResponse.json({ ETag: 'mock_etag' })
  }),
]
```

**Why mock third-party services:**

- ✅ Tests run offline
- ✅ No rate limiting or costs
- ✅ Deterministic outcomes
- ✅ Fast execution
- ✅ No test data pollution in production services

---

### 9. Existing Code Reuse

**FINDING: No existing test code to reuse**

**Current state:**

- ❌ No test files exist anywhere in codebase
- ❌ No test utilities or helper functions
- ❌ No mock data or fixture patterns
- ❌ No CI/CD test workflows
- ✅ Testing philosophy documented (but not implemented)
- ✅ Docker infrastructure exists (can leverage for tests)

**What this means:**

**Advantages:**

1. **Greenfield implementation** - Can use 2025 best practices without migration
2. **No legacy patterns** - No bad patterns to refactor
3. **Consistent structure** - Establish conventions from day one
4. **Modern tooling** - Use latest Vitest 4.0, Playwright, etc.

**Challenges:**

1. **No examples to follow** - Must create patterns from scratch
2. **Team learning curve** - May need training on testing practices
3. **More upfront work** - Can't copy-paste existing patterns

**Recommendations:**

**1. Reference these external examples:**

**T3 Stack (Next.js + tRPC + Prisma):**

- GitHub: https://github.com/t3-oss/create-t3-app
- Has testing examples for this exact stack
- Look at their test utilities for tRPC

**Next.js Official Examples:**

- https://github.com/vercel/next.js/tree/canary/examples/with-vitest
- https://github.com/vercel/next.js/tree/canary/examples/with-playwright

**tRPC Testing Discussions:**

- https://github.com/trpc/trpc/discussions/3612
- https://trpc.io/docs/v11/server/server-side-calls

**Prisma Integration Testing:**

- https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing
- https://www.prisma.io/blog/testing-series-3-aBUyF8nxAn

**2. Create template files first:**

**Starter template structure:**

```
compilothq/
├── .github/
│   └── workflows/
│       └── ci.yml                    # ← Create this first (CI template)
│
├── packages/database/
│   ├── __tests__/
│   │   ├── unit/
│   │   │   └── dal/
│   │   │       └── countries.test.ts  # ← Template for DAL unit tests
│   │   ├── integration/
│   │   │   └── dal/
│   │   │       └── countries.integration.test.ts  # ← Template for DAL integration
│   │   ├── factories/
│   │   │   ├── index.ts
│   │   │   └── country.factory.ts    # ← Template for factories
│   │   └── utils/
│   │       ├── test-db.ts            # ← Template for DB utilities
│   │       └── test-helpers.ts       # ← Template for common helpers
│   └── vitest.config.ts              # ← Template for Vitest config
│
├── apps/web/
│   ├── __tests__/
│   │   ├── unit/
│   │   │   └── components/
│   │   │       └── Button.test.tsx   # ← Template for component tests
│   │   ├── integration/
│   │   │   └── server/routers/
│   │   │       └── activity.test.ts  # ← Template for tRPC tests
│   │   └── e2e/
│   │       └── auth.spec.ts          # ← Template for E2E tests
│   ├── test-utils/
│   │   ├── trpc-test-utils.ts        # ← Template for tRPC test helpers
│   │   ├── auth-test-utils.ts        # ← Template for auth mocking
│   │   └── msw/
│   │       └── handlers.ts           # ← Template for MSW mocks
│   ├── vitest.config.ts
│   └── playwright.config.ts
│
├── vitest.workspace.ts               # ← Monorepo workspace config
└── docker/
    └── docker-compose.test.yml       # ← Test database config
```

**3. Document conventions as you create them:**

Create `agent-os/standards/testing/testing-conventions.md`:

```markdown
# Testing Conventions

## Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.spec.ts`

## Structure

- Unit tests: `__tests__/unit/`
- Integration tests: `__tests__/integration/`
- E2E tests: `__tests__/e2e/`

## Factories

- One factory per Prisma model
- Export from `__tests__/factories/index.ts`
- Use descriptive variants: `EUCountryFactory`, `SpecialDataNatureFactory`

## Test utilities

- Database helpers: `__tests__/utils/test-db.ts`
- tRPC helpers: `test-utils/trpc-test-utils.ts`
- Auth helpers: `test-utils/auth-test-utils.ts`

[... more conventions ...]
```

**4. Establish patterns incrementally:**

**Week 1:** Create first unit test + factory → This becomes the template
**Week 2:** Create first integration test → This becomes the template
**Week 3:** Create first tRPC test → This becomes the template
**Week 4:** Create first E2E test → This becomes the template

**Each template is then reused** for subsequent tests of that type.

---

## Visual Assets Request

**QUESTION: Do you have design mockups, wireframes, or screenshots?**

**If yes:** Please place them in:

```
/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-11-09-comprehensive-testing-suite/planning/visuals/
```

**Useful visual assets for testing planning:**

1. **Questionnaire flow diagrams**
   - Shows conditional question logic
   - Helps identify E2E test scenarios

2. **Document generation mockups**
   - Shows expected output formats
   - Helps define test assertions

3. **Dashboard wireframes**
   - Shows data visualizations
   - Helps scope E2E dashboard tests

4. **User flow diagrams**
   - Shows critical user journeys
   - Maps directly to E2E test scenarios

**If no visuals exist yet:**

- Perfectly fine to proceed without them
- Can define tests based on requirements and user stories
- Visual tests (Storybook snapshots) are out of scope anyway

---

## Summary: Recommended Approach

**Start here:**

1. ✅ **Testing Layer Priority:** Incremental (Foundation → Unit → Integration → API → E2E)
2. ✅ **Coverage Targets:** Risk-based (95-100% critical, 85-90% API, 90-95% DAL, 60-70% UI)
3. ✅ **Test Organization:** Separated by type (`__tests__/unit`, `__tests__/integration`, `__tests__/e2e`)
4. ✅ **Database Strategy:** Docker Compose with PostgreSQL 17 test database
5. ✅ **E2E Scope:** 5-10 critical flows (auth, questionnaire, docs, activities, dashboard)
6. ✅ **Mock Data:** Fishery factories + Faker.js (shared across packages)
7. ✅ **CI/CD:** Unit on every push, integration on PR, E2E on PR only
8. ✅ **Out of Scope:** Third-party tests, Storybook visual tests, performance tests, mutation tests
9. ✅ **Existing Code:** None exists (greenfield opportunity, use external examples)

**Implementation timeline:**

- **Weeks 1-2:** Infrastructure + first unit tests
- **Weeks 3-4:** Integration tests for DAL
- **Weeks 5-6:** tRPC tests (as routers are built)
- **Weeks 7-10:** E2E tests (after core features exist)

**Total effort:** 90-130 hours (part-time over 10 weeks, or full-time 3-4 weeks)

---

## Next Steps

**Ready to proceed? Let me know if you want to:**

1. ✅ **Approve recommendations** → I'll create detailed implementation tasks
2. ❓ **Modify approach** → Discuss any changes to these recommendations
3. 📋 **See detailed tasks** → I can break down Phase 1 implementation into step-by-step tasks
4. 📊 **Review research** → See the full 400+ line research document I created

**Questions? Ask about:**

- Specific implementation details
- Tool choices and alternatives
- Timeline or effort estimates
- Team onboarding and training needs
- Any other testing concerns

I'm ready to help you build a world-class testing suite for Compilot HQ!
