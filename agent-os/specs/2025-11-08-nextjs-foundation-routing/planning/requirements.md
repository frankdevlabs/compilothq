# Spec Requirements: Next.js Application Foundation & Routing Setup

## Initial Description

Set up Next.js 16 App Router with directory structure, TypeScript configuration, base layout with navigation, route groups for authenticated vs public pages, Tailwind CSS with shadcn/ui theme, environment variables, and configuration management to provide the application shell for all features.

## Requirements Discussion

### First Round Questions

**Q1: Project Location & Structure**
**Answer:** Monorepo structure:

```
compilothq/
├── apps/
│   └── web/                   # Next.js app
├── packages/
│   ├── database/              # Prisma schema (20+ models)
│   ├── ui/                    # Shared UI components
│   └── validation/            # Shared validation
└── agent-os/                  # Existing
```

**Note:** The monorepo structure (apps/, packages/) does not currently exist and will need to be created as part of this spec.

**Q2: Next.js Version**
**Answer:** Use Next.js 16 (as specified in tech stack)

**Q3: App Router Structure**
**Answer:** Detailed structure with (auth), (marketing), (public) route groups:

```typescript
app/
├── (auth)/                     # Authenticated area
│   ├── dashboard/
│   ├── activities/             # Processing Activities
│   │   └── [id]/
│   │       ├── overview/
│   │       ├── components/
│   │       ├── risks/
│   │       └── documents/
│   ├── components/             # Component Library
│   │   ├── processors/
│   │   ├── data-categories/
│   │   ├── data-assets/
│   │   └── risks/
│   ├── questionnaires/         # Questionnaire workflows
│   │   └── [responseId]/
│   ├── documents/              # Generated documents
│   │   ├── dpias/
│   │   └── ropas/
│   └── settings/
├── (marketing)/                # Public marketing
│   ├── page.tsx                # Landing page
│   ├── pricing/
│   └── features/
└── (public)/                   # Public non-marketing
    ├── login/
    └── signup/
```

**Q4: Base Navigation**
**Answer:** Hybrid navigation

- **Authenticated area**: Sidebar with Dashboard, Processing Activities, Components (with sub-items), Questionnaires, Documents (with sub-items), Settings
- **Top bar**: Current Activity breadcrumb, Notifications, Search, User menu
- **Public pages**: Simple top header with Login/Sign Up, Features, Pricing

**Q5: shadcn/ui Components Installation**
**Answer:** Progressive installation

- **Phase 1 (now)**: Button, Input, Label, Select, Checkbox, Switch, Dialog, Sheet, Card, Separator, Navigation Menu
- **Phase 2 (later)**: Form, Table, Data Table, Tabs, Accordion, Badge, Alert, Dropdown Menu

**Q6: Environment Variables**
**Answer:** Comprehensive .env.local.example with:

- DATABASE_URL
- NEXTAUTH_URL, NEXTAUTH_SECRET
- NEXT_PUBLIC_APP_NAME, NEXT_PUBLIC_APP_URL
- Feature flags: NEXT_PUBLIC_FEATURE_QUESTIONNAIRES, NEXT_PUBLIC_FEATURE_DOCUMENT_GENERATION, NEXT_PUBLIC_FEATURE_AI_ASSISTANCE
- Placeholders for: OPENAI_API_KEY, DOCUMENT_STORAGE_PATH, SMTP settings

**Q7: TypeScript Configuration**
**Answer:** Strict mode with path aliases (@/components, @/lib, @/app)

**Q8: Tailwind Theme Customization**
**Answer:**

- Use Tailwind V4 configuration
- Base color scheme and styling on: https://github.com/frankdevlabs/my-analytics/tree/main/app
- Look and feel reference: franksblog.nl

**Visual Design Analysis from franksblog.nl:**

- **Color Palette:**
  - Background: `#FEFBF4` (light mode), `#09192B` (dark mode)
  - Primary Text: `#09192B` (light), `#FEFBF4` (dark)
  - Secondary/Accent: `#D9BF65` (gold)
  - Dark modal: `#0E2845`
