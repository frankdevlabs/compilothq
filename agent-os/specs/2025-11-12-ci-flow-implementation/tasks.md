# Task Breakdown: CI Flow Implementation

## Overview

**Total Tasks:** 9 task groups with 60+ sub-tasks
**Estimated Timeline:** 3-5 days
**Complexity:** High (CI infrastructure, monorepo optimization, multi-stage pipeline)

## Task List

### Infrastructure & Discovery

#### Task Group 1: Project Analysis and Smart Testing Evaluation

**Dependencies:** None

- [x] 1.0 Complete infrastructure analysis and tooling decisions
  - [x] 1.1 Analyze existing project structure
    - Map current monorepo packages in `apps/*` and `packages/*`
    - Review existing test scripts: `test:unit`, `test:integration`, `test:e2e`, `test:coverage`
    - Document current pnpm workspace configuration from `pnpm-workspace.yaml`
    - Review existing Docker services in `docker/docker-compose.yml`
    - Analyze current database package scripts: `generate`, `migrate`, `seed`
  - [x] 1.2 Evaluate Turborepo vs Nx for smart testing
    - Research Turborepo's `--filter` with dependency graph analysis capabilities
    - Research Nx's affected command with change detection capabilities
    - Compare performance characteristics and overhead
    - Assess integration complexity with existing pnpm workspace
    - Evaluate caching strategies and task orchestration
    - Document decision rationale with pros/cons table
  - [x] 1.3 Install and configure chosen smart testing tool
    - Install Turborepo OR Nx as devDependency
    - Create configuration file (`turbo.json` or `nx.json`)
    - Define pipeline tasks: lint, test, build
    - Configure task dependencies and caching rules
    - Set up task inputs and outputs for cache invalidation
  - [x] 1.4 Review existing CI-related scripts
    - Audit root-level `package.json` scripts: `lint`, `test:unit`, `test:e2e`, `build`
    - Verify ESLint configuration in `eslint.config.mjs`
    - Check Vitest configuration in `vitest.config.ts`
    - Review Prisma configuration in `packages/database/prisma/schema.prisma`
    - Identify any missing scripts needed for CI execution

**Acceptance Criteria:**
- Complete understanding of monorepo structure documented
- Smart testing tool selected with documented rationale
- Tool installed and configured with basic pipeline tasks
- All existing scripts and configurations reviewed and documented

---

### Workflow Foundation

#### Task Group 2: GitHub Actions Workflow - Core Structure

**Dependencies:** Task Group 1

- [x] 2.0 Complete GitHub Actions workflow foundation
  - [ ] 2.1 Create `.github/workflows/ci.yml` file
    - Set workflow name: "CI Pipeline"
    - Configure triggers:
      - `push` to all branches
      - `pull_request` to main branch
      - `workflow_dispatch` for manual runs
    - Set up concurrency controls to cancel in-progress runs for same ref
    - Use concurrency group: `${{ github.workflow }}-${{ github.ref }}`
    - Set `cancel-in-progress: true`
  - [ ] 2.2 Configure workflow-wide settings
    - Set default shell to `bash`
    - Configure default working directory if needed
    - Set up environment variables available to all jobs
    - Add workflow permissions if needed
  - [ ] 2.3 Create reusable setup action composite
    - Create `.github/actions/setup-node-pnpm/action.yml`
    - Configure Node.js 24.11.0 setup
    - Configure pnpm installation and setup
    - Implement pnpm dependency caching based on `pnpm-lock.yaml` hash
    - Make reusable across all jobs
  - [ ] 2.4 Define job dependency graph
    - Plan job execution order: Lint → Unit Tests → Build → E2E Tests
    - Configure parallel vs sequential execution
    - Set up `needs` dependencies between jobs
  - [ ] 2.5 Add workflow documentation
    - Add header comments explaining workflow structure
    - Document each job's purpose and dependencies
    - Include links to relevant documentation

**Acceptance Criteria:**
- `.github/workflows/ci.yml` created with valid syntax
- Workflow triggers configured correctly
- Reusable setup action created and functional
- Job dependency graph clearly defined
- Workflow validates successfully (syntax check)

---

### Linting Stage

