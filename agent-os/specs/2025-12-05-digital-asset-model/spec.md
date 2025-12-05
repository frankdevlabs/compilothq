# Specification: Digital Asset Model with Processing Locations

## Goal

Implement the Digital Asset model to represent systems, tools, and platforms that process personal data, enabling GDPR Article 30(1)(d) compliance by tracking WHERE and HOW personal data is processed across the organization's technical infrastructure.

## User Stories

- As a DPO, I want to track all digital assets processing personal data so that I can maintain an accurate Article 30 register of processing activities
- As a Privacy Officer, I want to document processing locations for each asset so that I can identify cross-border data transfers requiring safeguards
- As a Business Owner, I want to link processing activities to their technical systems so that compliance assessments reflect actual infrastructure

## Specific Requirements

**Database Models - DigitalAsset Core**

- Define DigitalAsset model with organizationId multi-tenancy scoping
- Include AssetType enum (DATABASE, APPLICATION, API, FILE_STORAGE, ANALYTICS_PLATFORM, MARKETING_TOOL, CRM, ERP, CLOUD_SERVICE, ON_PREMISE_SYSTEM, OTHER)
- Support optional ownership tracking via technicalOwnerId and businessOwnerId user references
- Add primaryHostingCountryId for display purposes (distinct from compliance location tracking)
- Include containsPersonalData boolean flag for filtering personal data inventory
- Add IntegrationStatus enum (CONNECTED, PENDING, FAILED, NOT_INTEGRATED, MANUAL_ONLY) for future automation readiness
- Include discovery metadata fields (lastScannedAt, discoveredVia) for audit trail
- Support metadata JSON field for extensibility

**Database Models - DataProcessingActivityDigitalAsset Junction**

- Create junction table linking DataProcessingActivity to DigitalAsset (many-to-many relationship)
- Include separate id field (not composite primary key) following existing junction table pattern
- Add unique constraint on (activityId, digitalAssetId) to prevent duplicate links
- Set activityId onDelete: Cascade (junction records owned by activity)
- Set digitalAssetId onDelete: Restrict (prevent asset deletion if linked to activities)
- Add bidirectional indexes on both foreign keys
- Include createdAt timestamp for audit trail

**Database Models - AssetProcessingLocation**

- Define AssetProcessingLocation model for tracking WHERE and HOW asset processes data
- Include organizationId for multi-tenancy and digitalAssetId foreign key with Cascade delete
- Add service free text field for business context (e.g., "BigQuery analytics", "S3 backup storage")
- Support optional purposeId FK to Purpose with purposeText fallback (require at least one)
- Add countryId FK to Country for geographic compliance tracking
- Include LocationRole enum (HOSTING, PROCESSING, BOTH) for semantic clarity
- Support optional transferMechanismId for cross-border transfer safeguards
- Add isActive boolean (default true) for historical location preservation without deletion
- Include metadata JSON for edge cases and extensibility

**Indexes for Performance and Multi-Tenancy**

- DigitalAsset: Index on (organizationId) for tenant isolation, (organizationId, containsPersonalData) for personal data inventory, (organizationId, type) for asset categorization, (organizationId, primaryHostingCountryId) for geographic distribution
- DataProcessingActivityDigitalAsset: Index on (activityId) and (digitalAssetId) for bidirectional lookups
- AssetProcessingLocation: Index on (organizationId, digitalAssetId) for locations per asset, (organizationId, countryId) for geographic compliance queries, (organizationId, transferMechanismId) for mechanism auditing

**DAL Functions - Asset Operations**

- Implement createDigitalAsset() with optional locations array parameter for atomic creation (Option B pattern from requirements)
- Return both asset and locations array from create function for single-round-trip usage
- Add addAssetProcessingLocations() function for post-creation location additions
- Include getDigitalAssetById() with optional include parameter for relations (processingLocations, activities, owners)
- Implement listDigitalAssets() with organizationId filter and optional filters (type, containsPersonalData, primaryHostingCountryId)
- Add updateDigitalAsset() for partial updates (name, description, type, owners, integrationStatus)
- Include deleteDigitalAsset() with Restrict constraint enforcement (prevent deletion if linked to activities)

**DAL Functions - Junction Operations**

- Implement linkAssetToActivity() for creating junction records with duplicate prevention
- Add unlinkAssetFromActivity() for removing junction records
- Include syncActivityAssets() for bulk synchronization (add/remove multiple assets atomically)
- Add getAssetsForActivity() to retrieve all assets linked to an activity
- Implement getActivitiesForAsset() to retrieve all activities using an asset

**DAL Functions - Location Operations**

- Implement getActiveLocationsForAsset() filtering by isActive: true
- Add updateAssetProcessingLocation() for updates (service, countryId, transferMechanismId, purposeId)
- Include deactivateAssetProcessingLocation() to set isActive: false (preserve audit trail)
- Add getLocationsByCountry() for geographic compliance queries across organization

**Validation Rules - Hard Constraints**

