# Spec Requirements: Component Change Tracking (Item 16)

## Initial Description

Extend the existing ComponentChangeLog system to track changes to 3 new component types:

- DigitalAsset
- AssetProcessingLocation
- RecipientProcessingLocation

This builds on the foundation laid by Items 14 (DigitalAsset + AssetProcessingLocation) and 15 (RecipientProcessingLocation) to enable comprehensive change tracking for geographic compliance.

Core requirements include:

1. Extend ComponentType enum with new values
2. Implement Prisma middleware for location change tracking
3. Detect critical field changes (countryId, transferMechanismId)
4. Track affected documents when critical fields change
5. Support future document regeneration workflow (Item 45)

## Requirements Discussion

### First Round Questions

**Context Note:**
Based on product mission and roadmap analysis, the system maintains structured compliance data where changes to geographic processing locations (country, transfer mechanism) can impact multiple generated documents. The change tracking system serves as the foundation for Item 45 (Document Regeneration Workflow) by creating an audit trail and identifying affected documents.

**Q1: ComponentChangeLog Model**
**Question:** I assume we need to CREATE the ComponentChangeLog model FROM SCRATCH (as it doesn't exist yet in your schema based on roadmap context). Should I define a complete model with componentType (string), componentId, changeType enum (CREATED, UPDATED, DELETED), oldValue/newValue JSON, changedByUserId (nullable for system jobs), changeReason (optional text), and all standard multi-tenancy fields (organizationId with cascading delete)?

**Answer:** CREATE FROM SCRATCH ✅

Complete model definition provided:

```prisma
model ComponentChangeLog {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  componentType   String   // "AssetProcessingLocation", "RecipientProcessingLocation", "Purpose", etc.
  componentId     String   // CUID of the component

  changeType      ChangeType
  fieldChanged    String?  // e.g., "countryId", "transferMechanismId", null for CREATED
  oldValue        Json?    // flattened snapshot (see Q4)
  newValue        Json?    // flattened snapshot

  changedByUserId String?  // nullable for system-initiated changes
  changedBy       User?    @relation(fields: [changedByUserId], references: [id], onDelete: SetNull)

  changeReason    String?  // optional text from UI
  changedAt       DateTime @default(now())

  @@index([organizationId, componentType, componentId, changedAt])
  @@index([changedAt])
  @@index([organizationId, changedAt])
}

enum ChangeType {
  CREATED
  UPDATED
  DELETED
}
```

**Q2: AffectedDocument & GeneratedDocument Model**
**Question:** The roadmap mentions AffectedDocument linking ComponentChangeLog to GeneratedDocuments. I'm assuming we should DEFINE BOTH MODELS NOW (at least minimally), even though full document generation comes in Items 37-40. Should GeneratedDocument include documentType enum (ROPA, DPIA, LIA, DPA, PRIVACY_STATEMENT, DTIA), dataSnapshot JSON, and basic version tracking? And should AffectedDocument include impactType enum with values like TRANSFER_SECTION_OUTDATED, MECHANISM_SECTION_OUTDATED, LOCATION_CHANGED?

**Answer:** DEFINE BOTH MODELS NOW (MINIMAL), EXTEND LATER ✅

GeneratedDocumentType enum:

```prisma
enum GeneratedDocumentType {
  ROPA
  DPIA
  LIA
  DPA
  PRIVACY_STATEMENT
  DTIA
}
```

Comprehensive ImpactType enum with categories:

```prisma
enum ImpactType {
  // Transfer/Location impacts
  TRANSFER_SECTION_OUTDATED
  MECHANISM_SECTION_OUTDATED
  LOCATION_CHANGED
  LOCATION_ADDED
  LOCATION_REMOVED
  THIRD_COUNTRY_ADDED
  SAFEGUARD_REMOVED

  // Taxonomy impacts
  PURPOSE_SECTION_OUTDATED
  LEGAL_BASIS_SECTION_OUTDATED
  DATA_CATEGORY_SECTION_OUTDATED
  DATA_SUBJECT_SECTION_OUTDATED
  RECIPIENT_SECTION_OUTDATED

  // Activity impacts
  ACTIVITY_RISK_LEVEL_CHANGED
  ACTIVITY_DPIA_REQUIREMENT_CHANGED
  RETENTION_SECTION_OUTDATED

  // Generic
  OTHER_COMPONENT_CHANGED
}
```

Minimal GeneratedDocument schema (to be extended in Items 37-40):

```prisma
model GeneratedDocument {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  documentType   GeneratedDocumentType
  version        String   // "1.0", "1.1", etc.

  // Nullable FKs linking to source
  assessmentId            String?
  dataProcessingActivityId String?

  // Frozen component data at generation time (Items 37-40 will define structure)
  dataSnapshot   Json

  // File references (Items 38-41 will populate)
  wordFileUrl    String?
  pdfFileUrl     String?
  markdownContent String?

  generatedAt    DateTime @default(now())
  generatedBy    String?
  generatedByUser User?   @relation(fields: [generatedBy], references: [id], onDelete: SetNull)

  status         DocumentStatus @default(DRAFT)

  @@index([organizationId, documentType, status])
  @@index([generatedAt])
}

enum DocumentStatus {
  DRAFT
  FINAL
  SUPERSEDED
  ARCHIVED
}
```

AffectedDocument schema:

```prisma
model AffectedDocument {
  id                   String   @id @default(cuid())
  organizationId       String
  organization         Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  generatedDocumentId  String
  generatedDocument    GeneratedDocument @relation(fields: [generatedDocumentId], references: [id], onDelete: Cascade)

  componentChangeLogId String
  componentChangeLog   ComponentChangeLog @relation(fields: [componentChangeLogId], references: [id], onDelete: Cascade)

  impactType          ImpactType
  impactDescription   String   // Human-readable: "Google Cloud location changed from Ireland to USA"

  detectedAt          DateTime @default(now())
  reviewedAt          DateTime?
  reviewedBy          String?
  reviewedByUser      User?    @relation(fields: [reviewedBy], references: [id], onDelete: SetNull)

  @@unique([generatedDocumentId, componentChangeLogId])
  @@index([organizationId, generatedDocumentId])
  @@index([organizationId, detectedAt])
}
```

**Q3: Middleware Setup**
**Question:** I'm thinking we should implement the change tracking as a PRISMA EXTENSION in packages/database/src/middleware/changeTracking.ts (following modern Prisma best practices), not old-style middleware. The extension would wrap update operations and accept a context object like ctx.userId and ctx.changeReason. Should we make this ALWAYS ON (with an escape hatch like DISABLE_CHANGE_TRACKING=true for tests/scripts), or opt-in per request?

**Answer:** PRISMA EXTENSION IN packages/database, ALWAYS ON (WITH ESCAPE HATCH) ✅

Implementation details:

- Location: `packages/database/src/middleware/changeTracking.ts`
- Uses Prisma client extensions (not old-style middleware)
- Context includes: userId (optional), changeReason (optional)
- Escape hatch: `DISABLE_CHANGE_TRACKING=true` for tests/scripts
- Extension wraps update operations for tracked models

**Q4: Snapshot Depth**
**Question:** For oldValue/newValue JSON snapshots, should we store JUST THE CHANGED FIELD VALUES (minimal), or FLATTENED FULL ENTITY with denormalized related data (e.g., include country.name not just countryId)? I'm assuming FLATTENED snapshots are better for human readability in change logs ("Country changed from Netherlands (NL, EU/EEA) → USA (US, Third Country)") rather than just IDs that require joins to interpret.

**Answer:** FLATTENED, HUMAN-READABLE SNAPSHOTS (NOT JUST IDS) ✅

Include full nested entities with human-readable fields.

Example snapshot structure:

```json
{
  "locationRole": "HOSTING",
  "country": {
    "id": "clx123",
    "name": "Netherlands",
    "isoCode": "NL",
    "gdprStatus": {
      "isEUEEA": true,
      "isThirdCountry": false,
      "isAdequacyDecision": true
    }
  },
  "transferMechanism": {
    "id": "clx456",
    "name": "Standard Contractual Clauses (2021)",
    "code": "SCC_2021",
    "gdprArticle": "Article 46(2)(c)"
  }
}
```

Similar patterns for Purpose, LegalBasis, DataCategory, DataSubjectCategory.

**Q5: Operation Scope**
**Question:** Should we track ONLY UPDATE operations (field changes), or also CREATE and SOFT-DELETE (when isActive flips to false)? I assume we should track all three to provide complete audit trail: CREATED when component first created, UPDATED when compliance-critical fields change, DELETED when isActive flips from true → false (avoiding hard-deletes on compliance-critical components).

**Answer:** TRACK CREATE, UPDATE, AND SOFT-DELETE (DEACTIVATE) ✅

Log all three operation types:

- CREATED: when component first created
- UPDATED: when compliance-critical fields change
- DELETED: when isActive flips from true → false (soft delete)

Avoid hard-deletes on compliance-critical components.

**Q6: Performance Pattern**
**Question:** For performance, should we LOG SYNCHRONOUSLY (in the same transaction as the update) but DEFER IMPACT ANALYSIS to a background job, or make the entire change-tracking async? I'm assuming synchronous logging (write ComponentChangeLog immediately) is critical for audit integrity, but scanning all GeneratedDocuments to create AffectedDocument records can be deferred to Items 37-40 + background job Item 56.

**Answer:** LOG SYNCHRONOUSLY; DEFER HEAVY IMPACT ANALYSIS TO LATER ITEMS ✅

Synchronous (in-transaction):

- Compare before/after
- Write ComponentChangeLog if critical fields changed

Deferred to Items 37-40 + 56:

- Scanning GeneratedDocument snapshots
- Creating AffectedDocument records in bulk
- Heavy cross-component impact rules

Rationale: Background job infrastructure comes later (Item 56).

**Q7: User Confirmation**
**Question:** Should ALL changes trigger a confirmation dialog in the UI ("You're changing the location from EU to US, this affects 3 DPIAs, continue?"), or should we ALWAYS LOG SILENTLY and only show confirmation for HIGH-IMPACT changes (like removing a transfer mechanism from a third-country location)? I assume silent logging is better UX, with confirmation only for truly breaking changes handled in the UI specs (Items 14/15/16c), not in this backend Item 16.

**Answer:** ALWAYS LOG; UI CONFIRMATION ONLY FOR HIGH-IMPACT CHANGES (IN UI ITEMS) ✅

Change tracking always automatic and silent. UI confirmation handled in UI specs (Items 14/15/16c), not this backend Item 16.

High-impact triggers include:

- Country change EU/EEA → third country
- Removing transfer mechanism from third-country location
- Marking DataSubjectCategory as vulnerable
- Toggling suggestsDPIA
- Changing LegalBasis consent flags

**Q8: Change Reason Context**
**Question:** Should changeReason be ALWAYS REQUIRED (enforced in Prisma schema), OPTIONAL (nullable), or REQUIRED ONLY FOR CERTAIN HIGH-IMPACT CHANGES (conditional validation in service layer)? I assume OPTIONAL FIELD, but the UI can surface a "Why are you making this change?" textarea for location/taxonomy changes, and we store it if provided. Service layer can enforce non-empty changeReason for specific high-impact operations.

**Answer:** OPTIONAL FIELD, SURFACED IN UI FOR SENSITIVE CHANGES ✅

- ctx.changeReason is optional string
- Carried from UI/API into middleware
- Stored in ComponentChangeLog.changeReason
- UI will show textarea for location/taxonomy changes
- For high-impact changes, service layer can enforce non-empty changeReason

**Q9: Impact Types**
**Question:** Should impactType in AffectedDocument be FREE TEXT ("transfer section may be outdated") or ENUM with specific values (TRANSFER_SECTION_OUTDATED, MECHANISM_SECTION_OUTDATED, LOCATION_CHANGED, LOCATION_ADDED, LOCATION_REMOVED, etc.)? I assume ENUM for structured querying ("show all documents with THIRD_COUNTRY_ADDED impacts"). We can expand this enum to include PURPOSE_CHANGED, LEGAL_BASIS_CHANGED, etc. when we extend tracking to other component types beyond locations.

**Answer:** ENUM, EXPANDED TO COVER PURPOSE, LEGAL BASIS & TAXONOMY CHANGES ✅

Complete ImpactType enum already provided in Q2.

Mapping examples provided for all component types:

- AssetProcessingLocation/RecipientProcessingLocation changes → LOCATION_CHANGED, THIRD_COUNTRY_ADDED, etc.
- Purpose changes → PURPOSE_SECTION_OUTDATED
- LegalBasis changes → LEGAL_BASIS_SECTION_OUTDATED
- DataCategory changes → DATA_CATEGORY_SECTION_OUTDATED

**Q10: Tracking Scope**
**Question:** Based on initialization.md focusing on AssetProcessingLocation and RecipientProcessingLocation, should we ONLY implement tracking for those 2 models in Item 16, OR should we also track DigitalAsset, Purpose, LegalBasis, DataCategory, DataSubjectCategory, Recipient, and TransferMechanism changes since the infrastructure will be identical? I assume we should AT LEAST track the 9 key compliance components to avoid implementing the same middleware pattern 7 more times in future items. For each model, which specific fields are "compliance-critical" and should trigger logs (vs. ignoring noise like metadata JSON or purely descriptive text updates)?

**Answer:** TRACK COMPLIANCE-CRITICAL FIELDS ACROSS KEY MODELS; IGNORE NOISE ✅

Models in scope:

1. **AssetProcessingLocation** - countryId, transferMechanismId, locationRole, isActive
2. **RecipientProcessingLocation** - countryId, transferMechanismId, locationRole, isActive
3. **DataProcessingActivity** - riskLevel, requiresDPIA, dpiaStatus, retention fields, status
4. **Purpose** - name, description, category, scope, isActive
5. **LegalBasis** - type, name, framework, consent flags, requirements, isActive
6. **DataCategory** - name, description, sensitivity, isSpecialCategory, isActive
7. **DataSubjectCategory** - name, vulnerability fields, DPIA suggestion fields, isActive
8. **Recipient** - type, externalOrganizationId, purpose, description, hierarchy, isActive
9. **TransferMechanism** - name, code, description, gdprArticle, category, flags, isActive

Complete TRACKED_FIELDS_BY_MODEL configuration provided:

```typescript
const TRACKED_FIELDS_BY_MODEL = {
  AssetProcessingLocation: ['countryId', 'transferMechanismId', 'locationRole', 'isActive'],
  RecipientProcessingLocation: ['countryId', 'transferMechanismId', 'locationRole', 'isActive'],
  DataProcessingActivity: [
    'riskLevel',
    'requiresDPIA',
    'dpiaStatus',
    'retentionPeriodMonths',
    'retentionJustification',
    'status',
  ],
  Purpose: ['name', 'description', 'category', 'scope', 'isActive'],
  LegalBasis: ['type', 'name', 'framework', 'requiresConsent', 'consentMechanism', 'isActive'],
  DataCategory: ['name', 'description', 'sensitivity', 'isSpecialCategory', 'isActive'],
  DataSubjectCategory: ['name', 'isVulnerable', 'vulnerabilityReason', 'suggestsDPIA', 'isActive'],
  Recipient: [
    'type',
    'externalOrganizationId',
    'purpose',
    'description',
    'parentRecipientId',
    'isActive',
  ],
  TransferMechanism: [
    'name',
    'code',
    'description',
    'gdprArticle',
    'category',
    'requiresSupplementaryMeasures',
    'isActive',
  ],
}
```

NOT tracked: metadata JSON, purely descriptive fields, presentation-only fields.

### Follow-up Questions

**Follow-up Q1: Implementation Scope & Priority**

Given the 9 models identified for change tracking, should we:

- (a) Fully implement and test all 9 models in Item 16?
- (b) Implement infrastructure for all 9 but only test location-related ones (AssetProcessingLocation, RecipientProcessingLocation)?
- (c) Build full infrastructure for all 9 models, but prioritize implementation & testing on location-related ones first?

**Answer: Option C** - Build full infrastructure for all 9 models, but prioritize implementation & testing on location-related ones first

**Tier Structure:**

**Tier 1 - MUST for Item 16** (fully implemented & tested):

- AssetProcessingLocation
- RecipientProcessingLocation
- DataProcessingActivity
- Rationale: Full tracking of cross-border/location changes + risk level/DPIA requirement tracking

**Tier 2 - SHOULD for Item 16** (implement if time permits):

- TransferMechanism
- DataSubjectCategory
- DataCategory
- Rationale: Directly influence safeguards, special categories, vulnerable subjects, DPIA triggers

**Tier 3 - CAN be follow-up** (same pattern, lowest immediate risk):

- Purpose
- LegalBasis
- Recipient
- Rationale: Important for document staleness but less critical than transfer tracking

**Specification Line:**
"Item 16 will introduce a generic change tracking framework (ComponentChangeLog, ImpactType, and a Prisma extension) configured for 9 models. AssetProcessingLocation, RecipientProcessingLocation, and DataProcessingActivity MUST be fully wired in this item; TransferMechanism, DataSubjectCategory, and DataCategory SHOULD be wired in the same item where feasible; Purpose, LegalBasis, and Recipient MAY be implemented in a small follow-up using the same pattern."

**Follow-up Q2a: Rapid Successive Updates**

How should we handle rapid successive updates (e.g., user changes AssetProcessingLocation.countryId three times in 60 seconds)?

**Answer:** Log every update; no deduplication in Item 16

- Every successful update that changes tracked fields creates its own ComponentChangeLog entry
- If user makes multiple quick changes, each gets logged separately (valuable for audit timeline)
- Any future consolidation handled at UI/reporting layer, not core logging

**Specification Line:**
"Rapid successive updates are logged as separate ComponentChangeLog entries. Item 16 does not implement deduplication; any consolidation is handled in reporting/UI later."

**Follow-up Q2b: Cascading Updates**

How should we handle cascading updates (e.g., if TransferMechanism description changes, affecting 50 AssetProcessingLocation rows that reference it)?

**Answer:** Distinguish two scenarios:

1. **Change to shared component itself** (e.g., TransferMechanism description changes):
   - Create ONE ComponentChangeLog entry for that component
   - Do NOT create synthetic logs for 50 locations referencing it
   - Document-impact logic later looks at "docs referencing this component"

2. **Bulk change of referenced rows** (e.g., updating 50 AssetProcessingLocation rows):
   - Each updated row produces its own ComponentChangeLog entry
   - No special parent entry

**Specification Line:**
"Cascading semantic impact (e.g. TransferMechanism definition changed) is logged once on the component itself. Only actual row updates (e.g. each AssetProcessingLocation updated) create per-row change logs. We do not auto-expand a single TransferMechanism change into N artificial location logs."

**Follow-up Q2c: Bulk Operations (updateMany)**

For bulk operations (updateMany), should we create a single change log or one per affected row?

**Answer:** For tracked models, avoid updateMany; use per-row updates for accurate change tracking

**Rationale:**

- Prisma extension cannot easily know which rows affected by updateMany
- Lose exact old/new before/after per row
- Per-row snapshots crucial in compliance context

**Pattern:**

```typescript
// Correct approach for bulk changes on tracked models
const ids = await prisma.recipient.findMany({
  where: {
    /* filter */
  },
  select: { id: true },
})

for (const { id } of ids) {
  await prismaWithTracking.recipient.update({
    where: { id },
    data: { isActive: false },
  })
}
```

**Guarantees:**

- One ComponentChangeLog per affected record
- No special "bulk log" type needed
- Prisma extension remains simple and predictable

**Specification Line:**
"For tracked models, Item 16 does not support change logging for updateMany. Bulk changes must be implemented as explicit per-row updates so that each record gets its own ComponentChangeLog entry. If updateMany is used, no change logs are guaranteed."

**Follow-up Q3: Component Snapshot Fetching**

For component snapshots, should:

- (a) Extension perform targeted queries with minimal includes?
- (b) Caller provide the component's current state?
- (c) Extension fetch full entity with all relations?

**Answer: Option (a)** - Extension performs targeted queries with minimal includes

**Implementation Approach:**

```typescript
assetProcessingLocation: {
  async update(args) {
    // 1) Fetch "before" with minimal includes
    const before = await base.assetProcessingLocation.findUnique({
      where: args.args.where,
      include: {
        country: true,
        transferMechanism: true,
      },
    })

    // 2) Perform the update
    const result = await (args as any).query({
      ...args.args,
      include: {
        country: true,
        transferMechanism: true,
      },
    })

    // 3) Build flattened snapshots
    const snapshotBefore = flattenAssetLocation(before)
    const snapshotAfter = flattenAssetLocation(result)

    // 4) Compare tracked fields; if changed, create ComponentChangeLog
    // ...

    return result
  },
}
```

**Key Points:**

- Limit includes to only needed data (Country and TransferMechanism for locations)
- Keeps overhead small and predictable
- Snapshot taken at moment of change (accurate even if related entities change later)
- Extension responsible for fetching (not caller's responsibility - more reliable)

### Existing Code to Reference

No similar existing features identified for reference.

**Patterns to Reuse:**

- Multi-tenancy patterns (organizationId, onDelete: Cascade)
- Prisma client wrapper pattern in packages/database
- Existing transfer/country logic (Country.gdprStatus, TransferMechanism model)

**No Existing:**

- No existing change-tracking infrastructure
- No existing UI change-log components yet

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

No visual files were found in the planning/visuals/ folder.

## Requirements Summary

### Functional Requirements

**Core Change Tracking:**

- Implement ComponentChangeLog model tracking all changes to 9 compliance-critical component types
- Capture before/after snapshots with flattened, human-readable data (not just IDs)
- Track CREATE, UPDATE, and DELETED (soft-delete) operations
- Store optional changeReason text from UI context
- Link changes to users (nullable changedByUserId for system jobs)
- Support multi-tenancy with organizationId isolation

**Document Impact Tracking:**

- Implement minimal GeneratedDocument model (extended in Items 37-40)
- Implement AffectedDocument model linking changes to impacted documents
- Define comprehensive ImpactType enum with 15+ specific impact categories
- Store human-readable impact descriptions
- Support future regeneration workflow (Item 45)

**Prisma Extension Implementation:**

- Implement as Prisma client extension (modern pattern, not old middleware)
- Location: packages/database/src/middleware/changeTracking.ts
- Always-on by default with DISABLE_CHANGE_TRACKING=true escape hatch
- Accept context: ctx.userId (optional), ctx.changeReason (optional)
- Wrap update operations for all tracked models
- Extension performs targeted queries with minimal includes (Country, TransferMechanism)
- Extension responsible for fetching before/after state (not caller)

**Tracked Models & Fields (Tiered Priority):**

**Tier 1 - MUST (fully implemented & tested in Item 16):**

1. AssetProcessingLocation - countryId, transferMechanismId, locationRole, isActive
2. RecipientProcessingLocation - countryId, transferMechanismId, locationRole, isActive
3. DataProcessingActivity - riskLevel, requiresDPIA, dpiaStatus, retention fields, status

**Tier 2 - SHOULD (implement if time permits in Item 16):** 4. TransferMechanism - name, code, description, gdprArticle, category, flags, isActive 5. DataSubjectCategory - name, vulnerability fields, DPIA suggestion fields, isActive 6. DataCategory - name, description, sensitivity, isSpecialCategory, isActive

**Tier 3 - CAN (follow-up using same pattern):** 7. Purpose - name, description, category, scope, isActive 8. LegalBasis - type, name, framework, consent flags, requirements, isActive 9. Recipient - type, externalOrganizationId, purpose, description, hierarchy, isActive

**Change Logging Strategy:**

- Log every update separately (no automatic deduplication)
- Rapid successive updates create separate log entries
- Component changes logged once on the component itself
- Actual row updates create per-row change logs
- No automatic expansion of component changes into referenced row logs
- No support for updateMany (must use per-row updates for tracked models)
- Extension fetches before/after state with minimal includes
- Minimal includes: Country and TransferMechanism for location models

**Performance Strategy:**

- Synchronous: Compare before/after, write ComponentChangeLog in same transaction
- Deferred (Items 37-40, 56): Document snapshot scanning, AffectedDocument creation, cross-component impact analysis
- No performance impact on normal CRUD operations
- Targeted queries with minimal includes keep overhead small

**User Experience:**

- Silent, automatic change tracking (no interruption)
- UI confirmation only for high-impact changes (handled in UI specs Items 14/15/16c)
- Optional changeReason field surfaced in UI for location/taxonomy changes
- Service layer can enforce non-empty changeReason for high-impact operations

### Reusability Opportunities

**Existing Patterns:**

- Multi-tenancy patterns (organizationId foreign keys, onDelete: Cascade, compound indexes)
- Prisma client wrapper pattern in packages/database
- Transfer/country logic (Country.gdprStatus, TransferMechanism model)
- DAL pattern for database access

**No Existing Change-Tracking:**

- This is net-new infrastructure
- First implementation of audit/change tracking in the system
- Establishes pattern for future audit trails

### Scope Boundaries

**In Scope (Item 16):**

- ComponentChangeLog model implementation
- AffectedDocument model implementation (minimal)
- GeneratedDocument model implementation (minimal structure)
- Prisma client extension for change detection
- Change tracking for 9 compliance-critical models (tiered priority)
- Tier 1 models fully implemented and tested
- Tier 2 models implemented where feasible
- Generic framework extensible to Tier 3 models
- Synchronous change log creation
- Extension-based snapshot fetching with minimal includes
- Multi-tenancy support
- User attribution (changedBy)
- Optional change reason storage
- Flattened snapshot generation (human-readable)
- CREATE/UPDATE/DELETED operation tracking
- Per-row update pattern for bulk changes

**Out of Scope (Future Items):**

- Document snapshot scanning (Items 37-40)
- AffectedDocument creation logic (Items 37-40)
- Background job infrastructure (Item 56)
- Change log UI components (Items 14/15/16c)
- UI confirmation dialogs (Items 14/15/16c)
- Document regeneration workflow (Item 45)
- Full GeneratedDocument implementation (Items 37-41)
- Change reason enforcement logic (UI specs)
- Automatic deduplication of rapid successive changes
- Support for updateMany on tracked models
- Automatic expansion of component changes into referenced row logs

### Technical Considerations

**Database:**

- All models include organizationId for multi-tenancy
- Cascade deletes on organization removal
- Comprehensive indexes for query performance:
  - ComponentChangeLog: (organizationId, componentType, componentId, changedAt)
  - ComponentChangeLog: (changedAt) for global timeline
  - AffectedDocument: (organizationId, generatedDocumentId)
  - AffectedDocument: (organizationId, detectedAt)

**Prisma Extension:**

- Uses modern Prisma client extensions API
- Wraps update/updateMany/delete operations
- Accepts runtime context (userId, changeReason)
- Environment variable escape hatch for tests
- Implemented in packages/database for reusability
- Performs targeted queries with minimal includes
- Extension fetches before/after state (not caller)

**Snapshot Strategy:**

- Flattened JSON with nested entity details
- Include human-readable fields (country.name, not just countryId)
- Include GDPR metadata (country.gdprStatus.isThirdCountry)
- Consistent structure across all component types
- Store in oldValue/newValue fields as Json type
- Minimal includes: only Country and TransferMechanism for locations
- Snapshot taken at moment of change (immune to later changes)

**Field Tracking:**

- Whitelist approach (only track compliance-critical fields)
- Ignore metadata JSON, presentation-only fields
- Ignore purely descriptive fields without compliance impact
- Field list per model in TRACKED_FIELDS_BY_MODEL config

**Integration Points:**

- Session context provides ctx.userId
- API/UI layer provides ctx.changeReason (optional)
- Service layer can enforce changeReason for high-impact operations
- Future integration with background job system (Item 56)
- Future integration with document generation (Items 37-40)

**Performance:**

- In-transaction change log writes (no async overhead)
- Minimal overhead on updates (before/after comparison)
- Targeted queries with minimal includes
- Deferred heavy operations to background jobs
- Indexed for fast queries
- Escape hatch for bulk operations/tests

**Concurrency Handling:**

- Prisma extension handles concurrent updates gracefully
- Each update gets its own change log entry
- Snapshot reflects exact state at update time
- No lock contention (optimistic concurrency)

**Technology Stack Alignment:**

- Next.js 16 App Router (existing)
- Prisma ORM for database access (existing)
- TypeScript strict mode (existing)
- PostgreSQL 17 (existing)
- tRPC v11 for API layer (existing)
- Zod for validation (existing)

**Testing Requirements:**

- Unit tests for change detection logic
- Integration tests for Prisma extension
- Tests for concurrent updates
- Tests for affected document marking (when implemented)
- Tests for snapshot accuracy
- Tests for multi-tenant isolation
- Performance tests for per-row updates
- Tests for minimal includes efficiency
- Tests for Tier 1 models (MUST)
- Tests for Tier 2 models where implemented (SHOULD)