#### Task Group 3: Linting Stage Implementation

**Dependencies:** Task Group 2

- [x] 3.0 Complete linting stage
  - [ ] 3.1 Create lint job configuration
    - Job name: "Lint"
    - Runner: `ubuntu-latest`
    - Use reusable setup action from Task 2.3
    - No working directory needed (runs from root)
  - [ ] 3.2 Configure dependency installation
    - Use setup action for Node + pnpm
    - Install dependencies with `pnpm install --frozen-lockfile`
    - Verify pnpm store caching works
  - [ ] 3.3 Implement lint execution step
    - Run `pnpm lint` command
    - Ensure ESLint runs across all packages
    - Configure to fail fast on errors
  - [ ] 3.4 Add smart linting with affected packages
    - Integrate chosen smart testing tool (Turborepo/Nx)
    - Modify lint command to use: `pnpm turbo lint` or `pnpm nx affected -t lint`
    - Configure to only lint changed packages and dependents
  - [ ] 3.5 Test lint job locally
    - Use `act` or similar tool to test workflow locally if available
    - Create intentional lint error to verify failure
    - Verify lint errors block the job
    - Verify success when all linting passes

**Acceptance Criteria:**
- Lint job runs successfully on clean code
- Lint errors cause job failure
- Smart testing correctly identifies affected packages
- Job completes in reasonable time (<2 minutes for unchanged code)
- Required check can be identified in GitHub UI

---

### Unit Testing Stage

#### Task Group 4: Unit Tests Stage with Database Services

**Dependencies:** Task Group 2

- [x] 4.0 Complete unit tests stage
  - [ ] 4.1 Configure PostgreSQL 17 service container
    - Image: `postgres:17`
    - Port mapping: 5432:5432
    - Environment variables:
      - `POSTGRES_USER: postgres`
      - `POSTGRES_PASSWORD: password`
      - `POSTGRES_DB: compilothq_test`
    - Health check: `pg_isready -U postgres -d compilothq_test`
    - Options: `--health-interval 10s --health-timeout 5s --health-retries 5`
  - [ ] 4.2 Configure Redis 7 service container
    - Image: `redis:7`
    - Port mapping: 6379:6379
    - Health check: `redis-cli ping`
    - Options: `--health-interval 10s --health-timeout 5s --health-retries 3`
  - [ ] 4.3 Set up test job environment variables
    - `DATABASE_URL: postgresql://postgres:password@localhost:5432/compilothq_test`
    - `REDIS_URL: redis://localhost:6379`
    - `CI: true`
    - `NODE_ENV: test`
    - Load additional variables from `.env.test` pattern
  - [ ] 4.4 Create database setup steps
    - Wait for PostgreSQL readiness (verify with connection test)
    - Generate Prisma Client: `pnpm --filter @compilothq/database generate`
    - Run migrations: `pnpm --filter @compilothq/database migrate`
    - Run seed data: `pnpm --filter @compilothq/database seed`
  - [ ] 4.5 Implement unit test execution
    - Use setup action for Node + pnpm
    - Install dependencies with `pnpm install --frozen-lockfile`
    - Run unit tests with: `pnpm test:unit`
    - Configure smart testing: `pnpm turbo test:unit` or `pnpm nx affected -t test:unit`
  - [ ] 4.6 Configure test coverage reporting
    - Ensure Vitest coverage-v8 provider is configured
    - Generate coverage in text, JSON, and HTML formats
    - Use existing 80% threshold from `vitest.config.ts`
    - Make tests blocking (coverage threshold failures fail the job)
  - [ ] 4.7 Set up coverage artifact upload
    - Upload coverage reports to GitHub Actions
    - Artifact name: `coverage-unit-tests`
    - Include paths: `coverage/**/*`
    - Retention: 3 days
  - [ ] 4.8 Test unit tests job
    - Verify database containers start successfully
    - Verify migrations and seeds execute
    - Verify tests run and pass
    - Verify coverage reports are generated
    - Test with intentional test failure to verify blocking behavior

**Acceptance Criteria:**
- PostgreSQL and Redis services start successfully
- Database migrations run without errors
- Seed data loads correctly
- Unit tests execute and pass
- Coverage reports generated and uploaded
- Test failures block the job
- Job uses database artifacts efficiently (not rebuilding from scratch)

