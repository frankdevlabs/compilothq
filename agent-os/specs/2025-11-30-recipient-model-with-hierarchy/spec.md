# Specification: Recipient Model with Hierarchy

## Goal

Implement a comprehensive recipient data model that separates external legal entities (ExternalOrganization) from the roles they play (Recipient), enabling proper GDPR Article 28/26 compliance tracking with hierarchical sub-processor chains and internal department structures.

## User Stories

- As a Privacy Officer, I want to track all recipients of personal data with their specific roles so that I can maintain accurate Article 30 records and ensure appropriate agreements are in place.
- As a DPO, I want to visualize sub-processor chains so that I can verify compliance with Article 28(2) authorization requirements and assess third-country transfer risks.

## Specific Requirements

**Rename Processor to Recipient**

- The existing `Processor` model will be renamed to `Recipient` to align with GDPR terminology (Art. 4(9) defines "recipient")
- Existing `ProcessorType` enum values map to new `RecipientType`: DATA_PROCESSOR -> PROCESSOR, SUB_PROCESSOR -> SUB_PROCESSOR, JOINT_CONTROLLER -> JOINT_CONTROLLER, SERVICE_PROVIDER -> SERVICE_PROVIDER
- Three new recipient types added: SEPARATE_CONTROLLER, PUBLIC_AUTHORITY, INTERNAL_DEPARTMENT
- Migration must preserve all existing data and relationships

**Create ExternalOrganization Model**

- New model to represent external legal entities (vendors, partners, authorities)
- Contains legal name, trading name, registration details (jurisdiction, registration number, VAT)
- Links to existing `Country` model via `headquartersCountryId` for transfer risk assessment
- Stores `operatingCountries` as String array for multi-jurisdiction tracking
- Includes `isPublicAuthority` boolean for Art. 49 derogation eligibility
- Agreements are linked at ExternalOrganization level (one legal entity, multiple agreements)

**RecipientType Enum with GDPR Articles**

- `PROCESSOR` - Art. 28 data processor (requires DPA)
- `SUB_PROCESSOR` - Art. 28(2) sub-processor in chain (inherits DPA from parent)
- `JOINT_CONTROLLER` - Art. 26 joint controller (requires JCA)
- `SERVICE_PROVIDER` - General service provider (advisory only)
- `SEPARATE_CONTROLLER` - Independent controller receiving data (Art. 4(7))
- `PUBLIC_AUTHORITY` - Government/regulatory body (Art. 49 derogations possible)
- `INTERNAL_DEPARTMENT` - Internal recipient (no external organization required)

**Hierarchy Implementation**

- Self-referential `parentRecipientId` FK on Recipient model
- `HierarchyType` enum: PROCESSOR_CHAIN (sub-processors), ORGANIZATIONAL (internal), GROUPING (future)
- Only SUB_PROCESSOR and INTERNAL_DEPARTMENT types can have parents
- SUB_PROCESSOR allowed parents: PROCESSOR or SUB_PROCESSOR, max depth 5
- INTERNAL_DEPARTMENT allowed parents: INTERNAL_DEPARTMENT only, max depth 10
- Database constraint: `id != parentRecipientId` to prevent direct self-reference
- Application-layer circular reference detection using iterative depth traversal

**Agreement Model Shell**

- Basic Agreement model with: id, externalOrganizationId, type, status, signedDate, expiryDate
- `AgreementType` enum: DPA, JOINT_CONTROLLER_AGREEMENT, SCC, BCR, DPF, NDA
- `AgreementStatus` enum: DRAFT, PENDING_SIGNATURE, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED
- Full agreement workflow is OUT OF SCOPE - only shell structure for FK references
- Agreements link to ExternalOrganization, not Recipient (legal entity holds agreement)

**Validation Service Architecture**

- Type-configurable validation rules stored in `HIERARCHY_RULES` constant
- Each RecipientType defines: canHaveParent, allowedParentTypes[], maxDepth, hierarchyType
- Validation returns structured result with `errors` (blocking) and `warnings` (advisory)
- Hard errors: invalid parent type, depth exceeded, circular reference, missing required external org
- Soft warnings: missing DPA for PROCESSOR, missing JCA for JOINT_CONTROLLER, third-country without transfer mechanism

**Multi-tenancy Enforcement**

- Recipient model includes `organizationId` FK to Organization (tenant context)
- ExternalOrganization is global (shared across tenants) - no organizationId
- All DAL queries MUST filter by organizationId for tenant isolation
- Recipients can only have parent Recipients within same organization
- Cross-tenant hierarchy references must be prevented at validation layer

**Database Indexes Strategy**

