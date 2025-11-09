# Testing Guide

This guide provides comprehensive documentation on testing strategies, patterns, and best practices for the Compilot HQ monorepo.

## Table of Contents

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Unit Testing Pattern](#unit-testing-pattern)
5. [Integration Testing Pattern](#integration-testing-pattern)
6. [E2E Testing Pattern](#e2e-testing-pattern)
7. [Test Data Factories](#test-data-factories)
8. [Test Database Management](#test-database-management)
9. [Troubleshooting](#troubleshooting)

## Overview

The Compilot HQ project uses a comprehensive testing strategy with three types of tests:

- **Unit Tests**: Test business logic in isolation using mocks
- **Integration Tests**: Test database operations and API endpoints with a real test database
- **E2E Tests**: Test complete user flows with Playwright

### Tech Stack

- **Vitest**: Fast unit and integration testing framework
- **Playwright**: Cross-browser E2E testing
- **@testing-library/react**: React component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **Test Data Factories**: Generate valid test data matching Prisma schemas

### Coverage Requirements

- **Minimum Coverage**: 80% for statements, branches, functions, and lines
- **Coverage Provider**: v8
- **Coverage Reports**: HTML reports generated in `coverage/` directory

## Test Types

### Unit Tests

**Purpose**: Test individual functions, components, or modules in isolation.

**Location**: `__tests__/unit/` directories

**Characteristics**:

- Fast execution (no external dependencies)
- Use mocks for database, APIs, and external services
- Follow AAA pattern (Arrange, Act, Assert)

**Example Files**:

- `/packages/database/__tests__/unit/dal/countries.test.ts`
- `/packages/ui/__tests__/unit/components/button.test.tsx`

### Integration Tests

**Purpose**: Test how multiple components work together, particularly database operations.

**Location**: `__tests__/integration/` directories

**Characteristics**:

- Use real test database (port 5433)
- Test data persistence and constraints
- Slower than unit tests but verify end-to-end data flow

**Example Files**:

- `/packages/database/__tests__/integration/dal/countries.integration.test.ts`
- `/packages/validation/__tests__/integration/schemas/country.test.ts`

### E2E Tests

**Purpose**: Test complete user workflows from the browser perspective.

**Location**: `/apps/web/__tests__/e2e/`

**Characteristics**:

- Run in real browsers (Chromium, Firefox, WebKit)
- Test navigation, form submissions, and user interactions
- Slowest but provide highest confidence

**Example Files**:

- `/apps/web/__tests__/e2e/marketing-pages.spec.ts`

## Running Tests

### All Tests

```bash
# Run all tests in watch mode
pnpm test

# Run all tests once
pnpm test:coverage
```

### Unit Tests Only

```bash
pnpm test:unit
```

### Integration Tests Only

```bash
pnpm test:integration
```

### E2E Tests Only

```bash
pnpm test:e2e
```

### Watch Mode (for development)

```bash
pnpm test:watch
```

### Test UI (visual debugging)

```bash
# Vitest UI
pnpm test:ui

# Playwright UI
pnpm --filter web test:e2e:ui
```

### Package-Specific Tests

```bash
# Test only database package
pnpm --filter @compilothq/database test

# Test only UI package
pnpm --filter @compilothq/ui test

# Test only web app
pnpm --filter web test
```

## Unit Testing Pattern

### Basic Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  it('should do something specific', () => {
    // Arrange: Set up test data and mocks
    const mockData = { id: '1', name: 'Test' }

    // Act: Execute the function under test
    const result = functionUnderTest(mockData)

    // Assert: Verify the result
    expect(result).toBe(expectedValue)
  })
})
```

### Mocking Prisma Client

```typescript
import { vi } from 'vitest'

// Mock the prisma client module
vi.mock('../../../src/index', () => ({
  prisma: {
    country: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '../../../src/index'

// In your test
it('should call prisma.country.findMany', async () => {
  const mockCountries = [{ id: '1', name: 'France' }]
  vi.mocked(prisma.country.findMany).mockResolvedValue(mockCountries)

  const result = await listCountries()

  expect(result).toEqual(mockCountries)
  expect(prisma.country.findMany).toHaveBeenCalledOnce()
})
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../components/button'

it('should call onClick when clicked', async () => {
  const user = userEvent.setup()
  const handleClick = vi.fn()

  render(<Button onClick={handleClick}>Click me</Button>)

  const button = screen.getByRole('button')
  await user.click(button)

  expect(handleClick).toHaveBeenCalledOnce()
})
```

## Integration Testing Pattern

### Test Database Setup

Integration tests use a **real PostgreSQL database** on port **5433** (separate from dev database on 5432).

### Basic Structure

```typescript
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import {
  setupTestDatabase,
  cleanupTestDatabase,
  disconnectTestDatabase,
  CountryFactory,
} from '../../../src/test-utils'
import { prisma } from '../../../src/index'

describe('Feature Integration Tests', () => {
  beforeAll(async () => {
    // Run migrations once before all tests
    await setupTestDatabase()
  })

  beforeEach(async () => {
    // Clean database before each test for isolation
    await cleanupTestDatabase()
  })

  afterAll(async () => {
    // Disconnect after all tests complete
    await disconnectTestDatabase()
  })

  it('should persist data to database', async () => {
    // Arrange: Create test data
    const countryData = new CountryFactory().build({
      name: 'France',
      isoCode: 'FR',
    })

    // Act: Insert into database
    const created = await prisma.country.create({ data: countryData })

    // Assert: Retrieve and verify
    const retrieved = await prisma.country.findUnique({
      where: { id: created.id },
    })

    expect(retrieved).not.toBeNull()
    expect(retrieved?.name).toBe('France')
  })
})
```

### Testing Database Constraints

```typescript
it('should enforce unique constraint on isoCode', async () => {
  // Create first country
  await prisma.country.create({
    data: new CountryFactory().build({ isoCode: 'FR' }),
  })

  // Attempt to create duplicate
  await expect(
    prisma.country.create({
      data: new CountryFactory().build({ isoCode: 'FR' }),
    })
  ).rejects.toThrow()
})
```

### Testing Validation Schemas

```typescript
import { CountryCreateSchema } from '../../../src/schemas/reference/country'
import { ZodError } from 'zod'

it('should validate correct data', () => {
  const validData = {
    name: 'France',
    isoCode: 'fr',
    gdprStatus: ['EU'],
  }

  const result = CountryCreateSchema.parse(validData)

  expect(result.isoCode).toBe('FR') // Transformed to uppercase
})

it('should reject invalid data', () => {
  const invalidData = {
    name: 'France',
    isoCode: 'FRA', // Should be 2 characters
    gdprStatus: ['EU'],
  }

  expect(() => CountryCreateSchema.parse(invalidData)).toThrow(ZodError)
})
```

## E2E Testing Pattern

### Basic Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should complete user flow', async ({ page }) => {
    // Navigate to page
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Interact with page
    await page.getByRole('button', { name: /click me/i }).click()

    // Assert result
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

### Page Object Pattern

```typescript
// pages/login-page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByLabel('Password').fill(password)
    await this.page.getByRole('button', { name: /login/i }).click()
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL('/dashboard')
  }
}

// In test file
test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.navigate()
  await loginPage.login('user@example.com', 'password123')
  await loginPage.expectLoginSuccess()
})
```

### Testing Responsive Behavior

```typescript
test('should display correctly on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
```

## Test Data Factories

Factories generate valid test data that matches Prisma schemas and passes Zod validation.

### Using Factories

```typescript
import { CountryFactory, createEUCountryFactory } from '@compilothq/database/test-utils/factories'

// Generate data without persisting (for mocking)
const countryData = new CountryFactory().build()

// Generate with custom values
const customCountry = new CountryFactory().build({
  name: 'France',
  isoCode: 'FR',
})

// Persist to database (integration tests only)
const persistedCountry = await new CountryFactory().create({
  name: 'Germany',
})

// Use factory variants
const euCountry = await createEUCountryFactory().create()
```

### Available Factories

- **CountryFactory**: Generate country data
  - `createEUCountryFactory()`: EU countries
  - `createEEACountryFactory()`: EEA countries
  - `createAdequateCountryFactory()`: Adequate protection countries

- **DataNatureFactory**: Generate data nature records
  - `createSpecialDataNatureFactory()`: Special categories
  - `createNonSpecialDataNatureFactory()`: Non-special categories

- **ProcessingActFactory**: Generate processing activities
  - `createDPARequiredProcessingActFactory()`: Requires DPA
  - `createDPIATriggeredProcessingActFactory()`: Triggers DPIA

- **TransferMechanismFactory**: Generate transfer mechanisms
  - `createAdequacyTransferMechanismFactory()`: Adequacy decisions
  - `createSafeguardTransferMechanismFactory()`: Appropriate safeguards
  - `createDerogationTransferMechanismFactory()`: Derogations

- **RecipientCategoryFactory**: Generate recipient categories
  - Various factory variants available

### Custom Factory Patterns

```typescript
// Override specific fields
const factory = new CountryFactory()
const country = factory.build({
  name: 'Custom Name',
  gdprStatus: ['EU', 'EEA'],
})

// Chain multiple overrides
const euFactory = createEUCountryFactory()
const specificCountry = euFactory.build({
  name: 'France',
  isoCode: 'FR',
})
```

## Test Database Management

### Environment Configuration

Test database runs on **port 5433** to avoid conflicts with development database (port 5432).

**Environment file**: `.env.test`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/compilothq_test
```

### Starting Test Database

```bash
# Start test database via Docker
docker-compose up postgres-test -d
```

### Database Utilities

```typescript
import {
  setupTestDatabase,
  cleanupTestDatabase,
  seedReferenceData,
  disconnectTestDatabase,
} from '@compilothq/database/test-utils'

// Run migrations (once per test suite)
await setupTestDatabase()

// Clean all tables (before each test)
await cleanupTestDatabase()

// Seed reference data (optional)
await seedReferenceData()

// Disconnect (after all tests)
await disconnectTestDatabase()
```

### Migration Management

Migrations are **run once** in `beforeAll` hook:

```typescript
beforeAll(async () => {
  await setupTestDatabase() // Runs: prisma migrate deploy
})
```

**Do NOT** run migrations before each test - this is slow and unnecessary.

## Troubleshooting

### Common Issues

#### Issue: Tests fail with "Database not found"

**Solution**: Ensure test database is running on port 5433

```bash
docker-compose up postgres-test -d
```

#### Issue: Tests fail with "Table does not exist"

**Solution**: Run migrations on test database

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/compilothq_test pnpm --filter @compilothq/database prisma migrate deploy
```

Or run tests - migrations run automatically in `setupTestDatabase()`.

#### Issue: Vitest can't find imports from `@compilothq/*` packages

**Solution**: Build the packages first

```bash
pnpm build
```

Or configure Vitest to use TypeScript path resolution (already configured in `vitest.config.ts`).

#### Issue: Playwright tests fail with "Could not connect"

**Solution**: Ensure Next.js dev server is running, or let Playwright start it automatically (configured in `playwright.config.ts`).

```bash
# Manual start (if needed)
pnpm --filter web dev
```

#### Issue: Coverage is lower than expected

**Solution**:

1. Check what's being excluded in coverage config
2. Ensure test files are in `__tests__/` directories
3. Write more tests for uncovered code paths

```bash
# View detailed coverage report
pnpm test:coverage
open coverage/index.html
```

#### Issue: Integration tests are slow

**Causes**:

- Running migrations per test (should only run once in `beforeAll`)
- Not cleaning database properly (use `cleanupTestDatabase()`)
- Too many database queries

**Solution**:

- Use `beforeAll` for setup, `beforeEach` for cleanup
- Use factories to generate minimal required data
- Optimize DAL functions

#### Issue: Prisma client errors in tests

**Solution**: Ensure you're using the test database client

```typescript
import { prisma } from '../../../src/index' // Correct
import { PrismaClient } from '@prisma/client' // Don't create new instances
```

The `prisma` singleton automatically uses `DATABASE_URL` from environment.

#### Issue: Mock not working in unit tests

**Solution**: Ensure mock is declared before imports

```typescript
// Mock FIRST
vi.mock('../../../src/index', () => ({
  prisma: {
    /* mock */
  },
}))

