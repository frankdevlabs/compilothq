# Authentication System Documentation

## Overview

Compilo uses NextAuth.js v5 (Auth.js) for authentication with a database session strategy. The system supports two authentication methods:

1. **Email Magic Links** (Primary) - Passwordless authentication via Resend
2. **Google OAuth** (Secondary) - OAuth 2.0 authentication for convenience

## Architecture

### Key Components

- **NextAuth.js v5**: Core authentication library
- **Prisma Adapter**: Database session storage for security and audit trail
- **Resend**: Email delivery service for magic links and invitations
- **tRPC Integration**: Authenticated context for API procedures
- **Route Protection**: Middleware for protecting authenticated routes

### Database Models

#### NextAuth.js Standard Models

```prisma
model Account {
  // OAuth provider accounts (Google, etc.)
  id                String   @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  // ... OAuth tokens
}

model Session {
  // Database-stored sessions
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
}

model VerificationToken {
  // Email magic link tokens
  identifier String
  token      String   @unique
  expires    DateTime
}
```

#### Invitation System

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
  invitedPersona UserPersona
  status         InvitationStatus @default(PENDING)
  expiresAt      DateTime
  acceptedAt     DateTime?
  // ... timestamps and relations
}
```

## Environment Setup

### Required Environment Variables

```bash
# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"

# Resend Email API
RESEND_API_KEY="<your-resend-api-key>"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/compilothq"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### Resend Setup

