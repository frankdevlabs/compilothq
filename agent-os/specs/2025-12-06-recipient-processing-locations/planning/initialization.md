# Spec Initialization: Roadmap Item 15

## Spec Name

RecipientProcessingLocation Model and Cross-Border Transfer Detection

## Roadmap Item Reference

Roadmap Item #15: Recipient Processing Locations & Transfer Detection

## Initial Request

> roadmap no. 15. I want you to take into account @agent-os/specs/README-items-14-16.md

## Guidance Document Context

**Reference Document:** `/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/README-items-14-16.md`

### Purpose

Track WHERE a recipient/processor processes data (parallel to AssetProcessingLocation implemented in Item 14). Enable service layer to derive cross-border transfers by comparing organization country with processing locations.

### Key Architectural Decisions

1. **Processing locations are properties of entities (recipients)** - NOT separate transfer entities
2. **Cross-border transfers are DERIVED via service layer composition** - NOT stored as database entities
3. **Uses Country.gdprStatus JSON for compliance logic** - to identify EU/EEA vs third countries
4. **Includes transfer mechanism validation** - for third countries requiring safeguards under Article 46
5. **Supports sub-processor chain traversal** - via Recipient hierarchy (parentRecipient relationships)

### Core Model: RecipientProcessingLocation

**Schema Pattern (from guidance):**

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

**Reuses LocationRole enum from Item 14:**
- HOSTING
- PROCESSING
- BOTH

### Service Layer: Transfer Detection

**Core Function Pattern:**

```typescript
// Detect all cross-border transfers for an organization
export async function detectCrossBorderTransfers(
  organizationId: string
): Promise<CrossBorderTransfer[]>

// Analyze transfers for a specific activity
export async function getActivityTransferAnalysis(
  activityId: string
): Promise<ActivityTransferAnalysis>

// Helper functions
function isSameJurisdiction(country1: Country, country2: Country): boolean
function isThirdCountry(country: Country): boolean
function requiresSafeguards(origin: Country, destination: Country): boolean
```

**Key Logic:**
- Compare Organization.headquartersCountryId with RecipientProcessingLocation.countryId
- Use Country.gdprStatus JSON to determine legal framework
- Flag locations without transferMechanismId when safeguards required
- Traverse recipient parentRecipient hierarchy to include sub-processor locations

### Sub-Processor Chain Support

**Query Pattern (from guidance):**

```typescript
// Get all locations in a sub-processor chain
const recipient = await prisma.recipient.findUnique({
  where: { id: recipientId },
  include: {
    processingLocations: { where: { isActive: true } },
    parentRecipient: {
      include: {
        processingLocations: { where: { isActive: true } },
        parentRecipient: {
          include: {
            processingLocations: { where: { isActive: true } }
          }
        }
      }
    }
  }
})
```

### Business Rules

1. **transferMechanismId Requirement:**
   - NULL if processing within same legal framework (e.g., both EU countries)
   - REQUIRED if countryId is third country without adequacy decision
   - Validation in service layer using Country.gdprStatus JSON

2. **isActive Flag:**
   - false for historical locations (preserve audit trail)
   - Only isActive = true locations included in compliance queries
   - Historical locations queryable for document regeneration snapshots

3. **service Field:**
   - Free text initially (e.g., "Email delivery via SendGrid")
   - Keep specific: "Email sending" not just "Email"
   - May evolve to service catalog FK if patterns emerge

### Index Rationale

- `(organizationId, recipientId)` - Get all locations for a recipient: "Where does Mailchimp process data?"
- `(organizationId, countryId)` - Geographic compliance: "Show all processing in United States"
- `(organizationId, transferMechanismId)` - Mechanism auditing: "Show all locations using Standard Contractual Clauses"

### Prerequisites (Already Implemented)

- **Item 3:** Country model with gdprStatus JSON, TransferMechanism model
- **Item 8:** DataProcessingActivity with junction table patterns
- **Item 12:** Recipient model with parentRecipientId hierarchy support
- **Item 14:** AssetProcessingLocation (parallel pattern), LocationRole enum

### Size Estimate

**M (Medium)** - Approximately 2-3 weeks

**Complexity Drivers:**
- Service layer composition (4 helper functions + 2 main functions)
- Recipient hierarchy traversal logic
- Country.gdprStatus JSON parsing and matching
- Transfer safeguard requirement calculation

### Integration Points

**Item 16 (Component Change Tracking):**
- Extend ComponentType enum to include "RecipientProcessingLocation"
- Change detection middleware for location updates
- Trigger document regeneration when country or mechanism changes

**Future Item 38 (DPIA Generation):**
- Snapshot recipient processing locations in document metadata
- Include transfer analysis in cross-border transfer sections
- Show all sub-processor chain locations in DPIA tables

### Product Mission Alignment

From `/Users/frankdevlab/WebstormProjects/compilothq/agent-os/product/mission.md`:

**Target Users:**
- Privacy Officers / DPOs: Need to answer auditor queries like "show me all activities with US transfers"
- Legal Counsel: Need confidence in cross-border transfer documentation quality
- IT Managers: Responsible for data security and geographic compliance

**Core Problem Solved:**
Maintaining structured, reusable data while producing text-driven legal documents. This spec enables:
- Single source of truth for recipient processing locations (update once, all documents reflect changes)
- Automatic cross-border transfer detection via service layer composition
- Professional DPIA generation with accurate transfer mechanisms and geographic compliance

**Differentiators Enabled:**
- Compliance Guardrails: "USA transfer requires supplementary measures post-Schrems II"
- Single Source of Truth: Update processing location once, all DPIAs update automatically
- Professional Document Generation: Accurate processor location tables in Word format

### Roadmap Context

From `/Users/frankdevlab/WebstormProjects/compilothq/agent-os/product/roadmap.md`:

**Status:** Milestone 4 - Entity Relationships
- Item 14 (DigitalAsset & AssetProcessingLocation): ✓ Complete
- Item 15 (RecipientProcessingLocation & Transfer Detection): Current
- Item 16 (Component Change Tracking Extended): Next

**MVP Goal:** Enable core value proposition - component library + questionnaires + document generation + dashboard

**This Spec Contributes:**
- Geographic compliance tracking for recipients/processors
- Cross-border transfer detection for DPIA requirements (Article 46)
- Foundation for transfer mechanism validation in dashboards

## Spec Folder Path

`/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-12-06-recipient-processing-locations`

## Next Steps

1. Requirements gathering phase (spec-researcher agent)
2. Technical specification writing (spec-writer agent)
3. Implementation planning and task breakdown

## Initialization Timestamp

2025-12-05
