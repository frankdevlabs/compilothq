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

### Development Authentication for Testing

When testing or validating authenticated features, use the development authentication system to bypass manual login flows:

```bash
# Generate session for browser testing
pnpm dev:login --persona=DPO

# Get session token for API testing
pnpm dev:login --persona=DPO --format=token

# Use in Playwright E2E tests
import { setAuthCookie } from './__tests__/e2e/helpers/dev-auth'
await setAuthCookie(page, 'DPO')
```

**Available personas**: DPO, PRIVACY_OFFICER, BUSINESS_OWNER, IT_ADMIN, SECURITY_TEAM, LEGAL_TEAM

**Use cases**:

- Browser testing during development (copy cookie to DevTools)
- Playwright E2E tests (use `setAuthCookie` helper)
- Manual API testing with Postman/curl
- Claude Code validation of protected features (screenshots)

**Documentation**: See [docs/development-authentication.md](./docs/development-authentication.md) for complete usage guide.

### Git Workflow

- Branch naming: `feature/`, `bugfix/`, `refactor/`
- Commit messages: Conventional Commits format
- All PRs require passing tests + human review

### Linting issues, first try/advice this:

- Press Cmd+Shift+P → type "TypeScript: Restart TS Server" → Enter

## Instructions for Claude

1. Prefer small, focused diffs (under 200 lines)
2. Explain complex logic with comments
3. Ask when requirements are unclear
4. Update tests whenever you change code
5. Never modify files outside the current feature scope
