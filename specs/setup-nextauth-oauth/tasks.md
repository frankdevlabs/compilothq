# Task Breakdown: NextAuth.js v5 Authentication Foundation

## Overview

**Total Task Groups:** 12
**Estimated Total Tasks:** ~85 individual sub-tasks

This tasks breakdown implements a complete authentication system with NextAuth.js v5, email magic links, Google OAuth, database sessions, organization context, invitation system, and tRPC integration.

## Task List

### Phase 1: Foundation Setup

#### Task Group 1: Project Setup & Dependencies

**Dependencies:** None

**Role:** DevOps / Setup Engineer

- [ ] 1.0 Install and configure project dependencies
  - [ ] 1.1 Install NextAuth.js v5 packages
    - `npm install next-auth@beta @auth/prisma-adapter`
    - Verify beta version is v5.x
  - [ ] 1.2 Install email provider packages
    - `npm install resend react-email @react-email/components`
    - Install email template dependencies
  - [ ] 1.3 Add environment variable validation
    - Create `packages/validation/src/env.ts` with Zod schema
    - Required vars: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`
    - Add validation check on app startup
  - [ ] 1.4 Update `.env.example` with auth variables
    - Add all NextAuth.js configuration variables
    - Add Resend API key placeholder
    - Add Google OAuth credentials placeholders
    - Document variable purpose in comments
  - [ ] 1.5 Generate NEXTAUTH_SECRET
    - Use `openssl rand -base64 32` to generate secure secret
    - Document generation command in README
    - Add to local `.env` file (not committed)

**Acceptance Criteria:**
- All dependencies installed successfully
- Environment variables defined in `.env.example`
- Zod validation schema passes with valid env vars
- `NEXTAUTH_SECRET` generated and configured locally

---

#### Task Group 2: Database Schema Extensions

**Dependencies:** Task Group 1

**Role:** Database Engineer

- [ ] 2.0 Extend Prisma schema with authentication models
  - [ ] 2.1 Write 2-8 focused tests for database models
    - Limit to 2-8 highly focused tests maximum
    - Test only critical model behaviors:
      - Account creation with provider link
      - Session creation and expiration validation
      - Invitation token uniqueness and status transitions
      - User-Organization-Invitation relationship integrity
    - Location: `packages/database/src/__tests__/auth-models.test.ts`
    - Skip exhaustive validation of all fields
  - [ ] 2.2 Add NextAuth.js standard models to schema
    - Add `Account` model with OAuth provider fields
    - Add `Session` model with sessionToken and expiration
    - Add `VerificationToken` model for magic links
    - Follow NextAuth.js Prisma adapter schema exactly
    - Location: `packages/database/prisma/schema.prisma`
  - [ ] 2.3 Add Invitation system models
    - Create `InvitationStatus` enum (PENDING, ACCEPTED, EXPIRED, CANCELLED)
    - Add `Invitation` model with all fields from spec
    - Fields: email, token, organizationId, invitedBy, invitedPersona, status, expiresAt, acceptedAt
    - Add unique constraint on token
  - [ ] 2.4 Add relations to User model
    - `accounts` relation to Account (one-to-many)
    - `sessions` relation to Session (one-to-many)
    - `invitationsSent` relation to Invitation (one-to-many)
    - Keep existing organizationId FK unchanged
  - [ ] 2.5 Add relations to Organization model
    - `invitations` relation to Invitation (one-to-many)
    - Keep existing fields unchanged
  - [ ] 2.6 Add database indexes for performance
    - Account: index on userId
    - Session: index on userId
    - Invitation: composite index on [email, status]
    - Invitation: composite index on [organizationId, status]
    - Invitation: index on token
    - Invitation: index on expiresAt
  - [ ] 2.7 Create and run Prisma migration
    - `npm run db:migrate:dev --name add-nextauth-models`
    - Verify migration SQL is correct
    - Apply to development database
    - Regenerate Prisma client
  - [ ] 2.8 Ensure database layer tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify migrations applied successfully
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 2.1 pass
- All models present in schema with correct fields
- Relations properly configured
- Indexes created successfully
- Migration applied without errors
- Prisma client regenerated with new types

---

#### Task Group 3: Data Access Layer (DAL) Functions

**Dependencies:** Task Group 2

**Role:** Database Engineer

- [ ] 3.0 Create DAL functions for authentication operations
  - [ ] 3.1 Write 2-8 focused tests for DAL functions
    - Limit to 2-8 highly focused tests maximum
    - Test only critical DAL operations:
      - getUserByEmail with organization data
      - createUser with organizationId assignment
      - createOrganization with slug generation
      - createInvitation with token generation
      - findInvitationByToken validation
    - Location: `packages/database/src/__tests__/dal-auth.test.ts`
    - Skip exhaustive edge case testing
  - [ ] 3.2 Create user management DAL functions
    - `getUserByEmail(email: string)` - Find user with organization
    - `createUserWithOrganization(data)` - Create user and assign to org
    - `updateUserOrganization(userId, organizationId, persona)` - Update org assignment
    - Location: `packages/database/src/dal/users.ts`
  - [ ] 3.3 Create organization DAL functions
    - `generateSlugFromName(name: string)` - Create URL-safe slug utility
    - `createOrganizationWithOwner(name, userId)` - Create org and assign DPO
    - `getOrganizationById(id)` - Fetch org with relations
    - Location: `packages/database/src/dal/organizations.ts`
  - [ ] 3.4 Create invitation DAL functions
    - `createInvitation(data)` - Generate token, create record
    - `findInvitationByToken(token)` - Fetch with org and inviter data
    - `acceptInvitation(token, userId)` - Update status and acceptedAt
    - `cancelInvitation(id)` - Update status to CANCELLED
    - `listInvitationsByOrganization(orgId)` - Get all invitations
    - Location: `packages/database/src/dal/invitations.ts`
  - [ ] 3.5 Add token generation utilities
    - `generateInvitationToken()` - Secure 32-byte random token
    - `generateSlug(name)` - Convert name to URL-safe slug
    - Use Node crypto for token generation
    - Location: `packages/database/src/utils/tokens.ts`
  - [ ] 3.6 Export new DAL functions from index
    - Add all new functions to `packages/database/src/index.ts`
    - Ensure proper TypeScript types exported
  - [ ] 3.7 Ensure DAL tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify all DAL functions work correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass
- All DAL functions implemented and working
- Token generation uses secure crypto
- Slug generation produces URL-safe strings
- Functions properly exported from package

---

### Phase 2: Authentication Core

#### Task Group 4: NextAuth.js Core Configuration

**Dependencies:** Task Group 2, 3

**Role:** Backend Engineer

- [ ] 4.0 Configure NextAuth.js v5 with Prisma adapter
  - [ ] 4.1 Write 2-8 focused tests for NextAuth configuration
    - Limit to 2-8 highly focused tests maximum
    - Test only critical auth behaviors:
      - Session callback includes organizationId
      - JWT callback includes user metadata
      - SignIn callback validates user access
      - Session extraction from request works
    - Location: `apps/web/src/__tests__/auth-config.test.ts`
    - Skip exhaustive callback testing
  - [ ] 4.2 Create NextAuth.js configuration file
    - Location: `apps/web/src/lib/auth/config.ts`
    - Import PrismaAdapter from `@auth/prisma-adapter`
    - Set session strategy to "database"
    - Configure secure cookies (HttpOnly, Secure, SameSite=Lax)
  - [ ] 4.3 Configure email provider (Resend)
    - Add Resend email provider configuration
    - Set magic link expiration to 15 minutes
    - Configure from address and reply-to
    - Use Resend API key from environment
  - [ ] 4.4 Configure Google OAuth provider
    - Add Google provider configuration
    - Use GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from env
    - Set OAuth scopes: profile, email
    - Configure callback URL
  - [ ] 4.5 Implement NextAuth.js callbacks
    - `signIn` callback: Validate user has organization access
    - `session` callback: Include organizationId and primaryPersona
    - `jwt` callback: Add user metadata to token (if needed)
    - Handle account linking (Google + email for same user)
  - [ ] 4.6 Create NextAuth.js API route handler
    - Location: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
    - Import auth config
    - Export GET and POST handlers
    - Enable all NextAuth.js routes (/signin, /signout, /callback)
  - [ ] 4.7 Create auth helper utilities
    - `getServerSession()` - Get session in Server Components
    - `requireAuth()` - Throw if no session (server-side)
    - `getSession()` - Get session in Client Components
    - Location: `apps/web/src/lib/auth/helpers.ts`
  - [ ] 4.8 Ensure NextAuth configuration tests pass
    - Run ONLY the 2-8 tests written in 4.1
    - Verify callbacks work correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 4.1 pass
- NextAuth.js configured with Prisma adapter
- Database session strategy active
- Email and Google providers configured
- Callbacks include organization context
- API routes respond correctly

---

#### Task Group 5: Email Integration (Resend + React Email)

**Dependencies:** Task Group 1, 4

**Role:** Backend Engineer / Email Developer

- [ ] 5.0 Set up email templates and sending
  - [ ] 5.1 Write 2-8 focused tests for email functionality
    - Limit to 2-8 highly focused tests maximum
    - Test only critical email behaviors:
      - Magic link email renders correctly
      - Invitation email includes correct data
      - Email sending via Resend succeeds
      - Email template variables populated
    - Location: `apps/web/src/__tests__/email.test.ts`
    - Skip exhaustive template variation testing
  - [ ] 5.2 Create React Email templates directory
    - Create directory: `apps/web/src/emails/`
    - Set up React Email configuration
    - Install template components from `@react-email/components`
  - [ ] 5.3 Create magic link email template
    - File: `apps/web/src/emails/MagicLinkEmail.tsx`
    - Props: email, magicLink, expiresAt
    - Use React Email components (Html, Body, Container, Button)
    - Professional design matching brand
    - Clear CTA button for magic link
    - Expiration warning (15 minutes)
  - [ ] 5.4 Create invitation email template
    - File: `apps/web/src/emails/InvitationEmail.tsx`
    - Props: inviteeEmail, organizationName, inviterName, inviteLink, invitedPersona, expiresAt
    - Clear explanation of invitation
    - Organization and role details
    - CTA button for accepting invitation
    - Expiration notice (7 days)
  - [ ] 5.5 Create email sending service
    - File: `apps/web/src/lib/email/send.ts`
    - Function: `sendMagicLink(email, token)`
    - Function: `sendInvitation(email, invitation)`
    - Use Resend SDK to send emails
    - Handle errors gracefully
    - Log email sends for debugging
  - [ ] 5.6 Integrate email service with NextAuth
    - Override sendVerificationRequest in email provider
    - Use custom magic link template
    - Generate magic link URL with token
  - [ ] 5.7 Ensure email tests pass
    - Run ONLY the 2-8 tests written in 5.1
    - Verify templates render correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 5.1 pass
- Email templates render correctly
- Resend integration working
- Magic links sent successfully
- Invitation emails sent with correct data

---

### Phase 3: tRPC Integration

#### Task Group 6: tRPC Authentication Context

**Dependencies:** Task Group 4

**Role:** Backend Engineer / API Developer

- [ ] 6.0 Implement tRPC authenticated context and procedures
  - [ ] 6.1 Write 2-8 focused tests for tRPC auth
    - Limit to 2-8 highly focused tests maximum
    - Test only critical tRPC behaviors:
      - protectedProcedure throws UNAUTHORIZED without session
      - protectedProcedure succeeds with valid session
      - orgProcedure includes organizationId in context
      - Session data properly typed in context
    - Location: `apps/web/src/__tests__/trpc-auth.test.ts`
    - Skip exhaustive middleware testing
  - [ ] 6.2 Update tRPC context with session extraction
    - File: `apps/web/src/server/context.ts`
    - Import `getServerSession` from auth helpers
    - Extract session in createTRPCContext function
    - Include full session data: user (id, email, name, organizationId, primaryPersona)
    - Type session properly with TypeScript
  - [ ] 6.3 Create protectedProcedure middleware
    - File: `apps/web/src/server/trpc.ts`
    - Extend publicProcedure with auth check
    - Throw TRPCError with UNAUTHORIZED code if no session
    - Pass session to procedure context
    - Ensure full TypeScript inference
  - [ ] 6.4 Create orgProcedure middleware
    - Extend protectedProcedure with organization filter
    - Auto-inject organizationId from session
    - Add organizationId to context for easy access
    - Document usage pattern in comments
  - [ ] 6.5 Update existing tRPC routers with auth
    - Review existing routers (if any)
    - Migrate from publicProcedure to orgProcedure where needed
    - Ensure all queries include organizationId filter
  - [ ] 6.6 Export typed context and procedures
    - Export protectedProcedure from trpc.ts
    - Export orgProcedure from trpc.ts
    - Ensure TypeScript types inferred correctly
    - Document procedure usage in comments
  - [ ] 6.7 Ensure tRPC auth tests pass
    - Run ONLY the 2-8 tests written in 6.1
    - Verify middleware works correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 6.1 pass
- Session extracted in tRPC context
- protectedProcedure enforces authentication
- orgProcedure includes organizationId
- TypeScript types work correctly
- Existing routers migrated if needed

---

#### Task Group 7: Invitation System tRPC Procedures

**Dependencies:** Task Group 3, 6

**Role:** Backend Engineer / API Developer

- [ ] 7.0 Create invitation management tRPC router
  - [ ] 7.1 Write 2-8 focused tests for invitation procedures
    - Limit to 2-8 highly focused tests maximum
    - Test only critical invitation operations:
      - Send invitation creates record and sends email
      - Accept invitation updates user and status
      - Cancel invitation updates status
      - List invitations filters by organization
      - Validation prevents duplicate invitations
    - Location: `apps/web/src/__tests__/invitation-router.test.ts`
    - Skip exhaustive edge case testing
  - [ ] 7.2 Create invitation router file
    - File: `apps/web/src/server/routers/invitation.ts`
    - Import router, orgProcedure from trpc
    - Import invitation DAL functions
    - Import email service
  - [ ] 7.3 Implement invitation.send procedure
    - Use orgProcedure for auth and org context
    - Input: Zod schema with email, invitedPersona
    - Validate email not already a member
    - Validate no pending invitation exists
    - Generate token with 7-day expiration
    - Create invitation record via DAL
    - Send invitation email via Resend
    - Return invitation record
  - [ ] 7.4 Implement invitation.list procedure
    - Use orgProcedure for org filtering
    - Return all invitations for current organization
    - Include inviter user data (name, email)
    - Filter by status (optional input)
    - Order by createdAt descending
  - [ ] 7.5 Implement invitation.cancel procedure
    - Use orgProcedure for auth
    - Input: Zod schema with invitationId
    - Validate invitation belongs to user's organization
    - Update status to CANCELLED via DAL
    - Return updated invitation
  - [ ] 7.6 Implement invitation.resend procedure
    - Use orgProcedure for auth
    - Input: Zod schema with invitationId
    - Validate invitation is PENDING
    - Generate new token with new expiration
    - Update invitation record
    - Resend email with new link
    - Return updated invitation
  - [ ] 7.7 Register invitation router in main router
    - File: `apps/web/src/server/routers/_app.ts`
    - Import invitation router
    - Add to router configuration
  - [ ] 7.8 Ensure invitation procedure tests pass
    - Run ONLY the 2-8 tests written in 7.1
    - Verify all procedures work correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 7.1 pass
- All invitation procedures implemented
- Validation prevents duplicate invitations
- Emails sent on send/resend actions
- Organization isolation enforced
- Router registered in main app router

---

### Phase 4: Frontend - Public Authentication

#### Task Group 8: Authentication Layout & Shared Components

**Dependencies:** Task Group 4

**Role:** Frontend Engineer / UI Developer

- [ ] 8.0 Create public authentication layout and shared UI components
  - [ ] 8.1 Write 2-8 focused tests for auth components
    - Limit to 2-8 highly focused tests maximum
    - Test only critical component behaviors:
      - SignInButton triggers auth flow
      - SignOutButton clears session
      - AuthLayout renders children correctly
      - Form validation displays errors
    - Location: `apps/web/src/__tests__/auth-components.test.tsx`
    - Skip exhaustive interaction testing
  - [ ] 8.2 Create public layout group
    - Directory: `apps/web/src/app/(public)/`
    - Create layout.tsx for unauthenticated pages
    - Remove Sidebar and TopBar (different from auth layout)
    - Centered container with max-width
    - Simple header with logo
  - [ ] 8.3 Create SignInButton component
    - File: `apps/web/src/components/auth/SignInButton.tsx`
    - Use NextAuth signIn function
    - Props: provider (email or google), callbackUrl
    - Use shadcn/ui Button component
    - Show loading state during redirect
  - [ ] 8.4 Create SignOutButton component
    - File: `apps/web/src/components/auth/SignOutButton.tsx`
    - Use NextAuth signOut function
    - Use shadcn/ui Button component
    - Confirm before signing out (optional)
  - [ ] 8.5 Create UserMenu component
    - File: `apps/web/src/components/auth/UserMenu.tsx`
    - Use shadcn/ui DropdownMenu component
    - Display user name and email
    - Display organization name
    - Include sign out option
    - Use lucide-react icons
  - [ ] 8.6 Create authentication form components
    - EmailForm: Input with email validation
    - GoogleButton: "Continue with Google" styled button
    - FormError: Error message display
    - FormSuccess: Success message display
    - Location: `apps/web/src/components/auth/`
  - [ ] 8.7 Ensure auth component tests pass
    - Run ONLY the 2-8 tests written in 8.1
    - Verify components render correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 8.1 pass
- Public layout created without sidebar
- Auth components work correctly
- UserMenu displays session data
- Components use shadcn/ui consistently

---

#### Task Group 9: Login & Signup Pages

**Dependencies:** Task Group 4, 8

**Role:** Frontend Engineer / UI Developer

- [ ] 9.0 Create login and signup pages
  - [ ] 9.1 Write 2-8 focused tests for auth pages
    - Limit to 2-8 highly focused tests maximum
    - Test only critical page behaviors:
      - Login page renders form correctly
      - Signup page renders form correctly
      - Form submission triggers auth flow
      - Validation errors displayed
      - Callback URL preserved in flow
    - Location: `apps/web/src/__tests__/auth-pages.test.tsx`
    - Skip exhaustive flow testing
  - [ ] 9.2 Create login page
    - File: `apps/web/src/app/(public)/login/page.tsx`
    - Server Component with session check
    - Redirect authenticated users to /dashboard
    - Client component for form interactivity
    - Email input with validation
    - "Continue with Google" button
    - Link to signup page
    - Preserve callbackUrl query param
  - [ ] 9.3 Create signup page
    - File: `apps/web/src/app/(public)/signup/page.tsx`
    - Same UI as login page
    - Email input with validation
    - "Continue with Google" button
    - Link to login page
    - Handle new user flow
  - [ ] 9.4 Implement email authentication flow
    - Submit email to NextAuth signIn('email')
    - Show success message: "Check your email"
    - Display email address for confirmation
    - Show resend link after 60 seconds
    - Handle errors gracefully
  - [ ] 9.5 Implement Google OAuth flow
    - Button triggers signIn('google')
    - Show loading state during redirect
    - Include callbackUrl in OAuth state
    - Handle OAuth errors
  - [ ] 9.6 Add responsive design
    - Mobile-first approach
    - Works on 320px to 2560px viewports
    - Touch-friendly button sizes
    - Readable font sizes
  - [ ] 9.7 Add loading and error states
    - Loading spinner during auth
    - Disable form during submission
    - Display validation errors inline
    - Display auth errors from NextAuth
    - Use shadcn/ui Alert component
  - [ ] 9.8 Ensure auth page tests pass
    - Run ONLY the 2-8 tests written in 9.1
    - Verify pages render and work correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 9.1 pass
- Login and signup pages functional
- Email and Google auth work
- Errors displayed clearly
- Responsive design works
- CallbackUrl preserved through flow

---

### Phase 5: Organization & User Onboarding

#### Task Group 10: Organization Creation Flow

**Dependencies:** Task Group 3, 4, 9

**Role:** Frontend Engineer / Full-Stack Developer

- [ ] 10.0 Create organization creation flow for new users
  - [ ] 10.1 Write 2-8 focused tests for org creation
    - Limit to 2-8 highly focused tests maximum
    - Test only critical creation behaviors:
      - Page accessible only to authenticated users without org
      - Form validation works correctly
      - Slug generated from organization name
      - User assigned DPO persona on creation
      - Redirect to dashboard after creation
    - Location: `apps/web/src/__tests__/org-creation.test.tsx`
    - Skip exhaustive validation testing
  - [ ] 10.2 Create create-organization page
    - File: `apps/web/src/app/(public)/create-organization/page.tsx`
    - Server Component with auth check
    - Require authenticated user without organizationId
    - Redirect users with org to /dashboard
    - Show form for organization creation
  - [ ] 10.3 Create organization creation form component
    - File: `apps/web/src/components/organization/CreateOrganizationForm.tsx`
    - Client Component with React Hook Form
    - Input: Organization name (required, min 2 chars)
    - Preview: Generated slug (auto-update on name change)
    - Use shadcn/ui Form, Input, Label, Button components
    - Zod validation schema
  - [ ] 10.4 Create organization creation tRPC procedure
    - File: `apps/web/src/server/routers/organization.ts`
    - Use protectedProcedure (user must be authed but no org yet)
    - Input: Zod schema with name
    - Generate slug using DAL utility
    - Create organization via DAL
    - Update user with organizationId and DPO persona
    - Return organization data
  - [ ] 10.5 Implement form submission flow
    - Call tRPC organization.create mutation
    - Show loading state during creation
    - Handle validation errors
    - Handle creation errors (duplicate slug, etc.)
    - On success: Redirect to /dashboard
    - Update session with new organizationId
  - [ ] 10.6 Add slug generation preview
    - Real-time slug preview as user types name
    - Show final slug that will be created
    - Validate slug uniqueness (optional)
    - Display helpful formatting rules
  - [ ] 10.7 Handle post-auth redirect for new users
    - Update NextAuth signIn callback
    - Check if user has organizationId
    - If not: Redirect to /create-organization
    - If yes: Redirect to /dashboard
    - Preserve original callbackUrl if exists
  - [ ] 10.8 Ensure org creation tests pass
    - Run ONLY the 2-8 tests written in 10.1
    - Verify creation flow works end-to-end
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 10.1 pass
- Page accessible only to authed users without org
- Form validates organization name
- Slug generated correctly
- User assigned DPO persona
- Redirect to dashboard after creation
- Session updated with organizationId

---

#### Task Group 11: Invitation Acceptance Flow

**Dependencies:** Task Group 3, 5, 7, 9

**Role:** Frontend Engineer / Full-Stack Developer

- [ ] 11.0 Create invitation acceptance flow
  - [ ] 11.1 Write 2-8 focused tests for invitation acceptance
    - Limit to 2-8 highly focused tests maximum
    - Test only critical acceptance behaviors:
      - Token validation works correctly
      - Unauthenticated users redirected to login
      - Invitation details displayed correctly
      - Email mismatch shows error
      - Acceptance updates user and invitation
      - Expired invitations show error
    - Location: `apps/web/src/__tests__/invitation-accept.test.tsx`
    - Skip exhaustive error case testing
  - [ ] 11.2 Create invite acceptance page
    - File: `apps/web/src/app/(public)/invite/[token]/page.tsx`
    - Server Component with token parameter
    - Fetch invitation by token via tRPC
    - Check if user authenticated
    - If not: Redirect to /login with callbackUrl
    - If yes: Show invitation details
  - [ ] 11.3 Create invitation.getByToken procedure
    - File: Add to `apps/web/src/server/routers/invitation.ts`
    - Use publicProcedure (no auth required initially)
    - Input: Zod schema with token
    - Fetch invitation by token via DAL
    - Include organization name and inviter name
    - Validate token exists and status is PENDING
    - Validate not expired
    - Return invitation data or error
  - [ ] 11.4 Create invitation details display
    - Component: `InvitationDetails.tsx`
    - Show organization name
    - Show invited by (inviter name and email)
    - Show assigned persona/role
    - Show expiration date
    - Use shadcn/ui Card component
  - [ ] 11.5 Create invitation.accept procedure
    - Add to invitation router
    - Use protectedProcedure (must be authenticated)
    - Input: Zod schema with token
    - Validate user email matches invitation email
    - Validate invitation still PENDING and not expired
    - Update user with organizationId and persona via DAL
    - Update invitation status to ACCEPTED via DAL
    - Return success with organization data
  - [ ] 11.6 Implement acceptance button handler
    - Button triggers invitation.accept mutation
    - Show loading state during acceptance
    - Handle validation errors (email mismatch, expired, etc.)
    - On success: Redirect to /dashboard
    - Update session with new organizationId
  - [ ] 11.7 Handle edge cases
    - Invalid token: Show error, link to signup
    - Expired invitation: Show error, contact inviter
    - Email mismatch: Show error, explain issue
    - Already accepted: Show message, link to login
    - User already has organization: Show error
  - [ ] 11.8 Ensure invitation acceptance tests pass
    - Run ONLY the 2-8 tests written in 11.1
    - Verify acceptance flow works correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 11.1 pass
- Token validation works correctly
- Unauthenticated users redirected properly
- Invitation details displayed
- Email validation enforced
- User updated with organization on acceptance
- Session updated after acceptance
- Error cases handled gracefully

---

### Phase 6: Route Protection & Session Management

#### Task Group 12: Protected Routes Middleware

**Dependencies:** Task Group 4

**Role:** Backend Engineer / Full-Stack Developer

- [ ] 12.0 Implement route protection middleware
  - [ ] 12.1 Write 2-8 focused tests for middleware
    - Limit to 2-8 highly focused tests maximum
    - Test only critical middleware behaviors:
      - Protected routes require authentication
      - Unauthenticated users redirected to login
      - Public routes accessible without auth
      - CallbackUrl preserved in redirect
      - API routes protected correctly
    - Location: `apps/web/src/__tests__/middleware.test.ts`
    - Skip exhaustive route testing
  - [ ] 12.2 Create middleware file
    - File: `apps/web/src/middleware.ts`
    - Import NextAuth middleware helpers
    - Export middleware function
    - Export config for matcher
  - [ ] 12.3 Define protected routes pattern
    - Protect all routes under `/dashboard/*`
    - Protect all routes under `/settings/*`
    - Allow `/api/auth/*` (NextAuth routes)
    - Allow `/login`, `/signup`, `/invite/*`
    - Use Next.js middleware matcher pattern
  - [ ] 12.4 Implement session check logic
    - Use getServerSession in middleware
    - Check if session exists
    - If no session and protected route: Redirect to /login
    - Preserve original URL in callbackUrl query param
    - If session exists: Allow request to proceed
  - [ ] 12.5 Handle post-authentication redirect
    - Check callbackUrl query parameter
    - Validate callbackUrl is internal (security)
    - Redirect to callbackUrl after successful auth
    - Default to /dashboard if no callbackUrl
  - [ ] 12.6 Add organization check for protected routes
    - Verify user has organizationId in session
    - If no organizationId: Redirect to /create-organization
    - Exception: /create-organization itself
  - [ ] 12.7 Ensure middleware tests pass
    - Run ONLY the 2-8 tests written in 12.1
    - Verify route protection works correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 12.1 pass
- Protected routes require authentication
- Unauthenticated users redirected to login
- Public routes accessible
- CallbackUrl preserved and validated
- Organization check enforced
- Session data available to downstream handlers

---

#### Task Group 13: User Session Management UI

**Dependencies:** Task Group 8, 12

**Role:** Frontend Engineer / UI Developer

- [ ] 13.0 Integrate session UI components into application
  - [ ] 13.1 Write 2-8 focused tests for session UI
    - Limit to 2-8 highly focused tests maximum
    - Test only critical session UI behaviors:
      - UserMenu displays correct user data
      - UserMenu displays organization name
      - Sign out button works correctly
      - Session data updates on refresh
    - Location: `apps/web/src/__tests__/session-ui.test.tsx`
    - Skip exhaustive UI variation testing
  - [ ] 13.2 Integrate UserMenu into TopBar
    - File: `apps/web/src/components/layout/TopBar.tsx`
    - Import UserMenu component
    - Get session via getServerSession
    - Pass session data to UserMenu
    - Position in top-right corner
  - [ ] 13.3 Create session provider for client components
    - File: `apps/web/src/components/auth/SessionProvider.tsx`
    - Wrap application with NextAuth SessionProvider
    - Enable session access in Client Components
    - Add to root layout
  - [ ] 13.4 Create useSession hook wrapper
    - File: `apps/web/src/lib/auth/hooks.ts`
    - Re-export useSession from next-auth/react
    - Add TypeScript types for session shape
    - Add helper hooks: useUser, useOrganization
  - [ ] 13.5 Update authenticated layout
    - File: `apps/web/src/app/(auth)/layout.tsx`
    - Verify session exists in layout
    - Redirect if no session (additional safety)
    - Pass session to child components
  - [ ] 13.6 Create session loading states
    - Show loading skeleton while session loads
    - Handle session refresh events
    - Update UI when session changes
  - [ ] 13.7 Add sign out confirmation
    - Optional confirmation dialog before sign out
    - Use shadcn/ui AlertDialog component
    - Clear any client-side state on sign out
  - [ ] 13.8 Ensure session UI tests pass
    - Run ONLY the 2-8 tests written in 13.1
    - Verify session UI works correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 13.1 pass
- UserMenu integrated into TopBar
- Session data displayed correctly
- Sign out works and clears session
- Loading states handled
- TypeScript types correct

---

### Phase 7: Testing & Quality Assurance

#### Task Group 14: Integration Testing

**Dependencies:** All previous task groups

**Role:** QA Engineer / Full-Stack Developer

- [ ] 14.0 Create and run integration tests
  - [ ] 14.1 Review existing tests from previous groups
    - Review database tests from Task 2.1 (2-8 tests)
    - Review DAL tests from Task 3.1 (2-8 tests)
    - Review NextAuth tests from Task 4.1 (2-8 tests)
    - Review email tests from Task 5.1 (2-8 tests)
    - Review tRPC tests from Task 6.1 (2-8 tests)
    - Review invitation tests from Task 7.1 (2-8 tests)
    - Review component tests from Task 8.1 (2-8 tests)
    - Review page tests from Tasks 9.1, 10.1, 11.1 (6-24 tests)
    - Review middleware tests from Task 12.1 (2-8 tests)
    - Review session UI tests from Task 13.1 (2-8 tests)
    - Total existing: approximately 24-96 focused tests
  - [ ] 14.2 Analyze critical workflow gaps
    - Identify end-to-end user workflows lacking coverage
    - Focus on integration points between systems
    - Identify cross-system workflows (auth + db + email)
    - Focus ONLY on this feature's critical paths
    - Do NOT assess entire application coverage
  - [ ] 14.3 Write up to 10 additional integration tests maximum
    - Add maximum 10 tests for critical workflow gaps
    - Test end-to-end flows:
      - Complete signup → org creation → dashboard flow
      - Complete invitation send → accept → login flow
      - Email magic link → auth → session creation flow
      - Google OAuth → account linking → session flow
      - Session expiration → redirect → re-auth flow
    - Location: `apps/web/src/__tests__/integration/auth-workflows.test.ts`
    - Do NOT write exhaustive coverage
    - Skip edge cases not critical to user success
  - [ ] 14.4 Run all authentication feature tests
    - Run all tests written in task groups 1-14
    - Expected total: approximately 34-106 tests maximum
    - Verify critical workflows pass
    - Do NOT run entire application test suite
    - Fix any failing tests
  - [ ] 14.5 Test database migrations
    - Run migrations on fresh database
    - Verify all tables created correctly
    - Test migration rollback works
    - Verify indexes created
  - [ ] 14.6 Test email deliverability
    - Send test magic link email
    - Send test invitation email
    - Verify emails received (check spam)
    - Verify links work correctly
    - Test with real Resend API key
  - [ ] 14.7 Manual testing of critical flows
    - Complete signup with email
    - Complete signup with Google
    - Create organization
    - Send invitation
    - Accept invitation
    - Login with existing account
    - Sign out
    - Access protected routes
    - Session persistence across refresh

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 34-106 tests total)
- No more than 10 additional integration tests added
- Critical end-to-end workflows tested
- Database migrations work correctly
- Email delivery confirmed
- Manual testing checklist completed

---

#### Task Group 15: Documentation & Cleanup

**Dependencies:** Task Group 14

**Role:** Technical Writer / Developer

- [ ] 15.0 Document authentication system
  - [ ] 15.1 Create authentication setup guide
    - File: `docs/authentication.md`
    - Document NextAuth.js configuration
    - Document environment variables needed
    - Document Google OAuth setup process
    - Document Resend setup process
    - Include troubleshooting section
  - [ ] 15.2 Document authentication flows
    - Diagram: Sign up with new organization
    - Diagram: Sign up with invitation
    - Diagram: Login existing user
    - Diagram: Send and accept invitation
    - Include sequence diagrams
  - [ ] 15.3 Document tRPC authentication patterns
    - Explain protectedProcedure usage
    - Explain orgProcedure usage
    - Show example of creating authenticated endpoint
    - Document session shape and TypeScript types
  - [ ] 15.4 Update README with auth information
    - Add authentication section to main README
    - Link to detailed docs
    - Add setup instructions
    - Add common issues and solutions
  - [ ] 15.5 Add inline code comments
    - Document complex NextAuth callbacks
    - Document middleware logic
    - Document session extraction
    - Document tRPC context creation
  - [ ] 15.6 Create migration guide
    - Document running migrations
    - Document seeding test data
    - Document database reset process
  - [ ] 15.7 Clean up console logs and debug code
    - Remove development console.logs
    - Remove commented-out code
    - Remove unused imports
    - Run linter and fix issues
  - [ ] 15.8 Update .env.example
    - Ensure all auth variables documented
    - Add helpful comments
    - Include example values where safe
    - Document how to obtain credentials

**Acceptance Criteria:**
- Authentication documentation complete
- Flow diagrams created
- README updated
- Code comments added
- No debug code remaining
- Linter passes
- .env.example up to date

---

### Phase 8: Invitation Management UI (Optional Enhancement)

#### Task Group 16: Team Management Pages

**Dependencies:** Task Group 7, 13

**Role:** Frontend Engineer / Full-Stack Developer

**Note:** This task group is optional for MVP. Can be implemented after core authentication is complete.

- [ ] 16.0 Create team invitation management UI
  - [ ] 16.1 Write 2-8 focused tests for team management UI
    - Limit to 2-8 highly focused tests maximum
    - Test only critical team management behaviors:
      - Invitation list displays correctly
      - Send invitation form validates
      - Cancel invitation works
      - Resend invitation works
    - Location: `apps/web/src/__tests__/team-management.test.tsx`
    - Skip exhaustive UI testing
  - [ ] 16.2 Create team settings page
    - File: `apps/web/src/app/(auth)/settings/team/page.tsx`
    - Use orgProcedure to fetch team members
    - Display current team members
    - Show pending invitations
    - "Invite Team Member" button
  - [ ] 16.3 Create invite team member dialog
    - Component: `InviteTeamMemberDialog.tsx`
    - Form with email and persona inputs
    - Use shadcn/ui Dialog component
    - Validate email format
    - Submit via invitation.send mutation
    - Show success/error messages
  - [ ] 16.4 Create pending invitations list
    - Component: `PendingInvitationsList.tsx`
    - Fetch via invitation.list procedure
    - Display email, persona, status, sent date
    - Show days until expiration
    - Actions: Cancel, Resend
    - Use shadcn/ui Table component
  - [ ] 16.5 Implement cancel invitation
    - Button calls invitation.cancel mutation
    - Confirm before cancelling
    - Update list after cancellation
    - Show success toast
  - [ ] 16.6 Implement resend invitation
    - Button calls invitation.resend mutation
    - Show loading state
    - Update list with new expiration
    - Show success toast
  - [ ] 16.7 Add team member list
    - Display all users in organization
    - Show name, email, persona
    - Show when they joined
    - Use shadcn/ui Table component
  - [ ] 16.8 Ensure team management tests pass
    - Run ONLY the 2-8 tests written in 16.1
    - Verify team management UI works
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 16.1 pass
- Team settings page created
- Invitation sending works
- Pending invitations listed
- Cancel and resend work
- Team members displayed
- All interactions use tRPC procedures

---

## Execution Strategy

### Recommended Implementation Sequence

1. **Phase 1: Foundation Setup** (Task Groups 1-3)
   - Set up dependencies and environment
   - Extend database schema
   - Create DAL functions
   - **Estimated time:** 1-2 days

2. **Phase 2: Authentication Core** (Task Groups 4-5)
   - Configure NextAuth.js
   - Set up email integration
   - **Estimated time:** 2-3 days

3. **Phase 3: tRPC Integration** (Task Groups 6-7)
   - Create authenticated context
   - Build invitation system backend
   - **Estimated time:** 1-2 days

4. **Phase 4: Frontend - Public Authentication** (Task Groups 8-9)
   - Build auth layout and components
   - Create login/signup pages
   - **Estimated time:** 2-3 days

5. **Phase 5: Organization & User Onboarding** (Task Groups 10-11)
   - Build org creation flow
   - Build invitation acceptance flow
   - **Estimated time:** 2-3 days

6. **Phase 6: Route Protection & Session Management** (Task Groups 12-13)
   - Implement middleware
   - Integrate session UI
   - **Estimated time:** 1-2 days

7. **Phase 7: Testing & Quality Assurance** (Task Groups 14-15)
   - Run integration tests
   - Complete documentation
   - **Estimated time:** 2-3 days

8. **Phase 8: Optional Enhancement** (Task Group 16)
   - Build team management UI
   - **Estimated time:** 1-2 days (optional)

### Total Estimated Time
- **Core MVP:** 11-18 days
- **With optional team management UI:** 12-20 days

---

## Testing Summary

### Test-Driven Approach

Each task group follows this pattern:
1. **Write 2-8 focused tests** at the start (x.1 sub-task)
2. **Implement features** to make tests pass
3. **Run ONLY those tests** at the end to verify (final sub-task)
4. **DO NOT run** entire application test suite during development

### Final Testing Phase

Task Group 14 consolidates all testing:
- **Review** all tests from groups 1-13 (approximately 24-96 tests)
- **Analyze** critical workflow gaps
- **Add maximum 10 integration tests** to fill critical gaps
- **Total expected tests:** 34-106 tests covering this feature
- **Run feature-specific tests only**, not entire application suite

### Test Categories

- **Unit Tests:** DAL functions, utilities, validation
- **Integration Tests:** tRPC procedures, NextAuth flows, database operations
- **Component Tests:** React components, forms, UI interactions
- **End-to-End Tests:** Complete user workflows (signup → dashboard)
- **Manual Tests:** Email delivery, OAuth flows, session persistence

---

## Dependency Graph

```
Task Group 1 (Setup)
    ↓
Task Group 2 (Database Schema)
    ↓
Task Group 3 (DAL Functions)
    ↓
Task Group 4 (NextAuth Config) ← Task Group 5 (Email)
    ↓
Task Group 6 (tRPC Auth Context)
    ↓
Task Group 7 (Invitation tRPC) ← Task Group 3
    ↓
Task Group 8 (Auth Components) ← Task Group 4
    ↓
Task Group 9 (Login/Signup) ← Task Group 8
    ↓
Task Group 10 (Org Creation) ← Task Groups 3, 4, 9
    ↓
Task Group 11 (Invitation Accept) ← Task Groups 3, 5, 7, 9
    ↓
Task Group 12 (Middleware) ← Task Group 4
    ↓
Task Group 13 (Session UI) ← Task Groups 8, 12
    ↓
Task Group 14 (Integration Testing) ← All previous groups
    ↓
Task Group 15 (Documentation) ← Task Group 14
    ↓
Task Group 16 (Team Management UI - Optional) ← Task Groups 7, 13
```

---

## Key Considerations

### Security
- All sensitive operations protected by authentication
- Organization isolation enforced at tRPC layer
- Secure token generation for invitations and magic links
- CSRF protection via NextAuth.js
- Environment variable validation

### Performance
- Database sessions acceptable for MVP scale
- Prisma connection pooling configured
- Future: Redis session caching
- Indexed database queries for invitations

### User Experience
- Passwordless authentication reduces friction
- Google OAuth for convenience
- Clear error messages and validation
- Loading states for all async operations
- Responsive design for mobile and desktop

### Maintainability
- TypeScript types throughout
- tRPC for type-safe API
- Reusable components with shadcn/ui
- Comprehensive documentation
- Focused test coverage for critical paths

### Scalability
- Single organization membership simplifies MVP
- Easy to extend to multi-org in future
- tRPC procedures follow consistent patterns
- Database schema supports future features
