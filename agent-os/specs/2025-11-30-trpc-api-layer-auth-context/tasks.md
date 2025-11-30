# Task Breakdown: tRPC API Layer with Auth Context

## Overview

Total Tasks: 8 Task Groups with ~45 sub-tasks

This specification expands the existing tRPC v11 infrastructure with error handling utilities, priority domain routers (activityRouter, processorRouter), shared validation schemas, server-side caller for React Server Components, and prefetching patterns.

**Important Note:** The Prisma schema currently has placeholder comments for "Data Processing" models (Activity, Processor). Task Group 1 addresses the prerequisite database layer before the API layer can be implemented.

## Task List

### Database Layer

#### Task Group 1: Prisma Models and DAL Functions

**Dependencies:** None

**Purpose:** Create the Activity and Processor database models and data access layer functions that the tRPC routers will depend on.

- [ ] 1.0 Complete database layer for Activity and Processor
  - [ ] 1.1 Write 4-6 focused tests for DAL functionality
    - Test `createActivity` with required fields
    - Test `listActivitiesByOrganization` with org filtering
    - Test `createProcessor` with required fields
    - Test `listProcessorsByOrganization` with cursor pagination
    - Test multi-tenancy isolation (activities/processors from org1 not visible to org2)
    - Reference: `/home/user/compilothq/packages/database/__tests__/integration/dal/invitations.integration.test.ts`
  - [ ] 1.2 Add Activity model to Prisma schema
    - Add to section `// Data Processing` in `/home/user/compilothq/packages/database/prisma/schema.prisma`
    - Fields: `id`, `name`, `description`, `organizationId`, `status`, `createdAt`, `updatedAt`
    - Add `organizationId` foreign key relation
    - Add indexes on `organizationId` and `status`
  - [ ] 1.3 Add Processor model to Prisma schema
    - Fields: `id`, `name`, `type`, `description`, `organizationId`, `isActive`, `createdAt`, `updatedAt`
    - Add `organizationId` foreign key relation
    - Add indexes on `organizationId` and `isActive`
  - [ ] 1.4 Run Prisma migration
    - Generate migration: `npx prisma migrate dev --name add_activity_processor_models`
    - Regenerate Prisma client
  - [ ] 1.5 Create activities DAL at `/home/user/compilothq/packages/database/src/dal/activities.ts`
    - Functions: `createActivity`, `getActivityById`, `listActivitiesByOrganization`, `updateActivity`, `deleteActivity`
    - Follow pattern from `/home/user/compilothq/packages/database/src/dal/invitations.ts`
    - Always filter by `organizationId` for multi-tenancy
    - Include JSDoc comments for security notes
  - [ ] 1.6 Create processors DAL at `/home/user/compilothq/packages/database/src/dal/processors.ts`
    - Functions: `createProcessor`, `getProcessorById`, `listProcessorsByOrganization`, `updateProcessor`, `deleteProcessor`
    - Implement cursor-based pagination for `listProcessorsByOrganization`
    - Follow DAL pattern with explicit select/include for data minimization
  - [ ] 1.7 Export DAL functions from package index
    - Update `/home/user/compilothq/packages/database/src/index.ts`
    - Add exports for activities and processors DAL
    - Add type exports for Activity and Processor
  - [ ] 1.8 Ensure database layer tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify migrations run successfully
    - Do NOT run the entire test suite

**Acceptance Criteria:**

- The 4-6 tests written in 1.1 pass
- Activity and Processor models exist in Prisma schema
- DAL functions provide CRUD operations with multi-tenancy filtering
- Exports available from `@compilothq/database`

---

### Validation Layer

#### Task Group 2: Zod Validation Schemas

**Dependencies:** None (can run in parallel with Task Group 1)

**Purpose:** Create shared validation schemas in `@compilothq/validation` for use by both tRPC routers and React Hook Form.

