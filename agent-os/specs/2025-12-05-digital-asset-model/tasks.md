# Task Breakdown: Digital Asset Model with Processing Locations

**Spec:** Item 14 - Digital Asset & Hosting/Processing Model
**Feature:** Implement database models, DAL functions, validation, and tRPC endpoints for tracking WHERE and HOW personal data is processed across digital assets.

---

## Overview

**Total Estimated Duration:** 10-15 days
**Total Task Groups:** 8 phases
**Complexity:** Medium (M) - Database-heavy with no UI components

**Key Deliverables:**

- 3 Prisma models (DigitalAsset, DataProcessingActivityDigitalAsset, AssetProcessingLocation)
- 2 new enums (AssetType, LocationRole) + 1 extension (IntegrationStatus)
- Complete DAL layer (~15 functions across 3 files)
- Validation layer with soft warnings
- tRPC router with 15+ procedures
- 16 unit tests + 6 integration tests

---

## Task List

### Phase 1: Database Schema & Enums

**Dependencies:** None (prerequisite models from Items 3, 8, 12 already exist)
**Duration:** 2-3 days
**Files:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/schema.prisma`

#### Task 1.1: Define AssetType and IntegrationStatus Enums

**Description:** Add enum definitions at the top of schema.prisma for asset categorization and integration tracking.

**Implementation:**

```prisma
enum AssetType {
  ANALYTICS_PLATFORM
  API
  APPLICATION
  CLOUD_SERVICE
  CRM
  DATABASE
  ERP
  FILE_STORAGE
  MARKETING_TOOL
  ON_PREMISE_SYSTEM
  OTHER
}

