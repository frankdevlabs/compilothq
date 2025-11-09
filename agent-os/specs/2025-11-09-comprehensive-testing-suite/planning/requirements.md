# Spec Requirements: Comprehensive Testing Suite

## Initial Description

"I want you to review the current state of the project and implement comprehensive testing suite for this project and implement tests where appropriate. The implementer agent seems to be skipping this."

## Product Context

### Project Overview

Compilo is a component-based GDPR compliance platform helping privacy officers generate professional documentation. The project is currently in the MVP phase with a focus on building the foundation:

- Completed: Next.js 16 App Router foundation, monorepo setup with pnpm workspaces, package-based architecture (@compilothq/ui, @compilothq/database, @compilothq/validation), and foundation reference models with seed data
- In Progress: Core entity models (ProcessingActivity, DataSubjectCategory, PersonalDataCategory, etc.)
- Upcoming: tRPC API layer, authentication with NextAuth.js v5, and component library UI

### Tech Stack Testing Tools

- Vitest: Unit testing framework (faster than Jest, better DX)
- Playwright: End-to-end testing for real workflows
- Storybook: Component development in isolation
- TypeScript 5.x in strict mode
- Testing requirements: 80% minimum code coverage, unit tests for all business logic, integration tests for API routes, E2E tests for critical user flows

## Requirements Discussion

### First Round Questions

**Q1: Test Running Scripts**
What npm scripts should be configured for running tests?

**Answer:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run __tests__/unit",
    "test:integration": "vitest run __tests__/integration",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Q2: Factory Pattern Details**
For test data factories using Prisma, should we:

- Generate valid data by default that passes Zod validation?
- Support variants using .params() method?
- Handle related data creation via transient params?

**Answer:**
Yes to all:

- Generate valid data by default (passes Zod validation)
- Support variants using .params():
  ```typescript
  export const EUCountryFactory = CountryFactory.params({ gdprStatus: ['EU', 'EEA'] })
  ```
- Handle related data via transient params

**Q3: Integration Test Database Management**
For integration tests requiring a real database:

- Should migrations run once in beforeAll or before each test?
- Should we truncate tables in beforeEach or use transactions?
- Should we use the main schema.prisma or a separate test schema?

**Answer:**

- Migrations: Run once in beforeAll (not before each test)
- Cleanup: Truncate tables in beforeEach (not transactions)
- Schema: Reuse main schema.prisma, different DATABASE_URL only (port 5433)

**Q4: CI/CD Failure Handling**
Should we implement CI/CD pipeline configuration with test failure handling, or defer this as a separate infrastructure spec?

**Answer:**
SKIP - Implement as separate feature

**Q5: MSW Setup**
Should we set up Mock Service Worker (MSW) for mocking third-party services like Resend (email) and S3 storage?

**Answer:**
SKIP - Defer until services are implemented
Reasoning: Third-party services (Resend, S3) don't exist yet, so nothing to mock.

### Existing Code to Reference

No similar existing features identified for reference. This is the first comprehensive testing implementation for the project.

### Follow-up Questions

No follow-up questions were needed. All critical decisions were clarified in the first round.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

N/A - Testing infrastructure does not require visual design assets.

## Requirements Summary

### Functional Requirements

**Test Infrastructure Setup:**

- Configure Vitest for unit and integration tests
- Configure Playwright for E2E tests
- Set up coverage reporting with 80% minimum threshold
- Organize tests in `__tests__/unit/`, `__tests__/integration/`, and `__tests__/e2e/` directories

**Test Data Factories:**

- Implement Prisma-based factory pattern for all database models
- Generate valid data by default that passes Zod validation schemas
- Support factory variants using `.params()` method for common scenarios (e.g., EUCountryFactory)
- Handle related data creation via transient parameters
- Provide factories for reference models: Country, DataNature, ProcessingAct, TransferMechanism, RecipientCategories

**Database Management for Tests:**

