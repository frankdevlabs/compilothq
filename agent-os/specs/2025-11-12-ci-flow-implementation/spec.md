# Specification: CI Flow Implementation

## Goal

Implement a GitHub Actions continuous integration pipeline for the Compilo monorepo that runs linting, unit tests, builds, and E2E tests with smart testing to only verify affected packages, ensuring all checks pass before merging.

## User Stories

- As a developer, I want all my code changes to be automatically validated through CI so that bugs and quality issues are caught before merging
- As a team member, I want CI to run quickly by only testing affected packages so that I get fast feedback without wasting resources

## Specific Requirements

**GitHub Actions Workflow Configuration**

- Create `.github/workflows/ci.yml` triggered on push to all branches, PRs to main, and manual dispatch
- Use concurrency controls to cancel in-progress runs for the same ref
- Set Node.js version to 24.11.0 across all jobs
- Use pnpm as package manager with dependency caching
- Configure workflow to run on `ubuntu-latest` runners

**Linting Stage**

- Run ESLint across all packages using root-level `pnpm lint` script
- Install dependencies with pnpm and cache them between runs
- Fail fast if linting errors are detected
- Make this a required check for branch protection
- No working directory needed as lint runs from root

**Unit Tests Stage with Database Services**

- Spin up PostgreSQL 17 service container on port 5432 with user `postgres`, password `password`, database `compilothq_test`
- Spin up Redis 7 service container on port 6379
- Configure health checks: PostgreSQL with `pg_isready`, Redis with `redis-cli ping`
- Set environment variables: `DATABASE_URL=postgresql://postgres:password@localhost:5432/compilothq_test`, `REDIS_URL=redis://localhost:6379`, `CI=true`, and test environment vars from `.env.test`
- Wait for PostgreSQL readiness before proceeding
- Generate Prisma Client with `pnpm --filter @compilothq/database generate`
- Run database migrations with `pnpm --filter @compilothq/database migrate`
- Run seed data with `pnpm --filter @compilothq/database seed`
- Execute unit tests with `pnpm test:unit` and generate coverage reports
- Upload coverage artifacts with 3-day retention
- Make tests blocking (unlike my-analytics which uses `continue-on-error: true`)

**Build Stage**

- Cache pnpm dependencies based on pnpm-lock.yaml hash
- Cache Next.js build artifacts based on source file changes
- Run type checking implicitly through build process (no separate type check job)
- Build all packages using `pnpm build` from root
- Verify build artifacts exist in expected locations
- Upload build artifacts with 3-day retention
- Make this a required check for branch protection

**E2E Tests Stage**

- Run E2E tests on every commit (not optional)
- Use same PostgreSQL and Redis service containers as unit tests
- Execute E2E tests with `pnpm test:e2e` after successful build
- Make this a required check for branch protection
- Run after build job completes to ensure build artifacts are available

**Monorepo Smart Testing Strategy**

- Evaluate Turborepo vs Nx for affected package detection capabilities
- Consider Turborepo's `--filter` with dependency graph analysis
- Consider Nx's affected command with change detection
- Implement chosen tool to identify changed packages and their dependents
- Modify test/build commands to only run for affected packages
- Cache task outputs to skip unchanged package processing
- Document decision rationale in implementation

**Branch Protection Rules Configuration**

- Require all four checks to pass: Linting, Unit tests, Build, E2E tests
- Do NOT require code review approvals
- Do NOT allow bypassing required checks
- Prevent merging if any required check fails
- Configure via GitHub repository settings or `.github` configuration

**Database Migration and Seed Strategy**

- Work with persistent database artifacts between test runs (reuse test database state)
- Run migrations before every test execution to ensure schema is up-to-date
- Include seed data execution to provide realistic test scenarios
- Use artifacts from PostgreSQL service container volume
- Ensure migrations are idempotent and can run multiple times safely

**Performance Optimizations**

- Cache pnpm store to speed up dependency installation
- Cache Next.js build outputs to avoid rebuilding unchanged code
- Use monorepo smart testing to skip unaffected packages
- Run independent jobs (lint, test, build) in parallel initially
- Target CI completion under 10 minutes for unchanged code

**Test Coverage Reporting**

- Generate coverage reports using Vitest's coverage-v8 provider
- Upload coverage artifacts to GitHub Actions for visibility
- Report coverage but do NOT make it blocking (tests can fail coverage thresholds without blocking merge)
- Use existing 80% threshold configuration from `vitest.config.ts`
- Include text, JSON, and HTML coverage formats

## Visual Design

No visual assets provided.

## Existing Code to Leverage

**Docker Service Configuration**

- Use existing `docker/docker-compose.yml` service definitions for PostgreSQL 17.6 and Redis 7.4
- Adapt test database configuration from `postgres-test` service (port 5433 locally, but 5432 in CI)
- Reuse health check patterns: `pg_isready -U postgres -d compilothq_test` and `redis-cli ping`
- Use same environment variable patterns from `.env.test` file
- Leverage existing `scripts/docker-health.js` patterns for container readiness checks

**Database Package Scripts**

- Use `@compilothq/database` package scripts: `generate`, `migrate`, and `seed`
- Leverage existing Prisma schema and migrations in `packages/database/prisma/`
- Use seed script at `packages/database/prisma/seed.ts` with seed data files in `seeds/` directory
- Integrate with existing `tsx` runner for seed execution (configured in package.json prisma.seed)

**Testing Infrastructure**

- Use existing Vitest workspace configuration from root `vitest.config.ts`
- Leverage project-based test organization: database, ui, validation, web
- Use existing test scripts: `test:unit`, `test:integration`, `test:e2e`, `test:coverage`
- Apply existing coverage exclusions and 80% threshold configuration
- Use dotenv-cli pattern for test environment variables: `dotenv -e .env.test -- vitest`

**Linting and Type Checking**

- Use root-level `eslint.config.mjs` with ESLint 9 flat config
- Leverage existing `pnpm lint` script that runs ESLint across all packages
- Use `pnpm typecheck` which runs `tsc --build` across workspace
- Apply existing prettier configuration for format checking
- Use lint-staged configuration patterns for pre-commit validation

**PNPM Workspace Structure**

- Work with existing pnpm workspace defined in `pnpm-workspace.yaml`: `apps/*` and `packages/*`
- Use pnpm filter syntax: `--filter` to target specific packages
- Leverage workspace dependencies with `workspace:*` protocol
- Use pnpm's built-in caching and deduplication features
- Apply existing package manager settings: `pnpm@8.15.0` with `node>=24.11.0`

## Out of Scope

- Deployment automation or continuous delivery to any environment
- Security scanning, dependency audits, or vulnerability detection
- Code review requirements or approval workflows
- Docker image building or container registry publishing
- Production or staging environment deployment steps
- Performance testing or load testing
- Visual regression testing or screenshot comparison
- Accessibility testing or WCAG compliance checks
- Manual approval gates or human intervention steps
- Notification integrations with Slack, email, or other services
- Artifact publishing to npm or other package registries
- Release automation or version bumping
- Separate type checking job (covered by build)
- Test failure as warnings (all tests must pass)
