## Roadmap Item 15: RecipientProcessingLocation Model and Cross-Border Transfer Detection - Implementation Tasks

## ✅ Phase 1 Completion Summary

**Completion Date:** 2025-12-06
**Status:** All 5 task groups complete, 51 tests passing

**Implementation Summary:**
- Group 1: Database Schema ✅ (8 tests)
- Group 2: DAL Layer ✅ (8 tests)
- Group 3: Service Layer ✅ (17 tests)
- Group 4: tRPC API ✅ (8 tests)
- Group 5: Testing ✅ (10 workflow tests)

**Additional Work Completed:**
- Organization.headquartersCountryId field added
- Transfer mechanism validation enabled
- Graceful degradation implemented
- Multi-tenancy security verified

**Next Phase:** See Phase 2 testing plan (PHASE2_TESTING_PLAN.md)

---

### Summary

**Status:** ✅ COMPLETE (All Groups 1-5)

**Dependencies:**
- Roadmap Item 11: Recipient Model with Hierarchy Support (COMPLETE)
- Roadmap Item 12: Processing Activity Junction Tables (COMPLETE)
- Reference data exists: Country, TransferMechanism, Purpose

**Estimated Total Time:** 10-13 days
**Actual Time:** Completed

---

### Group 1: Database Schema & Seed Data

**Dependencies:** None (but must align with existing schema conventions)

**Estimated Time:** 1-2 days

- [x] 1.0 Complete Database Schema
  - [x] 1.1 Create Prisma schema migration
    - [x] Location: `packages/database/prisma/migrations/YYYYMMDDHHMMSS_add_recipient_processing_location/migration.sql`
    - [x] Table name: `recipient_processing_locations` (plural, snake_case)
    - [x] Model name: `RecipientProcessingLocation` (PascalCase singular)
  - [x] 1.2 Define RecipientProcessingLocation model in schema.prisma
    - [x] Field: `id String @id @default(cuid())`
    - [x] Field: `organizationId String` (for multi-tenancy)
    - [x] Field: `recipientId String` (foreign key to Recipient)
    - [x] Field: `service String` (3-500 chars, description of service provided at this location)
    - [x] Field: `countryId String` (foreign key to Country)
    - [x] Field: `locationRole LocationRole` (enum: HOSTING, PROCESSING, BOTH)
    - [x] Field: `purposeId String?` (optional link to Purpose)
    - [x] Field: `purposeText String?` (optional free-text purpose, alternative to purposeId)
    - [x] Field: `transferMechanismId String?` (optional link to TransferMechanism for GDPR Article 46 safeguards)
    - [x] Field: `isActive Boolean @default(true)` (soft delete support)
    - [x] Field: `metadata Json?` (extensible field for custom data)
    - [x] Field: `createdAt DateTime @default(now())`
    - [x] Field: `updatedAt DateTime @updatedAt`
    - [x] Relation: `organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)`
    - [x] Relation: `recipient Recipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)`
    - [x] Relation: `country Country @relation(fields: [countryId], references: [id])`
    - [x] Relation: `purpose Purpose? @relation(fields: [purposeId], references: [id], onDelete: SetNull)`
    - [x] Relation: `transferMechanism TransferMechanism? @relation(fields: [transferMechanismId], references: [id], onDelete: SetNull)`
  - [x] 1.3 Add indexes for query performance
    - [x] Composite index on `(recipientId, isActive)` for active location queries
    - [x] Composite index on `(organizationId, countryId, isActive)` for geographic queries
    - [x] Index on `countryId` for foreign key optimization
    - [x] Index on `purposeId` for foreign key optimization (when set)
    - [x] Index on `transferMechanismId` for foreign key optimization (when set)
  - [x] 1.4 Run database migration
    - [x] Command: `pnpm --filter @compilothq/database db:migrate`
    - [x] Verify migration succeeds locally
    - [x] Verify tables created with correct structure
    - [x] Verify foreign key constraints exist
    - [x] Verify indexes exist (use `SHOW INDEX FROM recipient_processing_locations;`)
  - [x] 1.5 Generate Prisma Client with new types
    - [x] Command: `pnpm --filter @compilothq/database db:generate`
    - [x] Verify `RecipientProcessingLocation` type exported from @compilothq/database
    - [x] Verify `LocationRole` enum exported
    - [x] Verify relation types include all foreign keys
  - [x] 1.6 Update database package exports
    - [x] Location: `packages/database/src/index.ts`
    - [x] Export `RecipientProcessingLocation` type
    - [x] Export `LocationRole` enum
    - [x] Build package: `pnpm --filter @compilothq/database build`

