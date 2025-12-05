# Implementation Guidance: Roadmap Items 14-16

## Processing Locations Architecture

## Overview

Items 14-16 implement the **processing locations architecture** for geographic compliance tracking and cross-border transfer management in accordance with GDPR Article 30(1)(d) and Article 49 requirements.

**Core Architectural Decision:** Processing locations are properties of entities (assets, recipients). Cross-border transfers are **derived** via service layer composition, not stored as database entities.

## Critical Prerequisites

Before writing specs for Items 14-16, ensure understanding of:

### 1. Item 3 (Foundation Reference Models)

**Country Model:**

```prisma
model Country {
  id String @id
  name String
  isoCode String @unique
  gdprStatus Json  // Array: ["EU"], ["EEA"], ["Third Country"], ["Adequate"]
}
```

**Usage Pattern:**

```typescript
// Check if country is third country
const country = await prisma.country.findUnique({ where: { id: countryId } })
const gdprStatus = country.gdprStatus as string[]
const isThirdCountry =
  !gdprStatus.includes('EU') && !gdprStatus.includes('EEA') && !gdprStatus.includes('Adequate')
```

**TransferMechanism Model:**

```prisma
model TransferMechanism {
  id String @id
  code String @unique  // "SCC", "BCR", "DPF", etc.
  name String
  category TransferMechanismCategory  // ADEQUACY, SAFEGUARD, DEROGATION
  gdprArticle String  // "Article 46(2)(c)", "Article 49(1)(a)", etc.
}
```

### 2. Item 8 (DataProcessingActivity)

**Junction Table Pattern:**

- All Activity relationships via junction tables (not direct FKs)
- Pattern: `DataProcessingActivity{Purpose|DataSubject|DataCategory|Recipient}`
- Unique constraint on `(activityId, entityId)`
- Bidirectional indexes on both FKs

**Multi-Tenancy Filtering:**

- All queries MUST include `where: { organizationId }`
- Compound indexes start with `organizationId`
- Session context provides `ctx.organizationId`

### 3. Item 12 (Recipient Model)

**Hierarchy Pattern:**

```prisma
model Recipient {
  id String @id
  parentRecipientId String?  // Self-referential FK
  hierarchyType HierarchyType?  // PROCESSOR_CHAIN for sub-processors

  parentRecipient Recipient? @relation("RecipientHierarchy", ...)
  children Recipient[] @relation("RecipientHierarchy")
}
```

**ExternalOrganization Relationship:**

- `Recipient.externalOrganizationId` → `ExternalOrganization`
- `ExternalOrganization.headquartersCountryId` → `Country` (legal seat, NOT processing location)

### 4. Item 4 (Multi-Tenancy)

**Security Patterns:**

- All models have `organizationId` FK with `onDelete: Cascade`
- All queries filter by `organizationId` from session context
- Compound indexes: `(organizationId, ...otherFields)`

---

## Model Specifications

### DigitalAsset (Item 14)

**Purpose:** Track systems, tools, and platforms that process personal data.

**Complete Prisma Schema:**

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

enum IntegrationStatus {
  CONNECTED
  PENDING
  FAILED
  NOT_INTEGRATED
  MANUAL_ONLY
}

