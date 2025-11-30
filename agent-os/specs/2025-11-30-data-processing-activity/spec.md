# Specification: Data Processing Activity Model

## Goal

Rename and enhance the existing `Activity` model to `DataProcessingActivity` with comprehensive workflow status tracking, risk assessment, DPIA management, owner assignments, retention period tracking, and review scheduling to enable GDPR Article 30 compliant processing activity management.

## User Stories

- As a Privacy Officer, I want to track the full lifecycle of processing activities from draft through approval to archival so that I can maintain compliance records
- As a DPO, I want to see which activities require DPIA and their assessment status so that I can prioritize my review workload

## Specific Requirements

**Model Rename: Activity to DataProcessingActivity**

- Rename the existing `Activity` model to `DataProcessingActivity` in Prisma schema
- Rename `ActivityStatus` enum to `DataProcessingActivityStatus`
- Update Organization relation from `activities Activity[]` to `dataProcessingActivities DataProcessingActivity[]`
- Create migration that renames tables and columns (not drop/recreate)
- Existing data (if any) must be preserved during migration

**Extended Workflow Status Enum**

- Replace simple 3-state enum with full 8-state workflow enum
- States: `DRAFT`, `UNDER_REVIEW`, `UNDER_REVISION`, `REJECTED`, `APPROVED`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`
- Default value remains `DRAFT` for new records
- Status transitions will be enforced at application layer (not database constraints)

**Risk Level Assessment**

- Add nullable `riskLevel` field of type `RiskLevel` enum
- Enum values: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Null represents "not yet assessed" state
- No default value (starts as null)

**DPIA Requirement and Status Tracking**

- Add `requiresDPIA` as nullable Boolean (null = not yet determined, true = required, false = not required)
- Add `dpiaStatus` as nullable `DPIAStatus` enum (only relevant when requiresDPIA = true)
- DPIAStatus enum values: `NOT_STARTED`, `IN_PROGRESS`, `UNDER_REVIEW`, `REQUIRES_REVISION`, `APPROVED`, `OUTDATED`
- Application layer should validate dpiaStatus is null when requiresDPIA is false/null

**Owner Assignment Fields**

- Add `businessOwnerId` as optional foreign key to User model
- Add `processingOwnerId` as optional foreign key to User model
- Use named relations: `@relation("BusinessOwner")` and `@relation("ProcessingOwner")`
- Set `onDelete: SetNull` to handle user deletion gracefully
- Add corresponding User model back-relations

**Retention Period Structure**

- Add `retentionPeriodValue` as optional Int (the numeric value, e.g., 7)
- Add `retentionPeriodUnit` as optional `TimeUnit` enum (DAYS, MONTHS, YEARS)
- Add `retentionJustification` as optional String (legal/business rationale)
- All three fields nullable to support incremental data entry

**Review Date Tracking**

- Add `lastReviewedAt` as optional DateTime
- Add `nextReviewDate` as optional DateTime
- Add `reviewFrequencyMonths` as optional Int (null = ad-hoc/as-needed)
- Application layer calculates nextReviewDate from lastReviewedAt + reviewFrequencyMonths

**Compound Indexes for Dashboard Queries**

- Add index on `[organizationId, status, requiresDPIA]` for dashboard filtering
- Add index on `[organizationId, nextReviewDate]` for review scheduling queries
- Add index on `[riskLevel, dpiaStatus]` for risk/DPIA reporting
- Keep existing `[organizationId]` and `[organizationId, status]` indexes

**Metadata Field**

- Add optional `metadata` field as Json type for extensibility
- Default to Prisma.JsonNull (not undefined)
- Used for custom fields per organization

## Existing Code to Leverage

**packages/database/src/dal/activities.ts**

- Follow exact same DAL function patterns (async functions with type annotations)
- Replicate SECURITY comments documenting multi-tenancy behavior
- Use same import pattern: `import type { X } from '../index'` and `import { prisma } from '../index'`
- Rename all functions from `*Activity` to `*DataProcessingActivity`

**packages/database/src/dal/processors.ts**

- Use cursor-based pagination pattern for list function
- Follow `listProcessorsByOrganization` return type pattern: `{ items: T[], nextCursor: string | null }`
- Include `take: limit + 1` pattern for determining hasMore

**packages/database/prisma/schema.prisma enum patterns**

- Follow same enum naming convention (PascalCase)
- Include inline comments describing each enum value
- Place new enums in "Data Processing" section of schema

**packages/database/__tests__/integration/dal/activities.integration.test.ts**

- Follow same test structure with describe/it blocks
- Use `createTestOrganization` and `cleanupTestOrganizations` helpers
- Include multi-tenancy isolation tests
- Test each CRUD operation independently

**packages/database/src/index.ts export patterns**

- Export new DAL file: `export * from './dal/dataProcessingActivities'`
- Add new model type to explicit type exports
- Export will automatically include new enums from generated client

## Out of Scope

- Junction tables linking to Purpose, DataSubject, DataCategory (roadmap item #13)
- tRPC router updates or API layer changes
- UI components or frontend changes
- Seed data for new enums
- Status transition validation logic (application layer concern)
- Email notifications for review dates
- Audit logging for status changes
- Soft delete functionality (use ARCHIVED status instead)
- Version history tracking
- Bulk operations (import/export)

---

## Technical Appendix: Model Schema

```prisma
// Enums for DataProcessingActivity