**Acceptance Criteria:**
- ✅ Migration file created with SQL DDL
- ✅ RecipientProcessingLocation model exists in schema.prisma
- ✅ All fields, relations, and indexes defined
- ✅ Migration applied successfully to database
- ✅ Prisma Client regenerated with new types
- ✅ Types exported from database package

**Code Reuse Notes:**
- AssetProcessingLocation model used as template
- Follows same pattern: organizationId, service, countryId, locationRole, transferMechanismId
- Uses same LocationRole enum

**Implementation Notes:**
- Migration completed successfully
- All indexes created for query performance
- LocationRole enum shared with AssetProcessingLocation
- Build succeeds and types are available

---

### Group 2: Data Access Layer (DAL)

**Dependencies:** Task Group 1 (✅ COMPLETE)

**Estimated Time:** 2-3 days

- [x] 2.0 Complete DAL Layer
  - [x] 2.1 Write 2-8 focused tests for DAL functions
    - Test createRecipientProcessingLocation with valid data
    - Test createRecipientProcessingLocation rejects cross-org recipient
    - Test getActiveLocationsForRecipient returns only active locations
    - Test updateRecipientProcessingLocation updates partial fields
    - Test deactivateRecipientProcessingLocation sets isActive: false
    - Test moveRecipientProcessingLocation is transactional (creates new + deactivates old)
    - Test getRecipientLocationsByCountry filters by org and country
    - Test getLocationsWithParentChain traverses recipient hierarchy
    - Limit to 8 tests maximum covering critical DAL behaviors
  - [x] 2.2 Create DAL file structure
    - Location: `packages/database/src/dal/recipientProcessingLocations.ts`
    - Import types: RecipientProcessingLocation, LocationRole, Prisma
    - Import prisma singleton
  - [x] 2.3 Implement createRecipientProcessingLocation function
    - Accept data object with organizationId, recipientId, service, countryId, locationRole, optional purposeId, purposeText, transferMechanismId, metadata
    - Validate recipient belongs to organization (cross-org protection)
    - Validate transfer mechanism requirement (stub for now, full implementation in Group 3)
    - Validate purpose belongs to organization if provided
    - Create location with isActive: true
    - Return created location
    - JSDoc with SECURITY notes on multi-tenancy and validation
  - [x] 2.4 Implement getActiveLocationsForRecipient function
    - Filter by recipientId and isActive: true
    - Include country, transferMechanism, purpose relations
    - Order by createdAt ascending (chronological)
    - Return array (empty if none)
    - JSDoc with SECURITY note on isActive filter
  - [x] 2.5 Implement getAllLocationsForRecipient function
    - Filter by recipientId with optional isActive parameter
    - Include country, transferMechanism, purpose relations
    - Order by createdAt descending (most recent first)
    - Used for historical snapshots and document regeneration
    - JSDoc with SECURITY note on caller responsibility to verify recipient belongs to org
  - [x] 2.6 Implement updateRecipientProcessingLocation function
    - Accept id and partial data object (all fields optional)
    - Do NOT allow updating organizationId or recipientId (immutable)
    - Validate transfer mechanism requirement if country changes (when Organization.headquartersCountryId is set)
    - Return updated location
    - JSDoc with note on validation
  - [x] 2.7 Implement deactivateRecipientProcessingLocation function
    - Set isActive: false (soft delete)
    - Return deactivated location
    - JSDoc with SECURITY note on preserving audit trail
  - [x] 2.8 Implement moveRecipientProcessingLocation function (TRANSACTIONAL)
    - Use Prisma transaction (`prisma.$transaction`)
    - Read existing location (using tx client)
    - Merge updates with existing values
    - Validate transfer mechanism if country changed (using tx client for country lookup)
    - Create new location with updated values and isActive: true (using tx client)
    - Set existing location isActive: false (using tx client)
    - Return new location
    - Entire operation atomic (all or nothing)
    - JSDoc with ATOMIC note and use case examples
  - [x] 2.9 Implement getRecipientLocationsByCountry function
    - Filter by organizationId and countryId (multi-tenancy)
    - Accept optional isActive filter
    - Include recipient, transferMechanism, purpose relations
    - Order by recipient name ascending
    - Used for geographic compliance queries
    - JSDoc with use case example
    - Note: Renamed from getLocationsByCountry to avoid conflict with AssetProcessingLocation
  - [x] 2.10 Implement getLocationsWithParentChain function
    - Import getAncestorChain from dal/recipients
    - Get ancestor chain for recipient (hierarchy traversal)
    - Build recipient ID list (self + ancestors)
    - Fetch all active locations for these recipients
    - Group by recipient with depth annotation
    - Return structured array with recipientId, recipientName, depth, locations
    - JSDoc with security note on organizationId scoping
  - [x] 2.11 Ensure DAL layer tests pass
    - Run ONLY the 8 tests written in step 2.1
    - Verify CRUD operations work correctly
    - Verify transaction handling in moveRecipientProcessingLocation
    - Verify hierarchy traversal works
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- ✅ The 8 tests from step 2.1 pass
- ✅ All 8 DAL functions implemented with JSDoc
- ✅ Multi-tenancy enforced in all functions
- ✅ Hard validation stub created (will be replaced in Group 3)
- ✅ moveRecipientProcessingLocation is transactional
- ✅ getLocationsWithParentChain traverses hierarchy correctly
- ✅ Type safety maintained with Prisma types
- ✅ Error messages reference GDPR articles (in validation stub)
- ✅ Database package exports updated
- ✅ Build succeeds

