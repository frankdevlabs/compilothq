# Spec Requirements: Monorepo & Prisma Infrastructure Setup

## Initial Description

Set up monorepo structure with pnpm workspaces, create packages/database with Prisma schema and client, configure packages/ui for shared components, establish cross-package dependencies, set up Prisma Client exports and singleton pattern, configure migration scripts to work from root and package level, and prepare development tooling.

## Requirements Discussion

### First Round Questions

**Q1:** For package naming, should we use scoped packages like @compilothq/database, @compilothq/ui, etc.?
**Answer:** Yes - @compilothq/database, @compilothq/ui, @compilothq/validation (scoped, consistent)

**Q2:** How should the Prisma schema be organized - monolithic file or split by domain?
**Answer:** Monolithic file with comment sections. Split later only if it exceeds 2000 lines or team size demands it.

**Q3:** How should the Prisma Client be exported from the database package?
**Answer:** Singleton pattern from packages/database/src/index.ts

**Q4:** Should database connection config be read from environment variables, and should we include .env.example?
**Answer:** Read from DATABASE_URL. Include .env.example. Seed scripts come in roadmap item #3.

**Q5:** What should the UI package export structure look like?
**Answer:**

```typescript
// packages/ui exports:
export { Button, Input, Card } from './components' // shadcn components
export { cn } from './lib/utils' // utilities
export * from './lib/theme' // Tailwind config/tokens
```

Zod schemas go in separate @compilothq/validation package.

**Q6:** Should migration scripts be available at both root level and package level?
**Answer:** Both levels:

```bash
# Root (convenience)
pnpm db:migrate
pnpm db:push
pnpm db:studio
pnpm db:seed

# Direct (from packages/database)
cd packages/database && pnpm migrate
```

**Q7:** How should TypeScript configuration be structured across packages?
**Answer:**

- Shared `tsconfig.base.json` at root (strict mode, shared compiler options)
- Each package extends it
- Use project references for incremental builds
- Each package has own `dist/` folder

