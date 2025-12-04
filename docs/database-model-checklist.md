# Database Model Implementation Checklist

**Simple "You Must" Rules for `packages/database`**

---

## Schema (`prisma/schema.prisma`)

### You MUST:

- [ ] Add `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` to every model
- [ ] Add `organizationId String` for org-scoped models OR omit entirely for global entities (no optional `organizationId?` unless hybrid scope is explicitly required)
- [ ] Use `onDelete: Cascade` for org-scoped models: `@relation(fields: [organizationId], references: [id], onDelete: Cascade)`
- [ ] Index `organizationId` on all org-scoped models: `@@index([organizationId])`
- [ ] Include `organizationId` in unique constraints: `@@unique([code, organizationId])`
- [ ] Use `String @id @default(cuid())` for all ID fields (NOT UUID)
- [ ] Use SCREAMING_SNAKE_CASE for enum values
- [ ] Use singular PascalCase for model names (`Recipient`, not `Recipients`)
- [ ] Use camelCase for field names
- [ ] Specify `onDelete` behavior for ALL foreign keys (Cascade, SetNull, or Restrict)
- [ ] Add comments explaining GDPR/legal context for compliance models

### You MUST NOT:

- [ ] Use `organizationId?: String` unless you explicitly need hybrid scope (system-wide + org-specific)
- [ ] Forget to add indexes on foreign keys
- [ ] Use `UUID` for IDs (use `cuid()` instead for better DB performance)
- [ ] Leave foreign keys without `onDelete` behavior specified

---

## Migration

### You MUST:

- [ ] Run `pnpm prisma migrate dev --name add_model_name` to generate migration
- [ ] Review the generated SQL before committing
- [ ] Test migration on test database before committing
- [ ] Use naming convention: `add_model_name`, `update_model_add_field`, `rename_old_to_new`
- [ ] Create indexes AFTER data population in complex migrations
- [ ] Add foreign keys LAST in migration SQL

### You MUST NOT:

- [ ] Modify migrations after they've been committed and deployed
- [ ] Skip migration review (always check the generated SQL)

---

## Data Access Layer (`src/dal/modelNames.ts`)

### File Structure - You MUST:

- [ ] Organize in this order: Types → Create → Read → List → Update → Delete → Hierarchy (if applicable) → Statistics
- [ ] Add JSDoc comment to every exported function
- [ ] Include `@param`, `@returns`, and `@example` in JSDoc for complex functions

### Security - You MUST:

- [ ] Include `organizationId` in WHERE clause for ALL queries on org-scoped models
- [ ] Provide both `getModelById(id)` AND `getModelByIdForOrg(id, organizationId)` functions
- [ ] Add security comment: `SECURITY: Enforces multi-tenancy by requiring organizationId match`
- [ ] Use `getByIdForOrg` variant in update/delete functions: `where: { id, organizationId }`

### Types - You MUST:

- [ ] Define `ModelNameCreateInput = Omit<ModelName, 'id' | 'createdAt' | 'updatedAt'>`
- [ ] Define `ModelNameUpdateInput = Partial<Omit<ModelName, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>`
- [ ] Export ALL custom types (input types, statistics types, relation types)

### Pagination - You MUST:

- [ ] Use cursor-based pagination (NOT offset/limit)
- [ ] Return `{ items: Model[], nextCursor: string | null }`
- [ ] Fetch `limit + 1` items to detect if more exist
- [ ] Use deterministic ordering: `orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]`
- [ ] Default limit to 50 if not specified

### Hierarchy (if applicable) - You MUST:

- [ ] Implement `getDirectChildren(parentId, organizationId)` for immediate children only
- [ ] Implement `getAncestorChain(modelId, organizationId)` for bottom-up traversal
- [ ] Implement `getDescendantTree(modelId, organizationId, maxDepth)` using recursive CTE
- [ ] Implement `checkCircularReference(modelId, newParentId, organizationId)` to prevent cycles

### You MUST NOT:

- [ ] Use offset-based pagination (`skip` without cursor)
- [ ] Trust client-provided `organizationId` without verification
- [ ] Omit `organizationId` from WHERE clauses on org-scoped models
- [ ] Use N+1 queries (use `include` or joins instead)

---

## Validation (`src/validation/modelNameValidation.ts`)

### You MUST (if validation layer needed):

- [ ] Return `ValidationResult = { isValid: boolean, errors: string[], warnings: string[] }`
- [ ] Use `errors` for blocking issues that prevent save
- [ ] Use `warnings` for advisory issues that allow save
- [ ] Define rule configuration as exported const (e.g., `HIERARCHY_RULES`)
- [ ] Export all validation types and functions

### You MUST NOT:

- [ ] Put business logic in DAL (keep it in validation layer)
- [ ] Mix blocking errors with non-blocking warnings

---

## Test Factories (`src/test-utils/factories/modelNameFactory.ts`)

### You MUST:

