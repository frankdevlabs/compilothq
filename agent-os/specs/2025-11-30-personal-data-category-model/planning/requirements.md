# Spec Requirements: Personal Data Category Model

## Initial Description

Implement the DataCategory model for classifying personal data with sensitivity levels, special category detection, and GDPR compliance tracking. This corresponds to roadmap item #10.

From roadmap:

> Implement DataCategory model with name, description, sensitivity levels (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, NORMAL), special category flags (isSpecialCategory) for Article 9 data, example data fields array, references to DataNature for automatic GDPR classification, and audit timestamps; add indexes on sensitivity and isSpecialCategory; create migrations and test to enable automatic special category data detection and legal basis validation.

## Requirements Discussion

### First Round Questions

**Q1:** Should this model follow the existing multi-tenancy pattern with organizationId like DataProcessingActivity, or be a global reference model like DataNature?
**Answer:** Three-layer architecture:

- `DataNature` = Global reference data (no organizationId)
- `DataCategory` = Organization-specific (with organizationId)
- This follows the existing pattern where Country/ProcessingAct are global reference data, while DataProcessingActivity is organization-specific.

**Q2:** What is the sensitivity level hierarchy for data classification?
**Answer:** 4 levels (NORMAL removed as it is ambiguous):

```
PUBLIC < INTERNAL < CONFIDENTIAL < RESTRICTED
```

This aligns with ISO 27001 classification standards.

**Q3:** How should isSpecialCategory be determined - manual entry only, or auto-derived from linked DataNature?
**Answer:** Auto-derive with manual override:

- Auto-calculate: `true` if ANY linked DataNature has `type='SPECIAL'`
- Allow manual override with mandatory justification stored in metadata JSON field
- Conservative principle: better to over-protect data than under-protect

**Q4:** What format should the examples field use for storing example data types?
**Answer:** Simple string array using Prisma Json type:

```prisma
exampleFields  Json  // ["email", "phone_number", "date_of_birth"]
```

This is for documentation purposes and keeps the MVP simple.

**Q5:** What is the relationship between DataCategory and DataNature?
**Answer:** Many-to-many relationship via junction table (`DataCategoryDataNature`):

- Real-world data categories don't fit into single boxes
- Example: "Employee Wellness" category links to multiple natures:
  - `GDPR_ART9_HEALTH`
  - `CONTACT_INFO`
  - `FITNESS_DATA`

**Q6:** What DAL (Data Access Layer) query patterns should be implemented?
**Answer:** 7 essential patterns:

1. `createDataCategory()` - Create with auto-detection of isSpecialCategory
2. `getDataCategoryById()` - Fetch single category with relationships
3. `listDataCategories()` - List with filters (sensitivity, isSpecialCategory, search)
4. `updateDataCategory()` - Update and recalculate isSpecialCategory
5. `deleteDataCategory()` - Remove (check for usage first)
6. `getSpecialCategoryDataCategories()` - Get all Article 9/10 categories
7. `getDataCategoriesBySensitivity()` - Filter by sensitivity threshold

**Q7:** What testing approach should be used?
**Answer:** Comprehensive integration tests covering:

- CRUD operations
- Multi-tenancy isolation
- Relationship integrity (cascade deletes, junction table)
- isSpecialCategory auto-detection logic
- Query patterns (filtering, searching, ordering)
- Edge cases (validation, null handling, long strings)
- Target: >80% code coverage

**Q8:** What is explicitly out of scope for this spec?
**Answer:** See Scope Boundaries section below for complete list.

### Existing Code to Reference

**Similar Features Identified:**

- Feature: DataNature model - Path: `/home/user/compilothq/packages/database/prisma/schema.prisma` (lines 186-199)
  - Reference for: Model structure, type enum pattern, isActive flag, timestamp fields
- Feature: DataProcessingActivity model - Path: `/home/user/compilothq/packages/database/prisma/schema.prisma` (lines 296-340)
  - Reference for: organizationId pattern, indexes, relation to Organization
- Feature: DataProcessingActivity DAL - Path: `/home/user/compilothq/packages/database/src/dal/dataProcessingActivities.ts`
  - Reference for: CRUD patterns, cursor-based pagination, filter options, security comments
- Feature: RecipientCategory model - Path: `/home/user/compilothq/packages/database/prisma/schema.prisma` (lines 238-252)
  - Reference for: examples JSON field pattern

### Follow-up Questions