- [ ] 2.0 Complete validation schemas for activities and processors
  - [ ] 2.1 Write 4-6 focused tests for validation schemas
    - Test `ActivityCreateSchema` validates required fields
    - Test `ActivityUpdateSchema` accepts partial updates
    - Test `ProcessorCreateSchema` validates required fields
    - Test `ProcessorFiltersSchema` validates pagination params
    - Test invalid data rejection with meaningful error messages
    - Reference: `/home/user/compilothq/packages/validation/__tests__/integration/schemas/country.test.ts`
  - [ ] 2.2 Create activities schema folder structure
    - Create `/home/user/compilothq/packages/validation/src/schemas/activities/` directory
  - [ ] 2.3 Create activity create schema at `/home/user/compilothq/packages/validation/src/schemas/activities/create.schema.ts`
    - Fields: `name` (string, required), `description` (string, optional)
    - Export inferred TypeScript type: `type ActivityCreate = z.infer<typeof ActivityCreateSchema>`
    - Follow pattern from `/home/user/compilothq/packages/validation/src/schemas/reference/country.ts`
  - [ ] 2.4 Create activity update schema at `/home/user/compilothq/packages/validation/src/schemas/activities/update.schema.ts`
    - Use `.partial()` method on create schema
    - Export inferred type: `type ActivityUpdate`
  - [ ] 2.5 Create activity filters schema at `/home/user/compilothq/packages/validation/src/schemas/activities/filters.schema.ts`
    - Fields: `status` (enum, optional), `limit` (number, default 50), `cursor` (string, optional)
    - Export inferred type: `type ActivityFilters`
  - [ ] 2.6 Create activities index file at `/home/user/compilothq/packages/validation/src/schemas/activities/index.ts`
    - Barrel export all activity schemas and types
  - [ ] 2.7 Create processors schema folder structure
    - Create `/home/user/compilothq/packages/validation/src/schemas/processors/` directory
  - [ ] 2.8 Create processor create schema at `/home/user/compilothq/packages/validation/src/schemas/processors/create.schema.ts`
    - Fields: `name` (string, required), `type` (enum), `description` (string, optional), `isActive` (boolean, default true)
    - Export inferred TypeScript type
  - [ ] 2.9 Create processor update schema at `/home/user/compilothq/packages/validation/src/schemas/processors/update.schema.ts`
    - Use `.partial()` method on create schema
    - Export inferred type
  - [ ] 2.10 Create processor filters schema at `/home/user/compilothq/packages/validation/src/schemas/processors/filters.schema.ts`
    - Fields: `type` (enum, optional), `isActive` (boolean, optional), `limit`, `cursor`
    - Export inferred type
  - [ ] 2.11 Create processors index file at `/home/user/compilothq/packages/validation/src/schemas/processors/index.ts`
    - Barrel export all processor schemas and types
  - [ ] 2.12 Update main schemas index
    - Update `/home/user/compilothq/packages/validation/src/schemas/index.ts`
    - Add exports for activities and processors
  - [ ] 2.13 Ensure validation schema tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Do NOT run the entire test suite

**Acceptance Criteria:**

- The 4-6 tests written in 2.1 pass
- All schemas export TypeScript types alongside Zod schemas
- Schemas available from `@compilothq/validation`
- Create/Update/Filters pattern consistent across both domains

---

### Utilities Layer

#### Task Group 3: Error Handling and Server-Side Caller

**Dependencies:** None (can run in parallel with Task Groups 1-2)

**Purpose:** Create the Prisma error transformer utility and server-side tRPC caller for RSC.

- [ ] 3.0 Complete tRPC utilities
  - [ ] 3.1 Write 4-6 focused tests for utilities
    - Test `handlePrismaError` transforms P2002 to CONFLICT
    - Test `handlePrismaError` transforms P2025 to NOT_FOUND
    - Test `handlePrismaError` transforms P2003 to BAD_REQUEST
    - Test `handlePrismaError` passes through non-Prisma errors
    - Test server-side caller creates context with session (mock NextAuth)
    - Reference existing test patterns in the codebase
  - [ ] 3.2 Create server utils directory
    - Create `/home/user/compilothq/apps/web/src/server/utils/` directory
  - [ ] 3.3 Create Prisma error transformer at `/home/user/compilothq/apps/web/src/server/utils/prisma-errors.ts`
    - Map P2002 (unique constraint violation) to TRPCError code CONFLICT
    - Map P2025 (record not found) to TRPCError code NOT_FOUND
    - Map P2003 (foreign key constraint) to TRPCError code BAD_REQUEST
    - Export `handlePrismaError<T>(promise: Promise<T>): Promise<T>` function
    - Include user-friendly error messages without database internals
    - Use TypeScript generics for proper return type inference
  - [ ] 3.4 Create server-side caller at `/home/user/compilothq/apps/web/src/lib/trpc/server.ts`
    - Import `createCallerFactory` from tRPC v11
    - Import `auth` from NextAuth config at `/home/user/compilothq/apps/web/src/lib/auth/config`
    - Create context with session from `auth()` function
    - Use React `cache()` function to cache the caller per request
    - Export `api` object that mirrors client-side `trpc` usage
    - Reference: https://trpc.io/docs/client/react/server-components
  - [ ] 3.5 Create prefetch utilities at `/home/user/compilothq/apps/web/src/lib/trpc/prefetch.ts`
    - Implement `prefetchQuery` helper integrating with server-side caller
    - Use TanStack Query `dehydrate` pattern for RSC-to-client handoff
    - Include JSDoc documentation for usage in layout.tsx/page.tsx
    - Document HydrationBoundary pattern for passing data to client components
  - [ ] 3.6 Ensure utilities tests pass
    - Run ONLY the 4-6 tests written in 3.1
    - Do NOT run the entire test suite

