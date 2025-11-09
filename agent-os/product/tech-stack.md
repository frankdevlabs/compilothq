# Tech Stack

## Framework & Runtime

**Next.js 16 (App Router)**

- Latest version with full App Router implementation
- Server Components for optimal performance
- React Server Actions for mutations
- Built-in image optimization, fonts, and SEO
- Zero-config deployment on Vercel
- Already used in compilot project (familiar to development team)

**Node.js 20 LTS**

- Stable long-term support release
- Native TypeScript support
- Excellent library ecosystem for compliance tooling
- Reliable for backend services

**TypeScript 5.x (Strict Mode)**

- Critical for compliance domain requiring type safety
- Prevents errors through compile-time checking
- Self-documenting code through types
- Shared types between client and server
- Full end-to-end type safety throughout stack

## Frontend

**React 19**

- Industry standard with huge ecosystem
- Server Components support
- Concurrent features for performance
- Strong component model for compliance UI

**UI Framework: shadcn/ui + Radix UI**

- Beautiful, accessible component library
- Built on Radix primitives (accessibility-first)
- Seamless Tailwind CSS integration
- Customizable source code (not black box)
- Components: Dialog, Sheet, Table, DataTable, Form, Input, Select, Tabs, Accordion, Toast, Alert

**Tailwind CSS 4**

- Rapid styling with utility classes
- Consistent design system
- JIT compiler for optimal bundle size
- Built-in dark mode support
- No separate CSS files needed

**Rich Text Editor: TipTap**

- Modern, extensible editor based on ProseMirror
- Can embed components within text
- Variable support for templates ({{activity.name}})
- Collaboration-ready architecture
- Superior to alternatives (Draft.js, Slate, Quill)

**Forms: React Hook Form + Zod**

- Type-safe form validation
- Zod schemas generate TypeScript types
- Minimal re-renders for performance
- Perfect for complex questionnaires

**State Management: Zustand**

- Simpler than Redux with less boilerplate
- Excellent TypeScript support
- Lightweight and performant
- Easy to test and debug

**Data Fetching: TanStack Query (React Query)**

- Intelligent caching and background refetching
- Optimistic updates for responsive UI
- Pagination and infinite scroll support
- Perfect integration with tRPC

**Visualization: React Flow**

- Interactive component relationship graphs
- Node-based diagram system
- Data flow visualization for processing activities
- Shows connections between processors, activities, and assets

**Tables: TanStack Table**

- Powerful headless table library
- Sorting, filtering, pagination out of box
- Column resizing and reordering
- Built-in CSV export capability

## Backend & API

**tRPC v11**

- End-to-end type safety between client and server
- No code generation needed
- Shared types automatically
- Auto-documented procedures
- Eliminates API contract issues

**Prisma ORM**

- Type-safe database access
- Built-in migration system
- Excellent Next.js integration
- Auto-generated TypeScript types from schema
- Type flow: Schema → TypeScript → tRPC → React

**Validation: Zod**

- Runtime validation with TypeScript inference
- Shared schemas between client and server
- Single source of truth for data shapes
- Integration with React Hook Form

## Database

**PostgreSQL 17**

- Robust and proven at enterprise scale
- Excellent JSONB support for flexible data
- Built-in full-text search capabilities
- Strong foreign key relationships
- ACID transactions for data integrity
- Extensions: pg_trgm (fuzzy search), ltree (hierarchical data), pgcrypto (encryption), pg_cron (scheduled jobs)

**Hosting Options**

- Development: Docker Compose (PostgreSQL 17 + Redis 7)
- Production: Contabo VPS with self-hosted PostgreSQL 17 + Redis 7

**Why PostgreSQL**

- Chosen over MongoDB: Relationships are first-class in compliance domain
- Chosen over Neo4j: Overkill, PostgreSQL with proper foreign keys is sufficient
- Chosen over MySQL: Superior JSON support and full-text search

## Document Generation

**Docxtemplater**

- Best library for programmatic Word document generation
- Templates created in actual .docx files
- Supports tables, images, loops, conditionals
- Professional formatting preservation

**Puppeteer + Headless Chrome**

- HTML to PDF with perfect rendering
- Server-side rendering for consistent output
- Digital signature support
- Alternative: Playwright (similar capabilities)

**Markdown + Pandoc (Optional)**

- For internal version control
- Git-friendly document diffs
- Convert between formats: MD → DOCX → PDF

