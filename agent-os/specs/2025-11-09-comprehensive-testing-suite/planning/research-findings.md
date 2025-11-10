# Comprehensive Testing Strategy Research Findings

**Date:** 2025-11-09
**Project:** Compilot HQ
**Research Scope:** Testing best practices for Next.js 16 + tRPC + Prisma + pnpm monorepo

---

## Executive Summary

This document synthesizes cutting-edge testing research from 2025 with deep analysis of the Compilot HQ codebase to provide data-driven recommendations for implementing a comprehensive testing suite. The project currently has **zero testing infrastructure** despite being a GDPR compliance platform where correctness is critical.

**Key Finding:** The project is perfectly positioned for a greenfield testing implementation using modern best practices without legacy constraints.

---

## Current State Analysis

### What Exists

**Infrastructure:**

- Docker Compose with PostgreSQL 17 + Redis (can be leveraged for integration tests)
- Husky git hooks (can run tests pre-commit)
- TypeScript strict mode with "coverage" directory exclusion (anticipating reports)
- pnpm monorepo structure with clear separation of concerns

**Code Requiring Tests:**

- ✅ **DAL Functions** (5 modules): countries, dataNatures, processingActs, transferMechanisms, recipientCategories
- ✅ **Prisma Schema**: 6 models with GDPR-specific constraints
- ⏳ **tRPC Routers** (6 files): Mostly empty stubs (activity, control, dataCategory, processor, risk)
- ⏳ **Validation Schemas**: Placeholder structure exists but no actual schemas yet
- ⏳ **Frontend Components**: App Router structure exists, components to be built

**Documentation:**

- Testing philosophy documented in `agent-os/standards/testing/test-writing.md`
- Claude Code skill for test-writing exists
- Tech stack declares Vitest, Playwright, Storybook (none installed)

### What Doesn't Exist

- ❌ No test files anywhere in the codebase
- ❌ No testing dependencies installed (Vitest, Playwright, @testing-library/\*)
- ❌ No test configuration files (vitest.config.ts, playwright.config.ts)
- ❌ No CI/CD workflows for running tests
- ❌ No test utilities, fixtures, or factories
- ❌ No test database configuration

---

## 2025 Testing Landscape Research

### 1. Tool Evolution

**Vitest 4.0 (Latest - 2025)**

- Visual regression testing support
- Stable Browser Mode for DOM testing
- Playwright Traces integration
- 2-5x faster than Jest with native ESM/TypeScript support
- **Verdict:** Clear industry winner for unit/component testing in 2025

**Playwright (Mature)**

- Cross-browser E2E testing (Chromium, Firefox, WebKit)
- Industry standard for Next.js E2E tests
- Official Next.js documentation recommends it
- **Verdict:** Essential for E2E testing

**PGLite (New 2025 Innovation)**

- Full PostgreSQL via WebAssembly
- In-memory execution for blazing-fast integration tests
- Alternative to TestContainers for local development
- **Consideration:** Emerging technology, may trade production parity for speed

### 2. Testing Architecture Patterns

**Testing Pyramid (2025 Consensus)**

```
        /\
       /E2E\          5-10% of tests (critical user journeys)
      /------\
     /  INT   \       20-30% of tests (API + DB integration)
    /----------\
   /   UNIT     \     60-75% of tests (business logic)
  /--------------\
```

**Key Principles:**

- Most testing value comes from unit tests (fast, focused, reliable)
- Integration tests validate component interactions
- E2E tests guard critical revenue/compliance paths only
- **Anti-pattern:** Treating E2E as primary verification method

**Performance Targets (2025):**

- Unit tests: <5ms per test (milliseconds)
- Integration tests: <100ms per test
- Full E2E suite: <30 minutes (with parallelization)

### 3. Next.js 16 Specific Considerations

**Breaking Changes Affecting Tests:**

- Async Request APIs: All `params`, `searchParams`, `cookies()`, `headers()` are now async
- Must use `await` in test setup: `const { id } = await params`
- Proxy.ts replaces middleware.ts (affects auth flow testing)
- Turbopack is default (faster builds but test configs may need updates)

**Testing Recommendations:**

