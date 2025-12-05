# Requirements & Decisions: Digital Asset Model with Processing Locations

**Spec:** Item 14 - Digital Asset & Hosting/Processing Model
**Date:** 2025-12-05
**Status:** Requirements Complete - Ready for Specification

---

## Initial Description

Implement the Digital Asset model to represent systems, tools, and platforms that process personal data within the organization. This model is essential for tracking WHERE and HOW personal data is processed across the technical infrastructure.

The feature consists of three database models:

1. **DigitalAsset** - Represents systems, tools, platforms (CRM, email platforms, cloud storage, analytics tools)
2. **DataProcessingActivityDigitalAsset** - Junction table linking processing activities to digital assets (many-to-many)
3. **AssetProcessingLocation** - Tracks WHERE each digital asset processes or stores data (geographic locations for GDPR Article 30 compliance)

---

## Scope Boundaries

### In Scope (This Spec - Item 14 ONLY)

1. Database models: DigitalAsset, DataProcessingActivityDigitalAsset, AssetProcessingLocation
2. Prisma schema definitions with proper indexes and relations
3. Prisma migrations for all three models
4. Type-safe DAL (Data Access Layer) functions for CRUD operations
5. Service layer composition for deriving cross-border transfers from asset locations
6. Multi-tenancy support with organizationId filtering
7. Integration with existing Activity junction table pattern
8. User ownership tracking (technicalOwner, businessOwner)
9. Asset categorization via AssetType enum
10. Geographic compliance tracking via AssetProcessingLocation
11. Transfer mechanism linking for cross-border safeguards
12. Soft validation (warnings) for data consistency

### Out of Scope (Future Work)

**Item 15 - Recipient Processing Locations** (separate spec)

- RecipientProcessingLocation model
- Service layer transfer detection logic combining asset + recipient locations
- Sub-processor chain location traversal
- Comprehensive cross-border transfer dashboard

**Item 16 - Component Change Tracking** (separate spec)

- ComponentChangeLog extensions for DigitalAsset and AssetProcessingLocation
- Prisma middleware for change detection
- Affected document marking when locations change
- Document regeneration triggers

**UI Components** (future items)

- Digital Asset management UI
- Asset inventory dashboard
- Processing locations visualization
- Cross-border transfer compliance views
- Location change impact dialogs

**Advanced Features** (post-MVP)

- Asset integration connectors (Salesforce, AWS, Google Workspace)
- Automated data discovery and scanning
- ML-powered PII classification
- Service catalog (structured AssetProcessingLocation.service field)
- Materialized views for transfer detection optimization

---

## Key Technical Decisions

### Decision 1: Asset Types (Enum vs Free Text)

**Question:** Should asset types be a strict enum or free text for flexibility?

**Decision:** Strict enum with extensible "OTHER" option

**Rationale:**

- Enables reliable categorization and filtering ("show all CRM systems")
- Prevents typo variations ("crm" vs "CRM" vs "customer-relationship-management")
- "OTHER" provides escape hatch for edge cases
- Enum can be extended in future migrations (e.g., add "AI_PLATFORM")

**Implementation:**

```prisma
enum AssetType {
  DATABASE
  APPLICATION
  API
  FILE_STORAGE
  ANALYTICS_PLATFORM
  MARKETING_TOOL
  CRM
  ERP
  CLOUD_SERVICE
  ON_PREMISE_SYSTEM
  OTHER
}
```

### Decision 2: Primary Hosting Country (Display vs Compliance)

**Question:** What's the purpose of `primaryHostingCountryId` vs `AssetProcessingLocation` countries?

**Decision:** Two distinct use cases

- `DigitalAsset.primaryHostingCountryId` = DISPLAY purpose ("hosted in US")
- `AssetProcessingLocation` records = COMPLIANCE tracking (all processing regions)

**Rationale:**

- primaryHostingCountryId is nullable, simple, user-friendly label
- AssetProcessingLocation supports multiple countries with per-location context (service, purpose, mechanism)
- Asset might have "primary hosting in EU" but also process in US (analytics) and India (support)
- Don't duplicate location data - keep display and compliance concerns separate

