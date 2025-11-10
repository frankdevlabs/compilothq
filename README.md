# Compilot HQ

GDPR compliance management platform built with Next.js 16, React 19, and modern tooling.

## Monorepo Structure

This project uses pnpm workspaces to manage a monorepo with shared packages:

```
/
├── apps/
│   └── web/                 # Next.js 16 application
├── packages/
│   ├── database/            # Prisma database client
│   ├── ui/                  # Shared UI components
│   └── validation/          # Zod validation schemas
├── pnpm-workspace.yaml      # Workspace configuration
├── tsconfig.base.json       # Base TypeScript config
└── package.json             # Root package with scripts
```

## Workspace Packages

### @compilothq/database

Type-safe Prisma database client with singleton pattern. Provides centralized database access with proper connection pooling.

[Read more →](./packages/database/README.md)

### @compilothq/ui

Shared UI component library built with shadcn/ui and Radix UI. Includes Button, Card, Input, and utility functions.

[Read more →](./packages/ui/README.md)

### @compilothq/validation

Zod validation schemas for consistent data validation across client and server.

[Read more →](./packages/validation/README.md)

## Getting Started

### Prerequisites

- Node.js 24.11.0
- pnpm 8.15.0+
- Docker Desktop (manages PostgreSQL 17 + Redis infrastructure)

### Installation

```bash
# Install all dependencies
pnpm install
```

### Environment Setup

CompiloHQ requires environment configuration for Docker services and the Next.js application.

1. **Copy environment files:**

   ```bash
   # Docker infrastructure settings (PostgreSQL + Redis)
   cp docker/.env.example docker/.env

   # Next.js application settings
   cp apps/web/.env.local.example apps/web/.env.local

   # Database package settings
   cp packages/database/.env.example packages/database/.env
   ```

2. **Configure Docker services (optional):**
   The default settings in `docker/.env` work out of the box. You can adjust:
   - PostgreSQL credentials and performance tuning
   - Redis configuration and memory limits
   - Resource allocation

3. **Configure application settings:**
   Update `apps/web/.env.local` with your specific settings:
   - NextAuth configuration
   - Feature flags
   - External service integrations (if needed)

### Docker Infrastructure

CompiloHQ uses Docker Compose to manage infrastructure services (PostgreSQL and Redis). The Next.js app runs locally on your machine.

#### Services Overview

- **postgres** (port 5432): Development database
- **postgres-test** (port 5433): Test database for running tests in isolation
- **redis** (port 6379): Session tracking and caching

#### Automated Startup (Recommended)

Just run the development server - Docker services start automatically:

```bash
# Starts Docker services automatically, then Next.js dev server
pnpm dev
```

The `predev` hook ensures Docker services are running and healthy before starting development.

#### Manual Docker Management

```bash
# Start infrastructure services
pnpm docker:up

# Check service health
pnpm docker:health

# View logs
pnpm docker:logs                  # All services
pnpm docker:logs:postgres         # PostgreSQL only
pnpm docker:logs:redis            # Redis only

# Stop services
pnpm docker:down

# Restart services
pnpm docker:restart

# Nuclear option: destroy volumes and recreate
pnpm docker:reset
```

### Development

#### Quick Start (Automated)

```bash
# One command to start everything
pnpm dev
# → Checks Docker is running
# → Starts PostgreSQL + Redis if needed
# → Waits for services to be healthy
# → Starts Next.js dev server
```

#### First-Time Database Setup

After starting development for the first time, initialize the database:

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations (Docker auto-starts if needed)
pnpm db:migrate
```

#### Working with Packages

```bash
# Watch mode for a specific package
pnpm --filter @compilothq/ui dev

# Build workspace packages
pnpm --filter @compilothq/database build
pnpm --filter @compilothq/ui build
pnpm --filter @compilothq/validation build
```

## Testing

CompiloHQ uses a comprehensive testing infrastructure:

- **Vitest** for unit and integration tests
- **Playwright** for end-to-end testing
- **80% minimum code coverage** requirement

For detailed testing documentation, patterns, and examples, see the **[Testing Guide](./docs/testing-guide.md)**.

### Quick Start

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Open Vitest UI for visual debugging
pnpm test:ui
```

