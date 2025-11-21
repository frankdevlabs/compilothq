# Spec Requirements: Authentication Foundation with NextAuth.js v5

## Initial Description

Set up NextAuth.js with email magic links and Google OAuth, configure Prisma adapter for User and session management, implement organization context in session, create login/signup UI components with organization creation flow, set up protected route middleware injecting user and organizationId into requests, and test session management and organization switching to secure all application features.

## Requirements Discussion

### Initial Architecture Questions

**Q1: Organization Membership Model**
Should users be able to belong to multiple organizations, or is single organization membership sufficient for MVP?

**Answer:** Single organization membership. Users belong to ONE organization only. Keep the current schema with `User.organizationId` as a simple foreign key. Multi-org membership is OUT OF SCOPE for this spec (future enhancement).

**Q2: Invitation System**
Do we need an invitation system for users to join existing organizations?

**Answer:** Yes, implement a complete invitation system with the following capabilities:
- Send invitations to join an existing organization
- Accept invitations
- List pending invitations (sent and received)
- Cancel invitations
- Resend invitations

Users can either:
1. Create a new organization (becomes the first member)
2. Accept an invite to join an existing organization

**Q3: Session Storage Strategy**
Should sessions be stored in the database or use JWT tokens?

**Answer:** Use database sessions via Prisma adapter. This provides:
- Better security (ability to revoke sessions)
- Session metadata tracking
- Audit trail for compliance requirements
- Alignment with product's data governance focus

**Q4: Session Context**
What user information should be included in the session?

**Answer:** Session should include:
- User ID
- User email
- User name
- Organization ID (single value, not array)
- Primary persona/role (UserPersona enum)

**Q5: tRPC Integration**
How should authentication integrate with the future tRPC API layer?

**Answer:** Create authenticated context pattern:
- Session data automatically injected into tRPC context
- `orgProcedure` middleware that filters all queries by the user's single organizationId
- Authorization middleware ensuring all database queries include organization isolation
- Type-safe context available to all tRPC procedures

**Q6: Authentication Methods**
Which authentication methods should be supported in MVP?

**Answer:** Two methods:
1. **Email Magic Links** (passwordless) - Primary method
2. **Google OAuth** - Secondary convenience method

SAML SSO is explicitly OUT OF SCOPE for MVP (future enterprise phase).

**Q7: Protected Routes**
Which routes require authentication vs. public access?

**Answer:**
- **Public routes:** `/login`, `/signup`, `/verify-email`, `/api/auth/*` (NextAuth.js callbacks)
- **Protected routes:** Everything else under `/dashboard/*` and all tRPC procedures
- Middleware should redirect unauthenticated users to `/login`
- Post-login redirect to `/dashboard` or intended destination

**Q8: New User Experience**
What happens when a user signs up for the first time?

**Answer:** Two flows:

**Flow A - Create New Organization:**
1. User signs up with email/Google
2. Presented with organization creation form
3. Required fields: organization name (generates slug automatically)
4. Optional fields: organization settings
5. User becomes first member with DPO persona
6. Redirect to `/dashboard`

**Flow B - Accept Invitation:**
1. User clicks invite link with token
2. If not authenticated, prompted to sign in/sign up
3. After auth, invitation is automatically accepted
4. User joins existing organization with invited persona
5. Redirect to `/dashboard`

### Existing Code to Reference

**Similar Features Identified:**
No similar authentication features identified in the current codebase. This is the foundational authentication implementation for the entire application.

**Existing Models to Build Upon:**
- `User` model (already defined in schema with organizationId FK)
- `Organization` model (already defined with status and soft delete)
- `UserPersona` enum (already defined with 6 roles)
- `OrganizationStatus` enum (already defined)

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No design mockups provided. Implementation should follow:
- shadcn/ui component patterns (existing in tech stack)
- Next.js App Router best practices
- Standard authentication UI patterns (centered forms, clear CTAs)
- Professional compliance software aesthetic

## Requirements Summary

### Functional Requirements

#### Authentication Core
- NextAuth.js v5 (Auth.js) implementation with Prisma adapter
- Email magic link authentication via Resend
- Google OAuth authentication
- Database session storage (not JWT)
- Email verification workflow
- Session management with automatic refresh
- Secure session handling with HttpOnly cookies

#### Database Schema Extensions
New tables required (NextAuth.js standard):
- `Account` - OAuth provider accounts linked to users
- `Session` - Database-stored sessions with expiration
- `VerificationToken` - Email verification and magic link tokens

