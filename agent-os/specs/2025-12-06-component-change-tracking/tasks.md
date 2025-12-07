# Task Breakdown: Component Change Tracking (Item 16)

## Overview

Total Task Groups: 6
Estimated Duration: 1-2 weeks
Implementation Strategy: Tiered priority (MUST → SHOULD → CAN)

**Tier 1 (MUST):** AssetProcessingLocation, RecipientProcessingLocation, DataProcessingActivity
**Tier 2 (SHOULD):** TransferMechanism, DataSubjectCategory, DataCategory
**Tier 3 (CAN):** Purpose, LegalBasis, Recipient

## Task List

### Database Layer: Schema & Models

#### Task Group 1: Core Schema Implementation

**Dependencies:** None

- [x] 1.0 Complete database schema for change tracking models
  - [x] 1.1 Write 2-8 focused tests for model validations
    - Test ComponentChangeLog creation with required fields
    - Test multi-tenancy isolation (organizationId filtering)
    - Test GeneratedDocument minimal schema
    - Test AffectedDocument unique constraint
    - Test enum value constraints (ChangeType, ImpactType, DocumentStatus)
  - [x] 1.2 Create ComponentChangeLog model in Prisma schema
    - Fields: id, organizationId, componentType (String), componentId (String)
    - Fields: changeType (enum), fieldChanged (nullable), oldValue (Json), newValue (Json)
    - Fields: changedByUserId (nullable), changeReason (nullable), changedAt
    - Relations: organization, changedBy (User with onDelete: SetNull)
    - Indexes: (organizationId, componentType, componentId, changedAt)
    - Indexes: (changedAt), (organizationId, changedAt)
    - Reference: spec.md lines 14-27
  - [x] 1.3 Create ChangeType enum
    - Values: CREATED, UPDATED, DELETED
    - Reference: spec.md line 18
  - [x] 1.4 Create GeneratedDocument model (minimal schema)
    - Fields: id, organizationId, documentType (enum), version (String)
    - Fields: assessmentId (nullable), dataProcessingActivityId (nullable)
    - Fields: dataSnapshot (Json), wordFileUrl (nullable), pdfFileUrl (nullable), markdownContent (nullable)
    - Fields: generatedAt, generatedBy (nullable), status (enum, default DRAFT)
    - Relations: organization, generatedByUser (User with onDelete: SetNull)
    - Indexes: (organizationId, documentType, status), (generatedAt)
    - Reference: spec.md lines 29-42, requirements.md lines 112-150
  - [x] 1.5 Create GeneratedDocumentType enum
    - Values: ROPA, DPIA, LIA, DPA, PRIVACY_STATEMENT, DTIA
    - Reference: spec.md line 32, requirements.md lines 70-79
  - [x] 1.6 Create DocumentStatus enum
    - Values: DRAFT, FINAL, SUPERSEDED, ARCHIVED
    - Default: DRAFT
    - Reference: spec.md line 39, requirements.md lines 144-149
  - [x] 1.7 Create AffectedDocument model
    - Fields: id, organizationId, generatedDocumentId, componentChangeLogId
    - Fields: impactType (enum), impactDescription (String)
    - Fields: detectedAt, reviewedAt (nullable), reviewedBy (nullable)
    - Relations: organization, generatedDocument (onDelete: Cascade), componentChangeLog (onDelete: Cascade)
    - Relations: reviewedByUser (User with onDelete: SetNull)
    - Unique constraint: (generatedDocumentId, componentChangeLogId)
    - Indexes: (organizationId, generatedDocumentId), (organizationId, detectedAt)
    - Reference: spec.md lines 44-52, requirements.md lines 153-177
  - [x] 1.8 Create ImpactType enum with 15+ categories
    - Transfer impacts: TRANSFER_SECTION_OUTDATED, MECHANISM_SECTION_OUTDATED, LOCATION_CHANGED, LOCATION_ADDED, LOCATION_REMOVED, THIRD_COUNTRY_ADDED, SAFEGUARD_REMOVED
    - Taxonomy impacts: PURPOSE_SECTION_OUTDATED, LEGAL_BASIS_SECTION_OUTDATED, DATA_CATEGORY_SECTION_OUTDATED, DATA_SUBJECT_SECTION_OUTDATED, RECIPIENT_SECTION_OUTDATED
    - Activity impacts: ACTIVITY_RISK_LEVEL_CHANGED, ACTIVITY_DPIA_REQUIREMENT_CHANGED, RETENTION_SECTION_OUTDATED
    - Generic: OTHER_COMPONENT_CHANGED
    - Reference: spec.md line 46, requirements.md lines 82-110
  - [x] 1.9 Add Organization relations to new models
    - ComponentChangeLog[] relation on Organization
    - GeneratedDocument[] relation on Organization
    - AffectedDocument[] relation on Organization
  - [x] 1.10 Add User relations for change tracking
    - ComponentChangeLog[] relation on User (as changedBy)
    - GeneratedDocument[] relation on User (as generatedByUser)
    - AffectedDocument[] relation on User (as reviewedByUser)
  - [x] 1.11 Generate Prisma migration for all new models
    - Run: `pnpm --filter @compilothq/database prisma migrate dev --name add-component-change-tracking`
    - Verify migration creates all tables, indexes, and constraints
  - [x] 1.12 Ensure database layer tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify all models can be created with valid data
    - Verify unique constraints work correctly
    - Do NOT run entire test suite at this stage

