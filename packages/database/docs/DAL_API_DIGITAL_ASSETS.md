# Digital Asset DAL API Reference

Complete reference for all Digital Asset Data Access Layer (DAL) functions.

## Overview

The Digital Asset DAL provides 15 functions across 3 modules:

- **Asset Operations** (6 functions) - Core CRUD for digital assets
- **Location Operations** (4 functions) - Processing location management
- **Junction Operations** (5 functions) - Activity-asset linking

All functions enforce multi-tenancy and follow consistent error handling patterns.

---

## Asset Operations

### createDigitalAsset()

Creates digital asset with optional processing locations atomically.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function createDigitalAsset(data: {
  organizationId: string
  name: string
  type: AssetType
  description?: string | null
  primaryHostingCountryId?: string | null
  url?: string | null
  technicalOwnerId?: string | null
  businessOwnerId?: string | null
  containsPersonalData: boolean
  integrationStatus?: IntegrationStatus
  lastScannedAt?: Date | null
  discoveredVia?: string | null
  metadata?: Record<string, unknown> | null
  locations?: AssetProcessingLocationInput[]
}): Promise<{
  asset: DigitalAsset
  locations: AssetProcessingLocation[]
}>
```

**Parameters:**

- `data.organizationId` (string, required) - Organization UUID for multi-tenancy
- `data.name` (string, required) - Human-readable asset name
- `data.type` (AssetType, required) - Asset category (DATABASE, API, CLOUD_SERVICE, etc.)
- `data.description` (string, optional) - Detailed description of the asset
- `data.primaryHostingCountryId` (string, optional) - Primary country for display (distinct from compliance locations)
- `data.url` (string, optional) - Asset URL or endpoint
- `data.technicalOwnerId` (string, optional) - User ID of technical owner
- `data.businessOwnerId` (string, optional) - User ID of business owner
- `data.containsPersonalData` (boolean, required) - Personal data inventory flag
- `data.integrationStatus` (IntegrationStatus, optional) - Integration readiness status (defaults to NOT_INTEGRATED)
- `data.lastScannedAt` (Date, optional) - Last automated scan timestamp
- `data.discoveredVia` (string, optional) - Discovery method for audit trail
- `data.metadata` (JSON, optional) - Extensibility field for edge cases
- `data.locations` (array, optional) - Initial processing locations to create atomically

**Returns:** Object with `asset` and `locations` array

**Transaction Behavior:**

- If `locations` provided: Uses Prisma transaction to ensure atomic creation (all-or-nothing)
- If `locations` empty/omitted: No transaction needed (single INSERT)
- Rollback on failure: If location creation fails, asset creation is rolled back

**Security:**

- Requires valid `organizationId` reference
- All locations automatically inherit `organizationId` from asset

**Examples:**

```typescript
// Create asset without locations
const { asset, locations } = await createDigitalAsset({
  organizationId: 'org-123',
  name: 'Google Analytics',
  type: 'ANALYTICS_PLATFORM',
  containsPersonalData: true,
  url: 'https://analytics.google.com',
})
console.log(`Created ${asset.name} with ${locations.length} locations`)

// Create asset with locations atomically
const { asset, locations } = await createDigitalAsset({
  organizationId: 'org-123',
  name: 'AWS S3',
  type: 'FILE_STORAGE',
  containsPersonalData: true,
  locations: [
    {
      service: 'S3 bucket - us-east-1',
      countryId: 'us-id',
      locationRole: 'HOSTING',
      purposeText: 'Backup storage',
    },
    {
      service: 'S3 bucket - eu-west-1',
      countryId: 'ie-id',
      locationRole: 'HOSTING',
      transferMechanismId: 'scc-id',
      purposeText: 'EU data residency',
    },
  ],
})
```

---

### addAssetProcessingLocations()

Add processing locations to existing digital asset.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function addAssetProcessingLocations(
  assetId: string,
  locations: AssetProcessingLocationInput[]
): Promise<AssetProcessingLocation[]>
```

**Parameters:**

- `assetId` (string, required) - Existing asset UUID
- `locations` (array, required) - Array of location data to create

**Returns:** All locations for the asset (including newly created)

**Security:**

- Verifies asset exists before adding locations
- Automatically inherits `organizationId` from parent asset
- Uses `skipDuplicates` for idempotent operation

**Error Handling:**