model DigitalAsset {
  id              String             @id @default(cuid())
  organizationId  String
  name            String
  type            AssetType
  description     String?

  // Hosting metadata (PRIMARY location for display, not all processing locations)
  primaryHostingCountryId String?
  hostingDetail           String?    // "eu-west-1", "US East (N. Virginia)", etc.

  // URLs & ownership
  url                 String?
  technicalOwnerId    String?
  businessOwnerId     String?

  // Data classification
  containsPersonalData Boolean           @default(false)
  integrationStatus    IntegrationStatus @default(NOT_INTEGRATED)

  // Discovery metadata
  lastScannedAt DateTime?
  discoveredVia String?           // "manual", "salesforce", "aws-discovery"

  // Extensibility
  metadata Json?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  organization          Organization                          @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  primaryHostingCountry Country?                              @relation(fields: [primaryHostingCountryId], references: [id], onDelete: SetNull)
  technicalOwner        User?                                 @relation("AssetTechnicalOwner", fields: [technicalOwnerId], references: [id], onDelete: SetNull)
  businessOwner         User?                                 @relation("AssetBusinessOwner", fields: [businessOwnerId], references: [id], onDelete: SetNull)
  activities            DataProcessingActivityDigitalAsset[]
  processingLocations   AssetProcessingLocation[]

  // Indexes
  @@index([organizationId])
  @@index([organizationId, containsPersonalData])
  @@index([organizationId, type])
  @@index([organizationId, primaryHostingCountryId])
}
```

**Validation Rules:**

1. **containsPersonalData Consistency:**
   - If `containsPersonalData = true`, SHOULD have at least one `processingLocation`
   - Soft warning (not hard constraint) - allow edge case where asset defined before locations

2. **Integration Status:**
   - If `integrationStatus = CONNECTED`, `lastScannedAt` should be recent (< 7 days)
   - Validation in service layer, not DB constraint

3. **Ownership:**
   - `technicalOwnerId` and `businessOwnerId` CAN be the same user (acceptable pattern)
   - Both can be null (legacy assets or undefined ownership)

**Index Rationale:**

- `(organizationId)` — Required for multi-tenant isolation, used in ALL queries
- `(organizationId, containsPersonalData)` — Personal data inventory queries: "Show all assets containing personal data"
- `(organizationId, type)` — Asset categorization: "Show all CRM systems"
- `(organizationId, primaryHostingCountryId)` — Geographic distribution analysis: "Show all assets hosted in US"

---

### DataProcessingActivityDigitalAsset Junction (Item 14)

**Purpose:** Link activities to assets (many-to-many).

**Complete Prisma Schema:**

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

**Cascade Rules:**

- `activityId onDelete: Cascade` — Delete junction when activity deleted
- `digitalAssetId onDelete: Restrict` — Prevent asset deletion if linked to activities (data integrity)

**Query Patterns:**

```typescript
// Get all assets for an activity
const activity = await prisma.dataProcessingActivity.findUnique({
  where: { id: activityId },
  include: {
    digitalAssets: {
      include: { digitalAsset: true },
    },
  },
})

// Get all activities using an asset
const asset = await prisma.digitalAsset.findUnique({
  where: { id: assetId },
  include: {
    activities: {
      include: { activity: true },
    },
  },
})
```

---

### AssetProcessingLocation (Item 14)

**Purpose:** Track WHERE and HOW a specific asset processes data, with geographic and compliance context.

**Complete Prisma Schema:**

```prisma
enum LocationRole {
  HOSTING      // Primary hosting location (servers physically here)
  PROCESSING   // Additional processing region (data processed but not stored)
  BOTH         // Both hosting and processing occur here
}