**Example:**

```typescript
// Display: "Google Cloud (Hosted in United States)"
DigitalAsset {
  name: "Google Cloud",
  primaryHostingCountryId: "US",  // For UI display
  processingLocations: [
    { countryId: "US", service: "BigQuery analytics", locationRole: "BOTH" },
    { countryId: "EU", service: "Cloud Storage backup", locationRole: "HOSTING" },
    { countryId: "IN", service: "Support ticketing", locationRole: "PROCESSING" }
  ]
}
```

### Decision 3: Ownership Fields (Required vs Optional)

**Question:** Should technicalOwner and businessOwner be required fields?

**Decision:** Optional (nullable)

**Rationale:**

- Legacy assets may lack defined ownership
- Organization may not have clear ownership model initially
- Same user can be both technical and business owner (small teams)
- Soft validation can warn about missing ownership without blocking creation

**Validation:**

- Hard constraint: None (nullable FKs)
- Soft validation: Warn if both null ("Recommended to assign ownership")

### Decision 4: Integration Status Semantics

**Question:** What do integration statuses mean and how strictly enforce?

**Decision:** Enum for current integration state, soft validation on consistency

**Enum Values:**

- `CONNECTED` - Active automated integration (lastScannedAt should be recent)
- `PENDING` - Integration configured but not yet successful
- `FAILED` - Integration attempted but failed (check lastScanError)
- `NOT_INTEGRATED` - No automated integration available/configured
- `MANUAL_ONLY` - Asset tracked manually without automation

**Validation:**

- Soft: If `CONNECTED`, warn if `lastScannedAt` is null or >7 days old
- No hard constraint (allows temporary states during integration setup)

### Decision 5: Processing Location Service Field (Free Text vs Catalog)

**Question:** Should `AssetProcessingLocation.service` be free text or FK to Service catalog?

**Decision:** Free text initially (MVP flexibility)

**Rationale:**

- Let patterns emerge before creating service catalog
- Users may describe same service differently ("email sending" vs "transactional emails")
- Evolution path: If 80%+ reuse same service names, create Service model in future
- Escape hatch via free text prevents blocking edge cases

**Best Practice Guidance:**

- Encourage specific descriptions: "BigQuery analytics" not just "Analytics"
- Examples: "Email delivery via SendGrid", "S3 backup storage", "Redis session caching"

### Decision 6: Processing Location Purpose (FK vs Text)

**Question:** Should purpose be required? FK or free text?

**Decision:** Optional FK with free text fallback

**Schema:**

```prisma
purposeId   String?   // Optional FK to Purpose
purposeText String?   // Fallback free text if purpose not formalized
```

**Rationale:**

- Early in data modeling, purposes may not be formalized yet
- Link to Purpose when available (preferred for structured queries)
- Free text fallback prevents blocking ("Analytics" as text until Purpose created)
- Validation: Require at least one (purposeId OR purposeText)

### Decision 7: Location Role Enum (Strict vs Custom)

**Question:** Should locationRole support custom values or be strict enum?

**Decision:** Strict enum with three values

**Enum:**

```prisma
enum LocationRole {
  HOSTING      // Primary hosting location (servers physically here)
  PROCESSING   // Additional processing region (data processed but not stored)
  BOTH         // Both hosting and processing occur here
}
```

**Rationale:**

- Clear semantics prevent ambiguity
- Prevents "hosting-and-processing" typo variants
- BOTH explicitly captures combined use case
- Escape hatch: Use metadata JSON for edge cases

### Decision 8: Transfer Mechanism Requirement

**Question:** When is `transferMechanismId` required on AssetProcessingLocation?

**Decision:** Nullable with service layer validation

**Validation Logic:**

```typescript
// Soft validation in service layer
if (isThirdCountry(country) && !transferMechanismId) {
  warnings.push({
    field: 'transferMechanismId',
    severity: 'HIGH',
    message: `Processing in ${country.name} (third country) requires transfer mechanism per GDPR Article 46`,
  })
}
```

**Rules:**

