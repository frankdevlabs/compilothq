# Task Breakdown: Data Processing Activity Model

## Overview

**Feature**: Rename and enhance Activity model to DataProcessingActivity with comprehensive GDPR Article 30 compliance fields

**Size**: S (Small)

**Total Tasks**: 4 Task Groups, ~20 Sub-tasks

## Task List

### Schema Layer

#### Task Group 1: Prisma Schema Updates

**Dependencies**: None

- [x] 1.0 Complete Prisma schema updates
  - [x] 1.1 Add new enums to schema.prisma
    - Add `DataProcessingActivityStatus` enum with 8 states: `DRAFT`, `UNDER_REVIEW`, `UNDER_REVISION`, `REJECTED`, `APPROVED`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`
    - Add `RiskLevel` enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
    - Add `DPIAStatus` enum: `NOT_STARTED`, `IN_PROGRESS`, `UNDER_REVIEW`, `REQUIRES_REVISION`, `APPROVED`, `OUTDATED`
    - Add `TimeUnit` enum: `DAYS`, `MONTHS`, `YEARS`
    - Follow existing enum naming convention (PascalCase with inline comments)
    - Place in "Data Processing" section of schema (near existing ActivityStatus)
  - [x] 1.2 Rename Activity model to DataProcessingActivity
    - Rename model from `Activity` to `DataProcessingActivity`
    - Rename `status` field type from `ActivityStatus` to `DataProcessingActivityStatus`
    - Update relation name in Organization model: `activities Activity[]` to `dataProcessingActivities DataProcessingActivity[]`
  - [x] 1.3 Add owner foreign key fields to DataProcessingActivity
    - Add `businessOwnerId String?` field
    - Add `processingOwnerId String?` field
    - Add `businessOwner User? @relation("BusinessOwner", fields: [businessOwnerId], references: [id], onDelete: SetNull)`
    - Add `processingOwner User? @relation("ProcessingOwner", fields: [processingOwnerId], references: [id], onDelete: SetNull)`
    - Add corresponding back-relations on User model: `ownedActivitiesBusiness DataProcessingActivity[] @relation("BusinessOwner")` and `ownedActivitiesProcessing DataProcessingActivity[] @relation("ProcessingOwner")`
  - [x] 1.4 Add risk and DPIA fields
    - Add `riskLevel RiskLevel?` (nullable for "not yet assessed")
    - Add `requiresDPIA Boolean?` (nullable for "not yet determined")
    - Add `dpiaStatus DPIAStatus?` (only relevant when requiresDPIA = true)
  - [x] 1.5 Add retention period fields
    - Add `retentionPeriodValue Int?`
    - Add `retentionPeriodUnit TimeUnit?`
    - Add `retentionJustification String?`
  - [x] 1.6 Add review scheduling fields
    - Add `lastReviewedAt DateTime?`
    - Add `nextReviewDate DateTime?`
    - Add `reviewFrequencyMonths Int?`
  - [x] 1.7 Add metadata field
    - Add `metadata Json?` for extensibility
  - [x] 1.8 Add compound indexes
    - Add `@@index([organizationId, status, requiresDPIA])` for dashboard filtering
    - Add `@@index([organizationId, nextReviewDate])` for review scheduling queries
    - Add `@@index([riskLevel, dpiaStatus])` for risk/DPIA reporting
    - Keep existing `@@index([organizationId])` and `@@index([organizationId, status])`
  - [x] 1.9 Validate schema compiles
    - Run `npx prisma validate` to ensure schema is valid
    - Verify no type errors in schema definition

**Acceptance Criteria:**

- Prisma schema compiles without errors (`npx prisma validate` passes)
- All 4 new enums defined with correct values and inline comments
- Model renamed from Activity to DataProcessingActivity
- All new fields added with correct types and nullability
- Organization relation updated to `dataProcessingActivities`
- User model has back-relations for BusinessOwner and ProcessingOwner
- All 5 indexes defined (2 existing + 3 new compound)

**Complexity**: M (Medium) - Multiple schema changes but straightforward

---

### Migration Layer

#### Task Group 2: Database Migration

**Dependencies**: Task Group 1 (schema must be complete) - COMPLETED

- [x] 2.0 Complete database migration
  - [x] 2.1 Generate Prisma migration
    - Run `npx prisma migrate dev --name rename_activity_to_data_processing_activity --create-only`
    - Review generated SQL to verify it uses ALTER/RENAME (not DROP/CREATE)
  - [x] 2.2 Review and adjust migration SQL if needed
    - Ensure enum rename: `ALTER TYPE "ActivityStatus" RENAME TO "DataProcessingActivityStatus"`
    - Ensure new enum values are added with `ALTER TYPE ... ADD VALUE`
    - Ensure table rename: `ALTER TABLE "Activity" RENAME TO "DataProcessingActivity"`
    - Ensure foreign key constraints for owner fields use `ON DELETE SET NULL`
    - Verify all new indexes are created with correct column combinations
  - [x] 2.3 Apply migration to development database
    - Run `npx prisma migrate dev`
    - Verify migration completes without errors
  - [x] 2.4 Regenerate Prisma client
    - Run `npx prisma generate`
    - Verify new types are available: `DataProcessingActivity`, `DataProcessingActivityStatus`, `RiskLevel`, `DPIAStatus`, `TimeUnit`

**Acceptance Criteria:**

- Migration file exists in `prisma/migrations/` directory
- Migration uses RENAME operations (preserves existing data)
- Migration runs successfully on development database
- Prisma client regenerated with all new types exported
- All enums accessible from generated client

**Complexity**: S (Small) - Standard Prisma migration workflow

---

### Data Access Layer

#### Task Group 3: DAL Functions

**Dependencies**: Task Group 2 (migration must be applied, client regenerated) - COMPLETED

- [x] 3.0 Complete DAL layer
  - [x] 3.1 Write 6 focused tests for DAL functions
    - Test `createDataProcessingActivity` with required fields + new optional fields
    - Test `getDataProcessingActivityById` returns record or null
    - Test `getDataProcessingActivityByIdForOrg` enforces organization ownership
    - Test `listDataProcessingActivitiesByOrganization` with pagination and filters (status, riskLevel, requiresDPIA)
    - Test `updateDataProcessingActivity` including nullable field clearing
    - Test multi-tenancy isolation (org1 cannot see org2 activities)
    - Write tests in `/packages/database/__tests__/integration/dal/dataProcessingActivities.integration.test.ts`
    - Follow existing pattern from `activities.integration.test.ts`
  - [x] 3.2 Create dataProcessingActivities.ts DAL file
    - Create `/packages/database/src/dal/dataProcessingActivities.ts`
    - Import types: `DataProcessingActivity`, `DataProcessingActivityStatus`, `RiskLevel`, `DPIAStatus`, `TimeUnit`, `Prisma`
    - Include SECURITY comments documenting multi-tenancy behavior
  - [x] 3.3 Implement createDataProcessingActivity function
    - Accept all fields from spec signature (name, description, organizationId, status, riskLevel, requiresDPIA, dpiaStatus, businessOwnerId, processingOwnerId, retentionPeriodValue, retentionPeriodUnit, retentionJustification, lastReviewedAt, nextReviewDate, reviewFrequencyMonths, metadata)
    - Default status to 'DRAFT' if not provided
    - Return created `DataProcessingActivity`
  - [x] 3.4 Implement getDataProcessingActivityById function
    - Accept `id: string`
    - Return `DataProcessingActivity | null`
  - [x] 3.5 Implement getDataProcessingActivityByIdForOrg function
    - Accept `id: string` and `organizationId: string`
    - Query with both conditions for ownership verification
    - Return `DataProcessingActivity | null`
  - [x] 3.6 Implement listDataProcessingActivitiesByOrganization function
    - Accept `organizationId` and optional filters: status, riskLevel, requiresDPIA, dpiaStatus, businessOwnerId, processingOwnerId, dueBefore, limit, cursor
    - Use cursor-based pagination pattern from `processors.ts` (`take: limit + 1`)
    - Return `{ items: DataProcessingActivity[], nextCursor: string | null }`
    - Always filter by organizationId for multi-tenancy
  - [x] 3.7 Implement updateDataProcessingActivity function
    - Accept `id` and partial update data
    - Support explicit null values to clear optional fields (riskLevel, requiresDPIA, dpiaStatus, owner IDs, retention fields, review fields)
    - Return updated `DataProcessingActivity`
  - [x] 3.8 Implement deleteDataProcessingActivity function
    - Accept `id: string`
    - Return deleted `DataProcessingActivity`
  - [x] 3.9 Implement countDataProcessingActivitiesByOrganization function
    - Accept `organizationId` and optional filters: status, requiresDPIA
    - Return `number` count for dashboard widgets
  - [x] 3.10 Export DAL functions from index.ts
    - Add `export * from './dal/dataProcessingActivities'` to `/packages/database/src/index.ts`
    - Add `DataProcessingActivity` to explicit type exports
  - [x] 3.11 Remove old activities.ts DAL file
    - Delete `/packages/database/src/dal/activities.ts`
    - Remove `export * from './dal/activities'` from index.ts
    - Remove `Activity` from explicit type exports
  - [x] 3.12 Run DAL tests to verify implementation
    - Run only the 6 tests from 3.1: `pnpm test packages/database/__tests__/integration/dal/dataProcessingActivities.integration.test.ts`
    - Verify all tests pass

**Acceptance Criteria:**

- All 6 DAL tests pass
- DAL file exports all 7 functions (create, getById, getByIdForOrg, list, update, delete, count)
- Functions type-check correctly with new model and enums
- listDataProcessingActivitiesByOrganization uses cursor-based pagination
- Multi-tenancy enforced (organizationId filtering on list queries)
- Old activities.ts DAL file removed
- New DAL exported from index.ts

**Complexity**: M (Medium) - Multiple functions with complex filter options

---

### Test Verification Layer

#### Task Group 4: Test Review and Integration

**Dependencies**: Task Group 3 - COMPLETED

- [x] 4.0 Complete test verification
  - [x] 4.1 Remove old activities integration test file
    - Delete `/packages/database/__tests__/integration/dal/activities.integration.test.ts`
  - [x] 4.2 Review existing tests for gaps
    - Verify 6 tests from Task 3.1 cover: CRUD, pagination, filtering, multi-tenancy
    - Identify if any critical workflow is missing coverage
  - [x] 4.3 Add up to 4 additional tests if critical gaps exist
    - Consider: owner FK cascade behavior (SetNull on user deletion)
    - Consider: dueBefore filter for review scheduling queries
    - Consider: count function accuracy
    - Consider: index usage verification (explain plan - optional)
  - [x] 4.4 Run all feature-specific tests
    - Run: `pnpm test packages/database/__tests__/integration/dal/dataProcessingActivities.integration.test.ts`
    - Verify all tests pass (expected: 6-10 tests)
  - [x] 4.5 Verify TypeScript compilation
    - Run: `pnpm -F @compilothq/database build` or `tsc --noEmit`
    - Ensure no type errors in DAL or test files

**Acceptance Criteria:**

- Old activities test file removed
- All DataProcessingActivity tests pass (6-10 tests total)
- TypeScript compilation succeeds with no errors
- Multi-tenancy isolation verified by tests
- All new enum values can be used in queries

**Complexity**: S (Small) - Verification and cleanup

---

## Execution Order

Recommended implementation sequence:

```
Task Group 1: Prisma Schema Updates ✅ COMPLETED
       |
       v
