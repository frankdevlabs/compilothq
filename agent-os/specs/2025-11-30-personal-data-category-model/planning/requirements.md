# Spec Requirements: Personal Data Category Model

## Initial Description

Implement the DataCategory model for classifying personal data with sensitivity levels, special category detection, and GDPR compliance tracking. This corresponds to roadmap item #10.

From roadmap:
> Implement DataCategory model with name, description, sensitivity levels (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, NORMAL), special category flags (isSpecialCategory) for Article 9 data, example data fields array, references to DataNature for automatic GDPR classification, and audit timestamps; add indexes on sensitivity and isSpecialCategory; create migrations and test to enable automatic special category data detection and legal basis validation.

## Requirements Discussion

### First Round Questions

**Q1:** Should this model follow the existing multi-tenancy pattern with organizationId like DataProcessingActivity, or be a global reference model like DataNature?
**Answer:** Follow the DataProcessingActivity pattern - organization-specific with organizationId. This allows each organization to define and customize their own data categories while maintaining multi-tenant isolation.

**Q2:** What is the sensitivity level hierarchy for data classification?
**Answer:** The sensitivity hierarchy should be: PUBLIC < INTERNAL < NORMAL < CONFIDENTIAL < RESTRICTED. This provides a clear escalation path from openly shareable data to highly restricted information requiring special handling.

**Q3:** How should isSpecialCategory be determined - manual entry only, or auto-derived from linked DataNature?
**Answer:** Auto-derive from linked DataNature(s) when any has type=SPECIAL, with manual override capability. This ensures consistency with GDPR Article 9 requirements while allowing flexibility for edge cases.

**Q4:** What format should the examples field use for storing example data types?
**Answer:** Simple JSON string array, matching existing patterns in the codebase (e.g., ProcessingAct.examples, RecipientCategory.examples). Example: `["email addresses", "phone numbers", "mailing addresses"]`.

**Q5:** What is the relationship between DataCategory and DataNature?
**Answer:** Many-to-many relationship via a junction table (DataCategoryDataNature). A data category can be linked to multiple data natures (e.g., "Health Records" might link to both "Health Data" and "Biometric Data" natures), and a data nature can apply to multiple categories.

**Q6:** What DAL (Data Access Layer) patterns should be followed?
**Answer:** Follow existing `dataProcessingActivities.ts` patterns with:
- CRUD operations with organizationId scoping
- Cursor-based pagination with configurable limits
- Filter options for sensitivity and isSpecialCategory
- Security comments documenting multi-tenancy enforcement

**Q7:** What testing approach should be used?
**Answer:** Standard integration tests following existing patterns in the codebase. Test CRUD operations, multi-tenancy isolation, filter functionality, and junction table relationships.

**Q8:** What is explicitly out of scope for this S-sized spec?
**Answer:**
- UI components (no React components or pages)
- tRPC routers (API layer will be added in a future spec)
- Integration with DataProcessingActivity (junction table DataProcessingActivityDataCategory is roadmap item #13)

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

No follow-up questions were needed. All decisions were based on codebase research and established patterns.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

N/A - This is a backend-only feature (Prisma model + DAL + tests).

## Requirements Summary

### Functional Requirements

- DataCategory Prisma model with:
  - id (cuid), name, description fields
  - organizationId for multi-tenancy with cascade delete
  - sensitivity enum (PUBLIC, INTERNAL, NORMAL, CONFIDENTIAL, RESTRICTED)
  - isSpecialCategory boolean (auto-derived from DataNature, with override)
  - examples JSON array for example data types
  - isActive boolean for soft-disable
  - createdAt/updatedAt timestamps
- DataCategoryDataNature junction table for many-to-many relationship
- Indexes on:
  - organizationId
  - organizationId + sensitivity
  - organizationId + isSpecialCategory
  - sensitivity
  - isSpecialCategory
- DAL functions:
  - createDataCategory
  - getDataCategoryById
  - getDataCategoryByIdForOrg (with ownership verification)
  - listDataCategoriesByOrganization (with filters and pagination)
  - updateDataCategory
  - deleteDataCategory
  - countDataCategoriesByOrganization
  - Junction table management functions for DataNature linking

### Reusability Opportunities

- Enum pattern from DataNatureType can inform SensitivityLevel enum design
- DAL patterns from dataProcessingActivities.ts directly applicable
- Test patterns from existing DAL tests
- JSON examples field pattern from RecipientCategory and ProcessingAct models

### Scope Boundaries

**In Scope:**

- Prisma schema additions (DataCategory model, SensitivityLevel enum, junction table)
- Database migration
- DAL functions with full CRUD support
- Cursor-based pagination with filters
- Integration tests for DAL functions
- Auto-derivation logic for isSpecialCategory based on linked DataNatures

**Out of Scope:**

- UI components (React components, pages, forms)
- tRPC routers and API endpoints
- DataProcessingActivityDataCategory junction table (roadmap item #13)
- Seed data for common data categories (can be added later)
- Validation schemas in @compilothq/validation package

### Technical Considerations

- Follow existing Prisma schema organization (add under Reference Data or new Data Classification section)
- Maintain consistent naming conventions (DataCategory, not PersonalDataCategory)
- Use cuid() for primary keys per existing pattern
- Ensure cascade delete from Organization to DataCategory
- Junction table should have unique constraint on (dataCategoryId, dataNatureId)
- DAL should export all functions from packages/database/src/dal/index.ts
- Tests should use the existing test infrastructure (Vitest)