- **Typography:**
  - Font Families: Ubuntu (300, 400, 500, 700) for headings/navigation, Raleway (300, 400, 700 + italic) for body
  - Body: 1.8rem with 175.6% line-height
- **Design Aesthetic:** Elegant minimalism with professional legal/tech focus, restrained color use, generous whitespace
- **Hover states:** Gold underline with expanding background gradient
- **Transitions:** 0.2s ease-in-out, 0.8s cubic-bezier for theme switching

**Q9: Initial Pages**
**Answer:** Include skeleton pages for:

- app/(marketing)/page.tsx - Hero with "Component-based compliance that generates documents"
- app/(auth)/dashboard/page.tsx - Empty state with stats cards
- app/(auth)/activities/page.tsx - Empty table with "+ New Activity" button
- app/(auth)/components/processors/page.tsx - Similar empty state
- app/(public)/login/page.tsx - Simple form (non-functional)

**Q10: Authentication Placeholder**
**Answer:**

- Create proxy structure now (Next.js 16 uses proxy.ts, NOT middleware.ts)
- **VERIFIED:** Next.js 16 renamed middleware.ts to proxy.ts to avoid confusion with Express.js patterns
- Reference: https://github.com/frankdevlabs/my-analytics/tree/main/app for auth setup

**Q11: Configuration Management**
**Answer:** Centralized config with Zod validation and feature flags (detailed lib/config.ts provided)

**Q12: Out of Scope**
**Answer:**

- Skip: Actual CRUD operations, Database seeding, Document generation logic, Questionnaire engine, AI features, Email notifications, File uploads, Testing infrastructure, CI/CD
- Include: Database connection (Prisma Client), Basic tRPC 11 setup (empty routers), Component UI shells, Navigation structure, Type definitions from Prisma schema

### Existing Code to Reference

**Similar Features Identified:**

- **my-analytics repository structure**: https://github.com/frankdevlabs/my-analytics/tree/main/app
  - App Router organization patterns
  - Authentication setup patterns (to be used as reference for proxy.ts)
  - Tailwind configuration approach
  - Component organization
  - Environment variable patterns

- **franksblog.nl**: https://franksblog.nl
  - Visual design reference
  - Color scheme and typography
  - Overall aesthetic and styling patterns

- **Initial compilot project**: https://github.com/frankdevlabs/compilot/tree/main
  - Initial project structure

- **Briefing.md**: /Users/frankdevlab/WebstormProjects/compilothq/Briefing.md
  - Comprehensive product vision
  - Database schema architecture patterns
  - Component models and relationships
  - Junction table patterns with contextual metadata
  - Validation rules and compliance requirements

**Reference Materials Located:**

- Product mission: /Users/frankdevlab/WebstormProjects/compilothq/agent-os/product/mission.md
- Product roadmap: /Users/frankdevlab/WebstormProjects/compilothq/agent-os/product/roadmap.md
- Tech stack: /Users/frankdevlab/WebstormProjects/compilothq/agent-os/product/tech-stack.md
- Briefing: /Users/frankdevlab/WebstormProjects/compilothq/Briefing.md

### Follow-up Questions

**Follow-up 1: Monorepo Structure Creation**
**Question:** The monorepo structure (apps/, packages/) does not currently exist. Should this spec include creating the initial monorepo structure with appropriate package.json files and workspace configuration, or will that be handled separately?
**Answer:** YES - This spec should include creating the initial monorepo structure (apps/, packages/) with appropriate package.json files and workspace configuration.