- Vitest for Server Components (including async ones)
- React Testing Library for Client Components
- Playwright for full user flows
- Mock async APIs correctly: `vi.mock()` must handle async nature

### 4. tRPC Testing Strategies

**Official Pattern:**

```typescript
// Use createCallerFactory for integration tests
const createCaller = t.createCallerFactory(appRouter)
const caller = createCaller(mockContext)
const result = await caller.procedure.query(input)
```

**Best Practices:**

- **Unit tests**: Test individual procedures with mocked DAL
- **Integration tests**: Test routers with real database (test container)
- **Avoid**: Mocking `useQuery`/`useMutation` (has 20+ properties to mock)
- **Prefer**: Mount real `TRPCProvider` with test server for component tests

**Protected Procedures:**

- Must mock session/auth context
- Create test utilities for common auth scenarios

### 5. Prisma Testing Database Strategies

**Four Main Approaches (2025):**

| Approach             | Speed     | Production Parity | Complexity | 2025 Trend           |
| -------------------- | --------- | ----------------- | ---------- | -------------------- |
| **TestContainers**   | Medium    | High              | Medium     | ⭐ Most Popular      |
| **Docker Compose**   | Medium    | High              | Low        | ⭐ Simple & Reliable |
| **Schema Isolation** | Fast      | High              | High       | Niche use case       |
| **PGLite**           | Very Fast | Medium            | Low        | 🆕 Emerging          |

**Recommendation for Compilot HQ:**

1. **Primary:** Docker Compose with dedicated test database
   - Already have docker-compose.yml
   - Add `postgres-test` service on port 5433
   - Fast enough, production parity, simple setup

2. **Future consideration:** PGLite for local dev speed
   - Wait for ecosystem maturity (released June 2025)
   - Evaluate after Docker setup is working

**Test Database Pattern:**

```typescript
// beforeAll: Run migrations on test DB
// beforeEach: Truncate tables or use transactions
// afterEach: Rollback transaction
// afterAll: Cleanup
```

### 6. Coverage Thresholds (Industry Research)

**Google's Internal Standards:**

- 60% = Acceptable
- 75% = Commendable
- 90% = Exemplary

**2025 Risk-Based Approach:**

- **Critical business logic:** 95-100% coverage (validation, compliance calculations, document generation)
- **API layer:** 80-90% coverage (tRPC procedures, Server Actions)
- **DAL functions:** 90-95% coverage (data integrity critical)
- **UI components:** 60-70% coverage (focus on critical user interactions)
- **Utilities:** 75-85% coverage

**80/20 Rule Still Applies:**

- 80% coverage catches most bugs
- Last 20% has diminishing returns (except for critical paths)

**For GDPR Compliance Platform:**

- Compliance logic demands near-100% coverage
- Financial/legal risk justifies higher investment
- Document generation = revenue protection = high coverage

### 7. Test Organization (Monorepo)

**Two Competing Philosophies:**

**A. Colocated Tests** (Trending in 2025)

```
packages/database/src/
  ├── dal/
  │   ├── countries.ts
  │   └── countries.test.ts       ← Next to source
```

**Pros:** Tests stay in sync with code, easier refactoring, clear ownership
**Cons:** Mixing test/prod code in same directory

**B. Separate Test Directories** (Traditional)

```
packages/database/
  ├── src/dal/countries.ts
  └── tests/
      └── dal/countries.test.ts   ← Mirrored structure
```

**Pros:** Clean separation, easy to exclude from builds
**Cons:** Navigation overhead, can drift from source

**Opinionated Monorepo Pattern (Recommended):**

```
packages/database/
  ├── src/
  │   └── dal/countries.ts
  └── __tests__/
      ├── unit/
      │   └── dal/countries.test.ts
      └── integration/
          └── dal/countries.integration.test.ts
```

**Benefits:**

- Separation by test type (unit vs integration)
- Easy to run groups: `vitest run __tests__/unit`
- Clear structure for CI (unit local, integration in CI)

### 8. Mock Data Strategy

**Factory Pattern (2025 Best Practice):**

**Popular Libraries:**

- **Fishery** (TypeScript-native, ORM-agnostic, 2025 favorite)
- **Faker.js** (realistic fake data generation)
- **MSW** (Mock Service Worker for API mocking)

