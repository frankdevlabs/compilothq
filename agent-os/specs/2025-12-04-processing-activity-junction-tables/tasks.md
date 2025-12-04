# Task Breakdown: Processing Activity Junction Tables

## Overview

Implement four junction tables linking DataProcessingActivity to Purpose, DataSubjectCategory, DataCategory, and Recipient to enable many-to-many relationships for GDPR Article 30 compliance tracking. This spec replaces the temporary `activityIds` array field on Recipient with a proper junction table architecture.

**Complexity:** S (Small)
**Total Task Groups:** 5
**Estimated Tasks:** ~35 sub-tasks

## Task List

### Database Schema Layer

#### Task Group 1: Schema Models and Migration

**Dependencies:** None

- [x] 1.0 Complete database schema and migration
  - [x] 1.1 Write 2-8 focused tests for junction table structure
    - Test unique constraint prevents duplicate relationships
    - Test bidirectional FK relationships work correctly
    - Test cascade deletion on activity side
    - Test restrict deletion on component side
    - Limit to critical junction table behaviors only
  - [x] 1.2 Add 4 junction table models to schema.prisma
    - Model: `DataProcessingActivityPurpose` (activityId, purposeId)
    - Model: `DataProcessingActivityDataSubject` (activityId, dataSubjectCategoryId)
    - Model: `DataProcessingActivityDataCategory` (activityId, dataCategoryId)
    - Model: `DataProcessingActivityRecipient` (activityId, recipientId)
    - Each includes: id (cuid), two FK columns, createdAt timestamp
    - Follow exact pattern from: `DataCategoryDataNature` (schema.prisma:406-420)
  - [x] 1.3 Add unique constraints and indexes to junction tables
    - Unique constraint on FK pair: `@@unique([activityId, componentId])`
    - Bidirectional indexes: `@@index([activityId])` and `@@index([componentId])`
    - Ensures no duplicate relationships and optimal query performance
  - [x] 1.4 Set cascade rules for junction tables
    - Activity side: `onDelete: Cascade` (deleting activity removes links)
    - Component side: `onDelete: Restrict` (prevents deletion if linked)
    - Reference: `DataCategoryDataNature` pattern (schema.prisma:413-414)
  - [x] 1.5 Update DataProcessingActivity model relations
    - Add relation: `purposes DataProcessingActivityPurpose[]`
    - Add relation: `dataSubjects DataProcessingActivityDataSubject[]`
    - Add relation: `dataCategories DataProcessingActivityDataCategory[]`
    - Add relation: `recipients DataProcessingActivityRecipient[]`
  - [x] 1.6 Update component model relations
    - Purpose: Add `activities DataProcessingActivityPurpose[]`
    - DataSubjectCategory: Add `activities DataProcessingActivityDataSubject[]`
    - DataCategory: Add `activities DataProcessingActivityDataCategory[]`
    - Recipient: Add `activities DataProcessingActivityRecipient[]`
  - [x] 1.7 Remove Recipient.activityIds field from schema
    - Delete line: `activityIds String[] @default([])`
    - This is the temporary field being replaced by junction table
  - [x] 1.8 Document future extension for DataProcessingActivityRecipient
    - Add comment noting potential Roadmap #15 extension
    - Future fields: `involvesThirdCountryTransfer` Boolean, `transferBasis` enum
    - Rationale: GDPR Article 30(1)(d) third-country transfer tracking
  - [x] 1.9 Create migration file
    - Create all 4 junction tables with constraints and indexes
    - Migrate existing `Recipient.activityIds` data to junction records
    - Drop `Recipient.activityIds` column
    - Reference SQL pattern: `20251202203143_add_gdpr_compliance_foundation_models/migration.sql`
  - [ ] 1.10 Run migration and regenerate Prisma client
    - Execute: `pnpm db:migrate` (creates migration, applies to DB, regenerates client)
    - Verify migration applies cleanly without errors
    - NOTE: Database connection was unavailable during implementation - this step must be done manually
  - [ ] 1.11 Ensure schema layer tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify junction table constraints work correctly
    - Do NOT run the entire test suite at this stage
    - NOTE: Tests cannot run until migration is applied (step 1.10)

**Acceptance Criteria:**

- The 2-8 tests written in 1.1 pass
- All 4 junction tables exist with correct structure (id, FKs, createdAt)
- Unique constraints prevent duplicate relationships
- Bidirectional indexes exist on all FKs
- Cascade rules correctly configured (Cascade for activity, Restrict for components)
- `Recipient.activityIds` field removed from schema
- Migration successfully migrates existing activityIds data
- Prisma client regenerates without TypeScript errors
- Future extension documented in schema comments

---

### Data Access Layer (DAL)

