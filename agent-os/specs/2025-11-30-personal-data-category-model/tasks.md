# Task Breakdown: Personal Data Category Model

## Overview

Total Tasks: 34 (across 4 task groups)

This specification implements the DataCategory model for classifying personal data with sensitivity levels, automatic special category detection (GDPR Article 9/10), and multi-tenancy support. The implementation includes Prisma schema changes, DAL functions with auto-detection logic, and comprehensive integration tests.

## Task List

### Database Layer

#### Task Group 1: Prisma Schema and Migration

**Dependencies:** None

- [ ] 1.0 Complete database schema layer
  - [ ] 1.1 Write 4 focused tests for DataCategory model structure
    - Test DataCategory creation with all required fields
    - Test SensitivityLevel enum values (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED)
    - Test DataCategoryDataNature junction table unique constraint
    - Test Organization cascade delete removes DataCategories
  - [ ] 1.2 Create SensitivityLevel enum in Prisma schema
    - File: `/home/user/compilothq/packages/database/prisma/schema.prisma`
    - Add after line 161 (after DataNatureType enum) in Reference Data section:
    ```prisma
    enum SensitivityLevel {
      PUBLIC       // Publicly available data
      INTERNAL     // Internal use only
      CONFIDENTIAL // Confidential business data
      RESTRICTED   // Highly restricted sensitive data
    }
    ```
  - [ ] 1.3 Create DataCategory model in Prisma schema
    - Add new section "Data Classification" after Reference Data section (after line 252)
    - Fields:
      - `id` - cuid primary key `@default(cuid())`
      - `name` - String, required
      - `description` - String, optional
      - `organizationId` - String, required (FK to Organization)
      - `sensitivity` - SensitivityLevel enum, required
      - `isSpecialCategory` - Boolean, required (auto-derived with override)
      - `exampleFields` - Json, optional (string array)
      - `metadata` - Json, optional (override justification storage)
      - `isActive` - Boolean, default true
      - `createdAt` - DateTime, @default(now())
      - `updatedAt` - DateTime, @updatedAt
    - Follow pattern from DataProcessingActivity model (lines 296-340)
  - [ ] 1.4 Create DataCategoryDataNature junction table
    - Same section as DataCategory
    - Fields:
      - `id` - cuid primary key
      - `dataCategoryId` - String (FK to DataCategory, onDelete: Cascade)
      - `dataNatureId` - String (FK to DataNature, onDelete: Restrict)
    - Add unique constraint: `@@unique([dataCategoryId, dataNatureId])`
    - Add indexes for both foreign keys
  - [ ] 1.5 Add database indexes to DataCategory model
    - `@@index([organizationId])` - multi-tenancy queries
    - `@@index([organizationId, sensitivity])` - compound filter
    - `@@index([organizationId, isSpecialCategory])` - compound filter
    - `@@index([sensitivity])` - standalone sensitivity filter
    - `@@index([isSpecialCategory])` - standalone special category filter
  - [ ] 1.6 Update Organization model with DataCategory relation
    - File: `/home/user/compilothq/packages/database/prisma/schema.prisma`
    - Add relation in Organization model (around line 57-58):
    ```prisma
    dataCategories DataCategory[]
    ```
    - Follow existing pattern from `dataProcessingActivities` relation
  - [ ] 1.7 Add DataNature relation to junction table
    - Update DataNature model to include back-reference:
    ```prisma
    dataCategoryLinks DataCategoryDataNature[]
    ```
  - [ ] 1.8 Generate and run Prisma migration
    - Run `npx prisma migrate dev --name add_data_category_model`
    - Verify migration file created in `/home/user/compilothq/packages/database/prisma/migrations/`
    - Migration order: CreateEnum -> CreateTable DataCategory -> CreateTable junction -> CreateIndex -> AddForeignKey
  - [ ] 1.9 Generate Prisma client and verify types
    - Run `npx prisma generate`
    - Verify DataCategory, DataCategoryDataNature, and SensitivityLevel are exported
  - [ ] 1.10 Ensure database layer tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify migration runs successfully
    - Verify Prisma client types generate correctly

**Acceptance Criteria:**
- SensitivityLevel enum has 4 values: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
- DataCategory model has all specified fields with correct types
- DataCategoryDataNature junction table enforces unique constraint
- All 5 indexes created on DataCategory
- Organization cascade delete removes DataCategories
- Prisma client generates with correct types

**File Paths:**
- Schema: `/home/user/compilothq/packages/database/prisma/schema.prisma`
- Migration: `/home/user/compilothq/packages/database/prisma/migrations/[timestamp]_add_data_category_model/`

---

### DAL Layer

