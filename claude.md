# Project Context

## Tech Stack

### Framework & Runtime

- Next.js 16 (App Router): https://nextjs.org/blog/next-16
- Node.js 24.11.0 (runtime)
- TypeScript 5.x (strict mode)

### Frontend

- React 19 (UI framework)
- shadcn/ui + Radix UI (component library)
- Tailwind CSS 4 (styling)
- TipTap (rich text editor)
- React Hook Form + Zod (forms & validation)
- Zustand (state management)
- TanStack Query (data fetching)
- React Flow (visualization & diagrams)
- TanStack Table (tables & data grids)

### Backend & API

- tRPC v11 (end-to-end type-safe API)
- Prisma ORM (database access)
- Zod (runtime validation)

### Database

- PostgreSQL 17 (primary database)
- Redis (caching & job queues)

### Document Generation

- Docxtemplater (Word documents)
- Puppeteer (PDF generation)

### File Storage

- S3-Compatible storage (MinIO dev / S3 or R2 prod)

### Authentication

- NextAuth.js v5 (Auth.js)

### Background Jobs

- BullMQ (job queue)

### Email

- Resend (email API)
- React Email (email templates)

### Development Tools

- Vitest (unit testing)
- Playwright (E2E testing)
- Storybook (component development)
- ESLint + Prettier (code quality)
- Husky (git hooks)
- pnpm (package management)
- Docker Compose (local services)

### Monitoring & Observability

- Sentry (error tracking)
- PostHog (analytics & feature flags)
- Axiom or Logflare (logging)

### Deployment

- Vercel (hosting)
- GitHub Actions (CI/CD)

## Project Structure

This is a **pnpm monorepo** with the following organization:

```
compilothq/
├── apps/
│   └── web/                          # Main Next.js 16 application
│       ├── src/
│       │   ├── app/                  # Next.js App Router
│       │   │   ├── (marketing)/      # Marketing pages (features, pricing)
│       │   │   ├── (public)/         # Public auth pages (login, signup)
│       │   │   ├── (auth)/           # Protected pages
│       │   │   │   ├── dashboard/
│       │   │   │   ├── questionnaires/
│       │   │   │   ├── activities/
│       │   │   │   ├── documents/
│       │   │   │   ├── settings/
│       │   │   │   └── components/   # Shared auth layout components
│       │   │   └── api/
│       │   │       └── trpc/         # tRPC API endpoint
│       │   ├── components/           # Shared React components
│       │   │   ├── ui/              # UI components
│       │   │   └── navigation/      # Navigation components
│       │   ├── server/              # Server-side code
│       │   │   └── routers/         # tRPC routers
│       │   ├── lib/                 # Utility functions
│       │   │   └── trpc/            # tRPC client setup
│       │   └── types/               # TypeScript type definitions
│       ├── public/                  # Static assets
│       └── package.json
│
├── packages/
│   ├── database/                    # @compilothq/database
│   │   ├── prisma/
│   │   │   └── schema.prisma       # Prisma schema definition
│   │   ├── src/
│   │   │   └── index.ts            # Database client & DAL exports
│   │   └── package.json
│   │
│   ├── ui/                          # @compilothq/ui
│   │   ├── src/
│   │   │   ├── components/         # Shared UI components (shadcn/ui)
│   │   │   └── lib/                # UI utilities
│   │   └── package.json
│   │
│   └── validation/                  # @compilothq/validation
│       ├── src/
│       │   └── schemas/            # Zod validation schemas
│       └── package.json
|
├── .husky/                          # Git hooks
│
├── pnpm-workspace.yaml             # Workspace configuration
├── tsconfig.base.json              # Shared TypeScript config
├── eslint.config.mjs               # ESLint configuration
├── .prettierrc                     # Prettier configuration
└── package.json                    # Root package.json

```

### Key Architectural Decisions

1. **Monorepo Strategy**: Using pnpm workspaces for code sharing and dependency management
2. **Route Groups**: Next.js route groups `(marketing)`, `(public)`, `(auth)` organize pages without affecting URLs
3. **Shared Packages**: Common code extracted to `@compilothq/*` packages for reusability
4. **DAL Pattern**: All database access goes through Data Access Layer functions in `@compilothq/database`
5. **Type Safety**: End-to-end type safety via tRPC and shared validation schemas

## Next.js 16 Specific Guidance

### Critical Breaking Changes

1. **Use `proxy.ts` instead of `middleware.ts`**
   - Middleware has been renamed to proxy.ts
   - Export function must be named `proxy` instead of `middleware`
   - Runs on Node.js runtime with clearer network boundary semantics
   - Example: `export async function proxy(request: NextRequest) { ... }`

2. **Async Request APIs (REQUIRED)**
   - Route params: `const { id } = await params` (NOT synchronous)
   - Search params: `const searchParams = await params` (NOT synchronous)
   - Cookies: `const cookieStore = await cookies()`
   - Headers: `const headersList = await headers()`
   - Draft mode: `const draft = await draftMode()`