**Q8:** Should development tooling (ESLint, Prettier, Husky) be configured at root level or per package?
**Answer:** ESLint, Prettier, Husky at root level. Skip Vitest for now (comes in roadmap item #11).

**Q9:** What should be explicitly excluded from this spec?
**Answer:**

- Actual Prisma models (added in roadmap item #3)
- Authentication/NextAuth setup
- Docker Compose
- tRPC routers (structure only, no actual routers)
- Deployment configs
- CI/CD pipelines
- Documentation site

**Q10:** Should the Prisma schema include a placeholder model to validate the setup?
**Answer:** Yes - include a minimal working model to validate the setup

**Q11:** Is there existing codebase structure to reference or is this greenfield?
**Answer:** Greenfield monorepo. Documented lessons about future data models exist in briefing.md (will be used in later roadmap items)

### Important Clarification

**CRITICAL UPDATE:** While the monorepo infrastructure is greenfield, there is an existing Next.js 16 application that must be integrated into the monorepo structure.

**Monorepo Structure:**

```
apps/
  web/              # EXISTING Next.js 16 app (needs integration)
packages/
  database/         # NEW @compilothq/database
  ui/              # NEW @compilothq/ui
  validation/      # NEW @compilothq/validation
```

**Integration Requirements:**

- The existing `apps/web` Next.js app must be configured as a workspace package
- `apps/web/package.json` needs workspace dependencies added:
  - `@compilothq/database`
  - `@compilothq/ui`
  - `@compilothq/validation`
- `apps/web/next.config.js` must be configured to transpile the workspace packages using `transpilePackages` option
- The Next.js app should be able to import and use all three packages immediately after setup

### Existing Code to Reference

The existing Next.js 16 app at `apps/web` will consume the new packages. No similar infrastructure exists - this is the initial monorepo setup.

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

Not applicable - infrastructure setup does not require visual mockups.

## Requirements Summary

### Functional Requirements

- Create pnpm workspace-based monorepo structure with:
  - `apps/web/` - Existing Next.js 16 app (integrate as workspace package)
  - `packages/database/` - New Prisma package
  - `packages/ui/` - New component library package
  - `packages/validation/` - New Zod schemas package

- Set up @compilothq/database package with:
  - Prisma ORM configuration
  - Singleton Prisma Client pattern
  - Monolithic schema.prisma with comment sections
  - Minimal placeholder model for validation
  - Migration scripts (db:migrate, db:push, db:studio, db:seed)
  - DATABASE_URL environment variable configuration
  - .env.example file
  - Proper exports for consumption by Next.js app

- Set up @compilothq/ui package with:
  - shadcn/ui component exports (Button, Input, Card)
  - Utility functions (cn)
  - Theme configuration (Tailwind config/tokens)
  - NO Zod schemas (separate package)
  - Proper TypeScript and bundling for Next.js consumption

- Set up @compilothq/validation package for Zod schemas with:
  - Proper exports for use in Next.js app and other packages

- Integrate existing Next.js app (apps/web):
  - Update package.json with workspace dependencies
  - Configure next.config.js with transpilePackages for workspace packages
  - Ensure app can import from @compilothq/database, @compilothq/ui, @compilothq/validation

- Configure TypeScript with:
  - Root-level tsconfig.base.json (strict mode)
  - Package-level configs extending base
  - Project references for incremental builds
  - Individual dist/ folders per package
  - Next.js app tsconfig includes workspace packages

- Configure development tooling at root:
  - ESLint
  - Prettier
  - Husky (git hooks)

- Create migration workflow scripts at both:
  - Root level (convenience wrappers)
  - Package level (direct execution)

### Reusability Opportunities

The existing Next.js 16 app at `apps/web` will be the primary consumer of all three packages. Any existing components, utilities, or schemas in the Next.js app may eventually be migrated to the appropriate workspace packages in future roadmap items.

### Scope Boundaries

**In Scope:**

- Monorepo folder structure with pnpm workspaces (apps/ and packages/)
- Integration of existing Next.js app as workspace package at apps/web
- Updating apps/web/package.json with workspace dependencies
- Configuring apps/web/next.config.js for package transpilation
- packages/database with Prisma setup and singleton pattern
- packages/ui with component library structure
- packages/validation for Zod schemas
- TypeScript configuration with project references across all packages
- Root-level development tooling (ESLint, Prettier, Husky)
- Migration script convenience wrappers at root
- .env.example for database configuration
- Minimal placeholder Prisma model for validation
- Basic package.json scripts at root and package levels
- Verification that Next.js app can import and use all workspace packages

**Out of Scope:**

- Migrating existing Next.js code to workspace packages (future work)
- Actual Prisma models (roadmap item #3)
- Authentication/NextAuth.js setup
- Docker Compose configuration
- Actual tRPC routers (structure only)
- Deployment configurations
- CI/CD pipelines (GitHub Actions)
- Documentation site
- Vitest testing setup (roadmap item #11)
- Database seeding logic (roadmap item #3)

### Technical Considerations

- Using pnpm for workspace management (faster, more efficient than npm/yarn)
- Prisma Client singleton to prevent connection pooling issues
- TypeScript project references for fast incremental builds
- Scoped package naming (@compilothq/\*) for clear ownership
- Monolithic schema initially (split only if >2000 lines or team growth)
- Migration scripts at both root and package level for developer flexibility
- Strict TypeScript mode enforced via base config
- Development tooling centralized at root to avoid config duplication
- DATABASE_URL from environment variables for flexibility across environments
- Placeholder model ensures Prisma setup can be validated immediately
- Documented lessons in briefing.md will inform future data modeling (roadmap item #3)
- **Next.js 16 specific**: Must use `transpilePackages` in next.config.js to transpile workspace packages
- **Next.js 16 specific**: Workspace packages must be properly built/exported for Next.js consumption
- **Workspace integration**: apps/web must be able to hot-reload when workspace packages change during development
- **Package exports**: Each package must have proper "exports" field in package.json for Next.js module resolution