- NULL if processing within same legal framework (EU → EU, EEA → EEA)
- REQUIRED if `countryId` is third country without adequacy decision
- Uses `Country.gdprStatus` JSON to determine requirement
- Soft validation (warning) not hard constraint (allows WIP states)

### Decision 9: Multiple Purposes for Same Asset/Country

**Question:** How to handle asset processing in same country for multiple purposes (e.g., BigQuery in US for analytics AND ML)?

**Decision:** Create multiple AssetProcessingLocation records (one per service/purpose)

**Example:**

```typescript
// Two distinct processing activities in same country
AssetProcessingLocation {
  digitalAssetId: bigQueryId,
  countryId: "US",
  service: "Customer analytics dashboard",
  purposeId: analyticsId,
  locationRole: "BOTH"
}

AssetProcessingLocation {
  digitalAssetId: bigQueryId,
  countryId: "US",
  service: "ML model training",
  purposeId: mlDevelopmentId,
  locationRole: "PROCESSING"
}
```

**Rationale:**

- Granular tracking per business context
- Different purposes may have different transfer mechanisms
- Clearer audit trail and compliance documentation
- Supports future service-level monitoring

### Decision 10: Historical Locations (Deletion vs Deactivation)

**Question:** When asset stops processing in a location, delete record or mark inactive?

**Decision:** Deactivation via `isActive` flag (preserve audit trail)

**Pattern:**

```typescript
// Don't delete - mark inactive
await prisma.assetProcessingLocation.update({
  where: { id: locationId },
  data: { isActive: false },
})

// Only query active locations for compliance
await prisma.assetProcessingLocation.findMany({
  where: { isActive: true },
})

// Historical locations queryable for document regeneration
await prisma.assetProcessingLocation.findMany({
  where: { digitalAssetId, createdAt: { lte: snapshotDate } },
})
```

**Rationale:**

- Complete audit trail (required for GDPR accountability)
- Document regeneration needs historical snapshot accuracy
- Change tracking captures deactivation event
- Disk space cost minimal vs compliance value

### Decision 11: Validation Strategy (Hard vs Soft)

**Question:** Should validation rules be enforced at database level or service layer?

**Decision:** Multi-layered validation strategy

**Hard Constraints (Database Level):**

- Foreign key integrity (organizationId, countryId, digitalAssetId must exist)
- Unique constraints (prevent duplicate junction records)
- NOT NULL on required fields (id, organizationId, name, type)
- Cascade rules (onDelete: Cascade for multi-tenancy cleanup)

**Soft Validation (Service Layer):**

- containsPersonalData=true should have processing locations (warning)
- Third country locations should have transfer mechanisms (warning)
- CONNECTED assets should have recent lastScannedAt (warning)
- Recommend ownership assignment when null (info)

**Rationale:**

- Hard constraints protect data integrity
- Soft warnings allow WIP states and edge cases
- Progressive disclosure: Users can save incomplete data, warnings guide completion
- Aligns with product philosophy (guardrails not gates)

### Decision 12: Cascade Rules for Junction Table

**Question:** What happens when Activity or Asset deleted?

**Decision:** Asymmetric cascade behavior

**Schema:**

```prisma
model DataProcessingActivityDigitalAsset {
  activityId     String
  digitalAssetId String

  activity     DataProcessingActivity @relation(..., onDelete: Cascade)
  digitalAsset DigitalAsset           @relation(..., onDelete: Restrict)
}
```

**Rules:**

- `activityId onDelete: Cascade` - Delete junction when activity deleted
- `digitalAssetId onDelete: Restrict` - Prevent asset deletion if linked to activities

**Rationale:**

- Activity ownership: Junction records are part of activity data
- Asset protection: Prevent accidental asset deletion that would break multiple activities
- Force explicit cleanup: User must unlink asset from all activities before deletion
- Data integrity over convenience

### Decision 13: DAL API Design - CRITICAL DECISION

**Question:** Should DAL provide separate functions for asset creation vs location creation, or single function handling both?

**User Decision:** Option B - Single creation function with optional locations array