---

### Build Stage

#### Task Group 5: Build Stage Implementation

**Dependencies:** Task Group 4 (can run in parallel with unit tests)

- [x] 5.0 Complete build stage
  - [ ] 5.1 Create build job configuration
    - Job name: "Build"
    - Runner: `ubuntu-latest`
    - Use reusable setup action from Task 2.3
    - Consider running in parallel with unit tests (if no dependency needed)
  - [ ] 5.2 Configure build caching
    - Cache pnpm dependencies (via setup action)
    - Cache Next.js build artifacts:
      - Cache key based on: `apps/web/.next/**` and source files
      - Use `actions/cache@v4` for Next.js cache
      - Paths: `apps/web/.next/cache`
  - [ ] 5.3 Implement dependency installation
    - Use setup action for Node + pnpm
    - Install dependencies with `pnpm install --frozen-lockfile`
  - [ ] 5.4 Implement build execution
    - Run build command: `pnpm build`
    - Configure smart building: `pnpm turbo build` or `pnpm nx affected -t build`
    - Ensure type checking happens implicitly through build
    - Build all packages in dependency order
  - [ ] 5.5 Verify build artifacts
    - Check that expected build outputs exist
    - Verify Next.js build in `apps/web/.next`
    - Verify package builds in respective `dist/` directories
    - Fail job if critical artifacts missing
  - [ ] 5.6 Upload build artifacts
    - Upload build artifacts to GitHub Actions
    - Artifact name: `build-artifacts`
    - Include paths: `apps/*/dist`, `apps/*/.next`, `packages/*/dist`
    - Retention: 3 days
  - [ ] 5.7 Test build job
    - Verify build completes successfully
    - Verify all packages build correctly
    - Test with intentional TypeScript error to verify failure
    - Verify build artifacts are uploaded
    - Test cache hit scenario (unchanged code)

**Acceptance Criteria:**
- Build completes successfully for all packages
- Type checking passes (implicit in build)
- Build artifacts generated in expected locations
- Artifacts uploaded successfully
- Build failures block the job
- Caching improves performance on unchanged code

---

### E2E Testing Stage

#### Task Group 6: E2E Tests Stage Implementation

**Dependencies:** Task Group 5 (needs build artifacts)

- [x] 6.0 Complete E2E tests stage
  - [ ] 6.1 Create E2E test job configuration
    - Job name: "E2E Tests"
    - Runner: `ubuntu-latest`
    - Depends on: Build job (via `needs: [build]`)
    - Use reusable setup action from Task 2.3
  - [ ] 6.2 Configure database services for E2E
    - Reuse same PostgreSQL 17 service container config from Task 4.1
    - Reuse same Redis 7 service container config from Task 4.2
    - Use same environment variables from Task 4.3
  - [ ] 6.3 Set up E2E test environment
    - Use setup action for Node + pnpm
    - Install dependencies with `pnpm install --frozen-lockfile`
    - Download build artifacts from build job
    - Restore artifacts to correct locations
  - [ ] 6.4 Implement database setup for E2E
    - Wait for PostgreSQL readiness
    - Generate Prisma Client: `pnpm --filter @compilothq/database generate`
    - Run migrations: `pnpm --filter @compilothq/database migrate`
    - Run seed data: `pnpm --filter @compilothq/database seed`
  - [ ] 6.5 Implement E2E test execution
    - Run E2E tests with: `pnpm test:e2e`
    - Configure smart testing: `pnpm turbo test:e2e` or `pnpm nx affected -t test:e2e`
    - Ensure tests run against built artifacts
    - Make E2E tests blocking (not optional)
  - [ ] 6.6 Test E2E job
    - Verify database services start correctly
    - Verify build artifacts are restored
    - Verify E2E tests execute and pass
    - Test with intentional E2E test failure to verify blocking
    - Verify job depends correctly on build job

**Acceptance Criteria:**
- E2E job runs only after build succeeds
- Database services start successfully
- Build artifacts restored correctly
- E2E tests execute and pass
- E2E test failures block the job
- Tests run in realistic environment with seed data