No follow-up questions were needed. All decisions were confirmed by the user.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

N/A - This is a backend-only feature (Prisma model + DAL + tests).

## Requirements Summary

### Functional Requirements

**DataCategory Prisma Model:**

- `id` - cuid primary key
- `name` - String, required
- `description` - String, optional
- `organizationId` - String, required (foreign key to Organization with cascade delete)
- `sensitivity` - SensitivityLevel enum
- `isSpecialCategory` - Boolean (auto-derived from DataNature, with override capability)
- `exampleFields` - Json (string array for example data fields)
- `metadata` - Json (for manual override justification and other extensible data)
- `isActive` - Boolean, default true
- `createdAt` / `updatedAt` - DateTime timestamps

**SensitivityLevel Enum:**

```prisma
enum SensitivityLevel {
  PUBLIC
  INTERNAL
  CONFIDENTIAL
  RESTRICTED
}
```

**DataCategoryDataNature Junction Table:**

- `id` - cuid primary key
- `dataCategoryId` - String (foreign key to DataCategory)
- `dataNatureId` - String (foreign key to DataNature)
- Unique constraint on (dataCategoryId, dataNatureId)
- Cascade delete when DataCategory is deleted

**Indexes:**

- `organizationId`
- `organizationId` + `sensitivity` (compound)
- `organizationId` + `isSpecialCategory` (compound)
- `sensitivity`
- `isSpecialCategory`

**DAL Functions (7 patterns):**

1. `createDataCategory(data)` - Create with auto-detection of isSpecialCategory based on linked DataNatures
2. `getDataCategoryById(id, organizationId)` - Fetch single category with relationships, scoped to organization
3. `listDataCategories(organizationId, filters)` - List with filters (sensitivity, isSpecialCategory, search), cursor-based pagination
4. `updateDataCategory(id, organizationId, data)` - Update and recalculate isSpecialCategory
5. `deleteDataCategory(id, organizationId)` - Remove category (check for usage first)
6. `getSpecialCategoryDataCategories(organizationId)` - Get all Article 9/10 categories for an organization
7. `getDataCategoriesBySensitivity(organizationId, minSensitivity)` - Filter by sensitivity threshold

**isSpecialCategory Auto-Detection Logic:**

- When creating or updating a DataCategory, check all linked DataNatures
- If ANY linked DataNature has `type = 'SPECIAL'`, set `isSpecialCategory = true`
- Manual override allowed: if user explicitly sets `isSpecialCategory`, store justification in `metadata.specialCategoryOverride`
- Example metadata structure:

```json
{
  "specialCategoryOverride": {
    "overridden": true,
    "justification": "Category contains aggregated anonymized health statistics only",
    "overriddenAt": "2025-11-30T12:00:00Z",
    "overriddenBy": "user_id"
  }
}
```

### Reusability Opportunities

- Enum pattern from DataNatureType can inform SensitivityLevel enum design
- DAL patterns from dataProcessingActivities.ts directly applicable
- Test patterns from existing DAL tests
- JSON examples field pattern from RecipientCategory and ProcessingAct models

### Scope Boundaries

**In Scope:**

- DataCategory Prisma model
- DataNature model (already exists - no changes needed)
- SensitivityLevel enum
- DataCategoryDataNature junction table
- All 7 DAL functions listed above
- Comprehensive integration tests (>80% coverage target)
- Seed data for DataNatures (Article 9/10 special categories)
- Database migrations

**Out of Scope:**

- UI Components (React components, pages, forms)
- tRPC Routers (API layer)
- Validation Schemas (@compilothq/validation package)
- Junction to DataProcessingActivity (Spec #13 on roadmap)
- Data Discovery Automation (Spec #44)
- DPIA Auto-Trigger Logic (Spec #33-34)
- Document Generation (Spec #38-41)
- Smart Suggestions/AI Features (Spec #48)

### Technical Considerations

- Follow existing Prisma schema organization (add under Data Classification section)
- Maintain consistent naming conventions (DataCategory, not PersonalDataCategory)
- Use cuid() for primary keys per existing pattern
- Ensure cascade delete from Organization to DataCategory
- Junction table should have unique constraint on (dataCategoryId, dataNatureId)
- DAL should export all functions from packages/database/src/dal/index.ts
- Tests should use the existing test infrastructure (Vitest)
- Security comments documenting multi-tenancy enforcement in all DAL functions