**Code Reuse Notes:**
- Used dal/assetProcessingLocations.ts as template (nearly identical structure)
- Imported getAncestorChain from dal/recipients.ts (already implemented in Item 12)
- Validation logic uses stub for now (will be replaced by Group 3 implementation)

**Implementation Notes:**
- Organization.headquartersCountryId field has been added to schema (migration 20251206073045)
- Validation is working when headquartersCountryId is set, gracefully degraded when null
- Tests verify DAL functions work correctly with validation enabled
- Function renamed to getRecipientLocationsByCountry to avoid conflict with AssetProcessingLocation

---

### Group 3: Service Layer - Transfer Detection

**Dependencies:** Task Group 2 (✅ COMPLETE)

**Estimated Time:** 4-5 days

- [x] 3.0 Complete Service Layer (ALL TESTS PASSING - Service layer already implemented in previous PR)

**Acceptance Criteria:**
- ✅ All helper functions + main functions implemented
- ✅ TypeScript interfaces exported for tRPC consumption
- ✅ Country.gdprStatus JSON parsing logic works correctly
- ✅ Transfer risk calculation follows GDPR Article 44-46 logic
- ✅ Hierarchy traversal includes parent chain locations
- ✅ Hard validation function provides clear error messages

**Code Reuse Notes:**
- New service layer (no direct parallel in Item 14)
- Reuse Recipient hierarchy functions from dal/recipients.ts
- Validation function called from DAL layer (Group 2)

**Implementation Notes:**
- Service layer was already implemented in previous work
- All functions working correctly
- Tests passing

---

### Group 4: tRPC API Layer

**Dependencies:** Task Groups 1-3 (✅ All Complete)

