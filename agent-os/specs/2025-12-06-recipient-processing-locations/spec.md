# Specification: RecipientProcessingLocation Model and Cross-Border Transfer Detection

## 🎯 Implementation Status

### Phase 1: Backend Foundation - ✅ COMPLETE (2025-12-06)

**Delivered:**
- ✅ RecipientProcessingLocation model with full schema
- ✅ 8 DAL functions (CRUD + hierarchy + soft delete)
- ✅ Service layer transfer detection functions
- ✅ 10 tRPC procedures (full API surface)
- ✅ Organization.headquartersCountryId field
- ✅ 51 integration tests passing
- ✅ Multi-tenancy enforcement
- ✅ Transfer mechanism validation (when org has headquarters)

**Test Coverage:**
- Database model: 8 tests
- DAL operations: 8 tests
- Service layer: 17 tests
- tRPC API: 8 tests
- Workflows: 10 tests
- **Total: 51 tests passing**

**Functional Status:**
- CRUD operations: **Production-ready**
- Transfer detection: **Working** (requires org.headquartersCountryId)
- Validation: **Enforced** (when org has headquarters country)
- API surface: **Complete and tested**

### Phase 2: Comprehensive Testing - 🚧 PLANNED

**Objectives:**
- Expand multi-country test scenarios
- Add deep hierarchy testing (3-4+ levels)
- Establish performance baselines
- Document known limitations
- Edge case validation

**Expected Completion:** TBD (independent of UI work)

### Phase 3: UI Integration - ⏸️ PENDING (Item 16c)

**Dependencies:**
- Item 16c: Recipient Management UI
- Full end-to-end testing with real user workflows

---

## 1. Overview

### Purpose

Track WHERE a recipient/processor processes personal data to enable automated cross-border transfer detection and GDPR Article 44-46 compliance. This specification implements the backend/API/service layer for RecipientProcessingLocation (parallel to AssetProcessingLocation from Item 14) and provides service layer functions to detect cross-border transfers by comparing organization countries with recipient processing locations.

### Business Value

- **Single Source of Truth**: Update processing location once, all DPIAs and compliance reports reflect changes automatically
- **Automated Transfer Detection**: System derives cross-border transfers by composition instead of manual tracking
- **Compliance Guardrails**: Hard validation ensures third-country locations have required transfer mechanisms (Article 46)
- **Sub-Processor Visibility**: Traverse recipient hierarchy to include entire processing chain in transfer analysis
- **Audit Trail**: Historical location tracking via isActive flag preserves compliance snapshots

### Architectural Decision: Locations as Properties, Transfers as Derived

**Core Principle**: Processing locations are PROPERTIES of recipients, cross-border transfers are DERIVED via service layer composition.

**Rationale**:
- Locations are factual properties: "Mailchimp processes email data in US data centers"
- Transfers are contextual relationships: "Data flows from EU organization to US processor"
- Same location may or may not be a transfer depending on organization's country
- Avoids data duplication and ensures consistency with single source of truth

**Implementation**:
- Store RecipientProcessingLocation records with country, service, mechanism
- Service layer compares Organization.headquartersCountryId with RecipientProcessingLocation.countryId
- Use Country.gdprStatus JSON to determine legal framework and safeguard requirements

### Prerequisites and Dependencies

**Already Implemented (Prerequisites)**:
- **Item 3**: Country model with gdprStatus JSON, TransferMechanism model with category enum
- **Item 8**: DataProcessingActivity with junction table patterns, activity-recipient linkage
- **Item 12**: Recipient model with parentRecipientId hierarchy support, hierarchy traversal functions
- **Item 14**: AssetProcessingLocation model (parallel pattern), LocationRole enum, purpose/service fields

**Dependencies**:
- Recipient hierarchy queries from `packages/database/src/dal/recipients.ts`
- Country gdprStatus parsing logic for EU/EEA/Adequate/Third Country detection
- TransferMechanism model for safeguard documentation

**Integration Points**:
- **Item 16** (Component Change Tracking): Extend ComponentType enum to include "RecipientProcessingLocation", trigger document regeneration on location changes
- **Item 16c** (Recipient Management UI): Deferred UI implementation of location management interface
- **Future Item 38** (DPIA Generation): Snapshot recipient processing locations in document metadata for cross-border transfer sections

### Size Estimate

**M (Medium)** - Approximately 2-3 weeks for backend/API/service layer

**Complexity Drivers**:
- **Database Schema**: RecipientProcessingLocation model with 6 foreign keys, 3 composite indexes, cascade rules
- **Service Layer Composition**: 4 helper functions (isSameJurisdiction, isThirdCountry, requiresSafeguards, deriveLocationRisk) + 2 main functions (detectCrossBorderTransfers, getActivityTransferAnalysis)
- **Hierarchy Traversal Logic**: Recursive queries to include parent recipient locations in sub-processor chains
- **Country.gdprStatus JSON Parsing**: Complex matching logic for EU/EEA/Adequate/Third Country determination
- **Transfer Safeguard Calculation**: Context-aware validation requiring origin + destination country analysis
- **Transaction Handling**: moveRecipientProcessingLocation requires atomic operations with validation
- **Validation Logic**: Hard validation for transferMechanismId with clear error messages

**Scope**: Backend/API/service layer only. UI implementation deferred to Item 16c (separate estimation).

---

## 2. Database Schema

### RecipientProcessingLocation Model

**Location**: `packages/database/prisma/schema.prisma`

```prisma
// Recipient processing location model for tracking WHERE recipients process data
// Parallel to AssetProcessingLocation (Item 14) - same field structure and patterns
model RecipientProcessingLocation {
  id             String       @id @default(cuid())
  organizationId String
  recipientId    String

  // Business context (identical pattern to AssetProcessingLocation)
  service     String  // Free text: "Email processing", "CRM data storage", "Analytics processing"
  purposeId   String? // Optional FK to Purpose for formalized purposes
  purposeText String? // Fallback if purpose not yet formalized

  // Geographic + Compliance
  countryId           String  // FK to Country - WHERE is data processed/hosted?
  locationRole        LocationRole // HOSTING, PROCESSING, or BOTH
  transferMechanismId String? // FK to TransferMechanism - required for third countries

  // Status
  isActive Boolean @default(true) // false for historical locations (preserve audit trail)
  metadata Json?   // Extensible metadata for future features

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
  @@index([organizationId, recipientId]) // Get all locations for a recipient
  @@index([organizationId, countryId])   // Geographic compliance queries
  @@index([organizationId, transferMechanismId]) // Mechanism auditing
}
```

**Schema Notes**:
- Reuse LocationRole enum from Item 14 (already defined in schema): `HOSTING`, `PROCESSING`, `BOTH`
- Follow exact field structure of AssetProcessingLocation for consistency
- Add relation to Recipient schema: `processingLocations RecipientProcessingLocation[]`
- Add relation to Country schema: `recipientProcessingLocations RecipientProcessingLocation[] @relation("RecipientProcessingCountries")`
- Add relation to Purpose schema: `recipientProcessingLocations RecipientProcessingLocation[]`
- Add relation to TransferMechanism schema: `recipientTransferMechanisms RecipientProcessingLocation[] @relation("RecipientTransferMechanisms")`

### Index Rationale

**1. `(organizationId, recipientId)` - Recipient Location Lookup**
- **Query**: "Show all locations where Mailchimp processes data"
- **Use Case**: Recipient detail page displaying location table
- **Cardinality**: High selectivity (few locations per recipient)

**2. `(organizationId, countryId)` - Geographic Compliance**
- **Query**: "Show all recipients processing data in United States"
- **Use Case**: Geographic compliance audits, dashboard analytics
- **Cardinality**: Medium selectivity (multiple recipients per country)

**3. `(organizationId, transferMechanismId)` - Mechanism Auditing**
- **Query**: "Show all locations using Standard Contractual Clauses"
- **Use Case**: Transfer mechanism reporting, adequacy decision updates
- **Cardinality**: Medium selectivity (multiple locations per mechanism)

### Cascade Rules with Justification

**1. `organization` - onDelete: Cascade**
- **Rationale**: Locations are tenant-scoped data, meaningless without organization
- **Behavior**: Deleting organization deletes all its recipient processing locations
- **Compliance**: Ensures complete data deletion for right to erasure

**2. `recipient` - onDelete: Cascade**
- **Rationale**: Locations are properties of recipients, not standalone entities
- **Behavior**: Deleting recipient deletes all its processing locations
- **Risk**: None - locations have no independent business value

**3. `country` - onDelete: Restrict**
- **Rationale**: Countries are reference data, cannot delete if in use
- **Behavior**: Cannot delete country with active location references
- **Protection**: Prevents orphaned locations, maintains referential integrity

**4. `purpose` - onDelete: SetNull**
- **Rationale**: Purpose link is optional, purposeText provides fallback
- **Behavior**: Deleting purpose clears purposeId, preserves purposeText
- **Flexibility**: Allows purpose reorganization without breaking locations

**5. `transferMechanism` - onDelete: SetNull**
- **Rationale**: Mechanism link is optional (not needed for same-jurisdiction processing)
- **Behavior**: Deleting mechanism clears transferMechanismId, triggers validation warnings
- **Risk**: Location may become non-compliant, flagged by service layer

---

## 3. Business Rules & Validation

### transferMechanismId Requirement Logic