**DAL API Pattern:**

```typescript
// Primary creation pattern - single function handles both cases
createDigitalAsset(data: {
  organizationId: string
  name: string
  type: AssetType
  description?: string
  primaryHostingCountryId?: string
  url?: string
  technicalOwnerId?: string
  businessOwnerId?: string
  containsPersonalData: boolean
  locations?: AssetProcessingLocationInput[]  // OPTIONAL array
}) → Promise<{
  asset: DigitalAsset
  locations: AssetProcessingLocation[]
}>

// Separate function for adding locations later
addAssetProcessingLocations(
  assetId: string,
  locations: AssetProcessingLocationInput[]
) → Promise<AssetProcessingLocation[]>

// AssetProcessingLocationInput type
interface AssetProcessingLocationInput {
  service: string
  countryId: string
  locationRole: LocationRole
  purposeId?: string
  purposeText?: string
  transferMechanismId?: string
  isActive?: boolean
  metadata?: Record<string, unknown>
}
```

**Usage Examples:**

```typescript
// Case 1: Create asset with locations atomically
const { asset, locations } = await createDigitalAsset({
  organizationId: ctx.organizationId,
  name: 'Google Cloud',
  type: 'CLOUD_SERVICE',
  containsPersonalData: true,
  locations: [
    {
      service: 'BigQuery analytics',
      countryId: 'US',
      locationRole: 'BOTH',
      transferMechanismId: sccId,
    },
    {
      service: 'Cloud Storage backup',
      countryId: 'EU-DE',
      locationRole: 'HOSTING',
    },
  ],
})

// Case 2: Create asset without locations (define later)
const { asset, locations } = await createDigitalAsset({
  organizationId: ctx.organizationId,
  name: 'Legacy HR System',
  type: 'ON_PREMISE_SYSTEM',
  containsPersonalData: true,
  // locations: undefined - will be added later
})

// Case 3: Add locations to existing asset
const newLocations = await addAssetProcessingLocations(asset.id, [
  {
    service: 'Employee data storage',
    countryId: 'NL',
    locationRole: 'BOTH',
  },
])
```

**Rationale for Option B:**

- Single function reduces API surface (easier to learn)
- Atomic transaction when locations provided (all-or-nothing)
- Flexibility: Locations optional for incremental data entry
- Mirrors user workflow: "Create asset, optionally define locations now or later"
- Aligns with product philosophy: Progressive disclosure
- Simpler tRPC router (fewer procedures)

**Alternative Considered (Option A - Rejected):**

- Separate `createDigitalAsset()` and `createAssetProcessingLocation()` functions
- Rejected: More verbose API, no transaction guarantee, extra round-trips
- Still provide `addAssetProcessingLocations()` for post-creation additions

---

## Existing Patterns to Follow

### 1. Junction Table Pattern (Item 13)

**Reference:** `DataProcessingActivityPurpose`, `DataProcessingActivityDataSubject`, etc.

**Pattern to Follow:**

```prisma
model DataProcessingActivityDigitalAsset {
  id             String   @id @default(cuid())
  activityId     String
  digitalAssetId String
  createdAt      DateTime @default(now())

  // Relations
  activity     DataProcessingActivity @relation(...)
  digitalAsset DigitalAsset           @relation(...)

  // Constraints
  @@unique([activityId, digitalAssetId])
  @@index([activityId])
  @@index([digitalAssetId])
}
```

**Key Characteristics:**

- Separate `id` field (not composite primary key)
- `createdAt` timestamp
- Unique constraint on pair
- Bidirectional indexes
- No additional metadata fields (keep junction tables simple)

### 2. Multi-Tenancy Pattern (Item 4)

**Reference:** All models have `organizationId` with cascade delete

**Pattern to Follow:**

```prisma
model DigitalAsset {
  organizationId String

  organization Organization @relation(..., onDelete: Cascade)

  @@index([organizationId])
  @@index([organizationId, containsPersonalData])
}
```

**Critical Rules:**

- ALL models have `organizationId` FK
- `onDelete: Cascade` for cleanup when org deleted
- Compound indexes start with `organizationId`
- ALL DAL queries filter by `organizationId` from session context

