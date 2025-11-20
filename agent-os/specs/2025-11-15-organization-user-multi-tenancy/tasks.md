# Tasks: Organization & User Models with Multi-Tenancy

**Spec:** agent-os/specs/2025-11-15-organization-user-multi-tenancy/spec.md

**Status:** Completed

**Last Updated:** 2025-11-15 (Completed)

---

## Overview

This is a foundational database feature establishing the multi-tenancy architecture for Compilot HQ. The implementation includes:

- Organization and User models with proper relationships
- UserPersona and OrganizationStatus enums
- Multi-tenancy indexes for query optimization
- Soft delete implementation for Organizations
- Data Access Layer (DAL) functions
- Comprehensive seed data (3 orgs, 17 users)
- Vitest test coverage

**Total Tasks:** 28 tasks across 5 phases

**Critical Path:** Schema → Migrations → DAL → Seed Data → Tests

---

## Task List

### Phase 1: Prisma Schema & Database Setup

**Goal:** Update Prisma schema with Organization and User models, enums, and multi-tenancy indexes

#### Task Group 1.1: Enum Definitions

- [x] **[SCHEMA] Create UserPersona Enum** - Define the 6 user role types
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/schema.prisma`
  - **Details:**
    - Add enum above the Organization model in "// Authentication" section
    - Values: DPO, PRIVACY_OFFICER, BUSINESS_OWNER, IT_ADMIN, SECURITY_TEAM, LEGAL_TEAM
    - Follow enum pattern from DataNatureType (lines 31-34)
    - Document each value with inline comments explaining role
  - **Acceptance Criteria:**
    - ✓ UserPersona enum exists with all 6 values
    - ✓ Placed in Authentication section before Organization model
    - ✓ Follows existing enum naming conventions
  - **Dependencies:** None

- [x] **[SCHEMA] Create OrganizationStatus Enum** - Define organization lifecycle statuses
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/schema.prisma`
  - **Details:**
    - Add enum above the Organization model in "// Authentication" section
    - Values: ACTIVE, TRIAL, SUSPENDED, CANCELLED
    - Follow enum pattern from DataNatureType (lines 31-34)
    - Document each status with inline comments
  - **Acceptance Criteria:**
    - ✓ OrganizationStatus enum exists with all 4 values
    - ✓ Placed in Authentication section before Organization model
    - ✓ Follows existing enum naming conventions
  - **Dependencies:** None

#### Task Group 1.2: Organization Model

- [x] **[SCHEMA] Create Organization Model** - Add Organization model with soft delete support
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/schema.prisma`
  - **Details:**
    - Replace existing minimal User model (lines 18-23) with Organization model first
    - Place under "// Authentication" section header
    - Fields:
      - id: String @id @default(cuid())
      - name: String (organization display name)
      - slug: String @unique (URL-safe identifier)
      - settings: Json? (nullable, unstructured)
      - status: OrganizationStatus (lifecycle tracking)
      - deletedAt: DateTime? (soft delete timestamp)
      - createdAt: DateTime @default(now())
      - updatedAt: DateTime @updatedAt
    - Add relation: users User[] (one-to-many)
    - Add index: @@index([deletedAt]) for soft delete queries
    - Follow cuid() pattern from Country model (line 45)
    - Use @updatedAt decorator pattern from existing models
  - **Acceptance Criteria:**
    - ✓ Organization model exists with all specified fields
    - ✓ Index on deletedAt created
    - ✓ Follows existing schema conventions (cuid, @updatedAt)
    - ✓ Relation to User defined
  - **Dependencies:** Task 1.1 (UserPersona and OrganizationStatus enums must exist)

#### Task Group 1.3: User Model

- [x] **[SCHEMA] Update User Model** - Extend User model with NextAuth.js v5 fields and multi-tenancy
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/schema.prisma`
  - **Details:**
    - Place after Organization model in "// Authentication" section
    - Fields:
      - id: String @id @default(cuid())
      - name: String (required, non-nullable)
      - email: String @unique
      - emailVerified: DateTime? (NextAuth.js verification)
      - image: String? (profile picture URL)
      - organizationId: String (foreign key to Organization)
      - primaryPersona: UserPersona @default(BUSINESS_OWNER)
      - createdAt: DateTime @default(now())
      - updatedAt: DateTime @updatedAt
    - Add relation: organization Organization @relation(fields: [organizationId], references: [id])
    - Add compound indexes for multi-tenant queries:
      - @@index([organizationId, primaryPersona])
      - @@index([organizationId, createdAt])
    - Email has implicit index from @unique constraint
  - **Acceptance Criteria:**
    - ✓ User model has all NextAuth.js v5 compatible fields
    - ✓ organizationId foreign key established
    - ✓ primaryPersona has default value BUSINESS_OWNER
    - ✓ Compound indexes created with organizationId as left-most column
    - ✓ Relation to Organization defined
  - **Dependencies:** Task 1.2 (Organization model must exist for foreign key)