- Throws `Error` if asset not found

**Example:**

```typescript
await addAssetProcessingLocations('asset-123', [
  {
    service: 'EU backup server',
    countryId: 'de-id',
    locationRole: 'HOSTING',
    purposeText: 'GDPR compliance backup',
  },
])
```

---

### getDigitalAssetById()

Retrieve single digital asset by ID with optional relation loading.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function getDigitalAssetById(
  id: string,
  options?: {
    includeProcessingLocations?: boolean
    includeActivities?: boolean
    includeOwners?: boolean
  }
): Promise<DigitalAsset | null>
```

**Parameters:**

- `id` (string, required) - Asset UUID
- `options.includeProcessingLocations` (boolean, optional) - Include active locations with country & mechanism
- `options.includeActivities` (boolean, optional) - Include linked activities via junction
- `options.includeOwners` (boolean, optional) - Include technical & business owner user records

**Returns:** Asset object or `null` if not found (no error thrown)

**Behavior:**

- `processingLocations` filtered by `isActive: true` (excludes deactivated)
- `primaryHostingCountry` always included for display
- Nested relations loaded based on options

**Example:**

```typescript
// Get asset with all relations
const asset = await getDigitalAssetById('asset-123', {
  includeProcessingLocations: true,
  includeActivities: true,
  includeOwners: true,
})

if (!asset) {
  console.log('Asset not found')
} else {
  console.log(`${asset.name} has ${asset.processingLocations?.length} active locations`)
}
```

---

### listDigitalAssets()

List digital assets for organization with filtering options.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function listDigitalAssets(
  organizationId: string,
  options?: {
    type?: AssetType
    containsPersonalData?: boolean
    primaryHostingCountryId?: string
    includeProcessingLocations?: boolean
  }
): Promise<DigitalAsset[]>
```

**Parameters:**

- `organizationId` (string, required) - Organization UUID for multi-tenancy
- `options.type` (AssetType, optional) - Filter by asset category
- `options.containsPersonalData` (boolean, optional) - Filter personal data inventory
- `options.primaryHostingCountryId` (string, optional) - Filter by primary hosting country
- `options.includeProcessingLocations` (boolean, optional) - Include active locations

**Returns:** Array of assets (empty if none match filters)

**Security:**

- ALWAYS filters by `organizationId` (prevents cross-tenant access)
- Optional filters applied conditionally

**Performance:**

- Uses compound index `(organizationId, type)` when type filter applied
- Uses compound index `(organizationId, containsPersonalData)` for inventory queries
- Results sorted alphabetically by name

**Example:**

```typescript
// Get personal data inventory
const personalDataAssets = await listDigitalAssets('org-123', {
  containsPersonalData: true,
  includeProcessingLocations: true,
})

// Get all databases
const databases = await listDigitalAssets('org-123', {
  type: 'DATABASE',
})

// Get all US-hosted assets
const usAssets = await listDigitalAssets('org-123', {
  primaryHostingCountryId: 'us-id',
})
```

---

### updateDigitalAsset()

Update digital asset fields (partial update).

**Module:** `@compilothq/database`

**Signature:**

```typescript
function updateDigitalAsset(
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
): Promise<DigitalAsset>
```

**Parameters:**

- `id` (string, required) - Asset UUID to update
- `data` (object, all fields optional) - Fields to update

**Behavior:**

- Supports partial updates (all fields optional)
- Nullable fields accept explicit `null` to clear values
- Does NOT update `organizationId` (immutable)
- Does NOT update locations (use separate location functions)

**Error Handling:**

- Throws error if asset not found

**Example:**

```typescript
await updateDigitalAsset('asset-123', {
  name: 'Updated Asset Name',
  integrationStatus: 'CONNECTED',
  lastScannedAt: new Date(),
})
```

---

### deleteDigitalAsset()

Delete digital asset with safeguard preventing deletion if linked to activities.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function deleteDigitalAsset(id: string): Promise<DigitalAsset>
```

**Parameters:**

- `id` (string, required) - Asset UUID to delete

**Returns:** Deleted asset object

**Cascade Behavior:**

- Automatically deletes all `processingLocations` (CASCADE)
- Blocks deletion if linked to activities (RESTRICT simulation)

**Error Handling:**

- Throws `Error` if asset linked to any activities
- Error message includes count and guidance to unlink first

**Security:**

- Prevents accidental data loss
- Ensures referential integrity

**Example:**

```typescript
try {
  await deleteDigitalAsset('asset-123')
} catch (error) {
  // Error: Cannot delete DigitalAsset asset-123: linked to 3 activities.
  // Unlink from all activities before deletion.
  console.error(error.message)
}
```

---

## Location Operations

### getActiveLocationsForAsset()

Get active processing locations for a digital asset.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function getActiveLocationsForAsset(assetId: string): Promise<AssetProcessingLocation[]>
```