### 3. Country Reference Pattern (Item 3)

**Reference:** `Country` model with `gdprStatus` JSON

**Pattern to Follow:**

```typescript
// Always use FK, never ISO string
primaryHostingCountryId: string // FK to Country.id
countryId: string // FK to Country.id

// Service layer logic
const country = await prisma.country.findUnique({
  where: { id: countryId },
})
const gdprStatus = country.gdprStatus as string[]
const isThirdCountry =
  !gdprStatus.includes('EU') && !gdprStatus.includes('EEA') && !gdprStatus.includes('Adequate')
```

**Key Characteristics:**

- Always FK to Country, never string "US" or "DE"
- `gdprStatus` is JSON array: `["EU"]`, `["Third Country"]`, `["EEA", "Adequate"]`
- Service layer parses gdprStatus for compliance logic

### 4. Enum Definition Pattern

**Reference:** Existing enums in schema (AssetType, IntegrationStatus, LocationRole)

**Pattern to Follow:**

```prisma
// At top of schema file
enum AssetType {
  DATABASE
  APPLICATION
  API
  // ... all values
}

// In model
type AssetType
```

**Key Characteristics:**

- SCREAMING_SNAKE_CASE for enum values
- Alphabetically ordered (except OTHER/UNKNOWN last)
- Include escape hatch value (OTHER, UNKNOWN)

---

## Data Model Summary

### DigitalAsset

**Purpose:** Represent systems, tools, platforms processing personal data

**Key Fields:**

- `id` (cuid), `organizationId` (FK)
- `name`, `type` (AssetType enum), `description`
- `primaryHostingCountryId` (nullable FK to Country) - Display purpose
- `url`, `technicalOwnerId`, `businessOwnerId` (nullable FKs to User)
- `containsPersonalData` (boolean, default false)
- `integrationStatus` (enum), `lastScannedAt`, `discoveredVia`
- `metadata` (JSON for extensibility)

**Relations:**

- `organization` (Organization)
- `primaryHostingCountry` (Country, nullable)
- `technicalOwner`, `businessOwner` (User, nullable)
- `activities` (DataProcessingActivityDigitalAsset[])
- `processingLocations` (AssetProcessingLocation[])

**Indexes:**

- `(organizationId)` - Multi-tenant isolation
- `(organizationId, containsPersonalData)` - Personal data inventory
- `(organizationId, type)` - Asset categorization
- `(organizationId, primaryHostingCountryId)` - Geographic distribution

### DataProcessingActivityDigitalAsset (Junction)

**Purpose:** Link activities to assets (many-to-many)

**Key Fields:**

- `id`, `activityId`, `digitalAssetId`, `createdAt`

**Relations:**

- `activity` (DataProcessingActivity, onDelete: Cascade)
- `digitalAsset` (DigitalAsset, onDelete: Restrict)

**Constraints:**

- Unique on `(activityId, digitalAssetId)`

**Indexes:**

- `(activityId)`, `(digitalAssetId)`

### AssetProcessingLocation

**Purpose:** Track WHERE and HOW asset processes data (geographic compliance)

**Key Fields:**

- `id`, `organizationId`, `digitalAssetId`
- `service` (free text, business context)
- `purposeId` (nullable FK to Purpose), `purposeText` (fallback)
- `countryId` (FK to Country)
- `locationRole` (enum: HOSTING, PROCESSING, BOTH)
- `transferMechanismId` (nullable FK to TransferMechanism)
- `isActive` (boolean, default true)
- `metadata` (JSON)

**Relations:**

- `organization` (Organization, onDelete: Cascade)
- `digitalAsset` (DigitalAsset, onDelete: Cascade)
- `country` (Country, onDelete: Restrict)
- `purpose` (Purpose, nullable, onDelete: SetNull)
- `transferMechanism` (TransferMechanism, nullable, onDelete: SetNull)

**Indexes:**

- `(organizationId, digitalAssetId)` - Locations per asset
- `(organizationId, countryId)` - Geographic compliance queries
- `(organizationId, transferMechanismId)` - Mechanism auditing