#### Task Group 1.4: Database Migrations

- [x] **[MIGRATION] Generate Initial Migration** - Create migration for Organization and User models
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/migrations/`
  - **Details:**
    - Run: `pnpm --filter @compilothq/database prisma migrate dev --name add-organization-user-multi-tenancy`
    - Migration should include:
      - Create UserPersona enum
      - Create OrganizationStatus enum
      - Create Organization table with all fields and indexes
      - Create User table with all fields, foreign keys, and indexes
    - Verify migration file created in migrations/ folder
    - Do not manually edit migration after creation
  - **Acceptance Criteria:**
    - ✓ Migration file created with descriptive name
    - ✓ Migration includes all enums, tables, indexes, foreign keys
    - ✓ Prisma Client types regenerated
    - ✓ Migration runs successfully without errors
  - **Dependencies:** Tasks 1.1, 1.2, 1.3 (all schema changes must be complete)

- [x] **[MIGRATION] Verify Migration Success** - Confirm database schema matches Prisma schema
  - **File(s):** N/A (verification task)
  - **Details:**
    - Check migration applied: `pnpm --filter @compilothq/database prisma migrate status`
    - Inspect database: Run `pnpm --filter @compilothq/database prisma studio` and verify:
      - Organization and User tables exist
      - All fields present with correct types
      - Indexes created (deletedAt, compound indexes)
      - Foreign key constraint on User.organizationId
    - Verify Prisma types generated: Check node_modules/.prisma/client/index.d.ts contains Organization, User, UserPersona, OrganizationStatus types
  - **Acceptance Criteria:**
    - ✓ Migration status shows all migrations applied
    - ✓ Database tables match schema definition
    - ✓ Prisma Client types available for import
    - ✓ Foreign key constraints enforced
  - **Dependencies:** Task 1.4 (migration must be generated and run)

---

### Phase 2: Data Access Layer (DAL)

**Goal:** Implement type-safe DAL functions for Organization and User models

#### Task Group 2.1: Organization DAL Functions

- [x] **[DAL] Create organizations.ts DAL file** - Implement Organization data access functions
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/dal/organizations.ts` (new file)
  - **Details:**
    - Import types: `import type { Organization } from '@prisma/client'`
    - Import prisma: `import { prisma } from '../index'`
    - Implement 7 functions with JSDoc comments:
      1. `createOrganization(data: { name: string; slug: string; status?: OrganizationStatus; settings?: Json }): Promise<Organization>`
      2. `getOrganizationById(id: string): Promise<Organization | null>` - Use findUnique
      3. `getOrganizationBySlug(slug: string): Promise<Organization | null>` - Use findUnique
      4. `updateOrganization(id: string, data: Partial<Organization>): Promise<Organization>` - Use update
      5. `softDeleteOrganization(id: string): Promise<Organization>` - Set deletedAt to now()
      6. `restoreOrganization(id: string): Promise<Organization>` - Set deletedAt to null
      7. `listOrganizations(includeDeleted = false): Promise<Organization[]>` - Filter by deletedAt based on param
    - Follow function naming pattern from countries.ts (verb-first)
    - Follow return type pattern: Promise<Model | null> for single, Promise<Model[]> for lists
    - Add where clause filtering for deletedAt in listOrganizations
  - **Acceptance Criteria:**
    - ✓ All 7 functions implemented with correct signatures
    - ✓ JSDoc comments explain each function
    - ✓ Soft delete logic correctly sets/clears deletedAt
    - ✓ listOrganizations filters deleted by default
    - ✓ Follows existing DAL patterns from countries.ts
  - **Dependencies:** Task 1.5 (Prisma types must be generated)