**Acceptance Criteria:**

- The 4-6 tests written in 3.1 pass
- Prisma errors are transformed to user-friendly TRPCErrors
- Server-side caller works in Next.js App Router server components
- Prefetch utilities documented with usage patterns

---

### API Layer

#### Task Group 4: Activity Router Implementation

**Dependencies:** Task Groups 1, 2, 3

**Purpose:** Implement full CRUD operations for the Activity router using the established patterns.

- [ ] 4.0 Complete Activity router
  - [ ] 4.1 Write 4-6 focused tests for Activity router
    - Test `activity.list` returns only activities for current organization
    - Test `activity.getById` returns activity with proper data
    - Test `activity.create` creates activity with validation
    - Test `activity.update` updates activity with proper authorization
    - Test unauthorized access is rejected (missing org throws FORBIDDEN)
    - Reference router behavior patterns from `/home/user/compilothq/apps/web/src/server/routers/invitation.ts`
  - [ ] 4.2 Implement activity router at `/home/user/compilothq/apps/web/src/server/routers/activity.ts`
    - Replace existing stub content
    - Import DAL functions from `@compilothq/database`
    - Import validation schemas from `@compilothq/validation`
    - Use `orgProcedure` for all operations to enforce multi-tenancy
  - [ ] 4.3 Implement `list` query procedure
    - Input: optional filters schema (status, limit)
    - Use `listActivitiesByOrganization` DAL function with `ctx.organizationId`
    - Return typed array response
  - [ ] 4.4 Implement `getById` query procedure
    - Input: `z.object({ id: z.string() })`
    - Verify activity belongs to current organization (FORBIDDEN if not)
    - Return NOT_FOUND if activity doesn't exist
    - Use `handlePrismaError` wrapper
  - [ ] 4.5 Implement `create` mutation procedure
    - Input: ActivityCreateSchema from `@compilothq/validation`
    - Use `createActivity` DAL function with `ctx.organizationId`
    - Return created activity
  - [ ] 4.6 Implement `update` mutation procedure
    - Input: `{ id: string, data: ActivityUpdateSchema }`
    - Verify activity belongs to current organization before update
    - Use `handlePrismaError` wrapper
    - Return updated activity
  - [ ] 4.7 Implement `delete` mutation procedure
    - Input: `z.object({ id: z.string() })`
    - Verify activity belongs to current organization before delete
    - Return deletion confirmation
  - [ ] 4.8 Ensure Activity router tests pass
    - Run ONLY the 4-6 tests written in 4.1
    - Do NOT run the entire test suite

**Acceptance Criteria:**

- The 4-6 tests written in 4.1 pass
- All CRUD procedures use `orgProcedure` for multi-tenancy
- Validation schemas imported from `@compilothq/validation`
- Proper error handling with meaningful messages

---

#### Task Group 5: Processor Router Implementation

**Dependencies:** Task Groups 1, 2, 3

**Purpose:** Implement full CRUD operations for the Processor router with pagination support.

- [ ] 5.0 Complete Processor router
  - [ ] 5.1 Write 4-6 focused tests for Processor router
    - Test `processor.list` returns paginated results with cursor
    - Test `processor.list` respects limit parameter
    - Test `processor.getById` returns processor with proper data
    - Test `processor.create` creates processor with validation
    - Test multi-tenancy isolation (org1 cannot access org2 processors)
    - Reference router behavior from invitation router
  - [ ] 5.2 Implement processor router at `/home/user/compilothq/apps/web/src/server/routers/processor.ts`
    - Replace existing stub content
    - Import DAL functions from `@compilothq/database`
    - Import validation schemas from `@compilothq/validation`
    - Use `orgProcedure` for all operations
  - [ ] 5.3 Implement `list` query procedure with cursor pagination
    - Input: ProcessorFiltersSchema (type, isActive, limit, cursor)
    - Use cursor-based pagination pattern
    - Return `{ items: Processor[], nextCursor: string | null }`
  - [ ] 5.4 Implement `getById` query procedure
    - Input: `z.object({ id: z.string() })`
    - Verify processor belongs to current organization
    - Return NOT_FOUND if processor doesn't exist
  - [ ] 5.5 Implement `create` mutation procedure
    - Input: ProcessorCreateSchema from `@compilothq/validation`
    - Use `createProcessor` DAL function with `ctx.organizationId`
    - Return created processor
  - [ ] 5.6 Implement `update` mutation procedure
    - Input: `{ id: string, data: ProcessorUpdateSchema }`
    - Verify processor belongs to current organization before update
    - Return updated processor
  - [ ] 5.7 Implement `delete` mutation procedure
    - Input: `z.object({ id: z.string() })`
    - Verify processor belongs to current organization before delete
    - Return deletion confirmation
  - [ ] 5.8 Ensure Processor router tests pass
    - Run ONLY the 4-6 tests written in 5.1
    - Do NOT run the entire test suite

