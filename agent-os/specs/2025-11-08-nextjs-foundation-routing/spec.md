# Specification: Next.js Application Foundation & Routing Setup

## Goal

Establish the complete Next.js 16 application foundation with monorepo structure, Tailwind V4 configuration, route groups, navigation components, and environment setup to provide the application shell for all Compilo features.

## User Stories

- As a developer, I want a working Next.js 16 monorepo with proper workspace configuration so that I can build features in apps/web/ and share code via packages/
- As a user, I want to navigate between public marketing pages and authenticated compliance pages so that I can access the right features based on my context

## Specific Requirements

**Monorepo Structure Creation**

- Create root-level apps/ and packages/ directories following pnpm workspace convention
- Configure root package.json with pnpm workspaces array pointing to "apps/_" and "packages/_"
- Initialize Next.js 16 app in apps/web/ subdirectory (not project root)
- Set up workspace references enabling shared code import from packages/ (prepared for future database and ui packages)
- Use pnpm as package manager throughout with workspace protocol for internal dependencies

**Next.js 16 Critical Configuration**

- Use proxy.ts instead of middleware.ts (breaking change in Next.js 16)
- Export function named `proxy` not `middleware` from proxy.ts
- Implement async request APIs for params, cookies, headers following Next.js 16 requirements
- Configure Turbopack as default build tool (no webpack fallback needed)
- Set up TypeScript in strict mode with path aliases (@/components, @/lib, @/app mapped to apps/web/src/)

**Tailwind CSS V4 Setup (Critical - NO tailwind.config file)**

- Install @tailwindcss/postcss plugin version 4.x and tailwindcss version 4.1.16
- Create postcss.config.mjs with ONLY @tailwindcss/postcss plugin (exact pattern from my-analytics)
- Use @import "tailwindcss" directive in globals.css (replaces @tailwind directives)
- Implement all theme configuration using @theme inline directive in globals.css (NO separate tailwind.config.js/ts file)
- Adapt complete design system from my-analytics: CSS custom properties in :root and .dark selectors, color system with franksblog.nl aesthetic
- Include dashboard-optimized font scale (12px-36px) NOT blog scale, Ubuntu for headings and Raleway for body text
- Configure smooth 300ms theme transitions for background and color properties

**Route Group Structure**

- Create (auth)/ route group containing dashboard/, activities/, components/processors/, questionnaires/, documents/, settings/ pages
- Create (marketing)/ route group containing landing page.tsx, pricing/, features/ pages
- Create (public)/ route group containing login/ and signup/ pages
- Implement separate layout.tsx files for each route group with appropriate navigation components
- Configure route protection structure in proxy.ts (placeholder for future authentication in roadmap Item 16)

**Navigation Components for Authenticated Area**

- Build Sidebar component with navigation links to Dashboard, Processing Activities, Components (with sub-menu), Questionnaires, Documents (with sub-menu), Settings
- Build Top bar component with breadcrumb navigation showing current activity context, notifications icon (placeholder), search bar (placeholder), user menu (placeholder)
- Ensure responsive behavior with collapsible sidebar on mobile viewports
- Style with franksblog.nl aesthetic using accent color for active states

**Navigation Components for Public Area**

- Build Header component with simple horizontal navigation for marketing and public pages
- Include Login and Sign Up CTAs in header with accent color styling
- Add Features and Pricing links in navigation menu
- Implement mobile-responsive hamburger menu pattern

**Skeleton Pages Implementation**

- Create marketing landing page with hero section stating "Component-based compliance that generates documents" tagline
- Create dashboard page with empty state message and placeholder stats cards showing future metrics
- Create activities list page with empty table and "+ New Activity" button (non-functional)
- Create processors page under components/ with similar empty table structure
- Create login page with email input form (non-functional, UI only)

**Environment Variables and Configuration**

- Create .env.local.example with DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_APP_NAME, NEXT_PUBLIC_APP_URL
- Add feature flags: NEXT_PUBLIC_FEATURE_QUESTIONNAIRES, NEXT_PUBLIC_FEATURE_DOCUMENT_GENERATION, NEXT_PUBLIC_FEATURE_AI_ASSISTANCE
- Include placeholders for future variables: OPENAI_API_KEY, DOCUMENT_STORAGE_PATH, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- Add .env.local to .gitignore ensuring secrets never committed
- Create lib/config.ts with Zod validation schemas for all environment variables and centralized config object export

**shadcn/ui Phase 1 Components Installation**

