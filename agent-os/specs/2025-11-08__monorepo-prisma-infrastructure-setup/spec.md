# Specification: Monorepo Prisma Infrastructure Setup

## Goal

Establish a pnpm workspace-based monorepo with three shared packages (@compilothq/database, @compilothq/ui, @compilothq/validation) that integrate seamlessly with the existing Next.js 16 app, providing type-safe database access, reusable UI components, and validation schemas.

## User Stories

- As a developer, I want to import Prisma Client from @compilothq/database so that I can access the database with type safety and avoid connection pooling issues
- As a developer, I want to import UI components from @compilothq/ui so that I can build consistent interfaces across the application without duplicating component code
- As a developer, I want to import Zod schemas from @compilothq/validation so that I can validate data consistently across client and server

## Specific Requirements

### Monorepo Workspace Structure

- pnpm-workspace.yaml already exists and correctly references apps/_ and packages/_
- Create packages/database/ directory with @compilothq/database package
- Create packages/ui/ directory with @compilothq/ui package
- Create packages/validation/ directory with @compilothq/validation package
- Existing apps/web/ Next.js 16 app remains in place and will consume all three packages
- All packages use scoped naming (@compilothq/\*) for clear ownership and namespace separation

### @compilothq/database Package Setup

- Initialize package.json with name "@compilothq/database", version "0.1.0", private: true
- Install Prisma as devDependency (@prisma/client as dependency)
- Create src/index.ts with singleton Prisma Client pattern to prevent connection pooling issues in Next.js
- Create prisma/schema.prisma with monolithic structure, organized by comment sections
- Include minimal placeholder model (e.g., User with id, email, createdAt) to validate setup works
- Configure DATABASE_URL environment variable support with postgresql connection string
- Create .env.example with DATABASE_URL template for local development
- Add package.json scripts: generate (prisma generate), migrate (prisma migrate dev), push (prisma db push), studio (prisma db studio), seed (prisma db seed - structure only)
- Configure package.json "exports" field to properly export src/index.ts for Next.js consumption
- Build configuration outputs to dist/ folder with TypeScript declaration files

### @compilothq/ui Package Setup

- Initialize package.json with name "@compilothq/ui", version "0.1.0", private: true
- Move Button, Input, and Card components from apps/web/src/components/ui/ to packages/ui/src/components/
- Create src/lib/utils.ts with cn utility function (clsx + tailwind-merge)
- Create src/lib/theme.ts to export Tailwind theme tokens and configuration
- Create src/index.ts that exports: Button, Input, Card from components; cn from lib/utils; all exports from lib/theme
- Install dependencies: React 19, Radix UI primitives, class-variance-authority, clsx, tailwind-merge
- Configure package.json "exports" field with proper module resolution for Next.js
- Include TypeScript build to dist/ with declaration files for type safety

### @compilothq/validation Package Setup

- Initialize package.json with name "@compilothq/validation", version "0.1.0", private: true
- Install Zod as dependency
- Create src/index.ts that exports all schemas (initially empty, ready for future schemas)
- Create src/schemas/ directory for organizing validation schemas by domain
- Configure package.json "exports" field for Next.js consumption
- TypeScript build outputs to dist/ with declaration files

### Next.js App Integration (apps/web)

- Update apps/web/package.json dependencies to include workspace packages: @compilothq/database, @compilothq/ui, @compilothq/validation (using "workspace:\*" protocol)
- Update apps/web/next.config.ts to add transpilePackages: ["@compilothq/database", "@compilothq/ui", "@compilothq/validation"]
- Update apps/web/tsconfig.json to reference workspace packages in paths for IDE support
- Remove duplicate UI components from apps/web/src/components/ui/ after migration to @compilothq/ui (Button, Input, Card)
- Update imports in existing Next.js files to use @compilothq/ui instead of local component imports
- Ensure hot module reload works when making changes to workspace packages during development

### TypeScript Configuration Hierarchy

- Create tsconfig.base.json at root with strict mode enabled, shared compiler options (target: ES2022, module: ESNext, moduleResolution: Bundler)
- Each package extends root tsconfig.base.json with package-specific overrides
- Configure TypeScript project references for incremental builds across packages
- Each package has individual dist/ output folder for compiled JavaScript and declaration files
- Root tsconfig.json references all package tsconfigs for workspace-wide type checking
- apps/web/tsconfig.json extends base and includes Next.js-specific configuration

