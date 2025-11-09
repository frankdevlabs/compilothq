# Specification: Package-Based Architecture Migration

## Goal

Establish a package-based monorepo architecture for the Compilot HQ codebase to enable code reusability, better separation of concerns, and improved maintainability across the application. This migration extracts existing UI components, database logic, and validation schemas into shared workspace packages.

## User Stories

- As a developer, I want UI components in a shared package so that I can reuse them consistently across multiple apps without duplication
- As a developer, I want database access centralized in one package so that connection pooling and Prisma client management are handled correctly in serverless environments
- As a developer, I want validation schemas in a shared package so that I can ensure consistent validation logic across client and server

## Specific Requirements

**Create @compilothq/database Package**

- Extract Prisma schema from apps/web to packages/database/prisma/schema.prisma
- Implement singleton Prisma Client pattern to prevent multiple instances during Next.js hot reload
- Configure package.json with proper exports for the Prisma client instance
- Add scripts for database operations: generate, migrate, push, studio, seed
- Include TypeScript compilation with watch mode for development
- Export prisma client instance as default export from packages/database/src/index.ts
- Ensure proper connection pooling configuration for serverless environments

**Create @compilothq/ui Package**

- Migrate all shadcn/ui components from apps/web/src/components/ui/ to packages/ui/src/components/
- Include: Button, Card, Checkbox, Dialog, Input, Label, NavigationMenu, Select, Separator, Sheet, Switch
- Export all UI components from packages/ui/src/index.ts with named exports
- Include cn utility function for Tailwind class merging (clsx + tailwind-merge)
- Configure package.json with peer dependencies for React 19
- Set up TypeScript compilation with proper type definitions
- Support dark mode and accessibility features from Radix UI
- Include styles.css export path in package.json exports field

**Create @compilothq/validation Package**

- Extract environment config validation from apps/web/src/lib/config.ts to packages/validation/src/config.ts
- Extract domain types from apps/web/src/types/models.ts to packages/validation/src/types/
- Create organized schema structure with src/schemas/ subdirectories for auth/, data/, compliance/
- Export all schemas and types from packages/validation/src/index.ts
- Configure package with Zod dependency for runtime validation
- Set up TypeScript compilation to generate type definitions
- Support type inference from Zod schemas for TypeScript integration

**Configure TypeScript Project References**

- Update root tsconfig.json to include references to all three packages
- Configure each package with its own tsconfig.json extending tsconfig.base.json
- Enable composite mode for incremental builds
- Set up proper module resolution paths with workspace protocol
- Ensure TypeScript can resolve cross-package imports without errors

**Update Next.js Configuration for Package Transpilation**

- Add transpilePackages configuration to next.config.ts for all three packages
- Ensure Turbopack (default in Next.js 16) watches package changes for hot reload
- Configure Fast Refresh to trigger on package file modifications
- Maintain proper build order with TypeScript project references

**Migrate Import Paths in apps/web**

- Replace all relative imports to UI components with @compilothq/ui imports
- Replace all database client imports with @compilothq/database imports
- Replace all validation/config imports with @compilothq/validation imports
- Remove old source files from apps/web after successful migration
- Update all route handlers, server components, and client components with new import paths

**Configure pnpm Workspace**

- Maintain pnpm-workspace.yaml with apps/_ and packages/_ patterns
- Set up workspace protocol dependencies in apps/web/package.json
- Use workspace:\* version references for internal package dependencies
- Ensure pnpm install resolves workspace packages correctly

**Add Root-Level Database Scripts**

- Create db:generate script to run Prisma generate in database package
- Create db:migrate script to run Prisma migrations in database package
- Create db:push script to push schema without migrations
- Create db:studio script to open Prisma Studio
- Create db:seed script for database seeding
- Use pnpm filter commands to target @compilothq/database package

**Document Monorepo Structure and Patterns**

- Update root README.md with monorepo structure overview
- Create individual README.md files for each package explaining purpose and usage
- Document import patterns showing how to use each package
- Include development workflow guidance for working with packages
- Add examples of common development tasks (adding components, updating schemas, etc.)
- Document manual testing checklist for workflow validation

**Setup Hot Reload for Package Development**

- Configure TypeScript watch mode (tsc --watch) for each package via dev script
- Ensure Next.js detects changes in workspace packages through transpilePackages
- Verify Fast Refresh works when editing files in packages/database, packages/ui, packages/validation
- Test that pnpm dev in apps/web picks up changes without requiring manual rebuilds

## Visual Design

No visual assets provided - this is an architectural refactoring without UI changes.

## Existing Code to Leverage

**shadcn/ui Component Pattern**

- apps/web/src/components/ui/ contains 10+ shadcn components (Button, Card, Dialog, etc.)
- Components use Radix UI primitives with class-variance-authority for variants
- Each component follows pattern: React.forwardRef with typed props, cn() for className merging
- Reuse this exact pattern in @compilothq/ui package
- Maintain same component API to ensure no breaking changes when migrating imports

**Prisma Singleton Pattern in Next.js**

- Standard Next.js pattern for preventing multiple Prisma instances during hot reload
- Uses globalThis to cache client in development mode only
- Pattern: globalForPrisma.prisma || new PrismaClient(), then cache if NODE_ENV !== production
- Replicate this pattern in packages/database/src/index.ts
- Ensures connection pooling works correctly in serverless environments

**Zod Environment Validation Pattern**

- apps/web/src/lib/config.ts uses Zod schema for environment variable validation
- Pattern: define schema, safeParse process.env, throw on failure, export parsed data
- Includes transformation logic (string to boolean for feature flags)
- Export derived config objects (features, config) alongside raw env
- Maintain this exact validation pattern in @compilothq/validation package

**TypeScript Strict Mode Configuration**

- Existing codebase uses TypeScript strict mode with specific compiler options
- tsconfig.base.json contains shared configuration for all packages
- Each package tsconfig extends base and adds package-specific paths
- Leverage this established configuration pattern for new packages
- Ensure all packages maintain same strictness level for consistency

**pnpm Workspace Setup**

- pnpm-workspace.yaml already configured with apps/_ and packages/_ patterns
- Workspace protocol (workspace:\*) used for internal dependencies
- Filter commands (--filter) used to target specific packages in scripts
- Reuse this workspace configuration for new packages
- Follow established pattern for package.json structure across packages

## Out of Scope

- Extracting tRPC routers to @compilothq/api package (routers are empty stubs, wait until they contain actual procedures)
- Creating @compilothq/hooks package (no React hooks exist yet in the codebase)
- Creating @compilothq/email package (email functionality not yet implemented)
- Creating @compilothq/utils package (no general utilities beyond what's in @compilothq/ui)
- Automated testing of package architecture (deferred to future roadmap item)
- CI/CD pipeline configuration changes (handled separately from this architectural change)
- Migrating business logic or feature-specific code (only infrastructure/shared code belongs in packages)
- Creating additional packages beyond the three specified (database, ui, validation)
- Implementing new features or functionality (purely architectural refactoring)
- Performance optimization beyond basic hot reload setup (focus is on establishing architecture)