#### Task Group 2: Core DAL Functions

**Dependencies:** Task Group 1

- [ ] 2.0 Complete core DAL implementation
  - [ ] 2.1 Write 6 focused tests for core DAL functions
    - Test createDataCategory with required fields returns correct data
    - Test getDataCategoryById with correct org returns data, wrong org returns null
    - Test listDataCategories returns only organization's categories
    - Test updateDataCategory modifies fields correctly
    - Test deleteDataCategory removes record and junction entries cascade
    - Test cursor-based pagination returns correct pages
  - [ ] 2.2 Create DAL file structure
    - Create file: `/home/user/compilothq/packages/database/src/dal/dataCategories.ts`
    - Add imports from Prisma client (DataCategory, SensitivityLevel, Prisma types)
    - Import prisma singleton
    - Follow pattern from `/home/user/compilothq/packages/database/src/dal/dataProcessingActivities.ts`
  - [ ] 2.3 Create helper function for isSpecialCategory auto-detection
    - Internal function `calculateIsSpecialCategory(dataNatureIds: string[]): Promise<boolean>`
    - Query DataNature records by IDs
    - Return true if ANY linked DataNature has `type === 'SPECIAL'`
    - Return false if no SPECIAL natures found
    - Handle empty array (return false)
  - [ ] 2.4 Create helper function for override metadata handling
    - Internal function to merge override metadata
    - Structure: `{ specialCategoryOverride: { overridden: boolean, justification: string, overriddenAt: ISO8601, overriddenBy?: string } }`
    - Preserve existing metadata fields when adding override
  - [ ] 2.5 Implement createDataCategory function
    ```typescript
    export async function createDataCategory(data: {
      name: string
      description?: string
      organizationId: string
      sensitivity: SensitivityLevel
      isSpecialCategory?: boolean // Manual override
      exampleFields?: string[]
      metadata?: Prisma.InputJsonValue
      dataNatureIds?: string[]
    }): Promise<DataCategory>
    ```
    - SECURITY comment: "Activity is automatically scoped to the provided organizationId"
    - Auto-calculate isSpecialCategory if not manually provided
    - If manual override differs from calculated, store justification in metadata
    - Create junction table entries for dataNatureIds in transaction
    - Use Prisma transaction for atomic creation
  - [ ] 2.6 Implement getDataCategoryById function
    ```typescript
    export async function getDataCategoryById(
      id: string,
      organizationId: string
    ): Promise<DataCategoryWithRelations | null>
    ```
    - SECURITY comment: "Enforces multi-tenancy by requiring both id and organizationId match"
    - Include dataNatures via junction table in response
    - Return null if not found OR wrong organization
    - Define DataCategoryWithRelations type with included relations
  - [ ] 2.7 Implement listDataCategories function
    ```typescript
    export async function listDataCategories(
      organizationId: string,
      options?: {
        sensitivity?: SensitivityLevel
        isSpecialCategory?: boolean
        search?: string
        isActive?: boolean
        limit?: number
        cursor?: string
      }
    ): Promise<{ items: DataCategoryWithRelations[]; nextCursor: string | null }>
    ```
    - SECURITY comment: "Always filters by organizationId to enforce multi-tenancy"
    - Default limit: 50
    - Search: case-insensitive contains on name field
    - Order by: `[{ createdAt: 'desc' }, { id: 'desc' }]`
    - Follow cursor pagination pattern from dataProcessingActivities.ts
  - [ ] 2.8 Implement updateDataCategory function
    ```typescript
    export async function updateDataCategory(
      id: string,
      organizationId: string,
      data: {
        name?: string
        description?: string | null
        sensitivity?: SensitivityLevel
        isSpecialCategory?: boolean
        exampleFields?: string[] | null
        metadata?: Prisma.InputJsonValue
        dataNatureIds?: string[]
        isActive?: boolean
      }
    ): Promise<DataCategory>
    ```
    - SECURITY comment: "Verify organizationId ownership before update"
    - First verify record exists and belongs to organization
    - When dataNatureIds provided: delete existing junction entries, create new ones
    - Recalculate isSpecialCategory after dataNatureIds change (unless manually overridden)
    - Use Prisma transaction for atomic update
  - [ ] 2.9 Implement deleteDataCategory function
    ```typescript
    export async function deleteDataCategory(
      id: string,
      organizationId: string
    ): Promise<DataCategory>
    ```
    - SECURITY comment: "Verify organizationId ownership before delete"
    - First verify record exists and belongs to organization
    - Junction table entries cascade delete automatically
    - Return deleted record for confirmation
  - [ ] 2.10 Ensure core DAL tests pass
    - Run ONLY the 6 tests written in 2.1
    - Verify all CRUD operations work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- All 6 core DAL tests pass