#### Task Group 2: Junction DAL Functions

**Dependencies:** Task Group 1

- [ ] 2.0 Complete DAL functions for junction management
  - [ ] 2.1 Write 2-8 focused tests for DAL functions
    - Test sync operations replace all relationships atomically
    - Test link operations add relationships without removing existing
    - Test unlink operations remove specific relationships
    - Test multi-tenancy enforcement (organizationId validation)
    - Test transaction atomicity for sync operations
    - Limit to critical DAL function behaviors only
  - [ ] 2.2 Create sync functions for all 4 junction types
    - Function: `syncActivityPurposes(activityId, organizationId, purposeIds)`
    - Function: `syncActivityDataCategories(activityId, organizationId, dataCategoryIds)`
    - Function: `syncActivityDataSubjects(activityId, organizationId, dataSubjectIds)`
    - Function: `syncActivityRecipients(activityId, organizationId, recipientIds)`
    - Use Prisma transactions (delete existing + create new atomically)
    - Use `skipDuplicates: true` for idempotent createMany operations
    - Enforce multi-tenancy by validating organizationId ownership
    - Follow pattern from: `dataCategories.ts:327-341`
  - [ ] 2.3 Create link helper functions (add without replacing)
    - Function: `linkActivityToPurposes(activityId, organizationId, purposeIds)`
    - Function: `linkActivityToDataCategories(activityId, organizationId, dataCategoryIds)`
    - Function: `linkActivityToDataSubjects(activityId, organizationId, dataSubjectIds)`
    - Function: `linkActivityToRecipients(activityId, organizationId, recipientIds)`
    - Add new relationships without deleting existing ones
    - Validate organizational ownership before adding links
  - [ ] 2.4 Create unlink helper functions (remove specific links)
    - Function: `unlinkActivityFromPurpose(activityId, organizationId, purposeId)`
    - Function: `unlinkActivityFromDataCategory(activityId, organizationId, dataCategoryId)`
    - Function: `unlinkActivityFromDataSubject(activityId, organizationId, dataSubjectId)`
    - Function: `unlinkActivityFromRecipient(activityId, organizationId, recipientId)`
    - Remove single relationship by deleting junction record
    - Validate organizational ownership before removing link
  - [ ] 2.5 Create query helper function
    - Function: `getActivityWithComponents(activityId, organizationId)`
    - Query activity with all related entities using Prisma's include syntax
    - Include: purposes, dataSubjects, dataCategories, recipients
    - Enforce multi-tenancy by requiring organizationId parameter
  - [ ] 2.6 Update existing DAL functions in recipients.ts
    - Remove all references to `activityIds` field
    - Update any queries that used `activityIds` to use junction tables instead
    - Ensure backward compatibility for recipient operations
  - [ ] 2.7 Create DAL file for DataProcessingActivity junctions
    - File location: `/packages/database/src/dal/dataProcessingActivityJunctions.ts`
    - Export all sync, link, unlink, and query functions
    - Include proper TypeScript types for function parameters
  - [ ] 2.8 Export DAL functions from package index
    - Update: `/packages/database/src/index.ts`
    - Add: `export * from './dal/dataProcessingActivityJunctions'`
    - Follow pattern from: `database/src/index.ts:28-44`
  - [ ] 2.9 Ensure DAL layer tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify sync operations work atomically
    - Verify multi-tenancy enforcement works
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**

- The 2-8 tests written in 2.1 pass
- All sync functions replace relationships atomically using transactions
- All link functions add relationships without removing existing ones
- All unlink functions remove specific relationships
- Multi-tenancy enforced (organizationId validation) in all functions
- `getActivityWithComponents` queries all related entities correctly
- Existing DAL functions updated to use junction tables
- All functions exported from package index

---

### Validation Layer

#### Task Group 3: Zod Schema Updates

**Dependencies:** Task Group 2