---

### Change Tracking Infrastructure

#### Task Group 2: Prisma Client Extension & Configuration

**Dependencies:** Task Group 1

- [ ] 2.0 Complete Prisma client extension for change tracking
  - [ ] 2.1 Write 2-8 focused tests for extension behavior
    - Test extension detects tracked field changes
    - Test extension creates ComponentChangeLog entry
    - Test extension ignores non-tracked field changes
    - Test extension fetches before/after snapshots correctly
    - Test extension respects DISABLE_CHANGE_TRACKING environment variable
    - Test extension handles optional context (userId, changeReason)
  - [ ] 2.2 Create changeTracking.ts in packages/database/src/middleware/
    - Use modern Prisma client extensions API (not deprecated middleware)
    - Location: `packages/database/src/middleware/changeTracking.ts`
    - Reference: spec.md lines 54-64, requirements.md lines 183-189
  - [ ] 2.3 Define TRACKED_FIELDS_BY_MODEL configuration
    - AssetProcessingLocation: ['countryId', 'transferMechanismId', 'locationRole', 'isActive']
    - RecipientProcessingLocation: ['countryId', 'transferMechanismId', 'locationRole', 'isActive']
    - DataProcessingActivity: ['riskLevel', 'requiresDPIA', 'dpiaStatus', 'retentionPeriodMonths', 'retentionJustification', 'status']
    - TransferMechanism: ['name', 'code', 'description', 'gdprArticle', 'category', 'requiresSupplementaryMeasures', 'isActive']
    - DataSubjectCategory: ['name', 'isVulnerable', 'vulnerabilityReason', 'suggestsDPIA', 'isActive']
    - DataCategory: ['name', 'description', 'sensitivity', 'isSpecialCategory', 'isActive']
    - Purpose: ['name', 'description', 'category', 'scope', 'isActive']
    - LegalBasis: ['type', 'name', 'framework', 'requiresConsent', 'consentMechanism', 'isActive']
    - Recipient: ['type', 'externalOrganizationId', 'purpose', 'description', 'parentRecipientId', 'isActive']
    - Reference: spec.md lines 66-77, requirements.md lines 306-320
  - [ ] 2.4 Implement context interface for runtime parameters
    - Interface: `{ userId?: string, changeReason?: string }`
    - Accept context in extension wrapper function
    - Pass context to ComponentChangeLog creation
    - Reference: spec.md line 58, requirements.md lines 267-274
  - [ ] 2.5 Implement environment variable escape hatch
    - Check DISABLE_CHANGE_TRACKING=true to bypass tracking
    - Always-on by default for production use
    - Escape hatch for tests and scripts
    - Reference: spec.md lines 56-57, requirements.md line 186
  - [ ] 2.6 Implement update operation wrapper for Tier 1 models
    - AssetProcessingLocation update wrapper
    - RecipientProcessingLocation update wrapper
    - DataProcessingActivity update wrapper
    - Fetch before state with minimal includes (Country, TransferMechanism for locations)
    - Execute update operation
    - Fetch after state with same includes
    - Compare tracked fields only
    - Create ComponentChangeLog if tracked fields changed
    - Reference: spec.md lines 59-64, requirements.md lines 424-470
  - [ ] 2.7 Implement snapshot flattening logic for locations
    - Include nested country object: id, name, isoCode, gdprStatus
    - Include nested transferMechanism object: id, name, code, gdprArticle (when present)
    - Store in oldValue and newValue as Json
    - Example structure from requirements.md lines 198-219
    - Reference: spec.md lines 86-93
  - [ ] 2.8 Implement snapshot flattening for DataProcessingActivity
    - Include all tracked fields in snapshot
    - Store complete snapshot in oldValue/newValue
    - Reference: spec.md lines 70-71
  - [ ] 2.9 Export extended Prisma client as prismaWithTracking
    - Export from packages/database/src/middleware/changeTracking.ts
    - Import in DAL functions that modify tracked models
    - Maintain compatibility with existing singleton pattern
    - Reference: spec.md line 64, requirements.md lines 125-132
  - [ ] 2.10 Ensure change tracking infrastructure tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify extension creates logs when tracked fields change
    - Verify extension ignores non-tracked field changes
    - Verify snapshots include flattened nested data
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**