New tables required (Invitation system):
- `Invitation` - Invitation records with token, email, organizationId, status, invitedBy, expiresAt
- Enum: `InvitationStatus` (PENDING, ACCEPTED, EXPIRED, CANCELLED)

Schema modifications:
- No changes to existing `User` model (organizationId FK stays)
- No changes to `Organization` model

#### User Flows

**Flow 1: Sign Up with New Organization**
1. User visits `/signup`
2. Chooses email or Google OAuth
3. Email flow: Enter email → Receive magic link → Click link → Verify
4. Google flow: Click "Continue with Google" → OAuth redirect → Return
5. After authentication: Display organization creation form
6. User fills: Organization name (required)
7. System generates: Slug from name (e.g., "Acme Corp" → "acme-corp")
8. System creates: Organization record, User record with DPO persona
9. Redirect to: `/dashboard`

**Flow 2: Sign Up with Invitation**
1. User receives invitation email with magic link containing token
2. User clicks link → Lands on `/invite/[token]`
3. System validates: Token exists, not expired, not already accepted
4. If not authenticated: Redirect to `/login?callbackUrl=/invite/[token]`
5. After authentication: Display invitation details (org name, invited by, role)
6. User clicks "Accept Invitation"
7. System validates: Email matches invitation email
8. System creates: User record with organizationId from invitation
9. System updates: Invitation status to ACCEPTED
10. Redirect to: `/dashboard`

**Flow 3: Login (Existing User)**
1. User visits `/login`
2. Chooses email or Google OAuth
3. Email flow: Enter email → Receive magic link → Click link → Authenticate
4. Google flow: Click "Continue with Google" → OAuth redirect → Return
5. System loads: Existing user record with organizationId
6. System creates: Session with user + organization context
7. Redirect to: `/dashboard` or original destination

**Flow 4: Send Invitation**
1. DPO/Privacy Officer visits `/settings/team` (future page)
2. Clicks "Invite Team Member"
3. Fills form: Email (required), Role/Persona (required)
4. System validates: Email not already member, no pending invitation
5. System creates: Invitation record with token, expiresAt (7 days)
6. System sends: Email via Resend with invitation link
7. Invitation appears: In sent invitations list with status

**Flow 5: Manage Invitations**
1. User visits `/settings/team/invitations`
2. Views: Pending invitations sent (with cancel/resend)
3. Actions: Cancel invitation, Resend invitation email
4. System updates: Status or resends email via Resend

#### Protected Routes & Middleware
- Middleware: Check session on every request to `/dashboard/*`
- No session: Redirect to `/login?callbackUrl=[original-url]`
- Session exists: Allow request, inject user context
- API routes: All tRPC procedures check session
- Public routes: `/`, `/login`, `/signup`, `/invite/[token]`, `/api/auth/*`

#### tRPC Integration Patterns
- Create `createTRPCContext` function extracting session from NextAuth.js
- Session data: `{ user: { id, email, name, organizationId, primaryPersona } }`
- Create `publicProcedure` (no auth required)
- Create `protectedProcedure` (requires session, throws if none)
- Create `orgProcedure` (extends protectedProcedure, auto-filters by organizationId)
- All database queries: Include `where: { organizationId: ctx.session.user.organizationId }`
- Type safety: Session shape defined in TypeScript, shared across app

#### UI Components Needed
- `/app/(auth)/login/page.tsx` - Login page with email + Google options
- `/app/(auth)/signup/page.tsx` - Sign up page with email + Google options
- `/app/(auth)/create-organization/page.tsx` - Org creation form for new users
- `/app/(auth)/invite/[token]/page.tsx` - Invitation acceptance page
- `/app/api/auth/[...nextauth]/route.ts` - NextAuth.js API route handler
- `@/components/auth/SignInButton.tsx` - Reusable sign-in button
- `@/components/auth/SignOutButton.tsx` - Reusable sign-out button
- `@/components/auth/UserMenu.tsx` - User dropdown with profile/logout
- `@/middleware.ts` - Route protection middleware

#### Email Templates (React Email)
- `magic-link-email.tsx` - Email magic link template
- `invitation-email.tsx` - Organization invitation template
- `invitation-reminder-email.tsx` - Invitation reminder template

### Reusability Opportunities
- No existing authentication patterns to reuse
- This spec creates the foundation for all future features
- Patterns established here (orgProcedure, session context) will be used throughout the app
- UI components will follow shadcn/ui patterns already in tech stack

### Scope Boundaries

