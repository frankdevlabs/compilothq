# Specification: Personal Data Category Model

## Goal

Implement the DataCategory model for classifying personal data with sensitivity levels, special category detection (Article 9/10), and GDPR compliance tracking. This enables automatic detection of special category data and supports legal basis validation through relationships with DataNature.

## User Stories

- As a DPO, I want to create data categories with sensitivity classifications so that I can properly assess risk and apply appropriate safeguards
- As a Privacy Officer, I want to link data categories to GDPR data natures so that special category status is automatically detected

## Specific Requirements

**SensitivityLevel Enum**

- Create enum with four levels: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
- Ordered hierarchy: PUBLIC < INTERNAL < CONFIDENTIAL < RESTRICTED
- Aligns with ISO 27001 classification standards
- Used for filtering and threshold-based queries

**DataCategory Prisma Model**

- `id` - cuid primary key using `@default(cuid())`
- `name` - String, required, organization-specific category name
- `description` - String, optional, detailed category description
- `organizationId` - String, required, foreign key to Organization with cascade delete
- `sensitivity` - SensitivityLevel enum, required
- `isSpecialCategory` - Boolean, auto-derived from linked DataNatures with manual override capability
- `exampleFields` - Json, string array for example data fields like `["email", "phone_number"]`
- `metadata` - Json, stores override justification and extensible data

**DataCategory Audit and Status Fields**

- `isActive` - Boolean with default true for soft-delete pattern
- `createdAt` - DateTime with `@default(now())`
- `updatedAt` - DateTime with `@updatedAt`
- Follow existing model patterns from DataProcessingActivity

**DataCategoryDataNature Junction Table**

- `id` - cuid primary key
- `dataCategoryId` - String foreign key to DataCategory with cascade delete
- `dataNatureId` - String foreign key to DataNature (no cascade - reference data)
- Unique constraint on `@@unique([dataCategoryId, dataNatureId])`
- Enable many-to-many relationship for real-world data classification flexibility

**Database Indexes**

- `@@index([organizationId])` - multi-tenancy queries
- `@@index([organizationId, sensitivity])` - compound filter for sensitivity threshold
- `@@index([organizationId, isSpecialCategory])` - compound filter for special category
- `@@index([sensitivity])` - standalone sensitivity filtering
- `@@index([isSpecialCategory])` - standalone special category filtering

**Organization Relation Update**

- Add `dataCategories DataCategory[]` relation to Organization model
- Cascade delete ensures cleanup when organization is deleted
- Follow existing pattern from dataProcessingActivities relation

**isSpecialCategory Auto-Detection Algorithm**

- On create/update, query all linked DataNatures via junction table
- If ANY linked DataNature has `type = 'SPECIAL'`, set `isSpecialCategory = true`
- If manual override provided, store justification in metadata.specialCategoryOverride
- Conservative principle: auto-detection defaults to true when special natures detected
- Override metadata structure: `{ overridden: boolean, justification: string, overriddenAt: ISO8601, overriddenBy: userId }`

## Existing Code to Leverage

**DataProcessingActivity DAL Pattern**

- Path: `/home/user/compilothq/packages/database/src/dal/dataProcessingActivities.ts`
- Provides CRUD pattern with organizationId scoping, cursor-based pagination, filter options
- Security comments documenting multi-tenancy enforcement pattern to replicate
- Use same `getByIdForOrg` pattern for ownership verification

**DataNature Model and Seeds**

- Path: `/home/user/compilothq/packages/database/prisma/schema.prisma` lines 186-199
- Path: `/home/user/compilothq/packages/database/prisma/seeds/dataNatures.ts`
- Already includes 9 SPECIAL types (Article 9) and 20 NON_SPECIAL types
- No additional seed data needed - existing DataNatures are complete

**DataProcessingActivity Integration Tests**