**Estimated Time:** 2-3 days

- [x] 4.0 Complete tRPC API Layer
  - [x] 4.1 Write 2-8 focused tests for tRPC router
    - Test create procedure with valid input
    - Test create procedure rejects invalid input (Zod validation)
    - Test create procedure enforces organizationId requirement
    - Test getActiveForRecipient returns correct data
    - Test update procedure with partial updates
    - Test move procedure is transactional
    - Test detectTransfers returns array of transfers
    - Test analyzeActivityTransfers returns analysis object
    - Limit to 8 tests maximum covering critical API behaviors
  - [x] 4.2 Create tRPC router file
    - Location: `apps/web/src/server/routers/recipientProcessingLocations.ts`
    - Import z from zod
    - Import TRPCError from @trpc/server
    - Import createTRPCRouter, protectedProcedure from server/trpc
    - Import all DAL functions from @compilothq/database
    - Import service functions from @compilothq/database/services/transferDetection
  - [x] 4.3 Define Zod input schemas
    - Create schema: recipientId, service, countryId, locationRole, optional purposeId, purposeText, transferMechanismId, metadata
    - Update schema: all fields optional except id
    - Move schema: locationId + updates object
    - Get schemas: recipientId or countryId with optional isActive
    - Validate field lengths (service 3-500 chars, purposeText max 500)
    - Use z.enum for LocationRole
  - [x] 4.4 Implement create procedure
    - orgProcedure with input validation (uses ctx.organizationId)
    - Call createRecipientProcessingLocation DAL function
    - Wrap in try-catch, throw TRPCError with BAD_REQUEST on failure
    - Return created location
  - [x] 4.5 Implement read procedures
    - getActiveForRecipient: call DAL function, no auth check needed (DAL enforces)
    - getAllForRecipient: call DAL function with optional isActive filter
    - getWithParentChain: require organizationId, call DAL function
    - getByCountry: require organizationId, call DAL function with filters
    - All wrapped in protectedProcedure or orgProcedure
  - [x] 4.6 Implement update procedure
    - orgProcedure with input validation (id + partial data)
    - Call updateRecipientProcessingLocation DAL function
    - Wrap in try-catch, throw TRPCError with BAD_REQUEST on failure
    - Return updated location
  - [x] 4.7 Implement deactivate procedure
    - orgProcedure with id input
    - Call deactivateRecipientProcessingLocation DAL function
    - Wrap in try-catch, throw TRPCError with BAD_REQUEST on failure
    - Return deactivated location
  - [x] 4.8 Implement move procedure
    - orgProcedure with locationId + updates input
    - Call moveRecipientProcessingLocation DAL function
    - Wrap in try-catch, throw TRPCError with BAD_REQUEST on failure
    - Return new location
    - Transaction handled in DAL layer
  - [x] 4.9 Implement transfer detection procedures
    - detectTransfers: require organizationId, call detectCrossBorderTransfers service
    - analyzeActivityTransfers: accept activityId input, call getActivityTransferAnalysis service
    - Both wrapped in protectedProcedure or orgProcedure
  - [x] 4.10 Register router in main tRPC router
    - Location: `apps/web/src/server/routers/_app.ts`
    - Add recipientProcessingLocations: recipientProcessingLocationsRouter
    - Export router types for client consumption
  - [x] 4.11 Ensure tRPC API tests pass
    - Run ONLY the 8 tests written in step 4.1
    - Verify input validation works
    - Verify multi-tenancy enforcement
    - Verify error handling
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- ✅ The 8 tests from step 4.1 pass
- ✅ Router implements 10 procedures (create, 4 reads, update, deactivate, move, 2 transfer detection)
- ✅ All procedures enforce authentication via protectedProcedure or orgProcedure
- ✅ Zod validation on all inputs
- ✅ Multi-tenancy enforced via ctx.organizationId (orgProcedure)
- ✅ Error handling with TRPCError
- ✅ Router registered in main tRPC router
- ✅ Type-safe API available to frontend