**Acceptance Criteria:**

- The 4-6 tests written in 5.1 pass
- Cursor-based pagination works correctly for list operation
- All CRUD procedures enforce multi-tenancy via `orgProcedure`
- Consistent response shapes with TypeScript inference

---

#### Task Group 6: Stub Routers with TypeScript Types

**Dependencies:** None (can run in parallel)

**Purpose:** Update existing stub routers with proper TypeScript types, TODO markers, and NOT_IMPLEMENTED errors.

- [ ] 6.0 Complete stub routers
  - [ ] 6.1 Update risk router at `/home/user/compilothq/apps/web/src/server/routers/risk.ts`
    - Add explicit TypeScript types for future inputs/outputs
    - Add JSDoc comments describing planned Phase 2/3 functionality
    - Define procedure signatures that throw NOT_IMPLEMENTED error
    - Procedures: `list`, `getById`, `create`, `update`, `delete`, `assess`
  - [ ] 6.2 Update control router at `/home/user/compilothq/apps/web/src/server/routers/control.ts`
    - Add explicit TypeScript types for future inputs/outputs
    - Add JSDoc comments describing planned functionality
    - Define procedure signatures that throw NOT_IMPLEMENTED error
    - Procedures: `list`, `getById`, `create`, `update`, `delete`, `linkToRisk`
  - [ ] 6.3 Update dataCategory router at `/home/user/compilothq/apps/web/src/server/routers/dataCategory.ts`
    - Add explicit TypeScript types for future inputs/outputs
    - Add JSDoc comments describing planned functionality
    - Define procedure signatures that throw NOT_IMPLEMENTED error
    - Procedures: `list`, `getById`, `create`, `update`, `delete`
  - [ ] 6.4 Verify stub routers compile correctly
    - Run TypeScript compiler check on router files
    - Verify router exports work in `_app.ts`

**Acceptance Criteria:**

- All stub routers have explicit TypeScript types
- JSDoc comments describe planned functionality
- Calling any procedure throws TRPCError with code NOT_IMPLEMENTED
- Routers compile without TypeScript errors

---

### Client Layer

#### Task Group 7: tRPC Client Enhancements

**Dependencies:** Task Groups 3, 4, 5

**Purpose:** Enhance the tRPC client with improved error handling, caching, and retry logic.

- [ ] 7.0 Complete tRPC client enhancements
  - [ ] 7.1 Write 2-4 focused tests for client configuration
    - Test QueryClient staleTime configuration is applied
    - Test retry logic behavior (mock network error scenario)
    - Test onError callback is invoked on error
  - [ ] 7.2 Update tRPC client at `/home/user/compilothq/apps/web/src/lib/trpc/client.tsx`
    - Add default QueryClient options for `staleTime` (5 minutes) and `gcTime` (10 minutes)
    - Configure retry logic for transient network errors (3 retries with exponential backoff)
    - Add `onError` callback for global error logging
    - Keep existing httpBatchLink for request batching
  - [ ] 7.3 Add error display utilities
    - Create helper function to extract user-friendly message from TRPCError
    - Handle different error codes (NOT_FOUND, UNAUTHORIZED, FORBIDDEN, etc.)
  - [ ] 7.4 Ensure client tests pass
    - Run ONLY the 2-4 tests written in 7.1
    - Do NOT run the entire test suite

**Acceptance Criteria:**

- The 2-4 tests written in 7.1 pass
- QueryClient configured with appropriate cache times
- Retry logic handles transient errors gracefully
- Error handling provides user-friendly messages

---

### Testing

#### Task Group 8: Test Review and Gap Analysis

**Dependencies:** Task Groups 1-7