- CRUD operations enforce organization ownership
- Auto-detection logic correctly calculates isSpecialCategory
- Manual override stored in metadata with justification
- Junction table entries managed correctly in transactions
- Cursor-based pagination works as expected

**File Paths:**
- DAL: `/home/user/compilothq/packages/database/src/dal/dataCategories.ts`
- Pattern reference: `/home/user/compilothq/packages/database/src/dal/dataProcessingActivities.ts`

---

#### Task Group 3: Specialized DAL Functions and Exports

**Dependencies:** Task Group 2

- [ ] 3.0 Complete specialized DAL functions and exports
  - [ ] 3.1 Write 4 focused tests for specialized DAL functions
    - Test getSpecialCategoryDataCategories returns only isSpecialCategory=true categories
    - Test getDataCategoriesBySensitivity with CONFIDENTIAL threshold returns CONFIDENTIAL and RESTRICTED
    - Test sensitivity ordering (PUBLIC < INTERNAL < CONFIDENTIAL < RESTRICTED)
    - Test isActive=false categories excluded from specialized queries
  - [ ] 3.2 Implement getSpecialCategoryDataCategories function
    ```typescript
    export async function getSpecialCategoryDataCategories(
      organizationId: string
    ): Promise<DataCategoryWithRelations[]>
    ```
    - Filter: `isSpecialCategory = true AND isActive = true`
    - Include linked DataNatures in response
    - Use for Article 9/10 compliance views
    - Order by name ascending
  - [ ] 3.3 Implement getDataCategoriesBySensitivity function
    ```typescript
    export async function getDataCategoriesBySensitivity(
      organizationId: string,
      minSensitivity: SensitivityLevel
    ): Promise<DataCategoryWithRelations[]>
    ```
    - Define sensitivity order map: `{ PUBLIC: 0, INTERNAL: 1, CONFIDENTIAL: 2, RESTRICTED: 3 }`
    - Filter categories at or above minimum threshold
    - Use Prisma `in` filter with eligible sensitivity levels
    - Filter: `isActive = true`
    - Include linked DataNatures in response
  - [ ] 3.4 Define and export TypeScript types
    - Export `DataCategoryWithRelations` type
    - Export `DataCategoryCreateInput` type
    - Export `DataCategoryUpdateInput` type
    - Export `DataCategoryListOptions` type
  - [ ] 3.5 Update database package exports
    - File: `/home/user/compilothq/packages/database/src/index.ts`
    - Add export: `export * from './dal/dataCategories'`
    - Add DataCategory to explicit type exports
    - Add DataCategoryDataNature to explicit type exports
    - Add SensitivityLevel to explicit type exports (if not auto-exported)
  - [ ] 3.6 Ensure specialized DAL tests pass
    - Run ONLY the 4 tests written in 3.1
    - Verify threshold filtering works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- All 4 specialized DAL tests pass
- getSpecialCategoryDataCategories returns only special categories
- getDataCategoriesBySensitivity correctly filters by threshold
- All functions and types exported from package index
- TypeScript types compile without errors

**File Paths:**
- DAL: `/home/user/compilothq/packages/database/src/dal/dataCategories.ts`
- Exports: `/home/user/compilothq/packages/database/src/index.ts`

---

### Testing

#### Task Group 4: Integration Tests and Verification

**Dependencies:** Task Groups 1-3

