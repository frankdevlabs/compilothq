# Data Processing Activity Model - Requirements

## Decisions Summary

### 1. Model Architecture
**Decision**: Rename and enhance existing `Activity` model to `DataProcessingActivity`

**Rationale**:
- Existing Activity model is minimal with zero production data
- "Data Processing Activity" is correct GDPR Article 30 terminology
- Avoids confusion between two similar models
- Maintains existing `Organization.activities` relation (just needs rename)
- Migration is straightforward

---

### 2. Workflow Status Transitions

**Decision**: Extended enum with additional states

```prisma
enum DataProcessingActivityStatus {
  DRAFT           // Being created
  UNDER_REVIEW    // Submitted for DPO/Privacy Officer review
  UNDER_REVISION  // Returned for changes
  REJECTED        // Permanently rejected
  APPROVED        // Approved but not yet launched
  ACTIVE          // In production use
  SUSPENDED       // Temporarily paused
  ARCHIVED        // End of life / historical
}
```

**Valid Transitions**:
- `DRAFT` → `UNDER_REVIEW` → `APPROVED` → `ACTIVE` → `SUSPENDED` ↔ `ACTIVE` → `ARCHIVED`
- `DRAFT` → `ARCHIVED` (abandoned before submission)
- `UNDER_REVIEW` → `REJECTED` → `ARCHIVED` (permanent rejection)
- `UNDER_REVIEW` → `UNDER_REVISION` → `UNDER_REVIEW` (back-and-forth workflow)

**Rationale**: Per EDPB guidelines, DPO consultation is required for high-risk processing. The `UNDER_REVISION` state enables review workflows.

---

### 3. Risk Level

**Decision**: Nullable (`RiskLevel?`)

```prisma
riskLevel  RiskLevel?  // null = not yet assessed
```

**Rationale**:
- Semantically correct—risk genuinely hasn't been assessed yet
- Aligns with Prisma/TypeScript idioms (`RiskLevel | null`)
- UI should display "Not assessed" for null values

---

### 4. DPIA Status

**Decision**: Split into two fields

```prisma
requiresDPIA  Boolean?     // null = not yet determined
dpiaStatus    DPIAStatus?  // Only relevant when requiresDPIA = true
```

```prisma
enum DPIAStatus {
  NOT_STARTED       // Required but not begun
  IN_PROGRESS       // Being conducted
  UNDER_REVIEW      // Submitted for DPO review
  REQUIRES_REVISION // Returned for changes
  APPROVED          // DPO approved
  OUTDATED          // Needs refresh due to changes
}
```

**Rationale**: Separating the requirement flag from the workflow status is cleaner and matches standard DPIA patterns.

---

### 5. Owner Fields

**Decision**: Foreign key references to User model (nullable)

```prisma
businessOwnerId    String?
processingOwnerId  String?

businessOwner      User?  @relation("BusinessOwner", fields: [businessOwnerId], references: [id], onDelete: SetNull)
processingOwner    User?  @relation("ProcessingOwner", fields: [processingOwnerId], references: [id], onDelete: SetNull)
```

**Rationale**:
- Internal organizational roles, not external contacts
- Enables rich queries ("show all activities I own")
- Enables assignment workflows and notifications
- `onDelete: SetNull` handles user departure gracefully
- For external contacts, use Processor model instead

---

### 6. Retention Period

**Decision**: Structured fields embedded on DataProcessingActivity

```prisma
retentionPeriodValue   Int?       // The number (e.g., 7)
retentionPeriodUnit    TimeUnit?  // The unit (e.g., YEARS)
retentionJustification String?    // Legal/business rationale
```

```prisma
enum TimeUnit {
  DAYS
  MONTHS
  YEARS
}
```

**Rationale**:
- Enables automated calculations (expiry dates, review schedules)
- Enables compliance reporting ("all activities with >7 year retention")
- Simpler than separate model for MVP

---

### 7. Review Date Tracking

**Decision**: Include `reviewFrequencyMonths`

```prisma
lastReviewedAt         DateTime?
nextReviewDate         DateTime?
reviewFrequencyMonths  Int?        // null = ad-hoc/as-needed
```

**Rationale**:
- Enables auto-calculation: `nextReviewDate = lastReviewedAt + reviewFrequencyMonths`
- Enables dashboard queries ("activities due for review this month")
- Integer is more flexible than enum (allows 18, 36 months, etc.)
- Null means ad-hoc review (no automatic scheduling)

---

### 8. Scope Boundaries

#### In Scope (Item #8)
- ✅ DataProcessingActivity Prisma model with all fields
- ✅ Required enums (DataProcessingActivityStatus, RiskLevel, DPIAStatus, TimeUnit)
- ✅ Compound indexes for dashboard queries
- ✅ Migration file
- ✅ Basic DAL functions (CRUD operations)

#### Out of Scope
| Item | Rationale |
|------|-----------|
| Junction tables (Purpose/DataSubject/DataCategory links) | Roadmap item #13 |
| tRPC router updates | Separate concern, API layer |
| UI components | Separate concern, frontend |
| Seed data | Depends on enums, can follow |

---

## Compound Indexes Required

```prisma
@@index([organizationId, status, requiresDPIA])  // Dashboard filtering
@@index([organizationId, nextReviewDate])        // Review scheduling
@@index([riskLevel, dpiaStatus])                 // Risk/DPIA reports
```

---

## Sources
- https://www.edpb.europa.eu/our-work-tools/general-guidance/guidelines-recommendations-best-practices_en
- https://www.didomi.io/blog/article-30-gdpr-record-activities
- https://gdpr.eu/data-protection-impact-assessment-template/
- https://www.clarip.com/data-privacy/gdpr-impact-assessments/