3. **Turbopack is Default**
   - Development and production builds use Turbopack by default
   - Opt-out with `next build --webpack` if needed
   - Expect 2-5x faster production builds

### New Caching Model

- Use `"use cache"` directive for opt-in caching (replaces automatic caching)
- `revalidateTag(tag, cacheLife)` now requires cacheLife profile parameter
- `updateTag(tag)` for read-your-writes semantics in Server Actions
- `refresh()` refreshes only uncached data

### React 19 Features Available

- View Transitions for animated element updates
- `useEffectEvent()` for non-reactive logic extraction
- Activity component for background rendering

## Development Standards

### Code Style

1. Use TypeScript strict mode
2. Prefer Server Components by default
3. Add 'use client' only when needed
4. Keep components under 200 lines
5. Extract complex logic to custom hooks

### Security Rules (NON-NEGOTIABLE)

1. All database access MUST go through DAL functions
2. All user inputs MUST be validated with Zod
3. Never commit secrets - use .env with .gitignore
4. Never include sensitive data in logs
5. Implement rate limiting on auth endpoints

### Testing Requirements

1. 80% minimum code coverage
2. Unit tests for all business logic
3. Integration tests for API routes
4. E2E tests for critical user flows

### Git Workflow

- Branch naming: `feature/`, `bugfix/`, `refactor/`
- Commit messages: Conventional Commits format
- All PRs require passing tests + human review

### Linting issues, first try/advice this:

- Press Cmd+Shift+P → type "TypeScript: Restart TS Server" → Enter

## Design System

Compilo has a minimal, cohesive design aesthetic enforced through a comprehensive design system.

### Core Principles

1. **Minimal Aesthetic**: Navy/cream color palette inspired by franksblog.nl
2. **OKLCH Color Format**: Perceptual color space for superior dark mode and gradients
3. **8px Grid System**: Spacing foundation (8, 16, 24, 32, 48, 64, 96px)
4. **shadcn/ui Foundation**: All components extend shadcn/ui base components
5. **WCAG 2.1 AA Compliance**: Mandatory accessibility standard

### Design System Location

**Source of Truth**: `docs/DESIGN_SYSTEM.md` (600+ line comprehensive document)

This single file contains:

- Complete color system (OKLCH tokens with light/dark mode mappings)
- Typography system (Ubuntu/Raleway fonts, type scale)
- Spacing system (8px grid with Tailwind class mappings)
- Component specifications (shadcn/ui patterns)
- Accessibility requirements (WCAG 2.1 AA)
- Implementation guide with examples

**Token Reference**: `docs/design-tokens/*.json` (documentation only, not implementation)

- `color.json` - Navy/cream palette documentation
- `typography.json` - Font families and type scale
- `spacing.json` - 8px grid system reference
- `effects.json` - Border radius, shadows, transitions

**Implementation**: `apps/web/src/app/globals.css`

- CSS variables in OKLCH format
- Light and dark mode mappings
- Tailwind v4 @theme inline declarations

### Design System Rules (NON-NEGOTIABLE)

**Colors**:

- ✅ ONLY use semantic tokens: `bg-primary`, `text-foreground`, `border-border`
- ❌ NEVER hardcode colors: `bg-[#09192B]`, `bg-[oklch(0.205_0_0)]`, `style={{ color: '#09192B' }}`

**Spacing**:

- ✅ ONLY use Tailwind scale: `p-2`, `p-4`, `p-6`, `p-8`, `p-12`, `p-16`, `p-24` (8px increments preferred)
- ❌ NEVER arbitrary values: `p-[13px]`, `gap-[22px]`

**Typography**:

- ✅ ONLY use type scale: `text-sm`, `text-base`, `text-xl`, `text-2xl`, `text-3xl`
- ❌ NEVER arbitrary sizes: `text-[17px]`, `text-[28px]`

**Components**:

- ✅ EXTEND shadcn/ui components from `@compilothq/ui` or `@/components/ui/*`
- ❌ NEVER rebuild components from scratch when shadcn/ui has a base

**Accessibility**:

- ✅ Semantic HTML (button not div with onClick)
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus indicators (`focus-visible:ring-2 focus-visible:ring-ring`)
- ✅ ARIA labels on icon-only buttons
- ✅ Color contrast minimum 4.5:1

### Design System Workflow

**When building any UI component:**

1. **Read the design system**: `docs/DESIGN_SYSTEM.md` (ALWAYS before implementing)
2. **Check shadcn/ui**: Does a base component exist? Use it.
3. **Apply design tokens**: Only semantic tokens, never hardcoded values
4. **Validate accessibility**: WCAG 2.1 AA compliance required
5. **Use design agents**: `@ui-builder` for building, `@design-guardian` for validation

### Design System Agents

**@ui-builder** (`.claude/agents/ui-builder.md`):

- **Purpose**: Proactively builds components correctly from the start
- **When to use**: Creating new UI components or implementing visual features
- **Process**:
  1. Reads `docs/DESIGN_SYSTEM.md`
  2. Checks for shadcn/ui base component
  3. Implements with design tokens exclusively
  4. Ensures WCAG 2.1 AA compliance
  5. Provides complete documentation