### Test Database

Tests run against an isolated PostgreSQL instance on **port 5433** (separate from development on port 5432). The test database is automatically managed by Docker Compose.

**Start test database:**

```bash
# Test database starts automatically with other services
pnpm docker:up

# Or start only the test database
docker compose -f docker/docker-compose.yml up -d postgres-test
```

**Environment configuration:**

The `.env.test` file is checked into the repository and contains:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/compilothq_test"
```

### Test Organization

Tests are co-located with source code in each package:

```
packages/database/
  __tests__/
    unit/              # Unit tests with mocks
    integration/       # Integration tests with test database
apps/web/
  __tests__/
    unit/              # Component and utility tests
    e2e/               # Playwright end-to-end tests
```

### Test Utilities and Factories

The database package provides test utilities and factories for generating valid test data:

```typescript
import { CountryFactory, setupTestDatabase } from '@compilothq/database/test-utils'

// Generate test data
const country = new CountryFactory().build({ name: 'France', isoCode: 'FR' })

// Persist to test database
const created = await new CountryFactory().create({ name: 'Germany' })
```

For complete documentation on factories, test utilities, and testing patterns, see the **[Testing Guide](./docs/testing-guide.md)**.

## Available Scripts

### Development

- `pnpm dev` - Start development (auto-starts Docker services)
- `pnpm start` - Explicit all-in-one startup command
- `pnpm build` - Build the Next.js application
- `pnpm test` - Run tests

### Docker Infrastructure

- `pnpm docker:check` - Check if Docker is available
- `pnpm docker:up` - Start PostgreSQL + Redis services
- `pnpm docker:down` - Stop all services
- `pnpm docker:restart` - Restart all services
- `pnpm docker:ps` - Show running containers
- `pnpm docker:health` - Check service health status
- `pnpm docker:logs` - View logs from all services
- `pnpm docker:logs:postgres` - View PostgreSQL logs only
- `pnpm docker:logs:redis` - View Redis logs only
- `pnpm docker:reset` - Destroy volumes and recreate (fresh start)

### Database Scripts

All database scripts automatically ensure Docker services are running:

- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed database

### Testing Scripts

- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm test:e2e` - Run E2E tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Generate coverage report
- `pnpm test:ui` - Open Vitest UI

### Code Quality

- `pnpm lint` - Lint all packages
- `pnpm format` - Format all files with Prettier
- `pnpm format:check` - Check formatting without making changes
- `pnpm typecheck` - Type-check all packages

### Per-Package Scripts

```bash
# Build a specific package
pnpm --filter @compilothq/database build
pnpm --filter @compilothq/ui build
pnpm --filter @compilothq/validation build

# Run Next.js commands
pnpm --filter @compilothq/web dev
pnpm --filter @compilothq/web build
pnpm --filter @compilothq/web start
```

## Troubleshooting

### Docker Issues

**Docker services won't start:**

```bash
# Check if Docker Desktop is running
pnpm docker:check

# View service status
pnpm docker:health

# Check logs for errors
pnpm docker:logs
```

**Services are unhealthy:**

```bash
# Restart services
pnpm docker:restart

# If restart doesn't help, reset everything
pnpm docker:reset
```

**Port conflicts (5432 or 6379 already in use):**

1. Check if you have PostgreSQL or Redis running locally
2. Stop local instances or change ports in `docker/.env`
3. Update `DATABASE_URL` in app environment files to match

**"docker/.env not found" error:**

```bash
# Copy the example environment file
cp docker/.env.example docker/.env
```

**Services start but app can't connect:**

1. Ensure `DATABASE_URL` matches the ports in `docker/.env`
2. Wait for health checks: `pnpm docker:health`
3. Check network connectivity: `pnpm docker:ps`

### Test Database Issues

**Test database not accessible on port 5433:**

```bash
# Check if test database is running
docker ps --filter "name=compilothq-postgres-test"

# Start test database if not running
docker compose -f docker/docker-compose.yml up -d postgres-test

# Check logs
docker logs compilothq-postgres-test
```

**Tests failing with database connection errors:**

