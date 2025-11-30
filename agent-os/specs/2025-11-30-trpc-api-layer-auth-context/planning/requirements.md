# tRPC API Layer with Auth Context - Requirements

## Decision Summary

### 1. Approach: Expand/Refine (Not Restructure)
- Current foundation is solid, follows tRPC v11 best practices
- The `publicProcedure → protectedProcedure → orgProcedure` middleware chain is correct
- Focus on:
  - Adding error handling utilities (Prisma error transformer)
  - Better type inference helpers
  - Potentially a `roleProcedure` factory for persona-based access control

### 2. Router Implementation: Option B (2-3 Priority Routers)
- **Full CRUD**: `activityRouter`, `processorRouter` (most referenced in roadmap)
- **Stub with types**: `riskRouter`, `controlRouter`, `dataCategoryRouter`
- Validates patterns without over-engineering

### 3. Zod Schemas: Shared (Client + Server)
- Use `@compilothq/validation` package for both client and server
- Structure:
  ```
  packages/validation/src/schemas/
  ├── activities/
  │   ├── create.schema.ts    # Used by tRPC .input() AND React Hook Form
  │   ├── update.schema.ts
  │   └── filters.schema.ts
  ```
- Benefits:
  - Single source of truth
  - Form validation matches API validation
  - Type inference flows end-to-end

### 4. Prisma Error Transformation: Yes
- Implement error transformer utility
- Map Prisma error codes to TRPCError codes:
  - `P2002` (Unique constraint) → `CONFLICT`
  - `P2025` (Record not found) → `NOT_FOUND`
- Location: `apps/web/src/server/utils/prisma-errors.ts`

### 5. Future Router Structure: Yes (with TODO markers)
- Define structure with explicit `// TODO` markers
- Provides IDE autocomplete guidance without premature implementation
- Phases:
  - Phase 2: Assessment Architecture (questionnaire, assessment routers)
  - Phase 3: Document Generation (document router)

### 6. tRPC Client Enhancements

| Enhancement          | Include? | Rationale |
|---------------------|----------|-----------|
| Server-side caller   | ✅ Yes   | Essential for RSC |
| Prefetching patterns | ✅ Yes   | Critical for perceived performance |
| Optimistic updates   | ⚠️ Document pattern only | Case-by-case need |

### 7. Exclusions from Scope

| Exclude | Reason |
|---------|--------|
| Subscription/WebSocket support | Not needed until item 47 (Collaboration) |
| Rate limiting middleware | Infrastructure concern, not API layer |
| API analytics/logging | Better as separate observability spec |
| Batch mutations | Premature optimization |
| Full implementation of all routers | Only 2-3 priority routers |

### 8. Reference Pattern: invitationRouter
- Use `apps/web/src/server/routers/invitation.ts` as reference
- Best practices observed:
  - DAL function imports from `@compilothq/database`
  - Proper TRPCError usage with appropriate codes
  - Inline Zod validation with `.input(z.object({...}))`
  - Business logic validation before mutations
  - Consistent return patterns
  - Mixed procedure types (public, protected, org)
- Improvement: Extract Zod schemas to `@compilothq/validation` for form reuse

## Visual Assets
No diagrams provided.

## Sources
- https://dev.to/matowang/trpc-11-setup-for-nextjs-app-router-2025-33fo
- https://trpc.io/docs/client/react/server-components
- https://www.prisma.io/docs/orm/prisma-client/debugging-and-troubleshooting/handling-exceptions-and-errors
- https://github.com/trpc/trpc/discussions/2021
- https://tanstack.com/query/v4/docs/react/guides/optimistic-updates
