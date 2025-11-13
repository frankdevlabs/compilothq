# Spec Requirements: CI Flow Implementation

## Initial Description

Create a spec for a CI flow similar to this one: https://github.com/frankdevlabs/my-analytics

The goal is to implement a continuous integration pipeline for the Compilo monorepo that mirrors the structure and approach used in the my-analytics reference repository, adapted for our specific stack and requirements.

## Requirements Discussion

### First Round Questions

**Q1: Which CI/CD platform should we use?**
**Answer:** GitHub Actions (same as my-analytics reference)

**Q2: What should the pipeline stages include?**
**Answer:** Linting → Unit tests → Build → E2E tests (run checks separately for visibility)

**Q3: Should we include Docker services for database and Redis like my-analytics?**
**Answer:** Yes, use the same Docker setup as my-analytics (PostgreSQL 17 + Redis 7)

**Q4: Should this spec include deployment steps, or just CI?**
**Answer:** Focus on CI only (no deployment)

**Q5: How should test coverage be handled?**
**Answer:** Test coverage should be reported but not blocking

**Q6: Should we include database migration checks?**
**Answer:** Yes, database checks are included

**Q7: Should we include security scanning or dependency audits?**
**Answer:** Out of scope for this spec

**Q8: Since this is a monorepo, should we implement smart testing that only tests affected packages?**
**Answer:** Yes, use Turborepo or Nx (assess which best meets our needs for detecting affected packages)

**Q9: Should we enforce branch protection rules that require all checks to pass?**
**Answer:** Yes, branch protection with no code review required

**Q10: Are there any specific things we should explicitly exclude from this CI flow?**
**Answer:** Security checks, deployment, code review requirements

### Follow-up Questions

**Follow-up 1: Should type checking be a separate job, or is it covered by the build step?**
**Answer:** Already covered by the build step (no separate type check job needed)

**Follow-up 2: Should E2E tests be optional or required for every commit?**
**Answer:** Run on every job (not optional - they run every time)

**Follow-up 3: For monorepo smart testing, should we use Turborepo or Nx?**
**Answer:** Use Turborepo/Nx (assess which best meets our needs for detecting affected packages)

**Follow-up 4: Should we use Node 24.11.0 as specified in the tech stack?**
**Answer:** Yes, use Node 24.11.0

**Follow-up 5: What package manager should the CI use?**
**Answer:** pnpm

**Follow-up 6: Should database migrations include seed data, or just schema?**
**Answer:** Yes, run before tests and include seed data. Work with artifacts and not a completely fresh database.

**Follow-up 7: For branch protection, which specific checks are required to pass?**
**Answer:** All checks are required to pass before merging (Linting, Unit tests, Build, E2E tests)

### Existing Code to Reference

**Similar Features Identified:**