#### Task Group 2.2: User DAL Functions

- [x] **[DAL] Create users.ts DAL file** - Implement User data access functions with multi-tenancy
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/dal/users.ts` (new file)
  - **Details:**
    - Import types: `import type { User, UserPersona } from '@prisma/client'`
    - Import prisma: `import { prisma } from '../index'`
    - Implement 8 functions with JSDoc comments:
      1. `createUser(data: { name: string; email: string; organizationId: string; primaryPersona?: UserPersona; emailVerified?: Date; image?: string }): Promise<User>`
      2. `getUserById(id: string): Promise<User | null>` - Use findUnique
      3. `getUserByEmail(email: string): Promise<User | null>` - Use findUnique
      4. `updateUser(id: string, data: Partial<User>): Promise<User>` - Use update
      5. `deleteUser(id: string): Promise<User>` - Use delete (hard delete for now)
      6. `listUsersByOrganization(organizationId: string, options?: { persona?: UserPersona; limit?: number }): Promise<User[]>`
      7. `listUsersByPersona(organizationId: string, persona: UserPersona): Promise<User[]>` - Filter by org and persona
      8. `getUsersCount(organizationId: string): Promise<number>` - Count users in org
    - All list functions MUST filter by organizationId (security boundary)
    - Follow function naming pattern from countries.ts
    - Use orderBy: { createdAt: 'desc' } for list functions
  - **Acceptance Criteria:**
    - ✓ All 8 functions implemented with correct signatures
    - ✓ JSDoc comments explain each function
    - ✓ All list functions enforce organizationId filtering
    - ✓ listUsersByOrganization supports optional persona filter
    - ✓ Follows existing DAL patterns
  - **Dependencies:** Task 1.5 (Prisma types must be generated)

#### Task Group 2.3: Export DAL Functions

- [x] **[DAL] Export DAL functions from index.ts** - Make DAL functions available for import
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/index.ts`
  - **Details:**
    - Add exports after existing DAL exports (after line 26):
      - `export * from './dal/organizations'`
      - `export * from './dal/users'`
    - Add type exports in alphabetical order (after line 37):
      - `Organization`
      - `OrganizationStatus`
      - `User`
      - `UserPersona`
    - Maintain alphabetical ordering of exports for consistency
    - Follow existing export pattern from countries, dataNatures, etc.
  - **Acceptance Criteria:**
    - ✓ DAL functions exported and importable from @compilothq/database
    - ✓ Types exported and importable from @compilothq/database
    - ✓ Exports maintain alphabetical ordering
    - ✓ No TypeScript errors in consuming code
  - **Dependencies:** Tasks 2.1, 2.2 (DAL files must exist)

---

### Phase 3: Seed Data

**Goal:** Create comprehensive seed data for development and testing (3 orgs, 17 users)

#### Task Group 3.1: Organization Seed Data