1. Sign up at [Resend](https://resend.com/)
2. Verify your sending domain
3. Generate API key
4. Add to `.env` as `RESEND_API_KEY`

## Authentication Flows

### Flow 1: Sign Up with New Organization

```
User visits /signup
     ↓
Chooses authentication method
     ↓
┌──────────────┬──────────────┐
│ Email        │ Google OAuth │
│ Magic Link   │              │
└──────┬───────┴──────┬───────┘
       ↓              ↓
   Verify Email   OAuth Redirect
       ↓              ↓
   ├──────────────────┤
   │ Authenticated    │
   └────────┬─────────┘
            ↓
   /create-organization
            ↓
   Enter organization name
            ↓
   System creates:
   - Organization (ACTIVE)
   - User (DPO persona)
            ↓
   Redirect to /dashboard
```

### Flow 2: Sign Up with Invitation

```
User receives invitation email
     ↓
Clicks invitation link
     ↓
Lands on /invite/[token]
     ↓
Not authenticated? → Redirect to /login
     ↓
Authenticate via email or Google
     ↓
Return to /invite/[token]
     ↓
View invitation details:
- Organization name
- Invited by
- Assigned role/persona
     ↓
Click "Accept Invitation"
     ↓
System validates:
- Email matches invitation
- Token is valid and not expired
     ↓
Create/update user:
- Assign organizationId
- Assign invited persona
     ↓
Update invitation status to ACCEPTED
     ↓
Redirect to /dashboard
```

### Flow 3: Login (Existing User)

```
User visits /login
     ↓
Chooses authentication method
     ↓
┌──────────────┬──────────────┐
│ Email        │ Google OAuth │
│ Magic Link   │              │
└──────┬───────┴──────┬───────┘
       ↓              ↓
   Click link     OAuth flow
       ↓              ↓
   ├──────────────────┤
   │ Session created  │
   └────────┬─────────┘
            ↓
   Load user with organizationId
            ↓
   Redirect to /dashboard or callbackUrl
```

### Flow 4: Send Invitation

```
DPO/Admin visits team settings
     ↓
Click "Invite Team Member"
     ↓
Fill form:
- Email (required)
- Role/Persona (required)
     ↓
System validates:
- Email not already a member
- No pending invitation exists
     ↓
Create invitation:
- Generate secure token (32 bytes)
- Set expiresAt (7 days)
- Status: PENDING
     ↓
Send email via Resend:
- Organization name
- Inviter name
- Invitation link with token
- Role being offered
     ↓
Invitation appears in "Sent Invitations" list
```

### Flow 5: Manage Invitations

```
User visits /settings/team
     ↓
View pending invitations:
- Email
- Role
- Sent date
- Expires in X days
- Status
     ↓
Available actions:
┌──────────────┬──────────────┐
│ Cancel       │ Resend       │
└──────┬───────┴──────┬───────┘
       ↓              ↓
   Update status  Generate new token
   to CANCELLED   Update expiresAt
                  Resend email
```

## Route Protection

### Protected Routes

All routes under the following paths require authentication:

- `/dashboard/*`
- `/settings/*`
- `/questionnaires/*`
- `/activities/*`
- `/documents/*`

### Public Routes

These routes are accessible without authentication:

- `/` (landing page)
- `/login`
- `/signup`
- `/invite/[token]`
- `/api/auth/*` (NextAuth.js callbacks)

### Middleware Implementation

The authentication middleware uses Next.js 16's `proxy.ts` (formerly `middleware.ts`):

```typescript
// apps/web/src/proxy.ts
import { auth } from '@/lib/auth/middleware'

export default auth

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)'],
}
```

### Redirect Behavior

- **Unauthenticated access to protected route**: Redirect to `/login?callbackUrl=[original-url]`
- **Authenticated access to public route**: Allow (no redirect)
- **After successful login**: Redirect to `callbackUrl` or `/dashboard`

## tRPC Integration

### Authenticated Context

The tRPC context automatically extracts and includes session data:

```typescript
// apps/web/src/server/context.ts
export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await getServerSession(authConfig)

  return {
    session,
    // Session includes:
    // - user.id
    // - user.email
    // - user.name
    // - user.organizationId
    // - user.primaryPersona
    // - user.organization (id, name, slug)
  }
}
```

### Authentication Procedures

#### `publicProcedure`

No authentication required. Available to all users.

```typescript
export const myPublicProcedure = publicProcedure
  .input(
    z.object({
      /* ... */
    })
  )
  .query(async ({ input }) => {
    // No session check
    return {
      /* ... */
    }
  })
```

#### `protectedProcedure`

Requires authenticated session. Throws `UNAUTHORIZED` if no session exists.

```typescript
export const myProtectedProcedure = protectedProcedure
  .input(
    z.object({
      /* ... */
    })
  )
  .query(async ({ ctx, input }) => {
    // ctx.session is guaranteed to exist
    const userId = ctx.session.user.id
    return {
      /* ... */
    }
  })
```

#### `orgProcedure`

Extends `protectedProcedure` with automatic organization filtering. Use this for all queries that need multi-tenancy isolation.

```typescript
export const myOrgProcedure = orgProcedure
  .input(
    z.object({
      /* ... */
    })
  )
  .query(async ({ ctx, input }) => {
    // ctx.session.user.organizationId is guaranteed
    const orgId = ctx.session.user.organizationId

    // Always filter by organization
    return await prisma.someModel.findMany({
      where: {
        organizationId: orgId, // CRITICAL for multi-tenancy
        // ... other filters
      },
    })
  })
```

### Best Practices

1. **Always use `orgProcedure`** for queries that involve organization data
2. **Never trust client-provided organizationId** - always use `ctx.session.user.organizationId`
3. **Use TypeScript** - session types are fully inferred
4. **Test isolation** - verify queries can't access other organizations' data

## Invitation System

### DAL Functions

Located in `packages/database/src/dal/invitations.ts`:

```typescript
// Create invitation
createInvitation({
  email: string
  organizationId: string
  invitedBy: string
  invitedPersona: UserPersona
})

// Find by token
findInvitationByToken(token: string)

// Accept invitation
acceptInvitation(token: string)

// Cancel invitation
cancelInvitation(id: string)

// Resend invitation
resendInvitation(id: string)

// List organization's invitations
listInvitationsByOrganization(
  organizationId: string,
  options?: { status?: InvitationStatus }
)
```

### tRPC Procedures

Located in `apps/web/src/server/routers/invitation.ts`:

```typescript
// Send invitation
invitation.send

// Get invitation by token (public)
invitation.getByToken

// Accept invitation
invitation.accept

// List invitations (org-scoped)
invitation.list

// Cancel invitation
invitation.cancel

// Resend invitation
invitation.resend
```

### Email Templates

Email templates use React Email components and are located in `apps/web/src/emails/`:

- `MagicLinkEmail.tsx` - Email magic link authentication
- `InvitationEmail.tsx` - Organization invitation

## Security Considerations

### Session Security

- **Storage**: Database sessions (not JWT) for revocability
- **Cookies**: HttpOnly, Secure, SameSite=Lax
- **Expiration**: 30 days max age, updates every 24 hours
- **Token**: Unique sessionToken prevents session fixation

### Token Security

- **Magic Links**: 15-minute expiration (NextAuth.js default)
- **Invitations**: 7-day expiration
- **Generation**: Cryptographically secure random bytes (32 bytes)
- **Uniqueness**: Database unique constraint on token field

### Multi-Tenancy Isolation

- **Organization ID**: Always included in session
- **Query Filtering**: `orgProcedure` enforces `where: { organizationId }`
- **Validation**: All invitation actions validate organization membership
- **Database Constraints**: Foreign keys and cascading deletes

### CSRF Protection

- **NextAuth.js**: Built-in CSRF protection on all auth routes
- **Cookies**: `sameSite: 'lax'` prevents cross-site attacks

### Account Linking

Google OAuth accounts can link to existing email-based accounts:

```typescript
Google({
  clientId: config.auth.google.clientId,
  clientSecret: config.auth.google.clientSecret,
  allowDangerousEmailAccountLinking: true, // Same email = same user
})
```

## Error Handling

### Common Errors

| Error                  | Cause                             | Resolution              |
| ---------------------- | --------------------------------- | ----------------------- |
| `UNAUTHORIZED`         | No session in protected procedure | User needs to log in    |
| `FORBIDDEN`            | User lacks permission             | Check user persona/role |
| `Invalid token`        | Expired or invalid invitation     | Request new invitation  |
| `Email already exists` | User already member               | Use existing account    |
| `Duplicate invitation` | Pending invitation exists         | Cancel and resend       |

### Client-Side Error Handling

```typescript
const mutation = trpc.invitation.send.useMutation({
  onError: (error) => {
    if (error.data?.code === 'UNAUTHORIZED') {
      // Redirect to login
    } else if (error.message.includes('duplicate')) {
      // Show "invitation already sent" message
    }
  },
  onSuccess: () => {
    // Show success toast
  },
})
```

## Testing

### Running Tests

```bash
# Run all authentication tests
pnpm --filter @compilothq/web test auth-workflows.test.ts

# Run in watch mode
pnpm --filter @compilothq/web test:watch auth-workflows.test.ts
```

### Test Coverage

Integration tests cover:

- Signup → organization creation → dashboard flow
- Invitation send → accept → login flow
- Invitation management (list, cancel, resend)
- Organization isolation and multi-tenancy
- Email validation and duplicate prevention
- Token security and uniqueness
- Invitation expiration handling
- User persona assignment
- Database schema integrity

### Manual Testing Checklist

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
- [ ] Cancel pending invitation
- [ ] Resend invitation email
- [ ] Expired invitation shows error
- [ ] Expired magic link shows error

## Troubleshooting

### Magic Links Not Received

1. Check Resend dashboard for delivery status
2. Verify `RESEND_API_KEY` is correct
3. Check spam folder
4. Verify sending domain is verified in Resend
5. Check email template rendering

### Google OAuth Errors

1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Check redirect URI matches Google Cloud Console
3. Ensure Google+ API is enabled
4. Verify OAuth consent screen is published

### Session Issues

1. Clear browser cookies
2. Verify `NEXTAUTH_SECRET` is set
3. Check database connection (sessions table)
4. Verify `NEXTAUTH_URL` matches your domain
5. Check session expiration settings

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check database is running
3. Run migrations: `pnpm --filter @compilothq/database db:migrate`
4. Verify Prisma client is generated: `pnpm --filter @compilothq/database db:generate`

### Build Errors

1. Regenerate Prisma client: `pnpm --filter @compilothq/database db:generate`
2. Clear Next.js cache: `rm -rf apps/web/.next`
3. Rebuild packages: `pnpm build`
4. Check TypeScript errors: `pnpm --filter @compilothq/web lint`

## Migration Guide

### From No Auth to NextAuth.js

If migrating an existing application:

1. **Backup database** before running migrations
2. **Run Prisma migration** to add auth tables:
   ```bash
   pnpm --filter @compilothq/database db:migrate
   ```
3. **Update environment variables** with auth credentials
4. **Test in development** thoroughly before production
5. **Migrate existing users** (if any) to new User table
6. **Update protected routes** to use new middleware

### Breaking Changes

- Middleware renamed from `middleware.ts` to `proxy.ts` (Next.js 16)
- Async request APIs required (params, searchParams, cookies, headers)
- Session shape includes `organizationId` and `primaryPersona`

## Additional Resources

- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [Prisma Adapter Documentation](https://authjs.dev/reference/adapter/prisma)
- [Resend Documentation](https://resend.com/docs)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [tRPC Authentication Guide](https://trpc.io/docs/server/authorization)

## Support

For issues or questions:

1. Check this documentation first
2. Review error messages and logs
3. Consult Next.js 16 and NextAuth.js v5 documentation
4. Check GitHub issues for known problems
5. Contact development team
