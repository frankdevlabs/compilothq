# @compilothq/validation

Shared Zod validation schemas for Compilot HQ.

## Purpose

Provides centralized, type-safe validation schemas that can be used across both client and server. Ensures data consistency and validation logic is defined once and reused everywhere.

## Usage

```typescript
import {} from /* schemas will be exported here */ '@compilothq/validation'

// Example (once schemas are added):
// const result = userSchema.safeParse(data)
// if (result.success) {
//   // data is valid
// }
```

## Schema Organization

Schemas are organized by domain in the `src/schemas/` directory:

```
src/schemas/
  ├── index.ts          # Re-exports all schemas
  ├── auth/             # Authentication-related schemas
  ├── data/             # Data processing schemas
  └── compliance/       # Compliance document schemas
```

## Available Scripts

- `pnpm build` - Build TypeScript to dist/
- `pnpm dev` - Watch mode for TypeScript compilation
- `pnpm clean` - Remove dist/ folder

## Why Zod?

Zod provides:

- **Type Inference** - TypeScript types automatically derived from schemas
- **Runtime Validation** - Validate data at runtime, not just compile time
- **Composability** - Schemas can be combined and extended
- **Error Messages** - Detailed validation error messages
- **Transform** - Transform data during validation

## Development

To add new validation schemas:

1. Create schema file in `src/schemas/<domain>/`
2. Export from `src/schemas/<domain>/index.ts`
3. Re-export from `src/schemas/index.ts`
4. Re-export from `src/index.ts`
5. Run `pnpm build` to compile

Example schema:

```typescript
import { z } from 'zod'

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'user']),
})

export type User = z.infer<typeof userSchema>
```

## Best Practices

- **Keep schemas focused** - One schema per entity/concept
- **Use descriptive names** - Schema names should be clear and specific
- **Document complex validations** - Add comments for business logic
- **Reuse common patterns** - Extract reusable schema fragments
- **Test your schemas** - Validate expected and edge cases

## Integration with tRPC

These schemas can be used directly with tRPC for input validation:

```typescript
import { userSchema } from '@compilothq/validation'

export const userRouter = router({
  create: publicProcedure.input(userSchema).mutation(async ({ input }) => {
    // input is typed and validated
  }),
})
```

## Integration with React Hook Form

Schemas can be used with React Hook Form via the Zod resolver:

```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema } from '@compilothq/validation'

const form = useForm({
  resolver: zodResolver(userSchema),
})
```
