# Specification: DataSubjectCategory Model

## Goal

Implement the DataSubjectCategory model for GDPR compliance, enabling classification and management of data subject types (employees, customers, minors, patients, etc.) with vulnerability tracking and DPIA suggestion capabilities.

## User Stories

- As a DPO, I want to categorize data subjects by type and vulnerability status so that I can assess processing risk and determine DPIA requirements
- As a Privacy Officer, I want access to pre-defined GDPR-compliant data subject categories so that I can quickly document processing activities

## Specific Requirements

**Hybrid Scope Model (System-wide + Organization-specific)**

- Use nullable `organizationId` field for hybrid scope support
- System-defined categories have `organizationId: null` and `isSystemDefined: true`
- Organization-specific categories have a valid `organizationId` and `isSystemDefined: false`
- Unique constraint on `[code, organizationId]` to allow same code in different organizations
- Query patterns must filter by organizationId OR null for system-wide defaults

**Data Subject Classification Fields**

- `code` field: uppercase machine identifier (EMPLOYEE, CUSTOMER, MINOR, etc.)
- `name` field: human-readable display name
- `description` field: detailed explanation of the category
- `category` field: flexible string grouping (internal, external, vulnerable, special)
- `examples` field: JSON array of specific examples per category

**Vulnerability Tracking (GDPR Article 35)**

- `isVulnerable` boolean flag indicating vulnerable data subject status
- `vulnerabilityReason` optional text explaining why category is vulnerable
- `vulnerabilityArticle` field referencing specific GDPR article (e.g., "Art. 35(3)(c)")
- Pre-seed vulnerable categories: MINOR (Art. 8), PATIENT (Art. 9), ELDERLY, ASYLUM_SEEKER

**DPIA Suggestion Capability**

- `suggestsDPIA` boolean flag as informational hint (not automatic trigger)
- `dpiaRationale` optional text explaining DPIA recommendation rationale
- Application-layer logic uses this as suggestion; human judgment required
- Vulnerable categories should default `suggestsDPIA: true`

**Standard Model Fields**

- `id` as cuid primary key using `@default(cuid())`
- `gdprArticle` field for GDPR legal reference
- `isActive` boolean with `@default(true)` for soft filtering
- `isSystemDefined` boolean to distinguish system vs custom categories
- `createdAt` and `updatedAt` timestamp fields with Prisma defaults

**Database Indexes and Constraints**

- Primary index on `id`
- Unique composite constraint on `[code, organizationId]`
- Index on `organizationId` for organization-scoped queries
- Index on `[organizationId, isActive]` for filtered list queries
- Index on `category` for grouping queries

**Comprehensive Seed Data**

- Internal category: EMPLOYEE, JOB_APPLICANT, CONTRACTOR
- External category: CUSTOMER, PROSPECT, SUPPLIER, WEBSITE_VISITOR, NEWSLETTER_SUBSCRIBER
- Vulnerable category: MINOR, PATIENT, STUDENT, ELDERLY, ASYLUM_SEEKER
- All seed data marked `isSystemDefined: true` with `organizationId: null`

**DAL Implementation**

- `listDataSubjectCategories(organizationId?: string)`: list active categories for org + system defaults
- `getDataSubjectCategoryById(id: string)`: retrieve by primary key
- `getDataSubjectCategoryByCode(code: string, organizationId?: string)`: retrieve by code with scope
- `getVulnerableDataSubjectCategories(organizationId?: string)`: filter by isVulnerable = true

## Visual Design

No visual assets provided - this is a database model implementation without UI components.

## Existing Code to Leverage

**RecipientCategory Model Pattern (`/packages/database/prisma/schema.prisma` lines 238-252)**

- Follow same field structure: `code` (unique), `name`, `examples` (Json array), `isActive`
- Use identical index patterns on `name` field
- Reference for boolean flag fields like `requiresDPA` and `requiresImpactAssessment`

**RecipientCategory DAL (`/packages/database/src/dal/recipientCategories.ts`)**

- Follow `listRecipientCategories()` pattern filtering by `isActive: true` and ordering by `name`
- Replicate `getRecipientCategoryById()` using `findUnique` with `where: { id }`
- Follow `getRecipientCategoryByCode()` using `findUnique` with `where: { code }`

**Seed Data Pattern (`/packages/database/prisma/seeds/recipientCategories.ts`)**

- Use tuple array structure for data definition with type annotation
- Implement existing count check to skip seeding if data exists
- Use `createMany` with `skipDuplicates: true` for idempotent seeding
- Export async function accepting `PrismaClient` parameter

**Test Factory Pattern (`/packages/database/src/test-utils/factories/recipient-category-factory.ts`)**

- Extend `Factory` base class with model type and build data type
- Implement `defaults()` method with sequential unique values
- Implement `persist()` method using `prisma.model.create()`
- Export pre-configured factory variants for common test scenarios

**Integration Test Pattern (`/packages/database/__tests__/integration/dal/countries.integration.test.ts`)**

- Use Vitest with `beforeAll`, `beforeEach`, `afterAll` hooks
- Call `setupTestDatabase()` in `beforeAll`, `cleanupTestDatabase()` in `beforeEach`
- Test CRUD operations, unique constraints, and query filters
- Use factory pattern for test data generation

## Out of Scope

- Processing activity relationships (join table to DataProcessingActivity)
- UI components for data subject category management
- tRPC API endpoints for CRUD operations
- Volume estimation tracking per data subject type
- User permissions and access control for categories
- Audit log integration for category changes
- Deletion and retention logic for categories
- Bulk import/export functionality
- Localization/translation of category names
- Custom validation rules beyond Prisma schema constraints
