# Specification: NextAuth.js v5 Authentication Foundation

## Goal

Implement NextAuth.js v5 with email magic links and Google OAuth, database session storage via Prisma adapter, organization context in sessions, protected route middleware, complete invitation system, and tRPC authenticated context to secure all application features with single-organization multi-tenancy.

## User Stories

- As a new user, I want to sign up with email or Google and create my organization so that I can start using Compilo for compliance management
- As a DPO, I want to invite team members via email to join my organization so that my privacy team can collaborate on compliance activities

## Specific Requirements

**NextAuth.js v5 Core Setup**

- Install and configure NextAuth.js v5 (Auth.js) with Prisma adapter for database session storage
- Configure email provider using Resend for magic link delivery with 15-minute token expiration
- Configure Google OAuth provider with client credentials from environment variables
- Create NextAuth.js API route handler at `/app/api/auth/[...nextauth]/route.ts`
- Set session strategy to "database" (not JWT) for revocability and audit trail
- Configure secure session cookies with HttpOnly, Secure, and SameSite=Lax attributes
- Implement NextAuth.js callbacks (signIn, session, jwt) to include organizationId and primaryPersona in session
- Add NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, RESEND_API_KEY to environment configuration

**Database Schema Extensions**

- Add NextAuth.js standard models: Account (OAuth providers), Session (database sessions), VerificationToken (magic links)
- Add Invitation model with fields: email, token, organizationId, invitedBy, invitedPersona, status, expiresAt, acceptedAt
- Add InvitationStatus enum with values: PENDING, ACCEPTED, EXPIRED, CANCELLED
- Add relations to User model: accounts[], sessions[], invitationsSent[]
- Add relations to Organization model: invitations[]
- Create indexes on Invitation for: [email, status], [organizationId, status], [token], [expiresAt]
- Keep existing User.organizationId foreign key (single organization membership)
- Run Prisma migration to apply schema changes

**Authentication Flows - Sign Up with New Organization**

- Create `/app/(public)/signup/page.tsx` with email input and "Continue with Google" button using shadcn/ui components
- Email flow: User enters email, receives magic link via Resend, clicks link to verify and authenticate
- Google OAuth flow: User clicks Google button, redirects to OAuth consent, returns authenticated
- After authentication, redirect new users (no organizationId) to `/create-organization`
- Create `/app/(public)/create-organization/page.tsx` with form: organization name (required)
- Generate URL-safe slug from organization name (e.g., "Acme Corp" → "acme-corp") using utility function
- Create organization record with ACTIVE status and assign user with DPO persona
- Redirect to `/dashboard` after successful organization creation

**Authentication Flows - Sign Up with Invitation**

- Create `/app/(public)/invite/[token]/page.tsx` to handle invitation acceptance
- Validate invitation token exists, status is PENDING, and not expired (7 days)
- If user not authenticated, redirect to `/login?callbackUrl=/invite/[token]` to authenticate first
- Display invitation details: organization name, invited by (user name), assigned persona
- On "Accept Invitation" button click, verify email matches invitation email
- Create/update user record with organizationId from invitation and assigned persona
- Update invitation status to ACCEPTED with acceptedAt timestamp
- Redirect to `/dashboard` after successful acceptance

**Authentication Flows - Login Existing Users**

- Create `/app/(public)/login/page.tsx` with same UI as signup (email input and Google button)
- Email flow: User enters email, receives magic link, clicks to authenticate
- Google OAuth flow: User clicks Google button, OAuth flow, returns authenticated
- NextAuth.js loads existing user with organizationId and creates session
- Redirect authenticated users to `/dashboard` or original callbackUrl destination
- Handle edge case: Google OAuth email matches existing email-only user by linking accounts

**Protected Routes and Middleware**

- Create `/middleware.ts` using NextAuth.js session checking on all routes under `/dashboard/*`
- Redirect unauthenticated users to `/login?callbackUrl=[original-url]` preserving destination
- Allow public routes: `/`, `/login`, `/signup`, `/invite/[token]`, `/api/auth/*`
- Inject session data into request context for downstream consumption
- Handle session expiration gracefully with automatic redirect to login

**tRPC Authenticated Context Integration**

- Update `createTRPCContext` in `/apps/web/src/server/context.ts` to extract NextAuth.js session
- Include in session object: `{ user: { id, email, name, organizationId, primaryPersona } }`
- Create `protectedProcedure` middleware that throws UNAUTHORIZED error if no session exists
- Create `orgProcedure` extending protectedProcedure that auto-injects organizationId filter
- Ensure all tRPC queries using orgProcedure include `where: { organizationId }` for multi-tenancy isolation
- Export typed context for use in all tRPC routers with full TypeScript inference

**Invitation System - Send and Manage**