enum IntegrationStatus {
  CONNECTED
  FAILED
  MANUAL_ONLY
  NOT_INTEGRATED
  PENDING
}
```

**Acceptance Criteria:**

- [ ] Enums use SCREAMING_SNAKE_CASE
- [ ] Values alphabetically ordered (OTHER last as escape hatch)
- [ ] Comprehensive coverage of common asset types (11 values)
- [ ] Integration status supports future automation (5 states)

**Reference:** spec.md lines 18, 22

---

#### Task 1.2: Define LocationRole Enum

**Description:** Add LocationRole enum for semantic clarity on WHERE assets process data (hosting vs processing).

**Implementation:**

```prisma
enum LocationRole {
  HOSTING      // Servers physically here
  PROCESSING   // Data processed but not stored
  BOTH         // Both hosting and processing
}
```

**Acceptance Criteria:**

- [ ] Three clear semantic values
- [ ] Comments explain distinction between HOSTING and PROCESSING
- [ ] BOTH explicitly captures combined use case

**Reference:** spec.md line 43, requirements-decisions.md lines 206-214

---

#### Task 1.3: Define DigitalAsset Model

**Description:** Create complete DigitalAsset model with organizational scoping, ownership tracking, and metadata fields.

**Implementation:**

```prisma
model DigitalAsset {
  id              String             @id @default(cuid())
  organizationId  String
  name            String
  type            AssetType
  description     String?

  // Display-purpose hosting (distinct from compliance tracking)
  primaryHostingCountryId String?

  // URLs & ownership
  url                 String?
  technicalOwnerId    String?
  businessOwnerId     String?

  // Data classification
  containsPersonalData Boolean           @default(false)
  integrationStatus    IntegrationStatus @default(NOT_INTEGRATED)

  // Discovery metadata
  lastScannedAt DateTime?
  discoveredVia String?

  // Extensibility
  metadata Json?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  organization          Organization                          @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  primaryHostingCountry Country?                              @relation("AssetPrimaryHosting", fields: [primaryHostingCountryId], references: [id], onDelete: SetNull)
  technicalOwner        User?                                 @relation("AssetTechnicalOwner", fields: [technicalOwnerId], references: [id], onDelete: SetNull)
  businessOwner         User?                                 @relation("AssetBusinessOwner", fields: [businessOwnerId], references: [id], onDelete: SetNull)
  activities            DataProcessingActivityDigitalAsset[]
  processingLocations   AssetProcessingLocation[]

  // Indexes for multi-tenancy and performance
  @@index([organizationId])
  @@index([organizationId, containsPersonalData])
  @@index([organizationId, type])
  @@index([organizationId, primaryHostingCountryId])
}
```

**Acceptance Criteria:**

- [ ] organizationId FK with Cascade delete for multi-tenancy
- [ ] Both technicalOwner and businessOwner nullable (optional ownership)
- [ ] primaryHostingCountryId nullable (display purpose, not compliance)
- [ ] containsPersonalData defaults to false
- [ ] integrationStatus defaults to NOT_INTEGRATED
- [ ] 4 compound indexes starting with organizationId
- [ ] Bidirectional relations to activities and processingLocations
- [ ] Two separate User relations with distinct names

**Reference:** spec.md lines 15-24, README-items-14-16.md lines 101-193

---

#### Task 1.4: Define DataProcessingActivityDigitalAsset Junction Table

**Description:** Create junction table linking activities to assets following existing Activity junction pattern from Item 13.

**Implementation:**

```prisma
model DataProcessingActivityDigitalAsset {
  id             String   @id @default(cuid())
  activityId     String
  digitalAssetId String
  createdAt      DateTime @default(now())

  // Relations
  activity     DataProcessingActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  digitalAsset DigitalAsset           @relation(fields: [digitalAssetId], references: [id], onDelete: Restrict)

  // Constraints
  @@unique([activityId, digitalAssetId])
  @@index([activityId])
  @@index([digitalAssetId])
}
```

**Acceptance Criteria:**

- [ ] Separate id field (NOT composite primary key)
- [ ] Unique constraint on (activityId, digitalAssetId) prevents duplicates
- [ ] activityId Cascade delete (junction owned by activity)
- [ ] digitalAssetId Restrict delete (prevent asset deletion if linked)
- [ ] Bidirectional indexes on both FKs
- [ ] createdAt timestamp for audit trail
- [ ] Follows exact pattern from DataProcessingActivityPurpose

**Reference:** spec.md lines 26-34, requirements-decisions.md lines 321-351

---

#### Task 1.5: Define AssetProcessingLocation Model

**Description:** Create child model tracking WHERE and HOW each asset processes data for geographic compliance.

**Implementation:**

```prisma
model AssetProcessingLocation {
  id             String       @id @default(cuid())
  organizationId String
  digitalAssetId String

  // Business context
  service     String        // Free text: "BigQuery analytics", "S3 backup"
  purposeId   String?       // Optional FK to Purpose
  purposeText String?       // Fallback if purpose not formalized

  // Geographic + Compliance
  countryId           String
  locationRole        LocationRole
  transferMechanismId String?

  // Status
  isActive Boolean @default(true)
  metadata Json?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  organization      Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  digitalAsset      DigitalAsset       @relation(fields: [digitalAssetId], references: [id], onDelete: Cascade)
  country           Country            @relation("AssetProcessingCountries", fields: [countryId], references: [id], onDelete: Restrict)
  purpose           Purpose?           @relation(fields: [purposeId], references: [id], onDelete: SetNull)
  transferMechanism TransferMechanism? @relation("AssetTransferMechanisms", fields: [transferMechanismId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([organizationId, digitalAssetId])
  @@index([organizationId, countryId])
  @@index([organizationId, transferMechanismId])
}
```

**Acceptance Criteria:**

- [ ] organizationId FK for multi-tenancy filtering
- [ ] digitalAssetId FK with Cascade delete (child of asset)
- [ ] service is free text (NOT FK - let patterns emerge)
- [ ] purposeId OR purposeText (at least one required via validation)
- [ ] transferMechanismId nullable (validated by service layer)
- [ ] isActive defaults true (deactivate instead of delete)
- [ ] 3 compound indexes for common queries
- [ ] Distinct relation names to avoid Country/TransferMechanism conflicts

**Reference:** spec.md lines 36-47, requirements-decisions.md lines 250-322

---

#### Task 1.6: Create and Apply Migration

**Description:** Generate Prisma migration and apply to development database.

**Commands:**

```bash
cd /Users/frankdevlab/WebstormProjects/compilothq/packages/database
pnpm db:migrate
# Name: "add_digital_asset_models"
pnpm db:generate
pnpm build
```

**Acceptance Criteria:**

- [ ] Migration creates 3 tables + 2 enums
- [ ] All foreign key constraints applied correctly
- [ ] All indexes created successfully
- [ ] Migration runs without errors in development
- [ ] Prisma Client regenerated with new types
- [ ] TypeScript types available in `generated/client/`

**Reference:** spec.md lines 48-52

---

### Phase 2: DAL Layer - Asset Operations

**Dependencies:** Phase 1 (schema + migration)
**Duration:** 2-3 days
**Files:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/dal/digitalAssets.ts` (new)
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/index.ts` (update exports)

#### Task 2.1: Write 2-8 Focused Tests for Asset DAL Functions

**Description:** Create integration tests for digital asset CRUD operations, covering critical behaviors only.

**Test File:** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/dal/digitalAssets.integration.test.ts`

**Test Cases (5 tests maximum):**

1. `createDigitalAsset()` - Basic creation without locations
2. `createDigitalAsset()` - Atomic creation with locations (transaction)
3. `getDigitalAssetById()` - Retrieve with relations included
4. `listDigitalAssets()` - Filter by organizationId and type
5. `updateDigitalAsset()` - Partial updates

**Acceptance Criteria:**

- [ ] Exactly 5 integration tests (focused on critical paths)
- [ ] Tests use factories from `/packages/database/src/test-utils/`
- [ ] Multi-tenancy isolation verified (org A cannot access org B)
- [ ] Transaction atomicity verified (locations creation failure rolls back asset)
- [ ] Tests clean up data in afterAll hooks

**Reference:** spec.md line 112, requirements-decisions.md lines 635-684

---

#### Task 2.2: Implement createDigitalAsset() with Optional Locations (Option B)

**Description:** Single creation function handling both asset-only and asset-with-locations scenarios atomically.

**Implementation Pattern:**

```typescript
export async function createDigitalAsset(data: {
  organizationId: string
  name: string
  type: AssetType
  description?: string
  primaryHostingCountryId?: string
  url?: string
  technicalOwnerId?: string
  businessOwnerId?: string
  containsPersonalData: boolean
  integrationStatus?: IntegrationStatus
  locations?: AssetProcessingLocationInput[]
}): Promise<{
  asset: DigitalAsset
  locations: AssetProcessingLocation[]
}> {
  // Transaction wrapper if locations provided
  if (data.locations && data.locations.length > 0) {
    return await prisma.$transaction(async (tx) => {
      const asset = await tx.digitalAsset.create({ data: {...} })
      const locations = await tx.assetProcessingLocation.createMany({
        data: data.locations.map(loc => ({
          ...loc,
          organizationId: data.organizationId,
          digitalAssetId: asset.id
        }))
      })
      return { asset, locations: await tx.assetProcessingLocation.findMany({
        where: { digitalAssetId: asset.id }
      })}
    })
  }

  // Asset-only creation (no transaction needed)
  const asset = await prisma.digitalAsset.create({ data: {...} })
  return { asset, locations: [] }
}
```

**Acceptance Criteria:**

- [ ] Single function handles both use cases (with/without locations)
- [ ] Prisma transaction ensures atomicity when locations provided
- [ ] Returns both asset and locations array
- [ ] Validates organizationId exists before creation
- [ ] Throws error with rollback if location creation fails
- [ ] Follows Option B pattern from requirements-decisions.md

**Reference:** spec.md lines 56-57, requirements-decisions.md lines 354-450

---

#### Task 2.3: Implement addAssetProcessingLocations()

**Description:** Function for adding locations to existing assets (post-creation).

**Implementation:**

```typescript
export async function addAssetProcessingLocations(
  assetId: string,
  locations: AssetProcessingLocationInput[]
): Promise<AssetProcessingLocation[]> {
  // Verify asset exists
  const asset = await prisma.digitalAsset.findUnique({
    where: { id: assetId },
  })

  if (!asset) {
    throw new Error(`DigitalAsset with id ${assetId} not found`)
  }

  // Create locations
  await prisma.assetProcessingLocation.createMany({
    data: locations.map((loc) => ({
      ...loc,
      organizationId: asset.organizationId,
      digitalAssetId: assetId,
    })),
    skipDuplicates: true,
  })

  // Return created locations
  return prisma.assetProcessingLocation.findMany({
    where: { digitalAssetId: assetId },
  })
}
```

**Acceptance Criteria:**

- [ ] Verifies asset exists before adding locations
- [ ] Automatically inherits organizationId from parent asset
- [ ] skipDuplicates prevents errors on retry
- [ ] Returns all locations for asset (newly created)
- [ ] Throws clear error if asset not found

**Reference:** spec.md line 58

---

#### Task 2.4: Implement getDigitalAssetById() with Optional Includes

**Description:** Retrieve single asset with optional relation loading.

**Implementation:**

```typescript
export async function getDigitalAssetById(
  id: string,
  options?: {
    includeProcessingLocations?: boolean
    includeActivities?: boolean
    includeOwners?: boolean
  }
): Promise<DigitalAsset | null> {
  return prisma.digitalAsset.findUnique({
    where: { id },
    include: {
      processingLocations: options?.includeProcessingLocations
        ? { where: { isActive: true }, include: { country: true, transferMechanism: true } }
        : false,
      activities: options?.includeActivities ? { include: { activity: true } } : false,
      technicalOwner: options?.includeOwners ?? false,
      businessOwner: options?.includeOwners ?? false,
      primaryHostingCountry: true,
    },
  })
}
```

**Acceptance Criteria:**

- [ ] Returns null if not found (no error thrown)
- [ ] Optional includes default to false (performance)
- [ ] processingLocations filtered by isActive: true
- [ ] Includes nested relations when requested (country, activity)
- [ ] Always includes primaryHostingCountry for display

**Reference:** spec.md line 59

---

#### Task 2.5: Implement listDigitalAssets() with Filters

**Description:** List assets for organization with filtering options.

**Implementation:**

```typescript
export async function listDigitalAssets(
  organizationId: string,
  options?: {
    type?: AssetType
    containsPersonalData?: boolean
    primaryHostingCountryId?: string
    includeProcessingLocations?: boolean
  }
): Promise<DigitalAsset[]> {
  return prisma.digitalAsset.findMany({
    where: {
      organizationId,
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.containsPersonalData !== undefined
        ? { containsPersonalData: options.containsPersonalData }
        : {}),
      ...(options?.primaryHostingCountryId
        ? { primaryHostingCountryId: options.primaryHostingCountryId }
        : {}),
    },
    include: {
      processingLocations: options?.includeProcessingLocations
        ? { where: { isActive: true } }
        : false,
      primaryHostingCountry: true,
    },
    orderBy: [{ name: 'asc' }],
  })
}
```

**Acceptance Criteria:**

- [ ] ALWAYS filters by organizationId (multi-tenancy)
- [ ] Optional filters applied conditionally
- [ ] Personal data inventory query supported (containsPersonalData: true)
- [ ] Asset categorization supported (type filter)
- [ ] Geographic distribution supported (primaryHostingCountryId)
- [ ] Results sorted alphabetically by name

**Reference:** spec.md line 60

---

#### Task 2.6: Implement updateDigitalAsset() for Partial Updates

**Description:** Update asset fields (excludes locations - separate functions).

**Implementation:**

```typescript
export async function updateDigitalAsset(
  id: string,
  data: {
    name?: string
    description?: string | null
    type?: AssetType
    primaryHostingCountryId?: string | null
    url?: string | null
    technicalOwnerId?: string | null
    businessOwnerId?: string | null
    containsPersonalData?: boolean
    integrationStatus?: IntegrationStatus
    lastScannedAt?: Date | null
    discoveredVia?: string | null
    metadata?: Record<string, unknown> | null
  }
): Promise<DigitalAsset> {
  return prisma.digitalAsset.update({
    where: { id },
    data,
  })
}
```

**Acceptance Criteria:**

- [ ] Supports partial updates (all fields optional)
- [ ] Nullable fields accept null explicitly
- [ ] Does NOT update organizationId (immutable)
- [ ] Does NOT update locations (use separate location functions)
- [ ] Throws error if asset not found

**Reference:** spec.md line 61

---

#### Task 2.7: Implement deleteDigitalAsset() with Restrict Enforcement

**Description:** Delete asset with safeguard preventing deletion if linked to activities.

**Implementation:**

```typescript
export async function deleteDigitalAsset(id: string): Promise<DigitalAsset> {
  // Check if asset is linked to any activities
  const junctionCount = await prisma.dataProcessingActivityDigitalAsset.count({
    where: { digitalAssetId: id },
  })

  if (junctionCount > 0) {
    throw new Error(
      `Cannot delete DigitalAsset ${id}: linked to ${junctionCount} activities. ` +
        `Unlink from all activities before deletion.`
    )
  }

  // Safe to delete (cascade will delete processingLocations)
  return prisma.digitalAsset.delete({
    where: { id },
  })
}
```

**Acceptance Criteria:**

- [ ] Throws error if asset linked to activities (onDelete: Restrict simulation)
- [ ] Clear error message guides user to unlink first
- [ ] Cascades to processingLocations automatically
- [ ] Returns deleted asset on success
- [ ] Prevents accidental data loss

**Reference:** spec.md line 62, requirements-decisions.md lines 321-351

---

#### Task 2.8: Export Asset DAL Functions from Package Index

**Description:** Update `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/index.ts` to export new functions.

**Additions:**

```typescript
// Digital Asset DAL
export {
  createDigitalAsset,
  addAssetProcessingLocations,
  getDigitalAssetById,
  listDigitalAssets,
  updateDigitalAsset,
  deleteDigitalAsset,
} from './dal/digitalAssets'

// Types
export type { AssetProcessingLocationInput } from './dal/digitalAssets'
```

**Acceptance Criteria:**

- [ ] All 6 asset functions exported
- [ ] AssetProcessingLocationInput type exported
- [ ] Package builds successfully after export
- [ ] Functions importable from `@compilothq/database`

---

#### Task 2.9: Ensure Asset Layer Tests Pass

**Description:** Run ONLY the 5 tests written in Task 2.1 and verify they pass.

**Commands:**

```bash
cd /Users/frankdevlab/WebstormProjects/compilothq/packages/database
pnpm test __tests__/integration/dal/digitalAssets.integration.test.ts
```

**Acceptance Criteria:**

- [ ] All 5 asset DAL tests pass
- [ ] No regressions in existing tests
- [ ] Test execution time < 10 seconds
- [ ] Coverage includes critical CRUD paths

---

### Phase 3: DAL Layer - Location Operations

**Dependencies:** Phase 2 (asset DAL functions)
**Duration:** 1-2 days
**Files:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/dal/assetProcessingLocations.ts` (new)
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/index.ts` (update exports)

#### Task 3.1: Write 2-8 Focused Tests for Location DAL Functions

**Description:** Create integration tests for processing location operations.

**Test File:** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/dal/assetProcessingLocations.integration.test.ts`

**Test Cases (4 tests maximum):**

1. `getActiveLocationsForAsset()` - Filter by isActive: true
2. `updateAssetProcessingLocation()` - Partial updates
3. `deactivateAssetProcessingLocation()` - Set isActive: false (preserve audit)
4. `getLocationsByCountry()` - Geographic compliance queries

**Acceptance Criteria:**

- [ ] Exactly 4 integration tests
- [ ] Historical location preservation verified (deactivate vs delete)
- [ ] Multi-location queries tested
- [ ] isActive filtering verified

**Reference:** spec.md line 113

---

#### Task 3.2: Implement getActiveLocationsForAsset()

**Description:** Retrieve active processing locations for an asset.

**Implementation:**

```typescript
export async function getActiveLocationsForAsset(
  assetId: string
): Promise<AssetProcessingLocation[]> {
  return prisma.assetProcessingLocation.findMany({
    where: {
      digitalAssetId: assetId,
      isActive: true,
    },
    include: {
      country: true,
      transferMechanism: true,
      purpose: true,
    },
    orderBy: [{ createdAt: 'asc' }],
  })
}
```

**Acceptance Criteria:**

- [ ] Only returns isActive: true locations
- [ ] Includes related country, mechanism, purpose
- [ ] Sorted by creation date (chronological)
- [ ] Returns empty array if no active locations

**Reference:** spec.md line 74

---

#### Task 3.3: Implement updateAssetProcessingLocation()

**Description:** Update existing processing location fields.

**Implementation:**

```typescript
export async function updateAssetProcessingLocation(
  id: string,
  data: {
    service?: string
    countryId?: string
    locationRole?: LocationRole
    purposeId?: string | null
    purposeText?: string | null
    transferMechanismId?: string | null
    isActive?: boolean
    metadata?: Record<string, unknown> | null
  }
): Promise<AssetProcessingLocation> {
  return prisma.assetProcessingLocation.update({
    where: { id },
    data,
  })
}
```

**Acceptance Criteria:**

- [ ] Supports partial updates
- [ ] Can update country (critical for compliance)
- [ ] Can update transferMechanism (safeguards)
- [ ] Does NOT update organizationId or digitalAssetId (immutable)

**Reference:** spec.md line 75

---

#### Task 3.4: Implement deactivateAssetProcessingLocation()

**Description:** Deactivate location instead of deleting (preserve audit trail).

**Implementation:**

```typescript
export async function deactivateAssetProcessingLocation(
  id: string
): Promise<AssetProcessingLocation> {
  return prisma.assetProcessingLocation.update({
    where: { id },
    data: { isActive: false },
  })
}
```

**Acceptance Criteria:**

- [ ] Sets isActive to false (does NOT delete)
- [ ] Preserves all data for historical snapshots
- [ ] Returns updated location
- [ ] Deactivated locations excluded from active queries

**Reference:** spec.md line 76, requirements-decisions.md lines 272-300

---

#### Task 3.5: Implement getLocationsByCountry()

**Description:** Geographic compliance query - all processing in specific country.

**Implementation:**

```typescript
export async function getLocationsByCountry(
  organizationId: string,
  countryId: string,
  options?: {
    isActive?: boolean
  }
): Promise<AssetProcessingLocation[]> {
  return prisma.assetProcessingLocation.findMany({
    where: {
      organizationId,
      countryId,
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    },
    include: {
      digitalAsset: true,
      transferMechanism: true,
      purpose: true,
    },
    orderBy: [{ digitalAsset: { name: 'asc' } }],
  })
}
```

**Acceptance Criteria:**

- [ ] ALWAYS filters by organizationId (multi-tenancy)
- [ ] Filters by countryId
- [ ] Optional isActive filter (default: all)
- [ ] Includes asset context for business understanding
- [ ] Sorted by asset name

**Reference:** spec.md line 77

---

#### Task 3.6: Export Location DAL Functions

**Description:** Update index.ts with location function exports.

**Additions:**

```typescript
// Asset Processing Location DAL
export {
  getActiveLocationsForAsset,
  updateAssetProcessingLocation,
  deactivateAssetProcessingLocation,
  getLocationsByCountry,
} from './dal/assetProcessingLocations'
```

**Acceptance Criteria:**

- [ ] All 4 location functions exported
- [ ] Package builds successfully

---

#### Task 3.7: Ensure Location Layer Tests Pass

**Description:** Run ONLY the 4 tests written in Task 3.1.

**Commands:**

```bash
pnpm test __tests__/integration/dal/assetProcessingLocations.integration.test.ts
```

**Acceptance Criteria:**

- [ ] All 4 location tests pass
- [ ] isActive filtering works correctly
- [ ] Geographic queries return accurate results

---

### Phase 4: DAL Layer - Junction Operations

**Dependencies:** Phase 2 (asset DAL)
**Duration:** 1-2 days
**Files:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/dal/dataProcessingActivityJunctions.ts` (update existing)
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/index.ts` (update exports)

#### Task 4.1: Write 2-8 Focused Tests for Junction Operations

**Description:** Create integration tests for activity-asset linking.

**Test File:** `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/dal/activity-asset-junction.integration.test.ts`

**Test Cases (4 tests maximum):**

1. `linkAssetToActivity()` - Create junction with duplicate prevention
2. `unlinkAssetFromActivity()` - Remove junction
3. `syncActivityAssets()` - Atomic bulk sync
4. `getAssetsForActivity()` - Retrieve linked assets

**Acceptance Criteria:**

- [ ] Exactly 4 integration tests
- [ ] Duplicate prevention verified (unique constraint)
- [ ] Transaction atomicity verified (sync operation)
- [ ] Cascade behavior tested (activity deletion)

**Reference:** spec.md line 113

---

#### Task 4.2: Implement linkAssetToActivity()

**Description:** Create junction record linking asset to activity.

**Implementation:**

```typescript
export async function linkAssetToActivity(
  activityId: string,
  organizationId: string,
  digitalAssetId: string
): Promise<void> {
  // Verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Create junction (skipDuplicates makes idempotent)
  await prisma.dataProcessingActivityDigitalAsset.create({
    data: {
      activityId,
      digitalAssetId,
    },
  })
}
```

**Acceptance Criteria:**

- [ ] Validates activity ownership before linking
- [ ] Creates junction record
- [ ] Unique constraint prevents duplicates
- [ ] Throws error if activity not found or wrong org
- [ ] Follows pattern from existing junction functions

**Reference:** spec.md line 66, dataProcessingActivityJunctions.ts pattern

---

#### Task 4.3: Implement unlinkAssetFromActivity()

**Description:** Remove junction record.

**Implementation:**

```typescript
export async function unlinkAssetFromActivity(
  activityId: string,
  organizationId: string,
  digitalAssetId: string
): Promise<void> {
  // Verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Remove junction
  await prisma.dataProcessingActivityDigitalAsset.deleteMany({
    where: {
      activityId,
      digitalAssetId,
    },
  })
}
```

**Acceptance Criteria:**

- [ ] Validates activity ownership
- [ ] Removes junction (idempotent - deleteMany)
- [ ] No error if junction doesn't exist

**Reference:** spec.md line 67

---

#### Task 4.4: Implement syncActivityAssets()

**Description:** Atomic bulk sync - replace all asset links for activity.

**Implementation:**

```typescript
export async function syncActivityAssets(
  activityId: string,
  organizationId: string,
  digitalAssetIds: string[]
): Promise<void> {
  // Verify activity exists and belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Use transaction for atomic operation
  await prisma.$transaction(async (tx) => {
    // Delete existing asset links
    await tx.dataProcessingActivityDigitalAsset.deleteMany({
      where: { activityId },
    })

    // Create new asset links
    if (digitalAssetIds.length > 0) {
      await tx.dataProcessingActivityDigitalAsset.createMany({
        data: digitalAssetIds.map((digitalAssetId) => ({
          activityId,
          digitalAssetId,
        })),
        skipDuplicates: true,
      })
    }
  })
}
```

**Acceptance Criteria:**

- [ ] Transaction ensures atomicity (all-or-nothing)
- [ ] Deletes existing links before creating new ones
- [ ] Supports empty array (remove all links)
- [ ] skipDuplicates for safety
- [ ] Follows exact pattern from syncActivityPurposes()

**Reference:** spec.md line 68

---

#### Task 4.5: Implement getAssetsForActivity()

**Description:** Retrieve all assets linked to activity.

**Implementation:**

```typescript
export async function getAssetsForActivity(
  activityId: string,
  organizationId: string
): Promise<DigitalAsset[]> {
  // Verify activity belongs to organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId, organizationId },
  })

  if (!activity) {
    throw new Error(
      `DataProcessingActivity with id ${activityId} not found or does not belong to organization`
    )
  }

  // Get linked assets
  const junctions = await prisma.dataProcessingActivityDigitalAsset.findMany({
    where: { activityId },
    include: {
      digitalAsset: {
        include: {
          processingLocations: {
            where: { isActive: true },
            include: { country: true, transferMechanism: true },
          },
        },
      },
    },
  })

  return junctions.map((j) => j.digitalAsset)
}
```

**Acceptance Criteria:**

- [ ] Validates activity ownership
- [ ] Includes active processing locations
- [ ] Includes nested country and mechanism data
- [ ] Returns empty array if no assets linked

**Reference:** spec.md line 69

---

#### Task 4.6: Implement getActivitiesForAsset()

**Description:** Retrieve all activities using an asset.

**Implementation:**

```typescript
export async function getActivitiesForAsset(
  digitalAssetId: string
): Promise<DataProcessingActivity[]> {
  const junctions = await prisma.dataProcessingActivityDigitalAsset.findMany({
    where: { digitalAssetId },
    include: {
      activity: true,
    },
  })

  return junctions.map((j) => j.activity)
}
```

**Acceptance Criteria:**

- [ ] Returns all activities using asset
- [ ] Includes full activity data
- [ ] Returns empty array if no links

**Reference:** spec.md line 70

---

#### Task 4.7: Export Junction Functions

**Description:** Add exports to dataProcessingActivityJunctions.ts and index.ts.

**Additions to `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/dal/dataProcessingActivityJunctions.ts`:**

```typescript
export {
  linkAssetToActivity,
  unlinkAssetFromActivity,
  syncActivityAssets,
  getAssetsForActivity,
  getActivitiesForAsset,
}
```

**Additions to index.ts:**

```typescript
export {
  // ... existing exports
  linkAssetToActivity,
  unlinkAssetFromActivity,
  syncActivityAssets,
  getAssetsForActivity,
  getActivitiesForAsset,
} from './dal/dataProcessingActivityJunctions'
```

**Acceptance Criteria:**

- [ ] All 5 junction functions exported
- [ ] Package builds successfully

---

#### Task 4.8: Ensure Junction Layer Tests Pass

**Description:** Run ONLY the 4 tests written in Task 4.1.

**Commands:**

```bash
pnpm test __tests__/integration/dal/activity-asset-junction.integration.test.ts
```

**Acceptance Criteria:**

- [ ] All 4 junction tests pass
- [ ] Duplicate prevention works
- [ ] Sync transaction is atomic

---

### Phase 5: Validation Layer

**Dependencies:** Phases 2-4 (DAL complete)
**Duration:** 1-2 days
**Files:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/validation/src/schemas/digitalAsset.ts` (new)
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/validation/src/index.ts` (update exports)

#### Task 5.1: Write 2-8 Focused Tests for Validation Schemas

**Description:** Create unit tests for Zod schema validation.

**Test File:** `/Users/frankdevlab/WebstormProjects/compilothq/packages/validation/__tests__/digitalAsset.test.ts`

**Test Cases (3 tests maximum):**

1. `DigitalAssetCreateSchema` - Valid data passes
2. `DigitalAssetCreateSchema` - Invalid enum values rejected
3. `AssetProcessingLocationCreateSchema` - purposeId OR purposeText required

**Acceptance Criteria:**

- [ ] Exactly 3 unit tests
- [ ] Enum validation tested
- [ ] Optional fields tested
- [ ] Fast execution (< 1 second)

---

#### Task 5.2: Define DigitalAssetCreateSchema

**Description:** Zod schema for asset creation validation.

**Implementation:**

```typescript
import { z } from 'zod'

