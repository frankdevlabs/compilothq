---
description: Design and implement end-to-end type-safe APIs using tRPC with proper router organization, procedure definitions, input validation with Zod schemas, context management, and middleware. Use this skill when creating or modifying tRPC router files, procedure definitions, tRPC context files, tRPC middleware, API route handlers that use tRPC, server-side tRPC configuration files, or any backend code that defines tRPC queries and mutations. This skill applies when defining tRPC routers with queries and mutations, implementing input validation using Zod schemas for type-safe runtime validation, creating reusable sub-routers and composing them into larger routers, setting up tRPC context for request-scoped data like user sessions and database connections, implementing tRPC middleware for authentication, logging, and error handling, organizing routers by feature or domain (e.g., user router, post router, comment router), defining procedure-level permissions and access control, handling errors with tRPC error codes (BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INTERNAL_SERVER_ERROR), leveraging TypeScript inference for end-to-end type safety between server and client, implementing batch operations and optimistic updates, working with tRPC adapters for Next.js, Express, or standalone servers, and integrating tRPC with React Query or TanStack Query on the frontend. Use this when structuring routers in files like server/routers/*.ts or src/server/api/routers/*.ts, defining procedures with .query() for read operations and .mutation() for write operations, using Zod (.input(z.object({...}))) for validating all input parameters to ensure type safety and prevent invalid data, organizing related procedures into feature-based routers and merging them using mergeRouters or router nesting, creating a createContext function that provides request-scoped dependencies to all procedures, implementing authentication middleware using .use() to protect procedures and verify user permissions, returning appropriate TRPCError instances with specific error codes for different failure scenarios, leveraging the automatic type inference that flows from server procedures to client hooks, batching multiple tRPC calls when possible to reduce network overhead, and configuring tRPC adapters correctly for the server framework being used.
location: project
---

## When to use this skill

- When creating or modifying tRPC router files (e.g., `server/routers/*.ts`, `src/server/api/routers/*.ts`, `*.router.ts`)
- When defining tRPC procedures using `.query()` for read operations or `.mutation()` for write/update operations
- When implementing input validation using Zod schemas with `.input(z.object({...}))`
- When setting up tRPC context in `context.ts` or `createContext` functions to provide request-scoped data
- When implementing tRPC middleware for authentication, authorization, logging, or error handling using `.use()`
- When organizing API logic into feature-based or domain-based routers (user router, post router, etc.)
- When composing multiple sub-routers into a main app router using `mergeRouters` or router nesting
- When handling errors in procedures and returning `TRPCError` with appropriate error codes
- When configuring tRPC server adapters for Next.js API routes, Express servers, or standalone servers
- When working on files that integrate tRPC with React Query/TanStack Query on the frontend
- When implementing procedure-level permissions and access control logic
- When structuring server-side API code that requires end-to-end type safety
- When migrating from REST APIs to type-safe tRPC procedures
- When creating reusable procedure middleware for common patterns like rate limiting or request validation

## Core tRPC Concepts

### Routers and Procedures

tRPC organizes API logic into **routers** containing **procedures**. Each procedure is either a:

- **Query** (`.query()`): Read operations that don't modify data
- **Mutation** (`.mutation()`): Write operations that create, update, or delete data

Organize routers by feature or domain for maintainability:

```typescript
// server/routers/user.router.ts
import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'

export const userRouter = router({
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    return ctx.db.user.findUnique({ where: { id: input.id } })
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.userId },
        data: input,
      })
    }),
})
```

### Input Validation with Zod

Always validate inputs using Zod schemas for type-safe runtime validation:

```typescript
.input(z.object({
  title: z.string().min(1).max(100),
  content: z.string(),
  published: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
}))
```

### Context and Middleware

**Context** provides request-scoped data to all procedures:

```typescript
// server/trpc.ts
export const createContext = async ({ req, res }: CreateContextOptions) => {
  const session = await getSession(req)
  return {
    session,
    db: prisma,
    req,
    res,
  }
}
```

**Middleware** adds reusable logic to procedures:

```typescript
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session, // Now guaranteed to exist
    },
  })
})

export const protectedProcedure = publicProcedure.use(isAuthenticated)
```

### Error Handling

Use `TRPCError` with appropriate error codes:

```typescript
import { TRPCError } from '@trpc/server'

// In a procedure:
if (!post) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Post not found',
  })
}

if (post.authorId !== ctx.session.userId) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'You do not have permission to edit this post',
  })
}
```

Common error codes:

- `BAD_REQUEST`: Invalid input or malformed request
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User authenticated but lacks permission
- `NOT_FOUND`: Resource doesn't exist
- `INTERNAL_SERVER_ERROR`: Unexpected server error

## Best Practices

### Router Organization

**Organize by feature/domain**, not by operation type:

```
server/routers/
  ├── user.router.ts      # All user-related procedures
  ├── post.router.ts      # All post-related procedures
  ├── comment.router.ts   # All comment-related procedures
  └── index.ts            # Merge all routers
```

```typescript
// server/routers/index.ts
import { router } from '../trpc'
import { userRouter } from './user.router'
import { postRouter } from './post.router'
import { commentRouter } from './comment.router'

export const appRouter = router({
  user: userRouter,
  post: postRouter,
  comment: commentRouter,
})

export type AppRouter = typeof appRouter
```

### Type Safety

Export the `AppRouter` type and use it on the client for full type inference:

```typescript
// client/trpc.ts
import type { AppRouter } from '../server/routers'

export const trpc = createTRPCClient<AppRouter>({
  // ... configuration
})
```

This provides autocomplete and type checking for all procedure calls on the client.

### Input Validation

- **Always** use `.input()` with Zod schemas for runtime validation
- Define reusable Zod schemas for common patterns
- Use `.safeParse()` when you need custom error handling

```typescript
// Reusable schemas
const idSchema = z.object({ id: z.string().uuid() })
const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
})

export const postRouter = router({
  list: publicProcedure.input(paginationSchema).query(async ({ input }) => {
    // input is fully typed and validated
  }),
})
```

### Procedure Protection

Create different procedure types for different permission levels:

```typescript
// server/trpc.ts
export const publicProcedure = t.procedure
export const protectedProcedure = publicProcedure.use(isAuthenticated)
export const adminProcedure = protectedProcedure.use(isAdmin)
```

### Context Design

Keep context creation efficient and include only what's needed:

```typescript
export const createContext = async ({ req, res }: CreateContextOptions) => {
  // Don't fetch user data here if not always needed
  const session = await getSessionToken(req)

  return {
    session, // Just the token/ID
    db: prisma,
    req,
    res,
  }
}

// Fetch user data in middleware only for protected procedures
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const user = await ctx.db.user.findUnique({
    where: { id: ctx.session.userId },
  })

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      ...ctx,
      user, // Now available in protected procedures
    },
  })
})
```

### Composition and Reusability

Compose routers for better organization:

```typescript
// Nested routers
export const appRouter = router({
  user: router({
    profile: userProfileRouter,
    settings: userSettingsRouter,
  }),
  post: postRouter,
})

// Access: trpc.user.profile.get()
```

Create reusable middleware:

```typescript
const withRateLimit = t.middleware(async ({ ctx, next, path }) => {
  await checkRateLimit(ctx.req.ip, path)
  return next()
})

const withLogging = t.middleware(async ({ ctx, next, path }) => {
  const start = Date.now()
  const result = await next()
  console.log(`${path} took ${Date.now() - start}ms`)
  return result
})

export const rateLimitedProcedure = publicProcedure.use(withLogging).use(withRateLimit)
```

## Integration Patterns

### Next.js Integration

```typescript
// pages/api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next'
import { appRouter } from '../../../server/routers'
import { createContext } from '../../../server/trpc'

export default createNextApiHandler({
  router: appRouter,
  createContext,
})
```

### Client Setup with React Query

```typescript
// utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers';

export const trpc = createTRPCReact<AppRouter>();

// _app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});

function MyApp({ Component, pageProps }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

## Common Patterns

### Pagination

```typescript
export const postRouter = router({
  list: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit } = input
      const posts = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      })

      const hasMore = posts.length > limit
      const items = hasMore ? posts.slice(0, -1) : posts

      return {
        items,
        nextCursor: hasMore ? items[items.length - 1].id : undefined,
      }
    }),
})
```

### Optimistic Updates

Handle optimistic updates on the client:

```typescript
const utils = trpc.useContext()

const mutation = trpc.post.create.useMutation({
  onMutate: async (newPost) => {
    await utils.post.list.cancel()
    const previousPosts = utils.post.list.getData()

    utils.post.list.setData(undefined, (old) => ({
      ...old,
      items: [newPost, ...(old?.items ?? [])],
    }))

    return { previousPosts }
  },
  onError: (err, newPost, context) => {
    utils.post.list.setData(undefined, context?.previousPosts)
  },
  onSettled: () => {
    utils.post.list.invalidate()
  },
})
```

### File Uploads

For file uploads, consider using separate endpoints or transform the data:

```typescript
// Option 1: Use base64 encoding (for small files)
export const fileRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileData, 'base64')
      // Upload to S3, save to disk, etc.
    }),
})

// Option 2: Use a separate multipart endpoint
// Keep tRPC for metadata, use traditional endpoint for file
```

## Security Considerations

- **Always validate inputs** with Zod schemas to prevent injection attacks
- **Use middleware** for authentication/authorization, don't repeat logic
- **Return appropriate error codes** - don't expose sensitive information in error messages
- **Rate limit** public procedures to prevent abuse
- **Sanitize outputs** if returning user-generated content
- **Use HTTPS** in production for encrypted communication
- **Implement CORS** properly if using tRPC across different domains
- **Validate permissions** at the procedure level, not just at the router level

## Performance Optimization

- **Use batching** with `httpBatchLink` to combine multiple requests
- **Implement caching** on the client with React Query's cache configuration
- **Optimize database queries** within procedures (use select, include wisely)
- **Use pagination** for large datasets instead of fetching everything
- **Consider data loaders** for solving N+1 query problems
- **Monitor procedure performance** and add logging middleware