- The 2-8 tests written in 2.1 pass
- Extension wraps update operations for Tier 1 models
- TRACKED_FIELDS_BY_MODEL configuration is complete for 9 models
- Environment variable escape hatch works correctly
- Snapshots include flattened, human-readable nested data
- Extension performs minimal includes (Country, TransferMechanism only)
- Extension is exported as prismaWithTracking

---

### Tier 1 Implementation (MUST)

#### Task Group 3: Location & Activity Change Tracking

**Dependencies:** Task Group 2

- [ ] 3.0 Complete Tier 1 change tracking (AssetProcessingLocation, RecipientProcessingLocation, DataProcessingActivity)
  - [ ] 3.1 Write 2-8 focused tests for Tier 1 models
    - Test AssetProcessingLocation countryId change creates log
    - Test RecipientProcessingLocation transferMechanismId change creates log
    - Test DataProcessingActivity riskLevel change creates log
    - Test isActive flip from true→false creates DELETED log
    - Test rapid successive updates create separate log entries
    - Test concurrent updates handled gracefully
    - Test multi-tenant isolation in change logs
  - [ ] 3.2 Implement AssetProcessingLocation change tracking
    - Wrap update operations in extension
    - Detect changes in: countryId, transferMechanismId, locationRole, isActive
    - Fetch before state with includes: { country: true, transferMechanism: true }
    - Fetch after state with same includes
    - Generate flattened snapshot with country and transferMechanism details
    - Create ComponentChangeLog with componentType: 'AssetProcessingLocation'
    - Set fieldChanged to specific field that triggered log
    - Reference: spec.md line 68, requirements.md lines 526-527
  - [ ] 3.3 Implement RecipientProcessingLocation change tracking
    - Wrap update operations in extension
    - Detect changes in: countryId, transferMechanismId, locationRole, isActive
    - Fetch before state with includes: { country: true, transferMechanism: true }
    - Fetch after state with same includes
    - Generate flattened snapshot with country and transferMechanism details
    - Create ComponentChangeLog with componentType: 'RecipientProcessingLocation'
    - Set fieldChanged to specific field that triggered log
    - Reference: spec.md line 69, requirements.md lines 526-527
  - [ ] 3.4 Implement DataProcessingActivity change tracking
    - Wrap update operations in extension
    - Detect changes in: riskLevel, requiresDPIA, dpiaStatus, retentionPeriodMonths, retentionJustification, status
    - Fetch before state (no nested includes needed)
    - Fetch after state
    - Generate snapshot with all tracked fields
    - Create ComponentChangeLog with componentType: 'DataProcessingActivity'
    - Set fieldChanged to specific field that triggered log
    - Reference: spec.md line 70, requirements.md line 529
  - [ ] 3.5 Implement CREATE operation tracking for Tier 1 models
    - Log CREATED changeType when new entities created
    - Store null in oldValue, full snapshot in newValue
    - Set fieldChanged to null for CREATED
    - Reference: spec.md line 18, requirements.md lines 224-231
  - [ ] 3.6 Implement soft-delete (DELETED) tracking for Tier 1 models
    - Detect isActive flip from true→false
    - Log DELETED changeType
    - Store before state in oldValue, after state in newValue
    - Set fieldChanged to 'isActive'
    - Reference: requirements.md lines 224-231
  - [ ] 3.7 Handle edge case: rapid successive updates
    - Log every update separately
    - No automatic deduplication
    - Each update gets own ComponentChangeLog entry
    - Reference: spec.md line 97, requirements.md lines 357-367
  - [ ] 3.8 Handle edge case: per-row bulk updates
    - Document pattern: iterate through IDs, call update per record
    - Do NOT support updateMany for tracked models
    - Each row update triggers change tracking
    - Reference: spec.md lines 99-101, requirements.md lines 388-421
  - [ ] 3.9 Ensure Tier 1 implementation tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify all Tier 1 models create change logs correctly
    - Verify CREATE, UPDATE, DELETED operations tracked
    - Verify rapid successive updates logged separately
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**

