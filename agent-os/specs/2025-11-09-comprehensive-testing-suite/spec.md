# Specification: Comprehensive Testing Suite

## Goal

Establish a complete testing infrastructure for the Compilot HQ monorepo with Vitest for unit/integration testing, Playwright for E2E testing, test data factories for Prisma models, and achieve 80% minimum code coverage across all packages.

## User Stories

- As a developer, I want to run unit tests in isolation so that I can validate business logic without external dependencies
- As a developer, I want to run integration tests against a real test database so that I can verify API endpoints and database operations work correctly end-to-end

## Specific Requirements

**Vitest Configuration for Unit and Integration Tests**

- Create root-level `vitest.config.ts` with workspace configuration pointing to all packages
- Configure separate test environments: node for API/DAL tests, jsdom for React component tests
- Set up path aliases matching TypeScript paths (@compilothq/database, @compilothq/ui, @compilothq/validation)
- Configure coverage reporting with v8 provider, 80% threshold for statements/branches/functions/lines
- Exclude test files, config files, type definitions, and build artifacts from coverage
- Enable watch mode by default for developer experience
- Configure test file patterns: `**/__tests__/**/*.test.ts`, `**/__tests__/**/*.test.tsx`

**Playwright Configuration for E2E Tests**

- Create `playwright.config.ts` in apps/web with base URL pointing to localhost:3000
- Configure three browser contexts: chromium, firefox, webkit for cross-browser testing
- Set up test directory as `__tests__/e2e` within apps/web
- Configure webServer to auto-start Next.js dev server before tests run
- Enable trace on first retry for debugging failed tests
- Set reasonable timeouts (30s for action, 60s for test, 120s for global setup)
- Configure screenshot and video capture on failure only

**Test Scripts in package.json**

- Root package.json: `test` (vitest watch), `test:unit` (vitest run **tests**/unit), `test:integration` (vitest run **tests**/integration), `test:e2e` (playwright test), `test:watch` (vitest watch), `test:coverage` (vitest run --coverage), `test:ui` (vitest --ui)
- Each workspace package: package-specific test scripts that run only their own tests
- Add test:e2e script to apps/web package.json specifically

**Test Database Setup and Management**

- Create test database configuration using DATABASE_URL environment variable override
- Use separate PostgreSQL instance on port 5433 for test isolation (different from dev port 5432)
- Create database utilities in `packages/database/src/test-utils/db-helpers.ts` for setup/teardown
- Implement `setupTestDatabase()` function that runs migrations once in beforeAll hooks
- Implement `cleanupTestDatabase()` function that truncates all tables respecting foreign key constraints
- Provide `seedReferenceData()` helper to populate Country, DataNature, ProcessingAct, TransferMechanism, RecipientCategory tables
- Use main schema.prisma without creating separate test schema

**Prisma Test Data Factories**

- Create factory utilities in `packages/database/src/test-utils/factories/` directory
- Implement factories for all reference models: CountryFactory, DataNatureFactory, ProcessingActFactory, TransferMechanismFactory, RecipientCategoryFactory
- Each factory generates valid data by default that passes corresponding Zod validation schemas
- Support `.params()` method for creating factory variants (e.g., EUCountryFactory extends CountryFactory with gdprStatus: ['EU'])
- Handle JSON fields correctly (gdprStatus as array, examples as array)
- Provide transient parameters for related data creation when models have foreign keys
- Export type-safe factory functions with full TypeScript inference

**Unit Test Examples and Patterns**

- Create example unit tests in `packages/database/__tests__/unit/dal/countries.test.ts` demonstrating DAL function testing
- Test all CRUD operations: listCountries, getCountryById, getCountryByIsoCode, getCountriesByGdprStatus
- Use factories to create test data, mock Prisma client for true unit test isolation
- Follow AAA pattern: Arrange (setup data), Act (call function), Assert (verify result)
- Demonstrate testing error cases and edge cases (null results, empty arrays, invalid inputs)
- Create example React component tests in `packages/ui/__tests__/unit/components/button.test.tsx`
- Test component rendering, user interactions, accessibility attributes

**Integration Test Examples and Patterns**

- Create example integration test in `packages/database/__tests__/integration/dal/countries.integration.test.ts`
- Use real test database with actual Prisma client (no mocking)
- Run migrations once in beforeAll, clean database in beforeEach for test isolation
- Test database constraints: unique indexes, foreign keys, required fields
- Verify data persistence across operations (create then read, update then read)
- Test transaction behavior if DAL functions use transactions
- Demonstrate testing with seeded reference data

**E2E Test Examples and Patterns**

- Create example E2E test in `apps/web/__tests__/e2e/marketing-pages.spec.ts`
- Test critical user flows: homepage navigation, features page content loading, pricing page display
- Use Playwright page object model pattern for reusable page interactions
- Verify visual elements appear correctly, links navigate to correct URLs
- Test responsive behavior at different viewport sizes
- Demonstrate authenticated vs unauthenticated flows when auth is implemented

**Test Utilities and Helpers Package**

- Create shared test utilities in `packages/database/src/test-utils/` for database testing
- Provide utilities for mocking Next.js request/response objects for API route testing
- Create helper for mocking NextAuth session for authentication testing (prepare for future use)
- Provide type-safe assertion helpers for common patterns (assertDefined, assertArray, assertValidationError)
- Export all test utilities from `packages/database/src/test-utils/index.ts` for easy imports

## Visual Design

No visual assets provided - testing infrastructure does not require UI design.

## Existing Code to Leverage

**DAL Functions Pattern (packages/database/src/dal/countries.ts)**

- Follow existing pattern: each DAL file exports async functions wrapping Prisma queries
- Use prisma singleton imported from index.ts
- Return Prisma-generated types (Country, DataNature, etc.)
- Include JSDoc comments describing function purpose
- Test factories should generate data compatible with these DAL function inputs

**Prisma Schema (packages/database/prisma/schema.prisma)**

- Reference models already defined: Country, DataNature, ProcessingAct, TransferMechanism, RecipientCategory
- All models have id (cuid), isActive (boolean), createdAt, updatedAt timestamps
- JSON fields used for arrays: gdprStatus, examples, commonReasons
- Factories must generate data matching exact Prisma schema field types and constraints

**Monorepo Structure (pnpm workspaces)**

- Tests should be co-located with source code in each package
- Shared test utilities live in @compilothq/database for reuse across packages
- Each workspace package can run tests independently
- Root package.json aggregates test commands across all packages

**TypeScript Strict Mode (tsconfig.base.json)**

- All test files must compile with strict: true
- Use exact types from Prisma generated client (@prisma/client)
- Factory return types must match Prisma model types exactly
- Leverage TypeScript inference for test assertions

**Existing UI Components (packages/ui/src/components/)**

- Example component tests should use button.tsx, card.tsx, input.tsx as initial targets
- Components use Radix UI primitives with Tailwind styling
- Test component props, variants, disabled states, click handlers
- Verify accessibility attributes from Radix UI are present

## Out of Scope

- CI/CD pipeline configuration with GitHub Actions (separate feature)
- Mock Service Worker (MSW) setup for third-party APIs like Resend or S3 (deferred until services implemented)
- Storybook testing integration and interaction tests
- Writing comprehensive tests for all existing code (tests added incrementally)
- Performance testing or load testing infrastructure
- Visual regression testing with Percy or Chromatic
- Contract testing for external API integrations
- Snapshot testing for components (prefer explicit assertions)
- Code coverage enforcement in git hooks (developer responsibility initially)
- Test data builders for complex entity relationships (only simple factories for reference models)
