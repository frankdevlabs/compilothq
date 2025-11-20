# Testing Guide

This guide covers testing setup, best practices, and troubleshooting for the Compilot HQ monorepo.

## Table of Contents

- [Overview](#overview)
- [Test Database Setup](#test-database-setup)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Common Issues & Solutions](#common-issues--solutions)
- [Best Practices](#best-practices)

---

## Overview

Compilot HQ uses **Vitest** as the testing framework with separate test suites:

- **Unit tests**: Fast, isolated tests with mocked dependencies
- **Integration tests**: Tests with real database connections
- **E2E tests**: Browser-based tests with Playwright (future)

### Database Architecture

| Database        | Port | Purpose                                    | URL                              |
| --------------- | ---- | ------------------------------------------ | -------------------------------- |
| **Development** | 5432 | Local development and seed data            | `localhost:5432/compilothq`      |
| **Test**        | 5433 | Integration tests (isolated from dev data) | `localhost:5433/compilothq_test` |

---

## Test Database Setup

### Initial Setup

The test database runs in a separate Docker container on port **5433** to avoid conflicts with the development database.

**1. Environment Variables**

The test database configuration is stored in `.env.test` at the workspace root:

```env
NODE_ENV=test
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/compilothq_test"
```

**Important:**

- Do **NOT** create `.env.test` files in individual packages
- The workspace root `.env.test` is the single source of truth
- Test setup automatically loads this file and overrides other environment variables

**2. Start Test Database Container**

The test database container should start automatically with Docker Compose. To manually start it:

```bash
docker compose -f docker/docker-compose.yml up -d postgres-test
```

**3. Apply Migrations**

Migrations must be applied to the test database before running integration tests:

```bash
cd packages/database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/compilothq_test" pnpm prisma migrate deploy
```

**4. Seed Test Data (Optional)**

Integration tests don't require seed data, but you can seed the test database:

```bash
cd packages/database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/compilothq_test" pnpm prisma db seed
```

---

## Running Tests

### All Tests

Run all tests (unit + integration):

```bash
pnpm test
```

### Unit Tests Only

Run fast unit tests with mocked dependencies:

```bash
pnpm test:unit
```

### Integration Tests Only

Run integration tests with real database:

```bash
pnpm test:integration
```

### Watch Mode

Run tests in watch mode (re-runs on file changes):

```bash
pnpm test:watch
```

### Coverage Report

Generate test coverage report:

```bash
pnpm test:coverage
```

### Interactive UI

Open Vitest interactive UI:

```bash
pnpm test:ui
```

---

## Test Types

### Unit Tests (`__tests__/unit/`)

**Characteristics:**

- Fast execution (< 1 second per test suite)
- Isolated from external dependencies
- Use mocked Prisma client
- No real database connection required

**Example:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserById } from '../../../src/dal/users'

// Mock Prisma client
vi.mock('../../../src/index', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('getUserById', () => {
  it('should return user when found', async () => {
    // Arrange
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }
    prisma.user.findUnique.mockResolvedValue(mockUser)

    // Act
    const result = await getUserById('1')

    // Assert
    expect(result).toEqual(mockUser)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
  })
})
```

### Integration Tests (`__tests__/integration/`)

**Characteristics:**

- Slower execution (connects to real database)
- Tests end-to-end workflows
- Validates database constraints, foreign keys, and indexes
- Uses real Prisma client (not mocked)

**Example:**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../../src/index'

describe('Multi-Tenancy Integration', () => {
  let testOrg1Id: string
  let testOrg2Id: string

  beforeAll(async () => {
    // Create test organizations
    const org1 = await prisma.organization.create({
      data: { name: 'Test Org 1', slug: 'test-org-1', status: 'ACTIVE' },
    })
    const org2 = await prisma.organization.create({
      data: { name: 'Test Org 2', slug: 'test-org-2', status: 'ACTIVE' },
    })
    testOrg1Id = org1.id
    testOrg2Id = org2.id
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({ where: { organizationId: { in: [testOrg1Id, testOrg2Id] } } })
    await prisma.organization.deleteMany({ where: { id: { in: [testOrg1Id, testOrg2Id] } } })
  })

  it('should isolate users by organization', async () => {
    // Test multi-tenancy isolation
    // ...
  })
})
```

---

## Common Issues & Solutions

### Issue 1: Failed Migration State

**Symptom:**

```
Error: P3009
migrate found failed migrations in the target database
```

**Cause:** A migration failed mid-execution and Prisma marked it as failed in `_prisma_migrations` table.

**Solution:** Reset the test database:

```bash
pnpm test:db:reset
```

This script:

1. Stops the test database container
2. Removes the test database volume (clears all data)
3. Restarts the container
4. Deploys all migrations fresh

To also seed test data:

```bash
pnpm test:db:reset --seed
```

---

### Issue 2: "relation already exists" Error

**Symptom:**

```
Database error code: 42P07
Database error: ERROR: relation "User" already exists
```

**Cause:** Migration attempted to create a table that already exists (often due to interrupted migration).

**Solution:** Reset the test database:

```bash
pnpm test:db:reset
```

---

### Issue 3: Connection Refused (port 5433)

**Symptom:**

```
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**Cause:** Test database container is not running.

**Solution:** Start the test database container:

```bash
docker compose -f docker/docker-compose.yml up -d postgres-test
```

Verify it's running:

```bash
docker compose -f docker/docker-compose.yml ps
```

---

### Issue 4: Tests Using Development Database

**Symptom:** Tests modifying data in development database (port 5432).

**Cause:** `DATABASE_URL` environment variable not properly overridden.

**Solution:**

1. Ensure `.env.test` exists at workspace root
2. Run tests with `dotenv-cli`:

```bash
pnpm test  # Uses dotenv -e .env.test automatically
```

3. Verify test setup loads `.env.test`:

Check `packages/database/__tests__/setup.ts` has:

```typescript
import { config } from 'dotenv'
import { resolve } from 'path'

const envPath = resolve(__dirname, '../../../.env.test')
config({ path: envPath, override: true })
```

---

### Issue 5: Stale Test Data

**Symptom:** Tests failing due to data from previous test runs.

**Cause:** Integration tests not cleaning up properly.

**Solution:**

**Option 1:** Reset test database before running tests:

```bash
pnpm test:db:reset && pnpm test:integration
```

**Option 2:** Improve test cleanup in `afterAll` hooks:

```typescript
afterAll(async () => {
  // Delete test data in reverse dependency order
  await prisma.user.deleteMany({ where: { email: { contains: 'test' } } })
  await prisma.organization.deleteMany({ where: { slug: { contains: 'test' } } })
})
```

---

## Best Practices

### 1. Isolate Test Data

- Use unique identifiers in test data (e.g., email containing "test" or timestamp)
- Clean up test data in `afterAll` hooks
- Use transactions for atomic test cleanup (when possible)

### 2. Test Database Hygiene

- Reset test database when switching branches with migration changes
- Run `pnpm test:db:reset` after pulling migration changes
- Keep test database schema in sync with development database

### 3. Unit vs Integration Tests

**Prefer Unit Tests when:**

- Testing business logic in isolation
- Fast feedback is needed
- External dependencies can be mocked

**Prefer Integration Tests when:**

- Testing database constraints (foreign keys, unique indexes)
- Verifying multi-tenancy data isolation
- Testing complex queries with joins
- Validating seed data integrity

### 4. Test Organization

```
packages/database/__tests__/
├── unit/
│   └── dal/
│       ├── organizations.test.ts  # Mocked Prisma client
│       └── users.test.ts          # Mocked Prisma client
└── integration/
    ├── multi-tenancy.test.ts      # Real database, isolation tests
    └── seed-data.test.ts          # Real database, seed verification
```

### 5. Avoid Flaky Tests

- Don't rely on specific IDs in integration tests (use created records)
- Clean up test data after each test suite
- Don't share state between tests
- Use `beforeEach` for test setup, `afterEach` for cleanup

### 6. Environment Safety

**Never:**

- Run tests against production database
- Commit `.env` files with real credentials
- Modify test database manually during test runs

**Always:**

- Use `.env.test` for test configuration
- Verify test database port (5433) in connection strings
- Keep `.env.test` in version control (it uses localhost:5433)

---

## Quick Reference

### Common Commands

```bash
# Reset test database (fresh start)
pnpm test:db:reset

# Reset and seed test data
pnpm test:db:reset --seed

# Run all tests
pnpm test

# Run only unit tests (fast)
pnpm test:unit

# Run only integration tests
pnpm test:integration

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Open Vitest UI
pnpm test:ui

# Check Docker status
docker compose -f docker/docker-compose.yml ps

# View test database logs
docker logs -f compilothq-postgres-test

# Connect to test database (psql)
docker exec -it compilothq-postgres-test psql -U postgres -d compilothq_test
```

### Port Reference

| Port | Database    | Purpose                                    |
| ---- | ----------- | ------------------------------------------ |
| 5432 | Development | `pnpm dev`, `pnpm db:studio`, seed data    |
| 5433 | Test        | Integration tests, `pnpm test:integration` |

### File Reference

| File                                   | Purpose                            |
| -------------------------------------- | ---------------------------------- |
| `.env.test`                            | Test database configuration (root) |
| `scripts/reset-test-db.js`             | Automated test database reset      |
| `packages/database/__tests__/setup.ts` | Vitest setup, loads `.env.test`    |
| `vitest.config.ts`                     | Workspace-level Vitest config      |
| `packages/database/vitest.config.mts`  | Database package Vitest config     |

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Vitest documentation](https://vitest.dev/)
2. Check the [Prisma testing guide](https://www.prisma.io/docs/guides/testing)
3. Check recent changes to migrations in `packages/database/prisma/migrations/`
4. Try resetting the test database: `pnpm test:db:reset`
5. Ask in the team chat or open an issue

---

**Last Updated:** 2025-11-15
