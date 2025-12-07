# Specification: Component Change Tracking (Item 16)

## Goal

Implement a comprehensive change tracking system to audit modifications to compliance-critical components, enabling document staleness detection and supporting future document regeneration workflows.

## User Stories

- As a DPO, I want to see when and why processing locations changed so that I can assess document regeneration needs
- As a Privacy Officer, I want to be alerted when changes affect existing DPIAs so that I can maintain compliance documentation accuracy

## Specific Requirements

**Create ComponentChangeLog Model**

- String componentType field storing model name (AssetProcessingLocation, RecipientProcessingLocation, DataProcessingActivity, etc.)
- String componentId field storing the CUID of the changed component
- ChangeType enum field with CREATED, UPDATED, DELETED values
- String fieldChanged nullable field storing specific field name that triggered the log
- Json oldValue and newValue fields storing flattened snapshots with human-readable nested data
- String changedByUserId nullable field linking to User (null for system-initiated changes)
- String changeReason nullable field for optional context from UI
- DateTime changedAt field with default(now())
- Multi-tenancy via organizationId with cascading delete
- Compound indexes on (organizationId, componentType, componentId, changedAt) for efficient component history queries
- Index on (changedAt) for timeline queries
- Index on (organizationId, changedAt) for org-scoped audit logs

**Create GeneratedDocument Model (Minimal)**

- Minimal schema supporting future document generation features (Items 37-40)
- GeneratedDocumentType enum with ROPA, DPIA, LIA, DPA, PRIVACY_STATEMENT, DTIA values
- String version field for document versioning
- Nullable assessmentId and dataProcessingActivityId foreign keys
- Json dataSnapshot field storing frozen component state at generation time
- Nullable wordFileUrl, pdfFileUrl, markdownContent fields for future file storage
- DateTime generatedAt with default(now())
- String generatedBy nullable field linking to User
- DocumentStatus enum field (DRAFT, FINAL, SUPERSEDED, ARCHIVED) with default DRAFT
- Multi-tenancy via organizationId with cascading delete
- Indexes on (organizationId, documentType, status) and (generatedAt)

**Create AffectedDocument Model**

- Links ComponentChangeLog to GeneratedDocument via foreign keys with cascading deletes
- ImpactType enum field with 15+ categories (TRANSFER_SECTION_OUTDATED, MECHANISM_SECTION_OUTDATED, LOCATION_CHANGED, LOCATION_ADDED, LOCATION_REMOVED, THIRD_COUNTRY_ADDED, SAFEGUARD_REMOVED, PURPOSE_SECTION_OUTDATED, LEGAL_BASIS_SECTION_OUTDATED, DATA_CATEGORY_SECTION_OUTDATED, DATA_SUBJECT_SECTION_OUTDATED, RECIPIENT_SECTION_OUTDATED, ACTIVITY_RISK_LEVEL_CHANGED, ACTIVITY_DPIA_REQUIREMENT_CHANGED, RETENTION_SECTION_OUTDATED, OTHER_COMPONENT_CHANGED)
- String impactDescription field with human-readable explanation
- DateTime detectedAt with default(now())
- Nullable reviewedAt and reviewedBy fields for workflow tracking
- Unique constraint on (generatedDocumentId, componentChangeLogId) to prevent duplicate impact records
- Multi-tenancy via organizationId with cascading delete
- Indexes on (organizationId, generatedDocumentId) and (organizationId, detectedAt)

**Implement Prisma Client Extension for Change Tracking**

- Location at packages/database/src/middleware/changeTracking.ts using modern Prisma client extensions API (not deprecated middleware)
- Always-on by default with DISABLE_CHANGE_TRACKING=true environment variable escape hatch for tests and scripts
- Accepts runtime context object with optional userId and changeReason fields
- Wraps update operations for tracked models
- Extension performs targeted queries with minimal includes (Country and TransferMechanism for location models)
- Extension responsible for fetching before and after state snapshots (not caller)
- Comparison logic detects changes in tracked fields only
- Creates ComponentChangeLog entry synchronously in same transaction when tracked fields change
- Exports extended Prisma client as prismaWithTracking for use in DAL functions

**Configure TRACKED_FIELDS_BY_MODEL for 9 Models**

- AssetProcessingLocation: countryId, transferMechanismId, locationRole, isActive
- RecipientProcessingLocation: countryId, transferMechanismId, locationRole, isActive
- DataProcessingActivity: riskLevel, requiresDPIA, dpiaStatus, retentionPeriodMonths, retentionJustification, status
- TransferMechanism: name, code, description, gdprArticle, category, requiresSupplementaryMeasures, isActive
- DataSubjectCategory: name, isVulnerable, vulnerabilityReason, suggestsDPIA, isActive
- DataCategory: name, description, sensitivity, isSpecialCategory, isActive
- Purpose: name, description, category, scope, isActive
- LegalBasis: type, name, framework, requiresConsent, consentMechanism, isActive
- Recipient: type, externalOrganizationId, purpose, description, parentRecipientId, isActive

