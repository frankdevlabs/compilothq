# Raw Idea

**Feature Title:** tRPC API Layer with Auth Context

**Description:** Set up tRPC v11 server with Next.js App Router integration, create authenticated context injecting user and organizationId from session, implement base router structure organized by domain (processing activities, assessments, vendors), create Zod validation schemas for Organization and User entities, implement authorization middleware ensuring all queries filter by organizationId, set up tRPC client with TanStack Query, and implement error handling to enable type-safe, authorized API communication.

**Size:** Medium (M)