- Set up separate test database on port 5433 (different DATABASE_URL)
- Reuse main Prisma schema (no separate test schema needed)
- Run migrations once in beforeAll hooks (not per test)
- Truncate tables in beforeEach for clean state (not transactions)
- Provide helper utilities for database cleanup and seeding

**Testing Standards:**

- Unit tests: Test business logic in isolation using factories and mocks
- Integration tests: Test tRPC procedures with real database using test DB
- E2E tests: Test critical user flows with Playwright
- All tests must be type-safe with TypeScript strict mode
- Follow AAA pattern: Arrange, Act, Assert

**Test Scripts Configuration:**

- `test`: Run Vitest in watch mode during development
- `test:unit`: Run only unit tests
- `test:integration`: Run only integration tests
- `test:e2e`: Run Playwright E2E tests
- `test:watch`: Run tests in watch mode
- `test:coverage`: Generate coverage report
- `test:ui`: Launch Vitest UI for visual test debugging

### Reusability Opportunities

Since this is the first testing implementation:

- Create reusable test utilities that all future tests can use
- Establish factory pattern that can be extended for new models
- Set up database helpers that work for all integration tests
- Create test configuration that applies to entire monorepo

### Scope Boundaries

**In Scope:**

- Vitest configuration and setup
- Playwright configuration and setup
- Test data factories for existing reference models (Country, DataNature, etc.)
- Database setup and cleanup utilities for integration tests
- Test organization structure (`__tests__/unit/`, `__tests__/integration/`, `__tests__/e2e/`)
- Coverage reporting configuration
- npm test scripts
- Example tests demonstrating unit, integration, and E2E patterns
- Documentation for writing tests following established patterns

**Out of Scope:**

- CI/CD pipeline configuration (deferred as separate feature)
- Mock Service Worker (MSW) setup for third-party APIs (deferred until services exist)
- Storybook testing integration (separate feature)
- Comprehensive test coverage for all existing code (tests will be added incrementally)
- Performance testing or load testing infrastructure
- Visual regression testing

**Future Enhancements:**

- CI/CD integration with GitHub Actions
- MSW handlers for Resend email API
- MSW handlers for S3 storage operations
- Storybook interaction testing
- Visual regression testing with Percy or Chromatic
- Contract testing for external API integrations

### Technical Considerations

**Monorepo Testing Strategy:**

- Tests should be co-located with source code in each workspace package
- Shared test utilities in a potential `@compilothq/test-utils` package
- Each package (web, database, ui, validation) can run its own tests independently
- Root-level test scripts aggregate all package tests

**Database Considerations:**

- Test database runs on port 5433 to avoid conflicts with development database (port 5432)
- Use DATABASE_URL environment variable override for test execution
- Migrations managed by Prisma migrate
- Truncation strategy must handle foreign key constraints correctly
- Seed data may be needed for reference tables before each test suite

**Type Safety:**

- Factory types must match Prisma-generated types exactly
- Test assertions should leverage TypeScript inference
- Mock types must match actual implementation interfaces
- Zod schema validation ensures factory data is valid

**Performance:**

- Vitest runs tests in parallel by default for speed
- Database truncation must be efficient (truncate vs delete)
- Avoid running migrations per test (only once per suite)
- Integration tests slower than unit tests - keep unit tests isolated

**Integration with Existing Code:**

- Reference models already exist: Country, DataNature, ProcessingAct, TransferMechanism, RecipientCategories
- Zod validation schemas exist in `@compilothq/validation`
- Prisma schema exists in `@compilothq/database`
- No tRPC routers exist yet (API layer not implemented)
- No UI components tested yet (can add later)

**Dependencies to Install:**

- Vitest and @vitest/ui
- Playwright and @playwright/test
- @vitest/coverage-v8 for coverage reporting
- Prisma test helpers or utilities if available
- Factory library (e.g., @quramy/prisma-fabbrica or custom implementation)
