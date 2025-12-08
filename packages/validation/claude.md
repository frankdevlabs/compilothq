# @compilothq/validation Package Documentation

## Overview

This package contains shared Zod validation schemas used across the Compilothq monorepo. It provides type-safe runtime validation for forms, API endpoints, and data transformations.

## Package Structure

```
packages/validation/
├── src/
│   ├── schemas/          # Zod validation schemas
│   └── index.ts          # Main export file
├── __tests__/            # Test files
├── tsconfig.json         # TypeScript config (with composite)
├── tsconfig.build.json   # Build-specific TypeScript config
└── package.json
```

## TypeScript Configuration

### Composite Project Setup

This package is configured as a **TypeScript composite project** to enable:

- Type-safe cross-package references
- Incremental builds with `.tsbuildinfo` caching
- Automatic dependency ordering in the monorepo
- Declaration file generation for IDE support

**Key Configuration:**

```json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist"
  }
}
```

### Build Strategy

This package uses a **dual configuration approach**:

1. **`tsconfig.json`** - For IDE/development (includes tests)
2. **`tsconfig.build.json`** - For production builds (excludes tests)

The build script uses `tsconfig.build.json`:

```json
"build": "tsc --project tsconfig.build.json"
```

## Common Issues & Solutions

### Error: "Referenced project must have setting 'composite': true"

**Symptom:**

```
error TS6310: Referenced project '/Users/.../packages/validation'
must have setting "composite": true.
```

**Root Cause:**
TypeScript project references require all referenced projects to have `composite: true`. This error occurs when:

- Root `tsconfig.json` has `references: [{ "path": "./packages/validation" }]`
- But `packages/validation/tsconfig.json` is missing `composite: true`

**Solution:**
Add `composite: true` to the package's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist"
  }
}
```

**CRITICAL CONFLICT:** You **CANNOT** have both:

- `composite: true` (requires emitting `.d.ts` files)
- `noEmit: true` (prevents emitting any files)

If you have `noEmit: true`, remove it when adding `composite: true`.

**Why This Works:**

- `composite: true` enables TypeScript project references
- Generates `.d.ts` declaration files for type checking
- Creates `.tsbuildinfo` for incremental compilation
- Allows cross-package type safety without source code access

### Stale Type Errors After Configuration Changes

**Symptom:**

- TypeScript errors persist even after fixing the code
- IDE shows errors that don't appear in terminal builds
- Build works but IDE is confused

**Root Cause:**
Stale `.tsbuildinfo` cache files can cause TypeScript to use outdated type information.

**Solution:**

1. **Clean build cache:**

   ```bash
   pnpm --filter @compilothq/validation clean
   ```

   This runs `rm -rf dist *.tsbuildinfo`

2. **Restart TypeScript server in IDE:**
   - VSCode: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
   - Other IDEs: Reload window or restart

3. **Rebuild the package:**
   ```bash
   pnpm --filter @compilothq/validation build
   ```

### Build Performance Tips

**Incremental Builds:**
The `composite: true` setting enables TypeScript to skip rebuilding unchanged files:

- First build: ~2-5 seconds
- Incremental build: ~0.5-1 second (2-5x faster)

**Clean Builds:**
Run clean before builds when troubleshooting:

```bash
pnpm --filter @compilothq/validation clean
pnpm --filter @compilothq/validation build
```

**Full Monorepo Build:**
From root directory:

```bash
pnpm build  # Builds all packages in dependency order
```

## Development Workflow

### Local Development

```bash
# Watch mode (rebuilds on file changes)
pnpm --filter @compilothq/validation dev

# Run tests in watch mode
pnpm --filter @compilothq/validation test:watch
```

### Adding New Schemas

1. Create schema in `src/schemas/`
2. Export from `src/index.ts`
3. Run tests: `pnpm --filter @compilothq/validation test`
4. Build: `pnpm --filter @compilothq/validation build`

### Testing

```bash
# Run tests once
pnpm --filter @compilothq/validation test

# Watch mode
pnpm --filter @compilothq/validation test:watch
```

## Package Exports

The package uses modern package.json exports:

```json
{
  "exports": {
    ".": {
      "types": "./dist/src/index.d.ts",
      "import": "./dist/src/index.js"
    },
    "./schemas/*": {
      "types": "./dist/src/schemas/*.d.ts",
      "import": "./dist/src/schemas/*.js"
    }
  }
}
```

**Usage in other packages:**

```typescript
// Import main exports
import { userSchema } from '@compilothq/validation'

// Import specific schemas
import { organizationSchema } from '@compilothq/validation/schemas/organization'
```

## Troubleshooting Checklist

When encountering build or type errors:

- [ ] Run `pnpm --filter @compilothq/validation clean`
- [ ] Delete `node_modules` and reinstall: `pnpm install`
- [ ] Verify `tsconfig.json` has `composite: true` and no `noEmit: true`
- [ ] Check `.gitignore` includes `*.tsbuildinfo` and `dist/`
- [ ] Restart TypeScript server in your IDE
- [ ] Rebuild: `pnpm --filter @compilothq/validation build`
- [ ] Check for circular dependencies between packages

## Best Practices

1. **Always use Zod schemas** - Never rely on TypeScript types alone for runtime validation
2. **Export type-safe inference** - Use `z.infer<typeof schema>` for TypeScript types
3. **Keep schemas focused** - One schema per entity/domain concept
4. **Version schemas carefully** - Breaking changes require coordinated updates across packages
5. **Test validation rules** - Write tests for edge cases and error messages

## Update Schema Pattern (CRITICAL RULE)

### ❌ NEVER Use `.partial()` to Derive Update Schemas

**Problem:**

```typescript
// ❌ WRONG - Inherits .default() values
export const EntityUpdateSchema = EntityCreateSchema.partial()
// Result: {} → { isActive: true } (unwanted default applied)
```

When you use `.partial()`, Zod makes fields optional BUT preserves `.default()` values. This causes:

- Empty updates `{}` return objects with defaults
- Violates REST PATCH semantics
- Unintended database writes

### ✅ ALWAYS Use Inline Field Definitions

**Solution:**

```typescript
// ✅ CORRECT - Explicit inline definition
export const EntityUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  status: StatusEnum.optional(), // NO .default()
  isActive: z.boolean().optional(), // NO .default()
})
// Result: {} → {} (stays empty as expected)
```

### Field Conversion Rules

| Create Schema                      | Update Schema                                  |
| ---------------------------------- | ---------------------------------------------- |
| `z.string().min(1)`                | `z.string().min(1).optional()`                 |
| `Enum.default('VALUE')`            | `Enum.optional()`                              |
| `z.boolean().default(true)`        | `z.boolean().optional()`                       |
| `z.array(...).default([])`         | `z.array(...).optional()`                      |
| `z.string().optional().nullable()` | `z.string().optional().nullable()` (unchanged) |

### Why This Matters

**REST PATCH Semantics:**

- Empty update `{}` means "change nothing"
- NOT "apply creation defaults"

**Database Safety:**

- Only provided fields should be written
- Prevents unintended column updates

### Reference Implementation

See `packages/validation/src/schemas/recipients/update.schema.ts` for the gold standard pattern.

## Related Documentation

- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Zod Documentation](https://zod.dev/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- Main project documentation: `/CLAUDE.md`