**Pattern:**

```typescript
// test-factories/country.factory.ts
import { Factory } from 'fishery'
import type { Country } from '@prisma/client'

export const CountryFactory = Factory.define<Country>(({ sequence }) => ({
  id: `country_${sequence}`,
  name: faker.location.country(),
  isoCode: faker.location.countryCode(),
  gdprStatus: ['EU', 'EEA'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}))

// In tests:
const country = CountryFactory.build() // One-off
const countries = CountryFactory.buildList(5) // Batch
const euCountry = CountryFactory.build({ gdprStatus: ['EU'] }) // Override
```

**Advantages:**

- Type-safe (catches breaking changes during refactoring)
- DRY (centralized test data definitions)
- Flexible (easy overrides for specific test cases)
- Maintainable (one place to update when schema changes)

**Recommendation:**

- Use Fishery for Prisma model factories
- Use Faker for realistic data generation
- Store factories in `packages/database/__tests__/factories/`
- Share factories across all test types

### 9. E2E Testing Scope

**2025 Best Practice: Strategic, Not Comprehensive**

**Critical User Journeys Only:**

- E2E tests are slow, brittle, and expensive to maintain
- Focus on high-value, high-risk flows
- Push as much testing as possible down to unit/integration

**For Compilot HQ (GDPR Platform):**

**Must-Have E2E Tests (5-10 scenarios):**

1. **Authentication Flow**
   - Sign up → Email verification → Login → Logout
   - Password reset flow
   - Session persistence

2. **Discovery Questionnaire** (Primary Entry Point)
   - Start questionnaire → Answer questions → Save progress
   - Complete questionnaire → Generate recommendations
   - Edge case: Abandon and resume questionnaire

3. **Document Generation** (Core Value Proposition)
   - Configure document → Preview → Generate Word/PDF
   - Download and verify content
   - Edge case: Generation failure/retry

4. **Processing Activity Management** (Core GDPR Feature)
   - Create activity → Add data categories → Add processors
   - Link to legal bases → Save draft → Submit for review

5. **Compliance Dashboard** (Business-Critical View)
   - Load dashboard → View risk metrics → Navigate to details
   - Filter/sort activities → Export report

**Nice-to-Have E2E Tests (Defer to Phase 2):**

- Advanced search/filtering
- Bulk operations
- Settings/preferences management
- Admin user management

**Performance Target:**

- Keep E2E suite under 10 tests initially
- Run time: <15 minutes with parallelization
- Can expand later based on failure patterns

### 10. CI/CD Testing Strategy

**2025 GitHub Actions Best Practices:**

**Recommended Workflow Structure:**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [24.x]
    steps:
      - name: Run unit tests
        run: pnpm test:unit
      # Fast, runs on every push/PR

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - name: Run integration tests
        run: pnpm test:integration
      # Runs on every PR (not just pushes to feature branches)

  e2e-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Run E2E tests
        run: pnpm test:e2e
      # Only on PRs to save CI minutes

  coverage:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Upload coverage
        uses: codecov/codecov-action@v3
      # Coverage reports on PRs only
```

**Key Strategies:**

1. **Run tests on `pull_request` events** (not just `push`)
   - Tests changes merged with main branch
   - Works for external contributors

2. **Separate jobs for test types**
   - Unit tests: Fast, every push/PR
   - Integration tests: Medium speed, every PR
   - E2E tests: Slow, PRs only (or scheduled nightly)

3. **Use caching**
   - `actions/cache` for pnpm dependencies
   - Cache Playwright browsers
   - Speeds up subsequent runs 50-70%

4. **Matrix builds** (future consideration)
   - Test against Node 20.x and 22.x
   - Test on Ubuntu and Windows (if users on both)

5. **Branch protection rules**
   - Require passing tests before merge
   - Require minimum coverage thresholds

**Optimization for monorepo:**

```yaml
- name: Run affected tests
  run: pnpm nx affected --target=test --base=origin/main