---

### Smart Testing Integration

#### Task Group 7: Smart Testing Optimization

**Dependencies:** Task Groups 3, 4, 5, 6 (all pipeline stages implemented)

- [x] 7.0 Complete smart testing integration
  - [ ] 7.1 Configure task pipeline in smart testing tool
    - Define tasks in `turbo.json` or `nx.json`:
      - `lint`: depends on nothing, outputs to cache
      - `test:unit`: depends on `^build` (deps built first), outputs to cache
      - `build`: depends on `^build`, outputs to `dist/` and `.next/`
      - `test:e2e`: depends on `build`, outputs to cache
    - Configure task inputs for cache invalidation
    - Set up persistent caching
  - [ ] 7.2 Implement affected package detection
    - Configure base branch for comparison (main)
    - Set up change detection based on git diff
    - Test affected detection with various change scenarios:
      - Single package change
      - Shared package change (affects dependents)
      - Root config change (affects all)
  - [ ] 7.3 Update workflow commands to use smart testing
    - Update lint job: `pnpm turbo lint` or `pnpm nx affected -t lint`
    - Update test job: `pnpm turbo test:unit` or `pnpm nx affected -t test:unit`
    - Update build job: `pnpm turbo build` or `pnpm nx affected -t build`
    - Update E2E job: `pnpm turbo test:e2e` or `pnpm nx affected -t test:e2e`
  - [ ] 7.4 Configure remote caching (optional)
    - Evaluate GitHub Actions caching for Turborepo/Nx remote cache
    - Set up cache action for `.turbo` or `.nx` directories
    - Configure cache key based on git SHA and inputs
  - [ ] 7.5 Test smart testing in various scenarios
    - Test with no changes (all cached, minimal work)
    - Test with single package change (only affected tasks run)
    - Test with shared package change (multiple packages affected)
    - Test with root file change (all packages affected)
    - Verify cache hits and misses work correctly
  - [ ] 7.6 Optimize task parallelization
    - Review task dependency graph
    - Identify opportunities for parallel execution
    - Configure parallel task limits if needed
    - Measure performance improvements

**Acceptance Criteria:**
- Smart testing tool fully integrated with workflow
- Affected package detection works correctly
- Cache hits skip unnecessary work
- Performance significantly improved on unchanged code
- All change scenarios tested and working
- Documentation updated with smart testing details

---

### Branch Protection

#### Task Group 8: Branch Protection Configuration

**Dependencies:** Task Groups 3, 4, 5, 6 (all required checks implemented)

- [x] 8.0 Complete branch protection setup
  - [ ] 8.1 Document required checks
    - List exact job names that must pass:
      - "Lint"
      - "Unit Tests" (or actual job name from workflow)
      - "Build"
      - "E2E Tests"
    - Document check naming conventions
  - [ ] 8.2 Create branch protection configuration documentation
    - Write step-by-step instructions for GitHub UI configuration
    - Create branch protection rules for main branch:
      - Require status checks to pass before merging
      - Select all four required checks
      - Do NOT require pull request reviews
      - Do NOT allow bypass of required checks
      - Do NOT require linear history or signed commits
  - [ ] 8.3 Create automated branch protection script (optional)
    - Write script using GitHub CLI (`gh api`) to set branch protection
    - Script location: `scripts/setup-branch-protection.sh`
    - Use GitHub REST API: `PUT /repos/{owner}/{repo}/branches/{branch}/protection`
    - Include all required check names
    - Document how to run the script
  - [ ] 8.4 Create `.github/settings.yml` for repository configuration (optional)
    - Use GitHub Settings app or similar for GitOps approach
    - Define branch protection rules as code
    - Include required status checks
    - Document prerequisites (GitHub app installation)
  - [ ] 8.5 Test branch protection
    - Create test branch with intentional failures
    - Verify each failing check blocks merge
    - Verify all passing checks allow merge
    - Verify no review requirement (can self-merge)
    - Document test results

**Acceptance Criteria:**
- Branch protection documentation complete
- Clear instructions for manual setup via GitHub UI
- Optional automated setup script created
- Branch protection tested and working
- All four checks correctly marked as required
- Merge blocked when any check fails

