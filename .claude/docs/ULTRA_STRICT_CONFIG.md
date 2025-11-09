# Ultra-Strict TypeScript & ESLint Configuration

This document describes the ultra-strict TypeScript and ESLint configuration implemented in the CompiloHQ monorepo.

## Overview

The codebase now enforces maximum type safety and code quality through:

1. **Strictest possible TypeScript compiler options**
2. **Type-aware ESLint rules with typescript-eslint v8**
3. **Security vulnerability detection**
4. **Automatic import organization**
5. **React 19 Compiler-powered lint rules**
6. **Vitest-specific test linting**

## TypeScript Configuration

### Base Configuration (`tsconfig.base.json`)

#### Core Strict Options

- `strict: true` - Enables all strict mode checks
- `noUncheckedIndexedAccess: true` - Array/object access returns `T | undefined`
- `noImplicitReturns: true` - All code paths must return a value
- `noImplicitOverride: true` - Require explicit `override` keyword
- `exactOptionalPropertyTypes: true` - Distinguish `undefined` from missing properties
- `noPropertyAccessFromIndexSignature: true` - Use bracket notation for index signatures
- `allowUnreachableCode: false` - Error on unreachable code
- `allowUnusedLabels: false` - Error on unused labels
- `verbatimModuleSyntax: true` - Clearer import/export semantics

#### Quality Checks

- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `forceConsistentCasingInFileNames: true`

### Package-Specific Overrides

#### Database Package (`packages/database/tsconfig.json`)

```json
{
  "verbatimModuleSyntax": false, // Required for CommonJS + Prisma
  "exactOptionalPropertyTypes": false // Prisma types incompatible
}
```

## ESLint Configuration

### Root Configuration (`eslint.config.mjs`)

#### Enabled Plugins

- `@eslint/js` - Core JavaScript rules
- `@typescript-eslint/eslint-plugin` v8 - TypeScript-specific rules
- `eslint-plugin-security` - Security vulnerability detection
- `eslint-plugin-import` - Import/export validation
- `eslint-plugin-simple-import-sort` - Automatic import sorting

#### Type-Aware Linting

```javascript
parserOptions: {
  projectService: true,  // Use TypeScript's project service
  tsconfigRootDir: import.meta.dirname
}
```

#### Critical Rules Enabled

**Promise & Async Safety (Prevents Common Bugs):**

- `@typescript-eslint/no-floating-promises` - Error on unhandled promises
- `@typescript-eslint/no-misused-promises` - Prevent promise misuse
- `@typescript-eslint/await-thenable` - Only await promise-like values
- `@typescript-eslint/require-await` - Async functions must use await
- `@typescript-eslint/promise-function-async` - Promise-returning functions should be async

**Type Safety:**

- `@typescript-eslint/no-explicit-any` - **ERROR** (upgraded from warn)
- `@typescript-eslint/no-unsafe-assignment` - Error on unsafe any assignments
- `@typescript-eslint/no-unsafe-call` - Error on calling any values
- `@typescript-eslint/no-unsafe-member-access` - Error on accessing any properties
- `@typescript-eslint/no-unsafe-return` - Error on returning any values
- `@typescript-eslint/restrict-template-expressions` - Safe template literals
- `@typescript-eslint/restrict-plus-operands` - Type-safe + operator

**Code Quality:**

- `@typescript-eslint/no-unnecessary-condition` - Remove redundant conditions
- `@typescript-eslint/prefer-nullish-coalescing` - Use `??` over `||`
- `@typescript-eslint/prefer-optional-chain` - Use optional chaining
- `@typescript-eslint/no-non-null-assertion` - Avoid `!` assertions
- `@typescript-eslint/switch-exhaustiveness-check` - Exhaustive switch cases

**Import Organization (Auto-fixable):**

- `simple-import-sort/imports` - Sort imports alphabetically
- `simple-import-sort/exports` - Sort exports alphabetically
- `import/first` - Imports must be first
- `import/newline-after-import` - Newline after imports
- `import/no-duplicates` - No duplicate imports