export const AssetTypeSchema = z.enum(
  [
    'ANALYTICS_PLATFORM',
    'API',
    'APPLICATION',
    'CLOUD_SERVICE',
    'CRM',
    'DATABASE',
    'ERP',
    'FILE_STORAGE',
    'MARKETING_TOOL',
    'ON_PREMISE_SYSTEM',
    'OTHER',
  ],
  {
    errorMap: () => ({ message: 'Invalid asset type' }),
  }
)

export const IntegrationStatusSchema = z.enum(
  ['CONNECTED', 'FAILED', 'MANUAL_ONLY', 'NOT_INTEGRATED', 'PENDING'],
  {
    errorMap: () => ({ message: 'Invalid integration status' }),
  }
)

export const DigitalAssetCreateSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Asset name is required').max(255),
  type: AssetTypeSchema,
  description: z.string().max(2000).optional().nullable(),

  primaryHostingCountryId: z.string().uuid().optional().nullable(),
  url: z.string().url().optional().nullable(),
  technicalOwnerId: z.string().uuid().optional().nullable(),
  businessOwnerId: z.string().uuid().optional().nullable(),

  containsPersonalData: z.boolean().default(false),
  integrationStatus: IntegrationStatusSchema.default('NOT_INTEGRATED'),

  lastScannedAt: z.date().optional().nullable(),
  discoveredVia: z.string().max(100).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
})