- [x] **[SEED] Create organizations.ts seed file** - Seed 3 example organizations
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/seeds/organizations.ts` (new file)
  - **Details:**
    - Import PrismaClient: `import { PrismaClient } from '../../node_modules/.prisma/client'`
    - Export async function: `export async function seedOrganizations(prisma: PrismaClient): Promise<number>`
    - Check existing count: `const existingCount = await prisma.organization.count()`
    - If existingCount > 0, skip seeding and return existingCount
    - Create 3 organizations using createMany with skipDuplicates: true:
      1. Acme Corp (slug: 'acme-corp', status: ACTIVE, settings: null)
      2. Beta Inc (slug: 'beta-inc', status: TRIAL, settings: null)
      3. Gamma LLC (slug: 'gamma-llc', status: ACTIVE, settings: null)
    - Use consistent IDs for deterministic seeding (optional: use specific cuid values)
    - Return count of created organizations
    - Add console.log for seeding progress
    - Follow pattern from seeds/countries.ts (lines 32-38, 316-324)
  - **Acceptance Criteria:**
    - ✓ 3 organizations seeded with correct data
    - ✓ Idempotent seeding (skip if already exists)
    - ✓ Returns count of organizations
    - ✓ Follows existing seed pattern
  - **Dependencies:** Task 1.5 (migration must be applied for tables to exist)

#### Task Group 3.2: User Seed Data

- [x] **[SEED] Create users.ts seed file** - Seed 17 users across 3 organizations
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/seeds/users.ts` (new file)
  - **Details:**
    - Import PrismaClient and UserPersona: `import { PrismaClient, UserPersona } from '../../node_modules/.prisma/client'`
    - Export async function: `export async function seedUsers(prisma: PrismaClient): Promise<number>`
    - Check existing count: `const existingCount = await prisma.user.count()`
    - If existingCount > 0, skip seeding and return existingCount
    - First, fetch organization IDs by slug to get organizationId values
    - Create 17 users distributed across 3 orgs using createMany:
      - **Acme Corp (2 users):**
        - John Doe (john.doe@acme.example.com, DPO)
        - Jane Smith (jane.smith@acme.example.com, BUSINESS_OWNER)
      - **Beta Inc (5 users):**
        - Alice Johnson (alice.johnson@beta.example.com, DPO)
        - Bob Wilson (bob.wilson@beta.example.com, PRIVACY_OFFICER)
        - Carol Martinez (carol.martinez@beta.example.com, BUSINESS_OWNER)
        - David Lee (david.lee@beta.example.com, BUSINESS_OWNER)
        - Eva Garcia (eva.garcia@beta.example.com, LEGAL_TEAM)
      - **Gamma LLC (10 users):**
        - Frank Brown (frank.brown@gamma.example.com, DPO)
        - Grace Taylor (grace.taylor@gamma.example.com, PRIVACY_OFFICER)
        - Henry Anderson (henry.anderson@gamma.example.com, PRIVACY_OFFICER)
        - Iris Thomas (iris.thomas@gamma.example.com, BUSINESS_OWNER)
        - Jack Robinson (jack.robinson@gamma.example.com, BUSINESS_OWNER)
        - Kate White (kate.white@gamma.example.com, BUSINESS_OWNER)
        - Liam Harris (liam.harris@gamma.example.com, BUSINESS_OWNER)
        - Mia Clark (mia.clark@gamma.example.com, BUSINESS_OWNER)
        - Noah Lewis (noah.lewis@gamma.example.com, IT_ADMIN)
        - Olivia Walker (olivia.walker@gamma.example.com, LEGAL_TEAM)
    - Set emailVerified to null, image to null for all users
    - Return count of created users
    - Add console.log for seeding progress
    - Follow pattern from seeds/countries.ts
  - **Acceptance Criteria:**
    - ✓ 17 users seeded with correct names, emails, personas
    - ✓ Users correctly associated with organizations
    - ✓ Idempotent seeding (skip if already exists)
    - ✓ Returns count of users
    - ✓ Follows existing seed pattern
  - **Dependencies:** Task 3.1 (organizations must be seeded first for foreign keys)

#### Task Group 3.3: Update Main Seed Script