**Parameters:**

- `assetId` (string, required) - Asset UUID

**Returns:** Array of active locations with nested country, transferMechanism, purpose (empty if none)

**Behavior:**

- Only returns `isActive: true` locations (excludes deactivated)
- Includes related country, transferMechanism, purpose data
- Sorted chronologically by creation date (oldest first)

**Example:**

```typescript
const activeLocations = await getActiveLocationsForAsset('asset-123')
console.log(`Found ${activeLocations.length} active processing locations`)

activeLocations.forEach((loc) => {
  console.log(`${loc.service} in ${loc.country.name} (${loc.locationRole})`)
})
```

---

### updateAssetProcessingLocation()

Update existing asset processing location.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function updateAssetProcessingLocation(
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
): Promise<AssetProcessingLocation>
```

**Parameters:**

- `id` (string, required) - Location UUID to update
- `data` (object, all fields optional) - Fields to update

**Behavior:**

- Supports partial updates
- Nullable fields accept explicit `null` to clear values
- Does NOT update `organizationId` or `digitalAssetId` (immutable)

**Critical Use Cases:**

- Update `countryId` when location changes (compliance impact)
- Update `transferMechanismId` when safeguards added/removed
- Set `isActive: false` to deactivate (prefer `deactivateAssetProcessingLocation()`)

**Example:**

```typescript
await updateAssetProcessingLocation('location-123', {
  service: 'Updated service description',
  transferMechanismId: 'new-mechanism-id',
})
```

---

### deactivateAssetProcessingLocation()

Deactivate asset processing location (soft delete for audit trail).

**Module:** `@compilothq/database`

**Signature:**

```typescript
function deactivateAssetProcessingLocation(id: string): Promise<AssetProcessingLocation>
```

**Parameters:**

- `id` (string, required) - Location UUID to deactivate

**Returns:** Deactivated location object

**Behavior:**

- Sets `isActive: false` (does NOT delete record)
- Preserves all data for historical compliance snapshots
- Deactivated locations excluded from `getActiveLocationsForAsset()`

**Use Case:**

- Location changes (deactivate old, create new) preserves audit trail
- Compliance documentation can reference historical locations

**Example:**

```typescript
// Preserve audit trail when location changes
await deactivateAssetProcessingLocation('old-location-id')
await addAssetProcessingLocations('asset-123', [
  {
    service: 'New location',
    countryId: 'new-country-id',
    locationRole: 'HOSTING',
    purposeText: 'Migrated to new region',
  },
])
```

---

### getLocationsByCountry()

Get all processing locations in a specific country for an organization.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function getLocationsByCountry(
  organizationId: string,
  countryId: string,
  options?: {
    isActive?: boolean
  }
): Promise<AssetProcessingLocation[]>
```

**Parameters:**

- `organizationId` (string, required) - Organization UUID for multi-tenancy
- `countryId` (string, required) - Country UUID to filter by
- `options.isActive` (boolean, optional) - Filter by active status (default: all)

**Returns:** Array of locations with nested digitalAsset, transferMechanism, purpose

**Security:**

- ALWAYS filters by `organizationId` (multi-tenancy)
- Uses compound index `(organizationId, countryId)` for performance

**Use Cases:**

- Geographic compliance queries ("Show all processing in US")
- Transfer mechanism auditing ("Which US locations lack SCCs?")
- Data residency validation

**Example:**

```typescript
// Get all active US processing locations
const usLocations = await getLocationsByCountry('org-123', 'us-id', {
  isActive: true,
})

// Check for third-country transfers without safeguards
usLocations.forEach((loc) => {
  if (!loc.transferMechanismId) {
    console.warn(`${loc.digitalAsset.name} in US without transfer mechanism`)
  }
})
```

---

## Junction Operations

### linkAssetToActivity()