export type DigitalAssetCreateInput = z.infer<typeof DigitalAssetCreateSchema>
```

**Acceptance Criteria:**

- [ ] All required fields validated
- [ ] Enum schemas with error messages
- [ ] UUID validation on FKs
- [ ] URL validation on url field
- [ ] Defaults applied (containsPersonalData: false, integrationStatus: NOT_INTEGRATED)
- [ ] Type export for TypeScript inference

**Reference:** spec.md lines 79-85, requirements-decisions.md lines 155-161

---

#### Task 5.3: Define AssetProcessingLocationCreateSchema

**Description:** Zod schema for processing location creation.

**Implementation:**

```typescript
export const LocationRoleSchema = z.enum(['HOSTING', 'PROCESSING', 'BOTH'], {
  errorMap: () => ({ message: 'Invalid location role' }),
})

export const AssetProcessingLocationCreateSchema = z
  .object({
    organizationId: z.string().uuid(),
    digitalAssetId: z.string().uuid(),

    service: z.string().min(1, 'Service description is required').max(500),
    purposeId: z.string().uuid().optional().nullable(),
    purposeText: z.string().max(500).optional().nullable(),

    countryId: z.string().uuid(),
    locationRole: LocationRoleSchema,
    transferMechanismId: z.string().uuid().optional().nullable(),

    isActive: z.boolean().default(true),
    metadata: z.record(z.unknown()).optional().nullable(),
  })
  .refine((data) => data.purposeId !== null || data.purposeText !== null, {
    message: 'Either purposeId or purposeText must be provided',
    path: ['purposeId'],
  })