- The 2-8 tests written in 3.1 pass
- AssetProcessingLocation changes logged with flattened country/mechanism data
- RecipientProcessingLocation changes logged with flattened country/mechanism data
- DataProcessingActivity changes logged with all tracked fields
- CREATE, UPDATE, DELETED operations all tracked
- Rapid successive updates create separate logs
- Per-row bulk pattern documented for tracked models

---

### Tier 2 Implementation (SHOULD)

#### Task Group 4: Taxonomy & Mechanism Change Tracking

**Dependencies:** Task Group 3

- [ ] 4.0 Complete Tier 2 change tracking (TransferMechanism, DataSubjectCategory, DataCategory)
  - [ ] 4.1 Write 2-8 focused tests for Tier 2 models
    - Test TransferMechanism code change creates log
    - Test DataSubjectCategory vulnerability flag change creates log
    - Test DataCategory sensitivity change creates log
    - Test isActive flip creates DELETED log
    - Test snapshots include relevant classification fields
  - [ ] 4.2 Implement TransferMechanism change tracking
    - Wrap update operations in extension
    - Detect changes in: name, code, description, gdprArticle, category, requiresSupplementaryMeasures, isActive
    - Generate snapshot with all tracked fields
    - Create ComponentChangeLog with componentType: 'TransferMechanism'
    - Reference: spec.md line 71, requirements.md line 530
  - [ ] 4.3 Implement DataSubjectCategory change tracking
    - Wrap update operations in extension
    - Detect changes in: name, isVulnerable, vulnerabilityReason, suggestsDPIA, isActive
    - Generate snapshot with vulnerability and DPIA suggestion fields
    - Create ComponentChangeLog with componentType: 'DataSubjectCategory'
    - Reference: spec.md line 72, requirements.md line 531
  - [ ] 4.4 Implement DataCategory change tracking
    - Wrap update operations in extension
    - Detect changes in: name, description, sensitivity, isSpecialCategory, isActive
    - Generate snapshot with sensitivity and special category classification
    - Create ComponentChangeLog with componentType: 'DataCategory'
    - Reference: spec.md line 73, requirements.md line 532
  - [ ] 4.5 Implement CREATE and DELETED tracking for Tier 2 models
    - Follow same pattern as Tier 1
    - Log CREATED, UPDATED, DELETED changeTypes
    - Store appropriate snapshots in oldValue/newValue
  - [ ] 4.6 Ensure Tier 2 implementation tests pass
    - Run ONLY the 2-8 tests written in 4.1
    - Verify all Tier 2 models create change logs correctly
    - Verify snapshots include relevant classification fields
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**

- The 2-8 tests written in 4.1 pass
- TransferMechanism changes logged with GDPR article and category data
- DataSubjectCategory changes logged with vulnerability flags
- DataCategory changes logged with sensitivity and special category flags
- CREATE, UPDATE, DELETED operations tracked for all Tier 2 models

---

### Database Package Integration

#### Task Group 5: Export Configuration & DAL Updates

**Dependencies:** Task Groups 1-4

