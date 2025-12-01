# Task Breakdown: DataSubjectCategory Model

## Overview

Total Tasks: 4 Task Groups, 19 Sub-tasks

This specification implements the DataSubjectCategory model for GDPR compliance, enabling classification of data subject types with vulnerability tracking and DPIA suggestion capabilities. This is a database-layer implementation only (no UI or API endpoints).

## Task List

### Database Layer

#### Task Group 1: Prisma Schema and Migration

**Dependencies:** None

- [ ] 1.0 Complete Prisma schema and migration
  - [ ] 1.1 Write 4 focused tests for DataSubjectCategory model constraints
    - Test unique constraint on `[code, organizationId]`
    - Test nullable organizationId allows system-wide categories
    - Test required fields validation (code, name)
    - Test default values (isActive: true, isSystemDefined: false)
  - [ ] 1.2 Create DataSubjectCategory Prisma model
    - **File:** `/packages/database/prisma/schema/data-subject-category.prisma`
    - Fields:
      - `id` String @id @default(cuid())
      - `code` String (uppercase identifier: EMPLOYEE, CUSTOMER, etc.)
      - `name` String (human-readable display name)
      - `description` String? (detailed explanation)
      - `category` String? (grouping: internal, external, vulnerable, special)
      - `examples` Json? (array of specific examples)
      - `isVulnerable` Boolean @default(false)
      - `vulnerabilityReason` String? (explanation text)
      - `vulnerabilityArticle` String? (GDPR reference: "Art. 35(3)(c)")
      - `gdprArticle` String? (general GDPR legal reference)
      - `suggestsDPIA` Boolean @default(false)
      - `dpiaRationale` String? (explanation for DPIA recommendation)
      - `isActive` Boolean @default(true)
      - `isSystemDefined` Boolean @default(false)
      - `organizationId` String? (nullable for hybrid scope)
      - `createdAt` DateTime @default(now())
      - `updatedAt` DateTime @updatedAt
    - Relation: Organization (optional)
    - Reuse pattern from: `/packages/database/prisma/schema.prisma` (RecipientCategory lines 238-252)
  - [ ] 1.3 Add indexes and constraints
    - Unique constraint: `@@unique([code, organizationId])`
    - Index on `organizationId`
    - Index on `[organizationId, isActive]`
    - Index on `category`
  - [ ] 1.4 Generate and verify migration
    - Run `pnpm prisma migrate dev --name add_data_subject_category`
    - Verify migration SQL is correct
    - Ensure Prisma client regenerates
  - [ ] 1.5 Ensure schema tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify migration runs successfully
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**

- DataSubjectCategory model defined in Prisma schema
- Migration creates table with all fields, indexes, and constraints
- Unique constraint on `[code, organizationId]` enforced
- Nullable organizationId supports hybrid scope pattern
- Prisma client generated with DataSubjectCategory type

---

#### Task Group 2: Seed Data Implementation

**Dependencies:** Task Group 1

- [ ] 2.0 Complete seed data implementation
  - [ ] 2.1 Write 3 focused tests for seed data integrity
    - Test seed creates exactly 13 categories
    - Test all vulnerable categories have `isVulnerable: true` and `suggestsDPIA: true`
    - Test seed is idempotent (running twice does not duplicate data)
  - [ ] 2.2 Create seed data file with 13 GDPR-based categories
    - **File:** `/packages/database/prisma/seeds/dataSubjectCategories.ts`
    - Internal category (category: "internal"):
      - EMPLOYEE: Employees and staff members
      - JOB_APPLICANT: Job applicants and candidates
      - CONTRACTOR: Contractors and freelancers
    - External category (category: "external"):
      - CUSTOMER: Customers and clients
      - PROSPECT: Prospective customers and leads
      - SUPPLIER: Suppliers and vendors
      - WEBSITE_VISITOR: Website visitors
      - NEWSLETTER_SUBSCRIBER: Newsletter and mailing list subscribers
    - Vulnerable category (category: "vulnerable", isVulnerable: true, suggestsDPIA: true):
      - MINOR: Children under 16 (vulnerabilityArticle: "Art. 8")
      - PATIENT: Patients and healthcare recipients (vulnerabilityArticle: "Art. 9")
      - STUDENT: Students and pupils
      - ELDERLY: Elderly and senior citizens
      - ASYLUM_SEEKER: Asylum seekers and refugees
    - All seeds: `isSystemDefined: true`, `organizationId: null`
    - Follow pattern from: `/packages/database/prisma/seeds/recipientCategories.ts`
  - [ ] 2.3 Register seed function in main seed file
    - **File:** `/packages/database/prisma/seeds/index.ts`
    - Import and call `seedDataSubjectCategories(prisma)`
    - Ensure proper execution order (after organization dependencies if any)
  - [ ] 2.4 Execute and verify seed
    - Run `pnpm prisma db seed`
    - Verify 13 categories created with correct data
    - Verify vulnerable categories have proper flags and articles
  - [ ] 2.5 Ensure seed tests pass
    - Run ONLY the 3 tests written in 2.1
    - Verify seed is idempotent
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**