export type AssetProcessingLocationCreateInput = z.infer<typeof AssetProcessingLocationCreateSchema>
```

**Acceptance Criteria:**

- [ ] service required (free text, max 500 chars)
- [ ] purposeId OR purposeText required (custom refine)
- [ ] countryId required (UUID)
- [ ] locationRole required (enum)
- [ ] transferMechanismId optional (soft validation later)
- [ ] isActive defaults to true

**Reference:** spec.md lines 79-85, requirements-decisions.md lines 179-193

---

#### Task 5.4: Define Update and Junction Schemas

**Description:** Schemas for update operations and junction table.

**Implementation:**

```typescript
export const DigitalAssetUpdateSchema = DigitalAssetCreateSchema.omit({
  organizationId: true,
}).partial()

export const AssetProcessingLocationUpdateSchema = AssetProcessingLocationCreateSchema.omit({
  organizationId: true,
  digitalAssetId: true,
}).partial()

export const ActivityAssetLinkSchema = z.object({
  activityId: z.string().uuid(),
  digitalAssetId: z.string().uuid(),
})

export const ActivityAssetSyncSchema = z.object({
  activityId: z.string().uuid(),
  digitalAssetIds: z.array(z.string().uuid()),
})
```

**Acceptance Criteria:**

- [ ] Update schemas are partial (all fields optional)
- [ ] organizationId excluded from updates (immutable)
- [ ] Junction schemas validate UUID pairs
- [ ] Sync schema accepts array of asset IDs

---

#### Task 5.5: Export Validation Schemas

**Description:** Update validation package index.

**Additions to `/Users/frankdevlab/WebstormProjects/compilothq/packages/validation/src/index.ts`:**

```typescript
export {
  AssetTypeSchema,
  IntegrationStatusSchema,
  LocationRoleSchema,
  DigitalAssetCreateSchema,
  DigitalAssetUpdateSchema,
  AssetProcessingLocationCreateSchema,
  AssetProcessingLocationUpdateSchema,
  ActivityAssetLinkSchema,
  ActivityAssetSyncSchema,
  type DigitalAssetCreateInput,
  type AssetProcessingLocationCreateInput,
} from './schemas/digitalAsset'
```

**Acceptance Criteria:**

- [ ] All schemas exported
- [ ] Type exports included
- [ ] Package builds successfully

---

#### Task 5.6: Ensure Validation Layer Tests Pass

**Description:** Run ONLY the 3 tests written in Task 5.1.

**Commands:**

```bash
cd /Users/frankdevlab/WebstormProjects/compilothq/packages/validation
pnpm test __tests__/digitalAsset.test.ts
```

**Acceptance Criteria:**

- [ ] All 3 validation tests pass
- [ ] Enum validation works
- [ ] Custom refine logic works (purposeId OR purposeText)

---

### Phase 6: tRPC Router

**Dependencies:** Phases 2-5 (DAL + Validation complete)
**Duration:** 2-3 days
**Files:**

- `/Users/frankdevlab/WebstormProjects/compilothq/apps/web/src/server/routers/digitalAssetRouter.ts` (new)
- `/Users/frankdevlab/WebstormProjects/compilothq/apps/web/src/server/routers/_app.ts` (update to mount router)

#### Task 6.1: Create digitalAssetRouter with Core Procedures

**Description:** Implement tRPC router with 6 core asset procedures.

**Implementation:**

```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import {
  createDigitalAsset,
  getDigitalAssetById,
  listDigitalAssets,
  updateDigitalAsset,
  deleteDigitalAsset,
  AssetTypeSchema,
  DigitalAssetCreateSchema,
  DigitalAssetUpdateSchema,
} from '@compilothq/database'