- [ ] 5.0 Complete database package integration
  - [ ] 5.1 Write 2-8 focused tests for exports and DAL integration
    - Test prismaWithTracking export is available
    - Test existing DAL functions can import prismaWithTracking
    - Test change tracking works when called from DAL functions
    - Test multi-tenant context flows through to change logs
  - [ ] 5.2 Update packages/database/src/index.ts exports
    - Export ComponentChangeLog model type
    - Export GeneratedDocument model type
    - Export AffectedDocument model type
    - Export all new enums: ChangeType, GeneratedDocumentType, DocumentStatus, ImpactType
    - Export prismaWithTracking client
    - Export TRACKED_FIELDS_BY_MODEL configuration
    - Reference: spec.md lines 8, 64
  - [ ] 5.3 Create DAL helper functions for change logs (optional)
    - getComponentChangeHistory(componentType, componentId, organizationId)
    - getRecentChanges(organizationId, limit)
    - getChangesForUser(userId, organizationId)
    - These are optional convenience functions, not required for core functionality
  - [ ] 5.4 Update existing DAL functions to use prismaWithTracking
    - Update AssetProcessingLocation DAL functions (if they exist from Item 14)
    - Update RecipientProcessingLocation DAL functions (from Item 15)
    - Replace prisma imports with prismaWithTracking
    - Pass context with userId and changeReason where available
    - Reference: requirements.md lines 140-147
  - [ ] 5.5 Document per-row bulk update pattern
    - Create code examples in comments or docs
    - Show correct pattern: fetch IDs, iterate, update individually
    - Show incorrect pattern: updateMany (not supported for tracked models)
    - Reference: requirements.md lines 388-421
  - [ ] 5.6 Ensure database package integration tests pass
    - Run ONLY the 2-8 tests written in 5.1
    - Verify exports are available to consuming packages
    - Verify DAL functions create change logs when updating tracked models
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**

- The 2-8 tests written in 5.1 pass
- All new models and enums exported from database package
- prismaWithTracking client exported and usable
- Existing DAL functions updated to use prismaWithTracking
- Per-row bulk update pattern documented with examples

---

### Testing & Documentation

#### Task Group 6: Comprehensive Testing & Final Verification

**Dependencies:** Task Groups 1-5

- [ ] 6.0 Complete testing, documentation, and final verification
  - [ ] 6.1 Review existing tests from Task Groups 1-5
    - Review tests from 1.1 (database layer)
    - Review tests from 2.1 (extension infrastructure)
    - Review tests from 3.1 (Tier 1 models)
    - Review tests from 4.1 (Tier 2 models)
    - Review tests from 5.1 (exports and integration)
    - Total existing tests: approximately 10-40 tests
  - [ ] 6.2 Analyze test coverage gaps for THIS feature only
    - Identify critical workflows lacking coverage
    - Focus on integration points between components
    - Prioritize end-to-end scenarios over additional unit tests
    - Do NOT assess entire application test coverage
  - [ ] 6.3 Write up to 10 additional strategic tests maximum
    - Integration test: Create → Update → Soft-delete lifecycle with change logs
    - Integration test: Multi-tenant isolation (changes in Org A not visible to Org B)
    - Integration test: Change log with userId and changeReason context
    - Integration test: Environment variable escape hatch (DISABLE_CHANGE_TRACKING)
    - Integration test: Concurrent updates to same entity create separate logs
    - Integration test: Flattened snapshot accuracy (verify nested country/mechanism data)
    - Integration test: Tier 1 + Tier 2 models all create logs in same transaction
    - Integration test: Non-tracked field changes don't create logs (noise filtering)
    - Focus on critical user workflows and integration points
    - Maximum 10 additional tests to fill strategic gaps
  - [ ] 6.4 Run feature-specific tests only
    - Run tests from 1.1, 2.1, 3.1, 4.1, 5.1, 6.3
    - Expected total: approximately 20-50 tests maximum
    - Verify all critical workflows pass
    - Do NOT run entire application test suite
  - [ ] 6.5 Create inline code documentation
    - Document TRACKED_FIELDS_BY_MODEL configuration with comments
    - Document extension behavior and context interface
    - Document snapshot flattening logic
    - Add JSDoc comments to exported functions
    - Reference patterns from existing codebase
  - [ ] 6.6 Document Tier 3 implementation pattern
    - Create code comments showing how to add Purpose, LegalBasis, Recipient tracking
    - Show TRACKED_FIELDS configuration for Tier 3 models
    - Show extension wrapper pattern (same as Tier 1/2)
    - Note: Implementation deferred to future follow-up, but pattern should be clear
    - Reference: spec.md lines 79-84, requirements.md lines 325-356
  - [ ] 6.7 Verify multi-tenancy isolation
    - Test change logs filtered by organizationId
    - Test cross-tenant data not visible
    - Test cascade delete on organization removal
    - Verify indexes optimize tenant-scoped queries
  - [ ] 6.8 Final verification checklist
    - [ ] All Tier 1 models (AssetProcessingLocation, RecipientProcessingLocation, DataProcessingActivity) fully tracked
    - [ ] All Tier 2 models (TransferMechanism, DataSubjectCategory, DataCategory) tracked if implemented
    - [ ] Database schema migration runs successfully
    - [ ] All models enforce multi-tenancy via organizationId
    - [ ] Change logs created with flattened, human-readable snapshots
    - [ ] CREATE, UPDATE, DELETED operations tracked
    - [ ] Environment variable escape hatch works
    - [ ] Per-row bulk update pattern documented
    - [ ] Exports available from database package
    - [ ] Feature-specific tests pass (20-50 tests)
    - [ ] No more than 10 additional tests added in gap analysis