**Security:**

- `security/detect-eval-with-expression` - Prevent eval usage
- `security/detect-unsafe-regex` - Detect ReDoS vulnerabilities
- `security/detect-object-injection` - Warn on object injection patterns
- `security/detect-non-literal-regexp` - Warn on dynamic regex

### Next.js App Configuration (`apps/web/eslint.config.mjs`)

#### Additional Plugins

- `eslint-plugin-react-hooks` v7 - React 19 & Compiler rules
- `eslint-plugin-vitest` - Test-specific rules

#### React Hooks Configuration

```javascript
rules: {
  ...reactHooks.configs['recommended-latest'].rules  // React Compiler-powered rules
}
```

#### Vitest Configuration

Test files only (`**/*.test.ts`, `**/*.spec.ts`, `**/__tests__/**`):

- `vitest/expect-expect` - Tests must have assertions
- `vitest/no-disabled-tests` - Warn on `.skip()`
- `vitest/no-focused-tests` - Error on `.only()`
- `vitest/valid-expect` - Valid expect calls

### Package-Specific Configurations

#### Database Package (`packages/database/eslint.config.mjs`)

- Extra strict async/promise rules for data access layer
- `@typescript-eslint/only-throw-error` - Only throw Error instances
- Focus on database operation safety

#### UI Package (`packages/ui/eslint.config.mjs`)

- React Hooks rules with Compiler optimization detection
- Import organization for clean component files
- Component-specific safety rules

#### Validation Package (`packages/validation/eslint.config.mjs`)

- Maximum strictness for schema definitions
- `@typescript-eslint/strict-boolean-expressions` - Strict boolean checks
- Security rules for input validation (regex safety)

## NPM Scripts

### Enhanced Scripts

```bash
# Type checking
pnpm typecheck              # Build and check types
pnpm typecheck:watch        # Watch mode

# Linting
pnpm lint                   # Run ESLint
pnpm lint:fix               # Auto-fix issues
pnpm lint:strict            # Typecheck + lint

# Validation
pnpm validate               # Format check + strict lint + unit tests
```

### Pre-commit Hooks

#### lint-staged Configuration

```json
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings 0", // No warnings allowed
    "prettier --write"
  ]
}
```

## ESLint MCP Integration

### Using ESLint MCP in Claude Code

The `mcp__eslint__lint-files` tool provides real-time ESLint feedback:

```javascript
// Example usage
mcp__eslint__lint -
  files({
    filePaths: ['/path/to/file1.ts', '/path/to/file2.ts'],
  })
```

### Workflow

1. After writing/editing TypeScript files → Automatically call `mcp__eslint__lint-files`
2. Parse errors and warnings → Fix issues
3. Re-lint until zero errors
4. Ensures code quality before considering task complete

## Common Issues & Solutions

### Issue: Array/Object Access Returns Undefined

**Error:**

```typescript
const item = array[0] // Type: T | undefined
```

**Solution:**

```typescript
const item = array[0]
if (!item) throw new Error('Item not found')
// Now item is T
```

### Issue: process.env Access

**Error:**

```typescript
process.env.NODE_ENV // Error: Property 'NODE_ENV' comes from index signature
```

**Solution:**

```typescript
process.env['NODE_ENV'] // Use bracket notation
```

### Issue: Floating Promises

**Error:**

```typescript
someAsyncFunction() // Error: no-floating-promises
```

**Solution:**

```typescript
await someAsyncFunction()
// OR
void someAsyncFunction() // Intentionally fire-and-forget
```

### Issue: Async Functions Without Await

**Error:**

```typescript
async function foo() {
  // Error: require-await
  return 'hello'
}
```

**Solution:**

```typescript
function foo() {
  // Remove async if not using await
  return 'hello'
}
```

### Issue: Explicit Any

**Error:**

```typescript
function foo(bar: any) {
  // Error: no-explicit-any
  // ...
}
```

**Solution:**

```typescript
function foo(bar: unknown) {
  // Use unknown instead
  // Type guard before use
  if (typeof bar === 'string') {
    // bar is string here
  }
}
```