- Create tRPC procedure `invitation.send` accepting: email, invitedPersona (UserPersona enum)
- Validate email not already a member and no pending invitation exists
- Generate secure random token (32 bytes), set expiresAt to 7 days from creation
- Create Invitation record with PENDING status and send email via Resend with invitation link
- Create tRPC procedure `invitation.list` returning sent invitations for current organization
- Create tRPC procedure `invitation.cancel` updating status to CANCELLED
- Create tRPC procedure `invitation.resend` generating new token and resending email
- Use React Email templates for invitation emails with organization name and invite link

**UI Components and Pages**

- Create auth layout group `(public)` for unauthenticated pages without sidebar/topbar
- Create reusable `<SignInButton />` and `<SignOutButton />` components using NextAuth.js helpers
- Create `<UserMenu />` dropdown component showing user name, organization name, and logout option
- Build forms using shadcn/ui components: Button, Input, Label, Card for consistent design
- Add loading states during authentication flows using button disabled state and spinners
- Display error messages using shadcn/ui Alert or toast notifications for auth failures
- Follow existing `(auth)` layout pattern for authenticated pages with Sidebar and TopBar

**Security and Validation**

- Validate all email inputs using Zod email schema in validation package
- Use Zod to validate environment variables on application startup
- Implement CSRF protection via NextAuth.js built-in mechanisms
- Enforce magic link expiration (15 minutes) and invitation expiration (7 days)
- Prevent SQL injection via Prisma parameterized queries (already handled by ORM)
- Ensure all database queries via orgProcedure filter by session organizationId
- Hash and securely store OAuth tokens in Account table via Prisma adapter
- Log authentication events (future enhancement, note in out-of-scope for now)

## Visual Design

No visual mockups provided. Implementation should follow existing patterns:

- Use shadcn/ui components from `@compilothq/ui` package for all form elements
- Follow existing layout pattern: centered authentication forms with max-width container
- Match professional compliance software aesthetic consistent with existing dashboard pages
- Use lucide-react icons for visual elements (mail icon, Google logo, etc.)
- Implement responsive design working on mobile and desktop viewports
- Follow Tailwind CSS conventions and existing color scheme from theme-provider
- Display clear call-to-action buttons with primary styling for main actions
- Show helpful error messages and validation feedback inline with form fields

## Existing Code to Leverage

**Prisma Schema and Database Models**

- User model with organizationId FK, primaryPersona (UserPersona enum), and emailVerified field already defined
- Organization model with slug, status (OrganizationStatus enum), and soft delete support already implemented
- UserPersona enum with 6 roles: DPO, PRIVACY_OFFICER, BUSINESS_OWNER, IT_ADMIN, SECURITY_TEAM, LEGAL_TEAM
- OrganizationStatus enum with ACTIVE, TRIAL, SUSPENDED, CANCELLED values
- Custom Prisma output path at `packages/database/generated/client` configured

**Data Access Layer (DAL) Pattern**

- Existing DAL functions in `packages/database/src/dal/` demonstrate organization isolation pattern
- `createUser()` function with organizationId parameter for user creation
- `getUserByEmail()` for looking up users during authentication
- `createOrganization()` with slug and status parameters for org creation
- `listUsersByOrganization()` filtering pattern to replicate for multi-tenancy
- Export pattern from `packages/database/src/index.ts` to follow for new DAL functions

**tRPC Foundation**

- Basic tRPC setup at `apps/web/src/server/trpc.ts` with context pattern ready to extend
- Context type defined in `apps/web/src/server/context.ts` with comment indicating future session integration
- `publicProcedure` already defined, need to add `protectedProcedure` and `orgProcedure`
- tRPC client configured at `apps/web/src/lib/trpc/client.tsx` for React components

**shadcn/ui Component Library**

- Button, Card, Input, Label, Dialog, Select components in `packages/ui/src/components/`
- Radix UI primitives installed with tailwind-merge and class-variance-authority for styling
- Existing pattern in TopBar and Sidebar components to follow for UserMenu
- Theme provider with next-themes for dark mode support

**Monorepo Structure and Build System**

- Turborepo configuration with workspace dependencies between packages
- Environment variable management pattern in `.env.example`
- TypeScript configuration shared across packages
- Build dependency chain: database → ui → web with proper task ordering

## Out of Scope

- Multi-organization membership (users can only belong to ONE organization)
- Organization switching UI (not needed with single-org membership)
- SAML SSO and enterprise identity providers (future enterprise phase)
- Password-based authentication (passwordless only with magic links)
- Two-factor authentication and MFA (future security enhancement)
- Additional OAuth providers beyond Google (GitHub, Microsoft, etc.)
- User profile editing UI and settings pages (future feature)
- Organization settings management UI (future feature)
- Role and persona permission management UI (future feature)
- Audit logging of authentication events (future compliance feature)
- Rate limiting on authentication endpoints (future security hardening)
- CAPTCHA on signup forms (future bot prevention)
- Account deletion and data export flows (future GDPR features)
- Session device management and session history UI (future feature)
- Email change workflow with verification (future account management)