- [ ] 3.0 Complete validation schema updates
  - [ ] 3.1 Write 2-8 focused tests for validation schemas
    - Test Recipient input schema rejects activityIds field
    - Test Recipient output schema doesn't include activityIds
    - Test junction operation schemas validate arrays of cuids
    - Test sync operation schemas enforce required fields
    - Limit to critical validation behaviors only
  - [ ] 3.2 Update Recipient validation schemas
    - Remove `activityIds` field from input schemas
    - Remove `activityIds` field from output schemas
    - Update any composite schemas that include Recipient
    - File location: `/packages/validation/src/schemas/recipient.ts` (if exists)
  - [ ] 3.3 Create validation schemas for junction operations
    - Schema: `activityPurposeSyncSchema` (activityId: string, purposeIds: string[])
    - Schema: `activityDataCategorySyncSchema` (activityId: string, dataCategoryIds: string[])
    - Schema: `activityDataSubjectSyncSchema` (activityId: string, dataSubjectIds: string[])
    - Schema: `activityRecipientSyncSchema` (activityId: string, recipientIds: string[])
    - All IDs validated as cuid strings using `.cuid()`
    - Arrays validated as non-empty when required
  - [ ] 3.4 Create validation schemas for link operations
    - Schema: `activityComponentLinkSchema` (activityId: string, componentIds: string[])
    - Reusable schema for all link operations
    - Validates arrays of cuid strings
  - [ ] 3.5 Create validation schema for unlink operations
    - Schema: `activityComponentUnlinkSchema` (activityId: string, componentId: string)
    - Reusable schema for all unlink operations
    - Validates single cuid string for component
  - [ ] 3.6 Export validation schemas
    - File location: `/packages/validation/src/schemas/dataProcessingActivity.ts`
    - Export all sync, link, and unlink schemas
    - Include proper TypeScript types derived from Zod schemas
  - [ ] 3.7 Ensure validation layer tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify Recipient schemas reject activityIds
    - Verify junction schemas validate correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**

- The 2-8 tests written in 3.1 pass
- `activityIds` field removed from all Recipient schemas
- Junction operation schemas validate activityId and component ID arrays
- All schemas enforce required fields and proper data types
- Schemas use `.cuid()` validation for all ID fields
- All schemas exported and properly typed

---

### Integration Testing

#### Task Group 4: Comprehensive Integration Tests

**Dependencies:** Task Groups 1-3