1. Ensure test database is running: `docker ps`
2. Verify `.env.test` has correct DATABASE_URL with port 5433
3. Check test database health: `docker exec compilothq-postgres-test pg_isready`
4. Run migrations on test database (if needed): See [Testing Guide](./docs/testing-guide.md#troubleshooting)

**Prisma client errors in tests:**

1. Ensure Prisma client is generated: `pnpm db:generate`
2. Check that tests import from correct paths (see [Testing Guide](./docs/testing-guide.md))
3. Verify `@prisma/client` is installed: `pnpm install`

## Tech Stack

### Framework & Runtime

- **Next.js 16** (App Router with Turbopack)
- **React 19**
- **Node.js 24.11.0**
- **TypeScript 5.x** (strict mode)

### Frontend

- **shadcn/ui + Radix UI** - Component library
- **Tailwind CSS 4** - Styling
- **TanStack Query** - Data fetching
- **tRPC v11** - End-to-end type-safe API

### Backend & Database

- **Prisma ORM** - Database access
- **PostgreSQL 17** - Primary database
- **Zod** - Runtime validation

### Testing

- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - Custom matchers
- **jsdom** - DOM simulation for tests

### Development Tools

- **pnpm** - Package management
- **ESLint + Prettier** - Code quality
- **Husky + lint-staged** - Git hooks
- **TypeScript Project References** - Incremental builds

## Development Workflow

### Adding a New Feature

1. Create feature branch
2. Implement changes in appropriate package(s)
3. Add validation schemas to `@compilothq/validation`
4. Update UI components in `@compilothq/ui`
5. Add database models in `@compilothq/database`
6. Implement feature in `apps/web`
7. Write tests (unit, integration, E2E as appropriate)
8. Run tests and type-checking
9. Commit with conventional commits format

### Working with Workspace Packages

When making changes to workspace packages during development:

1. Start the package in watch mode:

   ```bash
   pnpm --filter @compilothq/ui dev
   ```

2. Start Next.js dev server:

   ```bash
   pnpm --filter @compilothq/web dev
   ```

3. Changes to the package will trigger hot module reload in Next.js

### Database Workflow

1. Update schema in `packages/database/prisma/schema.prisma`

2. Generate Prisma Client (Docker auto-starts if needed):

   ```bash
   pnpm db:generate
   ```

3. Create migration (Docker auto-starts if needed):

   ```bash
   pnpm db:migrate
   ```

4. Build database package:
   ```bash
   pnpm --filter @compilothq/database build
   ```

**Note:** All `db:*` scripts automatically ensure Docker services are running and healthy before executing.

### Testing Workflow

1. Write tests alongside feature implementation
2. Run tests locally: `pnpm test:watch`
3. Ensure coverage meets 80% threshold: `pnpm test:coverage`
4. Run E2E tests before committing: `pnpm test:e2e`

**Test Database Isolation:**

- Development database: `localhost:5432`
- Test database: `localhost:5433`
- Tests never touch development data

## Git Hooks

Pre-commit hooks automatically run:

- ESLint on staged `.ts` and `.tsx` files
- Prettier on staged files

To skip hooks (not recommended):

```bash
git commit --no-verify
```

## TypeScript Configuration

The monorepo uses TypeScript project references for incremental builds:

- `tsconfig.base.json` - Shared compiler options
- `tsconfig.json` - Root config with references to all packages
- Each package has its own `tsconfig.json` extending the base

Benefits:

- Faster builds through incremental compilation
- Better IDE performance
- Ensures packages are properly isolated

## Code Quality

### Linting

```bash
pnpm lint
```

### Formatting

```bash
# Check formatting
pnpm format:check

# Fix formatting
pnpm format
```

### Type Checking

```bash
# Check all packages
pnpm typecheck

# Check specific package
pnpm --filter @compilothq/web typecheck
```

## Building for Production

```bash
# Build all packages
pnpm --filter @compilothq/database build
pnpm --filter @compilothq/ui build
pnpm --filter @compilothq/validation build

# Build Next.js app
pnpm --filter @compilothq/web build

# Start production server
pnpm --filter @compilothq/web start
```

## License

Proprietary - Compilot HQ

## Support

For issues or questions, please contact the development team.