enum DataProcessingActivityStatus {
  DRAFT           // Being created, not yet submitted
  UNDER_REVIEW    // Submitted for DPO/Privacy Officer review
  UNDER_REVISION  // Returned for changes by reviewer
  REJECTED        // Permanently rejected
  APPROVED        // Approved but not yet in production
  ACTIVE          // In production use
  SUSPENDED       // Temporarily paused
  ARCHIVED        // End of life, historical record
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum DPIAStatus {
  NOT_STARTED       // Required but not begun
  IN_PROGRESS       // Being conducted
  UNDER_REVIEW      // Submitted for DPO review
  REQUIRES_REVISION // Returned for changes
  APPROVED          // DPO approved
  OUTDATED          // Needs refresh due to changes
}

enum TimeUnit {
  DAYS
  MONTHS
  YEARS
}

// Model definition

model DataProcessingActivity {
  id             String                        @id @default(cuid())
  name           String
  description    String?
  organizationId String
  status         DataProcessingActivityStatus  @default(DRAFT)

  // Risk and DPIA
  riskLevel      RiskLevel?
  requiresDPIA   Boolean?
  dpiaStatus     DPIAStatus?

  // Owners (FK to User)
  businessOwnerId   String?
  processingOwnerId String?

  // Retention
  retentionPeriodValue   Int?
  retentionPeriodUnit    TimeUnit?
  retentionJustification String?

  // Review scheduling
  lastReviewedAt        DateTime?
  nextReviewDate        DateTime?
  reviewFrequencyMonths Int?

  // Metadata
  metadata  Json?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  businessOwner   User?        @relation("BusinessOwner", fields: [businessOwnerId], references: [id], onDelete: SetNull)
  processingOwner User?        @relation("ProcessingOwner", fields: [processingOwnerId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, status, requiresDPIA])
  @@index([organizationId, nextReviewDate])
  @@index([riskLevel, dpiaStatus])
}
```

## Technical Appendix: DAL Function Signatures

```typescript
// dataProcessingActivities.ts

// Create
export async function createDataProcessingActivity(data: {
  name: string
  description?: string
  organizationId: string
  status?: DataProcessingActivityStatus
  riskLevel?: RiskLevel
  requiresDPIA?: boolean
  dpiaStatus?: DPIAStatus
  businessOwnerId?: string
  processingOwnerId?: string
  retentionPeriodValue?: number
  retentionPeriodUnit?: TimeUnit
  retentionJustification?: string
  lastReviewedAt?: Date
  nextReviewDate?: Date
  reviewFrequencyMonths?: number
  metadata?: Prisma.InputJsonValue
}): Promise<DataProcessingActivity>

// Get by ID
export async function getDataProcessingActivityById(
  id: string
): Promise<DataProcessingActivity | null>

// Get by ID with ownership verification
export async function getDataProcessingActivityByIdForOrg(
  id: string,
  organizationId: string
): Promise<DataProcessingActivity | null>

// List with pagination and filters
export async function listDataProcessingActivitiesByOrganization(
  organizationId: string,
  options?: {
    status?: DataProcessingActivityStatus
    riskLevel?: RiskLevel
    requiresDPIA?: boolean
    dpiaStatus?: DPIAStatus
    businessOwnerId?: string
    processingOwnerId?: string
    dueBefore?: Date  // nextReviewDate <= dueBefore
    limit?: number
    cursor?: string
  }
): Promise<{
  items: DataProcessingActivity[]
  nextCursor: string | null
}>

// Update
export async function updateDataProcessingActivity(
  id: string,
  data: {
    name?: string
    description?: string
    status?: DataProcessingActivityStatus
    riskLevel?: RiskLevel | null  // Allow explicit null to clear
    requiresDPIA?: boolean | null
    dpiaStatus?: DPIAStatus | null
    businessOwnerId?: string | null
    processingOwnerId?: string | null
    retentionPeriodValue?: number | null
    retentionPeriodUnit?: TimeUnit | null
    retentionJustification?: string | null
    lastReviewedAt?: Date | null
    nextReviewDate?: Date | null
    reviewFrequencyMonths?: number | null
    metadata?: Prisma.InputJsonValue
  }
): Promise<DataProcessingActivity>

// Delete
export async function deleteDataProcessingActivity(
  id: string
): Promise<DataProcessingActivity>

// Count for dashboard
export async function countDataProcessingActivitiesByOrganization(
  organizationId: string,
  options?: {
    status?: DataProcessingActivityStatus
    requiresDPIA?: boolean
  }
): Promise<number>
```

## Technical Appendix: Migration Strategy

```sql
-- Migration: rename_activity_to_data_processing_activity

-- 1. Rename the enum type
ALTER TYPE "ActivityStatus" RENAME TO "DataProcessingActivityStatus";

-- 2. Add new enum values (must be done before table rename)
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'UNDER_REVISION';
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'REJECTED';
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'APPROVED';
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'SUSPENDED';

-- 3. Create new enums
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "DPIAStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'REQUIRES_REVISION', 'APPROVED', 'OUTDATED');
CREATE TYPE "TimeUnit" AS ENUM ('DAYS', 'MONTHS', 'YEARS');

-- 4. Rename the table
ALTER TABLE "Activity" RENAME TO "DataProcessingActivity";

-- 5. Add new columns
ALTER TABLE "DataProcessingActivity" ADD COLUMN "riskLevel" "RiskLevel";
ALTER TABLE "DataProcessingActivity" ADD COLUMN "requiresDPIA" BOOLEAN;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "dpiaStatus" "DPIAStatus";
ALTER TABLE "DataProcessingActivity" ADD COLUMN "businessOwnerId" TEXT;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "processingOwnerId" TEXT;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "retentionPeriodValue" INTEGER;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "retentionPeriodUnit" "TimeUnit";
ALTER TABLE "DataProcessingActivity" ADD COLUMN "retentionJustification" TEXT;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "lastReviewedAt" TIMESTAMP(3);
ALTER TABLE "DataProcessingActivity" ADD COLUMN "nextReviewDate" TIMESTAMP(3);
ALTER TABLE "DataProcessingActivity" ADD COLUMN "reviewFrequencyMonths" INTEGER;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "metadata" JSONB;

-- 6. Add foreign key constraints
ALTER TABLE "DataProcessingActivity"
  ADD CONSTRAINT "DataProcessingActivity_businessOwnerId_fkey"
  FOREIGN KEY ("businessOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DataProcessingActivity"
  ADD CONSTRAINT "DataProcessingActivity_processingOwnerId_fkey"
  FOREIGN KEY ("processingOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Add new indexes
CREATE INDEX "DataProcessingActivity_organizationId_status_requiresDPIA_idx"
  ON "DataProcessingActivity"("organizationId", "status", "requiresDPIA");

CREATE INDEX "DataProcessingActivity_organizationId_nextReviewDate_idx"
  ON "DataProcessingActivity"("organizationId", "nextReviewDate");

CREATE INDEX "DataProcessingActivity_riskLevel_dpiaStatus_idx"
  ON "DataProcessingActivity"("riskLevel", "dpiaStatus");
```

## Technical Appendix: User Model Back-Relations

Add to User model in schema.prisma:

```prisma
model User {
  // ... existing fields ...

  // DataProcessingActivity ownership relations
  ownedActivitiesBusiness   DataProcessingActivity[] @relation("BusinessOwner")
  ownedActivitiesProcessing DataProcessingActivity[] @relation("ProcessingOwner")
}
```

## Technical Appendix: Organization Model Relation Update

Update Organization model relation:

```prisma
model Organization {
  // ... existing fields ...

  // Relations (updated)
  dataProcessingActivities DataProcessingActivity[]
  // Remove: activities Activity[]
}
```

## Acceptance Criteria

- [ ] Prisma schema compiles without errors after changes
- [ ] Migration runs successfully on empty and existing databases
- [ ] All four new enums are exported from @compilothq/database package
- [ ] DAL functions type-check correctly with new model
- [ ] listDataProcessingActivitiesByOrganization returns only records for specified org
- [ ] Owner fields correctly reference User model with SetNull on delete
- [ ] All compound indexes are created in database
- [ ] Existing Activity integration tests are updated and pass
- [ ] New tests cover all DAL functions including edge cases
- [ ] Multi-tenancy isolation tests verify org separation