- [ ] 4.0 Complete integration test suite
  - [ ] 4.1 Review tests from Task Groups 1-3
    - Review the 2-8 tests written for schema layer (Task 1.1)
    - Review the 2-8 tests written for DAL layer (Task 2.1)
    - Review the 2-8 tests written for validation layer (Task 3.1)
    - Total existing tests: approximately 6-24 tests
  - [ ] 4.2 Analyze test coverage gaps for junction tables
    - Identify critical user workflows that lack coverage
    - Focus on end-to-end workflows for activity component management
    - Prioritize integration points between schema, DAL, and validation
    - Do NOT assess entire application test coverage
  - [ ] 4.3 Write up to 10 additional integration tests
    - Test: Creating activity with linked components in single transaction
    - Test: Querying activities with all relations using Prisma include
    - Test: Unique constraint prevents duplicate activity-component links
    - Test: Cascade deletion (deleting activity removes junction records)
    - Test: Restrict deletion (cannot delete Purpose if linked to activity)
    - Test: Multi-tenancy isolation (org A cannot link to org B's components)
    - Test: Sync operations handle empty arrays correctly
    - Test: Link operations are idempotent (adding same link twice succeeds)
    - Test: Unlink operations fail gracefully for non-existent links
    - Test: Data migration from activityIds to junction table
    - Maximum 10 tests - focus on critical workflows only
    - Follow test pattern from: `dataCategories.integration.test.ts`
  - [ ] 4.4 Create integration test file
    - File location: `/packages/database/__tests__/integration/dal/dataProcessingActivityJunctions.integration.test.ts`
    - Use test factories: `createTestOrganization`, `createTestUser`
    - Setup: Create test organizations and component entities in beforeAll
    - Cleanup: Remove all test data in afterAll using `cleanupTestOrganizations`
  - [ ] 4.5 Test data migration from activityIds to junction table
    - Create Recipient with activityIds array in test setup
    - Run migration logic
    - Verify junction records created correctly
    - Verify activityIds field removed/nulled
  - [ ] 4.6 Run feature-specific tests only
    - Run ONLY tests for junction tables (tests from 1.1, 2.1, 3.1, and 4.3)
    - Expected total: approximately 16-34 tests maximum
    - Verify all critical workflows pass
    - Do NOT run the entire application test suite

**Acceptance Criteria:**

- All feature-specific tests pass (approximately 16-34 tests total)
- No more than 10 additional tests added in Task 4.3
- Creating activities with linked components works end-to-end
- Unique constraints prevent duplicate relationships
- Cascade deletion removes junction records when activity deleted
- Restrict deletion prevents deleting components still in use
- Multi-tenancy isolation enforced across all operations
- Data migration from activityIds to junction table works correctly
- Testing focused exclusively on junction table feature requirements

---

### Data & Code Cleanup

#### Task Group 5: Seed Data and Codebase Cleanup

**Dependencies:** Task Group 4 (all tests passing)

- [ ] 5.0 Complete seed data updates and codebase cleanup
  - [ ] 5.1 Update seed scripts to use junction tables
    - Remove all `activityIds: [...]` assignments from Recipient seed data
    - Create junction records using `DataProcessingActivityRecipient.createMany()`
    - Ensure seed data creates realistic many-to-many relationships
    - File location: `/packages/database/prisma/seeds/` (check actual seed file names)
  - [ ] 5.2 Create seed data for other junction tables
    - Seed: DataProcessingActivityPurpose relationships
    - Seed: DataProcessingActivityDataSubject relationships
    - Seed: DataProcessingActivityDataCategory relationships
    - Ensure variety: some activities linked to multiple components, some to one
  - [ ] 5.3 Validate seed data works correctly
    - Run: `pnpm seed` in database package
    - Verify all junction records created without errors
    - Query sample activity to verify relations populated
    - Check database using `pnpm studio` to inspect junction tables
  - [ ] 5.4 Search codebase for activityIds references
    - Search: `activityIds` across entire codebase
    - Identify all files outside of migration that reference the field
    - Create list of files requiring updates
  - [ ] 5.5 Remove activityIds references from codebase
    - Update any queries that used `activityIds` to use junction tables
    - Update any type definitions that include `activityIds` field
    - Remove any helper functions that operated on `activityIds` array
    - Keep only migration file reference (for data migration logic)
  - [ ] 5.6 Regenerate TypeScript types
    - Run: `pnpm db:generate` to regenerate Prisma client
    - Run: `pnpm build` in database package to rebuild types
    - Verify no TypeScript compilation errors in database package
  - [ ] 5.7 Verify no compilation errors in web app
    - Navigate to: `apps/web`
    - Run: `pnpm build` or `pnpm type-check`
    - Fix any TypeScript errors related to removed `activityIds` field
    - Ensure web app builds successfully
  - [ ] 5.8 Run full test suite
    - Run: `pnpm test` in database package
    - Verify all existing tests still pass (not just junction tests)
    - Fix any test failures related to schema changes
  - [ ] 5.9 Final verification
    - Verify: No `activityIds` references remain except in migration file
    - Verify: All TypeScript builds complete without errors
    - Verify: All tests pass (full suite)
    - Verify: Seed data creates realistic junction relationships

**Acceptance Criteria:**

- Seed scripts updated to use junction tables instead of `activityIds`
- Seed data creates many-to-many relationships for all 4 junction types
- Seed command runs successfully without errors
- All codebase references to `activityIds` removed (except migration)
- Prisma client regenerated with updated types
- No TypeScript compilation errors in database package
- No TypeScript compilation errors in web app
- Full test suite passes (all tests, not just junction tests)
- Seed data validation confirms junction tables populated correctly

---

## Execution Order

Recommended implementation sequence:

1. **Database Schema Layer** (Task Group 1)
   - Establish foundation with schema models and migration
   - Create junction tables following proven pattern
   - Remove deprecated `activityIds` field

2. **Data Access Layer** (Task Group 2)
   - Build DAL functions for junction management
   - Implement sync, link, unlink operations
   - Enforce multi-tenancy at data access layer

3. **Validation Layer** (Task Group 3)
   - Update Zod schemas to reflect schema changes
   - Create validation for junction operations
   - Remove `activityIds` from all input/output schemas

4. **Integration Testing** (Task Group 4)
   - Review existing tests from previous groups
   - Fill critical test coverage gaps (max 10 tests)
   - Ensure end-to-end workflows tested

5. **Data & Code Cleanup** (Task Group 5)
   - Update seed data to use junction tables
   - Remove all `activityIds` references from codebase
   - Verify entire system builds and tests pass

---

## Notes

**Complexity:** This is marked as "S" (Small) complexity in the roadmap because:

- All 4 junction tables follow identical pattern from existing code
- No new business logic or complex calculations required
- Well-defined requirements with clear reference implementations
- Single-phase migration (no production data to preserve)

**Key Implementation Principles:**

- Follow `DataCategoryDataNature` pattern exactly for all junction tables
- Use transaction-based sync operations from `dataCategories.ts` pattern
- Enforce multi-tenancy at every layer (schema, DAL, validation)
- Test coverage focuses on critical behaviors, not exhaustive scenarios
- Atomic migration removes `activityIds` field in single operation

**Test Philosophy:**

- Each task group writes 2-8 focused tests for its layer
- Task Group 4 adds maximum 10 tests to fill critical gaps
- Total expected test count: approximately 16-34 tests
- Focus on integration over unit tests (DAL wraps database operations)
- Run feature-specific tests during development, full suite at end

**Future Considerations:**

- `DataProcessingActivityRecipient` may need extension in Roadmap #15
- Potential fields: `involvesThirdCountryTransfer`, `transferBasis`
- Decision deferred until DataTransfer model architecture designed
- Schema comments document future extension plans