- [x] **[SEED] Update main seed.ts** - Integrate organization and user seeding
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/seed.ts`
  - **Details:**
    - Import new seed functions (after line 6):
      - `import { seedOrganizations } from './seeds/organizations'`
      - `import { seedUsers } from './seeds/users'`
    - Call seed functions in main() after existing seeds (after line 19):
      - `const organizationsCount = await seedOrganizations(prisma)`
      - `const usersCount = await seedUsers(prisma)`
    - Update totalRecords calculation to include new counts
    - Update summary console output (lines 28-34) to include:
      - `Organizations: ${organizationsCount}`
      - `Users: ${usersCount}`
    - Maintain sequential execution (organizations before users)
    - Follow existing pattern from seed.ts
  - **Acceptance Criteria:**
    - ✓ Seed script imports organization and user seed functions
    - ✓ Organizations seeded before users (dependency order)
    - ✓ Summary output includes Organizations and Users counts
    - ✓ Total records calculation updated
    - ✓ Follows existing seed script structure
  - **Dependencies:** Tasks 3.1, 3.2 (seed files must exist)

- [x] **[SEED] Run Seed Script** - Execute seeding and verify data created
  - **File(s):** N/A (execution task)
  - **Details:**
    - Run: `pnpm --filter @compilothq/database prisma db seed`
    - Verify output shows:
      - Organizations: 3
      - Users: 17
      - No errors during seeding
    - Open Prisma Studio: `pnpm --filter @compilothq/database prisma studio`
    - Verify in browser:
      - 3 organizations exist with correct slugs and statuses
      - 17 users exist with correct emails and personas
      - Users correctly linked to organizations (check organizationId)
    - Run seed again to verify idempotency (should skip existing data)
  - **Acceptance Criteria:**
    - ✓ Seed script runs without errors
    - ✓ 3 organizations created
    - ✓ 17 users created with correct organization associations
    - ✓ Re-running seed skips existing data
    - ✓ Data visible in Prisma Studio
  - **Dependencies:** Task 3.3 (main seed script must be updated)

---

### Phase 4: Testing

**Goal:** Implement comprehensive Vitest tests for DAL functions and multi-tenancy

#### Task Group 4.1: Organization DAL Tests

- [x] **[TEST] Write unit tests for Organization DAL** - Test all organization functions
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/unit/dal/organizations.test.ts` (new file)
  - **Details:**
    - Import dependencies: `import { beforeEach, describe, expect, it, vi } from 'vitest'`
    - Import DAL functions: All 7 organization functions
    - Import prisma and mock it: `vi.mock('../../../src/index', () => ({ prisma: { organization: { ... } } }))`
    - Write 2-8 focused tests:
      1. Test createOrganization creates with correct data
      2. Test getOrganizationById returns organization when exists
      3. Test getOrganizationBySlug returns null when not found
      4. Test softDeleteOrganization sets deletedAt timestamp
      5. Test listOrganizations excludes deleted by default
      6. Test listOrganizations includes deleted when includeDeleted=true
      7. Test restoreOrganization clears deletedAt
    - Use Arrange-Act-Assert pattern with comments
    - Mock Prisma client methods (findUnique, findMany, create, update)
    - Use vi.clearAllMocks() in beforeEach
    - Follow test pattern from countries.test.ts (structure, mocking, assertions)
  - **Acceptance Criteria:**
    - ✓ 2-8 focused unit tests written
    - ✓ Tests cover critical organization DAL functions
    - ✓ Tests use mocked Prisma client
    - ✓ Follows existing test patterns
    - ✓ Tests pass when run
  - **Dependencies:** Task 2.1 (Organization DAL must exist)

- [x] **[TEST] Run Organization DAL tests** - Verify organization tests pass
  - **File(s):** N/A (execution task)
  - **Details:**
    - Run: `pnpm --filter @compilothq/database test organizations.test.ts`
    - Verify all organization DAL tests pass
    - Check test output for any failures or warnings
    - Fix any failing tests before proceeding
  - **Acceptance Criteria:**
    - ✓ All organization DAL tests pass
    - ✓ No test failures or errors
    - ✓ Test coverage meets minimum requirements
  - **Dependencies:** Task 4.1 (tests must be written)

#### Task Group 4.2: User DAL Tests