Create junction record linking asset to activity.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function linkAssetToActivity(
  activityId: string,
  organizationId: string,
  digitalAssetId: string
): Promise<void>
```

**Parameters:**

- `activityId` (string, required) - Activity UUID
- `organizationId` (string, required) - Organization UUID for validation
- `digitalAssetId` (string, required) - Asset UUID

**Returns:** `void` (no return value)

**Security:**

- Validates activity ownership before linking
- Unique constraint prevents duplicate links
- Idempotent operation (no error if already linked)

**Error Handling:**

- Throws `Error` if activity not found or doesn't belong to organization

**Example:**

```typescript
await linkAssetToActivity('activity-123', 'org-123', 'asset-456')
```

---

### unlinkAssetFromActivity()

Remove junction record (unlink asset from activity).

**Module:** `@compilothq/database`

**Signature:**

```typescript
function unlinkAssetFromActivity(
  activityId: string,
  organizationId: string,
  digitalAssetId: string
): Promise<void>
```

**Parameters:**

- `activityId` (string, required) - Activity UUID
- `organizationId` (string, required) - Organization UUID for validation
- `digitalAssetId` (string, required) - Asset UUID

**Returns:** `void`

**Behavior:**

- Idempotent (no error if junction doesn't exist)
- Uses `deleteMany` for safety

**Example:**

```typescript
await unlinkAssetFromActivity('activity-123', 'org-123', 'asset-456')
```

---

### syncActivityAssets()

Atomic bulk sync - replace all asset links for activity.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function syncActivityAssets(
  activityId: string,
  organizationId: string,
  digitalAssetIds: string[]
): Promise<void>
```

**Parameters:**

- `activityId` (string, required) - Activity UUID
- `organizationId` (string, required) - Organization UUID for validation
- `digitalAssetIds` (array, required) - Asset UUIDs to link (empty array removes all)

**Returns:** `void`

**Transaction Behavior:**

- Uses Prisma transaction for atomicity
- Deletes all existing links, then creates new ones
- All-or-nothing: Partial success rolls back
- Supports empty array (remove all links)

**Use Case:**

- Form submissions replacing entire asset list
- Bulk updates from API

**Example:**

```typescript
// Replace all asset links
await syncActivityAssets('activity-123', 'org-123', ['asset-1', 'asset-2', 'asset-3'])

// Remove all asset links
await syncActivityAssets('activity-123', 'org-123', [])
```

---

### getAssetsForActivity()

Retrieve all assets linked to activity.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function getAssetsForActivity(activityId: string, organizationId: string): Promise<DigitalAsset[]>
```

**Parameters:**

- `activityId` (string, required) - Activity UUID
- `organizationId` (string, required) - Organization UUID for validation

**Returns:** Array of assets with nested active processingLocations

**Behavior:**

- Validates activity ownership
- Includes active processing locations for each asset
- Includes nested country and transferMechanism data

**Example:**

```typescript
const assets = await getAssetsForActivity('activity-123', 'org-123')
console.log(`Activity uses ${assets.length} digital assets`)

assets.forEach((asset) => {
  console.log(`- ${asset.name} (${asset.type})`)
})
```

---

### getActivitiesForAsset()

Retrieve all activities using an asset.

**Module:** `@compilothq/database`

**Signature:**

```typescript
function getActivitiesForAsset(digitalAssetId: string): Promise<DataProcessingActivity[]>
```

**Parameters:**

- `digitalAssetId` (string, required) - Asset UUID

**Returns:** Array of activities using the asset

**Use Case:**

- Impact analysis ("Which activities affected if asset decommissioned?")
- Compliance reporting

**Example:**

```typescript
const activities = await getActivitiesForAsset('asset-123')
console.log(`Asset used by ${activities.length} activities`)
```

---

## Type Definitions

### AssetProcessingLocationInput

Input type for creating processing locations.

```typescript
type AssetProcessingLocationInput = {
  service: string // Free text service description
  countryId: string // Country UUID
  locationRole: LocationRole // HOSTING | PROCESSING | BOTH
  purposeId?: string | null // Optional purpose FK
  purposeText?: string | null // Fallback if purpose not formalized
  transferMechanismId?: string | null // Optional transfer safeguard FK
  isActive?: boolean // Defaults to true
  metadata?: Record<string, unknown> | null
}
```

**Validation:**

- At least one of `purposeId` or `purposeText` must be provided (enforced by service layer)

---

## Enums

### AssetType

```typescript
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
```

### IntegrationStatus

```typescript
enum IntegrationStatus {
  CONNECTED          // Automated integration active
  FAILED            // Integration attempted but failed
  MANUAL_ONLY       // No automation, manual tracking
  NOT_INTEGRATED    // Default - not configured
  PENDING           // Integration in progress
}
```

### LocationRole

```typescript
enum LocationRole {
  HOSTING      // Servers physically hosted here
  PROCESSING   // Data processed but not stored
  BOTH         // Both hosting and processing
}
```

---

## Security & Multi-Tenancy

**Critical Security Rules:**

1. **Always Filter by organizationId**: All list/query functions enforce multi-tenancy
2. **Validate Ownership**: Junction functions validate activity ownership before operations
3. **Inherit organizationId**: Child records (locations) inherit from parent (asset)
4. **Never Trust Client**: organizationId comes from session context, not client input

**Multi-Tenancy Patterns:**

```typescript
// GOOD - organizationId from session
const assets = await listDigitalAssets(ctx.organizationId, filters)