export const digitalAssetRouter = router({
  // Create asset with optional locations
  create: protectedProcedure
    .input(
      DigitalAssetCreateSchema.extend({
        locations: z.array(AssetProcessingLocationCreateSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await createDigitalAsset({
        ...input,
        organizationId: ctx.organizationId, // Inject from session
      })
      return result
    }),

  // Get single asset by ID
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        includeProcessingLocations: z.boolean().optional(),
        includeActivities: z.boolean().optional(),
        includeOwners: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return getDigitalAssetById(input.id, {
        includeProcessingLocations: input.includeProcessingLocations,
        includeActivities: input.includeActivities,
        includeOwners: input.includeOwners,
      })
    }),

  // List assets with filters
  list: protectedProcedure
    .input(
      z
        .object({
          type: AssetTypeSchema.optional(),
          containsPersonalData: z.boolean().optional(),
          primaryHostingCountryId: z.string().uuid().optional(),
          includeProcessingLocations: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return listDigitalAssets(ctx.organizationId, input)
    }),

  // Update asset
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: DigitalAssetUpdateSchema,
      })
    )
    .mutation(async ({ input }) => {
      return updateDigitalAsset(input.id, input.data)
    }),

  // Delete asset (with safeguard)
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      return deleteDigitalAsset(input.id)
    }),

  // Add locations to existing asset
  addLocations: protectedProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        locations: z.array(AssetProcessingLocationCreateSchema),
      })
    )
    .mutation(async ({ input }) => {
      return addAssetProcessingLocations(input.assetId, input.locations)
    }),
})
```

**Acceptance Criteria:**

- [ ] 6 procedures implemented (create, getById, list, update, delete, addLocations)
- [ ] organizationId injected from ctx (multi-tenancy)
- [ ] Zod schemas used for input validation
- [ ] protectedProcedure ensures authentication
- [ ] Return types properly inferred by tRPC

**Reference:** spec.md lines 95-102

---

#### Task 6.2: Create assetProcessingLocationRouter

**Description:** Implement router for processing location operations.

**Implementation:**

```typescript
import { router, protectedProcedure } from '../trpc'
import {
  getActiveLocationsForAsset,
  updateAssetProcessingLocation,
  deactivateAssetProcessingLocation,
  getLocationsByCountry,
  AssetProcessingLocationUpdateSchema,
} from '@compilothq/database'

export const assetProcessingLocationRouter = router({
  // Get active locations for asset
  listForAsset: protectedProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      return getActiveLocationsForAsset(input.assetId)
    }),

  // Update location
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: AssetProcessingLocationUpdateSchema,
      })
    )
    .mutation(async ({ input }) => {
      return updateAssetProcessingLocation(input.id, input.data)
    }),

  // Deactivate location (preserve audit trail)
  deactivate: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      return deactivateAssetProcessingLocation(input.id)
    }),

  // Get locations by country (compliance query)
  listByCountry: protectedProcedure
    .input(
      z.object({
        countryId: z.string().uuid(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getLocationsByCountry(ctx.organizationId, input.countryId, {
        isActive: input.isActive,
      })
    }),
})
```

**Acceptance Criteria:**

- [ ] 4 procedures implemented
- [ ] organizationId injected for geographic queries
- [ ] Deactivate preserves audit trail (doesn't delete)
- [ ] listByCountry supports compliance queries

**Reference:** spec.md lines 97-98

---

#### Task 6.3: Create activityAssetJunctionRouter

**Description:** Implement router for activity-asset linking operations.

**Implementation:**

```typescript
import { router, protectedProcedure } from '../trpc'
import {
  linkAssetToActivity,
  unlinkAssetFromActivity,
  syncActivityAssets,
  getAssetsForActivity,
  getActivitiesForAsset,
  ActivityAssetLinkSchema,
  ActivityAssetSyncSchema,
} from '@compilothq/database'

export const activityAssetJunctionRouter = router({
  // Link single asset to activity
  link: protectedProcedure.input(ActivityAssetLinkSchema).mutation(async ({ ctx, input }) => {
    await linkAssetToActivity(input.activityId, ctx.organizationId, input.digitalAssetId)
  }),

  // Unlink single asset from activity
  unlink: protectedProcedure.input(ActivityAssetLinkSchema).mutation(async ({ ctx, input }) => {
    await unlinkAssetFromActivity(input.activityId, ctx.organizationId, input.digitalAssetId)
  }),

  // Sync all assets for activity (atomic)
  sync: protectedProcedure.input(ActivityAssetSyncSchema).mutation(async ({ ctx, input }) => {
    await syncActivityAssets(input.activityId, ctx.organizationId, input.digitalAssetIds)
  }),

  // Get assets for activity
  getAssetsForActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getAssetsForActivity(input.activityId, ctx.organizationId)
    }),

  // Get activities for asset
  getActivitiesForAsset: protectedProcedure
    .input(
      z.object({
        digitalAssetId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      return getActivitiesForAsset(input.digitalAssetId)
    }),
})
```

**Acceptance Criteria:**

- [ ] 5 procedures implemented
- [ ] organizationId enforced in all mutations
- [ ] sync procedure uses transaction (atomic)
- [ ] Bidirectional queries supported

**Reference:** spec.md lines 98-99

---

#### Task 6.4: Mount Routers in \_app.ts

**Description:** Register new routers in main tRPC app router.

**Updates to `/Users/frankdevlab/WebstormProjects/compilothq/apps/web/src/server/routers/_app.ts`:**

```typescript
import { digitalAssetRouter } from './digitalAssetRouter'
import { assetProcessingLocationRouter } from './assetProcessingLocationRouter'
import { activityAssetJunctionRouter } from './activityAssetJunctionRouter'

export const appRouter = router({
  // ... existing routers
  digitalAsset: digitalAssetRouter,
  assetProcessingLocation: assetProcessingLocationRouter,
  activityAssetJunction: activityAssetJunctionRouter,
})
```

**Acceptance Criteria:**

- [ ] All 3 routers mounted
- [ ] TypeScript types generated correctly
- [ ] tRPC client autocomplete works
- [ ] Server builds successfully

---

#### Task 6.5: Test tRPC Endpoints Manually

**Description:** Use development environment to verify tRPC procedures work end-to-end.

**Test Checklist:**

- [ ] Create asset via `digitalAsset.create`
- [ ] List assets via `digitalAsset.list`
- [ ] Add locations via `digitalAsset.addLocations`
- [ ] Link asset to activity via `activityAssetJunction.link`
- [ ] Query assets for activity via `activityAssetJunction.getAssetsForActivity`
- [ ] Deactivate location via `assetProcessingLocation.deactivate`
- [ ] Delete asset (should fail if linked) via `digitalAsset.delete`

**Tools:**

- Development authentication (`pnpm dev:login --persona=DPO`)
- Browser DevTools Network tab
- tRPC Panel (if installed)

**Reference:** CLAUDE.md Development Authentication section

---

### Phase 7: Integration Testing & Gap Analysis

**Dependencies:** Phases 1-6 (full implementation)
**Duration:** 2-3 days
**Files:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/` (various test files)

#### Task 7.1: Review Existing Tests from Phases 2-4