- [x] **[TEST] Write unit tests for User DAL** - Test all user functions with multi-tenancy
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/unit/dal/users.test.ts` (new file)
  - **Details:**
    - Import dependencies: `import { beforeEach, describe, expect, it, vi } from 'vitest'`
    - Import DAL functions: All 8 user functions
    - Import prisma and mock it: `vi.mock('../../../src/index', () => ({ prisma: { user: { ... } } }))`
    - Write 2-8 focused tests:
      1. Test createUser creates with correct organizationId
      2. Test getUserById returns user when exists
      3. Test getUserByEmail returns null when not found
      4. Test listUsersByOrganization filters by organizationId
      5. Test listUsersByPersona filters by org and persona
      6. Test getUsersCount returns correct count for organization
      7. Test updateUser updates fields correctly
      8. Test deleteUser removes user
    - Verify multi-tenancy: listUsersByOrganization must filter by organizationId
    - Use Arrange-Act-Assert pattern
    - Mock Prisma client methods (findUnique, findMany, create, update, delete, count)
    - Follow test pattern from countries.test.ts
  - **Acceptance Criteria:**
    - ✓ 2-8 focused unit tests written
    - ✓ Tests verify organizationId filtering (multi-tenancy security)
    - ✓ Tests cover critical user DAL functions
    - ✓ Tests use mocked Prisma client
    - ✓ Follows existing test patterns
  - **Dependencies:** Task 2.2 (User DAL must exist)

- [x] **[TEST] Run User DAL tests** - Verify user tests pass
  - **File(s):** N/A (execution task)
  - **Details:**
    - Run: `pnpm --filter @compilothq/database test users.test.ts`
    - Verify all user DAL tests pass
    - Check test output for any failures or warnings
    - Fix any failing tests before proceeding
  - **Acceptance Criteria:**
    - ✓ All user DAL tests pass
    - ✓ No test failures or errors
    - ✓ Multi-tenancy filtering verified
  - **Dependencies:** Task 4.2 (tests must be written)

#### Task Group 4.3: Integration Tests

- [x] **[TEST] Write integration tests for multi-tenancy** - Test data isolation and relationships
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/multi-tenancy.test.ts` (new file)
  - **Details:**
    - Use REAL database connection (not mocked) for integration tests
    - Setup: Create test organizations and users in beforeAll
    - Cleanup: Delete test data in afterAll
    - Write up to 10 strategic integration tests:
      1. Test User.organizationId foreign key constraint (create user with invalid org should fail)
      2. Test listUsersByOrganization returns only users from specified org
      3. Test listUsersByOrganization from org A cannot see org B users
      4. Test soft delete: listOrganizations excludes deleted organizations
      5. Test restore: restoring organization makes it appear in listOrganizations
      6. Test unique email constraint (duplicate email should fail)
      7. Test unique slug constraint (duplicate organization slug should fail)
      8. Test enum validation: invalid UserPersona should fail
      9. Test enum validation: invalid OrganizationStatus should fail
      10. Test getUsersCount returns correct count per organization
    - Focus on end-to-end workflows and data isolation
    - Use real Prisma client, not mocked
    - Clean up test data after tests
  - **Acceptance Criteria:**
    - ✓ Maximum 10 integration tests written
    - ✓ Tests verify multi-tenancy data isolation
    - ✓ Tests verify foreign key constraints
    - ✓ Tests verify unique constraints
    - ✓ Tests verify enum validations
    - ✓ Tests clean up after execution
  - **Dependencies:** Tasks 2.1, 2.2, 1.5 (DAL and migrations must be complete)

- [x] **[TEST] Run integration tests** - Verify multi-tenancy isolation
  - **File(s):** N/A (execution task)
  - **Details:**
    - Run: `pnpm --filter @compilothq/database test multi-tenancy.test.ts`
    - Verify all integration tests pass
    - Check that multi-tenancy isolation works correctly
    - Verify foreign key constraints enforced
    - Fix any failing tests
  - **Acceptance Criteria:**
    - ✓ All integration tests pass
    - ✓ Multi-tenancy isolation verified
    - ✓ Foreign key constraints working
    - ✓ No data leakage between organizations
  - **Dependencies:** Task 4.3 (integration tests must be written)

#### Task Group 4.4: Seed Data Verification Tests

