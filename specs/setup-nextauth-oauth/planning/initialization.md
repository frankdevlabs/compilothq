# Spec Initialization: Authentication Foundation with NextAuth.js v5

## Feature Description

Set up NextAuth.js with email magic links and Google OAuth, configure Prisma adapter for User and session management, implement organization context in session, create login/signup UI components with organization creation flow, set up protected route middleware injecting user and organizationId into requests, and test session management and organization switching to secure all application features.

## Priority

Medium (`M`)

## Roadmap Context

This is item #5 in the MVP Phase under "Foundation Reference Data & Core Models" section. It builds upon:

- Item #1: Next.js Application Foundation & Routing Setup (completed)
- Item #2: Monorepo & Prisma Infrastructure Setup (completed)
- Item #4: Organization & User Models with Multi-Tenancy (completed)

This feature enables:

- Item #6: tRPC API Layer with Auth Context (depends on authentication being in place)
- Item #7: Base UI Component Library Setup (can proceed in parallel)
- All subsequent features requiring authenticated user context

## Initial Notes

This feature establishes the authentication foundation for the entire application. It must:

1. Support multi-tenant architecture with organization context
2. Provide both email magic links (passwordless) and Google OAuth
3. Include organization creation flow during signup
4. Inject user and organizationId into all authenticated requests
5. Enable organization switching for users who belong to multiple organizations
6. Secure all application routes appropriately

The implementation must integrate with:

- Existing Prisma schema (User and Organization models already defined)
- Next.js 16 App Router
- Future tRPC API layer that will consume the auth context
