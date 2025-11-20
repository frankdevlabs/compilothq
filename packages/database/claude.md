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

```typescript
import { getUserById } from '@compilothq/database'
import { setupTestDatabase, cleanDatabase } from '@compilothq/database/test-utils'

beforeAll(async () => await setupTestDatabase())
beforeEach(async () => await cleanDatabase())
```

## Common Issues

| Issue                                     | Fix                                                        |
| ----------------------------------------- | ---------------------------------------------------------- |
| Cannot find module '@compilothq/database' | `pnpm install && pnpm build`                               |
| Type errors on Prisma types               | `pnpm db:generate`                                         |
| Too many connections                      | Check singleton usage - never create new instances         |
| Migration failed: relation exists         | Database out of sync - use `pnpm db:reset` (destroys data) |

## Version Management

Prisma versions managed via **pnpm catalogs** in root `pnpm-workspace.yaml`:

```yaml
catalogs:
  default:
    '@prisma/client': '5.22.0'
    prisma: '5.22.0'
```

Ensures exact versions across all packages, preventing type incompatibilities.

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