Task Group 2: Database Migration ✅ COMPLETED
       |
       v
Task Group 3: DAL Functions ✅ COMPLETED
       |
       v
Task Group 4: Test Review and Integration ✅ COMPLETED
```

**Total estimated effort**: 3-4 hours

---

## Files to Create/Modify

| Action | File Path                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| Modify | `/packages/database/prisma/schema.prisma`                                                                    |
| Create | `/packages/database/prisma/migrations/[timestamp]_rename_activity_to_data_processing_activity/migration.sql` |
| Create | `/packages/database/src/dal/dataProcessingActivities.ts`                                                     |
| Delete | `/packages/database/src/dal/activities.ts`                                                                   |
| Modify | `/packages/database/src/index.ts`                                                                            |
| Create | `/packages/database/__tests__/integration/dal/dataProcessingActivities.integration.test.ts`                  |
| Delete | `/packages/database/__tests__/integration/dal/activities.integration.test.ts`                                |

---

## Out of Scope Reminder

Do NOT include tasks for:

- Junction tables (Purpose, DataSubject, DataCategory relationships)
- tRPC router updates or API layer changes
- UI components or frontend changes
- Seed data for new enums
- Status transition validation logic
- Email notifications for review dates
- Audit logging for status changes
- Soft delete functionality
- Version history tracking
- Bulk operations (import/export)

---

## Reference Files

Existing patterns to follow:

- DAL pattern: `/packages/database/src/dal/processors.ts` (cursor pagination)
- DAL pattern: `/packages/database/src/dal/activities.ts` (basic CRUD)
- Test pattern: `/packages/database/__tests__/integration/dal/activities.integration.test.ts`
- Export pattern: `/packages/database/src/index.ts`
- Schema section: "Data Processing" in `/packages/database/prisma/schema.prisma`
