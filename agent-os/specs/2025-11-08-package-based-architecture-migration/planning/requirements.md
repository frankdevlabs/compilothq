# Spec Requirements: Package-Based Architecture Migration

## Initial Description

Extract existing app logic into reusable packages: specifically migrate UI components and utilities to @compilothq/ui, move database connection and helpers to @compilothq/database, extract validation schemas to @compilothq/validation, update all imports in web app to use packages, configure hot-reloading across packages, and validate development workflow works end-to-end. Validate which other logic can be moved into new packages.

**Priority:** Medium (M)
**Source:** Product roadmap feature request
**Date Initiated:** 2025-11-08

## Requirements Discussion

### First Round Questions

**Q1:** I assume we should create the packages directory at the root level (parallel to apps/) following the standard turborepo monorepo structure. Is that correct?
**Answer:** Yes, packages/ at root level parallel to apps/

**Q2:** For the @compilothq/ui package, I'm thinking we should set it up with its own package.json, tsconfig.json, and components.json (for shadcn) to make it self-contained. Should we also migrate the existing shadcn/ui components from apps/web/src/components/ui/ into this package?
**Answer:** Yes - self-contained package with package.json, tsconfig.json. Question about components.json is a follow-up (see below).

**Q3:** For @compilothq/database, I assume this should include the Prisma client configuration, schema file, and any database utility functions. Should we also migrate the database connection singleton and any existing DAL (Data Access Layer) functions?
**Answer:** Yes - Include Prisma client config, schema, utilities, connection singleton, and DAL functions.

**Q4:** For @compilothq/validation, should we extract all Zod schemas used across the application, or start with a subset? I'm thinking we should include form validation schemas, API input/output schemas, and environment variable validation.
**Answer:** Start with what exists now (environment config validation and domain types). Extract more validation as needed when building features.

**Q5:** For hot-reloading configuration, I assume we need to set up proper TypeScript project references and ensure Next.js's Fast Refresh works when editing package code. Should we also configure Turbopack to watch package dependencies?
**Answer:** Yes - TypeScript project references + Fast Refresh for packages. Turbopack is default in Next.js 16, so configure it to watch package dependencies.

**Q6:** I'm thinking we should update the root-level tsconfig.json and turbo.json to properly reference the new packages. Should we also update any existing documentation or READMEs to reflect the new import patterns?
**Answer:** Yes - Update root tsconfig.json and turbo.json. Documentation update is a follow-up (see below).

**Q7:** For the development workflow validation, should we create a testing checklist that includes: pnpm dev starts successfully, hot-reload works, all imports resolve, pnpm build succeeds, and the application runs without errors?
**Answer:** Yes - Manual testing checklist. Full details provided in follow-up (see below).

**Q8:** Are there any existing features or logic beyond UI components, database, and validation that we should identify for future package extraction (like hooks, utilities, email templates, API clients, etc.)? What should we specifically skip for now vs. plan to extract?
**Answer:** Detailed in follow-up answers (see below).

### Existing Code to Reference

**Similar Features Identified:**

- No existing package-based architecture to reference
- This is establishing the foundational monorepo structure for the first time
- Current codebase structure is a single Next.js app at apps/web/

**Current Code Structure to Extract:**
Based on user responses, the following code exists and should be analyzed for extraction:

1. **UI Components** (apps/web/src/components/)
   - shadcn/ui components in ui/ subdirectory
   - Existing components throughout the component tree

2. **Database Layer** (apps/web/src/)
   - Prisma schema and client configuration
   - Database connection singleton
   - DAL (Data Access Layer) functions

3. **Validation Schemas** (apps/web/src/)
   - apps/web/src/lib/config.ts - Zod environment validation
   - apps/web/src/types/models.ts - Domain type definitions

**Code NOT to Extract (Skip for Now):**

- **tRPC/API**: Foundation exists (5 router files) but they're empty. Keep in web app until routers have actual procedures implemented.
- **React Hooks**: Don't exist yet. Will create @compilothq/hooks package later when needed.
- **Email Templates**: Not implemented yet. Will create @compilothq/email package when email functionality is added.

### Follow-up Questions

**Follow-up 1:** For shadcn's components.json configuration, should we: (A) Keep components.json in apps/web/ and configure paths to point to packages/ui/, or (B) Move/create components.json inside packages/ui/ for future shadcn installations?
**Answer:** Create NEW components.json inside packages/ui/ with paths pointing to that package structure. This keeps the UI package self-contained and makes future shadcn installations go directly to the package.

**Follow-up 2:** You mentioned identifying other logic for future packages. Can you clarify which of these exist now and should be extracted versus which don't exist yet:

- tRPC routers and API logic → @compilothq/api?
- React hooks → @compilothq/hooks?
- Email templates → @compilothq/email?
- Shared types/validation beyond what's in validation?

**Answer:**

- **tRPC/API**: YES - Foundation exists but empty (5 router files). Skip extraction now - keep in web app until routers have actual procedures.
- **React Hooks**: NO - Don't exist yet. Skip - create package later when needed.
- **Email Templates**: NO - Not implemented. Skip - create package when email functionality added.
- **Types/Validation**: YES - Some exist:
  - apps/web/src/lib/config.ts has Zod environment validation
  - apps/web/src/types/models.ts has placeholder domain types
  - Extract now to @compilothq/validation

**Follow-up 3:** For documentation updates, should we:

- Update any existing READMEs with new import patterns?
- Create a packages/README.md explaining the monorepo structure?
- Add migration notes showing old vs. new import patterns?
- Update developer onboarding docs if they exist?