**Follow-up 2: Prisma Schema Location**
**Question:** You mentioned the Prisma schema exists from a previous conversation with 20+ models. Should this spec reference an existing schema file, or should we assume the database package will be set up with the schema in a follow-up spec (Item #2 in roadmap: "Prisma Infrastructure Setup")?
**Answer:** NO - The database package setup will be handled in Item #2 (Prisma Infrastructure Setup) and beyond. This spec should NOT assume the database package exists yet.

**Follow-up 3: Tailwind V4 Configuration Import**
**Question:** The my-analytics repository may have existing Tailwind configuration. Should we attempt to extract and adapt the exact configuration from that repository, or create a new V4 config inspired by the visual design of franksblog.nl?
**Answer:** YES - Extract and adapt the exact configuration from the my-analytics repository. Important notes:

- Research how Tailwind V4 should be configured properly
- Include the modified `postcss.config.mjs`
- Note that `tailwind.config` is NOT used anymore in V4
- Make sure to copy the correct files for V4

## Tailwind V4 Configuration Research

**Investigation of my-analytics repository revealed the following Tailwind V4 setup:**

### Key Files Located:

1. `/Users/frankdevlab/WebstormProjects/my-analytics/app/postcss.config.mjs`
2. `/Users/frankdevlab/WebstormProjects/my-analytics/app/src/app/globals.css`

### Tailwind V4 Architecture Findings:

**1. PostCSS Configuration (postcss.config.mjs):**

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

**Key Insight:** Tailwind V4 uses `@tailwindcss/postcss` plugin instead of the traditional `tailwindcss` plugin.

**2. Configuration Location Change:**

- **Tailwind V3:** Used `tailwind.config.js` or `tailwind.config.ts`
- **Tailwind V4:** Configuration is embedded in CSS using `@theme` directive in `globals.css`
- **Verification:** No `tailwind.config.*` file exists in my-analytics app directory

**3. Package Dependencies (from package.json):**

```json
"@tailwindcss/postcss": "^4",
"tailwindcss": "^4.1.16"
```

**4. globals.css Structure:**
The file contains:

- **Import Statement:** `@import "tailwindcss";` (replaces traditional directives)
- **CSS Custom Properties:** Design tokens in `:root` and `.dark` selectors
- **@theme Directive:** Inline theme configuration using CSS variables
- **Base Styles:** Body, heading, focus styles
- **Custom Animations:** Keyframes for component-specific animations
- **Third-party Overrides:** React-datepicker styling

**5. Complete Design System from my-analytics:**

**Color System:**

- Light mode: Background `#FEFBF4`, Foreground `#09192B`, Accent `#D9BF65`
- Dark mode: Background `#09192B`, Foreground `#FEFBF4`, Accent `#D9BF65`
- Surface colors for cards/elevated elements
- shadcn/ui compatible color variables (card, popover, muted, destructive, etc.)
- Chart colors (5 variants for data visualization)

**Typography System:**

- Font families: Ubuntu (headings), Raleway (body)
- Font sizes: Dashboard-optimized scale (0.75rem to 2.25rem) - NOT blog scale
- Line heights: tight (1.25), normal (1.5), relaxed (1.75)
- Font weights: light (300), regular (400), medium (500), bold (700)

**Design Tokens:**

- Border radius: sm (2px), default (4px), lg (8px), full (9999px)
- Shadows: Minimal values (sm, default, md, lg)
- Focus indicators: 2px solid accent with 2px offset

**Transitions:**

- Theme switching: 300ms ease for background and color
- Component interactions: 150ms ease for hover states

### Configuration Adaptation Strategy:

**For compilothq application:**

1. Use the exact `postcss.config.mjs` from my-analytics
2. Adapt `globals.css` structure with `@theme` inline directive
3. Include the full design system (colors, typography, spacing, shadows)
4. Maintain dark mode support with `.dark` class selector
5. Include shadcn/ui compatible CSS variables
6. Add base styles for body, headings, focus indicators
7. Include custom animations (e.g., pulse-green for active indicators)
8. Keep react-datepicker overrides for consistent styling

**Note:** The dashboard-optimized font scale (12px-36px) is more appropriate for a compliance application than the blog's larger scale.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

No visual files were found in the planning/visuals directory. However, external visual references were provided:

- **franksblog.nl**: Live reference for color scheme, typography, and overall aesthetic
- **Design patterns identified from web analysis**:
  - Clean, professional interface with generous whitespace
  - Gold accent color (#D9BF65) for interactive elements
  - Dark/light mode support with smooth transitions
  - Ubuntu and Raleway font pairing
  - Elegant minimalism suitable for legal/compliance software

## Requirements Summary

### Functional Requirements

**Core Functionality:**

- **Create monorepo structure** (NEW): Initialize apps/ and packages/ directories with workspace configuration
- Initialize Next.js 16 App Router application in apps/web/
- Set up TypeScript in strict mode with path aliases
- Configure Tailwind CSS V4 using `@tailwindcss/postcss` and `@theme` directive (NO tailwind.config file)
- Adapt exact configuration from my-analytics: postcss.config.mjs and globals.css with @theme inline
- Install and configure shadcn/ui Phase 1 components
- Create route group structure: (auth), (marketing), (public)
- Implement base layouts for each route group
- Build navigation components: Sidebar (authenticated), Top bar (authenticated), Header (public)
- Create skeleton pages for key routes
- Set up environment variable configuration with Zod validation
- Implement centralized config management with feature flags
- Create proxy.ts structure for authentication (Next.js 16 convention)
- **Defer database connection setup** (NEW): Do NOT create database package or Prisma Client connection (will be handled in Item #2)
- Set up basic tRPC 11 infrastructure with empty routers

**User Actions Enabled:**

- Navigate between marketing, authentication, and public routes
- View skeleton pages showing intended structure
- See proper layout with sidebar/topbar navigation (authenticated area)
- Experience responsive design and theming
- Access configuration through centralized config system

**Data to be Managed:**

- Environment variables and feature flags
- Application configuration settings
- Route structure and navigation state
- (Database models deferred to Item #2 - Prisma Infrastructure Setup)

### Reusability Opportunities

**Components that exist in my-analytics:**

- Tailwind V4 configuration with @theme directive in globals.css
- PostCSS configuration using @tailwindcss/postcss plugin
- Complete design system with franksblog.nl aesthetic
- Dashboard-optimized typography scale
- Dark mode implementation with next-themes
- shadcn/ui component configurations
- Environment variable patterns
- App Router layout patterns

**Backend Patterns to Investigate:**

- tRPC router organization (will be set up with empty routers as foundation)
- Prisma Client singleton pattern (deferred to roadmap Item #2)

**Similar Features to Model After:**

- my-analytics app structure for overall organization and Tailwind V4 setup
- franksblog.nl for visual design and theming (already implemented in my-analytics)
- Briefing.md for understanding component relationships (for future implementation)

### Scope Boundaries

**In Scope:**

- **Monorepo structure creation**: apps/web/, packages/ directories with workspace configuration
- Root-level package.json with workspace configuration (pnpm workspaces)
- Next.js 16 App Router initialization in apps/web/
- TypeScript configuration with strict mode
- Path aliases (@/components, @/lib, @/app)
- **Tailwind CSS V4 setup** using @tailwindcss/postcss (NO tailwind.config file)
- Exact postcss.config.mjs from my-analytics
- Exact globals.css structure with @theme inline directive from my-analytics
- Complete design system: colors, typography, spacing, shadows, animations
- shadcn/ui Phase 1 components installation
- Route groups: (auth), (marketing), (public)
- Full route structure as specified
- Base layouts for all route groups
- Navigation components: Sidebar, Top bar, Header
- Skeleton pages: marketing landing, dashboard, activities, processors, login
- Environment variables with .env.local.example
- Centralized configuration with Zod validation
- Feature flags system
- proxy.ts authentication structure (Next.js 16)
- Basic tRPC 11 setup with empty routers
- Type definitions structure

**Out of Scope:**

- **Database package creation** (deferred to Item #2)
- **Prisma schema implementation** (deferred to Item #2)
- **Prisma Client connection setup** (deferred to Item #2)
- Actual database operations (CRUD)
- Database seeding
- Functional authentication (NextAuth.js setup in roadmap Item #16)
- Document generation logic
- Questionnaire engine
- AI features
- Email notifications
- File upload functionality
- Testing infrastructure (Vitest, Playwright, Storybook)
- CI/CD pipeline setup
- Docker configuration
- Deployment configuration
- API endpoint implementations (beyond empty routers)

**Future Enhancements (mentioned for context):**

- Phase 2 shadcn/ui components (Form, Table, Data Table, Tabs, Accordion, Badge, Alert, Dropdown Menu)
- Full Prisma schema implementation (roadmap Item #3-14)
- Full authentication with NextAuth.js v5 (roadmap Item #16)
- Component CRUD operations (roadmap Item #18-22)
- Questionnaire system (roadmap Item #24-26)
- Document generation (roadmap Item #27-29)

### Technical Considerations

**Integration Points Mentioned:**

- Monorepo workspace configuration (pnpm workspaces)
- **Deferred:** Prisma Client from packages/database (Item #2)
- **Deferred:** Shared UI components from packages/ui (future)
- **Deferred:** Shared validation from packages/validation (future)
- tRPC API layer foundation
- proxy.ts for authentication middleware (Next.js 16 convention)

**Existing System Constraints:**

- Must use Next.js 16 App Router (not Pages Router)
- Must use proxy.ts instead of middleware.ts (Next.js 16 requirement)
- TypeScript strict mode required
- **Tailwind V4 required** with @tailwindcss/postcss and @theme directive (NO tailwind.config file)
- Must support both light and dark modes
- Must be compatible with Vercel deployment
- Must support EU region hosting for GDPR compliance
- Must use pnpm for package management (monorepo workspace requirement)

**Technology Preferences Stated:**

- Next.js 16 with App Router
- React 19
- TypeScript 5.x in strict mode
- **Tailwind CSS V4** with @tailwindcss/postcss plugin
- shadcn/ui + Radix UI
- tRPC v11
- Zod for validation
- pnpm for package management (monorepo workspaces)
- **Deferred:** Prisma ORM (Item #2)
- **Deferred:** PostgreSQL 17 connection (Item #2)

**Similar Code Patterns to Follow:**

- **Tailwind V4 configuration from my-analytics** (exact adaptation)
- App Router structure from my-analytics repository
- Authentication patterns from my-analytics (for proxy.ts reference)
- Visual design from franksblog.nl (already implemented in my-analytics)
- Component architecture patterns from Briefing.md (for understanding future implementation)
- Validator-first design with Zod schemas (from Briefing.md)

**Critical Next.js 16 Change:**

- **middleware.ts has been renamed to proxy.ts** in Next.js 16.0.0
- The exported function should be named `proxy` instead of `middleware`
- Migration codemod available: `npx @next/codemod@canary middleware-to-proxy .`
- This change was made to avoid confusion with Express.js middleware patterns

**Critical Tailwind V4 Changes:**

- **NO tailwind.config.js/ts file** - Configuration moved to CSS
- Uses `@theme` directive in globals.css for inline theme configuration
- Imports Tailwind with `@import "tailwindcss";` instead of `@tailwind` directives
- PostCSS plugin changed from `tailwindcss` to `@tailwindcss/postcss`
- Package: `"@tailwindcss/postcss": "^4"` and `"tailwindcss": "^4.1.16"`
- All theme customization done via CSS custom properties and @theme block

**Product Context Integration:**
This spec provides the foundation for Compilo, a component-based compliance platform for GDPR documentation. Key context from product materials:

- **Product Mission**: Help privacy officers generate professional GDPR documentation in hours instead of weeks through reusable compliance components
- **Target Users**: Mid-market organizations (50-500 employees), privacy professionals, legal teams, business stakeholders
- **Core Architecture**: Component library → guided questionnaires → document generation
- **Roadmap Position**: Item #1 of MVP phase - provides application shell for all subsequent features
- **Next Steps**: Item #2 (Prisma Infrastructure), then Items #3-14 (Database Schema), then Items #15-17 (API & Auth)

**Design Philosophy (from franksblog.nl analysis, implemented in my-analytics):**

- Elegant minimalism with professional legal/tech focus
- Restrained color palette with gold accent (#D9BF65)
- Generous whitespace
- Clear typography hierarchy (Ubuntu headings, Raleway body)
- Smooth transitions and hover states (300ms ease for theme switching)
- Both light and dark mode support
- Dashboard-optimized font scale (12px-36px) for data-heavy interfaces
