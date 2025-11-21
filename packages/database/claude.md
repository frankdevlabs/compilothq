# Database Package Context

## Overview

Centralized database package (`@compilothq/database`) providing type-safe database access using Prisma ORM with custom output path for Prisma 7.0 compatibility.

- **Schema:** `prisma/schema.prisma`
- **Generated Client:** `generated/client/` (gitignored)
- **Database:** PostgreSQL 17
- **Version:** Prisma 5.22.0 (exact, managed via pnpm catalogs)

## Package Structure

```
packages/database/
├── prisma/
│   ├── schema.prisma              # Single source of truth
│   ├── migrations/                # Version controlled migrations
│   └── seeds/                     # Development/test seed data
├── src/
│   ├── index.ts                   # Exports: prisma singleton + types
│   ├── dal/                       # Data Access Layer (one file per model)
│   └── test-utils/                # Testing utilities & factories
├── generated/                     # Prisma Client (gitignored, regenerate per platform)
└── dist/                          # Compiled TypeScript (gitignored)
```

## Usage

### Importing the Client

```typescript
// ✅ Correct
import { prisma } from '@compilothq/database'
const users = await prisma.user.findMany()

// ❌ Wrong - breaks singleton pattern
import { PrismaClient } from '@compilothq/database/generated/client'
const prisma = new PrismaClient()
```

### Importing Types and Enums

```typescript
import { type User, type Organization, UserPersona } from '@compilothq/database'

const user: User = await prisma.user.findUnique({ where: { id: '123' } })
const persona: UserPersona = UserPersona.DPO // Enum value
```

### Using DAL Functions

```typescript
import { getUserById, createUser, listOrganizations } from '@compilothq/database'

const user = await getUserById('user-id')
const orgs = await listOrganizations()
```

**Benefits:** Encapsulated logic, consistent error handling, easier mocking

## Commands

```bash
pnpm generate     # Generate Prisma Client (after schema changes or git pull)
pnpm migrate      # Create & apply migration (interactive)
pnpm push         # Push schema changes without migration (dev only)
pnpm studio       # Open Prisma Studio (database GUI)
pnpm seed         # Seed database with reference data
pnpm build        # Build TypeScript
pnpm test:unit    # Run unit tests
```

## Workflow

### After Schema Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
pnpm db:migrate

# Automatically: generates migration SQL, applies to DB, regenerates client, rebuilds types
```

### After git pull with Schema Changes

```bash
pnpm install      # Triggers postinstall → generates client
# OR explicitly:
pnpm db:generate
```

## Singleton Pattern

Uses singleton to prevent "too many connections" errors. **Critical:** Always import `prisma` from package, never create `new PrismaClient()`.

## Naming Conventions

- Models: PascalCase singular (`User`)
- Tables: snake_case plural (`users`)
- Enums: PascalCase (`UserPersona`)

## Environment Variables

```bash
# .env (development)
DATABASE_URL="postgresql://user:password@localhost:5432/compilothq_development?sslmode=prefer"

# .env.test (testing)
DATABASE_URL="postgresql://user:password@localhost:5432/compilothq_test?sslmode=prefer"
```

## Testing

### Test Organization

Tests are organized by type:

```
__tests__/
├── integration/                    # Integration tests (use real database)
│   ├── dal/                       # DAL function tests
│   │   ├── users.integration.test.ts
│   │   ├── organizations.integration.test.ts
│   │   └── countries.integration.test.ts
│   ├── multi-tenancy.test.ts      # Cross-cutting tests
│   └── seed-data.test.ts          # Relationship tests
└── unit/                          # Unit tests (mocked/isolated)
    └── test-utils/                # Test utility tests
        ├── db-helpers.test.ts
        └── factories/
            └── country-factory.test.ts
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run only unit tests (fast, <1s)
pnpm test:unit

# Run only integration tests (~5s)
pnpm test:integration

# Watch mode for development
pnpm test:watch
```

### Writing Integration Tests

Integration tests use the real test database and test factories:

```typescript
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getUserById, createUser } from '@compilothq/database'
import { createTestOrganization, cleanupTestOrganizations } from '@compilothq/database/test-utils'

describe('User Operations', () => {
  let testOrg: Organization

  beforeAll(async () => {
    // Create test data using factories
    const { org } = await createTestOrganization({ slug: 'test-org' })
    testOrg = org
  })

  afterAll(async () => {
    // Clean up test data
    await cleanupTestOrganizations([testOrg.id])
  })

  it('should retrieve user by ID from database', async () => {
    // Arrange - Create test user
    const user = await createUser({
      name: 'Test User',
      email: 'test@example.com',
      organizationId: testOrg.id,
    })

    // Act - Call DAL function
    const result = await getUserById(user.id)

    // Assert - Verify data integrity
    expect(result).toBeDefined()
    expect(result?.id).toBe(user.id)
    expect(result?.email).toBe('test@example.com')
  })
})
```

### Test Factories

Use factories to create consistent test data:

```typescript
import {
  createTestOrganization,
  createTestUser,
  createTestUsersByPersona,
} from '@compilothq/database/test-utils'

