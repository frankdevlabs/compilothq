# Database Model Implementation Guide

**Complete Architectural Workflow for `packages/database`**

This guide documents the step-by-step process for implementing new database models in the Compilo monorepo, based on established patterns from existing models like `Recipient`, `DataSubjectCategory`, and `PersonalDataCategory`.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Schema Design](#step-1-schema-design)
3. [Step 2: Create Migration](#step-2-create-migration)
4. [Step 3: Data Access Layer (DAL)](#step-3-data-access-layer-dal)
5. [Step 4: Validation Layer (Optional)](#step-4-validation-layer-optional)
6. [Step 5: Test Factories](#step-5-test-factories)
7. [Step 6: Integration Tests](#step-6-integration-tests)
8. [Step 7: Seed Data (Optional)](#step-7-seed-data-optional)
9. [Step 8: Export Configuration](#step-8-export-configuration)
10. [Step 9: Verification](#step-9-verification)
11. [Checklist](#implementation-checklist)

---

## Prerequisites

Before implementing a new model:

- [ ] Understand the business domain and GDPR implications
- [ ] Identify relationships with existing models
- [ ] Determine multi-tenancy requirements (org-scoped vs global)
- [ ] Review existing similar models for patterns
- [ ] Ensure PostgreSQL test database is running (`compilothq_test` on port 5433)

---

## Step 1: Schema Design

**Location:** `packages/database/prisma/schema.prisma`

### 1.1 Create Enums (if needed)

```prisma
/// Document what this enum represents and its GDPR context
enum RecipientType {
  PROCESSOR           // GDPR Art. 28 - data processor
  SUB_PROCESSOR       // GDPR Art. 28(2) - sub-processor chain
  JOINT_CONTROLLER    // GDPR Art. 26 - joint controller
  SERVICE_PROVIDER
  SEPARATE_CONTROLLER
  PUBLIC_AUTHORITY
  INTERNAL_DEPARTMENT
}
```

**Patterns:**

- Use SCREAMING_SNAKE_CASE for enum values
- Add comments explaining legal/business context
- Place enum definitions before model definitions

### 1.2 Define the Model

```prisma
/// [Model name] - Brief description
/// GDPR Context: Article references if applicable
model ModelName {
  // === Primary Key ===
  id        String   @id @default(cuid())

  // === Multi-tenancy (if org-scoped) ===
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // === Core Fields ===
  name          String
  description   String?
  type          RecipientType
  isActive      Boolean @default(true)

  // === Self-referential Hierarchy (if applicable) ===
  parentId      String?
  hierarchyType HierarchyType?
  parent        ModelName?   @relation("ModelHierarchy", fields: [parentId], references: [id], onDelete: Restrict)
  children      ModelName[]  @relation("ModelHierarchy")

  // === Foreign Key Relations ===
  externalOrgId String?
  externalOrg   ExternalOrganization? @relation(fields: [externalOrgId], references: [id], onDelete: SetNull)

  // === JSON Metadata (use sparingly) ===
  metadata      Json?

  // === Timestamps (ALWAYS include) ===
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // === Indexes ===
  @@index([organizationId])
  @@index([organizationId, type])
  @@index([organizationId, isActive])
  @@index([parentId])

  // === Unique Constraints ===
  @@unique([code, organizationId])

  // === Table Name ===
  @@map("ModelName")
}
```

### 1.3 Schema Design Checklist

**Multi-tenancy:**

- [ ] Add `organizationId: String` for org-scoped models
- [ ] Add `organizationId?: String` for hybrid scope (system-wide + org-specific)
- [ ] Omit `organizationId` only for truly global entities (like `Country`, `ExternalOrganization`)
- [ ] Add `onDelete: Cascade` for org-scoped models
- [ ] Include `organizationId` in unique constraints where applicable

**Timestamps:**

- [ ] Always include `createdAt` and `updatedAt`
- [ ] Consider `deletedAt?: DateTime?` for soft deletes
- [ ] Add `@@index([deletedAt])` if using soft delete

**Relationships:**

- [ ] Use `onDelete: Cascade` when child must be deleted with parent
- [ ] Use `onDelete: SetNull` when reference can be cleared
- [ ] Use `onDelete: Restrict` to prevent orphaned records
- [ ] Always specify `onUpdate: Cascade` for foreign keys

**Indexes:**

- [ ] Index `organizationId` on all org-scoped models
- [ ] Index foreign keys for JOIN performance
- [ ] Index frequently queried fields (status, type, dates)
- [ ] Use composite indexes for common query patterns: `@@index([organizationId, status])`
- [ ] Index temporal fields for range queries: `@@index([nextReviewDate])`

**Naming Conventions:**

- [ ] Model name: Singular PascalCase (`Recipient`, not `Recipients`)
- [ ] Table name: Usually matches model, explicitly set with `@@map()` if different
- [ ] Field names: camelCase (`organizationId`, `createdAt`)
- [ ] Enum values: SCREAMING_SNAKE_CASE (`DATA_PROCESSOR`)

**Data Types:**

- [ ] Use `String @id @default(cuid())` for IDs (not UUID, for better DB performance)
- [ ] Use `Boolean @default(true)` for flags with sensible defaults
- [ ] Use `Int` for counts, `Float`/`Decimal` for money
- [ ] Use `DateTime` for timestamps
- [ ] Use `Json` sparingly (prefer structured columns)
- [ ] Use enums over strings when values are constrained

**Hierarchy Support (if needed):**

- [ ] Self-referential FK: `parentId: String?`
- [ ] Named relation: `@relation("ModelHierarchy")`
- [ ] Restrict delete on parent to prevent data loss
- [ ] Include `hierarchyType` if multiple hierarchy types exist

---

## Step 2: Create Migration

### 2.1 Generate Migration

```bash
cd packages/database
pnpm prisma migrate dev --name add_model_name
```

**Migration naming convention:**

- `add_model_name` - Creating new model
- `update_model_add_field` - Adding fields
- `rename_old_to_new` - Renaming models/fields
- `add_model_indexes` - Adding indexes/constraints

### 2.2 Review Generated Migration

**Location:** `packages/database/prisma/migrations/[timestamp]_[name]/migration.sql`

**Check:**

- [ ] Enum creation precedes table creation
- [ ] Tables created with all columns
- [ ] Indexes created after data population (if migrating data)
- [ ] Foreign keys added last with proper CASCADE/SET NULL/RESTRICT behavior
- [ ] Comments explain complex data transformations

### 2.3 Complex Migration Pattern (Data Preservation)

If renaming or transforming data:

```sql
-- Step 1: Create new enum/table
CREATE TYPE "NewEnum" AS ENUM ('VALUE1', 'VALUE2');

-- Step 2: Add temporary column
ALTER TABLE "ModelName" ADD COLUMN "field_new" "NewEnum";

-- Step 3: Migrate data with mapping
UPDATE "ModelName"
SET "field_new" =
  CASE
    WHEN "field_old"::text = 'OLD_VALUE1' THEN 'VALUE1'::"NewEnum"
    WHEN "field_old"::text = 'OLD_VALUE2' THEN 'VALUE2'::"NewEnum"
    ELSE 'DEFAULT_VALUE'::"NewEnum"
  END;

-- Step 4: Drop old column, rename new
ALTER TABLE "ModelName" DROP COLUMN "field_old";
ALTER TABLE "ModelName" RENAME COLUMN "field_new" TO "field";

-- Step 5: Add NOT NULL constraint
ALTER TABLE "ModelName" ALTER COLUMN "field" SET NOT NULL;

-- Step 6: Create indexes
CREATE INDEX "ModelName_organizationId_field_idx"
  ON "ModelName"("organizationId", "field");

-- Step 7: Add foreign keys
ALTER TABLE "ModelName"
  ADD CONSTRAINT "ModelName_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "Organization"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
```

### 2.4 Test Migration

```bash
# Apply migration to test database
DATABASE_URL="postgresql://..." pnpm prisma migrate deploy

# Verify migration succeeded
pnpm prisma db push --skip-generate
```

---

## Step 3: Data Access Layer (DAL)

**Location:** `packages/database/src/dal/modelNames.ts`

### 3.1 File Structure

```typescript
/**
 * Data Access Layer for ModelName
 *
 * This DAL provides type-safe database operations for ModelName entities
 * with built-in multi-tenancy enforcement and relationship management.
 *
 * SECURITY: All operations enforce organizationId scoping to prevent
 * cross-organization data access.
 */

import type { ModelName, Prisma } from '../../generated/client/client'
import { prisma } from '../index'

// ============================================================================
// Types
// ============================================================================

export type ModelNameCreateInput = Omit<ModelName, 'id' | 'createdAt' | 'updatedAt'>

export type ModelNameUpdateInput = Partial<
  Omit<ModelName, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
>

export type ModelNameWithRelations = Prisma.ModelNameGetPayload<{
  include: {
    organization: true
    externalOrg: true
    children: true
  }
}>

// Custom return types for complex queries
export type ModelNameStatistics = {
  totalCount: number
  byType: Record<string, number>
  activeCount: number
  inactiveCount: number
}

// ============================================================================
// Create Operations
// ============================================================================

/**
 * Create a new ModelName
 *
 * @param data - ModelName creation data
 * @returns Newly created ModelName
 *
 * @example
 * const model = await createModelName({
 *   name: 'Example Model',
 *   type: 'TYPE_A',
 *   organizationId: 'org_123',
 * })
 */
export async function createModelName(data: ModelNameCreateInput): Promise<ModelName> {
  return await prisma.modelName.create({
    data,
  })
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get a ModelName by ID (no org check - use with caution)
 * SECURITY: Does NOT enforce multi-tenancy - use getModelNameByIdForOrg in most cases
 */
export async function getModelNameById(id: string): Promise<ModelName | null> {
  return await prisma.modelName.findUnique({
    where: { id },
  })
}

/**
 * Get a ModelName by ID with ownership verification
 * SECURITY: Enforces multi-tenancy by requiring both id and organizationId match
 * Returns null if ModelName doesn't exist or doesn't belong to the organization
 *
 * @param id - ModelName ID
 * @param organizationId - Organization ID
 * @returns ModelName if found and belongs to org, null otherwise
 */
export async function getModelNameByIdForOrg(
  id: string,
  organizationId: string
): Promise<ModelName | null> {
  return await prisma.modelName.findUnique({
    where: {
      id,
      organizationId, // Compound WHERE - must match both
    },
  })
}

/**
 * Get a ModelName by unique code within an organization
 *
 * @param code - Unique code
 * @param organizationId - Organization ID
 */
export async function getModelNameByCode(
  code: string,
  organizationId: string
): Promise<ModelName | null> {
  return await prisma.modelName.findUnique({
    where: {
      code_organizationId: {
        code,
        organizationId,
      },
    },
  })
}

/**
 * Get ModelName with all relations included
 */
export async function getModelNameWithRelations(
  id: string,
  organizationId: string
): Promise<ModelNameWithRelations | null> {
  return await prisma.modelName.findUnique({
    where: { id, organizationId },
    include: {
      organization: true,
      externalOrg: true,
      children: true,
    },
  })
}

// ============================================================================
// List Operations (with Cursor-based Pagination)
// ============================================================================

/**
 * List ModelNames for an organization with cursor-based pagination
 *
 * PAGINATION: Uses cursor-based pagination for efficient traversal of large datasets
 * Returns items + nextCursor for fetching subsequent pages
 *
 * @param organizationId - Organization ID
 * @param options - Filtering and pagination options
 * @returns Object containing items array and nextCursor
 *
 * @example
 * const { items, nextCursor } = await listModelNames('org_123', {
 *   type: 'TYPE_A',
 *   limit: 50,
 * })
 *
 * // Fetch next page
 * const page2 = await listModelNames('org_123', {
 *   type: 'TYPE_A',
 *   limit: 50,
 *   cursor: nextCursor,
 * })
 */
export async function listModelNames(
  organizationId: string,
  options?: {
    type?: string
    isActive?: boolean
    limit?: number
    cursor?: string
  }
): Promise<{ items: ModelName[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 50

  // Build where clause
  const where: Prisma.ModelNameWhereInput = {
    organizationId,
    ...(options?.type && { type: options.type }),
    ...(options?.isActive !== undefined && { isActive: options.isActive }),
  }

  // Fetch one extra to detect if more exist
  const modelNames = await prisma.modelName.findMany({
    where,
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' }, // Deterministic tie-breaker
    ],
    take: limit + 1,
    ...(options?.cursor
      ? {
          cursor: { id: options.cursor },
          skip: 1, // Skip cursor itself
        }
      : {}),
  })

  const hasMore = modelNames.length > limit
  const items = hasMore ? modelNames.slice(0, limit) : modelNames
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

  return { items, nextCursor }
}

/**
 * Get all active ModelNames for an organization (no pagination)
 * Use this for dropdowns and small datasets only
 */
export async function getActiveModelNames(organizationId: string): Promise<ModelName[]> {
  return await prisma.modelName.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  })
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update a ModelName
 * SECURITY: Enforces organizationId match in WHERE clause
 *
 * @param id - ModelName ID
 * @param organizationId - Organization ID (for security)
 * @param data - Update data
 * @throws Error if ModelName not found or doesn't belong to org
 */
export async function updateModelName(
  id: string,
  organizationId: string,
  data: ModelNameUpdateInput
): Promise<ModelName> {
  return await prisma.modelName.update({
    where: {
      id,
      organizationId, // Security: Prevent cross-org updates
    },
    data,
  })
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete a ModelName (hard delete)
 * SECURITY: Enforces organizationId match
 *
 * @param id - ModelName ID
 * @param organizationId - Organization ID (for security)
 */
export async function deleteModelName(id: string, organizationId: string): Promise<ModelName> {
  return await prisma.modelName.delete({
    where: {
      id,
      organizationId,
    },
  })
}

/**
 * Soft delete a ModelName (set isActive = false)
 * Preferred over hard delete for audit trail
 */
export async function deactivateModelName(id: string, organizationId: string): Promise<ModelName> {
  return await updateModelName(id, organizationId, { isActive: false })
}

// ============================================================================
// Hierarchy Operations (if applicable)
// ============================================================================

/**
 * Get direct children of a ModelName
 * Returns only immediate children, not descendants
 */
export async function getDirectChildren(
  parentId: string,
  organizationId: string
): Promise<ModelName[]> {
  return await prisma.modelName.findMany({
    where: {
      parentId,
      organizationId,
    },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Get ancestor chain for a ModelName (bottom-up)
 * Returns array from immediate parent to root
 *
 * @example
 * // If hierarchy: Root -> Parent -> Child
 * const ancestors = await getAncestorChain(child.id, orgId)
 * // Returns: [Parent, Root]
 */
export async function getAncestorChain(
  modelId: string,
  organizationId: string
): Promise<ModelName[]> {
  const ancestors: ModelName[] = []
  let current = await getModelNameByIdForOrg(modelId, organizationId)

  while (current?.parentId) {
    const parent = await getModelNameByIdForOrg(current.parentId, organizationId)
    if (!parent) break
    ancestors.push(parent)
    current = parent
  }

  return ancestors
}

/**
 * Get full descendant tree using recursive CTE
 * Returns all descendants with depth tracking
 *
 * PERFORMANCE: Single database round-trip, PostgreSQL handles recursion
 *
 * @param modelId - Starting ModelName ID
 * @param organizationId - Organization ID
 * @param maxDepth - Maximum recursion depth (default 10)
 */
export async function getDescendantTree(
  modelId: string,
  organizationId: string,
  maxDepth = 10
): Promise<Array<ModelName & { depth: number }>> {
  const query = Prisma.sql`
    WITH RECURSIVE descendant_tree AS (
      -- Base case: direct children (depth 1)
      SELECT m.*, 1 as depth
      FROM "ModelName" m
      WHERE m."parentId" = ${modelId}
        AND m."organizationId" = ${organizationId}

      UNION ALL

      -- Recursive case: children of children
      SELECT m.*, dt.depth + 1 as depth
      FROM "ModelName" m
      INNER JOIN descendant_tree dt ON m."parentId" = dt.id
      WHERE dt.depth < ${maxDepth}
        AND m."organizationId" = ${organizationId}
    )
    SELECT * FROM descendant_tree
    ORDER BY depth, "createdAt" ASC
  `

  const results = await prisma.$queryRaw<Array<ModelName & { depth: bigint }>>(query)

  // Convert bigint depth to number
  return results.map((r) => ({
    ...r,
    depth: Number(r.depth),
  }))
}

/**
 * Check if setting parentId would create circular reference
 *
 * @returns true if circular reference detected, false if safe
 */
export async function checkCircularReference(
  modelId: string,
  newParentId: string,
  organizationId: string
): Promise<boolean> {
  // Check 1: Direct self-reference
  if (modelId === newParentId) {
    return true
  }

  // Check 2: Check if modelId exists in parent's ancestor chain
  // If yes, setting parent would create a cycle
  const ancestors = await getAncestorChain(newParentId, organizationId)
  return ancestors.some((ancestor) => ancestor.id === modelId)
}

// ============================================================================
// Statistics & Aggregations
// ============================================================================

/**
 * Get statistics for ModelNames in an organization
 *
 * PERFORMANCE: Fetches all records and aggregates in-memory
 * Consider server-side aggregation for large datasets
 */
export async function getModelNameStatistics(organizationId: string): Promise<ModelNameStatistics> {
  const modelNames = await prisma.modelName.findMany({
    where: { organizationId },
  })

  const stats: ModelNameStatistics = {
    totalCount: modelNames.length,
    byType: {},
    activeCount: 0,
    inactiveCount: 0,
  }

  for (const model of modelNames) {
    // Count by type
    stats.byType[model.type] = (stats.byType[model.type] ?? 0) + 1

    // Count active/inactive
    if (model.isActive) {
      stats.activeCount++
    } else {
      stats.inactiveCount++
    }
  }

  return stats
}

// ============================================================================
// Complex Queries
// ============================================================================

/**
 * Find ModelNames matching complex criteria
 * Demonstrates eager loading + client-side filtering
 */
export async function findModelNamesWithConditions(organizationId: string): Promise<ModelName[]> {
  // Fetch with relations
  const modelNames = await prisma.modelName.findMany({
    where: { organizationId },
    include: {
      externalOrg: true,
      children: true,
    },
  })

  // Filter in application code when SQL would be too complex
  return modelNames.filter((model) => {
    // Custom business logic here
    return model.isActive && model.children.length > 0
  })
}
```

### 3.2 DAL Patterns Checklist

**Function Organization:**

- [ ] Group by CRUD operations (Create, Read, Update, Delete)
- [ ] Separate list/query operations
- [ ] Add hierarchy operations if applicable
- [ ] Include statistics/aggregations if needed

**Security:**

- [ ] Always include `organizationId` in WHERE clauses for org-scoped models
- [ ] Add SECURITY comments explaining multi-tenancy enforcement
- [ ] Provide both `getById()` and `getByIdForOrg()` variants
- [ ] Never trust client-provided `organizationId` without verification

**Pagination:**

- [ ] Use cursor-based pagination (not offset) for scalability
- [ ] Return `{ items, nextCursor }` structure
- [ ] Fetch `limit + 1` to detect if more records exist
- [ ] Use deterministic ordering (include `id` as tie-breaker)

**Type Safety:**

- [ ] Define custom input types (`ModelNameCreateInput`, `ModelNameUpdateInput`)
- [ ] Define types for complex return values (`ModelNameStatistics`)
- [ ] Use `Prisma.ModelNameGetPayload` for relation types
- [ ] Export all custom types

**Documentation:**

- [ ] JSDoc on every function with description
- [ ] Include `@param` and `@returns` tags
- [ ] Add `@example` blocks for complex functions
- [ ] Document security implications
- [ ] Explain performance characteristics (N+1, single query, etc.)

**Query Optimization:**

- [ ] Use `include` for eager loading related data (avoid N+1)
- [ ] Use raw SQL (`$queryRaw`) for complex recursive queries
- [ ] Consider client-side filtering when SQL is overly complex
- [ ] Index foreign keys and frequently filtered fields

---

## Step 4: Validation Layer (Optional)

**Location:** `packages/database/src/validation/modelNameValidation.ts`

Create validation layer when:

- Model has complex business rules
- Hierarchies need validation (circular refs, depth limits)
- Cross-entity validation required
- Rules differ per model type

### 4.1 Validation Structure

```typescript
/**
 * Business rule validation for ModelName
 *
 * Implements domain-specific validation logic that goes beyond
 * database constraints (e.g., circular reference checks, depth limits)
 */

import type { ModelName, ModelType } from '../../generated/client/client'
import { checkCircularReference, getAncestorChain, getModelNameByIdForOrg } from '../dal/modelNames'

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: string[] // Blocking issues - prevent save
  warnings: string[] // Advisory issues - show but allow save
}

export interface ModelRules {
  canHaveParent: boolean
  allowedParentTypes: ModelType[]
  maxDepth: number
  requiresExternalOrg: boolean
}

// ============================================================================
// Rule Configuration
// ============================================================================

/**
 * Validation rules per model type
 * Based on business requirements and legal obligations
 */
export const MODEL_RULES: Record<ModelType, ModelRules> = {
  TYPE_A: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    requiresExternalOrg: true,
  },
  TYPE_B: {
    canHaveParent: true,
    allowedParentTypes: ['TYPE_A', 'TYPE_B'],
    maxDepth: 5,
    requiresExternalOrg: true,
  },
  TYPE_C: {
    canHaveParent: true,
    allowedParentTypes: ['TYPE_C'],
    maxDepth: 10,
    requiresExternalOrg: false,
  },
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate ModelName hierarchy relationships
 *
 * @param modelType - Type of the model being validated
 * @param parentId - Proposed parent ID (optional)
 * @param modelId - ID of model being updated (for circular check)
 * @param organizationId - Organization ID
 * @returns ValidationResult with errors/warnings
 */
export async function validateModelHierarchy(
  modelType: ModelType,
  parentId: string | null | undefined,
  modelId: string | undefined,
  organizationId: string
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  const rules = MODEL_RULES[modelType]

  // If no parent, no hierarchy validation needed
  if (!parentId) {
    return result
  }

  // Rule 1: Check if this type can have a parent
  if (!rules.canHaveParent) {
    result.isValid = false
    result.errors.push(`${modelType} cannot have a parent. Remove parentId or change type.`)
    return result
  }

  // Rule 2: Verify parent exists and get its type
  const parent = await getModelNameByIdForOrg(parentId, organizationId)
  if (!parent) {
    result.isValid = false
    result.errors.push(`Parent model with ID ${parentId} not found in this organization.`)
    return result
  }

  // Rule 3: Check if parent type is allowed
  if (!rules.allowedParentTypes.includes(parent.type)) {
    result.isValid = false
    result.errors.push(
      `${modelType} cannot have parent of type ${parent.type}. ` +
        `Allowed parent types: ${rules.allowedParentTypes.join(', ')}`
    )
  }

  // Rule 4: Check for circular references (if updating existing model)
  if (modelId) {
    const isCircular = await checkCircularReference(modelId, parentId, organizationId)
    if (isCircular) {
      result.isValid = false
      result.errors.push(
        'Circular reference detected. Setting this parent would create a loop in the hierarchy.'
      )
    }
  }

  // Rule 5: Check depth limit
  if (rules.maxDepth > 0) {
    const ancestors = await getAncestorChain(parentId, organizationId)
    const currentDepth = ancestors.length + 1 // +1 for this model

    if (currentDepth > rules.maxDepth) {
      result.isValid = false
      result.errors.push(
        `Maximum hierarchy depth (${rules.maxDepth}) exceeded. ` +
          `Current depth would be ${currentDepth}.`
      )
    }
  }

  // Rule 6: Parent must be in same organization (redundant but explicit)
  if (parent.organizationId !== organizationId) {
    result.isValid = false
    result.errors.push('Parent model must belong to the same organization.')
  }

  return result
}

/**
 * Validate ModelName data fields
 * Synchronous validation that doesn't require database queries
 */
export function validateModelData(
  modelType: ModelType,
  externalOrgId: string | null | undefined
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  const rules = MODEL_RULES[modelType]

  // Check external org requirement
  if (rules.requiresExternalOrg && !externalOrgId) {
    result.warnings.push(
      `${modelType} typically requires an external organization. ` +
        `Consider linking to an ExternalOrganization.`
    )
  }

  return result
}

/**
 * Comprehensive validation combining all checks
 * Use this before creating or updating a ModelName
 */
export async function validateModelName(data: {
  type: ModelType
  parentId?: string | null
  modelId?: string // For updates
  externalOrgId?: string | null
  organizationId: string
}): Promise<ValidationResult> {
  // Run hierarchy validation (async)
  const hierarchyResult = await validateModelHierarchy(
    data.type,
    data.parentId,
    data.modelId,
    data.organizationId
  )

  // Run data validation (sync)
  const dataResult = validateModelData(data.type, data.externalOrgId)

  // Combine results
  return {
    isValid: hierarchyResult.isValid && dataResult.isValid,
    errors: [...hierarchyResult.errors, ...dataResult.errors],
    warnings: [...hierarchyResult.warnings, ...dataResult.warnings],
  }
}
```

### 4.2 Validation Checklist

- [ ] Define rule configuration (type-safe, exported const)
- [ ] Separate async (DB queries) from sync validation
- [ ] Return `ValidationResult` with errors (blocking) and warnings (advisory)
- [ ] Document business rules and legal context in comments
- [ ] Export validation types and functions
- [ ] Keep validation logic out of DAL (separation of concerns)

---

## Step 5: Test Factories

**Location:** `packages/database/src/test-utils/factories/modelNameFactory.ts`

### 5.1 Factory Implementation

```typescript
/**
 * Factory for creating ModelName test data
 * Provides fluent API for test data generation with sensible defaults
 */

import { randomUUID } from 'node:crypto'
import type { ModelName, ModelType } from '../../../generated/client/client'
import { prisma } from '../../index'
import { Factory } from './base-factory'

// ============================================================================
// Types
// ============================================================================

type ModelNameBuildData = Omit<ModelName, 'id' | 'createdAt' | 'updatedAt'>

// ============================================================================
// Factory Class
// ============================================================================

export class ModelNameFactory extends Factory<ModelName, ModelNameBuildData> {
  protected defaults(): Partial<ModelNameBuildData> {
    const seq = this.nextSequence()
    const code = `MN${seq.toString().padStart(3, '0')}`

    return {
      code,
      name: `Test Model ${seq}`,
      description: `Test description for model ${seq}`,
      type: 'TYPE_A',
      isActive: true,
      parentId: null,
      hierarchyType: null,
      externalOrgId: null,
      metadata: null,
      // organizationId must be provided by caller
    }
  }

  protected async persist(data: ModelNameBuildData): Promise<ModelName> {
    return this.prisma.modelName.create({
      data: data as Parameters<typeof this.prisma.modelName.create>[0]['data'],
    })
  }
}

// ============================================================================
// Pre-configured Factory Variants
// ============================================================================

/**
 * Factory for TYPE_A models
 */
export const createTypeAFactory = (prisma?: PrismaClient) =>
  new ModelNameFactory(prisma).params({
    type: 'TYPE_A',
  })

/**
 * Factory for TYPE_B models (child models)
 */
export const createTypeBFactory = (prisma?: PrismaClient) =>
  new ModelNameFactory(prisma).params({
    type: 'TYPE_B',
  })

/**
 * Factory for inactive models
 */
export const createInactiveModelFactory = (prisma?: PrismaClient) =>
  new ModelNameFactory(prisma).params({
    isActive: false,
  })

// ============================================================================
// Helper Functions
// ============================================================================

let sequenceNumber = 0

/**
 * Create a test ModelName with minimal boilerplate
 *
 * @example
 * const model = await createTestModelName(org.id, {
 *   name: 'Custom Name',
 *   type: 'TYPE_B',
 * })
 */
export async function createTestModelName(
  organizationId: string,
  overrides: Partial<{
    name: string
    type: ModelType
    description: string
    parentId: string
    hierarchyType: string
    externalOrgId: string
    isActive: boolean
  }> = {}
): Promise<ModelName> {
  const defaults = {
    name: overrides.name ?? `Test Model ${++sequenceNumber}`,
    type: overrides.type ?? 'TYPE_A',
    description: overrides.description ?? null,
    organizationId,
    parentId: overrides.parentId ?? null,
    hierarchyType: overrides.hierarchyType ?? null,
    externalOrgId: overrides.externalOrgId ?? null,
    isActive: overrides.isActive ?? true,
  }

  return await prisma.modelName.create({
    data: { ...defaults },
  })
}

/**
 * Create a hierarchy of test ModelNames
 *
 * @param organizationId - Organization ID
 * @param depth - Number of levels (1-10)
 * @param hierarchyType - Type of hierarchy
 * @returns Array of ModelNames from root to leaf
 *
 * @example
 * const [root, child1, child2] = await createTestModelHierarchy(org.id, 3)
 * // root has child1 as child
 * // child1 has child2 as child
 */
export async function createTestModelHierarchy(
  organizationId: string,
  depth: number,
  hierarchyType: 'TYPE_CHAIN' | 'ORGANIZATIONAL' = 'TYPE_CHAIN',
  overrides: Partial<{
    externalOrgId: string
    namePrefix: string
  }> = {}
): Promise<ModelName[]> {
  if (depth < 1 || depth > 10) {
    throw new Error('Depth must be between 1 and 10')
  }

  const models: ModelName[] = []

  for (let i = 0; i < depth; i++) {
    const isRoot = i === 0
    const parent = isRoot ? null : models[i - 1]

    const type: ModelType = isRoot ? 'TYPE_A' : 'TYPE_B'
    const name = isRoot
      ? `${overrides.namePrefix ?? 'Test Hierarchy'} (Root)`
      : `${overrides.namePrefix ?? 'Test Hierarchy'} - Level ${i}`

    const model = await createTestModelName(organizationId, {
      name,
      type,
      parentId: parent?.id,
      hierarchyType,
      externalOrgId: overrides.externalOrgId,
    })

    models.push(model)
  }

  return models
}

/**
 * Cleanup test ModelNames
 */
export async function cleanupTestModelNames(modelIds: string[]): Promise<void> {
  await prisma.modelName.deleteMany({
    where: {
      id: { in: modelIds },
    },
  })
}
```

### 5.2 Factory Usage Examples

```typescript
// In tests:
import { ModelNameFactory } from '@compilothq/database/test-utils'

// Create with defaults
const model = await new ModelNameFactory().create({
  organizationId: org.id,
})

// Create with overrides
const customModel = await new ModelNameFactory()
  .params({ type: 'TYPE_B', isActive: false })
  .create({ organizationId: org.id })

// Create multiple
const models = await new ModelNameFactory().createMany(5, {
  organizationId: org.id,
})

// Build without persisting (for validation tests)
const data = new ModelNameFactory().build({
  organizationId: org.id,
})
```

### 5.3 Factory Checklist

- [ ] Extend `Factory<TModel, TBuild>` base class
- [ ] Implement `defaults()` with sequential numbering
- [ ] Implement `persist()` using Prisma
- [ ] Create pre-configured variants for common scenarios
- [ ] Add helper functions for complex setups (hierarchies, etc.)
- [ ] Add cleanup helper function
- [ ] Export factory class and helpers from `src/test-utils/factories/index.ts`

---

## Step 6: Integration Tests

**Location:** `packages/database/__tests__/integration/dal/modelNames.integration.test.ts`

### 6.1 Test Structure

```typescript
/**
 * Integration tests for ModelName DAL
 * Tests all DAL functions against real PostgreSQL database
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { ExternalOrganization, ModelName, Organization } from '../../../src'
import {
  checkCircularReference,
  createModelName,
  deleteModelName,
  getAncestorChain,
  getDescendantTree,
  getDirectChildren,
  getModelNameById,
  getModelNameByIdForOrg,
  listModelNames,
  updateModelName,
} from '../../../src/dal/modelNames'
import {
  cleanupTestOrganizations,
  createTestOrganization,
} from '../../../src/test-utils/factories/organizationFactory'
import {
  cleanupTestExternalOrganizations,
  createTestExternalOrganization,
} from '../../../src/test-utils/factories/externalOrganizationFactory'
import {
  cleanupTestModelNames,
  createTestModelHierarchy,
  createTestModelName,
} from '../../../src/test-utils/factories/modelNameFactory'

// ============================================================================
// Test Setup
// ============================================================================

describe('ModelName DAL - Integration Tests', () => {
  let org1: Organization
  let org2: Organization
  let externalOrg1: ExternalOrganization

  beforeAll(async () => {
    // Create test organizations
    const { org: testOrg1 } = await createTestOrganization({
      slug: 'model-test-org1',
      userCount: 1,
    })
    org1 = testOrg1

    const { org: testOrg2 } = await createTestOrganization({
      slug: 'model-test-org2',
      userCount: 0,
    })
    org2 = testOrg2

    // Create external org if needed
    externalOrg1 = await createTestExternalOrganization({
      legalName: 'Test External Org',
    })
  })

  afterAll(async () => {
    await cleanupTestOrganizations([org1.id, org2.id])
    await cleanupTestExternalOrganizations([externalOrg1.id])
  })

  // ============================================================================
  // Create Operations
  // ============================================================================

  describe('createModelName', () => {
    it('should create a ModelName with required fields', async () => {
      // Arrange
      const data = {
        name: 'Test Model',
        type: 'TYPE_A' as const,
        organizationId: org1.id,
      }

      // Act
      const model = await createModelName(data)

      // Assert
      expect(model).toBeDefined()
      expect(model.id).toBeDefined()
      expect(model.name).toBe(data.name)
      expect(model.type).toBe(data.type)
      expect(model.organizationId).toBe(org1.id)
      expect(model.isActive).toBe(true)
      expect(model.createdAt).toBeInstanceOf(Date)
      expect(model.updatedAt).toBeInstanceOf(Date)

      // Cleanup
      await cleanupTestModelNames([model.id])
    })

    it('should create ModelName with hierarchy', async () => {
      // Arrange
      const parent = await createTestModelName(org1.id, {
        name: 'Parent',
        type: 'TYPE_A',
      })

      // Act
      const child = await createTestModelName(org1.id, {
        name: 'Child',
        type: 'TYPE_B',
        parentId: parent.id,
        hierarchyType: 'TYPE_CHAIN',
      })

      // Assert
      expect(child.parentId).toBe(parent.id)
      expect(child.hierarchyType).toBe('TYPE_CHAIN')

      // Cleanup
      await cleanupTestModelNames([child.id, parent.id])
    })
  })

  // ============================================================================
  // Read Operations
  // ============================================================================

  describe('getModelNameById', () => {
    it('should return ModelName by ID', async () => {
      // Arrange
      const created = await createTestModelName(org1.id, {
        name: 'Find Me',
      })

      // Act
      const found = await getModelNameById(created.id)

      // Assert
      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.name).toBe('Find Me')

      // Cleanup
      await cleanupTestModelNames([created.id])
    })

    it('should return null for non-existent ID', async () => {
      // Act
      const found = await getModelNameById('non_existent_id')

      // Assert
      expect(found).toBeNull()
    })
  })

  describe('getModelNameByIdForOrg', () => {
    it('should return ModelName when org matches', async () => {
      // Arrange
      const created = await createTestModelName(org1.id)

      // Act
      const found = await getModelNameByIdForOrg(created.id, org1.id)

      // Assert
      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)

      // Cleanup
      await cleanupTestModelNames([created.id])
    })

    it('should return null when org does not match (multi-tenancy)', async () => {
      // Arrange
      const created = await createTestModelName(org1.id)

      // Act
      const found = await getModelNameByIdForOrg(created.id, org2.id)

      // Assert - SECURITY: Should not find model from different org
      expect(found).toBeNull()

      // Cleanup
      await cleanupTestModelNames([created.id])
    })
  })

  // ============================================================================
  // List Operations & Pagination
  // ============================================================================

  describe('listModelNames', () => {
    it('should list ModelNames for organization', async () => {
      // Arrange
      const model1 = await createTestModelName(org1.id, { name: 'Model 1' })
      const model2 = await createTestModelName(org1.id, { name: 'Model 2' })
      const model3Org2 = await createTestModelName(org2.id, { name: 'Model 3 Org2' })

      // Act
      const { items, nextCursor } = await listModelNames(org1.id)

      // Assert
      expect(items).toHaveLength(2)
      expect(items.map((m) => m.id)).toContain(model1.id)
      expect(items.map((m) => m.id)).toContain(model2.id)
      expect(items.map((m) => m.id)).not.toContain(model3Org2.id) // Multi-tenancy
      expect(nextCursor).toBeNull() // No more pages

      // Cleanup
      await cleanupTestModelNames([model1.id, model2.id, model3Org2.id])
    })

    it('should paginate results with cursor', async () => {
      // Arrange - create 5 models
      const models = await Promise.all(
        Array.from({ length: 5 }, (_, i) => createTestModelName(org1.id, { name: `Model ${i}` }))
      )

      // Act - fetch first page with limit 2
      const page1 = await listModelNames(org1.id, { limit: 2 })

      // Assert page 1
      expect(page1.items).toHaveLength(2)
      expect(page1.nextCursor).toBeDefined()

      // Act - fetch second page
      const page2 = await listModelNames(org1.id, {
        limit: 2,
        cursor: page1.nextCursor!,
      })

      // Assert page 2
      expect(page2.items).toHaveLength(2)
      expect(page2.nextCursor).toBeDefined()

      // Assert no overlap
      const page1Ids = page1.items.map((m) => m.id)
      const page2Ids = page2.items.map((m) => m.id)
      expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false)

      // Cleanup
      await cleanupTestModelNames(models.map((m) => m.id))
    })

    it('should filter by type', async () => {
      // Arrange
      const typeA = await createTestModelName(org1.id, { type: 'TYPE_A' })
      const typeB = await createTestModelName(org1.id, { type: 'TYPE_B' })

      // Act
      const { items } = await listModelNames(org1.id, { type: 'TYPE_A' })

      // Assert
      expect(items.map((m) => m.id)).toContain(typeA.id)
      expect(items.map((m) => m.id)).not.toContain(typeB.id)

      // Cleanup
      await cleanupTestModelNames([typeA.id, typeB.id])
    })

    it('should filter by isActive', async () => {
      // Arrange
      const active = await createTestModelName(org1.id, { isActive: true })
      const inactive = await createTestModelName(org1.id, { isActive: false })

      // Act
      const { items } = await listModelNames(org1.id, { isActive: true })

      // Assert
      expect(items.map((m) => m.id)).toContain(active.id)
      expect(items.map((m) => m.id)).not.toContain(inactive.id)

      // Cleanup
      await cleanupTestModelNames([active.id, inactive.id])
    })
  })

  // ============================================================================
  // Update Operations
  // ============================================================================

  describe('updateModelName', () => {
    it('should update ModelName fields', async () => {
      // Arrange
      const model = await createTestModelName(org1.id, {
        name: 'Original Name',
        isActive: true,
      })

      // Act
      const updated = await updateModelName(model.id, org1.id, {
        name: 'Updated Name',
        isActive: false,
      })

      // Assert
      expect(updated.name).toBe('Updated Name')
      expect(updated.isActive).toBe(false)
      expect(updated.updatedAt.getTime()).toBeGreaterThan(model.updatedAt.getTime())

      // Cleanup
      await cleanupTestModelNames([model.id])
    })

    it('should throw error when updating model from different org', async () => {
      // Arrange
      const model = await createTestModelName(org1.id)

      // Act & Assert
      await expect(updateModelName(model.id, org2.id, { name: 'Hacked' })).rejects.toThrow()

      // Cleanup
      await cleanupTestModelNames([model.id])
    })
  })

  // ============================================================================
  // Delete Operations
  // ============================================================================

  describe('deleteModelName', () => {
    it('should delete ModelName', async () => {
      // Arrange
      const model = await createTestModelName(org1.id)

      // Act
      await deleteModelName(model.id, org1.id)

      // Assert
      const found = await getModelNameById(model.id)
      expect(found).toBeNull()
    })

    it('should throw error when deleting from wrong org', async () => {
      // Arrange
      const model = await createTestModelName(org1.id)

      // Act & Assert
      await expect(deleteModelName(model.id, org2.id)).rejects.toThrow()

      // Cleanup
      await cleanupTestModelNames([model.id])
    })
  })

  // ============================================================================
  // Hierarchy Operations
  // ============================================================================

  describe('getDirectChildren', () => {
    it('should return only immediate children', async () => {
      // Arrange
      const [root, child, grandchild] = await createTestModelHierarchy(org1.id, 3)

      // Act
      const children = await getDirectChildren(root.id, org1.id)

      // Assert
      expect(children).toHaveLength(1)
      expect(children[0].id).toBe(child.id)
      expect(children.map((c) => c.id)).not.toContain(grandchild.id)

      // Cleanup
      await cleanupTestModelNames([grandchild.id, child.id, root.id])
    })
  })

  describe('getAncestorChain', () => {
    it('should return ancestors from parent to root', async () => {
      // Arrange
      const [root, level1, level2] = await createTestModelHierarchy(org1.id, 3)

      // Act
      const ancestors = await getAncestorChain(level2.id, org1.id)

      // Assert
      expect(ancestors).toHaveLength(2)
      expect(ancestors[0].id).toBe(level1.id) // Immediate parent first
      expect(ancestors[1].id).toBe(root.id) // Root last

      // Cleanup
      await cleanupTestModelNames([level2.id, level1.id, root.id])
    })

    it('should return empty array for root model', async () => {
      // Arrange
      const root = await createTestModelName(org1.id)

      // Act
      const ancestors = await getAncestorChain(root.id, org1.id)

      // Assert
      expect(ancestors).toHaveLength(0)

      // Cleanup
      await cleanupTestModelNames([root.id])
    })
  })

  describe('getDescendantTree', () => {
    it('should return all descendants with depth', async () => {
      // Arrange
      const [root, level1, level2, level3] = await createTestModelHierarchy(org1.id, 4)

      // Act
      const descendants = await getDescendantTree(root.id, org1.id)

      // Assert
      expect(descendants).toHaveLength(3)
      expect(descendants.find((d) => d.id === level1.id)?.depth).toBe(1)
      expect(descendants.find((d) => d.id === level2.id)?.depth).toBe(2)
      expect(descendants.find((d) => d.id === level3.id)?.depth).toBe(3)

      // Cleanup
      await cleanupTestModelNames([level3.id, level2.id, level1.id, root.id])
    })

    it('should respect maxDepth parameter', async () => {
      // Arrange
      const [root, level1, level2, level3] = await createTestModelHierarchy(org1.id, 4)

      // Act
      const descendants = await getDescendantTree(root.id, org1.id, 2)

      // Assert
      expect(descendants).toHaveLength(2) // Only depth 1 and 2
      expect(descendants.find((d) => d.id === level3.id)).toBeUndefined()

      // Cleanup
      await cleanupTestModelNames([level3.id, level2.id, level1.id, root.id])
    })
  })

  describe('checkCircularReference', () => {
    it('should detect direct self-reference', async () => {
      // Arrange
      const model = await createTestModelName(org1.id)

      // Act
      const isCircular = await checkCircularReference(
        model.id,
        model.id, // Same as model
        org1.id
      )

      // Assert
      expect(isCircular).toBe(true)

      // Cleanup
      await cleanupTestModelNames([model.id])
    })

    it('should detect circular reference in chain', async () => {
      // Arrange: root -> child -> grandchild
      const [root, child, grandchild] = await createTestModelHierarchy(org1.id, 3)

      // Act: Try to make root a child of grandchild (would create cycle)
      const isCircular = await checkCircularReference(root.id, grandchild.id, org1.id)

      // Assert
      expect(isCircular).toBe(true)

      // Cleanup
      await cleanupTestModelNames([grandchild.id, child.id, root.id])
    })

    it('should allow valid hierarchy', async () => {
      // Arrange
      const root = await createTestModelName(org1.id)
      const child = await createTestModelName(org1.id)

      // Act: child can have root as parent
      const isCircular = await checkCircularReference(child.id, root.id, org1.id)

      // Assert
      expect(isCircular).toBe(false)

      // Cleanup
      await cleanupTestModelNames([child.id, root.id])
    })
  })

  // ============================================================================
  // Multi-tenancy Tests
  // ============================================================================

  describe('Multi-tenancy Enforcement', () => {
    it('should isolate data between organizations', async () => {
      // Arrange
      const org1Model = await createTestModelName(org1.id, {
        name: 'Org 1 Model',
      })
      const org2Model = await createTestModelName(org2.id, {
        name: 'Org 2 Model',
      })

      // Act
      const org1List = await listModelNames(org1.id)
      const org2List = await listModelNames(org2.id)

      // Assert
      expect(org1List.items.map((m) => m.id)).toContain(org1Model.id)
      expect(org1List.items.map((m) => m.id)).not.toContain(org2Model.id)

      expect(org2List.items.map((m) => m.id)).toContain(org2Model.id)
      expect(org2List.items.map((m) => m.id)).not.toContain(org1Model.id)

      // Cleanup
      await cleanupTestModelNames([org1Model.id, org2Model.id])
    })
  })
})
```

### 6.2 Test Organization Checklist

**Test Structure:**

- [ ] Group tests by DAL function using `describe()` blocks
- [ ] Use AAA pattern (Arrange, Act, Assert)
- [ ] Clean up test data in `afterAll()` or after each test
- [ ] Test both success and error cases

**Coverage Requirements:**

- [ ] Create operations (valid data, required fields, relations)
- [ ] Read operations (by ID, by unique field, with relations)
- [ ] Read with ownership verification (`getByIdForOrg`)
- [ ] List operations (filtering, pagination, cursors)
- [ ] Update operations (valid updates, wrong org)
- [ ] Delete operations (valid deletes, wrong org, cascade behavior)
- [ ] Hierarchy operations (children, ancestors, descendants, circular ref)
- [ ] Multi-tenancy enforcement (data isolation)
- [ ] Edge cases (null, empty, non-existent IDs)

**Best Practices:**

- [ ] Use factories to create test data
- [ ] Test pagination with multiple pages
- [ ] Test multi-tenancy explicitly (cross-org access should fail)
- [ ] Use meaningful test names that describe behavior
- [ ] Clean up in reverse order of creation (children before parents)

### 6.3 Run Tests

```bash
# Run all integration tests
cd packages/database
pnpm test:integration

# Run specific test file
pnpm test:integration modelNames.integration.test.ts

# Run with coverage
pnpm test:integration --coverage

# Watch mode for development
pnpm test:watch __tests__/integration/dal/modelNames.integration.test.ts
```

---

## Step 7: Seed Data (Optional)

**Location:** `packages/database/prisma/seeds/modelNames.ts`

Create seed data for:

- Reference data (system-wide, read-only)
- Demo data for development
- Test data for staging environments

### 7.1 Seed Function

```typescript
/**
 * Seed ModelNames reference data
 * Creates system-wide ModelNames that all organizations can use
 */

import type { PrismaClient } from '../../generated/client/client'

export async function seedModelNames(prisma: PrismaClient): Promise<number> {
  console.log('Seeding ModelNames...')

  const modelNames = [
    {
      code: 'STD_01',
      name: 'Standard Type A',
      description: 'Standard Type A for all organizations',
      type: 'TYPE_A',
      isActive: true,
      organizationId: null, // System-wide
    },
    {
      code: 'STD_02',
      name: 'Standard Type B',
      description: 'Standard Type B for all organizations',
      type: 'TYPE_B',
      isActive: true,
      organizationId: null,
    },
    // ... more seed data
  ]

  // Use upsert to avoid duplicates on re-seed
  for (const data of modelNames) {
    await prisma.modelName.upsert({
      where: {
        // Use unique constraint for upsert
        code_organizationId: {
          code: data.code,
          organizationId: null,
        },
      },
      update: {}, // Don't update if exists
      create: data,
    })
  }

  console.log(`✓ Seeded ${modelNames.length} ModelNames`)
  return modelNames.length
}
```

### 7.2 Register in Main Seed File

**File:** `packages/database/prisma/seed.ts`

```typescript
import { seedModelNames } from './seeds/modelNames'

async function main() {
  // ... other seeds

  const modelNamesCount = await seedModelNames(prisma)

  console.log(`Seeding completed:`)
  console.log(`  - ModelNames: ${modelNamesCount}`)
}
```

### 7.3 Run Seeds

```bash
cd packages/database
pnpm prisma db seed
```

---

## Step 8: Export Configuration

### 8.1 Export from Package Index

**File:** `packages/database/src/index.ts`

```typescript
// Export DAL functions
export * from './dal/modelNames'

// Export validation functions
export * from './validation/modelNameValidation'

// Export types explicitly (for documentation)
export type { ModelName } from '../generated/client/client'

// Export custom types from DAL
export type {
  ModelNameCreateInput,
  ModelNameUpdateInput,
  ModelNameWithRelations,
  ModelNameStatistics,
} from './dal/modelNames'

// Export validation types
export type { ValidationResult, ModelRules } from './validation/modelNameValidation'
```

### 8.2 Export Test Utilities

**File:** `packages/database/src/test-utils/factories/index.ts`

```typescript
// Export factory
export { ModelNameFactory, createTypeAFactory, createTypeBFactory } from './modelNameFactory'

// Export helpers
export {
  createTestModelName,
  createTestModelHierarchy,
  cleanupTestModelNames,
} from './modelNameFactory'
```

### 8.3 Verify Exports

```bash
# Build package
cd packages/database
pnpm build

# Check exports are available
cd ../web
node -e "const db = require('@compilothq/database'); console.log(db.createModelName)"
```

---

## Step 9: Verification

### 9.1 Pre-deployment Checklist

**Schema:**

- [ ] Migration applied successfully
- [ ] All indexes created
- [ ] Foreign keys enforce integrity
- [ ] Unique constraints prevent duplicates
- [ ] Timestamps (`createdAt`, `updatedAt`) auto-populate

**DAL:**

- [ ] All CRUD operations implemented
- [ ] Multi-tenancy enforced in all queries
- [ ] Pagination uses cursor-based approach
- [ ] Security comments added
- [ ] JSDoc on all functions
- [ ] Custom types exported

**Validation:**

- [ ] Business rules documented
- [ ] Errors vs warnings distinguished
- [ ] Validation functions exported

**Tests:**

- [ ] Integration tests passing
- [ ] Coverage >80%
- [ ] Multi-tenancy tested explicitly
- [ ] Hierarchy operations tested (if applicable)
- [ ] Edge cases covered

**Factories:**

- [ ] Factory extends base class
- [ ] Pre-configured variants created
- [ ] Helper functions for complex setups
- [ ] Cleanup functions implemented

**Exports:**

- [ ] DAL functions exported from `src/index.ts`
- [ ] Types exported explicitly
- [ ] Test utilities exported from `test-utils/index.ts`

### 9.2 Manual Verification

```bash
# 1. Run integration tests
cd packages/database
pnpm test:integration

# 2. Check test coverage
pnpm test:integration --coverage

# 3. Lint and type-check
pnpm lint
pnpm type-check

# 4. Build package
pnpm build

# 5. Verify in app
cd ../web
pnpm dev
# Test CRUD operations in UI
```

### 9.3 Documentation

After implementation, document:

- [ ] Add model to `packages/database/README.md` (if one exists)
- [ ] Update roadmap or spec if this was a planned feature
- [ ] Add JSDoc examples showing real-world usage
- [ ] Consider creating migration guide if breaking changes

---

## Implementation Checklist

Copy this checklist when implementing a new model:

```markdown
## Implementation: [ModelName]

### Step 1: Schema Design

- [ ] Enum definitions added (if needed)
- [ ] Model defined in `schema.prisma`
- [ ] Multi-tenancy configured correctly
- [ ] Relationships defined with proper cascade behavior
- [ ] Indexes added for common queries
- [ ] Unique constraints defined
- [ ] Timestamps included (`createdAt`, `updatedAt`)

### Step 2: Migration

- [ ] Migration generated: `pnpm prisma migrate dev --name add_model_name`
- [ ] Migration SQL reviewed
- [ ] Migration tested on test database
- [ ] Complex data transformations documented

### Step 3: DAL

- [ ] DAL file created: `src/dal/modelNames.ts`
- [ ] Create operations implemented
- [ ] Read operations implemented (with `getByIdForOrg`)
- [ ] List with cursor pagination implemented
- [ ] Update operations implemented
- [ ] Delete operations implemented
- [ ] Hierarchy operations implemented (if applicable)
- [ ] Statistics/aggregations implemented (if needed)
- [ ] JSDoc added to all functions
- [ ] Security comments added
- [ ] Custom types defined and exported

### Step 4: Validation (Optional)

- [ ] Validation file created: `src/validation/modelNameValidation.ts`
- [ ] Rule configuration defined
- [ ] Validation functions implemented
- [ ] Errors vs warnings handled correctly

### Step 5: Test Factories

- [ ] Factory file created: `src/test-utils/factories/modelNameFactory.ts`
- [ ] Factory class extends `Factory<T, B>`
- [ ] Defaults implemented with sequences
- [ ] Pre-configured variants created
- [ ] Helper functions for complex setups
- [ ] Cleanup functions added
- [ ] Exported from `test-utils/factories/index.ts`

### Step 6: Integration Tests

- [ ] Test file created: `__tests__/integration/dal/modelNames.integration.test.ts`
- [ ] Create operations tested
- [ ] Read operations tested (including `getByIdForOrg`)
- [ ] List with pagination tested
- [ ] Filtering tested
- [ ] Update operations tested
- [ ] Delete operations tested
- [ ] Hierarchy operations tested (if applicable)
- [ ] Multi-tenancy enforcement tested
- [ ] Edge cases covered
- [ ] Tests passing: `pnpm test:integration`

### Step 7: Seed Data (Optional)

- [ ] Seed file created: `prisma/seeds/modelNames.ts`
- [ ] Seed function uses upsert
- [ ] Registered in `prisma/seed.ts`
- [ ] Seeds tested: `pnpm prisma db seed`

### Step 8: Exports

- [ ] DAL exported from `src/index.ts`
- [ ] Validation exported from `src/index.ts`
- [ ] Types exported explicitly
- [ ] Custom types exported
- [ ] Test utilities exported from `test-utils/index.ts`
- [ ] Package built successfully: `pnpm build`

### Step 9: Verification

- [ ] All tests passing
- [ ] Test coverage >80%
- [ ] Linting passed: `pnpm lint`
- [ ] Type-checking passed: `pnpm type-check`
- [ ] Manual testing in web app completed
- [ ] Documentation updated
```

---

## Common Patterns Reference

### Multi-tenancy Pattern

```prisma
model ModelName {
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@unique([code, organizationId])
}
```

```typescript
// Always include organizationId in WHERE
export async function getModelByIdForOrg(
  id: string,
  organizationId: string
): Promise<Model | null> {
  return prisma.model.findUnique({
    where: { id, organizationId }, // Both required
  })
}
```

### Hierarchy Pattern

```prisma
model ModelName {
  parentId String?
  parent   ModelName?  @relation("ModelHierarchy", fields: [parentId], references: [id], onDelete: Restrict)
  children ModelName[] @relation("ModelHierarchy")
}
```

```typescript
// Recursive CTE for descendants
export async function getDescendantTree(id: string): Promise<Model[]> {
  const query = Prisma.sql`
    WITH RECURSIVE tree AS (
      SELECT *, 1 as depth FROM "Model" WHERE "parentId" = ${id}
      UNION ALL
      SELECT m.*, t.depth + 1 FROM "Model" m
      INNER JOIN tree t ON m."parentId" = t.id
      WHERE t.depth < 10
    )
    SELECT * FROM tree ORDER BY depth
  `
  return prisma.$queryRaw(query)
}
```

### Cursor Pagination Pattern

```typescript
export async function listModels(
  orgId: string,
  options?: { limit?: number; cursor?: string }
): Promise<{ items: Model[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 50

  const items = await prisma.model.findMany({
    where: { organizationId: orgId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // Fetch one extra
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  })

  const hasMore = items.length > limit
  const result = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? (result[result.length - 1]?.id ?? null) : null

  return { items: result, nextCursor }
}
```

---

## Troubleshooting

### Migration Issues

**Problem:** Migration fails with constraint violation

```
Solution: Check if existing data violates new constraints. May need data migration step.
```

**Problem:** Can't drop column with data

```
Solution: Use multi-step migration: 1) Add new column, 2) Migrate data, 3) Drop old column
```

### Test Issues

**Problem:** Tests fail with "relation does not exist"

```bash
Solution: Run migrations on test DB
DATABASE_URL="postgresql://...compilothq_test" pnpm prisma migrate deploy
```

**Problem:** Tests polluting each other

```
Solution: Use proper cleanup in afterAll() or individual test cleanup
```

### Type Issues

**Problem:** Exported types not found in web app

```bash
Solution: Rebuild package
cd packages/database && pnpm build
```

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Multi-tenancy Best Practices](https://www.prisma.io/docs/guides/database/multi-tenancy)
- [Testing with Prisma](https://www.prisma.io/docs/guides/testing/integration-testing)
- [Vitest Documentation](https://vitest.dev/)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Maintainer:** Compilo Engineering Team