- [ ] Extend `Factory<TModel, TBuild>` base class
- [ ] Implement `defaults()` with sequential numbering using `this.nextSequence()`
- [ ] Implement `persist()` using Prisma client
- [ ] Create helper function: `createTestModelName(organizationId, overrides)`
- [ ] Create hierarchy helper (if applicable): `createTestModelHierarchy(organizationId, depth)`
- [ ] Create cleanup function: `cleanupTestModelNames(modelIds[])`
- [ ] Export factory class and all helpers from `src/test-utils/factories/index.ts`

### You MUST NOT:

- [ ] Hardcode IDs or timestamps in factory defaults
- [ ] Skip cleanup functions

---

## Integration Tests (`__tests__/integration/dal/modelNames.integration.test.ts`)

### Setup - You MUST:

- [ ] Create test organizations in `beforeAll()`
- [ ] Clean up test organizations in `afterAll()`
- [ ] Use factories to create test data

### Test Coverage - You MUST Test:

- [ ] Create operations (valid data, with relations)
- [ ] `getModelById()` - returns model by ID
- [ ] `getModelByIdForOrg()` - returns model only if org matches
- [ ] `getModelByIdForOrg()` - returns NULL for wrong org (multi-tenancy)
- [ ] List operations (filtering, pagination with cursors)
- [ ] Update operations (valid updates, reject wrong org)
- [ ] Delete operations (valid deletes, reject wrong org)
- [ ] Hierarchy operations (children, ancestors, descendants, circular refs)
- [ ] Multi-tenancy isolation (org1 cannot see org2 data)
- [ ] Edge cases (null, empty, non-existent IDs)

### Test Pattern - You MUST:

- [ ] Use AAA pattern (Arrange, Act, Assert)
- [ ] Clean up test data after each test OR in `afterAll()`
- [ ] Delete in reverse order (children before parents)
- [ ] Use meaningful test names: `should return null when org does not match`

### You MUST NOT:

- [ ] Skip multi-tenancy tests
- [ ] Skip pagination tests (test multiple pages with cursors)
- [ ] Leave test data in database

---

## Exports (`src/index.ts`)

### You MUST:

- [ ] Export all DAL functions: `export * from './dal/modelNames'`
- [ ] Export validation functions: `export * from './validation/modelNameValidation'`
- [ ] Export Prisma types explicitly: `export type { ModelName } from '../generated/client/client'`
- [ ] Export custom DAL types: `export type { ModelNameCreateInput, ModelNameUpdateInput, ModelNameStatistics } from './dal/modelNames'`
- [ ] Export validation types: `export type { ValidationResult, ModelRules } from './validation/modelNameValidation'`

### You MUST NOT:

- [ ] Forget to export custom types (they won't be accessible in web app)

---

## Final Verification

### You MUST:

- [ ] Run `pnpm test:integration` - all tests passing
- [ ] Check coverage >80%: `pnpm test:integration --coverage`
- [ ] Run `pnpm lint` - no errors
- [ ] Run `pnpm type-check` - no errors
- [ ] Run `pnpm build` - builds successfully
- [ ] Test CRUD operations in web app manually

### You MUST NOT:

- [ ] Commit without running tests
- [ ] Merge PR with failing tests
- [ ] Skip manual verification in web app

---

## Quick Reference: Common Mistakes

| ❌ DON'T                     | ✅ DO                                                           |
| ---------------------------- | --------------------------------------------------------------- |
| `where: { id }`              | `where: { id, organizationId }` (for org-scoped)                |
| `skip: 20, take: 10`         | `cursor: { id: lastId }, skip: 1, take: 11` (cursor pagination) |
| `@id @default(uuid())`       | `@id @default(cuid())` (better DB performance)                  |
| Forget `onDelete` on FKs     | `onDelete: Cascade / SetNull / Restrict` (always specify)       |
| No index on `organizationId` | `@@index([organizationId])` (always index)                      |
| `getById()` only             | Both `getById()` AND `getByIdForOrg()`                          |
| N+1 queries                  | `include: { relations: true }` or JOIN                          |
| Modify deployed migrations   | Create NEW migration                                            |
| Test data left in DB         | Clean up in `afterAll()`                                        |
| Missing JSDoc                | JSDoc on every exported function                                |

---

## TL;DR - The Absolute Essentials

If you do NOTHING else, you MUST:

1. **Schema:** Add `createdAt`, `updatedAt`, index `organizationId`, specify `onDelete` on all FKs
2. **Migration:** Review SQL, test on test DB before commit
3. **DAL:** Always include `organizationId` in WHERE for org-scoped models
4. **DAL:** Provide `getByIdForOrg(id, organizationId)` for security
5. **DAL:** Use cursor pagination (not offset)
6. **Tests:** Test multi-tenancy explicitly (cross-org access returns null)
7. **Tests:** Clean up test data
8. **Exports:** Export DAL, validation, and custom types from `src/index.ts`

---

**Remember:** When in doubt, look at existing models like `Recipient`, `DataSubjectCategory`, or `ExternalOrganization` as reference implementations.