- Install and configure shadcn/ui with components.json configuration file
- Add Phase 1 components: Button, Input, Label, Select, Checkbox, Switch, Dialog, Sheet, Card, Separator, Navigation Menu
- Configure components to use Tailwind V4 CSS variables for theming
- Place components in apps/web/src/components/ui/ directory following shadcn convention
- Ensure dark mode compatibility using next-themes integration

**tRPC v11 Foundation Setup**

- Install @trpc/server, @trpc/client, @trpc/react-query, @trpc/next packages
- Create apps/web/src/server/trpc.ts with tRPC context and base router initialization
- Set up empty routers for future use: activity, processor, dataCategory, risk, control (no procedures yet)
- Configure tRPC client in apps/web/src/lib/trpc.ts with TanStack Query integration
- Add tRPC provider to root layout wrapping application with QueryClient

**Type Definitions Structure**

- Create apps/web/src/types/ directory for shared TypeScript types
- Define placeholder types for future Prisma entities: ProcessingActivity, DataProcessor, PersonalDataCategory, Risk, Control
- Create index.ts barrel export for all type definitions
- Set up strict TypeScript configuration in tsconfig.json with paths mapping and strict mode enabled

## Visual Design

No visual files provided in planning/visuals/ directory. External references used:

**franksblog.nl (live reference) + my-analytics implementation**

- Light mode: Background FEFBF4 (cream), Foreground 09192B (dark navy), Accent D9BF65 (gold)
- Dark mode: Background 09192B (dark navy), Foreground FEFBF4 (cream), Accent D9BF65 (gold)
- Typography: Ubuntu 300/400/500/700 for headings, Raleway 300/400/700 for body text
- Dashboard font scale: 12px to 36px optimized for data-heavy interfaces
- Border radius: 4px default minimal aesthetic
- Shadows: Minimal values (sm through lg) maintaining elegant simplicity
- Transitions: 300ms ease for theme switching, 150ms for hover states
- Focus indicators: 2px solid accent with 2px offset for accessibility

## Existing Code to Leverage

**my-analytics Tailwind V4 Configuration**

- Exact postcss.config.mjs structure with @tailwindcss/postcss plugin configuration
- Complete globals.css with @import "tailwindcss" directive and @theme inline block
- Full design system with CSS custom properties in :root and .dark selectors
- shadcn/ui compatible color variables (card, popover, muted, destructive, input, ring)
- Chart color definitions for future data visualization components

**my-analytics Package Dependencies**

- @tailwindcss/postcss version 4, tailwindcss version 4.1.16 for Tailwind V4
- next version 16.0.0, react version 19.1.0 for latest framework features
- next-themes version 0.4.6 for dark mode implementation
- Radix UI component primitives for accessible shadcn/ui foundation
- next-auth version 5.0.0-beta.25 for future authentication setup

**Next.js 16 App Router Patterns from my-analytics**

- App directory structure with proper route organization
- Server Components as default with selective "use client" directives
- Async request APIs pattern for params, cookies, headers access
- Layout composition pattern with nested layouts per route group

**CLAUDE.md Development Standards**

- TypeScript strict mode configuration and path aliases setup
- Security rules: Environment variable handling, input validation with Zod, database access patterns
- Code style: Prefer Server Components, keep components under 200 lines, extract logic to custom hooks

**Product Context from mission.md and roadmap.md**

- Target users: Mid-market organizations (50-500 employees), privacy professionals, legal teams
- Core architecture: Component library leads to guided questionnaires leads to document generation
- Roadmap position: Item 1 provides shell for Item 2 (Prisma Infrastructure), then database schema, then API and authentication
- MVP goal: Component-based compliance enabling DPIA generation in hours instead of weeks

## Out of Scope

- Database package creation in packages/database/ (deferred to roadmap Item 2)
- Prisma schema implementation and migrations (deferred to roadmap Item 2)
- Prisma Client connection and database queries (deferred to roadmap Item 2)
- Functional authentication with NextAuth.js sessions and user model (deferred to roadmap Item 16)
- Actual CRUD operations on components, activities, or documents
- Database seeding scripts and reference data population
- Working tRPC procedures with database operations (only empty router structure)
- Form submission handlers and validation beyond UI shells
- Real navigation protection and authorization checks (only proxy.ts structure)
- Document generation logic and template system
- Questionnaire engine and conditional logic
- AI features, smart suggestions, or auto-risk detection
- Email notifications and background job processing
- File upload functionality and storage configuration
- Testing infrastructure including Vitest, Playwright, or Storybook
- CI/CD pipeline configuration and deployment setup
- Docker containerization and Docker Compose services