### Issue: Prefer Nullish Coalescing

**Error:**

```typescript
const value = input || 'default' // Error: may not work for falsy values
```

**Solution:**

```typescript
const value = input ?? 'default' // Only null/undefined trigger default
```

### Issue: Test Files Not in Project Service

**Error:**

```
Parsing error: file.test.ts was not found by the project service
```

**Solution:**
Add test files to tsconfig.json:

```json
{
  "include": ["src/**/*", "__tests__/**/*"]
}
```

## Known Limitations

### Prisma Generated Types

Prisma's generated types are not fully compatible with:

- `exactOptionalPropertyTypes` - Disabled in database package
- `JsonValue` vs `InputJsonValue` - Requires `as any` type assertions in factories

### CommonJS + verbatimModuleSyntax

The database package uses CommonJS for Prisma compatibility, requiring:

```json
{
  "verbatimModuleSyntax": false
}
```

### Security Plugin False Positives

`security/detect-object-injection` may warn on safe operations:

```javascript
const services = { postgres: '...', redis: '...' }
const service = services[name] // Warning (false positive if name is validated)
```

## Migration Guide

### Fixing Existing Code

1. **Run TypeScript compiler:**

```bash
pnpm typecheck
```

2. **Run ESLint:**

```bash
pnpm lint
```

3. **Auto-fix what's possible:**

```bash
pnpm lint:fix
```

4. **Manually fix remaining issues:**
   - Focus on async/promise safety first (critical bugs)
   - Fix type safety issues (`any`, unsafe assignments)
   - Address code quality improvements

5. **Verify:**

```bash
pnpm validate
```

### Expected Error Counts

**Fresh from ultra-strict config:**

- ~50-150 TypeScript errors (mainly `noUncheckedIndexedAccess`)
- ~30-80 ESLint errors (mainly promise handling)
- ~60% auto-fixable (imports, formatting)

## Performance Considerations

### Type-Aware Linting

Type-aware rules use TypeScript's type checker, which:

- Increases lint time by ~2-3x
- Provides significantly better error detection
- Worth the tradeoff for critical rules

### Caching

ESLint v9 uses flat config with better caching:

- Faster subsequent runs
- Project service caching reduces overhead

## Benefits

### Bugs Prevented

- ✅ Undefined access bugs from unchecked array/object indexing
- ✅ Unhandled promise rejections
- ✅ Async functions missing await
- ✅ Implicit any types hiding errors
- ✅ React hooks violations
- ✅ Security vulnerabilities

### Developer Experience

- ✅ Stricter IntelliSense
- ✅ Earlier error detection (in editor vs runtime)
- ✅ Consistent code style (auto-formatted imports)
- ✅ Safer refactoring

### Code Quality

- ✅ Enforced best practices
- ✅ Consistent patterns across monorepo
- ✅ Better documentation through types
- ✅ Safer PRs (pre-commit checks)

## Resources

- [TypeScript Handbook - Compiler Options](https://www.typescriptlang.org/tsconfig/)
- [typescript-eslint v8 Documentation](https://typescript-eslint.io/)
- [ESLint v9 Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [React Compiler](https://react.dev/blog/2025/10/07/react-compiler-1)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

## Maintenance

### Updating Rules

When adding new rules:

1. Test impact with `pnpm lint` first
2. Run auto-fix: `pnpm lint:fix`
3. Assess manual fixes needed
4. Update this documentation

### Disabling Rules

Only disable rules when:

1. False positive confirmed (not workaround for real issue)
2. External library incompatibility
3. Performance critical code with justification

Use inline comments sparingly:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const value = externalLibrary.getValue() // Library types are wrong
```

## Conclusion

This ultra-strict configuration provides maximum type safety and code quality for the CompiloHQ project. While it requires more upfront effort, it prevents entire categories of bugs and improves long-term maintainability.

The integration with ESLint MCP allows Claude Code to automatically detect and fix issues, ensuring consistently high code quality across the codebase.