---

### Testing & Validation

#### Task Group 9: End-to-End Pipeline Testing and Optimization

**Dependencies:** Task Groups 1-8 (entire pipeline implemented)

- [x] 9.0 Complete pipeline validation and optimization
  - [ ] 9.1 Test complete pipeline with clean code
    - Push commit with no changes to verify all stages pass
    - Verify all jobs execute in correct order
    - Verify all artifacts uploaded successfully
    - Measure total pipeline duration (target: <10 minutes for clean run)
    - Document baseline performance metrics
  - [ ] 9.2 Test pipeline failure scenarios
    - Create commit with lint error → verify Lint job fails and blocks
    - Create commit with TypeScript error → verify Build job fails and blocks
    - Create commit with unit test failure → verify Unit Tests job fails and blocks
    - Create commit with E2E test failure → verify E2E Tests job fails and blocks
    - Verify each failure prevents merge via branch protection
  - [ ] 9.3 Test smart testing optimization
    - Make change to single package → verify only affected tasks run
    - Make change to shared package → verify dependents are tested
    - Make no changes → verify maximum cache utilization
    - Measure performance improvements vs running all tests
    - Document cache hit rates and time savings
  - [ ] 9.4 Test caching effectiveness
    - Test pnpm dependency cache (measure install time reduction)
    - Test Next.js build cache (measure build time reduction)
    - Test task output cache from Turborepo/Nx
    - Verify cache invalidation on actual changes
    - Document caching performance gains
  - [ ] 9.5 Optimize pipeline performance
    - Identify bottlenecks in pipeline execution
    - Adjust job dependencies to maximize parallelization
    - Tune cache configurations for optimal hit rates
    - Consider splitting large test suites if needed
    - Implement any quick performance wins
  - [ ] 9.6 Test database artifact reuse
    - Verify migrations don't run unnecessarily
    - Verify seed data loads correctly
    - Test migration ordering and idempotency
    - Ensure database state is consistent across test runs
  - [ ] 9.7 Validate coverage reporting
    - Verify coverage artifacts upload correctly
    - Check coverage reports are readable and complete
    - Verify 80% threshold is enforced (tests fail below threshold)
    - Test that coverage is reported but not blocking at workflow level
  - [ ] 9.8 Create pipeline documentation
    - Document pipeline architecture and flow
    - Create troubleshooting guide for common issues
    - Document how to run pipeline locally (if possible)
    - Document smart testing and caching strategies
    - Add performance benchmarks and targets
  - [ ] 9.9 Perform final integration test
    - Create realistic PR with mixed changes
    - Verify all checks run correctly
    - Verify branch protection enforces check requirements
    - Verify merge succeeds when all checks pass
    - Verify merge blocked when any check fails

**Acceptance Criteria:**
- All pipeline stages execute successfully on clean code
- All failure scenarios properly block merges
- Smart testing correctly identifies and runs affected tasks
- Caching provides measurable performance improvements
- Pipeline completes in <10 minutes for unchanged code
- Coverage reports generated and accessible
- Comprehensive documentation created
- Branch protection correctly enforces all checks
- Pipeline ready for production use

---

## Execution Order

### Phase 1: Foundation (Days 1-2)
1. Infrastructure & Discovery (Task Group 1)
2. GitHub Actions Workflow - Core Structure (Task Group 2)

### Phase 2: Core Pipeline (Days 2-3)
3. Linting Stage Implementation (Task Group 3)
4. Unit Tests Stage with Database Services (Task Group 4)
5. Build Stage Implementation (Task Group 5)
6. E2E Tests Stage Implementation (Task Group 6)

### Phase 3: Optimization & Validation (Days 3-4)
7. Smart Testing Optimization (Task Group 7)
8. Branch Protection Configuration (Task Group 8)

### Phase 4: Testing & Documentation (Day 5)
9. End-to-End Pipeline Testing and Optimization (Task Group 9)

---

## Key Milestones

1. **Smart Testing Tool Selected** (End of Task Group 1)
   - Clear decision documented with rationale
   - Tool installed and basic configuration complete