## File Storage

**S3-Compatible Storage**

- Development: MinIO (self-hosted, S3-compatible)
- Production: AWS S3 or Cloudflare R2
- Industry standard API
- Cost-effective at scale
- Presigned URLs for secure uploads
- Provider-agnostic (easy to switch)

## Authentication

**NextAuth.js v5 (Auth.js)**

- Built specifically for Next.js
- Email magic links for passwordless auth
- Google OAuth for ease of use
- SAML SSO support for enterprise phase
- Session management built-in
- Prisma database adapter

## Background Jobs

**BullMQ + Redis**

- Reliable job queue system
- Use cases: Long-running document generation, rate-limited email sending, scheduled DPA expiry checks, DPIA review reminders
- Redis also used for: Session storage, rate limiting, API caching

## Email

**Resend**

- Modern, developer-friendly email API
- React Email templates for branded emails
- Excellent deliverability rates
- Reasonable pricing structure
- Alternative: Postmark (also excellent)

**React Email**

- Build email templates with React components
- Type-safe email generation
- Preview emails during development

## Development Tools

**Testing**

- Vitest: Unit tests (faster than Jest, better DX)
- Playwright: End-to-end tests for real workflows
- Storybook: Component development in isolation

**Code Quality**

- ESLint: Next.js configuration
- Prettier: Code formatting
- Husky: Git hooks (pre-commit lint/format, pre-push tests)
- TypeScript strict mode enforcement

**Development Workflow**

- Turborepo: Monorepo management if needed
- pnpm: Faster package management than npm/yarn
- Docker Compose: Local service orchestration

## Monitoring & Observability

**Sentry**

- Error tracking and monitoring
- Performance monitoring
- Source maps for production debugging
- Alert notifications

**PostHog**

- Product analytics and insights
- Feature flags for gradual rollouts
- Session recordings for UX improvement
- Funnel analysis for conversion optimization

**Axiom or Logflare**

- Structured logging
- Query logs like a database
- Real-time log streaming

## Deployment

**Production: Vercel**

- Zero-configuration for Next.js
- Global CDN for fast delivery
- Preview deployments per pull request
- Built-in analytics
- Automatic scaling
- EU region available for data residency

**Database Hosting**

- Development: Docker Compose (PostgreSQL 17 + Redis 7) - local development
- Production: Contabo VPS with self-hosted PostgreSQL 17 + Redis 7
- EU/Dutch data residency: Contabo Nuremberg datacenter (Germany) meets GDPR requirements

**CI/CD: GitHub Actions**

- Triggered on push to main branch
- Pipeline: Linting → Type checks → Unit tests → E2E tests → Build → Deploy to Vercel
- Preview deployments for every pull request

## Why This Stack?

**End-to-End Type Safety**

- Single TypeScript codebase from database to UI
- Prisma generates types from database schema
- tRPC shares types between server and client
- Zod validates at runtime and infers types
- One type definition flows through entire stack
- Errors caught at compile time, not runtime

**Modern & Proven**

- Next.js: Used by Netflix, TikTok, Twitch
- Prisma: Used by Vercel, Red Bull, Typefully
- tRPC: Used by Cal.com, Ping.gg, create-t3-app community
- shadcn/ui: Used by thousands of production applications
- Battle-tested, not experimental

**Excellent Developer Experience**

- Hot reload with instant feedback
- TypeScript autocomplete everywhere
- Clear error messages pointing to exact issues
- Built-in optimizations (images, fonts, code splitting)
- Storybook for isolated component development

**Scalable & Cost-Effective**

- Development: €0/month (Docker Compose locally)
- Production Small (0-100 users): €10-25/month (Contabo VPS S/M + Vercel free tier + Resend)
- Production Medium (100-1000 users): €30-50/month (Contabo VPS L + Vercel Pro + Resend)
- Enterprise (1000+ users): €50-100+/month (Contabo VPS XL or Dedicated Server + premium features)

**Team Knowledge**

- Next.js: Already used in compilot project
- React: Team expertise
- TypeScript: Team expertise
- PostgreSQL: Team expertise
- Can start building immediately without learning curve

**Dutch/EU Data Residency Compliance**

- Vercel EU region available
- Database hosted in EU (Contabo Nuremberg datacenter, Germany)
- All infrastructure meets GDPR data residency requirements
- Critical for compliance software serving Dutch market