---

## Testing Strategy

### Unit Tests (DAL Functions)

**Test Coverage:**

1. `createDigitalAsset()` - Basic creation
2. `createDigitalAsset()` with locations - Atomic transaction
3. `createDigitalAsset()` - Validation failures
4. `addAssetProcessingLocations()` - Add to existing asset
5. `getDigitalAsset()` - Include relations
6. `updateDigitalAsset()` - Partial updates
7. `deleteDigitalAsset()` - Restrict if linked to activities
8. `linkAssetToActivity()` - Junction creation
9. `unlinkAssetFromActivity()` - Junction deletion
10. Multi-tenancy isolation - User from org A cannot access org B assets

**Example Test:**

```typescript
describe('createDigitalAsset', () => {
  it('should create asset with locations atomically', async () => {
    const result = await createDigitalAsset({
      organizationId: testOrg.id,
      name: 'Test Asset',
      type: 'DATABASE',
      containsPersonalData: true,
      locations: [{ service: 'Primary DB', countryId: usCountryId, locationRole: 'BOTH' }],
    })

    expect(result.asset.name).toBe('Test Asset')
    expect(result.locations).toHaveLength(1)
    expect(result.locations[0].service).toBe('Primary DB')
  })

  it('should rollback asset creation if location fails', async () => {
    await expect(
      createDigitalAsset({
        organizationId: testOrg.id,
        name: 'Test Asset',
        type: 'DATABASE',
        locations: [{ service: 'Bad', countryId: 'INVALID_ID', locationRole: 'BOTH' }],
      })
    ).rejects.toThrow()

    // Verify asset was NOT created (transaction rollback)
    const assets = await prisma.digitalAsset.findMany({
      where: { organizationId: testOrg.id },
    })
    expect(assets).toHaveLength(0)
  })
})
```

### Integration Tests (Service Layer + Database)

**Test Coverage:**

1. Transfer detection logic (Item 15 dependency - defer to that spec)
2. Soft validation warnings (containsPersonalData without locations)
3. Third country transfer mechanism warnings
4. Multi-location asset queries
5. Activity-to-asset junction queries
6. Historical location queries (isActive filtering)

### E2E Tests (Full Stack - Future UI Implementation)

**Deferred to UI implementation specs:**

- Asset creation form workflow
- Location management UI
- Cross-border transfer dashboard
- Change impact dialogs

---

## Dependencies & Prerequisites

### Database Prerequisites (MUST be completed first)

**Item 3: Foundation Reference Models**

- `Country` model with `gdprStatus` JSON
- `TransferMechanism` model with GDPR article references
- Seed data for countries and transfer mechanisms

**Item 8: DataProcessingActivity Model**

- `DataProcessingActivity` base model
- Multi-tenancy pattern established
- Status tracking enums

**Item 12: Recipient Model**

- `Recipient` model (for future Item 15 integration)
- ExternalOrganization relationship pattern

**Item 4: Multi-Tenancy**

- `Organization` model
- User model with organizationId
- Session context providing ctx.organizationId

### Code Prerequisites

**DAL Pattern Established:**

- Data Access Layer functions in `packages/database/src/`
- Prisma Client singleton
- tRPC context with organizationId injection

**Validation Infrastructure:**

- Zod schemas in `packages/validation/src/`
- Shared validation utilities

---

## Future Work & Roadmap Integration

### Item 15: Recipient Processing Locations (Next Spec)

**Builds On:**

- AssetProcessingLocation pattern (mirror design)
- LocationRole enum (reuse)
- Transfer mechanism linking (same logic)

**Adds:**

- `RecipientProcessingLocation` model
- Service layer: `detectCrossBorderTransfers()`
- Sub-processor chain traversal
- Combined asset + recipient transfer analysis

### Item 16: Component Change Tracking (Subsequent Spec)

**Extends:**

- `ComponentChangeLog` enum to include "DigitalAsset" and "AssetProcessingLocation"
- Prisma middleware for location change detection
- `AffectedDocument` linking when locations change