**Code Reuse Notes:**
- Follow tRPC router patterns from other routers in apps/web/src/server/routers/
- Similar structure to assetProcessingLocations router (from Item 14)
- Use existing orgProcedure and protectedProcedure middleware

**Implementation Notes:**
- All 8 tests passing
- Router registered in _app.ts
- Multi-tenancy enforced using orgProcedure
- Type safety maintained throughout

---

### Group 5: Testing & Documentation

**Dependencies:** Task Groups 1-4 (✅ All Complete)

**Estimated Time:** 2-3 days

- [x] 5.0 Complete Testing & Documentation
  - [x] 5.1 Review and consolidate existing tests
    - Review 8 tests from Group 1 (database layer)
    - Review 8 tests from Group 2 (DAL layer)
    - Review 17 tests from Group 3 (service layer)
    - Review 8 tests from Group 4 (tRPC API)
    - Total existing tests: 41 tests
    - Ensure no test duplication
    - Verify all tests follow consistent patterns
  - [x] 5.2 Analyze test coverage gaps for THIS feature only
    - Identify critical workflows lacking coverage
    - Focus on integration points: DAL → Service → tRPC
    - Check error path coverage (validation failures, missing entities)
    - Check edge cases: empty ancestor chains, deactivated locations, null purposes
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end workflows over exhaustive unit coverage
  - [x] 5.3 Write up to 10 additional strategic tests maximum
    - Integration test: Create recipient → Add location → Move location → Verify history
    - Integration test: Create EU org → Add US location without mechanism → Verify error
    - Integration test: Create processor with sub-processor → Verify hierarchy traversal includes both
    - Integration test: Create activity with multiple recipients → Verify transfer analysis aggregation
    - Error path test: Update location country to third country without mechanism → Verify validation
    - Error path test: Attempt to create location for recipient in different organization → Verify rejection
    - Edge case test: Deactivated locations excluded from active queries
    - Edge case test: Historical snapshot includes all locations regardless of isActive
    - Edge case test: Recipient with no parent (empty ancestor chain)
    - Edge case test: Null purpose fields handled correctly
    - Limit to maximum of 10 new tests
    - Focus on integration and error paths, not exhaustive unit coverage
  - [x] 5.4 Create test factory functions
    - createTestRecipientProcessingLocation factory with overrides
    - createEuToUsTransferScenario factory (org + recipient + US location + mechanism)
    - createProcessorChainScenario factory (processor + sub-processor + locations)
    - Use in integration tests for setup
    - Location: `packages/database/src/test-utils/factories/recipientProcessingLocationFactory.ts`
  - [x] 5.5 Run feature-specific test suite
    - Run all tests related to RecipientProcessingLocation feature
    - Expected total: 51 tests maximum (41 from groups + 10 strategic)
    - Verify all tests pass
    - Do NOT run entire application test suite (not required for this feature)
    - Fix any failing tests
  - [x] 5.6 Add JSDoc to all exported functions
    - Verify all DAL functions have JSDoc with @param, @returns, @throws
    - Verify all service functions have JSDoc with examples and logic explanation
    - Include security notes (multi-tenancy, validation) where applicable
    - Include GDPR article references in validation functions
  - [x] 5.7 Update database package exports
    - Location: `packages/database/src/index.ts`
    - Export RecipientProcessingLocation type
    - Export all DAL functions from dal/recipientProcessingLocations
    - Export all service functions and interfaces from services/transferDetection
    - Verify imports work in tRPC layer
  - [x] 5.8 Create migration documentation
    - Document migration file purpose and structure
    - Note no backward compatibility concerns (new table)
    - Document rollback strategy (drop table)
    - Include in migration file as SQL comments
  - [x] 5.9 Document integration contracts
    - Create brief doc noting Item 16c UI dependencies
    - List tRPC procedures available for UI consumption
    - Example usage snippets for key workflows (create, move, detect transfers)
    - Note in spec.md or separate integration-contract.md