**Implement Tiered Change Tracking (3 Tiers)**

- Tier 1 MUST (fully implemented and tested): AssetProcessingLocation, RecipientProcessingLocation, DataProcessingActivity
- Tier 2 SHOULD (implement if time permits): TransferMechanism, DataSubjectCategory, DataCategory
- Tier 3 CAN (follow-up using same pattern): Purpose, LegalBasis, Recipient
- All 9 models use identical extension pattern with model-specific TRACKED_FIELDS configuration
- Generic framework allows easy extension to remaining models in future items

**Generate Flattened Human-Readable Snapshots**

- For location models include nested country object with id, name, isoCode, gdprStatus fields
- For location models include nested transferMechanism object with id, name, code, gdprArticle fields when present
- For taxonomy models include relevant classification fields (sensitivity, category, framework, etc.)
- Store complete snapshot in oldValue (before update) and newValue (after update) as Json
- Snapshots immune to later changes in referenced entities (frozen point-in-time data)
- Minimal includes limit overhead: only Country and TransferMechanism for location models

**Handle Edge Cases**

- Rapid successive updates: Log every update separately with no automatic deduplication
- Cascading updates: Log change on component itself once, do not create synthetic logs for all referencing rows
- Bulk operations: Do not support updateMany for tracked models, require per-row updates for accurate per-record change logs
- Component changes: Single log entry when TransferMechanism changes, impact analysis deferred to document scanning layer
- Per-row bulk pattern: For bulk changes iterate through IDs and call update per record to trigger change tracking

**Synchronous Logging with Deferred Impact Analysis**

- Synchronous in-transaction operations: Compare before/after snapshots, write ComponentChangeLog if tracked fields changed
- Deferred to Items 37-40 and 56: Scanning GeneratedDocument snapshots, creating AffectedDocument records in bulk, heavy cross-component impact analysis
- No performance impact on normal CRUD operations
- Background job infrastructure for impact analysis comes later in roadmap

**Support Multi-Tenancy Pattern**

- All models include organizationId foreign key with onDelete Cascade
- All queries filter by organizationId from session context
- ComponentChangeLog, GeneratedDocument, AffectedDocument all enforce tenant isolation
- Compound indexes start with organizationId for query performance

## Existing Code to Leverage

**Multi-Tenancy Patterns from Existing Models**

- organizationId foreign keys with onDelete Cascade used consistently across Country, Recipient, DataProcessingActivity models
- Compound indexes starting with organizationId for tenant-scoped queries
- Session context providing ctx.organizationId for filtering
- Cascade delete behavior on organization removal

**Prisma Client Singleton Pattern**

- packages/database/src/index.ts exports single prisma instance preventing connection pool exhaustion
- Singleton pattern enforced via global variable in development
- All DAL functions import from @compilothq/database not from generated client
- Extension-based approach compatible with existing singleton

**Service Layer Transfer Detection Logic**

- packages/database/src/services/transferDetection.ts implements isSameJurisdiction, isThirdCountry, requiresSafeguards helper functions
- deriveTransferRisk function provides transfer risk assessment logic
- validateTransferMechanismRequirement used in RecipientProcessingLocation DAL for hard validation
- Composition-based approach (not stored relationships) aligns with change tracking philosophy

**DAL Function Patterns from RecipientProcessingLocation**

- packages/database/src/dal/recipientProcessingLocations.ts implements create, update, deactivate, and move operations with validation
- Atomic move operation pattern: create new, deactivate old in single transaction
- Multi-tenancy validation ensuring recipient belongs to organization before creating location
- Transfer mechanism validation integrated into create and update flows

**Validation and Error Handling Patterns**

- Strict validation in DAL layer before database operations
- Descriptive error messages referencing GDPR articles
- Atomic transactions using prisma.$transaction for multi-step operations
- Multi-tenancy checks preventing cross-tenant data access

## Out of Scope

- Automatic deduplication of rapid successive changes (consolidation handled in reporting layer later)
- Support for updateMany operations on tracked models (must use per-row updates)
- Automatic expansion of component changes into referenced row logs (only log actual component change)
- Document snapshot scanning to create AffectedDocument records (deferred to Items 37-40)
- Background job infrastructure for heavy impact analysis (deferred to Item 56)
- UI components for viewing change logs (deferred to Items 14/15/16c)
- UI confirmation dialogs for high-impact changes (deferred to UI specs)
- Change reason enforcement logic in UI layer (deferred to UI specs)
- Full GeneratedDocument implementation including file generation (deferred to Items 37-41)
- Document regeneration workflow triggering (deferred to Item 45)
- tRPC routers for change log API endpoints (added after core implementation proven)
- Real-time notifications for document staleness (future enhancement)
- Change log retention policies and archival (future enhancement)