- ExternalOrganization: indexes on legalName, tradingName, headquartersCountryId
- Recipient: composite indexes on (organizationId), (organizationId, isActive), (organizationId, type)
- Recipient: single indexes on externalOrganizationId, parentRecipientId for join performance
- Agreement: indexes on externalOrganizationId, type, status, expiryDate

**DAL Function Patterns**

- Follow existing patterns from `processors.ts` and `dataProcessingActivities.ts`
- All list functions use cursor-based pagination with `{ items, nextCursor }` return shape
- CRUD functions: create, getById, getByIdForOrg, list, update, delete
- Security comments on each function documenting multi-tenancy enforcement
- Use `handlePrismaError` wrapper for database error transformation

**15 Query Patterns Implementation**

- Q1 getDirectChildren: Simple WHERE parentRecipientId = :id
- Q2 getDescendantTree: Recursive CTE with depth tracking, respects maxDepth
- Q3 getAncestorChain: Iterative traversal up parentRecipientId chain
- Q4 getRecipientsByType: Filter by RecipientType within organization
- Q5 findOrphanedRecipients: SUB_PROCESSOR without valid parent (data quality)
- Q6 getRecipientsForActivity: Filter by activityIds array contains (temporary until junction table)
- Q7 findRecipientsMissingAgreements: Join Recipients -> ExternalOrg -> Agreements, check type requirements
- Q8 getThirdCountryRecipients: Join through ExternalOrg -> Country, filter non-EU/EEA/adequate
- Q9 getRecipientStatistics: Aggregation counts by type, hierarchy status, agreement status
- Q10 findDuplicateExternalOrgs: Group by legalName similarity (Levenshtein future, exact match MVP)
- Q11 getExpiringAgreements: Filter agreements by expiryDate within threshold
- Q12 findUnlinkedRecipients: Recipients with null externalOrganizationId (except INTERNAL_DEPARTMENT)
- Q13 assessCrossBorderTransfers: Join chain to get all countries in recipient tree
- Q14 checkHierarchyHealth: Validate all hierarchies for cycles, orphans, depth violations
- Q15 auditRecipientAccess: Track recipient queries for compliance logging (signature only, implementation deferred)

## Visual Design

No visual assets provided (backend/data model spec).

## Existing Code to Leverage

**Processor DAL (`/home/user/compilothq/packages/database/src/dal/processors.ts`)**

- Provides template for CRUD operations with cursor-based pagination
- Security pattern: organizationId scoping documented in JSDoc comments
- Pagination pattern: take limit+1, check hasMore, slice to limit, extract nextCursor
- Rename/extend this file to `recipients.ts` with additional hierarchy-aware functions

**DataProcessingActivity DAL (`/home/user/compilothq/packages/database/src/dal/dataProcessingActivities.ts`)**

- Demonstrates getByIdForOrg pattern for secure tenant-scoped single record fetch
- Shows count function pattern for dashboard statistics
- Complex filter combinations example for list queries
- Explicit null handling pattern for optional field updates

**Processor tRPC Router (`/home/user/compilothq/apps/web/src/server/routers/processor.ts`)**

- Pattern for orgProcedure usage with ctx.organizationId injection
- Ownership verification before update/delete operations
- TRPCError usage for NOT_FOUND and FORBIDDEN responses
- handlePrismaError wrapper for database errors

**Base Factory (`/home/user/compilothq/packages/database/src/test-utils/factories/base-factory.ts`)**

- Abstract Factory class pattern with defaults(), persist(), build(), create(), createMany()
- Sequence number generation for unique test data
- params() method for creating factory variants with different defaults

**Organization Factory (`/home/user/compilothq/packages/database/src/test-utils/factories/organizationFactory.ts`)**

- Functional factory pattern as alternative to class-based
- createTestOrganization returns { org, users } compound result
- cleanupTestOrganizations handles FK constraint ordering
- Use this pattern for ExternalOrganization and Recipient factories

## Out of Scope

- UI Components - All forms, tables, tree visualizations, and frontend components
- Full tRPC Implementation - Only basic router signatures; no complex procedure logic
- RecipientDataProcessingActivity Junction Table - Roadmap item #13, uses temporary activityIds array
- Full Agreement Workflow - Only shell model; no draft/sign/manage lifecycle implementation
- Transfer Mechanism Assignment - No logic to assign or validate transfer mechanisms to recipients
- Notification System - No infrastructure for agreement expiry or compliance deadline alerts
- Import/Export Functionality - No CSV/JSON data portability for recipients or organizations
- Audit Logging Infrastructure - No detailed access logging beyond query signature (cross-cutting concern)
- Document Generation - No DPIA, RoPA, or agreement template generation
- Questionnaire Integration - No recipient onboarding or compliance questionnaire workflows