**Hard Validation Rule**: transferMechanismId is REQUIRED when processing location is in a third country without adequacy decision, AND the origin country (organization's country) requires safeguards for transfers.

**Implementation Logic**:

```typescript
// Pseudo-code for validation
function validateTransferMechanism(
  originCountry: Country,
  destinationCountry: Country,
  transferMechanismId: string | null
): ValidationResult {
  // Step 1: Check if same jurisdiction
  if (isSameJurisdiction(originCountry, destinationCountry)) {
    // No mechanism required for same-jurisdiction processing
    return { valid: true, required: false }
  }

  // Step 2: Check if third country requiring safeguards
  if (requiresSafeguards(originCountry, destinationCountry)) {
    // Mechanism REQUIRED for third-country transfers
    if (!transferMechanismId) {
      return {
        valid: false,
        required: true,
        error: "Transfer mechanism required for third-country transfer without adequacy decision (GDPR Article 46)"
      }
    }
    return { valid: true, required: true }
  }

  // Step 3: Adequacy decision exists or special case
  return { valid: true, required: false }
}
```

**Validation Enforcement Points**:
- createRecipientProcessingLocation DAL function (before creation)
- updateRecipientProcessingLocation DAL function (when country changes)
- moveRecipientProcessingLocation service function (before transaction)

**Error Messages**:
- "Transfer mechanism required: {destinationCountry} is a third country without adequacy decision. Select an appropriate safeguard under GDPR Article 46."
- "Cannot save location without transfer mechanism. Processing in {country} requires documented safeguards (e.g., Standard Contractual Clauses)."

### isActive Flag Usage

**Purpose**: Historical tracking for compliance snapshots and audit trails

**Behavior**:
- **Active Locations (isActive: true)**: Current processing locations, included in compliance queries and risk analysis
- **Inactive Locations (isActive: false)**: Historical locations, excluded from active compliance queries but queryable for document regeneration snapshots

**Query Patterns**:
```typescript
// Default: Only active locations
const activeLocations = await prisma.recipientProcessingLocation.findMany({
  where: { recipientId, isActive: true }
})

// Historical snapshot: All locations at specific point in time
const snapshotLocations = await prisma.recipientProcessingLocation.findMany({
  where: {
    recipientId,
    createdAt: { lte: snapshotDate }
    // No isActive filter - include all historical records
  }
})
```

**Move Operation Pattern**:
```typescript
// When location changes (e.g., processor moves from US to EU):
// 1. Set old location isActive: false
// 2. Create new location with updated values
// 3. Both in single transaction
```

### service Field: Free Text with Guidance

**Format**: Free text string describing the service/activity being performed

**Guidance for Users**:
- Keep specific: "Email sending" not just "Email"
- Include service name if known: "Email delivery via SendGrid API"
- Examples: "BigQuery analytics", "S3 backup storage", "Stripe payment processing"

**Help Text**: "Describe the specific service or activity this recipient performs at this location. Be specific to enable accurate compliance reporting."

**Future Evolution**: May become FK to service catalog if patterns emerge, but start with free text for flexibility.

**Validation**: None (free text), minimum length 3 characters, maximum length 500 characters.

### Completeness Checks (Soft Warnings)

**Non-Blocking Warnings** for incomplete data:

```typescript
type CompletenessWarning = {
  field: string
  severity: 'warning' | 'info'
  message: string
}

function checkRecipientLocationCompleteness(
  recipient: Recipient,
  locations: RecipientProcessingLocation[]
): CompletenessWarning[] {
  const warnings: CompletenessWarning[] = []

  // Warning 1: PROCESSOR/SUB_PROCESSOR without locations
  if ((recipient.type === 'PROCESSOR' || recipient.type === 'SUB_PROCESSOR') &&
      locations.filter(l => l.isActive).length === 0) {
    warnings.push({
      field: 'processingLocations',
      severity: 'warning',
      message: 'Processor recipients should have at least one processing location for compliance reporting'
    })
  }

  // Warning 2: Location with purposeText but no purposeId
  locations.forEach(loc => {
    if (loc.purposeText && !loc.purposeId) {
      warnings.push({
        field: `location.${loc.id}.purpose`,
        severity: 'info',
        message: 'Consider formalizing purpose for better reporting'
      })
    }
  })

  return warnings
}
```

**Tracking**: Store completeness issues for future dashboard metrics (Items 42-43+).

---

## 4. Data Access Layer (DAL)

**Location**: `packages/database/src/dal/recipientProcessingLocations.ts`

### Core CRUD Functions

```typescript
import type { RecipientProcessingLocation, LocationRole, Prisma } from '../index'
import { prisma } from '../index'

/**
 * Create a new recipient processing location with validation
 * SECURITY: Enforces multi-tenancy by validating organizationId
 *
 * Validates:
 * - Recipient belongs to organization
 * - Transfer mechanism required for third countries (hard validation)
 * - Purpose belongs to organization if provided
 *
 * @param data - Location data
 * @returns Promise with created location
 * @throws Error if validation fails or entities not found
 */
export async function createRecipientProcessingLocation(data: {
  organizationId: string
  recipientId: string
  service: string
  countryId: string
  locationRole: LocationRole
  purposeId?: string | null
  purposeText?: string | null
  transferMechanismId?: string | null
  metadata?: Prisma.InputJsonValue | null
}): Promise<RecipientProcessingLocation> {
  // Step 1: Validate recipient belongs to organization
  const recipient = await prisma.recipient.findUnique({
    where: { id: data.recipientId }
  })

  if (!recipient || recipient.organizationId !== data.organizationId) {
    throw new Error('Recipient not found or does not belong to organization')
  }

  // Step 2: Get countries for validation
  const [orgCountry, locationCountry] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: data.organizationId },
      select: { countryId: true }
    }).then(org => org?.countryId ? prisma.country.findUnique({ where: { id: org.countryId } }) : null),
    prisma.country.findUnique({
      where: { id: data.countryId }
    })
  ])

  if (!locationCountry) {
    throw new Error('Country not found')
  }

  // Step 3: Validate transfer mechanism requirement (hard validation)
  if (orgCountry) {
    const validation = await validateTransferMechanismRequirement(
      orgCountry,
      locationCountry,
      data.transferMechanismId
    )

    if (!validation.valid) {
      throw new Error(validation.error)
    }
  }

  // Step 4: Validate purpose belongs to organization if provided
  if (data.purposeId) {
    const purpose = await prisma.purpose.findUnique({
      where: { id: data.purposeId }
    })

    if (!purpose || purpose.organizationId !== data.organizationId) {
      throw new Error('Purpose not found or does not belong to organization')
    }
  }

  // Step 5: Create location
  return prisma.recipientProcessingLocation.create({
    data: {
      organizationId: data.organizationId,
      recipientId: data.recipientId,
      service: data.service,
      countryId: data.countryId,
      locationRole: data.locationRole,
      purposeId: data.purposeId,
      purposeText: data.purposeText,
      transferMechanismId: data.transferMechanismId,
      metadata: data.metadata,
      isActive: true
    }
  })
}

/**
 * Get active processing locations for a recipient
 * SECURITY: Filters by isActive: true to exclude historical locations
 *
 * Returns locations with related country, transferMechanism, and purpose data.
 * Sorted chronologically by creation date.
 *
 * @param recipientId - The recipient ID to retrieve locations for
 * @returns Promise with array of active locations (empty if none)
 */
export async function getActiveLocationsForRecipient(recipientId: string): Promise<
  Array<
    RecipientProcessingLocation & {
      country: Prisma.CountryGetPayload<object>
      transferMechanism: Prisma.TransferMechanismGetPayload<object> | null
      purpose: Prisma.PurposeGetPayload<object> | null
    }
  >
> {
  return prisma.recipientProcessingLocation.findMany({
    where: {
      recipientId,
      isActive: true
    },
    include: {
      country: true,
      transferMechanism: true,
      purpose: true
    },
    orderBy: [{ createdAt: 'asc' }]
  })
}

/**
 * Get all locations for a recipient (including historical)
 * SECURITY: Caller must verify recipient belongs to their organization
 *
 * Used for historical snapshots and document regeneration.
 *
 * @param recipientId - The recipient ID to retrieve locations for
 * @param options - Optional filters (isActive status)
 * @returns Promise with array of locations
 */
export async function getAllLocationsForRecipient(
  recipientId: string,
  options?: { isActive?: boolean }
): Promise<
  Array<
    RecipientProcessingLocation & {
      country: Prisma.CountryGetPayload<object>
      transferMechanism: Prisma.TransferMechanismGetPayload<object> | null
      purpose: Prisma.PurposeGetPayload<object> | null
    }
  >
> {
  return prisma.recipientProcessingLocation.findMany({
    where: {
      recipientId,
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {})
    },
    include: {
      country: true,
      transferMechanism: true,
      purpose: true
    },
    orderBy: [{ createdAt: 'desc' }]
  })
}

/**
 * Update existing recipient processing location
 * Supports partial updates - all fields optional
 *
 * Does NOT update organizationId or recipientId (immutable).
 * Validates transfer mechanism requirement when country changes.
 *
 * @param id - The location ID to update
 * @param data - Partial location data to update
 * @returns Promise with updated location
 * @throws Error if location not found or validation fails
 */
export async function updateRecipientProcessingLocation(
  id: string,
  data: {
    service?: string
    countryId?: string
    locationRole?: LocationRole
    purposeId?: string | null
    purposeText?: string | null
    transferMechanismId?: string | null
    isActive?: boolean
    metadata?: Prisma.InputJsonValue | null
  }
): Promise<RecipientProcessingLocation> {
  // Get existing location
  const existing = await prisma.recipientProcessingLocation.findUnique({
    where: { id },
    include: {
      organization: { select: { countryId: true } },
      country: true
    }
  })

  if (!existing) {
    throw new Error('Location not found')
  }

  // Validate transfer mechanism if country is changing
  if (data.countryId && data.countryId !== existing.countryId) {
    const [orgCountry, newLocationCountry] = await Promise.all([
      existing.organization.countryId ? prisma.country.findUnique({ where: { id: existing.organization.countryId } }) : null,
      prisma.country.findUnique({ where: { id: data.countryId } })
    ])

    if (!newLocationCountry) {
      throw new Error('Country not found')
    }

    if (orgCountry) {
      const validation = await validateTransferMechanismRequirement(
        orgCountry,
        newLocationCountry,
        data.transferMechanismId ?? existing.transferMechanismId
      )

      if (!validation.valid) {
        throw new Error(validation.error)
      }
    }
  }

  return prisma.recipientProcessingLocation.update({
    where: { id },
    data: {
      service: data.service,
      countryId: data.countryId,
      locationRole: data.locationRole,
      purposeId: data.purposeId !== undefined ? (data.purposeId ?? undefined) : undefined,
      purposeText: data.purposeText !== undefined ? (data.purposeText ?? undefined) : undefined,
      transferMechanismId: data.transferMechanismId !== undefined ? (data.transferMechanismId ?? undefined) : undefined,
      isActive: data.isActive,
      metadata: data.metadata !== undefined ? (data.metadata ?? undefined) : undefined
    }
  })
}

/**
 * Deactivate recipient processing location (soft delete)
 * SECURITY: Preserves historical data for audit trail instead of deletion
 *
 * Sets isActive: false. Deactivated locations are excluded from
 * active queries but remain in database for compliance snapshots.
 *
 * @param id - The location ID to deactivate
 * @returns Promise with deactivated location
 * @throws Error if location not found
 */
export async function deactivateRecipientProcessingLocation(
  id: string
): Promise<RecipientProcessingLocation> {
  return prisma.recipientProcessingLocation.update({
    where: { id },
    data: { isActive: false }
  })
}

/**
 * Get all processing locations in a specific country for an organization
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * Use for geographic compliance queries (e.g., "Show all processing in US").
 * Includes recipient context for business understanding.
 *
 * @param organizationId - The organization ID to query
 * @param countryId - The country ID to filter by
 * @param options - Optional filters (isActive status)
 * @returns Promise with array of locations
 */
export async function getLocationsByCountry(
  organizationId: string,
  countryId: string,
  options?: { isActive?: boolean }
): Promise<
  Array<
    RecipientProcessingLocation & {
      recipient: Prisma.RecipientGetPayload<object>
      transferMechanism: Prisma.TransferMechanismGetPayload<object> | null
      purpose: Prisma.PurposeGetPayload<object> | null
    }
  >
> {
  return prisma.recipientProcessingLocation.findMany({
    where: {
      organizationId,
      countryId,
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {})
    },
    include: {
      recipient: true,
      transferMechanism: true,
      purpose: true
    },
    orderBy: [{ recipient: { name: 'asc' } }]
  })
}
```

### Move Location Function (Transactional)

```typescript
/**
 * Move recipient processing location to new country with validation
 * ATOMIC: Creates new location and deactivates old location in single transaction
 *
 * Use when:
 * - Processor changes data center location
 * - Recipient moves hosting to different country
 * - Service provider changes infrastructure
 *
 * Pattern:
 * 1. Read existing location
 * 2. Create new location with updated fields
 * 3. Deactivate old location
 * 4. All in single transaction with validation
 *
 * @param locationId - The existing location ID to move
 * @param updates - Fields to update in new location
 * @returns Promise with new location
 * @throws Error if validation fails or location not found
 */
export async function moveRecipientProcessingLocation(
  locationId: string,
  updates: {
    countryId?: string
    service?: string
    transferMechanismId?: string | null
    locationRole?: LocationRole
    purposeId?: string | null
    purposeText?: string | null
    metadata?: Prisma.InputJsonValue | null
  }
): Promise<RecipientProcessingLocation> {
  return prisma.$transaction(async (tx) => {
    // Step 1: Get existing location
    const existing = await tx.recipientProcessingLocation.findUnique({
      where: { id: locationId },
      include: {
        organization: { select: { countryId: true } },
        country: true
      }
    })

    if (!existing) {
      throw new Error('Location not found')
    }

    // Step 2: Merge updates with existing values
    const newCountryId = updates.countryId ?? existing.countryId
    const newTransferMechanismId = updates.transferMechanismId !== undefined
      ? updates.transferMechanismId
      : existing.transferMechanismId

    // Step 3: Validate transfer mechanism if country changed
    if (newCountryId !== existing.countryId) {
      const [orgCountry, newLocationCountry] = await Promise.all([
        existing.organization.countryId ? tx.country.findUnique({ where: { id: existing.organization.countryId } }) : null,
        tx.country.findUnique({ where: { id: newCountryId } })
      ])

      if (!newLocationCountry) {
        throw new Error('Country not found')
      }

      if (orgCountry) {
        const validation = await validateTransferMechanismRequirement(
          orgCountry,
          newLocationCountry,
          newTransferMechanismId
        )

        if (!validation.valid) {
          throw new Error(validation.error)
        }
      }
    }

    // Step 4: Create new location
    const newLocation = await tx.recipientProcessingLocation.create({
      data: {
        organizationId: existing.organizationId,
        recipientId: existing.recipientId,
        service: updates.service ?? existing.service,
        countryId: newCountryId,
        locationRole: updates.locationRole ?? existing.locationRole,
        purposeId: updates.purposeId !== undefined ? updates.purposeId : existing.purposeId,
        purposeText: updates.purposeText !== undefined ? updates.purposeText : existing.purposeText,
        transferMechanismId: newTransferMechanismId,
        metadata: updates.metadata !== undefined ? updates.metadata : existing.metadata,
        isActive: true
      }
    })

    // Step 5: Deactivate old location
    await tx.recipientProcessingLocation.update({
      where: { id: locationId },
      data: { isActive: false }
    })

    return newLocation
  })
}
```

### Hierarchy Traversal Integration

```typescript
/**
 * Get all processing locations for a recipient including parent chain
 * SECURITY: All queries scoped to organizationId to enforce multi-tenancy
 *
 * Traverses recipient.parentRecipient hierarchy to include all locations
 * in the sub-processor chain. Used for complete transfer analysis.
 *
 * @param recipientId - The recipient ID to start from
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise with locations grouped by recipient depth
 */
export async function getLocationsWithParentChain(
  recipientId: string,
  organizationId: string
): Promise<Array<{
  recipientId: string
  recipientName: string
  depth: number
  locations: Array<RecipientProcessingLocation & { country: Country }>
}>> {
  // Import recipient hierarchy functions
  const { getAncestorChain } = await import('./recipients')

  // Step 1: Get ancestor chain
  const ancestors = await getAncestorChain(recipientId, organizationId)

  // Step 2: Build recipient ID list (self + ancestors)
  const recipientIds = [recipientId, ...ancestors.map(a => a.id)]

  // Step 3: Get all locations for these recipients
  const allLocations = await prisma.recipientProcessingLocation.findMany({
    where: {
      recipientId: { in: recipientIds },
      organizationId,
      isActive: true
    },
    include: {
      country: true,
      recipient: { select: { id: true, name: true } }
    },
    orderBy: [{ createdAt: 'asc' }]
  })

  // Step 4: Group by recipient with depth
  const result = []
  const depthMap = new Map<string, number>()
  depthMap.set(recipientId, 0)
  ancestors.forEach((a, i) => depthMap.set(a.id, i + 1))

  for (const rid of recipientIds) {
    const recipientLocations = allLocations.filter(l => l.recipientId === rid)
    if (recipientLocations.length > 0) {
      result.push({
        recipientId: rid,
        recipientName: recipientLocations[0].recipient.name,
        depth: depthMap.get(rid) ?? 0,
        locations: recipientLocations.map(l => ({
          ...l,
          country: l.country
        }))
      })
    }
  }

  return result
}
```

---

## 5. Service Layer - Transfer Detection

**Location**: `packages/database/src/services/transferDetection.ts`

### Core Interfaces

```typescript
import type { Country, Recipient, RecipientProcessingLocation, TransferMechanism } from '../index'

/**
 * Cross-border transfer detected by service layer composition
 * Represents a derived relationship between organization and recipient location
 */
export interface CrossBorderTransfer {
  organizationCountry: Country
  recipientId: string
  recipientName: string
  recipientType: string
  processingLocation: RecipientProcessingLocation & {
    country: Country
    transferMechanism: TransferMechanism | null
  }
  transferRisk: TransferRisk
  depth: number // Depth in sub-processor chain (0 = direct recipient)
}

/**
 * Transfer risk assessment result
 */
export type TransferRisk =
  | { level: 'NONE', reason: 'SAME_JURISDICTION' }
  | { level: 'LOW', reason: 'ADEQUACY_DECISION' }
  | { level: 'MEDIUM', reason: 'SAFEGUARDS_IN_PLACE', mechanism: TransferMechanism }
  | { level: 'HIGH', reason: 'MISSING_SAFEGUARDS', requiredMechanism: string }
  | { level: 'CRITICAL', reason: 'THIRD_COUNTRY_NO_MECHANISM' }

/**
 * Activity-level transfer analysis
 * Aggregates all transfers for a specific processing activity
 */
export interface ActivityTransferAnalysis {
  activityId: string
  activityName: string
  organizationCountry: Country
  transfers: CrossBorderTransfer[]
  summary: {
    totalRecipients: number
    recipientsWithTransfers: number
    riskDistribution: {
      none: number
      low: number
      medium: number
      high: number
      critical: number
    }
    countriesInvolved: Array<{ country: Country; locationCount: number }>
  }
}
```

### Helper Functions

```typescript
/**
 * Check if two countries are in the same legal jurisdiction
 * Uses Country.gdprStatus JSON to determine legal framework
 *
 * Same jurisdiction:
 * - Both EU/EEA countries
 * - Both non-EU but covered by adequacy decision
 *
 * @param country1 - First country
 * @param country2 - Second country
 * @returns true if same jurisdiction, false otherwise
 */
export function isSameJurisdiction(country1: Country, country2: Country): boolean {
  const status1 = country1.gdprStatus as string[]
  const status2 = country2.gdprStatus as string[]

  // Both EU or EEA
  const bothEuEea =
    (status1.includes('EU') || status1.includes('EEA')) &&
    (status2.includes('EU') || status2.includes('EEA'))

  if (bothEuEea) return true

  // Both have adequacy decision (same adequate framework)
  const bothAdequate = status1.includes('Adequate') && status2.includes('Adequate')
  if (bothAdequate) return true

  return false
}

/**
 * Check if country is a third country (not EU/EEA/Adequate)
 *
 * @param country - Country to check
 * @returns true if third country, false otherwise
 */
export function isThirdCountry(country: Country): boolean {
  const status = country.gdprStatus as string[]
  return !status.some(s => ['EU', 'EEA', 'Adequate'].includes(s))
}

/**
 * Check if transfer from origin to destination requires safeguards
 * Implements GDPR Article 44-46 logic
 *
 * Requires safeguards when:
 * - Origin is EU/EEA
 * - Destination is third country without adequacy decision
 *
 * @param origin - Origin country (organization country)
 * @param destination - Destination country (processing location)
 * @returns true if safeguards required, false otherwise
 */
export function requiresSafeguards(origin: Country, destination: Country): boolean {
  const originStatus = origin.gdprStatus as string[]
  const destinationStatus = destination.gdprStatus as string[]

  // Origin must be EU/EEA
  const originIsEuEea = originStatus.includes('EU') || originStatus.includes('EEA')
  if (!originIsEuEea) return false

  // Destination must be third country
  return isThirdCountry(destination)
}

/**
 * Derive transfer risk level based on countries and mechanism
 * Core business logic for transfer risk assessment
 *
 * @param origin - Origin country (organization country)
 * @param destination - Destination country (processing location)
 * @param transferMechanism - Transfer mechanism if present
 * @returns TransferRisk assessment
 */
export function deriveTransferRisk(
  origin: Country,
  destination: Country,
  transferMechanism: TransferMechanism | null
): TransferRisk {
  // Step 1: Same jurisdiction - no risk
  if (isSameJurisdiction(origin, destination)) {
    return { level: 'NONE', reason: 'SAME_JURISDICTION' }
  }

  // Step 2: Destination has adequacy decision - low risk
  const destinationStatus = destination.gdprStatus as string[]
  if (destinationStatus.includes('Adequate')) {
    return { level: 'LOW', reason: 'ADEQUACY_DECISION' }
  }

  // Step 3: Third country requiring safeguards
  if (requiresSafeguards(origin, destination)) {
    if (transferMechanism) {
      return {
        level: 'MEDIUM',
        reason: 'SAFEGUARDS_IN_PLACE',
        mechanism: transferMechanism
      }
    } else {
      return {
        level: 'CRITICAL',
        reason: 'THIRD_COUNTRY_NO_MECHANISM'
      }
    }
  }

  // Step 4: Other third country scenarios
  if (isThirdCountry(destination)) {
    if (transferMechanism) {
      return {
        level: 'MEDIUM',
        reason: 'SAFEGUARDS_IN_PLACE',
        mechanism: transferMechanism
      }
    } else {
      return {
        level: 'HIGH',
        reason: 'MISSING_SAFEGUARDS',
        requiredMechanism: 'Standard Contractual Clauses or equivalent'
      }
    }
  }

  // Default: no transfer
  return { level: 'NONE', reason: 'SAME_JURISDICTION' }
}

/**
 * Validate transfer mechanism requirement
 * Used by DAL functions for hard validation
 *
 * @param origin - Origin country
 * @param destination - Destination country
 * @param transferMechanismId - Transfer mechanism ID if provided
 * @returns Validation result with error message if invalid
 */
export async function validateTransferMechanismRequirement(
  origin: Country,
  destination: Country,
  transferMechanismId: string | null
): Promise<{ valid: boolean; required: boolean; error?: string }> {
  // Same jurisdiction - no mechanism required
  if (isSameJurisdiction(origin, destination)) {
    return { valid: true, required: false }
  }

  // Third country requiring safeguards - mechanism REQUIRED
  if (requiresSafeguards(origin, destination)) {
    if (!transferMechanismId) {
      return {
        valid: false,
        required: true,
        error: `Transfer mechanism required: ${destination.name} is a third country without adequacy decision. Select an appropriate safeguard under GDPR Article 46 (e.g., Standard Contractual Clauses).`
      }
    }
    return { valid: true, required: true }
  }

  // Adequacy decision exists - no mechanism required but allowed
  return { valid: true, required: false }
}
```

### Main Detection Functions

```typescript
/**
 * Detect all cross-border transfers for an organization
 * Compares organization country with all recipient processing locations
 *
 * Algorithm:
 * 1. Get organization country
 * 2. Get all active recipients with active locations
 * 3. For each location, derive transfer risk
 * 4. Include parent chain locations for sub-processors
 * 5. Return aggregated transfer list
 *
 * @param organizationId - The organization ID to analyze
 * @returns Promise with array of detected cross-border transfers
 */
export async function detectCrossBorderTransfers(
  organizationId: string
): Promise<CrossBorderTransfer[]> {
  const { prisma } = await import('../index')
  const { getAncestorChain } = await import('../dal/recipients')

  // Step 1: Get organization with country
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { country: true }
  })

  if (!org || !org.country) {
    throw new Error('Organization or organization country not found')
  }

  // Step 2: Get all active recipients with locations
  const recipients = await prisma.recipient.findMany({
    where: {
      organizationId,
      isActive: true
    },
    include: {
      processingLocations: {
        where: { isActive: true },
        include: {
          country: true,
          transferMechanism: true
        }
      }
    }
  })

  // Step 3: Detect transfers
  const transfers: CrossBorderTransfer[] = []

  for (const recipient of recipients) {
    // Direct recipient locations (depth 0)
    for (const location of recipient.processingLocations) {
      const risk = deriveTransferRisk(org.country, location.country, location.transferMechanism)

      // Only include if actual transfer detected
      if (risk.level !== 'NONE') {
        transfers.push({
          organizationCountry: org.country,
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientType: recipient.type,
          processingLocation: location,
          transferRisk: risk,
          depth: 0
        })
      }
    }

    // Parent chain locations (depth > 0) for sub-processors
    if (recipient.parentRecipientId) {
      const ancestors = await getAncestorChain(recipient.id, organizationId)

      for (let i = 0; i < ancestors.length; i++) {
        const ancestor = ancestors[i]
        const ancestorLocations = await prisma.recipientProcessingLocation.findMany({
          where: {
            recipientId: ancestor.id,
            isActive: true
          },
          include: {
            country: true,
            transferMechanism: true
          }
        })

        for (const location of ancestorLocations) {
          const risk = deriveTransferRisk(org.country, location.country, location.transferMechanism)

          if (risk.level !== 'NONE') {
            transfers.push({
              organizationCountry: org.country,
              recipientId: ancestor.id,
              recipientName: ancestor.name,
              recipientType: ancestor.type,
              processingLocation: location,
              transferRisk: risk,
              depth: i + 1
            })
          }
        }
      }
    }
  }

  return transfers
}

/**
 * Analyze cross-border transfers for a specific processing activity
 * Gets all recipients linked to activity and analyzes their locations
 *
 * Algorithm:
 * 1. Get activity with linked recipients
 * 2. For each recipient, get locations (including parent chain)
 * 3. Derive transfer risks
 * 4. Aggregate summary statistics
 * 5. Return structured analysis
 *
 * @param activityId - The processing activity ID to analyze
 * @returns Promise with activity transfer analysis
 */
export async function getActivityTransferAnalysis(
  activityId: string
): Promise<ActivityTransferAnalysis> {
  const { prisma } = await import('../index')
  const { getAncestorChain } = await import('../dal/recipients')

  // Step 1: Get activity with organization
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId },
    include: {
      organization: {
        include: { country: true }
      },
      recipients: {
        include: {
          recipient: {
            include: {
              processingLocations: {
                where: { isActive: true },
                include: {
                  country: true,
                  transferMechanism: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!activity || !activity.organization.country) {
    throw new Error('Activity or organization country not found')
  }

  // Step 2: Detect transfers for each recipient
  const transfers: CrossBorderTransfer[] = []
  const recipientsWithTransfers = new Set<string>()
  const countriesMap = new Map<string, { country: Country; count: number }>()

  for (const recipientLink of activity.recipients) {
    const recipient = recipientLink.recipient

    // Direct recipient locations
    for (const location of recipient.processingLocations) {
      const risk = deriveTransferRisk(
        activity.organization.country,
        location.country,
        location.transferMechanism
      )

      if (risk.level !== 'NONE') {
        transfers.push({
          organizationCountry: activity.organization.country,
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientType: recipient.type,
          processingLocation: location,
          transferRisk: risk,
          depth: 0
        })

        recipientsWithTransfers.add(recipient.id)

        // Track country
        const existing = countriesMap.get(location.countryId)
        if (existing) {
          existing.count++
        } else {
          countriesMap.set(location.countryId, { country: location.country, count: 1 })
        }
      }
    }

    // Parent chain locations for sub-processors
    if (recipient.parentRecipientId) {
      const ancestors = await getAncestorChain(recipient.id, activity.organizationId)

      for (let i = 0; i < ancestors.length; i++) {
        const ancestor = ancestors[i]
        const ancestorLocations = await prisma.recipientProcessingLocation.findMany({
          where: {
            recipientId: ancestor.id,
            isActive: true
          },
          include: {
            country: true,
            transferMechanism: true
          }
        })

        for (const location of ancestorLocations) {
          const risk = deriveTransferRisk(
            activity.organization.country,
            location.country,
            location.transferMechanism
          )

          if (risk.level !== 'NONE') {
            transfers.push({
              organizationCountry: activity.organization.country,
              recipientId: ancestor.id,
              recipientName: ancestor.name,
              recipientType: ancestor.type,
              processingLocation: location,
              transferRisk: risk,
              depth: i + 1
            })

            recipientsWithTransfers.add(ancestor.id)

            const existing = countriesMap.get(location.countryId)
            if (existing) {
              existing.count++
            } else {
              countriesMap.set(location.countryId, { country: location.country, count: 1 })
            }
          }
        }
      }
    }
  }

  // Step 3: Calculate summary statistics
  const riskDistribution = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  }

  for (const transfer of transfers) {
    switch (transfer.transferRisk.level) {
      case 'NONE': riskDistribution.none++; break
      case 'LOW': riskDistribution.low++; break
      case 'MEDIUM': riskDistribution.medium++; break
      case 'HIGH': riskDistribution.high++; break
      case 'CRITICAL': riskDistribution.critical++; break
    }
  }

  const countriesInvolved = Array.from(countriesMap.values())
    .map(v => ({ country: v.country, locationCount: v.count }))
    .sort((a, b) => b.locationCount - a.locationCount)

  return {
    activityId: activity.id,
    activityName: activity.name,
    organizationCountry: activity.organization.country,
    transfers,
    summary: {
      totalRecipients: activity.recipients.length,
      recipientsWithTransfers: recipientsWithTransfers.size,
      riskDistribution,
      countriesInvolved
    }
  }
}
```

---

## 6. tRPC API

**Location**: `apps/web/src/server/routers/recipientProcessingLocations.ts`

### Router Structure

```typescript
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import {
  createRecipientProcessingLocation,
  getActiveLocationsForRecipient,
  getAllLocationsForRecipient,
  updateRecipientProcessingLocation,
  deactivateRecipientProcessingLocation,
  moveRecipientProcessingLocation,
  getLocationsByCountry,
  getLocationsWithParentChain
} from '@compilothq/database'
import {
  detectCrossBorderTransfers,
  getActivityTransferAnalysis
} from '@compilothq/database/services/transferDetection'

/**
 * tRPC router for recipient processing location operations
 * All procedures enforce multi-tenancy via user.organizationId
 */
export const recipientProcessingLocationsRouter = createTRPCRouter({
  // CREATE
  create: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().cuid(),
        service: z.string().min(3).max(500),
        countryId: z.string().cuid(),
        locationRole: z.enum(['HOSTING', 'PROCESSING', 'BOTH']),
        purposeId: z.string().cuid().optional().nullable(),
        purposeText: z.string().max(500).optional().nullable(),
        transferMechanismId: z.string().cuid().optional().nullable(),
        metadata: z.record(z.unknown()).optional().nullable()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.user.organizationId

      if (!organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User must belong to an organization'
        })
      }

      try {
        return await createRecipientProcessingLocation({
          organizationId,
          recipientId: input.recipientId,
          service: input.service,
          countryId: input.countryId,
          locationRole: input.locationRole,
          purposeId: input.purposeId,
          purposeText: input.purposeText,
          transferMechanismId: input.transferMechanismId,
          metadata: input.metadata
        })
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to create location'
        })
      }
    }),

  // READ - Active locations for recipient
  getActiveForRecipient: protectedProcedure
    .input(z.object({ recipientId: z.string().cuid() }))
    .query(async ({ input }) => {
      return await getActiveLocationsForRecipient(input.recipientId)
    }),

  // READ - All locations for recipient (including historical)
  getAllForRecipient: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().cuid(),
        isActive: z.boolean().optional()
      })
    )
    .query(async ({ input }) => {
      return await getAllLocationsForRecipient(input.recipientId, {
        isActive: input.isActive
      })
    }),

  // READ - Locations with parent chain
  getWithParentChain: protectedProcedure
    .input(z.object({ recipientId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.user.organizationId

      if (!organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User must belong to an organization'
        })
      }

      return await getLocationsWithParentChain(input.recipientId, organizationId)
    }),

  // READ - Locations by country
  getByCountry: protectedProcedure
    .input(
      z.object({
        countryId: z.string().cuid(),
        isActive: z.boolean().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.user.organizationId

      if (!organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User must belong to an organization'
        })
      }

      return await getLocationsByCountry(organizationId, input.countryId, {
        isActive: input.isActive
      })
    }),

  // UPDATE
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: z.object({
          service: z.string().min(3).max(500).optional(),
          countryId: z.string().cuid().optional(),
          locationRole: z.enum(['HOSTING', 'PROCESSING', 'BOTH']).optional(),
          purposeId: z.string().cuid().optional().nullable(),
          purposeText: z.string().max(500).optional().nullable(),
          transferMechanismId: z.string().cuid().optional().nullable(),
          isActive: z.boolean().optional(),
          metadata: z.record(z.unknown()).optional().nullable()
        })
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await updateRecipientProcessingLocation(input.id, input.data)
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to update location'
        })
      }
    }),

  // DEACTIVATE
  deactivate: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      try {
        return await deactivateRecipientProcessingLocation(input.id)
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to deactivate location'
        })
      }
    }),

  // MOVE (Transactional)
  move: protectedProcedure
    .input(
      z.object({
        locationId: z.string().cuid(),
        updates: z.object({
          countryId: z.string().cuid().optional(),
          service: z.string().min(3).max(500).optional(),
          transferMechanismId: z.string().cuid().optional().nullable(),
          locationRole: z.enum(['HOSTING', 'PROCESSING', 'BOTH']).optional(),
          purposeId: z.string().cuid().optional().nullable(),
          purposeText: z.string().max(500).optional().nullable(),
          metadata: z.record(z.unknown()).optional().nullable()
        })
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await moveRecipientProcessingLocation(input.locationId, input.updates)
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to move location'
        })
      }
    }),

  // TRANSFER DETECTION - Organization-level
  detectTransfers: protectedProcedure
    .query(async ({ ctx }) => {
      const organizationId = ctx.user.organizationId

      if (!organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User must belong to an organization'
        })
      }

      return await detectCrossBorderTransfers(organizationId)
    }),

  // TRANSFER DETECTION - Activity-level
  analyzeActivityTransfers: protectedProcedure
    .input(z.object({ activityId: z.string().cuid() }))
    .query(async ({ input }) => {
      return await getActivityTransferAnalysis(input.activityId)
    })
})
```

### Input/Output Types

All input validation uses Zod schemas as defined in router procedures above.

**Output Types** (auto-generated by tRPC from return types):
- `RouterOutput['recipientProcessingLocations']['create']` → RecipientProcessingLocation
- `RouterOutput['recipientProcessingLocations']['getActiveForRecipient']` → RecipientProcessingLocation[] with relations
- `RouterOutput['recipientProcessingLocations']['detectTransfers']` → CrossBorderTransfer[]
- `RouterOutput['recipientProcessingLocations']['analyzeActivityTransfers']` → ActivityTransferAnalysis

---

## 7. Integration Points

### Item 12: Recipient Hierarchy Queries

**Integration**: RecipientProcessingLocation leverages recipient hierarchy functions for sub-processor chain traversal.

**Functions Used**:
- `getAncestorChain(recipientId, organizationId)` - Get parent chain for location aggregation
- `getDescendantTree(recipientId, organizationId)` - Get sub-processor tree for transfer analysis

**Pattern**:
```typescript
// When analyzing transfers for a sub-processor:
// 1. Get sub-processor's direct locations
// 2. Get ancestor chain (parent processor locations)
// 3. Aggregate all locations for complete transfer picture
const ancestors = await getAncestorChain(subProcessorId, organizationId)
const allLocations = [
  ...subProcessorLocations,
  ...ancestorLocations // Include parent processing locations
]
```

### Item 14: Parallel Patterns with AssetProcessingLocation

**Code Reuse**:
- **Model Structure**: RecipientProcessingLocation mirrors AssetProcessingLocation exactly
- **DAL Functions**: Same function signatures, same patterns (getActive, update, deactivate, move)
- **Field Names**: service, purposeId, purposeText, countryId, locationRole, transferMechanismId, isActive, metadata
- **Validation Logic**: Same transferMechanismId requirement validation
- **LocationRole Enum**: Shared enum HOSTING/PROCESSING/BOTH

**Consistency Benefits**:
- Developers familiar with Item 14 can immediately understand Item 15
- Test patterns can be replicated
- UI components can be reused (in Item 16c)

### Item 16: ComponentChangeLog Integration

**Extension Required** (reference only, not implementing in Item 15):

```typescript
// Extend ComponentType enum in Item 16
enum ComponentType {
  // ... existing types
  RECIPIENT_PROCESSING_LOCATION // NEW
}

// Change detection middleware should track:
// - New location creation
// - Country changes (triggers transfer recalculation)
// - Transfer mechanism changes (affects compliance)
// - isActive changes (affects current compliance state)
```

**Trigger Logic**:
- Location creation/update → Mark linked ProcessingActivity as "needs regeneration"
- Country change → High priority document regeneration (transfer sections affected)
- Mechanism change → Medium priority document regeneration (compliance sections affected)

### Item 16c: UI Contract and Deferred Implementation

**Item 15 Provides** (Backend Contract):
- tRPC procedures for CRUD operations
- `moveRecipientProcessingLocation` transactional function
- Transfer detection service functions
- Risk flag calculation for UI display

**Item 16c Will Implement** (UI):
- Embedded RecipientProcessingLocation table on Recipient detail page
- Inline add/edit/deactivate controls
- Row actions menu with "Move location" dialog
- Real-time inline warnings for risky locations
- Risk badges: "EU-only", "Third-country with SCC", "Third-country missing mechanism"
- TanStack Table wiring, shadcn components

**Contract Examples**:
```typescript
// Item 15 provides this tRPC API:
const locations = api.recipientProcessingLocations.getActiveForRecipient.useQuery({
  recipientId: 'recipient-123'
})

// Item 16c will consume it:
<RecipientLocationsTable
  recipientId={recipientId}
  locations={locations.data}
  onMove={(locationId, updates) => moveMutation.mutate({ locationId, updates })}
/>
```

### Item 38: Document Generation Snapshot Requirements

**Reference Only** (not implementing in Item 15):

**DPIA Generation Needs**:
- Snapshot of RecipientProcessingLocation records at document generation time
- Include in document metadata for regeneration consistency
- Display in cross-border transfer sections with country, mechanism, risk level

**Snapshot Pattern**:
```typescript
// When generating DPIA:
const snapshot = {
  timestamp: new Date(),
  recipients: await prisma.recipient.findMany({
    where: { activityId },
    include: {
      processingLocations: {
        where: { isActive: true },
        include: { country: true, transferMechanism: true }
      }
    }
  }),
  transferAnalysis: await getActivityTransferAnalysis(activityId)
}

// Store in document.metadata for regeneration
```

---

## 8. Testing Strategy

### Unit Tests

**Location**: `packages/database/__tests__/unit/services/transferDetection.test.ts`

**Test Coverage**:

```typescript
describe('Transfer Detection Helper Functions', () => {
  describe('isSameJurisdiction', () => {
    it('should return true for two EU countries', () => {
      const france = createCountry({ gdprStatus: ['EU', 'EEA'] })
      const germany = createCountry({ gdprStatus: ['EU'] })
      expect(isSameJurisdiction(france, germany)).toBe(true)
    })

    it('should return false for EU and third country', () => {
      const france = createCountry({ gdprStatus: ['EU', 'EEA'] })
      const usa = createCountry({ gdprStatus: ['Third Country'] })
      expect(isSameJurisdiction(france, usa)).toBe(false)
    })
  })

  describe('isThirdCountry', () => {
    it('should return false for EU country', () => {
      const france = createCountry({ gdprStatus: ['EU', 'EEA'] })
      expect(isThirdCountry(france)).toBe(false)
    })

    it('should return true for non-EU/EEA/Adequate country', () => {
      const usa = createCountry({ gdprStatus: ['Third Country'] })
      expect(isThirdCountry(usa)).toBe(true)
    })
  })

  describe('requiresSafeguards', () => {
    it('should return true for EU to third country transfer', () => {
      const france = createCountry({ gdprStatus: ['EU', 'EEA'] })
      const china = createCountry({ gdprStatus: ['Third Country'] })
      expect(requiresSafeguards(france, china)).toBe(true)
    })

    it('should return false for third country to third country', () => {
      const usa = createCountry({ gdprStatus: ['Third Country'] })
      const china = createCountry({ gdprStatus: ['Third Country'] })
      expect(requiresSafeguards(usa, china)).toBe(false)
    })
  })

  describe('deriveTransferRisk', () => {
    it('should return NONE for same jurisdiction', () => {
      const france = createCountry({ gdprStatus: ['EU'] })
      const germany = createCountry({ gdprStatus: ['EU'] })
      const risk = deriveTransferRisk(france, germany, null)
      expect(risk.level).toBe('NONE')
    })

    it('should return LOW for adequacy decision', () => {
      const france = createCountry({ gdprStatus: ['EU'] })
      const canada = createCountry({ gdprStatus: ['Adequate'] })
      const risk = deriveTransferRisk(france, canada, null)
      expect(risk.level).toBe('LOW')
    })

    it('should return CRITICAL for third country without mechanism', () => {
      const france = createCountry({ gdprStatus: ['EU'] })
      const usa = createCountry({ gdprStatus: ['Third Country'] })
      const risk = deriveTransferRisk(france, usa, null)
      expect(risk.level).toBe('CRITICAL')
    })

    it('should return MEDIUM for third country with mechanism', () => {
      const france = createCountry({ gdprStatus: ['EU'] })
      const usa = createCountry({ gdprStatus: ['Third Country'] })
      const mechanism = createTransferMechanism({ code: 'SCC' })
      const risk = deriveTransferRisk(france, usa, mechanism)
      expect(risk.level).toBe('MEDIUM')
    })
  })
})
```

### Integration Tests

**Location**: `packages/database/__tests__/integration/dal/recipientProcessingLocations.integration.test.ts`

**Test Coverage**:

```typescript
describe('RecipientProcessingLocation DAL', () => {
  let testOrg: Organization
  let testRecipient: Recipient
  let euCountry: Country
  let usCountry: Country
  let transferMechanism: TransferMechanism

  beforeAll(async () => {
    const { org } = await createTestOrganization()
    testOrg = org
    testRecipient = await createTestRecipient({ organizationId: org.id })
    euCountry = await createTestCountry({ gdprStatus: ['EU', 'EEA'] })
    usCountry = await createTestCountry({ gdprStatus: ['Third Country'] })
    transferMechanism = await createTestTransferMechanism({ code: 'SCC' })
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('createRecipientProcessingLocation', () => {
    it('should create location with valid data', async () => {
      const location = await createRecipientProcessingLocation({
        organizationId: testOrg.id,
        recipientId: testRecipient.id,
        service: 'Email processing',
        countryId: euCountry.id,
        locationRole: 'PROCESSING'
      })

      expect(location).toBeDefined()
      expect(location.service).toBe('Email processing')
      expect(location.isActive).toBe(true)
    })

    it('should enforce transfer mechanism for third country', async () => {
      // Set org country to EU
      await prisma.organization.update({
        where: { id: testOrg.id },
        data: { countryId: euCountry.id }
      })

      // Attempt to create US location without mechanism
      await expect(
        createRecipientProcessingLocation({
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'US data center',
          countryId: usCountry.id,
          locationRole: 'HOSTING'
        })
      ).rejects.toThrow(/transfer mechanism required/i)
    })

    it('should allow third country location with mechanism', async () => {
      const location = await createRecipientProcessingLocation({
        organizationId: testOrg.id,
        recipientId: testRecipient.id,
        service: 'US data center with SCC',
        countryId: usCountry.id,
        locationRole: 'HOSTING',
        transferMechanismId: transferMechanism.id
      })

      expect(location).toBeDefined()
      expect(location.transferMechanismId).toBe(transferMechanism.id)
    })
  })

  describe('moveRecipientProcessingLocation', () => {
    it('should move location and deactivate old record', async () => {
      const original = await createRecipientProcessingLocation({
        organizationId: testOrg.id,
        recipientId: testRecipient.id,
        service: 'Original location',
        countryId: euCountry.id,
        locationRole: 'HOSTING'
      })

      const moved = await moveRecipientProcessingLocation(original.id, {
        countryId: usCountry.id,
        transferMechanismId: transferMechanism.id
      })

      expect(moved.id).not.toBe(original.id)
      expect(moved.countryId).toBe(usCountry.id)
      expect(moved.isActive).toBe(true)

      const oldLocation = await prisma.recipientProcessingLocation.findUnique({
        where: { id: original.id }
      })
      expect(oldLocation?.isActive).toBe(false)
    })

    it('should enforce validation on move', async () => {
      const original = await createRecipientProcessingLocation({
        organizationId: testOrg.id,
        recipientId: testRecipient.id,
        service: 'EU location',
        countryId: euCountry.id,
        locationRole: 'HOSTING'
      })

      await expect(
        moveRecipientProcessingLocation(original.id, {
          countryId: usCountry.id // Missing mechanism
        })
      ).rejects.toThrow(/transfer mechanism required/i)
    })
  })

  describe('hierarchy traversal', () => {
    it('should get locations with parent chain', async () => {
      // Create processor with location
      const processor = await createTestRecipient({ organizationId: testOrg.id })
      const processorLocation = await createRecipientProcessingLocation({
        organizationId: testOrg.id,
        recipientId: processor.id,
        service: 'Processor service',
        countryId: euCountry.id,
        locationRole: 'PROCESSING'
      })

      // Create sub-processor with parent link and location
      const subProcessor = await createTestRecipient({
        organizationId: testOrg.id,
        parentRecipientId: processor.id
      })
      const subProcessorLocation = await createRecipientProcessingLocation({
        organizationId: testOrg.id,
        recipientId: subProcessor.id,
        service: 'Sub-processor service',
        countryId: usCountry.id,
        locationRole: 'PROCESSING',
        transferMechanismId: transferMechanism.id
      })

      // Get locations with parent chain
      const result = await getLocationsWithParentChain(subProcessor.id, testOrg.id)

      expect(result).toHaveLength(2)
      expect(result[0].depth).toBe(0) // Sub-processor
      expect(result[1].depth).toBe(1) // Parent processor
    })
  })
})
```

### API Tests (tRPC)

**Location**: `apps/web/__tests__/api/recipientProcessingLocations.test.ts`

**Test Coverage**:

```typescript
describe('recipientProcessingLocations tRPC Router', () => {
  describe('create', () => {
    it('should create location with valid input', async () => {
      const caller = createTestCaller({ persona: 'DPO' })
      const location = await caller.recipientProcessingLocations.create({
        recipientId: testRecipient.id,
        service: 'Test service',
        countryId: testCountry.id,
        locationRole: 'PROCESSING'
      })

      expect(location).toBeDefined()
      expect(location.service).toBe('Test service')
    })

    it('should reject invalid input', async () => {
      const caller = createTestCaller({ persona: 'DPO' })
      await expect(
        caller.recipientProcessingLocations.create({
          recipientId: 'invalid',
          service: 'ab', // Too short
          countryId: testCountry.id,
          locationRole: 'PROCESSING'
        })
      ).rejects.toThrow()
    })
  })

  describe('detectTransfers', () => {
    it('should detect cross-border transfers', async () => {
      const caller = createTestCaller({ persona: 'DPO' })
      const transfers = await caller.recipientProcessingLocations.detectTransfers()

      expect(transfers).toBeInstanceOf(Array)
      transfers.forEach(t => {
        expect(t).toHaveProperty('transferRisk')
        expect(t).toHaveProperty('organizationCountry')
        expect(t).toHaveProperty('processingLocation')
      })
    })
  })
})
```

### Test Data Setup Patterns

```typescript
// Test factory for RecipientProcessingLocation
export async function createTestRecipientProcessingLocation(
  overrides?: Partial<RecipientProcessingLocation>
): Promise<RecipientProcessingLocation> {
  const org = await createTestOrganization()
  const recipient = await createTestRecipient({ organizationId: org.id })
  const country = await createTestCountry({ gdprStatus: ['EU'] })

  return prisma.recipientProcessingLocation.create({
    data: {
      organizationId: org.id,
      recipientId: recipient.id,
      service: 'Test service',
      countryId: country.id,
      locationRole: 'PROCESSING',
      isActive: true,
      ...overrides
    }
  })
}

// Test scenario: EU org with US processor
export async function createEuToUsTransferScenario() {
  const org = await createTestOrganization({ countryCode: 'FR' })
  const recipient = await createTestRecipient({ organizationId: org.id })
  const usCountry = await createTestCountry({ gdprStatus: ['Third Country'], isoCode: 'US' })
  const sccMechanism = await createTestTransferMechanism({ code: 'SCC' })

  const location = await createTestRecipientProcessingLocation({
    organizationId: org.id,
    recipientId: recipient.id,
    countryId: usCountry.id,
    transferMechanismId: sccMechanism.id
  })

  return { org, recipient, location, usCountry, sccMechanism }
}
```

---

## 9. Migration Strategy

### New Model, No Existing Data

**Migration Type**: Create table migration (no data migration required)

**Migration File**: `packages/database/prisma/migrations/YYYYMMDDHHMMSS_add_recipient_processing_location/migration.sql`

```sql
-- CreateTable
CREATE TABLE "RecipientProcessingLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "purposeId" TEXT,
    "purposeText" TEXT,
    "countryId" TEXT NOT NULL,
    "locationRole" "LocationRole" NOT NULL,
    "transferMechanismId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipientProcessingLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipientProcessingLocation_organizationId_recipientId_idx" ON "RecipientProcessingLocation"("organizationId", "recipientId");

-- CreateIndex
CREATE INDEX "RecipientProcessingLocation_organizationId_countryId_idx" ON "RecipientProcessingLocation"("organizationId", "countryId");

-- CreateIndex
CREATE INDEX "RecipientProcessingLocation_organizationId_transferMechanism_idx" ON "RecipientProcessingLocation"("organizationId", "transferMechanismId");

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "Purpose"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_transferMechanismId_fkey" FOREIGN KEY ("transferMechanismId") REFERENCES "TransferMechanism"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### No Backward Compatibility Concerns

**Rationale**: New feature with no existing data or dependencies

**Rollback Strategy**: Drop table if needed (no data loss risk)

```sql
-- Rollback migration
DROP TABLE "RecipientProcessingLocation";
```

### Seed Data Considerations

**Required Reference Data** (already present from Item 3):
- Country records with gdprStatus JSON
- TransferMechanism records (SCC, BCR, DPF, etc.)

**Optional Seed Data** (for testing/demo):
```typescript
// Seed example recipient processing locations
export async function seedExampleRecipientLocations() {
  const org = await prisma.organization.findFirst()
  if (!org) return

  const mailchimp = await prisma.recipient.findFirst({
    where: { name: { contains: 'Mailchimp' } }
  })
  if (!mailchimp) return

  const usCountry = await prisma.country.findUnique({ where: { isoCode: 'US' } })
  const scc = await prisma.transferMechanism.findFirst({ where: { code: 'SCC' } })

  if (usCountry && scc) {
    await prisma.recipientProcessingLocation.create({
      data: {
        organizationId: org.id,
        recipientId: mailchimp.id,
        service: 'Email delivery and analytics',
        countryId: usCountry.id,
        locationRole: 'BOTH',
        transferMechanismId: scc.id,
        isActive: true
      }
    })
  }
}
```

---

## 10. Implementation Notes

### Code Reuse from Item 14

**Files to Reference**:
- `packages/database/src/dal/assetProcessingLocations.ts` - Nearly identical DAL structure
- `packages/database/prisma/schema.prisma` - AssetProcessingLocation model as template

**Copy-Paste-Modify Approach**:
1. Copy AssetProcessingLocation DAL file
2. Find/Replace: `assetProcessingLocation` → `recipientProcessingLocation`
3. Find/Replace: `digitalAssetId` → `recipientId`
4. Find/Replace: `digitalAsset` → `recipient`
5. Add `moveRecipientProcessingLocation` function (new for Item 15)
6. Add `getLocationsWithParentChain` function (new for Item 15, uses hierarchy)

**Benefits**:
- Proven patterns, already tested in production
- Consistent API surface across asset and recipient locations
- Developers can transfer knowledge directly

### Multi-Tenancy Filtering Patterns

**All DAL functions** must enforce multi-tenancy via organizationId:

```typescript
// Pattern 1: Validate entity belongs to organization
const recipient = await prisma.recipient.findUnique({
  where: { id: recipientId }
})
if (!recipient || recipient.organizationId !== organizationId) {
  throw new Error('Unauthorized')
}

// Pattern 2: Filter queries by organizationId
const locations = await prisma.recipientProcessingLocation.findMany({
  where: {
    organizationId, // ALWAYS include
    // ... other filters
  }
})

// Pattern 3: Use organizationId from parent entity
const location = await prisma.recipientProcessingLocation.findUnique({
  where: { id: locationId },
  include: {
    recipient: { select: { organizationId: true } }
  }
})
// Validate location.recipient.organizationId === ctx.user.organizationId
```

### Transaction Handling for moveRecipientProcessingLocation

**Critical Requirements**:
- Must be atomic: both create new + deactivate old, or neither
- Must validate before transaction begins (fail fast)
- Must preserve referential integrity

**Pattern**:
```typescript
export async function moveRecipientProcessingLocation(...) {
  return prisma.$transaction(async (tx) => {
    // Step 1: Read (using tx client)
    const existing = await tx.recipientProcessingLocation.findUnique(...)

    // Step 2: Validate (throw if invalid)
    if (!validation.valid) throw new Error(validation.error)

    // Step 3: Create new (using tx client)
    const newLocation = await tx.recipientProcessingLocation.create(...)

    // Step 4: Deactivate old (using tx client)
    await tx.recipientProcessingLocation.update(...)

    // Step 5: Return new location
    return newLocation
  })
  // If any step fails, entire transaction rolls back
}
```

### Error Handling Patterns

**DAL Layer**:
```typescript
// Throw specific errors with context
if (!recipient) {
  throw new Error('Recipient not found')
}

if (recipient.organizationId !== organizationId) {
  throw new Error('Recipient does not belong to organization')
}

if (!validation.valid) {
  throw new Error(validation.error) // Includes GDPR article reference
}
```

**Service Layer**:
```typescript
// Return structured errors or null
export async function detectCrossBorderTransfers(organizationId: string) {
  try {
    // ... detection logic
    return transfers
  } catch (error) {
    console.error('Transfer detection failed:', error)
    return [] // Return empty array, don't throw
  }
}
```

**tRPC Layer**:
```typescript
try {
  return await createRecipientProcessingLocation(...)
} catch (error) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: error instanceof Error ? error.message : 'Failed to create location'
  })
}
```

---

## 11. Scope Boundaries

### IN SCOPE for Item 15 (Backend/API/Service Layer)

**Database**:
- RecipientProcessingLocation model with all specified fields
- Schema migration and indexes
- Foreign key relationships and cascade rules

**Data Access Layer**:
- createRecipientProcessingLocation with hard validation
- getActiveLocationsForRecipient
- getAllLocationsForRecipient
- updateRecipientProcessingLocation with validation
- deactivateRecipientProcessingLocation (soft delete)
- moveRecipientProcessingLocation (transactional)
- getLocationsByCountry
- getLocationsWithParentChain (hierarchy traversal)

**Service Layer**:
- isSameJurisdiction helper function
- isThirdCountry helper function
- requiresSafeguards helper function
- deriveTransferRisk helper function
- validateTransferMechanismRequirement function
- detectCrossBorderTransfers main function
- getActivityTransferAnalysis main function

**API**:
- tRPC router: recipientProcessingLocationsRouter
- All CRUD procedures with validation
- Transfer detection procedures
- Zod input schemas

**Testing**:
- Unit tests for helper functions
- Integration tests for DAL operations
- API tests for tRPC procedures
- Test factories and setup patterns

**Documentation**:
- JSDoc comments on all functions
- Migration SQL with explanatory comments
- Architectural decision documentation

### DEFERRED to Item 16c (Recipient Management UI)

**UI Components**:
- Embedded RecipientProcessingLocation table component
- Location form (add/edit modal)
- Row actions menu with "Move location" option
- "Move location" dialog component
- Deactivate confirmation dialog
- Real-time inline warnings for risky locations
- Risk badges display ("EU-only", "Third-country with SCC", etc.)

**UI Patterns**:
- TanStack Table wiring for location table
- shadcn/ui component integration (Dialog, Form, Badge, Alert)
- React Hook Form for location forms
- Zod validation hooks for client-side validation
- tRPC hooks (useQuery, useMutation) for data fetching

**Hierarchy View Enhancements**:
- Small indicators per recipient node ("3 locations · 1 third-country w/o mechanism")
- Filters/badges for active vs inactive location risk
- Tooltip with location details on hover

### DEFERRED to Later Items

**ActivityReview UI Integration** (Item 38 or later):
- Show linked recipients with location risk badges in ActivityReview UI
- Small "Cross-border risks" summary section in activity detail
- Deep link to recipient location management from activity

**Dashboard Analytics** (Items 42-43+):
- Standalone "Recipient Locations" management page with global filtering
- Global "risky locations" dashboard view
- Geographic compliance map visualization
- Email notifications for transfer risks
- Dedicated dashboard widgets for transfer detection
- Trend analysis and risk scoring over time

### OUT OF SCOPE (Future Work)

**Advanced Features**:
- Advanced transfer risk scoring beyond basic mechanism detection (e.g., country stability scores, political risk)
- Bulk CSV import/export of locations
- Complex timeline visualizations of location history
- External vendor database integrations (auto-discovery of processor locations)
- Automatic location discovery via API scanning
- Machine learning for risk prediction

**Field Enhancements**:
- Autocomplete or controlled vocabulary for service field (keeping parity with Item 14)
- Service catalog FK (may evolve if patterns emerge)
- RecipientProcessingLocationHistory separate versioning table (using isActive + ComponentChangeLog instead)

**UI Enhancements**:
- Nested location trees in hierarchy view (showing parent chain in tree structure)
- Drag-and-drop location reordering
- Location templates or presets
- Bulk location operations (bulk update, bulk deactivate)

---

## 12. Open Questions & Decisions

### All Questions Answered in Requirements Phase

All architectural and implementation questions were resolved during the spec-researcher phase. Key decisions documented below for reference.

### Key Decision 1: Hard Validation for transferMechanismId

**Question**: Should transferMechanismId be hard-required or soft-recommended when third country requires safeguards?

**Decision**: HARD validation at location creation/update. If third-country transfer requires safeguards, transferMechanismId is REQUIRED. Save must fail if missing with clear error message.

**Rationale**:
- Prevents compliance violations at data entry point
- Clearer user experience (fail fast with actionable error)
- Reduces technical debt (no "incomplete" records to track)
- Aligns with GDPR Article 46 legal requirements (safeguards are mandatory, not optional)

**Implementation**: Validation in DAL layer before database write, with error message referencing GDPR Article 46.

### Key Decision 2: isActive Historical Tracking Pattern

**Question**: Should location changes use isActive flag or separate history table?

**Decision**: Set isActive=false on old records when locations change, create new active record. No separate history table.

**Rationale**:
- Simpler schema (no additional table)
- Audit trail preserved in same table
- Queries for active vs historical data are straightforward
- Consistent with existing patterns in codebase
- ComponentChangeLog (Item 16) provides detailed change tracking

**Implementation**: moveRecipientProcessingLocation function handles pattern atomically in transaction.

### Key Decision 3: Scope Split Between Item 15 and 16c

**Question**: Should UI be implemented in Item 15 or deferred?

**Decision**: Item 15 focuses exclusively on backend/API/service layer. UI implementation deferred to Item 16c (Recipient Management UI).

**Rationale**:
- Separation of concerns (backend vs frontend)
- Backend can be tested independently
- UI can iterate based on backend contract
- Allows parallel work (backend team + frontend team)
- Keeps Item 15 scope tight (2-3 weeks, M size)

**Contract**: Item 15 provides tRPC API, Item 16c consumes it.

### Key Decision 4: service Field as Free Text

**Question**: Should service field be free text or controlled vocabulary?

**Decision**: Keep pure free text for service field in Item 15. Provide clear help text and example values. No autocomplete or controlled vocabulary yet.

**Rationale**:
- Flexibility for diverse use cases
- Avoid premature optimization (don't know patterns yet)
- Parity with Item 14 (AssetProcessingLocation uses free text)
- Can evolve to service catalog FK if patterns emerge

**Guidance**: Help text: "Describe the specific service or activity this recipient performs at this location. Examples: 'Email delivery via SendGrid API', 'BigQuery analytics', 'S3 backup storage'."

### Key Decision 5: Move Location UI Placement

**Question**: Where should "Move Location" helper action appear in UI?

**Decision**: Row actions menu (... menu) on each location row in the embedded table. Dialog opens on click.

**Rationale**:
- Standard UX pattern (actions menu per row)
- Clear visual hierarchy (action belongs to specific location)
- Consistent with other CRUD actions (Edit, Delete)

**Implementation**: Item 15 provides moveRecipientProcessingLocation backend function, Item 16c implements UI.

### Key Decision 6: Recipient Completeness Warnings

**Question**: Should recipients without locations be blocked or warned?

**Decision**: Allow creating PROCESSOR/SUB_PROCESSOR recipients without locations initially. Show non-blocking warning on save. Track "missing locations" as completeness issue for future dashboards.

**Rationale**:
- Progressive data entry (don't force everything at once)
- Real-world workflow: recipient created first, locations added later
- Soft warnings guide users without blocking
- Completeness tracking enables dashboard metrics (Items 42-43+)

**Implementation**: Service layer provides checkRecipientLocationCompleteness() function, UI displays warnings in Item 16c.

---

## Summary

This specification defines the complete backend/API/service layer for RecipientProcessingLocation and cross-border transfer detection (Roadmap Item 15). It provides:

1. **Database Schema**: Complete RecipientProcessingLocation model with indexes, cascade rules, and business rationale
2. **Business Rules**: Hard validation for transferMechanismId, isActive historical tracking, service field guidance, completeness checks
3. **Data Access Layer**: 8 DAL functions including transactional moveRecipientProcessingLocation and hierarchy traversal
4. **Service Layer**: 6 helper functions + 2 main functions for transfer detection with structured interfaces
5. **tRPC API**: Complete router with 10 procedures for CRUD operations and transfer analysis
6. **Integration Points**: Clear contracts with Items 12, 14, 16, 16c, and 38
7. **Testing Strategy**: Unit, integration, and API test coverage with factory patterns
8. **Migration Strategy**: New table migration with seed data considerations
9. **Implementation Notes**: Code reuse guidance, multi-tenancy patterns, transaction handling, error patterns
10. **Scope Boundaries**: Clear IN SCOPE (backend), DEFERRED (Item 16c UI), and OUT OF SCOPE (future work)
11. **Decisions**: All architectural questions resolved with documented rationale

**Ready for Implementation**: This specification provides all information needed for developers to implement Item 15 without additional research. UI implementation is cleanly deferred to Item 16c with explicit contract definition.

**Size Estimate Reaffirmed**: M (Medium) - Approximately 2-3 weeks for backend/API/service layer implementation and testing.