**Enables:**

- Audit trail for location changes
- Document regeneration triggers
- Compliance change notifications

### Items 35-38: Document Generation (Later Phase)

**Uses:**

- AssetProcessingLocation data in DPIA snapshots
- Geographic distribution sections
- Transfer mechanism documentation
- Processor location tables

### Items 44+: Asset Integration & Discovery (Scale Phase)

**Leverages:**

- `integrationStatus` field
- `lastScannedAt` timestamp
- `discoveredVia` attribution
- Automated asset creation from connectors

---

## Validation Rules Summary

### Hard Constraints (Database-Enforced)

1. **Foreign Key Integrity:**
   - `organizationId` must reference existing Organization
   - `countryId` must reference existing Country
   - `digitalAssetId` must reference existing DigitalAsset
   - `purposeId` (if not null) must reference existing Purpose
   - `transferMechanismId` (if not null) must reference existing TransferMechanism

2. **Unique Constraints:**
   - `(activityId, digitalAssetId)` unique in junction table

3. **NOT NULL Requirements:**
   - `DigitalAsset`: id, organizationId, name, type, containsPersonalData
   - `AssetProcessingLocation`: id, organizationId, digitalAssetId, service, countryId, locationRole, isActive

4. **Cascade Rules:**
   - Organization deleted → All assets cascade delete
   - Asset deleted → All processing locations cascade delete
   - Asset deleted → Restricted if linked to activities (manual unlink required)
   - Activity deleted → Junction records cascade delete

### Soft Validations (Service Layer Warnings)

1. **Personal Data Consistency:**
   - Severity: INFO
   - Rule: If `containsPersonalData = true`, recommend at least one processing location
   - Message: "Asset contains personal data but has no processing locations defined. Add locations for compliance tracking."

2. **Transfer Mechanism Requirement:**
   - Severity: HIGH
   - Rule: If `countryId` is third country AND no `transferMechanismId`
   - Message: "Processing in [Country] (third country) requires transfer mechanism per GDPR Article 46"

3. **Integration Status Consistency:**
   - Severity: MEDIUM
   - Rule: If `integrationStatus = CONNECTED` AND `lastScannedAt` is null or >7 days old
   - Message: "Connected asset has not been scanned recently. Check integration health."

4. **Ownership Recommendation:**
   - Severity: INFO
   - Rule: If both `technicalOwnerId` and `businessOwnerId` are null
   - Message: "Recommended to assign ownership for accountability. Specify technical and/or business owner."

5. **Purpose Specification:**
   - Severity: MEDIUM
   - Rule: If neither `purposeId` nor `purposeText` provided on AssetProcessingLocation
   - Message: "Specify processing purpose (link to Purpose or provide text description)"

---

## Migration & Backward Compatibility

### No Existing Data to Migrate

- `DigitalAsset` is entirely new model (no migration needed)
- `AssetProcessingLocation` is new child model (no migration needed)
- `DataProcessingActivityDigitalAsset` is new junction (no existing relationships)

### Safe to Deploy

- New tables do not modify existing schema
- No breaking changes to existing models
- Can be deployed alongside existing features
- Activities function normally without assets linked

### Progressive Adoption Path

**Phase 1:** Deploy models (no UI)

- Database schema available
- DAL functions available via tRPC
- No user-facing changes

**Phase 2:** Introduce asset creation UI

- Users can create assets
- Link assets to activities
- View asset inventory

**Phase 3:** Add processing locations UI

- Define where assets process data
- Geographic compliance dashboard
- Transfer mechanism tracking

**Phase 4:** Enable integrations (Item 44+)

- Automated discovery
- Connector-created assets
- Continuous scanning

---

## Open Questions & Assumptions

### Assumptions Made

1. **Service Field Granularity:** Users will provide specific service descriptions (validated by user research if needed)

2. **Location Deactivation Workflow:** UI will provide "Mark inactive" action (not delete) for locations no longer used

3. **Transfer Detection Timing:** Real-time service layer computation acceptable for MVP volumes (<1000 locations)