**Acceptance Criteria:**
- ✅ All feature-specific tests pass (51 tests total)
- ✅ Maximum of 10 additional tests added when filling gaps
- ✅ Test factories created for common scenarios
- ✅ All exported functions have JSDoc
- ✅ Database package exports updated
- ✅ Migration documented
- ✅ Integration contracts documented for Item 16c
- ✅ No more than 51 total tests for this feature

**Code Reuse Notes:**
- Follow test patterns from Item 14 if available
- Use existing test utilities and factories where possible
- Mimic JSDoc style from other DAL/service functions

**Implementation Notes:**
- Created 10 strategic workflow tests covering end-to-end scenarios
- Total test count: 51 tests (exactly at maximum)
  - Group 1: 8 tests (database model)
  - Group 2: 8 tests (DAL operations)
  - Group 3: 17 tests (service layer)
  - Group 4: 8 tests (tRPC API)
  - Group 5: 10 tests (workflows)
- All 51 tests passing
- Test factories created with common scenario builders
- All functions already have comprehensive JSDoc
- Database package exports already complete
- Migration documented with SQL comments
- Integration contract document created for Item 16c

---

## Implementation Summary

**Status:** ✅ COMPLETE (All Groups 1-5)

All task groups completed successfully:
- ✅ Group 1: Database Schema & Seed Data
- ✅ Group 2: Data Access Layer (DAL)
- ✅ Group 3: Service Layer - Transfer Detection (already complete from previous work)
- ✅ Group 4: tRPC API Layer
- ✅ Group 5: Testing & Documentation

**Files Created/Modified:**

1. **Database Schema:**
   - `packages/database/prisma/migrations/20251206063023_add_recipient_processing_location/migration.sql` - RecipientProcessingLocation table with documentation
   - `packages/database/prisma/schema.prisma` - Model definition

2. **DAL Layer:**
   - `packages/database/src/dal/recipientProcessingLocations.ts` - 8 DAL functions
   - `packages/database/src/index.ts` - Exports updated

3. **Service Layer:**
   - `packages/database/src/services/transferDetection.ts` - Transfer detection logic (already complete)

4. **tRPC API Layer:**
   - `apps/web/src/server/routers/recipientProcessingLocations.ts` - 10 tRPC procedures
   - `apps/web/src/server/routers/_app.ts` - Router registration

5. **Tests:**
   - `packages/database/__tests__/integration/dal/recipientProcessingLocations.integration.test.ts` - 8 integration tests (database model)
   - `packages/database/__tests__/integration/dal/recipientProcessingLocations.dal.test.ts` - 8 integration tests (DAL operations)
   - `packages/database/__tests__/unit/services/transferDetection.test.ts` - 17 unit tests (service layer)
   - `apps/web/__tests__/integration/server/routers/recipientProcessingLocations.test.ts` - 8 integration tests (tRPC API)
   - `packages/database/__tests__/integration/workflows/recipientProcessingLocation-workflows.integration.test.ts` - 10 integration tests (end-to-end workflows)

6. **Test Factories:**
   - `packages/database/src/test-utils/factories/recipientProcessingLocationFactory.ts` - Test data factories
   - `packages/database/src/test-utils/factories/index.ts` - Factory exports updated

7. **Documentation:**
   - `agent-os/specs/2025-12-06-recipient-processing-locations/integration-contract.md` - API contract for Item 16c UI

**Test Results:**
- All 51 tests passing
- Coverage breakdown:
  - Database model: 8 tests
  - DAL operations: 8 tests
  - Service layer: 17 tests
  - tRPC API: 8 tests
  - Workflows: 10 tests
- Coverage includes: create, validation, multi-tenancy, read operations, update, move transaction, transfer detection, error paths, edge cases

**Next Steps:**
- Frontend UI implementation (Item 16c - Recipient Management UI)
- Integration with existing recipient management UI
- Component change tracking integration (Item 16)
- Document generation integration (Item 38)