#### In Scope
- NextAuth.js v5 setup with Prisma adapter
- Email magic link authentication
- Google OAuth authentication
- Database session storage
- Organization creation during signup
- Single organization membership per user
- Invitation system (send, accept, list, cancel, resend)
- Protected route middleware
- tRPC authenticated context
- Session with organizationId
- Basic user profile (name, email, persona)
- Email sending via Resend
- NextAuth.js database tables (Account, Session, VerificationToken)
- Invitation database table

#### Out of Scope
- Multi-organization membership (future enhancement)
- Organization switching UI (no need with single-org)
- SAML SSO (future enterprise phase)
- Password-based authentication (magic links only)
- Two-factor authentication (2FA/MFA)
- Social OAuth beyond Google (GitHub, Microsoft, etc.)
- User profile editing UI (future)
- Organization settings management UI (future)
- Role/persona management UI (future)
- Audit logging of auth events (future)
- Rate limiting on auth endpoints (future)
- CAPTCHA on signup (future)
- Account deletion flow (future)
- Session device management (future)
- Email change workflow (future)

### Technical Considerations

#### Technology Stack
- **Framework:** Next.js 16 App Router
- **Auth Library:** NextAuth.js v5 (Auth.js)
- **Database:** PostgreSQL 17 via Prisma ORM
- **Email Provider:** Resend with React Email templates
- **UI Framework:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS 4
- **Validation:** Zod schemas
- **API Layer:** tRPC v11 (future integration)
- **Session Storage:** Database (Prisma adapter)

#### Integration Points
- **Prisma Schema:** Extend with NextAuth.js models (Account, Session, VerificationToken)
- **Prisma Schema:** Add Invitation model with InvitationStatus enum
- **Environment Variables:** Add NextAuth.js config (NEXTAUTH_SECRET, NEXTAUTH_URL)
- **Environment Variables:** Add Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- **Environment Variables:** Add Resend API key (RESEND_API_KEY)
- **tRPC Context:** Session extraction from NextAuth.js
- **Middleware:** Extend for route protection
- **Email Service:** Resend API for magic links and invitations

#### Database Schema Additions

**NextAuth.js Tables (Standard):**
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Invitation System:**
```prisma
enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
}

model Invitation {
  id             String           @id @default(cuid())
  email          String
  token          String           @unique
  organizationId String
  invitedBy      String
  invitedPersona UserPersona      @default(BUSINESS_OWNER)
  status         InvitationStatus @default(PENDING)
  expiresAt      DateTime
  acceptedAt     DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  inviter      User         @relation("InvitationsSent", fields: [invitedBy], references: [id])

  @@index([email, status])
  @@index([organizationId, status])
  @@index([token])
  @@index([expiresAt])
}
```

**User Model Relations (additions):**
```prisma
model User {
  // ... existing fields ...

  // New relations
  accounts          Account[]
  sessions          Session[]
  invitationsSent   Invitation[] @relation("InvitationsSent")
}
```

**Organization Model Relations (additions):**
```prisma
model Organization {
  // ... existing fields ...

  // New relations
  invitations Invitation[]
}
```

#### Security Requirements
- CSRF protection (NextAuth.js built-in)
- Secure session cookies (HttpOnly, Secure, SameSite)
- Environment variable validation (Zod schema)
- Magic link token expiration (15 minutes)
- Invitation token expiration (7 days)
- Email verification requirement
- Organization isolation enforcement (all queries filtered)
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (React automatic escaping)

#### Performance Considerations
- Database session lookup on every protected request (acceptable for MVP)
- Session caching in Redis (future optimization)
- Prisma connection pooling (already configured)
- NextAuth.js callbacks optimization (minimal database queries)
- Magic link token generation (crypto.randomBytes)

#### Error Handling
- Invalid magic link token → Show error, allow resend
- Expired magic link → Show error, allow new link
- Invalid invitation token → Show error, redirect to signup
- Expired invitation → Show error, contact inviter
- Email already exists → Friendly error, suggest login
- Google OAuth error → Show error, allow retry
- Session expired → Redirect to login with return URL
- Organization creation failure → Show error, allow retry

### Testing Requirements

#### Unit Tests (Vitest)
- NextAuth.js configuration validation
- Session extraction from request
- Organization slug generation from name
- Invitation token generation and validation
- Email validation logic
- Expiration date calculation
- Role/persona assignment logic

#### Integration Tests (Vitest + Prisma)
- User creation with organization
- Account linking (email + Google for same user)
- Session creation and retrieval
- Invitation creation and acceptance
- Token expiration handling
- Organization isolation enforcement