```

- Only test changed packages (requires Nx or Turborepo)
- Massive time savings in large monorepos

---

## Comparative Analysis: Testing Strategies

### Database Testing: Production Parity vs Speed

| Criteria                | Docker Compose            | TestContainers         | PGLite                        |
| ----------------------- | ------------------------- | ---------------------- | ----------------------------- |
| **Setup Time**          | One-time (5 min)          | Per-project (10 min)   | Install package (1 min)       |
| **Test Speed**          | ~50ms/test                | ~50ms/test             | ~5ms/test                     |
| **Production Parity**   | 100% (real PostgreSQL 17) | 100% (real PostgreSQL) | ~95% (WebAssembly PostgreSQL) |
| **CI/CD Support**       | Excellent (services)      | Excellent (native)     | Excellent (no deps)           |
| **Learning Curve**      | Low                       | Medium                 | Low                           |
| **Maintenance**         | Low                       | Low                    | Low                           |
| **PostgreSQL Features** | All features              | All features           | Core features only            |
| **Ecosystem Maturity**  | Very mature               | Very mature            | New (June 2025)               |

**Recommendation:** Start with Docker Compose (simple, mature, perfect parity), evaluate PGLite in 6 months as it matures.

### Test Organization: Colocated vs Separated

| Criteria              | Colocated                       | Separated by Type       | Traditional Separated |
| --------------------- | ------------------------------- | ----------------------- | --------------------- |
| **Navigation**        | ⭐⭐⭐⭐⭐ Instant              | ⭐⭐⭐⭐ Easy           | ⭐⭐⭐ Moderate       |
| **Refactoring**       | ⭐⭐⭐⭐⭐ Tests move with code | ⭐⭐⭐⭐ Easy to update | ⭐⭐⭐ Can drift      |
| **Selective Running** | ⭐⭐⭐ Need patterns            | ⭐⭐⭐⭐⭐ By directory | ⭐⭐⭐⭐ By directory |
| **Build Exclusion**   | ⭐⭐⭐ Need config              | ⭐⭐⭐⭐⭐ Automatic    | ⭐⭐⭐⭐⭐ Automatic  |
| **Monorepo Fit**      | ⭐⭐⭐ Good                     | ⭐⭐⭐⭐⭐ Excellent    | ⭐⭐⭐⭐ Good         |

**Recommendation:** Use separated-by-type (`__tests__/unit` and `__tests__/integration`) for the monorepo. Best balance of organization and selective execution.

---

## Critical Business Logic Inventory

### Current Implementation (Needs Tests Now)

**packages/database/src/dal/ (5 modules, ~150 LOC total)**

1. **countries.ts** (60 LOC)
   - `listCountries()` - Basic list with filtering
   - `getCountryById()` - Standard lookup
   - `getCountryByIsoCode()` - Unique constraint validation
   - `getCountryByIsoCode3()` - Unique constraint validation
   - `getCountriesByGdprStatus()` - **CRITICAL**: JSON array filtering logic (compliance-specific)

2. **dataNatures.ts** (Similar CRUD pattern)
3. **processingActs.ts** (Similar CRUD pattern)
4. **transferMechanisms.ts** (Similar CRUD pattern)
5. **recipientCategories.ts** (Similar CRUD pattern)

**Risk Assessment:**

- ⚠️ **HIGH RISK**: `getCountriesByGdprStatus()` uses application-level JSON filtering (not database-level)
  - Potential for incorrect compliance classifications
  - Should have 100% coverage with edge cases (empty arrays, missing keys, etc.)

- ⚠️ **MEDIUM RISK**: Unique constraint queries (isoCode, isoCode3)
  - Database handles uniqueness, but DAL should validate behavior

- ✅ **LOW RISK**: Basic CRUD operations (list, getById)
  - Standard patterns, lower coverage acceptable (80%)

### Future Implementation (Will Need Tests)

**Based on user questions and project structure:**

1. **Discovery Questionnaire Logic** (Not yet implemented)
   - Conditional question flow based on prior answers
   - Validation rules for answer combinations
   - **CRITICAL**: Incorrect logic could misclassify GDPR obligations
   - **Coverage Target:** 95%+

2. **Document Generation** (Not yet implemented)
   - Template population with user data
   - Compliance calculations and recommendations
   - Word/PDF generation
   - **CRITICAL**: Core revenue feature, legal accuracy required
   - **Coverage Target:** 90%+

3. **Validation Schemas** (Placeholder only)
   - Zod schemas for all input validation
   - **CRITICAL**: Security and data integrity
   - **Coverage Target:** 100% (all validation paths)

4. **tRPC Procedures** (Empty stubs)
   - Business logic layer
   - **Coverage Target:** 85% (API contract testing)

---

## Technology Stack Recommendations

### Testing Dependencies to Install

**Core Testing (Must Have):**

```json
{
  "devDependencies": {
    "vitest": "^4.0.0",
    "@vitest/ui": "^4.0.0",
    "playwright": "^1.48.0",
    "@playwright/test": "^1.48.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.1",
    "@testing-library/jest-dom": "^6.1.5",
    "jsdom": "^25.0.0"
  }
}
```

**Test Data & Mocking (Highly Recommended):**

```json
{
  "devDependencies": {
    "fishery": "^2.2.2",
    "@faker-js/faker": "^9.2.0",
    "msw": "^2.0.11"
  }
}
```

**Coverage & Reporting:**

```json
{
  "devDependencies": {
    "@vitest/coverage-v8": "^4.0.0"
  }
}
```

**tRPC Testing:**

```json
{
  "devDependencies": {
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2"
  }
}
```

### Configuration Files Needed

1. **vitest.config.ts** (root and per-package)
2. **playwright.config.ts** (apps/web)
3. **test-setup.ts** (global test setup for Vitest)
4. **msw/handlers.ts** (API mocking for component tests)
5. **.github/workflows/ci.yml** (GitHub Actions)

---

## Risk Analysis: What Happens Without Tests?

### GDPR Compliance Platform Risks

**Without comprehensive testing:**

1. **Legal Risk** (HIGH)
   - Incorrect compliance calculations could expose clients to GDPR fines (up to 4% global revenue)
   - Document generation errors could invalidate legal documentation
   - Data classification bugs could lead to unlawful data processing

2. **Revenue Risk** (HIGH)
   - Document generation is core value proposition
   - Bugs in critical path = customer churn
   - Manual testing cannot catch regressions at scale

3. **Development Velocity Risk** (MEDIUM)
   - Fear of breaking existing features slows development
   - Manual QA becomes bottleneck as features grow
   - Refactoring becomes risky without safety net

4. **Security Risk** (MEDIUM)
   - Validation schema bugs = potential injection attacks
   - Auth flow bugs = unauthorized access
   - Input handling bugs = XSS, SQL injection, etc.

### Current Risk Level: MODERATE → HIGH

- **Current code is simple** (DAL CRUD operations)
- **But:** Adding validation, questionnaire logic, document generation without tests = HIGH RISK
- **Conclusion:** Build testing infrastructure NOW before complexity grows

---

## Out of Scope (Explicit Non-Testing Decisions)

### What NOT to Test (Initially)

1. **Third-Party Integrations** (Mock Instead)
   - Resend email API → Mock with MSW
   - S3/MinIO file storage → Mock with in-memory store
   - External GDPR data sources → Mock with fixtures
   - **Rationale:** Tests should be fast and not depend on external services
   - **Future:** Add contract tests or dedicated integration test suite later

2. **Storybook Visual Regression** (Defer to Phase 2)
   - Chromatic or Percy for visual diffs
   - Requires stable component library first
   - Current focus: functionality over visual consistency
   - **Rationale:** Component library is still nascent, premature optimization

3. **Performance Testing** (Defer to Phase 2)
   - Load testing with k6 or Artillery
   - Database query performance benchmarks
   - **Rationale:** Premature optimization, handle after MVP

4. **Accessibility Testing** (Partial Deferral)
   - Manual accessibility audits → Defer
   - Automated axe-core checks → Include in component tests
   - **Rationale:** Axe-core is low overhead, manual audits come later

5. **Cross-Browser E2E** (Simplify Initially)
   - Playwright can test Chromium, Firefox, WebKit
   - Start with Chromium only (90% of enterprise users)
   - Add other browsers after stable suite
   - **Rationale:** Reduce test time and maintenance initially

6. **Mutation Testing** (Advanced Technique, Defer)
   - Tools like Stryker mutate code to test if tests catch changes
   - Extremely thorough but time-consuming
   - **Rationale:** Overkill for current stage, consider post-v1

### What to Mock vs. Test Real

| Component         | Mock or Real?           | Rationale                                          |
| ----------------- | ----------------------- | -------------------------------------------------- |
| **Database**      | Real (Docker)           | Critical to test queries against actual PostgreSQL |
| **Email sending** | Mock (MSW)              | Don't spam real emails in tests                    |
| **File storage**  | Mock (Memory)           | Avoid external S3 dependencies                     |
| **Auth sessions** | Real (test DB)          | Auth logic is critical, test real flow             |
| **External APIs** | Mock (MSW)              | Tests must be fast and reliable                    |
| **Date/time**     | Mock (vi.setSystemTime) | Consistent test results                            |
| **Crypto/UUIDs**  | Mock (seeded)           | Deterministic test data                            |

---

## Existing Patterns to Reference

### From Research: NO Existing Test Patterns in Codebase

**What this means:**

- ✅ Greenfield opportunity to implement best practices from day one
- ✅ No legacy test patterns to migrate or refactor
- ⚠️ No examples to follow, must establish conventions
- ⚠️ Team may need training on testing practices

### Recommended Pattern Sources

**1. tRPC Official Examples**

- GitHub: trpc/trpc
- `/examples/next-app-dir` has testing examples
- Use `createCallerFactory` pattern

**2. Prisma Testing Guide**

- Official docs: prisma.io/docs/guides/testing
- Integration testing patterns
- Transaction rollback strategies

**3. Next.js Testing Examples**

- Official repo: vercel/next.js
- `/examples/with-vitest` - Vitest setup
- `/examples/with-playwright` - E2E setup

**4. T3 Stack** (Similar to Compilot HQ)

- GitHub: t3-oss/create-t3-app
- Production-grade Next.js + tRPC + Prisma
- Has testing examples for this exact stack

---

## Recommended Testing Tools Comparison

### Unit Testing Frameworks

| Tool             | Speed      | DX         | TypeScript | ESM        | 2025 Adoption      |
| ---------------- | ---------- | ---------- | ---------- | ---------- | ------------------ |
| **Vitest**       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Growing fast       |
| Jest             | ⭐⭐⭐     | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐     | Still dominant     |
| Node Test Runner | ⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐⭐     | ⭐⭐⭐⭐   | Growing (built-in) |

**Verdict:** Vitest for Compilot HQ (Vite ecosystem, TypeScript-first, faster than Jest)

### E2E Testing Frameworks

| Tool           | Reliability | DX         | Multi-browser | 2025 Adoption     |
| -------------- | ----------- | ---------- | ------------- | ----------------- |
| **Playwright** | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐    | Industry standard |
| Cypress        | ⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐        | Still popular     |
| Selenium       | ⭐⭐⭐      | ⭐⭐       | ⭐⭐⭐⭐⭐    | Legacy            |

**Verdict:** Playwright (official Next.js recommendation, best multi-browser support)

### Component Testing Libraries

| Tool                | React 19 Support | DX         | Best For           |
| ------------------- | ---------------- | ---------- | ------------------ |
| **Testing Library** | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐ | User-centric tests |
| Enzyme              | ⭐⭐             | ⭐⭐⭐     | Legacy (avoid)     |

**Verdict:** @testing-library/react (de facto standard, aligns with React team recommendations)

---

## Implementation Complexity Estimates

### Phase 1: Foundation (Week 1-2)

**Effort:** 20-30 hours

- Install dependencies across monorepo
- Configure Vitest for each package
- Configure Playwright for apps/web
- Set up Docker Compose test database
- Create test utilities and helpers
- Document testing conventions

**Complexity:** Medium (config boilerplate, learning curve)

### Phase 2: DAL & Validation Tests (Week 3-4)

**Effort:** 15-20 hours

- Write unit tests for all existing DAL functions (5 modules × 3 hours)
- Create Prisma model factories with Fishery
- Set up integration tests for database operations
- Test critical GDPR logic (getCountriesByGdprStatus)

**Complexity:** Low-Medium (straightforward CRUD testing)

### Phase 3: tRPC & API Tests (Week 5-6)

**Effort:** 20-30 hours

- Set up tRPC test utilities (createCaller)
- Write integration tests for API routers (as they're built)
- Mock authentication contexts
- Test error handling and validation

**Complexity:** Medium (tRPC testing patterns have learning curve)

### Phase 4: Component & E2E Tests (Week 7-8)

**Effort:** 25-35 hours

- Set up React Testing Library for components
- Write tests for UI components (as they're built)
- Implement 5-10 critical E2E flows with Playwright
- Set up visual regression testing (optional)

**Complexity:** Medium-High (E2E tests can be brittle, need maintenance)

### Phase 5: CI/CD & Coverage (Week 9-10)

**Effort:** 10-15 hours

- Create GitHub Actions workflows
- Configure coverage reporting (Codecov or similar)
- Set up branch protection rules
- Add pre-commit hooks for running tests
- Tune performance and parallelization

**Complexity:** Medium (CI/CD config, credential management)

**Total Estimated Effort:** 90-130 hours over 10 weeks (part-time) or 3-4 weeks (full-time)

---

## Recommended File Structure (Post-Implementation)

```
compilothq/
├── packages/
│   ├── database/
│   │   ├── src/
│   │   │   ├── dal/
│   │   │   │   ├── countries.ts
│   │   │   │   └── ...
│   │   │   └── index.ts
│   │   ├── __tests__/
│   │   │   ├── unit/
│   │   │   │   └── dal/
│   │   │   │       ├── countries.test.ts
│   │   │   │       └── ...
│   │   │   ├── integration/
│   │   │   │   └── dal/
│   │   │   │       ├── countries.integration.test.ts
│   │   │   │       └── ...
│   │   │   ├── factories/
│   │   │   │   ├── country.factory.ts
│   │   │   │   └── ...
│   │   │   └── utils/
│   │   │       ├── test-db.ts          # DB setup/teardown
│   │   │       └── test-helpers.ts
│   │   ├── vitest.config.ts
│   │   └── package.json
│   │
│   ├── validation/
│   │   ├── src/schemas/
│   │   ├── __tests__/
│   │   │   └── unit/schemas/
│   │   └── vitest.config.ts
│   │
│   └── ui/
│       ├── src/components/
│       ├── __tests__/
│       │   └── components/
│       └── vitest.config.ts
│
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── server/routers/
│       │   └── lib/
│       ├── __tests__/
│       │   ├── unit/
│       │   │   ├── components/
│       │   │   └── lib/
│       │   ├── integration/
│       │   │   └── server/routers/
│       │   └── e2e/
│       │       ├── auth.spec.ts
│       │       ├── questionnaire.spec.ts
│       │       └── document-generation.spec.ts
│       ├── test-utils/
│       │   ├── trpc-test-utils.ts
│       │   ├── auth-test-utils.ts
│       │   └── msw/handlers.ts
│       ├── vitest.config.ts
│       ├── playwright.config.ts
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── e2e.yml
│
├── docker/
│   └── docker-compose.test.yml        # Test database config
│
└── vitest.workspace.ts                # Monorepo workspace config
```

---

## Key Risks & Mitigation Strategies

### Risk 1: Test Maintenance Burden

**Risk:** Tests become outdated and fail frequently, team starts ignoring them

**Mitigation:**

- Start with high-value tests only (critical paths)
- Use Testing Library's user-centric approach (tests tied to behavior, not implementation)
- Regular test review in code reviews
- Delete flaky tests, don't disable them

### Risk 2: Slow Test Suite

**Risk:** Tests take too long, developers skip running them locally

**Mitigation:**

- Target: Unit tests <10s total, integration tests <60s, E2E <10min
- Use Vitest watch mode for fast feedback
- Run only affected tests locally (via Nx or Turborepo)
- Parallelize E2E tests in CI

### Risk 3: False Confidence from High Coverage

**Risk:** 80% coverage but critical paths untested

**Mitigation:**

- Coverage is a guide, not a goal
- Manually review what's NOT covered (use coverage reports)
- Prioritize risk-based testing over coverage percentage
- Require specific critical paths have 100% coverage (enforce in CI)

### Risk 4: Testing the Wrong Things

**Risk:** Too many E2E tests, not enough unit tests (inverted pyramid)

**Mitigation:**

- Follow testing pyramid strictly
- Code review test additions (is this the right test type?)
- Refactor complex E2E tests into integration tests when possible

### Risk 5: Brittle E2E Tests

**Risk:** E2E tests break on minor UI changes

**Mitigation:**

- Use Playwright's user-facing locators (`getByRole`, `getByLabel`)
- Avoid CSS selectors and test IDs where possible
- Keep E2E tests high-level (don't assert on specific text)
- Use page object pattern to centralize selectors

---

## Success Metrics

### Quantitative Metrics

**Coverage:**

- ✅ DAL functions: 90%+
- ✅ Validation schemas: 100%
- ✅ tRPC procedures: 85%+
- ✅ UI components: 70%+
- ✅ Critical paths: 100%

**Performance:**

- ✅ Unit test suite: <10 seconds total
- ✅ Integration test suite: <60 seconds total
- ✅ E2E test suite: <15 minutes total
- ✅ Full CI pipeline: <20 minutes

**Reliability:**

- ✅ Test flakiness: <2% (tests fail randomly)
- ✅ False positives: <1% (tests fail when code is correct)
- ✅ CI success rate: >95%

### Qualitative Metrics

**Developer Experience:**

- ✅ Developers run tests locally before pushing
- ✅ Tests catch bugs before code review
- ✅ Refactoring feels safe with test coverage
- ✅ New team members can understand test patterns

**Business Impact:**

- ✅ Production bugs decrease
- ✅ Time to deploy decreases (confidence in changes)
- ✅ Customer-reported issues decrease
- ✅ Legal/compliance risk decreases

---

## References & Further Reading

### Official Documentation

1. [Vitest Official Docs](https://vitest.dev/)
2. [Playwright Official Docs](https://playwright.dev/)
3. [Testing Library Docs](https://testing-library.com/react)
4. [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
5. [tRPC Testing Docs](https://trpc.io/docs/v11/server/server-side-calls)
6. [Next.js Testing Docs](https://nextjs.org/docs/app/building-your-application/testing)

### Research Sources

1. [Strapi: Next.js Testing Guide (2025)](https://strapi.io/blog/nextjs-testing-guide-unit-and-e2e-tests-with-vitest-and-playwright)
2. [LogRocket: Comparing Next.js Testing Tools (2024)](https://blog.logrocket.com/comparing-next-js-testing-tools-strategies/)
3. [Prisma: Integration Testing Blog Series (2023)](https://www.prisma.io/blog/testing-series-3-aBUyF8nxAn)
4. [Simple Thread: Isolated Integration Testing (2024)](https://www.simplethread.com/isolated-integration-testing-with-remix-vitest-and-prisma/)
5. [Bunnyshell: E2E Testing Best Practices (2025)](https://www.bunnyshell.com/blog/best-practices-for-end-to-end-testing-in-2025/)

### Community Resources

1. [T3 Stack Examples](https://github.com/t3-oss/create-t3-app)
2. [Next.js Examples Repository](https://github.com/vercel/next.js/tree/canary/examples)
3. [tRPC Testing Discussions](https://github.com/trpc/trpc/discussions)
4. [Fishery TypeScript Factories](https://github.com/thoughtbot/fishery)

---

## Conclusion

The research strongly supports implementing a comprehensive testing suite for Compilot HQ using:

- **Vitest** for unit and integration tests (modern, fast, TypeScript-native)
- **Playwright** for E2E tests (industry standard, multi-browser)
- **Docker Compose** for test database (simple, production parity)
- **Fishery + Faker** for test data factories (type-safe, maintainable)
- **Testing Library** for component tests (user-centric, best practices)
- **Separated test organization** (`__tests__/unit` and `__tests__/integration`)
- **Risk-based coverage targets** (95-100% for critical GDPR logic, 80-90% for API, 60-70% for UI)
- **Strategic E2E scope** (5-10 critical user journeys only)
- **GitHub Actions CI** (unit tests on every push, integration/E2E on PRs)

This approach balances modern best practices with the specific needs of a GDPR compliance platform where correctness is legally critical.

---

**Next Steps:** Use these findings to answer the user's 9 specific questions with data-driven recommendations.