**Answer:** YES - Update documentation:

- Update any existing READMEs with new import patterns
- Create/update packages/README.md explaining monorepo structure
- Add migration notes showing old vs. new import patterns
- Update developer onboarding if it exists

**Follow-up 4:** For workflow validation, what level of testing is expected? Should we:

- Just manual testing with the checklist?
- Add automated tests to verify package imports?
- Set up CI checks for package builds?

**Answer:** Manual testing only for this infrastructure item. Automated tests come later (roadmap item #11).

Test checklist:

- pnpm dev starts successfully
- Hot-reload works when editing package code
- All imports resolve (no TypeScript errors)
- pnpm build succeeds
- Pages navigate without errors
- UI components render correctly

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

Not applicable - this is an architectural refactoring without UI changes.

## Requirements Summary

### Functional Requirements

**Package Creation:**

- Create packages/ directory at root level (parallel to apps/)
- Create @compilothq/ui package with:
  - package.json
  - tsconfig.json
  - NEW components.json (self-contained configuration)
  - Migrated shadcn/ui components from apps/web/src/components/ui/
  - Exported UI components for consumption by web app

- Create @compilothq/database package with:
  - package.json
  - tsconfig.json
  - Prisma schema
  - Prisma client configuration
  - Database connection singleton
  - DAL (Data Access Layer) functions

- Create @compilothq/validation package with:
  - package.json
  - tsconfig.json
  - Environment config validation (from apps/web/src/lib/config.ts)
  - Domain type definitions (from apps/web/src/types/models.ts)
  - Exported Zod schemas

**Import Migration:**

- Update all imports in apps/web/ to use new package imports:
  - UI: `import { Button } from '@compilothq/ui'`
  - Database: `import { prisma } from '@compilothq/database'`
  - Validation: `import { envSchema } from '@compilothq/validation'`
- Remove old import paths from apps/web/

**Configuration Updates:**

- Update root-level tsconfig.json with TypeScript project references
- Update turbo.json to include new packages in build pipeline
- Configure Turbopack to watch package dependencies for hot-reload
- Configure Next.js Fast Refresh to work with package changes

**Documentation:**

- Update existing READMEs with new import patterns
- Create/update packages/README.md explaining monorepo structure
- Add migration notes documenting old vs. new import patterns
- Update developer onboarding documentation if it exists

**Workflow Validation:**

- Manual testing checklist:
  - pnpm dev starts successfully
  - Hot-reload works when editing package code
  - All imports resolve (no TypeScript errors)
  - pnpm build succeeds
  - Pages navigate without errors
  - UI components render correctly

### Reusability Opportunities

**Not Applicable** - This spec is establishing the foundational architecture that enables future reusability.

**Future Package Opportunities Identified (Not Part of This Spec):**

- @compilothq/api - Extract tRPC routers when they contain actual procedures
- @compilothq/hooks - Create when React hooks are implemented
- @compilothq/email - Create when email functionality is added
- @compilothq/utils - Consider if shared utility functions accumulate

### Scope Boundaries

**In Scope:**

- Create packages/ directory structure
- Create and configure @compilothq/ui package
- Migrate existing UI components from apps/web/ to @compilothq/ui
- Create and configure @compilothq/database package
- Migrate Prisma schema, client, connection, and DAL functions to @compilothq/database
- Create and configure @compilothq/validation package
- Extract existing environment validation and domain types to @compilothq/validation
- Update all imports in apps/web/ to use new packages
- Configure TypeScript project references
- Configure Turbopack for hot-reload across packages
- Update turbo.json build configuration
- Update documentation with new patterns
- Manual testing validation of development workflow

**Out of Scope:**

- tRPC router extraction (empty routers - wait until they have procedures)
- React hooks package creation (hooks don't exist yet)
- Email templates package creation (email functionality not implemented)
- Automated testing of package architecture (comes later in roadmap item #11)
- CI/CD configuration changes (handled separately)
- Additional utility packages beyond the three specified
- Migration of business logic or feature code (only infrastructure/shared code)

### Technical Considerations

**Monorepo Structure:**

- Following standard Turborepo monorepo patterns
- Root-level packages/ directory parallel to apps/
- Each package is self-contained with its own configuration

**Build System:**

- Turborepo orchestration with turbo.json
- Turbopack is default in Next.js 16 - must configure for package watching
- TypeScript project references for proper dependency resolution

**Development Experience:**

- Hot-reload must work when editing package code (critical for DX)
- Fast Refresh must trigger on package changes
- TypeScript must resolve package imports without errors
- pnpm workspaces for dependency management

**Package Configuration:**

- Each package needs package.json with proper exports
- Each package needs tsconfig.json with appropriate settings
- @compilothq/ui needs its own components.json for shadcn tooling

**Import Patterns:**

- Scoped package names: @compilothq/\*
- Named exports preferred for tree-shaking
- Clear public API surface for each package

**Existing Codebase:**

- apps/web/ is the only app currently
- 5 empty tRPC router files exist (keep in web app for now)
- Environment validation exists in apps/web/src/lib/config.ts
- Domain types exist in apps/web/src/types/models.ts
- shadcn/ui components exist in apps/web/src/components/ui/

**Technology Stack Integration:**

- Next.js 16 with App Router
- Turbopack default for dev and production
- pnpm package manager
- TypeScript strict mode
- Prisma ORM
- shadcn/ui component library

**Testing Approach:**

- Manual testing for this infrastructure change
- Automated tests deferred to roadmap item #11
- Focus on development workflow validation
- Ensure all existing functionality continues to work