**Description:** Verify test coverage from earlier phases.

**Test Count Summary:**

- Phase 2 (Asset DAL): 5 tests
- Phase 3 (Location DAL): 4 tests
- Phase 4 (Junction DAL): 4 tests
- Phase 5 (Validation): 3 tests
- **Total Existing: 16 tests**

**Acceptance Criteria:**

- [ ] All 16 tests pass
- [ ] No flaky tests (run 3 times)
- [ ] Test execution time < 30 seconds total

---

#### Task 7.2: Analyze Critical Test Coverage Gaps

**Description:** Identify gaps in test coverage for THIS feature only (Digital Asset models).

**Gap Analysis Focus:**

- [ ] Transaction rollback scenarios (location creation failure)
- [ ] Multi-tenancy isolation edge cases
- [ ] Cascade delete behavior (organization → assets → locations)
- [ ] Restrict delete enforcement (asset linked to activities)
- [ ] isActive filtering correctness
- [ ] Junction table unique constraint enforcement

**Deliverable:** List of 3-5 critical gaps requiring additional tests.

**Acceptance Criteria:**

- [ ] Focus ONLY on Digital Asset feature requirements
- [ ] Do NOT assess entire application test coverage
- [ ] Prioritize integration points and data integrity
- [ ] Document gaps in task notes

**Reference:** spec.md line 113

---

#### Task 7.3: Write Maximum 10 Additional Strategic Tests

**Description:** Fill identified critical gaps with targeted integration tests.

**Test File Locations:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/digital-asset-integrity.test.ts` (new)
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/digital-asset-cascade.test.ts` (new)

**Maximum Test Cases (10 total across files):**

1. Transaction rollback when location FK invalid (countryId)
2. Organization cascade delete removes all assets
3. Asset cascade delete removes all locations
4. Asset delete blocked when linked to activity (Restrict)
5. Multi-tenancy: Org A cannot query Org B assets
6. isActive filtering excludes deactivated locations
7. Junction unique constraint prevents duplicate links
8. Sync operation atomic (partial success rolls back)
9. Personal data consistency warning (containsPersonalData without locations)
10. Transfer mechanism validation (third country without mechanism)

**Acceptance Criteria:**

- [ ] Maximum 10 additional tests written
- [ ] Tests cover critical data integrity scenarios
- [ ] Tests cover end-to-end workflows
- [ ] Do NOT write comprehensive edge case coverage
- [ ] All tests use factories for data setup
- [ ] All tests clean up data in afterAll

**Reference:** spec.md line 113

---

#### Task 7.4: Run Complete Feature Test Suite

**Description:** Execute all Digital Asset related tests (existing 16 + new maximum 10).

**Commands:**

```bash
cd /Users/frankdevlab/WebstormProjects/compilothq/packages/database

# Run all Digital Asset tests
pnpm test:integration -- digitalAssets
pnpm test:integration -- assetProcessingLocations
pnpm test:integration -- activity-asset-junction
pnpm test:integration -- digital-asset-integrity
pnpm test:integration -- digital-asset-cascade

# Run validation tests
cd ../validation
pnpm test -- digitalAsset
```

**Acceptance Criteria:**

- [ ] Total tests: 16-26 (existing + gap-fill)
- [ ] 100% pass rate
- [ ] Test execution time < 60 seconds
- [ ] No database connection leaks
- [ ] Test data cleaned up properly

---

### Phase 8: Documentation & Review

**Dependencies:** Phases 1-7 (complete implementation + testing)
**Duration:** 1-2 days
**Files:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/README.md` (update)
- `/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-12-05-digital-asset-model/IMPLEMENTATION.md` (new)

#### Task 8.1: Document DAL API Reference

**Description:** Create developer documentation for all DAL functions.

**Documentation Structure:**

````markdown
# Digital Asset DAL API Reference

## Asset Operations

### createDigitalAsset(data)

Creates digital asset with optional processing locations atomically.

**Parameters:**

- `data.organizationId` (string, required) - Organization UUID
- `data.name` (string, required) - Asset name
- `data.type` (AssetType, required) - Asset category
- `data.locations` (AssetProcessingLocationInput[], optional) - Initial locations

**Returns:** `Promise<{ asset: DigitalAsset, locations: AssetProcessingLocation[] }>`

**Transaction:** Uses Prisma transaction if locations provided (atomic creation).

**Example:**

```typescript
const { asset, locations } = await createDigitalAsset({
  organizationId: 'org-123',
  name: 'Google Cloud',
  type: 'CLOUD_SERVICE',
  containsPersonalData: true,
  locations: [
    {
      service: 'BigQuery analytics',
      countryId: 'US',
      locationRole: 'BOTH',
      transferMechanismId: 'scc-id',
    },
  ],
})
```
````

[... continue for all 15 DAL functions ...]

````

**Acceptance Criteria:**
- [ ] All 15 DAL functions documented
- [ ] Function signatures with TypeScript types
- [ ] Parameter descriptions
- [ ] Return type documentation
- [ ] Transaction behavior noted
- [ ] Usage examples for common patterns
- [ ] Multi-tenancy security notes

---

#### Task 8.2: Document Schema Design Decisions

**Description:** Create schema documentation explaining model relationships and constraints.

**Documentation Topics:**
- Enum design rationale (AssetType values, LocationRole semantics)
- primaryHostingCountryId vs processingLocations distinction
- Junction table cascade rules (Restrict vs Cascade)
- isActive flag for historical preservation
- service field as free text (future evolution to catalog)
- purposeId vs purposeText fallback pattern

**Acceptance Criteria:**
- [ ] Field purpose explanations
- [ ] Relationship diagrams (optional ASCII art)
- [ ] Index rationale
- [ ] Cascade rule explanations
- [ ] Design evolution notes (future improvements)

---

#### Task 8.3: Document Migration Procedures

**Description:** Create guide for running migrations in different environments.

**Documentation Structure:**
```markdown
# Digital Asset Migration Guide

