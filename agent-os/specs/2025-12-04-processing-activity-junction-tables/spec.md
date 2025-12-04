# Specification: Processing Activity Junction Tables

## Goal

Implement four junction tables linking DataProcessingActivity to Purpose, DataSubjectCategory, DataCategory, and Recipient to enable many-to-many relationships for GDPR Article 30 compliance tracking, replacing the temporary activityIds array field on Recipient.

## User Stories

- As a DPO, I want to link multiple purposes to a processing activity so that I can accurately document all lawful bases for processing
- As a Privacy Officer, I want to query all activities that process a specific data category so that I can assess compliance impact when updating data handling procedures

## Specific Requirements

**Junction Table Structure**

- Create 4 junction tables following exact pattern of `DataCategoryDataNature` (schema.prisma:406-420)
- Each table contains: `id` (cuid), two foreign key columns, `createdAt` timestamp
- Apply unique constraint on foreign key pair to prevent duplicate relationships
- Create bidirectional indexes on both foreign keys for query performance
- Set cascade rules: Activity side `Cascade`, Component side (Purpose/DataCategory/etc.) `Restrict`
- Models: `DataProcessingActivityPurpose`, `DataProcessingActivityDataSubject`, `DataProcessingActivityDataCategory`, `DataProcessingActivityRecipient`

**Schema Model Relations**

- Update `DataProcessingActivity` model to include relations to all 4 junction tables
- Update `Purpose`, `DataSubjectCategory`, `DataCategory`, `Recipient` models to include reverse relations
- Remove `activityIds String[]` field from `Recipient` model completely
- Ensure all relations use proper naming (plural for has-many: `purposes`, `dataSubjects`, `dataCategories`, `recipients`)

**Data Migration Strategy**

- Execute single-phase migration (no production data exists)
- Create all 4 junction tables with proper constraints and indexes
- Migrate existing `Recipient.activityIds` data to `DataProcessingActivityRecipient` junction records
- Drop `Recipient.activityIds` column after data migration completes
- All operations in one migration file for atomicity

**DAL Sync Functions**

- Create `syncActivityPurposes(activityId, organizationId, purposeIds)` following pattern from dataCategories.ts:327-341
- Create `syncActivityDataCategories(activityId, organizationId, dataCategoryIds)`
- Create `syncActivityDataSubjects(activityId, organizationId, dataSubjectIds)`
- Create `syncActivityRecipients(activityId, organizationId, recipientIds)`
- Use Prisma transactions for atomicity (delete existing + create new in single transaction)
- Use `skipDuplicates: true` for idempotent createMany operations
- Enforce multi-tenancy by requiring `organizationId` parameter in all functions

**DAL Helper Functions**

- Create `linkActivityToPurposes(activityId, organizationId, purposeIds)` for adding new links without removing existing
- Create `unlinkActivityFromPurpose(activityId, organizationId, purposeId)` for removing single link
- Replicate link/unlink pattern for DataCategory, DataSubject, and Recipient entities
- Create `getActivityWithComponents(activityId, organizationId)` to query activity with all related entities via Prisma's include
- All functions must validate organizational ownership before executing operations

**Validation Schema Updates**

- Update Zod schemas to remove `activityIds` field from Recipient input/output schemas
- Create validation schemas for junction operations (arrays of cuid strings)
- Add schemas for sync operations validating activityId and component ID arrays
- Ensure all schemas enforce required fields and proper data types
- Update any composite schemas that include Recipient to reflect schema changes

**Test Coverage Requirements**

- Write integration tests for creating activities with linked components
- Test unique constraint enforcement (prevent duplicate links)
- Test querying activities with relations using Prisma's include syntax
- Test cascade deletion behavior (deleting activity removes junction records)
- Test restrict deletion behavior (cannot delete Purpose if still linked to activity)
- Test multi-tenancy isolation (org A cannot link to org B's components)
- Test all sync, link, and unlink DAL functions
- Follow test pattern from dataCategories.integration.test.ts

**Seed Data Updates**

- Update seed scripts to remove `activityIds` array assignments
- Use new junction tables when creating seed data relationships
- Ensure seed data creates realistic many-to-many relationships
- Validate seed data works correctly with new junction structure

**Code Cleanup Requirements**

- Remove all references to `Recipient.activityIds` from codebase (except migration file)
- Update any queries that previously used `activityIds` to use junction tables
- Update existing DAL functions in recipients.ts that reference activityIds
- Regenerate Prisma client types after schema changes
- Verify no TypeScript compilation errors remain after changes

**Future Extension Documentation**

- Document that `DataProcessingActivityRecipient` may need extension in Roadmap item 15
- Potential future fields: `involvesThirdCountryTransfer` Boolean, `transferBasis` enum reference
- Rationale: GDPR Article 30(1)(d) requires documenting third-country transfers
- Decision deferred until DataTransfer model architecture is designed

## Visual Design

No visual assets provided - this is a backend database implementation.

## Existing Code to Leverage

**`DataCategoryDataNature` Junction Pattern (schema.prisma:406-420)**

- Exact template for junction table structure with id, two FKs, createdAt, unique constraint, bidirectional indexes
- Demonstrates proper cascade rules: `onDelete: Cascade` for category side, `onDelete: Restrict` for nature side
- Provides proven pattern for preventing duplicate relationships via unique constraint
- Shows proper index creation for both foreign keys to optimize query performance

**DAL Sync Pattern (dataCategories.ts:187-211, 327-341)**

- Transaction-based sync operations that delete existing + create new in atomic operation
- Multi-tenancy enforcement requiring organizationId parameter
- Use of `skipDuplicates: true` for idempotent createMany operations
- Demonstrates junction table CRUD within create/update operations
- Provides template for sync function signature and implementation approach

**Integration Test Pattern (dataCategories.integration.test.ts)**

- Test structure for junction table operations including setup and teardown
- Multi-tenancy isolation testing with multiple test organizations
- Cascade deletion tests verifying foreign key behavior
- Test factories usage with createTestOrganization for consistent test data
- Query pattern testing with Prisma include for relations

**Migration SQL Patterns (20251202203143_add_gdpr_compliance_foundation_models/migration.sql)**

- SQL syntax for creating tables with foreign keys in PostgreSQL
- Index creation statements for performance optimization
- Foreign key constraint definitions with proper cascade rules
- Unique constraint syntax for preventing duplicates

**Existing DAL Exports (database/src/index.ts:28-44)**

- Pattern for exporting DAL functions from package index
- Demonstrates organization of DAL files (one per model)
- Shows proper module re-export structure for package consumers

## Out of Scope

- Roadmap item 14: DigitalAsset model implementation (separate M-sized complexity item)
- Roadmap item 15: Asset relationships and DataTransfer model (separate M-sized complexity item)
- Performance testing with large datasets or query optimization benchmarks
- UI components or frontend interfaces for managing junction relationships
- Additional junction table fields beyond basic structure (id, two FKs, createdAt)
- Third-country transfer tracking fields on Recipient junction (deferred to Roadmap item 15)
- Volume estimation fields on DataSubject junction (belongs at Activity level)
- Timestamps for who created links or justification notes (pure join tables only)
- API endpoint creation or tRPC router updates (separate layer concern)
- Storybook components or visual documentation for junction operations