model AssetProcessingLocation {
  id             String       @id @default(cuid())
  organizationId String
  digitalAssetId String

  // Business context
  service     String        // "BigQuery analytics", "S3 backup storage", "Redis caching"
  purposeId   String?       // Optional FK to Purpose
  purposeText String?       // Fallback free text if purpose not formalized

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
  country           Country            @relation(fields: [countryId], references: [id], onDelete: Restrict)
  purpose           Purpose?           @relation(fields: [purposeId], references: [id], onDelete: SetNull)
  transferMechanism TransferMechanism? @relation(fields: [transferMechanismId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([organizationId, digitalAssetId])
  @@index([organizationId, countryId])
  @@index([organizationId, transferMechanismId])
}
```

**Business Rules:**

1. **transferMechanismId Requirement:**
   - NULL if processing within same legal framework (e.g., both EU countries)
   - REQUIRED if `countryId` is third country without adequacy decision
   - Validation in service layer using `Country.gdprStatus` JSON

2. **isActive Flag:**
   - `false` for historical locations (DON'T delete, preserve audit trail)
   - Only `isActive = true` locations included in compliance queries
   - Historical locations queryable for document regeneration snapshots

3. **service Field:**
   - Free text initially (e.g., "BigQuery analytics", "Email delivery via SendGrid")
   - May evolve to service catalog FK if patterns emerge
   - Keep specific: "Email sending" not just "Email"

**Index Rationale:**

- `(organizationId, digitalAssetId)` — Get all locations for an asset: "Where does Google Cloud process data?"
- `(organizationId, countryId)` — Geographic compliance: "Show all processing in United States"
- `(organizationId, transferMechanismId)` — Mechanism auditing: "Show all locations using Standard Contractual Clauses"

---

### RecipientProcessingLocation (Item 15)

**Purpose:** Track WHERE a recipient/processor processes data (parallel to AssetProcessingLocation).

**Complete Prisma Schema:**

```prisma
model RecipientProcessingLocation {
  id             String       @id @default(cuid())
  organizationId String
  recipientId    String

  // Business context (identical to AssetProcessingLocation)
  service     String
  purposeId   String?
  purposeText String?

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
  recipient         Recipient          @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  country           Country            @relation(fields: [countryId], references: [id], onDelete: Restrict)
  purpose           Purpose?           @relation(fields: [purposeId], references: [id], onDelete: SetNull)
  transferMechanism TransferMechanism? @relation(fields: [transferMechanismId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([organizationId, recipientId])
  @@index([organizationId, countryId])
  @@index([organizationId, transferMechanismId])
}
```

**Business Rules:** (Same as AssetProcessingLocation)

**Sub-Processor Chain Support:**

```typescript
// Get all locations in a sub-processor chain
const recipient = await prisma.recipient.findUnique({
  where: { id: recipientId },
  include: {
    processingLocations: {
      where: { isActive: true },
      include: { country: true, transferMechanism: true },
    },
    parentRecipient: {
      include: {
        processingLocations: {
          where: { isActive: true },
          include: { country: true, transferMechanism: true },
        },
        parentRecipient: {
          include: {
            processingLocations: {
              where: { isActive: true },
              include: { country: true },
            },
          },
        },
      },
    },
  },
})

// Flatten all locations in chain
const allLocations = [
  ...recipient.processingLocations,
  ...(recipient.parentRecipient?.processingLocations || []),
  ...(recipient.parentRecipient?.parentRecipient?.processingLocations || []),
]
```

---

## Service Layer: Transfer Detection (Item 15)

### Core Function: detectCrossBorderTransfers

```typescript
export interface CrossBorderTransfer {
  type: 'ASSET' | 'RECIPIENT'
  originCountry: Country
  destinationCountry: Country
  mechanism: TransferMechanism | null
  hasValidMechanism: boolean
  isThirdCountry: boolean
  requiresSafeguards: boolean

  // Context for UI
  assetLocation?: AssetProcessingLocation & { digitalAsset: DigitalAsset }
  recipientLocation?: RecipientProcessingLocation & { recipient: Recipient }
  activities: DataProcessingActivity[]
}

export async function detectCrossBorderTransfers(
  organizationId: string
): Promise<CrossBorderTransfer[]> {
  // 1. Get organization's primary country
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { country: true },
  })

  if (!org || !org.country) {
    throw new Error('Organization must have a country set')
  }

  // 2. Get all active processing locations (assets + recipients)
  const assetLocations = await prisma.assetProcessingLocation.findMany({
    where: { organizationId, isActive: true },
    include: {
      country: true,
      transferMechanism: true,
      digitalAsset: {
        include: {
          activities: {
            include: { activity: true },
          },
        },
      },
    },
  })

  const recipientLocations = await prisma.recipientProcessingLocation.findMany({
    where: { organizationId, isActive: true },
    include: {
      country: true,
      transferMechanism: true,
      recipient: {
        include: {
          activities: {
            include: { activity: true },
          },
        },
      },
    },
  })

  // 3. Detect cross-border transfers
  const transfers: CrossBorderTransfer[] = []

  // Process asset locations
  for (const loc of assetLocations) {
    if (!isSameJurisdiction(org.country, loc.country)) {
      transfers.push({
        type: 'ASSET',
        originCountry: org.country,
        destinationCountry: loc.country,
        mechanism: loc.transferMechanism,
        hasValidMechanism: loc.transferMechanismId !== null,
        isThirdCountry: isThirdCountry(loc.country),
        requiresSafeguards: requiresSafeguards(org.country, loc.country),
        assetLocation: loc,
        activities: loc.digitalAsset.activities.map((a) => a.activity),
      })
    }
  }

  // Process recipient locations
  for (const loc of recipientLocations) {
    if (!isSameJurisdiction(org.country, loc.country)) {
      transfers.push({
        type: 'RECIPIENT',
        originCountry: org.country,
        destinationCountry: loc.country,
        mechanism: loc.transferMechanism,
        hasValidMechanism: loc.transferMechanismId !== null,
        isThirdCountry: isThirdCountry(loc.country),
        requiresSafeguards: requiresSafeguards(org.country, loc.country),
        recipientLocation: loc,
        activities: loc.recipient.activities.map((a) => a.activity),
      })
    }
  }

  return transfers
}
```

### Helper Functions

```typescript
// Check if two countries are in same legal framework (no cross-border transfer)
function isSameJurisdiction(country1: Country, country2: Country): boolean {
  const c1Status = country1.gdprStatus as string[]
  const c2Status = country2.gdprStatus as string[]

  // Both in EU → same jurisdiction
  if (c1Status.includes('EU') && c2Status.includes('EU')) return true

  // Both in EEA → same jurisdiction
  if (c1Status.includes('EEA') && c2Status.includes('EEA')) return true

  return false
}

// Check if country is third country (outside EU/EEA without adequacy)
function isThirdCountry(country: Country): boolean {
  const status = country.gdprStatus as string[]
  return !status.includes('EU') && !status.includes('EEA') && !status.includes('Adequate')
}

// Determine if transfer requires safeguards (Article 46)
function requiresSafeguards(origin: Country, destination: Country): boolean {
  const destStatus = destination.gdprStatus as string[]

  // If destination has adequacy decision, no additional safeguards needed
  if (destStatus.includes('Adequate')) return false

  // Origin must be EU/EEA for GDPR safeguard requirements to apply
  const originStatus = origin.gdprStatus as string[]
  const originIsEU = originStatus.includes('EU') || originStatus.includes('EEA')

  if (!originIsEU) return false // Non-EU origin, GDPR doesn't apply

  // If destination is third country, safeguards required
  return isThirdCountry(destination)
}
```

### Activity-Level Transfer Analysis

```typescript
export interface ActivityTransferAnalysis {
  activityId: string
  activityName: string
  orgCountry: Country
  assetLocations: (AssetProcessingLocation & {
    country: Country
    transferMechanism: TransferMechanism | null
    digitalAsset: DigitalAsset
  })[]
  recipientLocations: (RecipientProcessingLocation & {
    country: Country
    transferMechanism: TransferMechanism | null
    recipient: Recipient
  })[]
  crossBorderDetected: boolean
  locationsWithoutMechanism: (AssetProcessingLocation | RecipientProcessingLocation)[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export async function getActivityTransferAnalysis(
  activityId: string
): Promise<ActivityTransferAnalysis> {
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId },
    include: {
      organization: { include: { country: true } },
      digitalAssets: {
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
      },
      recipients: {
        include: {
          recipient: {
            include: {
              processingLocations: {
                where: { isActive: true },
                include: { country: true, transferMechanism: true },
              },
            },
          },
        },
      },
    },
  })

  if (!activity) {
    throw new Error(`Activity ${activityId} not found`)
  }

  // Extract all locations
  const assetLocations = activity.digitalAssets.flatMap((a) =>
    a.digitalAsset.processingLocations.map((loc) => ({
      ...loc,
      digitalAsset: a.digitalAsset,
    }))
  )

  const recipientLocations = activity.recipients.flatMap((r) =>
    r.recipient.processingLocations.map((loc) => ({
      ...loc,
      recipient: r.recipient,
    }))
  )

  const allLocations = [...assetLocations, ...recipientLocations]

  // Detect cross-border locations
  const crossBorderLocations = allLocations.filter(
    (loc) => !isSameJurisdiction(activity.organization.country, loc.country)
  )

  // Find locations without valid mechanisms (high risk)
  const locationsWithoutMechanism = crossBorderLocations.filter(
    (loc) =>
      requiresSafeguards(activity.organization.country, loc.country) &&
      loc.transferMechanismId === null
  )

  // Calculate risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'

  if (locationsWithoutMechanism.length > 0) {
    riskLevel = 'HIGH' // Cross-border without mechanism = high risk
  } else if (crossBorderLocations.length > 5) {
    riskLevel = 'MEDIUM' // Many cross-border locations = medium risk
  } else if (crossBorderLocations.length > 0) {
    riskLevel = 'MEDIUM' // Some cross-border = medium risk
  }

  return {
    activityId: activity.id,
    activityName: activity.name,
    orgCountry: activity.organization.country,
    assetLocations,
    recipientLocations,
    crossBorderDetected: crossBorderLocations.length > 0,
    locationsWithoutMechanism,
    riskLevel,
  }
}
```

---

## Component Change Tracking (Item 16)

### Extended ComponentType Enum

```typescript
// Extend existing enum
type ComponentType =
  | 'Vendor' // Existing
  | 'Purpose' // Existing
  | 'DataCategory' // Existing
  | 'LegalBasis' // Existing
  | 'Recipient' // Existing
  | 'DataSubject' // Existing
  | 'DigitalAsset' // NEW (Item 14)
  | 'AssetProcessingLocation' // NEW (Item 14)
  | 'RecipientProcessingLocation' // NEW (Item 15)
```

### Prisma Middleware for Location Changes

```typescript
// Middleware intercepts location updates and creates change log entries
export function setupLocationChangeTracking() {
  prisma.$use(async (params, next) => {
    // Only track AssetProcessingLocation and RecipientProcessingLocation
    if (
      params.model === 'AssetProcessingLocation' ||
      params.model === 'RecipientProcessingLocation'
    ) {
      if (params.action === 'update' || params.action === 'updateMany') {
        // 1. Capture before state
        const before = await prisma[params.model].findUnique({
          where: params.args.where,
          include: { country: true, transferMechanism: true },
        })

        // 2. Execute update
        const result = await next(params)

        // 3. Capture after state
        const after = await prisma[params.model].findUnique({
          where: params.args.where,
          include: { country: true, transferMechanism: true },
        })

        // 4. Detect critical changes (country or mechanism)
        const criticalFieldsChanged =
          before.countryId !== after.countryId ||
          before.transferMechanismId !== after.transferMechanismId

        // 5. Create change log entry
        await prisma.componentChangeLog.create({
          data: {
            componentType: params.model,
            componentId: after.id,
            changedAt: new Date(),
            changedBy: ctx.userId, // From session context
            changeType: 'UPDATED',
            fieldChanged: criticalFieldsChanged
              ? before.countryId !== after.countryId
                ? 'countryId'
                : 'transferMechanismId'
              : null,
            oldValue: JSON.stringify({
              countryId: before.countryId,
              countryName: before.country.name,
              transferMechanismId: before.transferMechanismId,
              transferMechanismName: before.transferMechanism?.name,
            }),
            newValue: JSON.stringify({
              countryId: after.countryId,
              countryName: after.country.name,
              transferMechanismId: after.transferMechanismId,
              transferMechanismName: after.transferMechanism?.name,
            }),
            changeReason: ctx.changeReason || null, // Optional from request
          },
        })

        // 6. If critical fields changed, mark affected documents
        if (criticalFieldsChanged) {
          await markAffectedDocuments(params.model, after.id, {
            changeType:
              before.countryId !== after.countryId ? 'COUNTRY_CHANGED' : 'MECHANISM_CHANGED',
            oldCountry: before.country.name,
            newCountry: after.country.name,
          })
        }

        return result
      }
    }

    // Pass through for other operations
    return next(params)
  })
}
```

### Affected Document Tracking

```typescript
async function markAffectedDocuments(
  locationModel: 'AssetProcessingLocation' | 'RecipientProcessingLocation',
  locationId: string,
  changeDetails: {
    changeType: 'COUNTRY_CHANGED' | 'MECHANISM_CHANGED'
    oldCountry: string
    newCountry: string
  }
) {
  // 1. Find all activities using this location
  let affectedActivities: string[] = []

  if (locationModel === 'AssetProcessingLocation') {
    const location = await prisma.assetProcessingLocation.findUnique({
      where: { id: locationId },
      include: {
        digitalAsset: {
          include: {
            activities: {
              include: { activity: true },
            },
          },
        },
      },
    })
    affectedActivities = location.digitalAsset.activities.map((a) => a.activityId)
  } else {
    const location = await prisma.recipientProcessingLocation.findUnique({
      where: { id: locationId },
      include: {
        recipient: {
          include: {
            activities: {
              include: { activity: true },
            },
          },
        },
      },
    })
    affectedActivities = location.recipient.activities.map((a) => a.activityId)
  }

  // 2. Find all documents (DPIAs, RoPA) for those activities
  const affectedDocuments = await prisma.generatedDocument.findMany({
    where: {
      documentType: { in: ['DPIA', 'ROPA', 'DPA'] },
      dataProcessingActivityId: { in: affectedActivities },
    },
  })

  // 3. Create AffectedDocument entries
  const changeLog = await prisma.componentChangeLog.findFirst({
    where: { componentId: locationId },
    orderBy: { changedAt: 'desc' },
  })

  for (const doc of affectedDocuments) {
    await prisma.affectedDocument.create({
      data: {
        documentId: doc.id,
        changeLogId: changeLog.id,
        impact:
          changeDetails.changeType === 'COUNTRY_CHANGED'
            ? 'TRANSFER_SECTION_OUTDATED'
            : 'MECHANISM_SECTION_OUTDATED',
        message:
          changeDetails.changeType === 'COUNTRY_CHANGED'
            ? `Processing location changed from ${changeDetails.oldCountry} to ${changeDetails.newCountry}. Transfer analysis may need update.`
            : `Transfer mechanism updated. Review safeguards section.`,
      },
    })
  }
}
```

---

## Testing Strategy

### Unit Tests (DAL Functions)

```typescript
describe('Transfer Detection Logic', () => {
  it('should detect EU org → US location as cross-border', () => {
    const orgCountry = { gdprStatus: ['EU'] }
    const locationCountry = { gdprStatus: ['Third Country'] }
    expect(isSameJurisdiction(orgCountry, locationCountry)).toBe(false)
  })

  it('should NOT detect EU org → EEA location as cross-border', () => {
    const orgCountry = { gdprStatus: ['EU'] }
    const locationCountry = { gdprStatus: ['EEA'] }
    expect(isSameJurisdiction(orgCountry, locationCountry)).toBe(true)
  })

  it('should flag third country without mechanism as high risk', () => {
    const orgCountry = { gdprStatus: ['EU'] }
    const locationCountry = { gdprStatus: ['Third Country'] }
    expect(requiresSafeguards(orgCountry, locationCountry)).toBe(true)
  })

  it('should NOT require safeguards for adequate countries', () => {
    const orgCountry = { gdprStatus: ['EU'] }
    const locationCountry = { gdprStatus: ['Third Country', 'Adequate'] }
    expect(requiresSafeguards(orgCountry, locationCountry)).toBe(false)
  })
})
```

### Integration Tests (Full Stack)

```typescript
describe('Activity Transfer Analysis', () => {
  it('should detect cross-border flows for multi-region assets', async () => {
    // Setup: Create EU organization
    const org = await createTestOrganization({
      countryId: euCountryId,
    })

    // Create activity
    const activity = await createTestActivity({
      organizationId: org.id,
    })

    // Create asset with US and EU locations
    const asset = await createTestDigitalAsset({
      organizationId: org.id,
      name: 'Google Cloud',
    })

    await createTestAssetProcessingLocation({
      digitalAssetId: asset.id,
      countryId: usCountryId, // US location
      service: 'BigQuery analytics',
      transferMechanismId: sccMechanismId,
    })

    await createTestAssetProcessingLocation({
      digitalAssetId: asset.id,
      countryId: euCountryId, // EU location
      service: 'Cloud Storage',
    })

    // Link asset to activity
    await linkAssetToActivity(activity.id, asset.id)

    // Test: Get transfer analysis
    const analysis = await getActivityTransferAnalysis(activity.id)

    // Verify
    expect(analysis.crossBorderDetected).toBe(true)
    expect(analysis.assetLocations).toHaveLength(2)
    expect(analysis.locationsWithoutMechanism).toHaveLength(0) // US has SCC
    expect(analysis.riskLevel).toBe('MEDIUM')
  })
})
```

---

## Common Pitfalls to Avoid

### ❌ Don't create DataTransfer model

Transfers are **derived**, not stored. Service layer computes them from processing locations.

### ❌ Don't use ISO strings for countries

Always use `countryId → Country` FK. Never store `"US"` or `"DE"` as strings.

### ❌ Don't skip transferMechanismId validation

Enforce non-null for third countries requiring safeguards (Article 46).

### ❌ Don't forget sub-processor chains

`RecipientProcessingLocation` must traverse `Recipient.parentRecipient` hierarchy.

### ❌ Don't ignore isActive flag

Historical locations should be:

- Queryable for document snapshot regeneration
- Excluded from current compliance queries (`where: { isActive: true }`)

### ❌ Don't duplicate location data

- `DigitalAsset.primaryHostingCountryId` is for **display** ("hosted in US")
- `AssetProcessingLocation` records are for **compliance** (all processing regions)

---

## Document Generation Integration (Future Items 35-38)

### Snapshot Requirements

When generating DPIA (Item 38), snapshot must include:

```json
{
  "processingLocations": {
    "assets": [
      {
        "assetId": "asset_123",
        "assetName": "Google BigQuery",
        "assetType": "DATABASE",
        "service": "Analytics data warehouse",
        "country": {
          "id": "country_456",
          "name": "United States",
          "isoCode": "US"
        },
        "locationRole": "BOTH",
        "transferMechanism": {
          "id": "mech_789",
          "code": "SCC",
          "name": "Standard Contractual Clauses (SCCs)",
          "gdprArticle": "Article 46(2)(c)"
        },
        "snapshotAt": "2025-01-15T10:30:00Z"
      }
    ],
    "recipients": [
      {
        "recipientId": "recipient_321",
        "recipientName": "Mailchimp (Processor)",
        "service": "Email marketing platform",
        "country": {
          "id": "country_456",
          "name": "United States",
          "isoCode": "US"
        },
        "locationRole": "BOTH",
        "transferMechanism": {
          "id": "mech_654",
          "code": "DPF",
          "name": "EU-U.S. Data Privacy Framework",
          "gdprArticle": "Article 45(3)"
        },
        "snapshotAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Regeneration Trigger (Item 45)

When `RecipientProcessingLocation.countryId` changes:

```typescript
// 1. ComponentChangeLog entry created (Item 16 middleware)

// 2. Find all activities using this recipient
const changedLocation = await prisma.recipientProcessingLocation.findUnique({
  where: { id: locationId },
  include: {
    recipient: {
      include: {
        activities: {
          include: { activity: true },
        },
      },
    },
  },
})

const affectedActivities = changedLocation.recipient.activities.map((a) => a.activity)

// 3. Find all DPIAs for those activities
const affectedDPIAs = await prisma.generatedDocument.findMany({
  where: {
    documentType: 'DPIA',
    dataProcessingActivityId: { in: affectedActivities.map((a) => a.id) },
  },
})

// 4. Mark documents as "potentially outdated"
for (const dpia of affectedDPIAs) {
  await prisma.affectedDocument.create({
    data: {
      documentId: dpia.id,
      changeLogId: changeLog.id,
      impact: 'TRANSFER_SECTION_OUTDATED',
      message: `${changedLocation.recipient.name} processing location changed from ${oldCountry.name} to ${newCountry.name}. Cross-border transfer analysis may require regeneration.`,
    },
  })
}

// 5. Notify user via UI banner or email
await notifyDocumentOwner(dpia.id, {
  type: 'LOCATION_CHANGED',
  affectedSections: ['International Transfers', 'Processor Locations'],
  severity: 'MEDIUM',
})
```

---

## Migration Strategy

### Item 14: No Existing Data

- `DigitalAsset` is entirely new model
- `AssetProcessingLocation` is new child model
- No backward compatibility concerns
- No data migration required

### Item 15: No Existing Recipient.processingLocations

- `RecipientProcessingLocation` is new child model
- `ExternalOrganization.headquartersCountryId` exists but represents legal seat, NOT processing location
- Legal seat ≠ processing location (e.g., incorporated in DE, processes in US/India)
- No data migration from `headquartersCountryId` to `processingLocations`

### Item 16: Extend Existing ComponentChangeLog

- Add 3 new values to `componentType` enum:
  - `"DigitalAsset"`
  - `"AssetProcessingLocation"`
  - `"RecipientProcessingLocation"`
- No migration of existing change log entries needed
- Existing middleware pattern extends to new types

---

## Size Estimates Justification

### Item 14: `M` (Medium) - ~2-3 weeks

**Scope:**

- 3 models: `DigitalAsset`, `DataProcessingActivityDigitalAsset`, `AssetProcessingLocation`
- Complex indexes (6 compound indexes across 3 models)
- Integration with existing Activity junction pattern
- Testing: multi-tenancy, location queries, asset inventory

**Complexity Drivers:**

- User FK relations for ownership tracking
- Country FK with nullable constraint handling
- Junction table following established pattern
- Processing location child model with compliance logic

### Item 15: `M` (Medium) - ~2-3 weeks

**Scope:**

- 1 model: `RecipientProcessingLocation`
- Service layer transfer detection (complex business logic)
- Sub-processor chain traversal (recursive queries)
- Testing: cross-border detection, hierarchy queries, safeguard validation

**Complexity Drivers:**

- Service layer composition (4 helper functions + 2 main functions)
- Recipient hierarchy traversal logic
- Country.gdprStatus JSON parsing and matching
- Transfer safeguard requirement calculation

### Item 16: `M` (Medium) - ~1-2 weeks

**Scope:**

- Extends existing `ComponentChangeLog` model (add 3 enum values)
- Middleware for 3 new component types
- `AffectedDocument` integration
- Testing: change detection, document impact analysis

**Complexity Drivers:**

- Prisma middleware pattern implementation
- Before/after snapshot capture for locations
- Critical field change detection (country, mechanism)
- Affected document marking logic

**Total: ~5-8 weeks for all three items (if sequential)**

---

## Questions to Resolve in Requirements Phase

1. **Should AssetProcessingLocation.service be free text or FK to Service catalog?**
   - **Recommendation:** Free text initially (MVP flexibility)
   - **Rationale:** Let patterns emerge before creating service catalog
   - **Evolution path:** If 80%+ reuse same service names, create Service model in future

2. **Should locationRole enum support custom values or be strict?**
   - **Recommendation:** Strict enum (`HOSTING`, `PROCESSING`, `BOTH`)
   - **Rationale:** Clear semantics, prevents "hosting-and-processing" typo variants
   - **Escape hatch:** Use `metadata` JSON for edge cases

3. **How to handle locations with multiple purposes (e.g., BigQuery for analytics AND ML)?**
   - **Recommendation:** Create multiple `AssetProcessingLocation` records (one per service/purpose)
   - **Example:**
     ```typescript
     AssetProcessingLocation(BigQuery, US, "Analytics", purposeId: analytics)
     AssetProcessingLocation(BigQuery, US, "ML training", purposeId: mlDevelopment)
     ```

4. **Should transfer detection be real-time (service layer) or pre-computed (materialized view)?**
   - **Recommendation:** Real-time for MVP
   - **Rationale:** Data volume low initially, flexibility to change detection logic
   - **Future optimization:** If >1000 locations, consider materialized `ComputedTransfer` view

5. **What's the scope of "affected documents" when location changes?**
   - **Recommendation:** Any DPIA or RoPA that includes activities using the changed asset/recipient
   - **Query:** Activity ↔ Asset/Recipient ↔ Location
   - **Document types:** DPIA (primary), RoPA (secondary), DPA (if processor location)

6. **Should we support location change history beyond ComponentChangeLog?**
   - **Recommendation:** No separate history table
   - **Rationale:** `ComponentChangeLog` is sufficient for audit trail
   - **Query pattern:** `WHERE componentType = 'RecipientProcessingLocation' AND componentId = locationId ORDER BY changedAt DESC`

---

## Final Checklist for Spec Writers

Before starting implementation:

- [ ] Read Items 3, 8, 12 (prerequisite models)
- [ ] Understand `Country.gdprStatus` JSON structure
- [ ] Review junction table pattern from Item 13
- [ ] Understand multi-tenancy filtering requirements
- [ ] Review this guidance document completely
- [ ] Identify questions for requirements clarification phase
- [ ] Plan DAL function API surface
- [ ] Plan tRPC router structure
- [ ] Plan test coverage strategy
- [ ] Estimate size realistically (2-3 weeks per item)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Author:** Product Planning Agent
**Review Status:** Ready for spec creation
