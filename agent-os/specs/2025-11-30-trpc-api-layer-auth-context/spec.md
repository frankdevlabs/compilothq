# Specification: tRPC API Layer with Auth Context

## Goal

Expand the existing tRPC v11 infrastructure with error handling utilities, priority domain routers (activityRouter, processorRouter), shared validation schemas in `@compilothq/validation`, server-side caller for React Server Components, and prefetching patterns for optimal perceived performance.

## User Stories

- As a developer, I want type-safe API calls with end-to-end type inference so that I can catch errors at compile time and leverage IDE autocomplete
- As a developer, I want consistent Prisma error handling so that database errors are transformed into meaningful TRPCError responses automatically

## Specific Requirements

**Prisma Error Transformer Utility**

- Create `apps/web/src/server/utils/prisma-errors.ts` utility file
- Map Prisma error code P2002 (unique constraint violation) to TRPCError code CONFLICT
- Map Prisma error code P2025 (record not found) to TRPCError code NOT_FOUND
- Map Prisma error code P2003 (foreign key constraint) to TRPCError code BAD_REQUEST
- Export a `handlePrismaError` function that wraps async operations and transforms errors
- Include user-friendly error messages that do not expose internal database details
- Provide TypeScript generic support for proper return type inference

**Server-Side Caller for React Server Components**

- Create `apps/web/src/lib/trpc/server.ts` for server-side tRPC calling
- Use `createCallerFactory` from tRPC v11 to create type-safe server caller
- Create context with session from NextAuth `auth()` function
- Export `api` object that mirrors client-side `trpc` usage patterns
- Ensure caller works correctly in Next.js App Router server components
- Cache the caller appropriately using React cache() function

**Activity Router Implementation (Full CRUD)**

- Implement in `apps/web/src/server/routers/activity.ts` following invitationRouter patterns
- Procedures: `list`, `getById`, `create`, `update`, `delete`
- Use `orgProcedure` for all operations to enforce multi-tenancy filtering
- Import validation schemas from `@compilothq/validation` package
- Create corresponding DAL functions in `packages/database/src/dal/activities.ts`
- Return consistent response shapes with proper TypeScript inference

**Processor Router Implementation (Full CRUD)**

- Implement in `apps/web/src/server/routers/processor.ts` following invitationRouter patterns
- Procedures: `list`, `getById`, `create`, `update`, `delete`
- Use `orgProcedure` for all operations to enforce multi-tenancy filtering
- Import validation schemas from `@compilothq/validation` package
- Create corresponding DAL functions in `packages/database/src/dal/processors.ts`
- Include pagination support for list operations with cursor-based approach

**Stub Routers with TypeScript Types**

- Update `riskRouter`, `controlRouter`, `dataCategoryRouter` with TODO markers
- Add explicit TypeScript types for future procedure inputs and outputs
- Include JSDoc comments describing planned functionality for each procedure
- Define procedure signatures without implementation (throw NOT_IMPLEMENTED error)
- Structure follows Phase 2/3 roadmap comments from requirements

**Validation Schemas in @compilothq/validation**

- Create `packages/validation/src/schemas/activities/` folder structure
- Create schemas: `create.schema.ts`, `update.schema.ts`, `filters.schema.ts`
- Create `packages/validation/src/schemas/processors/` folder structure
- Follow existing pattern from `packages/validation/src/schemas/reference/country.ts`
- Export TypeScript inferred types alongside Zod schemas
- Use `.partial()` for update schemas based on create schemas

**Prefetching Patterns Documentation**

- Create `apps/web/src/lib/trpc/prefetch.ts` with prefetch utility functions
- Implement `prefetchQuery` helper that integrates with server-side caller
- Document pattern for prefetching in layout.tsx and page.tsx server components
- Include example of passing prefetched data to client components via HydrationBoundary
- Use TanStack Query dehydrate/hydrate patterns for RSC-to-client handoff

**tRPC Client Enhancements**

- Update `apps/web/src/lib/trpc/client.tsx` with improved error handling
- Add default QueryClient options for staleTime and gcTime
- Configure retry logic for transient errors (network issues)
- Add onError callback for global error handling/logging

## Visual Design

No visual mockups provided for this specification.

## Existing Code to Leverage

**`apps/web/src/server/routers/invitation.ts` - Reference Router Pattern**

- Use as template for CRUD operation structure and error handling
- Follow DAL function import pattern from `@compilothq/database`
- Replicate TRPCError usage with appropriate error codes (NOT_FOUND, BAD_REQUEST, FORBIDDEN)
- Apply inline Zod validation pattern with `.input(z.object({...}))`
- Mirror business logic validation before mutations pattern

**`apps/web/src/server/trpc.ts` - Middleware Chain**

- Leverage existing `publicProcedure`, `protectedProcedure`, `orgProcedure` hierarchy
- orgProcedure automatically provides `ctx.organizationId` for multi-tenancy
- Use protectedProcedure for authenticated operations without org requirement

**`packages/validation/src/schemas/reference/country.ts` - Schema Pattern**

- Follow Create/Update schema pattern with TypeScript type inference
- Use `.partial()` method for update schemas derived from create schemas
- Include comprehensive Zod validation with meaningful error messages
- Export inferred types: `type ActivityCreate = z.infer<typeof ActivityCreateSchema>`

**`packages/database/src/dal/invitations.ts` - DAL Function Pattern**

- Follow function naming convention (create, findBy, list, update, delete)
- Include JSDoc comments documenting security considerations
- Always filter by organizationId in list/find operations for multi-tenancy
- Return typed Prisma results with explicit select/include for data minimization

**`apps/web/src/lib/trpc/client.tsx` - Client Setup**

- Extend existing TRPCProvider with enhanced QueryClient configuration
- Maintain httpBatchLink for request batching optimization
- Keep AppRouter type import pattern for end-to-end type safety

## Out of Scope

- WebSocket/subscription support (deferred to Phase 5 Collaboration features)
- Rate limiting middleware (infrastructure concern, separate observability spec)
- API analytics and logging (separate observability specification)
- Batch mutations (premature optimization)
- Full implementation of riskRouter, controlRouter, dataCategoryRouter (stub only)
- Role-based procedure factory `roleProcedure` (document pattern only, implement later)
- Optimistic update implementations (document pattern only)
- OpenAPI/Swagger documentation generation
- API versioning strategy
- GraphQL integration or comparison