- Enforce foreign key integrity (organizationId, countryId, digitalAssetId, purposeId, transferMechanismId must reference existing records)
- Apply unique constraint on (activityId, digitalAssetId) in junction table
- Require NOT NULL on DigitalAsset core fields (id, organizationId, name, type, containsPersonalData)
- Require NOT NULL on AssetProcessingLocation fields (id, organizationId, digitalAssetId, service, countryId, locationRole, isActive)
- Enforce cascade rules: Organization deleted cascades to all assets, Asset deleted cascades to processing locations, Asset deletion restricted if linked to activities

**Validation Rules - Soft Warnings**

- Warn if containsPersonalData=true but no processing locations exist (informational severity)
- Warn if countryId is third country without transferMechanismId (high severity, use Country.gdprStatus JSON to determine)
- Warn if integrationStatus=CONNECTED but lastScannedAt is null or >7 days old (medium severity)
- Suggest ownership assignment if both technicalOwnerId and businessOwnerId are null (informational severity)
- Require purposeId OR purposeText on AssetProcessingLocation (medium severity warning if both null)

**tRPC Router Design**

- Create digitalAssetRouter with procedures: create, update, delete, getById, list
- Implement assetProcessingLocationRouter with procedures: add, update, deactivate, listForAsset, listByCountry
- Add activityAssetJunctionRouter with procedures: link, unlink, sync, getAssetsForActivity, getActivitiesForAsset
- Use Zod schemas from @compilothq/validation for input validation
- Inject organizationId from session context for multi-tenancy enforcement
- Return validation warnings array alongside data for soft validation feedback

**Transaction Atomicity**

- Wrap createDigitalAsset with locations in single Prisma transaction (all-or-nothing)
- Handle rollback if location creation fails during asset creation
- Use syncActivityAssets with transaction for atomic bulk updates (prevent partial state)

**Testing Requirements**

- Write 10 unit tests for DAL functions covering: asset creation with/without locations, location addition, multi-tenancy isolation, cascade behavior, junction operations, restrict constraint enforcement, transaction rollback, query filtering
- Add 6 integration tests for service layer covering: soft validation warnings, personal data consistency checks, third country transfer warnings, integration status validation, multi-location queries, historical location filtering

## Visual Design

No visual assets provided for this specification.

## Existing Code to Leverage

**Junction Table Pattern from DataProcessingActivityPurpose**

- Use existing pattern: separate id field, unique constraint on pair, bidirectional indexes, createdAt timestamp
- Follow cascade rules: activity FK with Cascade, linked entity FK with Restrict
- Apply to DataProcessingActivityDigitalAsset junction table
- Ensures consistency with existing Activity junction tables (Purpose, DataSubject, DataCategory, Recipient)

**Multi-Tenancy Pattern from Purpose Model**

- All models include organizationId FK with onDelete: Cascade
- All DAL queries filter by organizationId from session context
- Compound indexes start with organizationId for performance
- Prevents cross-tenant data access
- Apply to DigitalAsset and AssetProcessingLocation models

**DAL Function Pattern from purposes.ts**

- Implement listByOrganization with optional filters (category, scope, isActive)
- Add getById for single record retrieval
- Include create function with explicit field mapping
- Provide update function with partial data support
- Add delete function (though restrict constraints may prevent deletion)
- Apply pattern to digitalAssets.ts DAL file

**Country Reference Pattern from Existing Schema**

- Always use countryId FK, never ISO string codes
- Use Country.gdprStatus JSON array for compliance logic parsing
- Check gdprStatus for ["EU"], ["EEA"], ["Third Country"], ["Adequate"] values
- Service layer determines if transfer mechanism required based on gdprStatus
- Apply to primaryHostingCountryId and AssetProcessingLocation.countryId fields

**Zod Validation Pattern from RecipientCreateSchema**

- Define enum schemas with error messages for type safety
- Use z.string().min(1) for required text fields
- Apply .optional().nullable() for truly optional fields
- Use .uuid() for foreign key fields
- Set .default() values where applicable
- Create TypeScript types via z.infer<typeof schema>
- Apply pattern to DigitalAssetCreateSchema, AssetProcessingLocationCreateSchema, and junction schemas

## Out of Scope

- RecipientProcessingLocation model implementation (Item 15 separate spec)
- Service layer cross-border transfer detection logic combining asset and recipient locations (Item 15)
- Sub-processor chain location traversal (Item 15)
- ComponentChangeLog extensions for DigitalAsset and AssetProcessingLocation (Item 16 separate spec)
- Prisma middleware for location change detection (Item 16)
- AffectedDocument marking when locations change (Item 16)
- Document regeneration triggers (Item 16)
- Digital Asset management UI components (future items)
- Asset inventory dashboard visualization (future items)
- Processing locations map/chart visualization (future items)
- Cross-border transfer compliance dashboard (future items)
- Location change impact dialogs (future items)
- Asset integration connectors for external systems (Salesforce, AWS, Google Workspace - post-MVP)
- Automated data discovery and scanning (post-MVP)
- Machine learning-powered PII classification (post-MVP)
- Service catalog model with structured service field FK (post-MVP - let patterns emerge first)
- Materialized views for transfer detection optimization (post-MVP - use real-time service layer initially)
- Bulk location import API (defer to performance testing)
- Location versioning with effective dates (current design uses isActive flag only)