// Import AFTER mock
import { prisma } from '../../../src/index'
```

### Getting Help

1. **Check test output**: Vitest provides detailed error messages
2. **Use Vitest UI**: `pnpm test:ui` for visual debugging
3. **Use Playwright UI**: `pnpm --filter web test:e2e:ui` for E2E debugging
4. **Check logs**: Database connection errors, migration failures
5. **Verify environment**: Correct `DATABASE_URL`, dependencies installed

### Best Practices

1. **Keep tests focused**: One assertion per test when possible
2. **Use descriptive test names**: "should do X when Y"
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Clean up after tests**: Use `beforeEach` and `afterAll` hooks
5. **Isolate tests**: Tests should not depend on each other
6. **Use factories**: Generate valid test data consistently
7. **Mock external dependencies**: Keep unit tests fast
8. **Test error cases**: Don't just test happy paths
9. **Keep tests maintainable**: Refactor test utilities when patterns emerge

### Performance Tips

1. **Run unit tests frequently**: They're fast (< 1s)
2. **Run integration tests before commits**: They're slower (~5-10s)
3. **Run E2E tests before PRs**: They're slowest (~30s+)
4. **Use watch mode**: `pnpm test:watch` for development
5. **Parallelize**: Vitest runs tests in parallel by default
6. **Filter tests**: `pnpm test countries` runs only matching tests

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Project CLAUDE.md](../CLAUDE.md) - Project context and standards

---

**Last Updated**: 2025-11-09