**Acceptance Criteria:**

- All feature-specific tests pass (approximately 20-50 tests total)
- No more than 10 additional tests added when filling gaps
- Multi-tenancy isolation verified
- Tier 1 models fully implemented and tested
- Tier 2 models implemented where feasible
- Tier 3 pattern documented for future implementation
- Code documentation complete
- Change tracking infrastructure ready for use

---

## Execution Order

Recommended implementation sequence:

1. **Database Layer: Schema & Models** (Task Group 1)
   - Foundational models and enums
   - Migrations and indexes
   - Multi-tenancy structure

2. **Change Tracking Infrastructure** (Task Group 2)
   - Prisma client extension
   - TRACKED_FIELDS configuration
   - Snapshot flattening logic

3. **Tier 1 Implementation** (Task Group 3)
   - AssetProcessingLocation tracking
   - RecipientProcessingLocation tracking
   - DataProcessingActivity tracking
   - CREATE, UPDATE, DELETED operations

4. **Tier 2 Implementation** (Task Group 4)
   - TransferMechanism tracking
   - DataSubjectCategory tracking
   - DataCategory tracking
   - Same pattern as Tier 1

5. **Database Package Integration** (Task Group 5)
   - Export configuration
   - DAL updates
   - Bulk update pattern documentation

6. **Testing & Documentation** (Task Group 6)
   - Comprehensive testing
   - Gap analysis (max 10 additional tests)
   - Final verification
   - Documentation

---

## Implementation Notes

### Tier Priority Guidelines

**Tier 1 (MUST):** These models are critical for cross-border transfer tracking and DPIA requirements. Full implementation and testing required in Item 16.

**Tier 2 (SHOULD):** These models directly influence safeguards, special categories, vulnerable subjects, and DPIA triggers. Implement if time permits using the same pattern as Tier 1.

**Tier 3 (CAN):** These models are important for document staleness but less critical than transfer tracking. Can be follow-up work using the same established pattern.

### Test Count Limits

- Each task group (1-5) writes 2-8 focused tests maximum
- Task group 6 adds up to 10 additional strategic tests to fill critical gaps
- Total expected tests: 20-50 tests for this feature
- Focus on integration workflows, not exhaustive unit test coverage

### Out of Scope (Deferred to Future Items)

- Document snapshot scanning (Items 37-40)
- AffectedDocument creation logic (Items 37-40)
- Background job infrastructure (Item 56)
- Change log UI components (Items 14/15/16c)
- UI confirmation dialogs (Items 14/15/16c)
- Document regeneration workflow (Item 45)
- tRPC routers for change log API endpoints
- Full GeneratedDocument implementation (Items 37-41)

### Key Technical Decisions

- **Always-on tracking** with environment variable escape hatch
- **Synchronous logging** in same transaction (no async overhead)
- **Minimal includes** for performance (Country, TransferMechanism only)
- **Flattened snapshots** for human readability (not just IDs)
- **Per-row updates** required for tracked models (no updateMany support)
- **Extension-based** approach (modern Prisma pattern)
- **Generic framework** easily extensible to remaining models