- [x] **[TEST] Write seed data verification tests** - Verify seed data integrity
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/seed-data.test.ts` (new file)
  - **Details:**
    - Use REAL database connection
    - Prerequisite: Run seed script before tests
    - Write up to 5 tests:
      1. Test 3 organizations exist with correct slugs
      2. Test 17 users exist with correct emails
      3. Test Acme Corp has 2 users
      4. Test Beta Inc has 5 users
      5. Test Gamma LLC has 10 users
    - Verify organization statuses (Acme: ACTIVE, Beta: TRIAL, Gamma: ACTIVE)
    - Verify user personas distribution matches requirements
    - Use real queries, not mocked
  - **Acceptance Criteria:**
    - ✓ Maximum 5 seed data verification tests
    - ✓ Tests verify correct number of orgs and users
    - ✓ Tests verify correct associations
    - ✓ Tests verify statuses and personas
    - ✓ Tests pass after seeding
  - **Dependencies:** Task 3.4 (seed data must be created)

- [x] **[TEST] Run seed data verification tests** - Confirm seed data integrity
  - **File(s):** N/A (execution task)
  - **Details:**
    - Ensure seed script has been run: `pnpm --filter @compilothq/database prisma db seed`
    - Run: `pnpm --filter @compilothq/database test seed-data.test.ts`
    - Verify all seed data tests pass
    - Confirm correct number of organizations and users
    - Confirm correct associations and data
  - **Acceptance Criteria:**
    - ✓ All seed data verification tests pass
    - ✓ Seed data integrity confirmed
    - ✓ Organization-user relationships correct
  - **Dependencies:** Task 4.4 (seed verification tests must be written)

---

### Phase 5: Verification & Documentation

**Goal:** Final verification and documentation updates

#### Task Group 5.1: Full Test Suite Verification

- [x] **[VERIFY] Run complete test suite** - Verify all tests pass together
  - **File(s):** N/A (execution task)
  - **Details:**
    - Run: `pnpm --filter @compilothq/database test`
    - Verify ALL tests pass (unit + integration):
      - Organization DAL unit tests (approximately 2-8 tests)
      - User DAL unit tests (approximately 2-8 tests)
      - Multi-tenancy integration tests (approximately 10 tests)
      - Seed data verification tests (approximately 5 tests)
      - Total: approximately 19-31 tests
    - Check test coverage report
    - Fix any failing tests
    - Ensure no warnings or errors
  - **Acceptance Criteria:**
    - ✓ All tests pass (19-31 tests total)
    - ✓ No test failures or errors
    - ✓ Test coverage meets requirements
    - ✓ No warnings in test output
  - **Dependencies:** All Phase 4 tasks (all tests must be written)

#### Task Group 5.2: Manual Testing

- [x] **[VERIFY] Manual testing with Prisma Studio** - Verify schema and data manually
  - **File(s):** N/A (manual verification)
  - **Details:**
    - Open Prisma Studio: `pnpm --filter @compilothq/database prisma studio`
    - Verify Organization table:
      - 3 organizations visible
      - All fields present and correct types
      - Soft delete field (deletedAt) exists
      - Try creating new organization manually
    - Verify User table:
      - 17 users visible
      - organizationId links to correct organizations
      - primaryPersona shows enum values
      - Try creating new user manually
    - Test multi-tenancy:
      - Filter users by organizationId
      - Verify each org has correct user count
    - Test soft delete:
      - Set deletedAt on an organization
      - Verify it's excluded from queries
  - **Acceptance Criteria:**
    - ✓ All tables and fields visible in Prisma Studio
    - ✓ Can create/update/delete records manually
    - ✓ Foreign key relationships work correctly
    - ✓ Enum values display correctly
    - ✓ Soft delete behavior works as expected
  - **Dependencies:** Task 3.4 (seed data must exist for manual testing)

#### Task Group 5.3: Documentation Updates

- [x] **[DOCS] Update spec.md with implementation notes** - Document any deviations or learnings
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-11-15-organization-user-multi-tenancy/spec.md`
  - **Details:**
    - Add "Implementation Notes" section at the end of spec.md
    - Document:
      - Any deviations from original spec (if any)
      - Learnings or gotchas discovered during implementation
      - Migration file name and location
      - Test coverage summary (number of tests, coverage %)
      - Any future improvements or technical debt
    - Keep notes concise and actionable
    - Note completion date
  - **Acceptance Criteria:**
    - ✓ Implementation Notes section added to spec.md
    - ✓ Documents deviations (if any) from spec
    - ✓ Documents migration details
    - ✓ Documents test coverage summary
    - ✓ Notes are clear and concise
  - **Dependencies:** Task 5.1 (implementation must be complete)