**Purpose:** Review all tests written during implementation and fill critical gaps.

- [ ] 8.0 Review and finalize test coverage
  - [ ] 8.1 Review tests from Task Groups 1-7
    - Review 4-6 tests from database layer (Task 1.1)
    - Review 4-6 tests from validation layer (Task 2.1)
    - Review 4-6 tests from utilities layer (Task 3.1)
    - Review 4-6 tests from Activity router (Task 4.1)
    - Review 4-6 tests from Processor router (Task 5.1)
    - Review 2-4 tests from client layer (Task 7.1)
    - Total existing tests: approximately 22-34 tests
  - [ ] 8.2 Analyze test coverage gaps for this feature
    - Identify critical integration workflows lacking coverage
    - Focus on end-to-end data flow: client -> router -> DAL -> database
    - Check authorization edge cases across routers
    - Do NOT assess entire application test coverage
  - [ ] 8.3 Write up to 8 additional strategic tests
    - Add integration test for full CRUD workflow via Activity router
    - Add integration test for cursor pagination in Processor router
    - Add test for Prisma error transformation in real router context
    - Add test for server-side caller integration with RSC pattern
    - Add test for prefetch utility with dehydration
    - Skip exhaustive edge case coverage
  - [ ] 8.4 Run feature-specific tests only
    - Run all tests related to this spec's features
    - Expected total: approximately 30-42 tests
    - Verify all critical workflows pass
    - Do NOT run the entire application test suite

**Acceptance Criteria:**

- All feature-specific tests pass
- Critical user workflows are covered
- No more than 8 additional tests added
- Testing focused on this spec's feature requirements

---

## Execution Order

Recommended implementation sequence (with parallelization opportunities):

```
Phase 1 (Parallel):
  - Task Group 1: Database Layer (Prisma models + DAL)
  - Task Group 2: Validation Schemas
  - Task Group 3: Error Handling + Server-Side Caller

Phase 2 (After Phase 1):
  - Task Group 4: Activity Router
  - Task Group 5: Processor Router
  - Task Group 6: Stub Routers (can start in Phase 1)

Phase 3 (After Phase 2):
  - Task Group 7: Client Enhancements

Phase 4 (After Phase 3):
  - Task Group 8: Test Review & Gap Analysis
```

## Key File Paths Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `/home/user/compilothq/packages/database/src/dal/activities.ts` | Activity DAL functions |
| `/home/user/compilothq/packages/database/src/dal/processors.ts` | Processor DAL functions |
| `/home/user/compilothq/packages/validation/src/schemas/activities/*.ts` | Activity validation schemas |
| `/home/user/compilothq/packages/validation/src/schemas/processors/*.ts` | Processor validation schemas |
| `/home/user/compilothq/apps/web/src/server/utils/prisma-errors.ts` | Prisma error transformer |
| `/home/user/compilothq/apps/web/src/lib/trpc/server.ts` | Server-side tRPC caller |
| `/home/user/compilothq/apps/web/src/lib/trpc/prefetch.ts` | Prefetch utilities |

### Files to Update

| File | Purpose |
|------|---------|
| `/home/user/compilothq/packages/database/prisma/schema.prisma` | Add Activity and Processor models |
| `/home/user/compilothq/packages/database/src/index.ts` | Export new DAL functions and types |
| `/home/user/compilothq/packages/validation/src/schemas/index.ts` | Export new schemas |
| `/home/user/compilothq/apps/web/src/server/routers/activity.ts` | Full CRUD implementation |
| `/home/user/compilothq/apps/web/src/server/routers/processor.ts` | Full CRUD implementation |
| `/home/user/compilothq/apps/web/src/server/routers/risk.ts` | Stub with types |
| `/home/user/compilothq/apps/web/src/server/routers/control.ts` | Stub with types |
| `/home/user/compilothq/apps/web/src/server/routers/dataCategory.ts` | Stub with types |
| `/home/user/compilothq/apps/web/src/lib/trpc/client.tsx` | Enhanced configuration |

### Reference Files (Patterns to Follow)

| File | Pattern |
|------|---------|
| `/home/user/compilothq/apps/web/src/server/routers/invitation.ts` | Router implementation pattern |
| `/home/user/compilothq/packages/database/src/dal/invitations.ts` | DAL function pattern |
| `/home/user/compilothq/packages/validation/src/schemas/reference/country.ts` | Schema pattern |
| `/home/user/compilothq/apps/web/src/server/trpc.ts` | Procedure middleware chain |
| `/home/user/compilothq/apps/web/src/server/context.ts` | tRPC context pattern |