// Create org with users
const { org, users } = await createTestOrganization({
  name: 'Test Company',
  slug: 'test-company',
  status: 'ACTIVE',
  userCount: 5, // Creates 5 users automatically
})

// Create individual user
const user = await createTestUser({
  organizationId: org.id,
  primaryPersona: 'DPO',
  email: 'dpo@example.com',
})

// Create users by persona type
const usersByPersona = await createTestUsersByPersona(org.id, ['DPO', 'PRIVACY_OFFICER'])
```

### Test Best Practices

**DO:**

- ✅ Use integration tests for DAL functions (they're database wrappers)
- ✅ Create test data using factories
- ✅ Clean up test data in `afterAll`/`afterEach`
- ✅ Use unique slugs/emails to avoid conflicts: \``test-${Date.now()}`\`
- ✅ Test actual database behavior (persistence, constraints, etc.)

**DON'T:**

- ❌ Mock Prisma client in integration tests
- ❌ Share mutable test data across tests
- ❌ Leave test data in the database
- ❌ Use hardcoded IDs (use factory-generated IDs)

### Test Database Setup

Tests automatically use a separate test database:

- **Environment:** `.env.test` in package directory (auto-loaded by Vitest)
- **Database:** `compilothq_test` (port 5433 locally)
- **Setup:** Migrations run automatically in `beforeAll` hook
- **Cleanup:** Tables truncated between test files for isolation

## Common Issues

| Issue                                     | Fix                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Cannot find module '@compilothq/database' | `pnpm install && pnpm build`                                                        |
| Type errors on Prisma types               | `pnpm db:generate`                                                                  |
| Too many connections                      | Check singleton usage - never create new instances                                  |
| Migration failed: relation exists         | Database out of sync - use `pnpm db:reset` (destroys data)                          |
| ERR_PNPM_OUTDATED_LOCKFILE in CI          | Regenerate lockfile: `rm pnpm-lock.yaml && pnpm install` then commit                |
| Lockfile doesn't match package.json       | Clean install: `rm -rf node_modules && pnpm install`, test with `--frozen-lockfile` |

## Version Management

Prisma versions managed via **pnpm catalogs** in root `pnpm-workspace.yaml`:

```yaml
catalogs:
  default:
    '@prisma/client': '5.22.0'
    prisma: '5.22.0'
```

Ensures exact versions across all packages, preventing type incompatibilities.

## Lockfile Management

### pnpm Catalogs and Lockfile Synchronization

When using pnpm catalogs (requires pnpm 9.0+), the lockfile must properly reference the `catalog:` protocol. If you change `package.json` to use `catalog:` but don't regenerate the lockfile, CI will fail with:

```
ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile"
specifiers in lockfile: {"@prisma/client":"5.22.0"}
don't match specs in package.json: {"@prisma/client":"catalog:"}
```

### Regenerating Lockfile

When you need to regenerate the lockfile (catalog changes, version updates, etc.):

```bash
# Clean slate regeneration
rm pnpm-lock.yaml
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install

# Verify lockfile is synchronized
pnpm install --frozen-lockfile
```

**Important:** Always test `pnpm install --frozen-lockfile` locally before pushing - this simulates CI behavior.

### Lockfile in CI/CD

CI pipelines use `pnpm install --frozen-lockfile` which:

- Fails if lockfile doesn't match package.json (prevents surprises)
- Skips resolution step for faster, deterministic installs
- Ensures everyone uses identical dependency versions

After regenerating the lockfile, commit it:

```bash
git add pnpm-lock.yaml
git commit -m "fix(deps): regenerate lockfile for catalog support"
git push
```

## CI/CD Integration

Turborepo ensures proper build order:

```json
{
  "tasks": {
    "db:generate": { "cache": false, "outputs": ["generated/**"] },
    "build": { "dependsOn": ["^build", "^db:generate"] }
  }
}
```

Guarantees Prisma Client generated before builds, ensuring types available during compilation.

## Next.js Integration

```typescript
// apps/web/src/app/api/users/route.ts
import { prisma } from '@compilothq/database'

export async function GET() {
  const users = await prisma.user.findMany()
  return Response.json(users)
}
```

Next.js automatically transpiles via `transpilePackages` config. No additional setup needed.

## Prisma 7.0 Ready

This package is future-proof:

- ✅ Custom output path (will be required)
- ✅ No `.prisma/client` imports (deprecated)
- ✅ Explicit versioning via catalogs
- ✅ Proper monorepo structure

Minimal changes needed when Prisma 7.0 releases.

## Key Rules

1. **Always import from `@compilothq/database`** - never from generated client
2. **Never create new PrismaClient instances** - breaks singleton
3. **Run `pnpm db:generate` after schema changes** - regenerates types
4. **Use DAL functions** when available - better abstraction
5. **Keep enums in schema** - they're part of your domain model
6. **Version migrations** - never modify after commit