// BAD - organizationId from client input (NEVER DO THIS)
const assets = await listDigitalAssets(input.organizationId, filters)
```

---

## Error Handling

**Common Errors:**

| Error                                                                              | Cause                        | Solution                              |
| ---------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------- |
| "DigitalAsset with id {id} not found"                                              | Asset doesn't exist          | Check ID validity                     |
| "Cannot delete DigitalAsset {id}: linked to {n} activities"                        | Asset in use                 | Unlink from activities first          |
| "DataProcessingActivity with id {id} not found or does not belong to organization" | Activity ownership violation | Verify organizationId matches session |

**Error Patterns:**

- DAL functions throw errors for not found (except `getDigitalAssetById` returns null)
- Transaction failures automatically rollback
- Constraint violations surface as Prisma errors

---

## Transaction Boundaries

**Functions Using Transactions:**

1. `createDigitalAsset()` - When locations provided
2. `syncActivityAssets()` - Always (atomic bulk operation)

**Why No Transaction for Others:**

- Single operations (update, delete) are inherently atomic
- Read operations don't need transactions
- Reduces connection pool overhead

---

## Performance Notes

**Indexes Used:**

- `(organizationId)` - Tenant isolation
- `(organizationId, type)` - Asset categorization queries
- `(organizationId, containsPersonalData)` - Personal data inventory
- `(organizationId, primaryHostingCountryId)` - Geographic distribution
- `(organizationId, countryId)` - Location compliance queries
- `(activityId)`, `(digitalAssetId)` - Junction bidirectional lookups

**Query Optimization:**

- List operations use compound indexes starting with `organizationId`
- Relation includes are optional (performance optimization)
- Active location filtering reduces result set size

---

## Migration Guide

**Adding New Fields:**

1. Update Prisma schema
2. Run `pnpm db:migrate`
3. Update DAL function signatures
4. Update validation schemas
5. Update tRPC routers

**Backward Compatibility:**

- Optional fields maintain backward compatibility
- Required fields need migration strategy (defaults, data backfill)

---

## Testing Recommendations

**DAL Integration Tests:**

```typescript
describe('createDigitalAsset()', () => {
  it('should create asset without locations', async () => {
    const { asset, locations } = await createDigitalAsset({
      organizationId: testOrg.id,
      name: 'Test Asset',
      type: 'DATABASE',
      containsPersonalData: true,
    })
    expect(asset.name).toBe('Test Asset')
    expect(locations).toHaveLength(0)
  })

  it('should create asset with locations atomically', async () => {
    const { asset, locations } = await createDigitalAsset({
      organizationId: testOrg.id,
      name: 'Test Asset',
      type: 'DATABASE',
      containsPersonalData: true,
      locations: [
        {
          service: 'Test service',
          countryId: testCountry.id,
          locationRole: 'HOSTING',
          purposeText: 'Test',
        },
      ],
    })
    expect(locations).toHaveLength(1)
  })
})
```

---

## See Also

- [Schema Design Decisions](./SCHEMA_DESIGN_DECISIONS.md)
- [Migration Procedures](./MIGRATION_PROCEDURES.md)
- [Implementation Summary](/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-12-05-digital-asset-model/IMPLEMENTATION.md)