## Local Development
```bash
cd packages/database
pnpm db:migrate
# Migration name: "add_digital_asset_models"
pnpm db:generate
pnpm build
````

## Testing

```bash
# Test database uses .env.test automatically
pnpm test:integration
```

## Staging/Production

```bash
# Verify migration SQL first
cat prisma/migrations/*/migration.sql

# Apply with backup
pg_dump compilothq_production > backup.sql
pnpm db:migrate deploy

# Rollback if needed
psql compilothq_production < backup.sql
```

## Verification Checklist

- [ ] All 3 tables created
- [ ] All indexes present
- [ ] Foreign keys enforced
- [ ] Enums defined
- [ ] Existing data unaffected (no breaking changes)

````

**Acceptance Criteria:**
- [ ] Step-by-step migration instructions
- [ ] Environment-specific guidance
- [ ] Rollback procedures
- [ ] Verification checklist

---

#### Task 8.4: Create Implementation Summary

**Description:** Document what was implemented and what's next.

**File:** `/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-12-05-digital-asset-model/IMPLEMENTATION.md`

**Content Structure:**
```markdown
# Implementation Summary: Digital Asset Model

## What Was Implemented

### Database Layer (Item 14)
- ✅ DigitalAsset model (16 fields, 4 indexes)
- ✅ DataProcessingActivityDigitalAsset junction table
- ✅ AssetProcessingLocation model (14 fields, 3 indexes)
- ✅ AssetType enum (11 values)
- ✅ LocationRole enum (3 values)
- ✅ IntegrationStatus enum (5 values)

### DAL Layer
- ✅ 6 asset operations (create, get, list, update, delete, addLocations)
- ✅ 4 location operations (getActive, update, deactivate, getByCountry)
- ✅ 5 junction operations (link, unlink, sync, getAssets, getActivities)
- ✅ Total: 15 DAL functions

### Validation Layer
- ✅ 6 Zod schemas (create, update, junction)
- ✅ Enum schemas with error messages
- ✅ Custom validation refinements (purposeId OR purposeText)

### API Layer
- ✅ digitalAssetRouter (6 procedures)
- ✅ assetProcessingLocationRouter (4 procedures)
- ✅ activityAssetJunctionRouter (5 procedures)
- ✅ Total: 15 tRPC procedures

### Testing
- ✅ 16 integration tests (DAL + validation)
- ✅ 10 additional strategic tests (integrity + cascades)
- ✅ Total: 26 tests
- ✅ Coverage: Critical paths and data integrity

## What's Next (Out of Scope)

### Item 15: Recipient Processing Locations
- RecipientProcessingLocation model (parallel to AssetProcessingLocation)
- Service layer: detectCrossBorderTransfers()
- Sub-processor chain traversal

### Item 16: Component Change Tracking
- Extend ComponentChangeLog enum
- Prisma middleware for location changes
- AffectedDocument linking

### Future UI Components
- Digital Asset management interface
- Processing locations map visualization
- Cross-border transfer compliance dashboard

## Files Modified

### Packages
- `packages/database/prisma/schema.prisma` - Added 3 models + 2 enums
- `packages/database/src/dal/digitalAssets.ts` - NEW (6 functions)
- `packages/database/src/dal/assetProcessingLocations.ts` - NEW (4 functions)
- `packages/database/src/dal/dataProcessingActivityJunctions.ts` - UPDATED (+5 functions)
- `packages/database/src/index.ts` - UPDATED (exports)
- `packages/validation/src/schemas/digitalAsset.ts` - NEW (6 schemas)
- `packages/validation/src/index.ts` - UPDATED (exports)

### Apps
- `apps/web/src/server/routers/digitalAssetRouter.ts` - NEW (6 procedures)
- `apps/web/src/server/routers/assetProcessingLocationRouter.ts` - NEW (4 procedures)
- `apps/web/src/server/routers/activityAssetJunctionRouter.ts` - NEW (5 procedures)
- `apps/web/src/server/routers/_app.ts` - UPDATED (mount routers)

### Tests
- 5 new test files
- 26 total tests

## Key Design Decisions

1. **Option B DAL API:** Single `createDigitalAsset()` with optional locations array
2. **Free Text Service Field:** Let patterns emerge before creating Service catalog
3. **isActive Flag:** Deactivate locations instead of deletion (audit trail)
4. **Asymmetric Cascade:** Activity deletion cascades, asset deletion restricted
5. **Display vs Compliance:** primaryHostingCountryId (display) vs processingLocations (compliance)

## Performance Notes

- 4 compound indexes on DigitalAsset (all start with organizationId)
- 3 compound indexes on AssetProcessingLocation
- 2 bidirectional indexes on junction table
- Expected query performance: <100ms for list operations with <1000 assets

## Compliance Coverage

- ✅ GDPR Article 30(1)(d) - Location of processing trackable
- ✅ Transfer mechanism safeguards linkable per location
- ✅ Geographic compliance queries enabled
- ⏳ Cross-border transfer detection (Item 15 - service layer)
- ⏳ Audit trail for location changes (Item 16 - change tracking)
````

**Acceptance Criteria:**

- [ ] Complete inventory of deliverables
- [ ] File modification list
- [ ] Design decision rationale
- [ ] Next steps clearly outlined
- [ ] Compliance coverage documented

---

#### Task 8.5: Final Code Review & Cleanup

**Description:** Review all code for consistency, remove debug code, verify patterns.

**Review Checklist:**

- [ ] All functions have JSDoc comments
- [ ] Multi-tenancy filtering present in all DAL functions
- [ ] Error messages are clear and actionable
- [ ] No console.log or debug code
- [ ] TypeScript strict mode passes
- [ ] ESLint warnings resolved
- [ ] Prettier formatting applied
- [ ] Unused imports removed
- [ ] File structure matches conventions

**Commands:**

```bash
# Lint check
pnpm lint

# Type check
pnpm type-check

# Format code
pnpm format

# Build all packages
pnpm build
```

**Acceptance Criteria:**

- [ ] Zero linting errors
- [ ] Zero TypeScript errors
- [ ] Code formatted consistently
- [ ] All packages build successfully

---

## Execution Order Summary

**Recommended Sequence:**

1. Phase 1: Database Schema (2-3 days) - Foundation
2. Phase 2: Asset DAL (2-3 days) - Core operations
3. Phase 3: Location DAL (1-2 days) - Child model operations
4. Phase 4: Junction DAL (1-2 days) - Relationship operations
5. Phase 5: Validation (1-2 days) - Input validation
6. Phase 6: tRPC Router (2-3 days) - API layer
7. Phase 7: Integration Testing (2-3 days) - Gap analysis & coverage
8. Phase 8: Documentation (1-2 days) - Developer guides

**Total Duration:** 12-20 days (2-4 weeks depending on complexity)

**Critical Path:**

- Phase 1 → Phase 2 → Phase 6 (schema → DAL → API)
- Phases 3-4 can overlap with Phase 2
- Phase 5 can start after Phase 2 completes
- Phase 7 requires Phases 1-6 complete

---

## Success Criteria

### Technical Success

- [ ] All 3 models in schema with correct relationships
- [ ] All 15 DAL functions implemented and tested
- [ ] All 15 tRPC procedures working end-to-end
- [ ] 26 tests passing (16 core + 10 gap-fill maximum)
- [ ] Multi-tenancy isolation verified
- [ ] Transaction atomicity verified
- [ ] Zero TypeScript/ESLint errors

### Functional Success

- [ ] Assets can be created with or without locations
- [ ] Locations can be added/updated/deactivated post-creation
- [ ] Assets can be linked to activities via junction table
- [ ] Restrict constraint prevents asset deletion if linked
- [ ] Geographic compliance queries return accurate data
- [ ] Historical locations preserved (isActive flag)

### Compliance Success

- [ ] GDPR Article 30(1)(d) addressable (location tracking)
- [ ] Transfer mechanism safeguards trackable per location
- [ ] Audit trail foundation in place (isActive timestamps)
- [ ] Multi-location queries support compliance reports

---

## Notes

**Testing Philosophy:**

- Limit tests during development (2-8 per phase)
- Focus on critical behaviors, not exhaustive coverage
- Run ONLY newly written tests during phase verification
- Gap analysis phase adds maximum 10 strategic tests
- Total feature tests: 16-26 tests (not entire application suite)

**Multi-Tenancy Security:**

- ALL DAL queries MUST filter by organizationId
- tRPC context provides ctx.organizationId from session
- Never trust client-provided organizationId
- Compound indexes start with organizationId for performance

**Transaction Boundaries:**

- createDigitalAsset with locations uses Prisma transaction
- syncActivityAssets uses transaction for atomicity
- Individual operations (update, delete) do not need transactions

**Future Extensions:**

- Item 15 adds RecipientProcessingLocation (parallel model)
- Item 16 adds ComponentChangeLog extensions
- Service catalog may evolve if 80%+ reuse service names
- Materialized views for transfer detection if >1000 locations

---

**Document Version:** 1.0
**Created:** 2025-12-05
**Spec Reference:** `/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-12-05-digital-asset-model/spec.md`
**Requirements Reference:** `/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-12-05-digital-asset-model/planning/requirements-decisions.md`