- 13 data subject categories seeded with correct values
- All system-defined categories have `organizationId: null` and `isSystemDefined: true`
- Vulnerable categories (MINOR, PATIENT, STUDENT, ELDERLY, ASYLUM_SEEKER) have:
  - `isVulnerable: true`
  - `suggestsDPIA: true`
  - Appropriate `vulnerabilityArticle` references
- Seed is idempotent (skips if data exists)

---

#### Task Group 3: DAL Functions Implementation

**Dependencies:** Task Group 1

- [ ] 3.0 Complete DAL layer implementation
  - [ ] 3.1 Write 6 focused tests for DAL functions
    - Test `listDataSubjectCategories` returns org-specific + system-wide categories
    - Test `listDataSubjectCategories` filters by `isActive: true`
    - Test `getDataSubjectCategoryById` returns category or null
    - Test `getDataSubjectCategoryByCode` with organizationId scope
    - Test `getDataSubjectCategoryByCode` falls back to system-wide when org category not found
    - Test `getVulnerableDataSubjectCategories` filters by `isVulnerable: true`
  - [ ] 3.2 Create DAL file with 4 query functions
    - **File:** `/packages/database/src/dal/dataSubjectCategories.ts`
    - Follow pattern from: `/packages/database/src/dal/recipientCategories.ts`
  - [ ] 3.3 Implement `listDataSubjectCategories(organizationId?: string)`
    - Return active categories where `organizationId` matches OR is null (system-wide)
    - Order by `name` ascending
    - Filter by `isActive: true`
  - [ ] 3.4 Implement `getDataSubjectCategoryById(id: string)`
    - Use `findUnique` with `where: { id }`
    - Return category or null
  - [ ] 3.5 Implement `getDataSubjectCategoryByCode(code: string, organizationId?: string)`
    - First try to find org-specific category
    - Fall back to system-wide category if org-specific not found
    - Handle unique constraint on `[code, organizationId]`
  - [ ] 3.6 Implement `getVulnerableDataSubjectCategories(organizationId?: string)`
    - Filter by `isVulnerable: true`
    - Include org-specific + system-wide categories
    - Filter by `isActive: true`
    - Order by `name` ascending
  - [ ] 3.7 Export DAL functions from package index
    - **File:** `/packages/database/src/dal/index.ts`
    - Export all 4 functions
  - [ ] 3.8 Ensure DAL tests pass
    - Run ONLY the 6 tests written in 3.1
    - Verify all query patterns work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**

- All 4 DAL functions implemented and exported
- `listDataSubjectCategories` returns combined org + system categories
- `getDataSubjectCategoryByCode` handles hybrid scope with fallback logic
- `getVulnerableDataSubjectCategories` correctly filters vulnerable subjects
- All functions handle organizationId scoping correctly

---

### Testing Layer

#### Task Group 4: Test Factory and Integration Tests

**Dependencies:** Task Groups 1, 2, 3