### Development Tooling (Root Level)

- Create .eslintrc.json at root extending Next.js recommended config and TypeScript rules
- Create .prettierrc at root with project formatting standards (semi: false, singleQuote: true, tabWidth: 2, trailingComma: "es5")
- Create .prettierignore to exclude node_modules, dist, .next, coverage
- Initialize Husky in .husky/ with pre-commit hook running lint-staged
- Configure lint-staged to run ESLint and Prettier on staged files before commits
- Add root package.json scripts: lint (run ESLint), format (run Prettier), typecheck (TypeScript check across workspace)

### Database Migration Workflow Scripts

- Root package.json scripts for convenience: db:migrate, db:push, db:studio, db:seed (all delegate to packages/database)
- Root scripts use pnpm --filter @compilothq/database to run package-level scripts
- Package-level scripts in packages/database/package.json run Prisma CLI directly
- Ensure scripts work from both root directory and within packages/database directory
- Migration files stored in packages/database/prisma/migrations/

### Environment Configuration

- Root .env.example includes DATABASE_URL with postgresql://user:password@localhost:5432/compilothq template
- packages/database/.env.example mirrors root configuration
- .gitignore includes .env files to prevent committing secrets
- Document that DATABASE_URL must be set in local .env for Prisma to work

### Prisma Client Singleton Pattern

- Prevent multiple Prisma Client instances in development (Next.js hot reload issue)
- Use global object to store single instance across module reloads
- Export prisma instance from packages/database/src/index.ts as default export
- Include TypeScript declaration for global prisma property to satisfy type checker
- Pattern ensures connection pooling works correctly in serverless environments

## Visual Design

No visual assets provided (infrastructure setup).

## Existing Code to Leverage

### Existing Next.js 16 App Structure

- apps/web/package.json already scoped as "@compilothq/web" with Next.js 16.0.0, React 19, TypeScript 5
- Existing tsconfig.json has strict mode, path aliases (@/_, @/components/_, @/lib/_, @/app/_)
- next.config.ts exists with reactStrictMode enabled, ready for transpilePackages addition
- Use existing package versions as baseline for workspace packages

### Existing pnpm Workspace Configuration

- pnpm-workspace.yaml already configured with apps/_ and packages/_ patterns
- Root package.json already has packageManager: "pnpm@8.15.0" and engines requirements
- Existing filter scripts in root (pnpm --filter web dev/build/lint/test) show pattern to follow
- Replicate this pattern for database package scripts at root level

### Existing shadcn/ui Components

- apps/web/src/components/ui/ contains Button (button.tsx with CVA variants), Input, Card, and other components
- apps/web/src/lib/utils.ts contains cn utility using clsx + tailwind-merge
- Button component uses Radix Slot, class-variance-authority for variants, focus-visible states, dark mode support
- Copy these components to @compilothq/ui preserving exact implementation and dependencies
- After migration, update import paths in existing pages to use @compilothq/ui

### Existing tRPC Server Structure

- apps/web/src/server/trpc.ts shows tRPC initialization pattern with Context
- apps/web/src/server/routers/ contains multiple domain routers (activity, control, dataCategory, processor, risk)
- Existing pattern demonstrates separation of concerns by domain
- Future Prisma usage in tRPC routers will import from @compilothq/database
- Do not modify tRPC code in this spec, only ensure @compilothq/database is available for future use

### Root Package Configuration

- Root package.json uses pnpm --filter for running workspace scripts
- Follow this pattern for new db:\* scripts targeting @compilothq/database package
- Maintain consistency with existing script naming (dev, build, lint, test)
- Add new typecheck script at root for workspace-wide TypeScript validation

## Out of Scope

- Migrating existing Next.js pages, components, or business logic to workspace packages
- Defining actual Prisma data models beyond minimal placeholder (roadmap item 3)
- Setting up NextAuth.js or any authentication system
- Docker Compose configuration for local PostgreSQL
- Creating actual tRPC routers or modifying existing ones
- Deployment configuration for Vercel or other platforms
- CI/CD pipeline setup with GitHub Actions
- Creating documentation site or Storybook for components
- Vitest testing infrastructure (roadmap item 11)
- Implementing database seed scripts with actual data (roadmap item 3)
- Creating actual Zod validation schemas (to be defined per feature)
- Setting up monitoring, logging, or error tracking