#### End-to-End Tests (Playwright)
- Complete sign-up flow with magic link
- Complete sign-up flow with Google OAuth
- Complete invitation acceptance flow
- Login with magic link
- Login with Google OAuth
- Logout and session destruction
- Protected route access (authenticated)
- Protected route redirect (unauthenticated)
- Organization creation with valid data
- Organization creation with duplicate slug

#### Security Tests
- CSRF token validation
- Session cookie security attributes
- Magic link token uniqueness
- Invitation token uniqueness
- Token expiration enforcement
- Organization data isolation (user cannot access other org's data)
- SQL injection attempts (Prisma should prevent)

#### Manual Testing Checklist
- [ ] Sign up with email magic link
- [ ] Sign up with Google OAuth
- [ ] Create organization with valid name
- [ ] Receive and click magic link email
- [ ] Send invitation to new user
- [ ] Accept invitation as new user
- [ ] Login with existing credentials
- [ ] Logout successfully
- [ ] Access protected route when authenticated
- [ ] Get redirected when accessing protected route unauthenticated
- [ ] Session persists across browser refresh
- [ ] Session expires after configured time
- [ ] Google OAuth connects existing email account
- [ ] Cancel pending invitation
- [ ] Resend invitation email
- [ ] Expired invitation shows error
- [ ] Expired magic link shows error

## Architecture Decisions Summary

### 1. Single Organization Membership
**Decision:** Users belong to ONE organization only via `User.organizationId` foreign key.

**Rationale:**
- Simplifies data model and queries
- Sufficient for MVP and target market
- Most Compilo users work for a single organization
- Reduces complexity in session management
- No need for organization switching UI

**Implications:**
- No `UserOrganization` junction table needed
- Session includes single `organizationId` value
- tRPC `orgProcedure` filters by single organization
- Invitations assign user to one organization
- Future multi-org support would require schema migration

### 2. Database Sessions (Not JWT)
**Decision:** Store sessions in PostgreSQL via Prisma adapter.

**Rationale:**
- Better security (can revoke sessions server-side)
- Compliance audit trail requirements
- Session metadata tracking
- Aligns with product's data governance focus
- Acceptable performance for MVP scale

**Implications:**
- Database query on every protected request
- Session table grows with active users
- Future optimization: Redis session cache
- Can track session device/location metadata

### 3. Invitation System Included in MVP
**Decision:** Full invitation workflow in initial implementation.

**Rationale:**
- Essential for team collaboration in compliance software
- Privacy teams typically have 2-5 members
- Self-service team building reduces support burden
- Standard pattern users expect

**Implications:**
- Additional database table (Invitation)
- Email templates for invitations
- UI for invitation management
- Token generation and validation logic

### 4. Email Magic Links as Primary Auth
**Decision:** Passwordless authentication via magic links, with Google OAuth as secondary.

**Rationale:**
- Better security (no password leaks/reuse)
- Better UX (no password to remember)
- Standard for modern B2B SaaS
- Reduces support burden (no password resets)
- Google OAuth for user convenience

**Implications:**
- Requires email provider (Resend)
- Magic link expiration handling (15 minutes)
- Email deliverability dependency
- Google OAuth configuration required

### 5. tRPC Authenticated Context Pattern
**Decision:** Session data automatically injected into tRPC context with organization filtering.

**Rationale:**
- Type-safe API layer
- Automatic organization isolation
- DRY principle (auth check once)
- Enforces multi-tenancy at API layer
- Prevents cross-organization data leaks

**Implications:**
- All tRPC procedures have access to session
- `orgProcedure` middleware ensures organization filtering
- TypeScript types shared between client and server
- Future features automatically get auth context

### 6. DPO as Default Persona for Org Creators
**Decision:** First user who creates organization gets DPO persona.

**Rationale:**
- DPO has highest privileges in compliance software
- Org creator needs full access to invite team
- Aligns with compliance team structure (DPO leads)
- Can delegate to Privacy Officers after team joins

**Implications:**
- Automatic DPO assignment on org creation
- Invited users get assigned persona from invitation
- Future: DPO can change personas in settings

### 7. 7-Day Invitation Expiration
**Decision:** Invitation links expire after 7 days.

**Rationale:**
- Balance between convenience and security
- Sufficient time for email delivery and response
- Prevents stale invitations accumulating
- Can resend if expired

**Implications:**
- Expiration date calculation on invitation creation
- Cron job or API check to mark expired (future)
- Resend invitation creates new token with new expiration
- UI shows days remaining on pending invitations