- Reference repository: my-analytics (https://github.com/frankdevlabs/my-analytics)
- CI workflow file: `.github/workflows/ci.yml`
- Docker setup with PostgreSQL 17.6 and Redis 7.4
- Linting script integration
- Jest test framework with coverage reporting
- Next.js build verification
- Prisma database migrations

**CI Workflow Structure from my-analytics:**

The reference repository uses a three-job parallel pipeline:

1. **Lint Job:**
   - Node 20.10.0
   - Working directory: `./app`
   - Runs ESLint
   - Uses `npm ci --legacy-peer-deps` for installation

2. **Test Job:**
   - PostgreSQL 17.6 service container (port 5432)
   - Redis 7.4 service container (port 6379)
   - Database: `my_analytics_test`
   - Database URL: `postgresql://postgres:password@localhost:5432/my_analytics_test`
   - Redis URL: `redis://localhost:6379`
   - Waits for PostgreSQL readiness
   - Creates test database
   - Generates Prisma Client
   - Runs database migrations
   - Executes tests with coverage
   - Tests use `continue-on-error: true` (non-blocking failures)
   - Uploads coverage artifacts

3. **Build Job:**
   - Caches Next.js build artifacts
   - Builds tracker script: `npm run build:tracker`
   - Builds Next.js application
   - Uses dummy production environment variables for validation
   - Verifies build artifacts exist
   - Uploads build artifacts

4. **CI Summary Job:**
   - Runs after all jobs complete
   - Enforces success for linting and building
   - Treats test failures as warnings (not blockers)

**Key Configuration Details:**
- Triggers: Push to all branches, PRs to main, manual dispatch
- Concurrency controls prevent duplicate workflows on same ref
- Node version: 20.10.0 (we'll adapt to 24.11.0)
- Working directory: `./app` (we'll adapt for monorepo structure)
- Package manager: npm with legacy peer deps (we'll adapt to pnpm)

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

N/A - No visual assets to analyze.

## Requirements Summary

### Functional Requirements

**Core CI Pipeline:**
- Implement GitHub Actions workflow for continuous integration
- Create four main pipeline stages: Linting → Unit tests → Build → E2E tests
- Run all checks on every commit and pull request
- Use concurrency controls to prevent duplicate workflow runs

**Linting Stage:**
- Run ESLint across all packages
- Use Node 24.11.0
- Install dependencies with pnpm
- Fail fast if linting errors detected
- Required to pass for merge

**Unit Tests Stage:**
- Spin up Docker service containers (PostgreSQL 17 + Redis 7)
- Configure test database connection
- Wait for database readiness
- Generate Prisma Client
- Run database migrations with seed data
- Execute unit tests across all affected packages
- Generate test coverage reports
- Upload coverage artifacts
- Required to pass for merge

**Build Stage:**
- Cache build artifacts for performance
- Build all affected packages in the monorepo
- Verify build artifacts are generated successfully
- Use production environment variables (dummy values for validation)
- Type checking is implicitly handled by build step
- Required to pass for merge

**E2E Tests Stage:**
- Run end-to-end tests for all affected packages
- Use same database and Redis services as unit tests
- Tests run on every commit (not optional)
- Required to pass for merge

**Monorepo Smart Testing:**
- Use Turborepo or Nx for affected package detection
- Only test/build packages that changed or depend on changed packages
- Assess which tool (Turborepo vs Nx) best meets our needs during implementation
- Optimize CI run time by skipping unaffected packages

**Branch Protection:**
- Require all checks to pass before merging
- No code review required
- Specific required checks: Linting, Unit tests, Build, E2E tests

**Database Management:**
- Work with database artifacts (not completely fresh database each time)
- Run migrations before tests
- Include seed data for realistic test scenarios
- Use PostgreSQL 17 in Docker service container
- Use Redis 7 in Docker service container

### Reusability Opportunities

**From my-analytics reference:**
- Docker service container configuration for PostgreSQL and Redis
- Database readiness check pattern
- Prisma Client generation and migration steps
- Coverage artifact upload pattern
- Build artifact caching strategy
- CI summary job pattern (though we'll make all checks blocking)

**From existing Compilo tech stack:**
- Node 24.11.0 version (upgrade from my-analytics' 20.10.0)
- pnpm package manager (replace npm)
- Monorepo structure with packages (adapt from single app)
- TypeScript strict mode enforcement
- Next.js 16 build process

### Scope Boundaries

**In Scope:**
- GitHub Actions workflow configuration
- Linting stage with ESLint
- Unit test stage with database services
- Build stage with type checking
- E2E test stage
- Test coverage reporting (non-blocking)
- Database migration execution
- Seed data loading
- Monorepo smart testing with Turborepo/Nx
- Branch protection configuration
- Build and test artifact caching
- Concurrency controls

**Out of Scope:**
- Deployment automation (CI only, not CD)
- Security scanning and dependency audits
- Code review requirements
- Docker image building
- Production environment deployment
- Staging environment deployment
- Performance testing
- Visual regression testing
- Accessibility testing
- Manual approval gates
- Notification integrations (Slack, email, etc.)

### Technical Considerations

**Technology Stack:**
- CI Platform: GitHub Actions
- Runtime: Node 24.11.0 (upgrade from my-analytics' 20.10.0)
- Package Manager: pnpm (change from my-analytics' npm)
- Database: PostgreSQL 17 (service container)
- Cache: Redis 7 (service container)
- ORM: Prisma with migrations and client generation
- Framework: Next.js 16 with App Router
- Test Framework: Not yet specified (my-analytics uses Jest)
- Monorepo Tool: Turborepo or Nx (to be assessed)

**Integration Points:**
- GitHub repository webhook triggers
- Docker Hub for service container images
- GitHub Actions cache for dependencies and build artifacts
- Artifact storage for test coverage and build outputs
- Branch protection rules API

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string for tests
- `REDIS_URL`: Redis connection string for tests
- Production variables: Dummy values for build validation
- Node environment: CI flag set to true

**Performance Optimizations:**
- Cache pnpm dependencies between runs
- Cache Next.js build outputs
- Use monorepo smart testing to skip unaffected packages
- Run independent jobs in parallel (lint, test, build initially)
- Reuse database artifacts instead of fresh setup each time

**Differences from my-analytics reference:**
1. **Node Version**: Upgrade from 20.10.0 to 24.11.0
2. **Package Manager**: Switch from npm to pnpm
3. **Architecture**: Adapt from single app to monorepo with multiple packages
4. **Smart Testing**: Add Turborepo/Nx for affected package detection
5. **Test Failures**: Make blocking (vs. my-analytics' `continue-on-error: true`)
6. **E2E Tests**: Add explicit E2E test stage
7. **Type Checking**: Integrated in build (no separate stage needed)
8. **Database Artifacts**: Reuse database state instead of fresh setup
9. **Working Directory**: Adapt from `./app` to monorepo structure

**Constraints:**
- Must work with existing monorepo structure
- Must use pnpm workspaces
- Must support multiple packages in parallel
- Must integrate with existing Prisma schema
- Must support both unit and E2E tests
- Must maintain fast feedback loop (optimize for speed)
- Must cache aggressively to reduce CI time
- Must be cost-effective (GitHub Actions free tier considerations)

**Success Criteria:**
- All pipeline stages execute successfully
- Smart testing correctly identifies affected packages
- Failed checks block merging
- Test coverage is reported and visible
- Build artifacts are generated and cached
- CI completes in reasonable time (target: <10 minutes for unchanged code)
- Database migrations run successfully with seed data
- E2E tests run reliably with consistent environment