- [ ] 4.0 Complete integration tests and verification
  - [ ] 4.1 Create integration test file structure
    - Create file: `/home/user/compilothq/packages/database/__tests__/integration/dal/dataCategories.integration.test.ts`
    - Follow pattern from `/home/user/compilothq/packages/database/__tests__/integration/dal/dataProcessingActivities.integration.test.ts`
    - Set up shared test organizations with beforeAll/afterAll
    - Import test utilities: `createTestOrganization`, `cleanupTestOrganizations`
  - [ ] 4.2 Review tests from Task Groups 1-3
    - Review the 4 tests written by Task Group 1 (schema tests)
    - Review the 6 tests written by Task Group 2 (core DAL tests)
    - Review the 4 tests written by Task Group 3 (specialized DAL tests)
    - Total existing tests: 14 tests
  - [ ] 4.3 Implement CRUD operations test suite
    - Test: Create category with all required fields and verify defaults
    - Test: Create category with all optional fields populated
    - Test: Create category with linked DataNatures via dataNatureIds
    - Test: Get category by ID with correct organization returns data with relations
    - Test: Get category by ID with wrong organization returns null
    - Test: Update category fields including clearing nullable fields with null
    - Test: Delete category and verify cascade deletes junction entries
  - [ ] 4.4 Implement multi-tenancy isolation test suite
    - Test: List categories only shows categories for requesting organization
    - Test: Cannot read category belonging to different organization
    - Test: Cannot update category belonging to different organization
    - Test: Cannot delete category belonging to different organization
  - [ ] 4.5 Implement isSpecialCategory auto-detection test suite
    - Test: Create category linked to SPECIAL DataNature sets isSpecialCategory=true
    - Test: Create category linked to only NON_SPECIAL DataNatures sets isSpecialCategory=false
    - Test: Create category with mixed natures sets isSpecialCategory=true (conservative)
    - Test: Update category adding SPECIAL nature recalculates to true
    - Test: Update category removing all SPECIAL natures recalculates to false
    - Test: Manual override to false stores justification in metadata
    - Test: Manual override persists through dataNatureIds updates
  - [ ] 4.6 Implement query and filter test suite
    - Test: Filter by sensitivity returns only matching categories
    - Test: Filter by isSpecialCategory=true returns only special categories
    - Test: Search by name performs case-insensitive partial match
    - Test: Cursor pagination returns correct pages and nextCursor
    - Test: Limit parameter respected with hasMore indicator
    - Test: getDataCategoriesBySensitivity threshold filtering works correctly
  - [ ] 4.7 Implement edge cases test suite
    - Test: Empty dataNatureIds array creates category with no linked natures
    - Test: Update with empty dataNatureIds clears all junction entries
    - Test: Very long name and description handled correctly
    - Test: Empty exampleFields array stored as empty JSON array
    - Test: Null vs undefined handling for optional fields
  - [ ] 4.8 Run complete feature test suite
    - Run ALL tests in dataCategories.integration.test.ts
    - Expected total: approximately 30-35 tests
    - Verify >80% code coverage target
    - All tests must pass before completion
  - [ ] 4.9 Verify database integration
    - Run `npx prisma db push --force-reset` on test database
    - Verify all indexes created with `\d "DataCategory"` in psql
    - Test cascade delete by removing test organization
    - Verify junction table constraints work correctly

**Acceptance Criteria:**
- All integration tests pass (approximately 30-35 tests total)
- Multi-tenancy isolation fully tested
- isSpecialCategory auto-detection logic thoroughly tested
- Query and filter functions work correctly
- Edge cases handled appropriately
- >80% code coverage achieved
- Database constraints verified

**File Paths:**
- Test file: `/home/user/compilothq/packages/database/__tests__/integration/dal/dataCategories.integration.test.ts`
- Pattern reference: `/home/user/compilothq/packages/database/__tests__/integration/dal/dataProcessingActivities.integration.test.ts`

---

## Execution Order

Recommended implementation sequence:

1. **Database Layer (Task Group 1)** - Schema changes must be completed first
   - Create enum and models in schema
   - Generate and run migration
   - Generate Prisma client

2. **Core DAL Functions (Task Group 2)** - Depends on schema completion
   - Create DAL file with helper functions
   - Implement CRUD operations
   - Ensure organization-scoped security

3. **Specialized DAL Functions (Task Group 3)** - Depends on core DAL
   - Implement specialized query functions
   - Export from package index
   - Define TypeScript types

4. **Integration Tests (Task Group 4)** - Depends on all DAL functions
   - Comprehensive test coverage
   - Multi-tenancy isolation verification
   - Auto-detection logic verification

## Key Implementation Notes

### Security Pattern
All DAL functions must enforce multi-tenancy by requiring `organizationId` parameter:
```typescript
// SECURITY: Enforces multi-tenancy by requiring both id and organizationId match
```

### Auto-Detection Algorithm
```typescript
// Conservative principle: if ANY linked DataNature has type='SPECIAL', return true
const isSpecial = dataNatures.some(dn => dn.type === 'SPECIAL')
```

### Override Metadata Structure
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

### Sensitivity Level Ordering
```typescript
const sensitivityOrder = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  RESTRICTED: 3
}
```

## Reference Files

| Purpose | File Path |
|---------|-----------|
| Prisma Schema | `/home/user/compilothq/packages/database/prisma/schema.prisma` |
| DAL Pattern | `/home/user/compilothq/packages/database/src/dal/dataProcessingActivities.ts` |
| Test Pattern | `/home/user/compilothq/packages/database/__tests__/integration/dal/dataProcessingActivities.integration.test.ts` |
| Package Exports | `/home/user/compilothq/packages/database/src/index.ts` |
| DataNature Seeds | `/home/user/compilothq/packages/database/prisma/seeds/dataNatures.ts` |
| Test Utilities | `/home/user/compilothq/packages/database/src/test-utils/factories/index.ts` |