**@design-guardian** (`.claude/agents/design-guardian.md`):

- **Purpose**: Reactively validates design system compliance
- **When to use**: Code reviews, pre-commit validation, codebase audits
- **Process**:
  1. Scans for violations (hardcoded colors, arbitrary spacing, accessibility issues)
  2. Generates detailed violation reports with specific fixes
  3. Categorizes by severity (Critical/High/Medium/Low)
  4. Offers automated remediation
  5. Creates pre-commit hooks to prevent future violations

### Design System Skill

**compilo-design** (`.claude/skills/compilo-design/SKILL.md`):

- Lightweight enforcement skill inherited by all UI-related agents
- Contains quick reference for common patterns
- References `docs/DESIGN_SYSTEM.md` for detailed specifications
- Provides violation remediation templates

### Integration with Agent Patterns

**For UI-Heavy Features:**

1. **implementer** coordinates full-stack work
2. **@ui-builder** handles UI component creation using design system
3. **@design-guardian** validates compliance before merge

**For Complex Components:**

1. **@ui-builder** reads design system and builds component correctly
2. Component automatically follows design tokens, accessibility standards
3. **@design-guardian** audits as part of PR review

**For Design Violations:**

1. **@design-guardian** detects violations (manual audit or pre-commit)
2. Provides specific remediation (before/after code examples)
3. Offers to auto-fix or educate developer

### Quick Reference

**Most Common Tokens**:

```tsx
// Colors
<div className="bg-background text-foreground">           // Page background
<Card className="bg-card text-card-foreground">           // Card background
<Button className="bg-primary text-primary-foreground">   // Primary action
<p className="text-muted-foreground">                     // Secondary text

// Spacing (8px grid: p-2=8px, p-4=16px, p-6=24px, p-8=32px)
<div className="p-6">                                      // 24px padding (default card)
<div className="space-y-4">                                // 16px vertical spacing
<div className="gap-6">                                    // 24px grid gap

// Typography
<h1 className="text-3xl font-bold">                       // 30px heading
<p className="text-base leading-relaxed">                  // 16px body text
<span className="text-sm text-muted-foreground">          // 14px metadata

// Accessibility
<button className="focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close">
  <XIcon />
</button>
```

### Validation Scripts

Pre-commit hooks automatically check for design system violations:

- Hardcoded colors (hex, rgb, hsl, oklch values)
- Arbitrary spacing values
- Non-semantic interactive elements

Run manual validation:

```bash
pnpm run validate:design  # Check all files for violations
```

### Agent Usage Guidelines

This project uses specialized Claude Code agents for specific types of work. Understanding when to use each agent ensures optimal code quality and adherence to architectural boundaries.

#### When to Use api-engineer

The **api-engineer** agent is a specialist for complex API architecture and backend logic. Invoke this agent for:

- **Complex tRPC router architecture** - Designing hierarchical router structures, implementing advanced patterns, organizing large API surfaces
- **Advanced authentication/authorization** - Creating reusable auth middleware, role-based access control, session management, security hardening
- **Multi-service business logic** - Orchestrating multiple services, implementing complex workflows, transaction coordination
- **API performance optimization** - Request batching, caching strategies, query optimization at the API layer
- **Rate limiting & security** - Implementing rate limiters, request throttling, API security best practices
- **Complex Server Actions** - Server Actions involving multiple data operations, complex validation, or business rules
- **API refactoring** - Restructuring routers, improving API patterns, architectural changes to the API layer

#### When to Use implementer (Default)

The **implementer** agent is your default full-stack generalist. Use for:

- **Simple CRUD endpoints** - Standard create/read/update/delete operations following existing patterns
- **Standard API features** - Straightforward API implementations that match established conventions
- **Full-stack features** - Features spanning database + API + UI layers that need coordinated changes
- **Rapid prototyping** - Building MVPs or prototypes quickly across multiple layers
- **Low API complexity** - Features where the API layer is straightforward and not the main complexity

#### Agent Coordination Pattern

**For Complex Features:**

1. **database-engineer** creates Prisma schema, migrations, and DAL functions
2. **api-engineer** builds tRPC routers and business logic using DAL functions
3. **ui-designer** creates UI components consuming the API

**For Simple Features:**

1. **implementer** handles all layers following existing patterns
2. Creates DAL functions for simple CRUD operations
3. Implements tRPC procedures and UI components

**Critical Rule:** api-engineer MUST use DAL functions from database-engineer. Never write direct Prisma queries in API code.

#### Choosing the Right Agent

Ask yourself:

- **Is the API layer complex or novel?** → api-engineer
- **Is this following an established pattern?** → implementer
- **Does it span multiple architectural layers?** → implementer
- **Is the challenge primarily in the API design?** → api-engineer
- **Is it a simple CRUD feature?** → implementer

## Instructions for Claude

1. Prefer small, focused diffs (under 200 lines)
2. Explain complex logic with comments
3. Ask when requirements are unclear
4. Update tests whenever you change code
5. Never modify files outside the current feature scope