- Path: `/home/user/compilothq/packages/database/__tests__/integration/dal/dataProcessingActivities.integration.test.ts`
- Provides test structure with shared organizations, beforeAll/afterAll setup
- Multi-tenancy isolation tests, cursor pagination tests, nullable field tests
- Use `createTestOrganization` and `cleanupTestOrganizations` helpers

**RecipientCategory JSON Examples Pattern**

- Path: `/home/user/compilothq/packages/database/prisma/schema.prisma` lines 238-252
- Shows `examples Json` field pattern for storing string arrays
- Apply same pattern for `exampleFields` in DataCategory

**Migration Pattern**

- Path: `/home/user/compilothq/packages/database/prisma/migrations/20251130123151_add_activity_processor_models/`
- Shows CreateEnum, CreateTable, CreateIndex, AddForeignKey order
- Follow same naming convention: `YYYYMMDDHHMMSS_add_data_category_model`

## DAL Layer Functions

**createDataCategory**

```typescript
export async function createDataCategory(data: {
  name: string
  description?: string
  organizationId: string
  sensitivity: SensitivityLevel
  isSpecialCategory?: boolean // Manual override
  exampleFields?: string[]
  metadata?: Prisma.InputJsonValue
  dataNatureIds?: string[] // IDs to link
}): Promise<DataCategory>
```
- Auto-calculate isSpecialCategory from linked DataNatures unless manually overridden
- If manual override with isSpecialCategory=false when natures suggest true, require justification in metadata
- Create junction table entries for dataNatureIds if provided

**getDataCategoryById**

```typescript
export async function getDataCategoryById(
  id: string,
  organizationId: string
): Promise<DataCategoryWithRelations | null>
```
- SECURITY: Enforce organization ownership by requiring organizationId match
- Include DataNatures via junction table in response
- Return null if not found or wrong organization

**listDataCategories**

```typescript
export async function listDataCategories(
  organizationId: string,
  options?: {
    sensitivity?: SensitivityLevel
    isSpecialCategory?: boolean
    search?: string // Search by name
    isActive?: boolean
    limit?: number
    cursor?: string
  }
): Promise<{ items: DataCategoryWithRelations[]; nextCursor: string | null }>
```
- Always scope by organizationId for multi-tenancy
- Support cursor-based pagination with configurable limit (default 50)
- Search filter uses case-insensitive contains on name field

**updateDataCategory**

```typescript
export async function updateDataCategory(
  id: string,
  organizationId: string,
  data: {
    name?: string
    description?: string | null
    sensitivity?: SensitivityLevel
    isSpecialCategory?: boolean // Manual override
    exampleFields?: string[] | null
    metadata?: Prisma.InputJsonValue
    dataNatureIds?: string[] // Replace all linked natures
    isActive?: boolean
  }
): Promise<DataCategory>
```
- SECURITY: Verify organizationId ownership before update
- When dataNatureIds provided, delete existing junction entries and create new ones
- Recalculate isSpecialCategory after dataNatureIds change unless manually overridden

**deleteDataCategory**

```typescript
export async function deleteDataCategory(
  id: string,
  organizationId: string
): Promise<DataCategory>
```
- SECURITY: Verify organizationId ownership before delete
- Junction table entries cascade delete automatically
- Return deleted record for confirmation

**getSpecialCategoryDataCategories**

```typescript
export async function getSpecialCategoryDataCategories(
  organizationId: string
): Promise<DataCategoryWithRelations[]>
```
- Convenience function for Article 9/10 compliance views
- Returns all categories where isSpecialCategory = true and isActive = true
- Include linked DataNatures in response

**getDataCategoriesBySensitivity**

```typescript
export async function getDataCategoriesBySensitivity(
  organizationId: string,
  minSensitivity: SensitivityLevel
): Promise<DataCategoryWithRelations[]>
```
- Filter by minimum sensitivity threshold using ordered comparison
- Sensitivity order: PUBLIC=0, INTERNAL=1, CONFIDENTIAL=2, RESTRICTED=3
- Returns categories at or above the specified sensitivity level