2. **Basic Pipeline Functional** (End of Task Group 6)
   - All four stages working independently
   - Each stage can pass/fail correctly
   - No smart testing yet, runs all packages

3. **Smart Testing Integrated** (End of Task Group 7)
   - Pipeline optimized to only test affected packages
   - Caching working effectively
   - Performance improvements measurable

4. **Production Ready** (End of Task Group 9)
   - All tests passing
   - Branch protection configured
   - Documentation complete
   - Performance targets met

---

## Technical Reference

### Files to Create/Modify

**New Files:**
- `.github/workflows/ci.yml` - Main CI workflow
- `.github/actions/setup-node-pnpm/action.yml` - Reusable setup action
- `turbo.json` OR `nx.json` - Smart testing configuration (depending on tool choice)
- `scripts/setup-branch-protection.sh` - Optional automated setup script
- `.github/settings.yml` - Optional GitOps configuration

**Files to Review:**
- `pnpm-workspace.yaml` - Workspace configuration
- `package.json` - Root scripts
- `vitest.config.ts` - Test configuration
- `eslint.config.mjs` - Lint configuration
- `packages/database/prisma/schema.prisma` - Database schema
- `docker/docker-compose.yml` - Local Docker services
- `.env.test` - Test environment variables

### Key Commands

**Smart Testing (Turborepo):**
- `pnpm turbo lint` - Lint all affected packages
- `pnpm turbo test:unit` - Test all affected packages
- `pnpm turbo build` - Build all affected packages

**Smart Testing (Nx):**
- `pnpm nx affected -t lint` - Lint all affected packages
- `pnpm nx affected -t test:unit` - Test all affected packages
- `pnpm nx affected -t build` - Build all affected packages

**Database:**
- `pnpm --filter @compilothq/database generate` - Generate Prisma Client
- `pnpm --filter @compilothq/database migrate` - Run migrations
- `pnpm --filter @compilothq/database seed` - Run seed data

**Testing:**
- `pnpm test:unit` - Run unit tests
- `pnpm test:e2e` - Run E2E tests
- `pnpm test:coverage` - Run tests with coverage

---

## Success Criteria

### Pipeline Performance
- [ ] Clean code pipeline completes in <10 minutes
- [ ] Cached runs complete in <3 minutes for unchanged code
- [ ] Single package change runs in <5 minutes

### Smart Testing
- [ ] Affected package detection accuracy: 100%
- [ ] Cache hit rate: >80% on unchanged code
- [ ] Only affected packages tested/built

### Quality Gates
- [ ] All lint errors block merge
- [ ] All test failures block merge
- [ ] All build failures block merge
- [ ] Coverage threshold enforced (80%)

### Developer Experience
- [ ] Clear feedback on which check failed
- [ ] Fast feedback loop (<5 minutes typical)
- [ ] Ability to run checks locally
- [ ] Comprehensive troubleshooting documentation

---

## Notes

- **Test Limiting Philosophy:** Each pipeline stage should write focused tests (2-8 tests) that verify critical functionality. Task Group 9 may add up to 10 additional integration tests if critical gaps are identified.

- **Turborepo vs Nx Decision:** This decision in Task Group 1 will affect all subsequent implementation. Nx offers more powerful affected detection but adds complexity. Turborepo is simpler and integrates well with pnpm workspaces.

- **Database Artifacts:** The spec requires working with persistent database artifacts rather than fresh setup each time. However, GitHub Actions service containers don't persist between jobs. This means migrations will run each time, but the pattern should be designed to support artifact reuse when possible (e.g., cached migration results).

- **Parallel vs Sequential:** Initially, Lint, Unit Tests, and Build can run in parallel. E2E tests must run after Build succeeds. This maximizes parallelization while respecting dependencies.

- **Coverage Reporting:** Coverage is generated and reported but won't block the workflow at the job level. However, the 80% threshold in vitest.config.ts will cause test commands to fail if coverage is below threshold, which will block the pipeline.

- **Service Container Ports:** GitHub Actions service containers expose ports directly to localhost, so use `localhost:5432` and `localhost:6379` in connection strings, not container networking.

- **Seed Data:** Seed data should be idempotent and safe to run multiple times, as it will execute on every test job run.