- [x] **[DOCS] Mark tasks.md as completed** - Update task list status
  - **File(s):** `/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-11-15-organization-user-multi-tenancy/tasks.md`
  - **Details:**
    - Update Status field at top from "Not Started" or "In Progress" to "Completed"
    - Update Last Updated date to current date
    - Check all task checkboxes as completed
    - Add final summary section with:
      - Total implementation time
      - Final test count and coverage
      - Any notable achievements or challenges
      - Link to merged PR (if applicable)
  - **Acceptance Criteria:**
    - ✓ Status updated to "Completed"
    - ✓ All checkboxes marked complete
    - ✓ Last Updated date current
    - ✓ Summary section added
  - **Dependencies:** All other tasks complete

---

## Execution Notes

### Critical Path

The minimum sequence to get to a working state:

1. Schema changes (Tasks 1.1 → 1.2 → 1.3)
2. Migration (Task 1.4)
3. DAL functions (Tasks 2.1, 2.2 in parallel)
4. Exports (Task 2.3)
5. Seed data (Tasks 3.1 → 3.2 → 3.3 → 3.4)
6. Tests (Phase 4 tasks can be done in parallel)

### Parallel Work Opportunities

**Can be done simultaneously:**

- Tasks 1.1 and 1.2 (enums and Organization model)
- Tasks 2.1 and 2.2 (Organization and User DAL files)
- Tasks 4.1 and 4.2 (unit tests for organizations and users)
- Tasks 4.3 and 4.4 (integration tests)

**Must be sequential:**

- Task 1.3 depends on 1.2 (User model needs Organization to exist)
- Task 1.4 depends on 1.1, 1.2, 1.3 (migration needs all schema changes)
- Task 3.2 depends on 3.1 (users need organizations for foreign keys)
- All Phase 2 tasks depend on Phase 1 (need Prisma types)
- All Phase 3 tasks depend on Phase 1 (need database tables)
- All Phase 4 tasks depend on Phase 2 (need DAL functions)

### Testing Strategy

- **Unit tests (Tasks 4.1, 4.2):** Mock Prisma client, test DAL function logic, 2-8 tests per DAL module
- **Integration tests (Task 4.3):** Real database, test multi-tenancy isolation, foreign keys, constraints, maximum 10 tests
- **Seed verification (Task 4.4):** Real database, verify seed data created correctly, maximum 5 tests
- **Total tests:** Approximately 19-31 tests across all test types

### Estimated Complexity

**Medium-High Complexity**

- Schema design: Medium (straightforward models, well-defined requirements)
- Migrations: Low (single migration, no data transformation)
- DAL implementation: Medium (15 functions total, multi-tenancy filtering)
- Seed data: Medium (comprehensive data, dependencies between orgs and users)
- Testing: Medium-High (multi-tenancy isolation tests, integration tests)

**Total Estimated Time:** 8-12 hours for full implementation and testing

---

## Success Criteria

This feature is complete when:

- [x] All 28 tasks marked as complete
- [x] Database schema includes Organization and User models with all specified fields
- [x] Multi-tenancy indexes created (compound indexes on organizationId)
- [x] 15 DAL functions implemented (7 org + 8 user)
- [x] All DAL functions exported from @compilothq/database
- [x] 3 organizations and 17 users seeded successfully
- [x] Approximately 19-31 tests passing (unit + integration + seed verification)
- [x] Multi-tenancy isolation verified through tests
- [x] Foreign key constraints working
- [x] Soft delete working for organizations
- [x] Documentation updated with implementation notes
- [x] No TypeScript errors
- [x] All tests pass in CI/CD pipeline (if applicable)
