# Spec Requirements: Processing Activity Junction Tables

## Initial Description

Implement junction tables linking DataProcessingActivity to Purpose (DataProcessingActivityPurpose), DataSubject (DataProcessingActivityDataSubject), DataCategory (DataProcessingActivityDataCategory), and Recipient (DataProcessingActivityRecipient) with proper foreign key constraints, unique constraints preventing duplicates, and bidirectional indexes; create migrations and test queries to enable many-to-many relationships and granular compliance tracking.

## Requirements Discussion

### First Round Questions

**Q1: Structure Pattern**
I assume you want these junction tables to follow the exact pattern of the existing `DataCategoryDataNature` junction table (id, two FK columns, createdAt, unique constraint on FK pair, bidirectional indexes). Is that correct?

**Answer:** Yes, follow the existing `DataCategoryDataNature` junction table pattern exactly.

- `id` (cuid primary key)
- Two foreign key columns
- `createdAt` timestamp
- Unique constraint on FK pair
- Bidirectional indexes on both FKs
- Reference: `schema.prisma:406-420`

---

**Q2: Implementation Scope**
The roadmap lists 4 junction tables. Should we implement all 4 in this spec, or break them into separate specs? Given they're identical in structure, I'm thinking we do them all atomically.

**Answer:** Implement all 4 junction tables in this spec:

1. `DataProcessingActivityPurpose`
2. `DataProcessingActivityDataSubject`
3. `DataProcessingActivityDataCategory`
4. `DataProcessingActivityRecipient`

Rationale: Roadmap #13 is marked S (small) and explicitly lists all 4. Identical structure makes atomic implementation efficient.

---

**Q3: Data Migration**
The Recipient model currently has `activityIds String[]`. Do we need a two-phase migration (add junction, migrate data, remove column), or can we do it in one shot since there's no production data yet?

**Answer:** Single-phase migration (no production data exists, only seed dev data).

- Create all 4 junction tables
- Migrate `Recipient.activityIds` to `DataProcessingActivityRecipient` junction
- Drop `Recipient.activityIds` column
- All in one migration

Rationale: No production data means no need for two-phase approach or safeguards. Seed data can be regenerated if issues arise.

---

**Q4: DataSubject Junction Specifics**
For `DataProcessingActivityDataSubject`, should this link to the `DataSubjectCategory` model? Also, should we include volume estimation fields in this junction (like "approximate number of data subjects")?

**Answer:** Link to `DataSubjectCategory` model. Keep junction pure (no volume fields).

Semantic Clarification:

- `DataSubjectCategory` represents categories, not individuals (GDPR Article 30)
- Examples: "EMPLOYEE", "CUSTOMER", "MINOR"
- Volume estimation belongs at `DataProcessingActivity` level, not junction table
- Reference: `schema.prisma:346-373`

---

**Q5: Cascade Deletion Rules**
For cascade behavior, I'm thinking:

- Activity side: `onDelete: Cascade` (if you delete an activity, delete its links)
- Component side (Purpose/DataCategory/etc.): `onDelete: Restrict` (prevent deletion if still in use)

Is this aligned with your data integrity expectations?

**Answer:** Yes, follow `DataCategoryDataNature` pattern exactly:

- Activity side: `onDelete: Cascade` (delete links when activity deleted)
- Component side: `onDelete: Restrict` (prevent deleting Purpose/DataCategory/etc. if still in use)
- Reference: `schema.prisma:413-414`

---

**Q6: Testing Scope**
Should we include performance testing for queries with multiple junction joins, or focus on functional coverage (create, query, cascade delete, multi-tenancy)?

**Answer:** Focus on functional coverage. Defer performance testing.

Required Tests:

