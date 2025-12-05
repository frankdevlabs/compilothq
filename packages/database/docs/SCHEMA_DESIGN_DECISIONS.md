# Schema Design Decisions: Digital Asset Model

Documentation of architectural decisions, trade-offs, and rationale for the Digital Asset database schema.

## Table of Contents

1. [Model Overview](#model-overview)
2. [Enum Design](#enum-design)
3. [Field Design Rationale](#field-design-rationale)
4. [Relationship Design](#relationship-design)
5. [Index Strategy](#index-strategy)
6. [Cascade Rules](#cascade-rules)
7. [Future Evolution](#future-evolution)

---

## Model Overview

The Digital Asset feature implements 3 models and 3 enums to track WHERE and HOW personal data is processed across an organization's technical infrastructure.

### Models

1. **DigitalAsset** - Core model representing systems, tools, platforms (16 fields, 4 indexes)
2. **DataProcessingActivityDigitalAsset** - Junction table linking activities to assets (many-to-many)
3. **AssetProcessingLocation** - Child model tracking geographic processing locations (14 fields, 3 indexes)

### Enums

1. **AssetType** (11 values) - Asset categorization
2. **IntegrationStatus** (5 values) - Automation readiness
3. **LocationRole** (3 values) - Hosting vs processing semantics

---

## Enum Design

### AssetType Rationale

**Values:** ANALYTICS_PLATFORM, API, APPLICATION, CLOUD_SERVICE, CRM, DATABASE, ERP, FILE_STORAGE, MARKETING_TOOL, ON_PREMISE_SYSTEM, OTHER

**Design Decisions:**

1. **Alphabetically Ordered** (except OTHER at end)
   - Improves UI dropdown readability
   - Consistent with other enum patterns in codebase
   - OTHER as escape hatch for edge cases

2. **11 Values - Comprehensive Coverage**
   - Based on common GDPR processing infrastructure
   - Covers 90%+ of real-world assets
   - Granular enough for compliance categorization
   - Not so granular as to cause decision paralysis

3. **SCREAMING_SNAKE_CASE Convention**
   - Matches Prisma enum standard
   - TypeScript type safety
   - Clear distinction from model names

**Trade-offs:**

- **Pro:** Clear categorization for compliance reporting
- **Pro:** Enables filtering/grouping in UI
- **Con:** May need future extension (use OTHER + metadata pattern)
- **Decision:** Enums better than free text for structured queries

**Alternative Rejected:** Free text `type` field

- **Why Rejected:** No standardization, impossible to filter reliably
- **Why Chosen:** Enum provides structure while allowing OTHER for flexibility

---

### IntegrationStatus Rationale

**Values:** CONNECTED, FAILED, MANUAL_ONLY, NOT_INTEGRATED, PENDING

**Design Decisions:**

1. **Future-Proofing for Automation**
   - Feature enables future automated data discovery
   - Status tracks integration readiness
   - NOT_INTEGRATED as safe default

2. **5 States Cover Integration Lifecycle**
   - NOT_INTEGRATED → PENDING → CONNECTED (success path)
   - NOT_INTEGRATED → PENDING → FAILED (error path)
   - MANUAL_ONLY for intentionally unautomated assets

3. **Validation Use Case**
   - Service layer can warn: "CONNECTED but lastScannedAt > 7 days old"
   - Enables integration health monitoring

**Trade-offs:**

- **Pro:** Clear state machine for integration workflows
- **Pro:** Enables automated health checks
- **Con:** May be premature for MVP (no integrations yet)
- **Decision:** Low cost to include, high value for future roadmap

---

### LocationRole Rationale

**Values:** HOSTING, PROCESSING, BOTH

**Design Decisions:**

1. **Semantic Clarity for Compliance**
   - HOSTING: Servers physically located here (data at rest)
   - PROCESSING: Data processed but not stored (data in transit)
   - BOTH: Combined hosting and processing

2. **GDPR Article 30(1)(d) Alignment**
   - Article requires "location of processing" documentation
   - Distinction matters for transfer assessments
   - Example: Analytics service may PROCESS in US but HOST in EU

3. **3 Values - Minimal but Complete**
   - Covers all real-world scenarios
   - Avoids over-engineering with 10+ values
   - BOTH explicitly captures combined use case (no ambiguity)

**Trade-offs:**

- **Pro:** Precise compliance documentation
- **Pro:** Helps identify cross-border data flows
- **Con:** User education needed (HOSTING vs PROCESSING distinction)
- **Decision:** Compliance accuracy outweighs UX complexity

**Alternative Rejected:** Single boolean `isHosting`

- **Why Rejected:** Doesn't capture BOTH scenario or PROCESSING-only
- **Why Chosen:** Enum provides clarity and exhaustiveness

---

## Field Design Rationale

### primaryHostingCountryId vs processingLocations Distinction

**Design Decision:** DigitalAsset has BOTH `primaryHostingCountryId` and child `processingLocations`

**Rationale:**

1. **primaryHostingCountryId (Display Purpose)**
   - Single country for UI display/grouping
   - Optional field (nullable)
   - Quick filter: "Show all US-hosted assets"
   - Example: "Google Cloud (US-hosted)" in asset list

2. **processingLocations (Compliance Purpose)**
   - Multiple locations per asset (reality of distributed systems)
   - Each location has role, purpose, transfer mechanism
   - Example: S3 with us-east-1 (HOSTING) + eu-west-1 (HOSTING) + CloudFront (PROCESSING)

3. **Why Both?**
   - UI needs simple display value (primaryHostingCountryId)
   - Compliance needs detailed multi-location tracking (processingLocations)
   - Separation of concerns: display vs compliance

**Trade-offs:**

- **Pro:** UI simplicity without sacrificing compliance accuracy
- **Pro:** Enables both "quick filter" and "detailed audit" use cases
- **Con:** Potential inconsistency if primaryHostingCountryId doesn't match any processingLocation
- **Decision:** Accept potential inconsistency for UX benefit (validation can warn)

**Validation Strategy:**

- Soft warning if `primaryHostingCountryId` set but no matching `processingLocation.countryId`
- Not enforced at DB level (allows flexibility)

---

### service Field as Free Text

**Design Decision:** `AssetProcessingLocation.service` is free text (NOT foreign key to Service catalog)

**Rationale:**

1. **Let Patterns Emerge First**
   - Too early to standardize service names
   - 80% reuse threshold not yet reached
   - Example diversity: "BigQuery analytics", "S3 backup storage", "EU data warehouse"

2. **Avoids Premature Abstraction**
   - Service catalog adds complexity without proven benefit
   - Free text allows organic naming
   - Can analyze for patterns after 6 months of real data

3. **Business Context Over Standardization**
   - Service description meaningful to business users
   - Example: "S3 bucket - customer uploads" more useful than FK to "S3" catalog entry

**Trade-offs:**

- **Pro:** Zero migration friction (just enter description)
- **Pro:** No decision paralysis from dropdown
- **Con:** No standardization for reporting
- **Decision:** Optimize for data entry speed over reporting (can standardize later)

**Future Evolution Path:**

- Monitor service field values after 6 months
- If 80%+ reuse, migrate to Service catalog with FK
- Free text becomes fallback for edge cases

---

### purposeId vs purposeText Fallback Pattern

**Design Decision:** `AssetProcessingLocation` has BOTH `purposeId` (FK) and `purposeText` (free text)

**Rationale:**

1. **Require At Least One**
   - Service layer validation: `purposeId` OR `purposeText` must be provided
   - DB allows both null (validation enforced above)

2. **Use Case: Unformalized Purposes**
   - Early stages: "Backup storage" (purposeText) before formal Purpose created
   - Later: Link to Purpose.id after Purpose model populated
   - Avoids blocking on Purpose creation

3. **Compliance Flexibility**
   - GDPR requires purpose documentation
   - Doesn't mandate structured Purpose catalog
   - Free text fallback ensures compliance minimum met

**Trade-offs:**

- **Pro:** Never blocks on missing Purpose records
- **Pro:** Supports both structured and unstructured workflows
- **Con:** Data quality variance (some FK, some text)
- **Decision:** Flexibility outweighs standardization for MVP

**Best Practice:**

- Encourage `purposeId` when Purpose exists
- Use `purposeText` as temporary placeholder
- UI can suggest "Create Purpose from this text"

---

### isActive Flag for Historical Preservation

**Design Decision:** `AssetProcessingLocation.isActive` (boolean, default true) instead of hard delete

**Rationale:**

1. **Audit Trail Preservation**
   - Compliance documents reference historical locations
   - Deleting location breaks historical RoPA snapshots
   - Example: "Data processed in US" (2023) → "Migrated to EU" (2024)

2. **Change Tracking Foundation**
   - Item 16 (ComponentChangeLog) will track location changes
   - Deactivated locations show "what changed"
   - Timeline: Old location (isActive: false) → New location (isActive: true)

3. **Query Performance**
   - Active queries filter `isActive: true` (excludes deactivated)
   - Historical queries ignore filter (includes all)
   - Index optimization: Active locations always hot in cache

**Trade-offs:**

- **Pro:** Complete audit trail
- **Pro:** Enables "view as of date" compliance snapshots
- **Con:** Database size grows (deactivated records not deleted)
- **Decision:** Compliance/audit value outweighs storage cost

**Storage Impact:**

- Estimate: 10 locations per asset, 10% annual churn
- 1000 assets × 10 locations × 10% = 1000 deactivated/year
- Negligible storage cost, high compliance value

**Alternative Rejected:** Hard delete with archive table

- **Why Rejected:** Complexity of separate archive, query overhead
- **Why Chosen:** Single table with flag simpler, performs well

---

### Metadata JSON for Extensibility

**Design Decision:** Both `DigitalAsset.metadata` and `AssetProcessingLocation.metadata` as nullable JSON

**Rationale:**

1. **Edge Case Escape Hatch**
   - Unknown fields discovered during implementation
   - Example: "Asset requires MFA" boolean (not common enough for dedicated field)
   - Prevents schema churn for rare attributes

2. **Integration Data Storage**
   - Future integrations may need vendor-specific data
   - Example: AWS ARN, Azure Resource ID, GCP project ID
   - Store in metadata without schema changes

3. **Nullable by Default**
   - Only use when necessary
   - Prevents metadata becoming dumping ground
   - Encourages adding proper fields for common patterns

**Trade-offs:**

- **Pro:** Schema flexibility without migrations
- **Pro:** Vendor integration data storage
- **Con:** No type safety, schema drift risk
- **Decision:** Use sparingly, promote to fields if pattern emerges

**Governance:**

- Document metadata usage in code comments
- Review metadata usage quarterly
- Promote to dedicated field if used in 3+ locations

---

## Relationship Design

### Junction Table Pattern

**Design Decision:** Separate `id` field, NOT composite primary key

**Rationale:**

1. **Consistency with Existing Pattern**
   - Matches `DataProcessingActivityPurpose` pattern
   - All Activity junction tables use same structure
   - Reduces cognitive overhead for developers

2. **ORM Friendliness**
   - Prisma handles single-field primary keys more smoothly
   - Composite keys complicate relation definitions
   - Unique constraint on (activityId, digitalAssetId) prevents duplicates

3. **Future-Proofing**
   - Easy to add junction metadata (e.g., createdBy, notes)
   - Unique ID simplifies audit logs
   - Example: "Junction abc123 created by user xyz"

**Schema:**

```prisma
model DataProcessingActivityDigitalAsset {
  id             String   @id @default(cuid())
  activityId     String
  digitalAssetId String
  createdAt      DateTime @default(now())

  @@unique([activityId, digitalAssetId])
  @@index([activityId])
  @@index([digitalAssetId])
}
```

**Trade-offs:**

- **Pro:** Pattern consistency across codebase
- **Pro:** Easier ORM queries
- **Con:** Slight storage overhead (CUID vs composite)
- **Decision:** Developer experience outweighs storage cost

---

### Bidirectional Indexes on Junction

**Design Decision:** Index on both `activityId` and `digitalAssetId`

**Rationale:**

1. **Bidirectional Queries**
   - "Assets for activity" (query by activityId)
   - "Activities for asset" (query by digitalAssetId)
   - Both common in UI

2. **Performance Equality**
   - Neither query more important than other
   - Both indexes ensure <100ms query time
   - Small junction table (likely <10K rows) makes dual indexes cheap

**Query Patterns:**

```sql
-- Assets for activity (uses activityId index)
SELECT * FROM junction WHERE activityId = ?

-- Activities for asset (uses digitalAssetId index)
SELECT * FROM junction WHERE digitalAssetId = ?
```

**Trade-offs:**

- **Pro:** Fast queries in both directions
- **Con:** Double index maintenance overhead
- **Decision:** Query performance outweighs write overhead

---

## Index Strategy

### Compound Indexes Starting with organizationId

**Design Decision:** All indexes start with `organizationId` field

**Rationale:**

1. **Multi-Tenancy Isolation**
   - All queries filter by organizationId first
   - Index scan starts with tenant filter
   - Prevents full table scan

2. **PostgreSQL Index Selectivity**
   - Left-most prefix rule: `(organizationId, type)` supports:
     - `WHERE organizationId = ?` ✅
     - `WHERE organizationId = ? AND type = ?` ✅
     - `WHERE type = ?` ❌ (won't use index)
   - All queries include organizationId filter (safe)

3. **Cardinality Optimization**
   - `organizationId` reduces result set by ~1000x (1000 tenants)
   - Secondary filters (type, containsPersonalData) reduce further
   - Example: 1M assets → 1K per org → 100 databases

**Index List:**

```prisma
model DigitalAsset {
  @@index([organizationId])
  @@index([organizationId, containsPersonalData])
  @@index([organizationId, type])
  @@index([organizationId, primaryHostingCountryId])
}

model AssetProcessingLocation {
  @@index([organizationId, digitalAssetId])
  @@index([organizationId, countryId])
  @@index([organizationId, transferMechanismId])
}
```

**Trade-offs:**

- **Pro:** Tenant isolation performance
- **Pro:** Index covers all common query patterns
- **Con:** Index size grows with number of fields
- **Decision:** Query performance outweighs storage cost

---

## Cascade Rules

### Asymmetric Cascade: Activity vs Asset

**Design Decision:** Different cascade rules for Activity and Asset sides

**Schema:**

```prisma
model DataProcessingActivityDigitalAsset {
  activity     DataProcessingActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  digitalAsset DigitalAsset           @relation(fields: [digitalAssetId], references: [id], onDelete: Restrict)
}
```

**Rationale:**

1. **Activity Deletion → Cascade**
   - Activity owns the relationship
   - Deleting activity should clean up all links
   - Example: Activity deleted → All asset links deleted
   - Reason: Junction records are "owned by" activity

2. **Asset Deletion → Restrict**
   - Asset deletion should be blocked if in use
   - Forces user to unlink manually (prevents accidents)
   - Example: "Cannot delete S3 asset - linked to 5 activities"
   - Reason: Asset is "referenced by" activity (not owned)

3. **Semantic Ownership**
   - Activities create relationships ("I use this asset")
   - Assets are passive (used by activities)
   - Ownership flows from activity to junction

**Trade-offs:**

- **Pro:** Prevents accidental data loss (asset deletion)
- **Pro:** Clean cascade when activity deleted
- **Con:** User must unlink before deleting asset
- **Decision:** Data safety outweighs convenience

**Alternative Rejected:** Both Cascade

- **Why Rejected:** Deleting asset would cascade-delete junction, breaking activity references
- **Why Chosen:** Restrict forces explicit unlinking (safer)

---

### Organization Cascade (Global)

**Design Decision:** Organization deletion cascades to ALL assets and locations

**Schema:**

```prisma
model DigitalAsset {
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

model AssetProcessingLocation {
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

**Rationale:**

1. **Tenant Cleanup**
   - Organization deletion = tenant offboarding
   - Must delete ALL tenant data (GDPR right to erasure)
   - Cascade ensures no orphaned records

2. **Referential Integrity**
   - Assets without org are meaningless
   - Locations without org are inaccessible
   - Cascade maintains data consistency

**Trade-offs:**

- **Pro:** Clean tenant deletion
- **Pro:** No orphaned records
- **Con:** Irreversible (requires backup for restore)
- **Decision:** Tenant isolation requirements outweigh restore complexity

---

### Asset → Location Cascade

**Design Decision:** Asset deletion cascades to processingLocations

**Schema:**

```prisma
model AssetProcessingLocation {
  digitalAsset DigitalAsset @relation(fields: [digitalAssetId], references: [id], onDelete: Cascade)
}
```

**Rationale:**

1. **Parent-Child Relationship**
   - Locations are children of asset
   - Locations have no meaning without parent
   - Example: "US processing location" without asset context is useless

2. **Cleanup After Restrict Check**
   - Asset deletion blocked if linked to activities (Restrict)
   - If deletion succeeds, locations should be cleaned
   - Cascade handles cleanup automatically

**Trade-offs:**

- **Pro:** Automatic cleanup
- **Pro:** No orphaned locations
- **Con:** Locations deleted even if deactivated (isActive: false)
- **Decision:** Cleanup simplicity outweighs historical preservation after asset deletion

**Note:** Historical preservation via `isActive` flag only useful while asset exists. If asset deleted, all locations (active + deactivated) deleted via cascade.

---

## Future Evolution

### Service Catalog Migration Path

**Current State:** Free text `service` field

**Future Path:**

1. Monitor `service` field values for 6 months
2. Analyze for reuse patterns (SQL: `SELECT service, COUNT(*) GROUP BY service`)
3. If 80%+ reuse threshold met, migrate to Service catalog:

   ```prisma
   model Service {
     id     String @id @default(cuid())
     name   String @unique
     type   ServiceType // CLOUD, ON_PREMISE, SAAS
   }

   model AssetProcessingLocation {
     serviceId   String?  // FK to Service
     serviceText String?  // Fallback for non-catalog
   }
   ```

4. Backfill data: Match free text to catalog entries
5. Deprecate free text (use only for edge cases)

**Decision Trigger:** Reuse analysis shows standardization value

---

### Location Versioning (Post-MVP)

**Current State:** `isActive` flag for deactivation

**Future Path:**

- If compliance requires "effective date" tracking:
  ```prisma
  model AssetProcessingLocation {
    effectiveFrom DateTime @default(now())
    effectiveTo   DateTime? // Null = current
  }
  ```
- Query pattern: `WHERE effectiveFrom <= ? AND (effectiveTo IS NULL OR effectiveTo > ?)`
- Migration: Set `effectiveFrom = createdAt`, `effectiveTo = updatedAt` for deactivated

**Decision Trigger:** Regulatory requirement for date-specific snapshots

---

### Materialized Views for Transfer Detection

**Current State:** Real-time queries for cross-border transfers

**Future Path:**

- If performance degrades (>1000 locations):
  ```sql
  CREATE MATERIALIZED VIEW cross_border_transfers AS
  SELECT a.id, a.name, loc.countryId, loc.transferMechanismId
  FROM digital_assets a
  JOIN asset_processing_locations loc ON loc.digitalAssetId = a.id
  WHERE loc.countryId IN (SELECT id FROM countries WHERE gdprStatus ? 'Third Country')
  AND loc.transferMechanismId IS NULL
  ```
- Refresh daily or on-demand
- Service layer queries materialized view

**Decision Trigger:** Query performance SLA breach (>500ms p95)

---

### Integration Metadata Extensions

**Current State:** `metadata` JSON for vendor-specific data

**Future Path:**

- If AWS integration needs ARN, Azure needs resourceId:
  ```prisma
  model DigitalAsset {
    integrationConfig Json? // Replaces metadata
    // Example: { "aws": { "arn": "...", "region": "..." }, "azure": { "resourceId": "..." } }
  }
  ```
- Service layer validates structure per `integrationType`
- Consider separate `AssetIntegration` model if complex

**Decision Trigger:** 3+ integration types require structured metadata

---

## Summary of Key Decisions

| Decision                                      | Rationale                       | Trade-off Accepted        |
| --------------------------------------------- | ------------------------------- | ------------------------- |
| primaryHostingCountryId + processingLocations | UI display vs compliance detail | Potential inconsistency   |
| Free text `service`                           | Let patterns emerge             | No standardization (yet)  |
| purposeId OR purposeText                      | Flexibility over structure      | Data quality variance     |
| isActive flag                                 | Audit trail preservation        | Database size growth      |
| Asymmetric cascade                            | Data safety                     | Manual unlinking required |
| Compound indexes with organizationId          | Multi-tenancy performance       | Index size                |
| Separate junction table ID                    | ORM friendliness                | Storage overhead          |

---

## References

- [DAL API Reference](./DAL_API_DIGITAL_ASSETS.md)
- [Migration Procedures](./MIGRATION_PROCEDURES.md)
- [Spec Document](/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-12-05-digital-asset-model/spec.md)
- [Requirements & Decisions](/Users/frankdevlab/WebstormProjects/compilothq/agent-os/specs/2025-12-05-digital-asset-model/planning/requirements-decisions.md)