4. **Purpose Linking:** Most locations will link to formalized Purpose eventually (progressive enhancement)

5. **Ownership Assignment:** UI will prompt for ownership but not require it (soft validation only)

### Questions for Future Resolution

1. **Service Catalog Evolution:** Monitor `AssetProcessingLocation.service` field for patterns. If 80%+ reuse same values, create Service model with FK

2. **Transfer Detection Performance:** If organizations have >1000 locations, consider materialized view or cached computation

3. **Location Versioning:** Current design uses `isActive` flag. Future: Temporal modeling with effective dates?

4. **Bulk Location Import:** Should DAL provide batch import for assets with many locations? (Defer to performance testing)

---

## Success Criteria

### Technical Success

- [ ] All three models defined in Prisma schema
- [ ] Migrations run successfully in development and production
- [ ] DAL functions provide full CRUD coverage
- [ ] Multi-tenancy isolation verified (org A cannot access org B assets)
- [ ] Junction table pattern matches existing Activity junctions
- [ ] Indexes support performance for expected query patterns
- [ ] Unit tests achieve 90%+ coverage on DAL functions
- [ ] Integration tests verify transaction atomicity

### Functional Success

- [ ] Assets can be created with or without processing locations
- [ ] Processing locations can be added/updated/deactivated post-creation
- [ ] Assets can be linked to activities via junction table
- [ ] Soft validations provide helpful warnings without blocking
- [ ] Geographic compliance queries return accurate data
- [ ] Transfer mechanism tracking enables Article 46 compliance

### Compliance Success

- [ ] GDPR Article 30(1)(d) requirement addressable (location of processing)
- [ ] Cross-border transfer detection foundation in place (completed in Item 15)
- [ ] Audit trail for location changes (completed in Item 16)
- [ ] Transfer mechanism safeguards trackable per location

---

## Documentation Requirements

### Developer Documentation

1. **DAL API Reference:**
   - Function signatures with TypeScript types
   - Usage examples for common patterns
   - Transaction behavior documentation

2. **Schema Documentation:**
   - Field purpose and validation rules
   - Relationship explanations
   - Index rationale

3. **Migration Guide:**
   - How to run migrations
   - Rollback procedures
   - Testing checklist

### Future UI Documentation (Deferred)

- User guide for asset management
- Processing locations best practices
- Transfer mechanism selection guidance

---

## Timeline & Effort Estimate

**Size Estimate:** M (Medium) - 2-3 weeks

**Breakdown:**

**Week 1: Database Schema & DAL (60% effort)**

- Day 1-2: Prisma schema definition, migrations
- Day 3-4: DAL functions (create, read, update, delete)
- Day 5: Junction table operations, validation logic

**Week 2: Testing & tRPC Integration (30% effort)**

- Day 1-2: Unit tests for DAL functions
- Day 3: Integration tests (multi-tenancy, transactions)
- Day 4: tRPC router procedures
- Day 5: Validation schema with Zod

**Week 3: Documentation & Refinement (10% effort)**

- Day 1-2: API documentation, code examples
- Day 3: Schema documentation, migration guide
- Day 4-5: Code review feedback, refinement

**Risks & Contingencies:**

- Foreign key relationship complexity (+1-2 days)
- Performance tuning for indexes (+1 day)
- Unexpected validation edge cases (+1 day)

---

## Final Checklist

**Before Starting Implementation:**

- [x] Read Items 3, 8, 12 (prerequisite models)
- [x] Understand Country.gdprStatus JSON structure
- [x] Review junction table pattern from Item 13
- [x] Understand multi-tenancy filtering requirements
- [x] Review architectural guidance document (README-items-14-16.md)
- [x] All technical decisions documented
- [x] DAL API surface planned (Option B confirmed)
- [x] Test coverage strategy defined
- [x] Size estimate realistic (2-3 weeks)

**Ready for Specification Phase:** ✅

---

**Document Version:** 1.0
**Last Updated:** 2025-12-05
**Requirements Gathered By:** Requirements Research Specialist
**Status:** Complete - Ready for `/write-spec` phase