- Create activities with linked components
- Prevent duplicate links (unique constraint)
- Query activities with relations (Prisma's include)
- Cascade deletion behavior
- Multi-tenancy isolation
- Junction CRUD operations via DAL

Deferred:

- Large-scale performance tests

Reference: `dataCategories.integration.test.ts`

---

**Q7: DAL Functions**
Should we create DAL functions for junction management (like `syncActivityPurposes`, `linkActivityToDataCategories`, etc.) following the pattern in `dataCategories.ts`, or keep it simpler?

**Answer:** Create DAL functions following `dataCategories.ts` pattern.

Sync Pattern (Primary):

```typescript
syncActivityPurposes(activityId: string, organizationId: string, purposeIds: string[])
syncActivityDataCategories(activityId: string, organizationId: string, dataCategoryIds: string[])
syncActivityDataSubjects(activityId: string, organizationId: string, dataSubjectIds: string[])
syncActivityRecipients(activityId: string, organizationId: string, recipientIds: string[])
```

Helper Functions:

```typescript
linkActivityToPurposes(activityId: string, organizationId: string, purposeIds: string[])
unlinkActivityFromPurpose(activityId: string, organizationId: string, purposeId: string)
getActivityWithComponents(activityId: string, organizationId: string)
```

Implementation Requirements:

- Use transactions for atomicity
- Enforce multi-tenancy (require `organizationId`)
- Use `skipDuplicates: true` for idempotency
- Sync pattern: delete existing + create new in single transaction

Reference: `dataCategories.ts:187-211, 327-341`

---

**Q8: Future Roadmap Alignment**
Looking at the roadmap, items #14 (DigitalAsset model) and #15 (Asset relationships and DataTransfer) might build on these junctions. Should we lay any groundwork for those, or strictly focus on the 4 core junction tables?

**Answer:** Strictly focus on the 4 core junction tables. No groundwork for future items.

In Scope:

- Purpose, DataSubject, DataCategory, Recipient junctions only

Out of Scope:

- Item #14: DigitalAsset model (M complexity)
- Item #15: Asset relationships and DataTransfer (M complexity)

Rationale: YAGNI principle. Items #14 and #15 have their own complexity budgets.

---

**Q9: Additional Junction Fields**
Are there any additional fields needed in these junction tables beyond the basic structure? For example:

- Timestamps for when each link was established?
- User who created the link (createdBy)?
- Notes or justification fields?
- Or should we keep them pure join tables?

**Answer:** Keep all 4 junction tables pure. Document potential extension for Recipient junction.

Current Implementation:
All junctions contain only: `id`, `activityId`, `componentId`, `createdAt`

Future Consideration (Document in spec):
`DataProcessingActivityRecipient` may need extension in Roadmap #15:

- Potential: `involvesThirdCountryTransfer` Boolean
- Potential: `transferBasis` enum reference
- Rationale: GDPR Article 30(1)(d) requires documenting third-country transfers
- Decision deferred until DataTransfer model architecture is designed

---

**Q10: Comprehensive Migration Scope**
To ensure completeness, should this spec include updates to ALL code artifacts that reference or interact with these tables? Specifically:

- DAL function updates/creation
- Validation schema updates (Zod)
- Test updates
- Seed data updates
- Type definition regeneration

Or should those be handled in separate follow-up specs?

**Answer:** This spec MUST include updates to ALL code artifacts. The implementation is not complete until:

1. Schema Changes:
   - Add 4 new junction tables
   - Remove `Recipient.activityIds` field
   - Update `DataProcessingActivity` model relations
   - Update `Recipient`, `Purpose`, `DataSubjectCategory`, `DataCategory` model relations

2. DAL Functions:
   - Create new junction DAL functions (sync, link, unlink, get)
   - Update existing DAL functions that reference `Recipient.activityIds`
   - Update any DAL functions that query `DataProcessingActivity` with related entities

3. Validation Schemas (Zod):
   - Update input/output schemas for affected entities
   - Add validation schemas for junction operations
   - Remove `activityIds` from Recipient schemas

4. Type Definitions:
   - Regenerate Prisma client types
   - Update any manual TypeScript interfaces

5. Test Files:
   - Update existing tests that use `Recipient.activityIds`
   - Add comprehensive tests for new junction tables and DAL functions
   - Update seed data if necessary

6. Seed Data:
   - Update seed scripts to use junction tables instead of `activityIds`

Definition of Done:

- All 4 junction tables exist with correct structure
- `Recipient.activityIds` field is removed
- All DAL functions are created/updated
- All validation schemas are updated
- All tests pass
- Seed data works with new structure
- No TypeScript compilation errors
- No references to `activityIds` remain in codebase (except migration file)

### Existing Code to Reference

**Similar Features Identified:**

- **Junction Table Pattern**: `DataCategoryDataNature` model at `schema.prisma:406-420`
  - Structure: id, two FKs, createdAt, unique constraint, bidirectional indexes
  - Cascade rules reference

- **DAL Pattern**: `/packages/database/src/dal/dataCategories.ts` lines 187-211, 327-341
  - Sync functions with transaction handling
  - Multi-tenancy enforcement
  - Idempotent operations with `skipDuplicates`

- **Test Pattern**: `/packages/database/__tests__/integration/dal/dataCategories.integration.test.ts`
  - Junction table operations
  - Multi-tenancy isolation
  - Cascade deletion tests

- **Migration Pattern**: `20251202203143_add_gdpr_compliance_foundation_models/migration.sql`
  - Table creation syntax
  - Foreign key constraints
  - Index definitions

### Follow-up Questions

No follow-up questions needed. All requirements are clear and comprehensive.

## Visual Assets

### Files Provided:

No visual files found in the visuals folder.

### Visual Insights:

Not applicable - this is a backend database implementation with no UI components.

## Requirements Summary

### Functional Requirements

**Core Functionality:**

- Create 4 new junction tables linking DataProcessingActivity to its related entities
- Enable many-to-many relationships between activities and their components
- Support granular compliance tracking for GDPR Article 30 requirements
- Maintain data integrity through proper foreign key constraints
- Prevent duplicate relationships through unique constraints
- Enable efficient queries through bidirectional indexes

**Data Migration:**

- Migrate existing `Recipient.activityIds` array data to `DataProcessingActivityRecipient` junction table
- Remove deprecated `Recipient.activityIds` column
- Execute in single-phase migration (no production data exists)

**DAL Functions to Create:**

- `syncActivityPurposes()` - Replace all purpose links for an activity
- `syncActivityDataCategories()` - Replace all data category links for an activity
- `syncActivityDataSubjects()` - Replace all data subject links for an activity
- `syncActivityRecipients()` - Replace all recipient links for an activity
- `linkActivityToPurposes()` - Add new purpose links
- `unlinkActivityFromPurpose()` - Remove specific purpose link
- Similar link/unlink helpers for other entities
- `getActivityWithComponents()` - Query activity with all related entities

**Multi-Tenancy:**

- All DAL functions must enforce organization-level isolation
- All operations require `organizationId` parameter
- All queries must be scoped to organization

**Transaction Management:**

- Use Prisma transactions for sync operations
- Ensure atomicity when replacing multiple relationships
- Use `skipDuplicates: true` for idempotent operations

### Reusability Opportunities

**Components that exist and should be referenced:**

1. **Junction Table Structure**:
   - `DataCategoryDataNature` model provides the exact pattern to follow
   - Proven structure with id, FKs, timestamps, constraints, and indexes

2. **DAL Patterns**:
   - `dataCategories.ts` provides sync function pattern
   - Transaction handling approach is established
   - Multi-tenancy enforcement pattern exists

3. **Test Patterns**:
   - `dataCategories.integration.test.ts` provides test structure
   - Junction operation tests already exist
   - Multi-tenancy isolation test pattern available

4. **Migration Syntax**:
   - Previous GDPR migrations provide SQL syntax reference
   - Foreign key constraint patterns established
   - Index creation patterns documented

### Scope Boundaries

**In Scope:**

- Create 4 new junction tables: `DataProcessingActivityPurpose`, `DataProcessingActivityDataSubject`, `DataProcessingActivityDataCategory`, `DataProcessingActivityRecipient`
- Implement proper foreign key constraints with cascade rules
- Create unique constraints to prevent duplicate relationships
- Create bidirectional indexes for query performance
- Migrate `Recipient.activityIds` to junction table
- Remove deprecated `Recipient.activityIds` column
- Create comprehensive DAL functions for junction management
- Update Prisma schema with proper relations
- Update all validation schemas (Zod)
- Create comprehensive integration tests
- Update seed data to use junction tables
- Regenerate TypeScript types

**Out of Scope:**

- Roadmap item #14: DigitalAsset model implementation
- Roadmap item #15: Asset relationships and DataTransfer model
- Performance testing with large datasets
- UI components or frontend changes
- Additional junction table fields beyond basic structure (future consideration for Recipient documented)
- Third-country transfer tracking fields (deferred to Roadmap #15)

**Future Enhancements Documented:**

- `DataProcessingActivityRecipient` may need extension in Roadmap #15:
  - Potential field: `involvesThirdCountryTransfer` Boolean
  - Potential field: `transferBasis` enum reference
  - Rationale: GDPR Article 30(1)(d) requires documenting third-country transfers
  - Decision deferred until DataTransfer model architecture is designed

### Technical Considerations

**Integration Points:**

- Prisma ORM for database access
- PostgreSQL 17 as database engine
- Existing DAL layer pattern
- Zod validation schemas
- Multi-tenant architecture with organization-level isolation

**Existing System Constraints:**

- Must maintain backward compatibility during migration
- Must follow existing junction table pattern exactly
- Must enforce multi-tenancy at all levels
- Must use transactions for data integrity

**Technology Preferences:**

- Follow `DataCategoryDataNature` pattern precisely
- Use Prisma's transaction API for sync operations
- Use `skipDuplicates: true` for idempotent operations
- Use `onDelete: Cascade` for activity side
- Use `onDelete: Restrict` for component side

**Similar Code Patterns to Follow:**

| Pattern Type         | Reference Location                                                   | Key Elements              |
| -------------------- | -------------------------------------------------------------------- | ------------------------- |
| Schema Structure     | `schema.prisma:406-420`                                              | Junction table definition |
| DAL Sync Function    | `dataCategories.ts:187-211`                                          | Transaction-based sync    |
| DAL Helper Functions | `dataCategories.ts:327-341`                                          | Link/unlink operations    |
| Integration Tests    | `dataCategories.integration.test.ts`                                 | Test coverage approach    |
| Migration SQL        | `20251202203143_add_gdpr_compliance_foundation_models/migration.sql` | SQL syntax                |

**Cascade Deletion Rules (Critical):**

```prisma
// Activity side: Cascade
activity DataProcessingActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)

// Component side: Restrict
purpose Purpose @relation(fields: [purposeId], references: [id], onDelete: Restrict)
```

**Definition of Done Checklist:**

- [ ] All 4 junction tables exist with correct structure
- [ ] `Recipient.activityIds` field is removed
- [ ] All DAL functions are created/updated
- [ ] All validation schemas are updated
- [ ] All tests pass
- [ ] Seed data works with new structure
- [ ] No TypeScript compilation errors
- [ ] No references to `activityIds` remain in codebase (except migration file)