- [ ] 4.0 Complete test infrastructure and integration tests
  - [ ] 4.1 Create DataSubjectCategoryFactory
    - **File:** `/packages/database/src/test-utils/factories/data-subject-category-factory.ts`
    - Extend `Factory` base class
    - Implement `defaults()` with sequential unique values:
      - `code`: `DSC${seq.toString().padStart(3, '0')}`
      - `name`: `Test Data Subject Category ${seq}`
      - `category`: `test`
      - `examples`: Array of test examples
      - `isVulnerable`: false
      - `suggestsDPIA`: false
      - `isActive`: true
      - `isSystemDefined`: false
      - `organizationId`: null (can be overridden)
    - Implement `persist()` method
    - Create pre-configured factory variants:
      - `createVulnerableDataSubjectCategoryFactory` (isVulnerable: true, suggestsDPIA: true)
      - `createOrganizationDataSubjectCategoryFactory` (accepts organizationId param)
    - Follow pattern from: `/packages/database/src/test-utils/factories/recipient-category-factory.ts`
  - [ ] 4.2 Export factory from test-utils index
    - **File:** `/packages/database/src/test-utils/index.ts`
    - Export `DataSubjectCategoryFactory` and variant factories
  - [ ] 4.3 Review tests from Task Groups 1-3
    - Review the 4 tests written for schema (Task 1.1)
    - Review the 3 tests written for seed (Task 2.1)
    - Review the 6 tests written for DAL (Task 3.1)
    - Total existing tests: 13 tests
  - [ ] 4.4 Write integration test file
    - **File:** `/packages/database/__tests__/integration/dal/dataSubjectCategories.integration.test.ts`
    - Follow pattern from: `/packages/database/__tests__/integration/dal/countries.integration.test.ts`
    - Use `setupTestDatabase()`, `cleanupTestDatabase()`, `disconnectTestDatabase()` hooks
    - Test organization scoping with factory-created orgs
  - [ ] 4.5 Add up to 5 additional integration tests to fill gaps
    - Test hybrid scope: org category overrides system category with same code
    - Test `getDataSubjectCategoryByCode` returns system-wide when org has no match
    - Test ordering is alphabetical by name
    - Test inactive categories are excluded from list queries
    - Test unique constraint violation on duplicate `[code, organizationId]`
  - [ ] 4.6 Run all feature-specific tests
    - Run tests from 1.1, 2.1, 3.1, and 4.5
    - Expected total: approximately 18 tests
    - Verify all critical workflows pass
    - Do NOT run the entire application test suite

**Acceptance Criteria:**

- DataSubjectCategoryFactory created with useful defaults
- Pre-configured factory variants for vulnerable and org-specific categories
- Factory exported from test-utils package
- Integration tests cover all 4 DAL functions
- Tests verify hybrid scope behavior (org + system-wide)
- All 18 feature-specific tests pass

---

## File Summary

| File Path | Task Group | Description |
|-----------|------------|-------------|
| `/packages/database/prisma/schema/data-subject-category.prisma` | 1 | Prisma model definition |
| `/packages/database/prisma/seeds/dataSubjectCategories.ts` | 2 | Seed data (13 categories) |
| `/packages/database/prisma/seeds/index.ts` | 2 | Register seed function |
| `/packages/database/src/dal/dataSubjectCategories.ts` | 3 | DAL functions (4 queries) |
| `/packages/database/src/dal/index.ts` | 3 | Export DAL functions |
| `/packages/database/src/test-utils/factories/data-subject-category-factory.ts` | 4 | Test factory |
| `/packages/database/src/test-utils/index.ts` | 4 | Export factory |
| `/packages/database/__tests__/integration/dal/dataSubjectCategories.integration.test.ts` | 4 | Integration tests |

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Prisma Schema and Migration** - Foundation for all other tasks
2. **Task Group 2: Seed Data Implementation** - Provides reference data for testing (can run in parallel with Task Group 3)
3. **Task Group 3: DAL Functions Implementation** - Core query logic (can run in parallel with Task Group 2)
4. **Task Group 4: Test Factory and Integration Tests** - Validates entire implementation

## Notes

- This implementation follows the hybrid scope pattern with nullable `organizationId`
- System-defined categories (`organizationId: null`) serve as defaults
- Organization-specific categories can override system defaults using the same code
- The unique constraint `[code, organizationId]` allows the same code in different organizations
- All DAL query functions must handle both org-specific and system-wide categories
- No UI components or tRPC API endpoints are included (out of scope)
- Processing activity relationships will be handled in a future spec