## Testing Requirements

**CRUD Operations Tests**

- Create category with all required fields and verify defaults
- Create category with all optional fields populated
- Create category with linked DataNatures via dataNatureIds
- Get category by ID with correct organization returns data
- Get category by ID with wrong organization returns null
- Update category fields including clearing nullable fields with null
- Delete category and verify cascade deletes junction entries

**Multi-Tenancy Isolation Tests**

- List categories only shows categories for requesting organization
- Cannot read category belonging to different organization
- Cannot update category belonging to different organization
- Cannot delete category belonging to different organization
- Count functions scoped to organization

**isSpecialCategory Auto-Detection Tests**

- Create category linked to SPECIAL DataNature sets isSpecialCategory=true
- Create category linked to only NON_SPECIAL DataNatures sets isSpecialCategory=false
- Create category with mixed natures sets isSpecialCategory=true (conservative)
- Update category adding SPECIAL nature recalculates to true
- Update category removing all SPECIAL natures recalculates to false
- Manual override to false stores justification in metadata
- Manual override persists through dataNatureIds updates

**Query and Filter Tests**

- Filter by sensitivity returns only matching categories
- Filter by isSpecialCategory=true returns only special categories
- Search by name performs case-insensitive partial match
- Cursor pagination returns correct pages and nextCursor
- Limit parameter respected with hasMore indicator
- getDataCategoriesBySensitivity threshold filtering works correctly

**Edge Cases and Validation Tests**

- Empty dataNatureIds array creates category with no linked natures
- Update with empty dataNatureIds clears all junction entries
- Very long name and description handled correctly
- Empty exampleFields array stored as empty JSON array
- Null vs undefined handling for optional fields
- Concurrent updates do not corrupt junction table

## Migration Plan

**Migration File Structure**

- File: `YYYYMMDDHHMMSS_add_data_category_model/migration.sql`
- Order: CreateEnum -> CreateTable DataCategory -> CreateTable junction -> CreateIndex -> AddForeignKey

**Migration SQL Steps**

1. Create SensitivityLevel enum with four values
2. Create DataCategory table with all fields and constraints
3. Create DataCategoryDataNature junction table
4. Create all required indexes on DataCategory
5. Create unique constraint on junction table
6. Add foreign key from DataCategory to Organization with CASCADE delete
7. Add foreign keys on junction table (CASCADE for DataCategory, no action for DataNature)

**Post-Migration Verification**

- Run `prisma generate` to update client types
- Verify indexes exist with `\d DataCategory` in psql
- Test cascade delete by removing test organization

## Seed Data

**DataNature Seeds (Already Complete)**

- Existing seed file at `/home/user/compilothq/packages/database/prisma/seeds/dataNatures.ts`
- Contains 9 SPECIAL category types (Article 9 GDPR): Racial Origin, Political Opinions, Religious Beliefs, Trade Union, Genetic, Biometric, Health, Sex Life, Sexual Orientation
- Contains 20 NON_SPECIAL types covering standard personal data
- No additional seed data required for this specification

**DataCategory Seed Data (Not Required)**

- DataCategories are organization-specific, not global reference data
- Organizations create their own categories based on their data processing needs
- No seed data needed for DataCategory model

## Out of Scope

- UI Components (React pages, forms, category selector components)
- tRPC Router (API endpoints for category CRUD operations)
- Validation Schemas (@compilothq/validation package zod schemas)
- DataCategory to DataProcessingActivity junction (Spec #13 - future linkage)
- Data Discovery Automation (Spec #44 - automated category detection)
- DPIA Auto-Trigger Logic based on categories (Spec #33-34)
- Document Generation using category data (Spec #38-41)
- Smart Suggestions/AI category recommendations (Spec #48)
- Category templates or pre-built category sets
- Category hierarchies or parent-child relationships
- Category versioning or change history tracking
