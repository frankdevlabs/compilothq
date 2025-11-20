# Specification: Organization & User Models with Multi-Tenancy

## Goal

Establish the foundational multi-tenancy architecture for Compilot HQ by implementing Organization and User models with proper isolation, role-based personas, and comprehensive data access patterns. This feature provides the secure foundation upon which all future features will be built.

## User Stories

- As a system architect, I want all data properly isolated by organization so that no tenant can access another tenant's data
- As a developer, I want a clear Data Access Layer pattern so that all future features maintain multi-tenancy security
- As a DPO, I want my organization's users to have assigned personas so that I can track who is responsible for different compliance tasks

## Specific Requirements

**Organization Model with Soft Delete**

- String ID using cuid() for unique, sortable identifiers resistant to collision attacks
- Required name field for organization display in UI (e.g., "Acme Corporation")
- Unique slug field for URL-safe identification (lowercase, derived from name, e.g., "acme-corporation")
- Nullable Json settings field for unstructured organization preferences (will be validated with Zod schemas in future roadmap items 31-34)
- OrganizationStatus enum tracking lifecycle: ACTIVE (fully operational), TRIAL (trial period), SUSPENDED (temporarily disabled), CANCELLED (deactivated)
- Soft delete using deletedAt timestamp to preserve data for audit/recovery while logically removing from active queries
- Automatic timestamps (createdAt, updatedAt) for audit trail
- One-to-many relationship with User model for organization membership

**User Model with NextAuth.js v5 Compatibility**

- String ID using cuid() for consistency with Organization model
- Required name field (non-nullable) for user display throughout application
- Unique email field for authentication and user identification
- Nullable emailVerified timestamp for email verification workflow (used by NextAuth.js)
- Nullable image URL for profile pictures (optional user avatar)
- Required organizationId foreign key establishing multi-tenancy boundary
- Required primaryPersona enum with default BUSINESS_OWNER to ensure every user has an assigned role
- Automatic timestamps (createdAt, updatedAt) for audit trail
- Many-to-one relationship with Organization model

**UserPersona Enum for Role Classification**

- DPO (Data Protection Officer): Highest authority for GDPR compliance decisions and approvals
- PRIVACY_OFFICER (Privacy Manager/Officer): Day-to-day privacy operations and assessment reviews
- BUSINESS_OWNER (Business stakeholder/project manager): Submits processing activities and completes questionnaires
- IT_ADMIN (IT Manager/System Administrator): Technical system management and digital asset oversight
- SECURITY_TEAM (Information Security Officer): Security assessments and risk evaluation
- LEGAL_TEAM (Legal Counsel): Legal review and contract assessment
- Default value: BUSINESS_OWNER (most restrictive persona for new user safety)

**OrganizationStatus Enum for Lifecycle Tracking**

- ACTIVE: Fully operational organization with all features enabled
- TRIAL: Organization in trial period (may have feature or time limitations in future)
- SUSPENDED: Temporarily disabled organization (preserve data, block access)
- CANCELLED: Permanently deactivated organization (retain for compliance, block all access)

**Multi-Tenancy Database Indexes**

- Organization: Index on deletedAt for efficient soft delete filtering in list queries
- User: Compound index [organizationId, primaryPersona] for role-based queries within organizations
- User: Compound index [organizationId, createdAt] for chronological user listing and sorting
- User: Index on email (implicit from @unique constraint) for authentication lookups
- All compound indexes place organizationId first (left-most column principle for PostgreSQL query optimization)

**Foreign Key Cascade Behavior**

- Organization deletion behavior: Set deletedAt timestamp (soft delete preserves data)
- Future organization-owned entities: Will use onDelete: Cascade for hard cascade when organization deleted
- User deletion behavior: To be determined based on future requirements (likely soft delete or restrict)
- Referential integrity enforced at database level via Prisma foreign key constraints

**Comprehensive Seed Data**

- Acme Corp (ACTIVE status): 2 users demonstrating small organization
  - John Doe (john.doe@acme.example.com) - DPO persona
  - Jane Smith (jane.smith@acme.example.com) - BUSINESS_OWNER persona
- Beta Inc (TRIAL status): 5 users demonstrating medium organization
  - Alice Johnson (alice.johnson@beta.example.com) - DPO persona
  - Bob Wilson (bob.wilson@beta.example.com) - PRIVACY_OFFICER persona
  - Carol Martinez (carol.martinez@beta.example.com) - BUSINESS_OWNER persona
  - David Lee (david.lee@beta.example.com) - BUSINESS_OWNER persona
  - Eva Garcia (eva.garcia@beta.example.com) - LEGAL_TEAM persona
- Gamma LLC (ACTIVE status): 10 users demonstrating large organization
  - Frank Brown (frank.brown@gamma.example.com) - DPO persona
  - Grace Taylor (grace.taylor@gamma.example.com) - PRIVACY_OFFICER persona
  - Henry Anderson (henry.anderson@gamma.example.com) - PRIVACY_OFFICER persona
  - Iris Thomas (iris.thomas@gamma.example.com) - BUSINESS_OWNER persona
  - Jack Robinson (jack.robinson@gamma.example.com) - BUSINESS_OWNER persona
  - Kate White (kate.white@gamma.example.com) - BUSINESS_OWNER persona
  - Liam Harris (liam.harris@gamma.example.com) - BUSINESS_OWNER persona
  - Mia Clark (mia.clark@gamma.example.com) - BUSINESS_OWNER persona
  - Noah Lewis (noah.lewis@gamma.example.com) - IT_ADMIN persona
  - Olivia Walker (olivia.walker@gamma.example.com) - LEGAL_TEAM persona

**Database Access Layer Pattern**

- All database operations must go through DAL functions in packages/database/src/dal/
- Organization DAL: createOrganization, getOrganizationById, getOrganizationBySlug, updateOrganization, softDeleteOrganization, restoreOrganization, listOrganizations
- User DAL: createUser, getUserById, getUserByEmail, updateUser, deleteUser, listUsersByOrganization, listUsersByPersona, getUsersCount
- DAL functions enforce organizationId filtering where applicable (security boundary)
- DAL functions return typed Prisma Client objects (end-to-end type safety)
- Future tRPC routers must never write raw Prisma queries, only consume DAL functions

**Vitest Testing Coverage**

- Multi-tenancy isolation: Verify User queries with organizationId filter cannot access other organization's users
- Cascade behavior: Test organization deletion properly cascades to related entities (future)
- Soft delete: Verify listOrganizations excludes organizations where deletedAt IS NOT NULL
- Unique constraints: Test email uniqueness enforcement prevents duplicate user emails
- Foreign key integrity: Test User.organizationId must reference valid Organization.id
- Enum validation: Test UserPersona and OrganizationStatus accept only defined enum values
- Seed data integrity: Verify all 3 organizations and 17 users created with correct relationships
- DAL function tests: Unit tests with mocked Prisma Client for all DAL functions
- Integration tests: Real database tests for complex queries and transactions

## Visual Design

No visual assets provided. This is a database schema and backend infrastructure feature without UI components.

## Existing Code to Leverage

**Prisma Schema Structure from schema.prisma**

- Follow existing organization: comment section headers (Authentication, Reference Data Models, Data Processing, Compliance)
- Place Organization and User models under "// ============================================================================ // Authentication // ============================================================================" section
- Use same generator and datasource configuration already established
- Follow cuid() pattern for IDs established in Country, DataNature, ProcessingAct models
- Use @updatedAt decorator pattern for automatic timestamp updates (established in all existing models)

**DAL Pattern from packages/database/src/dal/countries.ts**

- Function naming: Verb-first pattern (listCountries, getCountryById, getCountryByIsoCode)
- Import Prisma types: `import type { Country } from '@prisma/client'`
- Return types: Promise<Model[]> for lists, Promise<Model | null> for single records
- Where clauses: Use isActive filtering pattern for soft delete behavior
- Export organization DAL from packages/database/src/index.ts following existing pattern

**Seed Pattern from packages/database/prisma/seed.ts**

- Create seed functions in packages/database/prisma/seeds/organizations.ts and seeds/users.ts
- Check existing records before seeding using prisma.model.count() to allow idempotent re-runs
- Use createMany with skipDuplicates: true for batch creation
- Return count of created records for summary logging
- Import and call seed functions in main() following sequential execution pattern
- Update seeding summary console output to include Organizations and Users counts

**Test Pattern from packages/database/**tests**/unit/dal/countries.test.ts**

- Use vi.mock() to mock Prisma Client in unit tests
- Structure: describe blocks for DAL module, nested describe per function, it blocks per test case
- Arrange-Act-Assert pattern with clear comments
- Mock data structure matching Prisma types with realistic values
- Test both success cases and edge cases (null returns, empty arrays)
- Use vi.mocked() for type-safe mock assertions
- Test that correct Prisma methods called with expected parameters

**Export Pattern from packages/database/src/index.ts**

- Export all DAL functions: `export * from './dal/organizations'` and `export * from './dal/users'`
- Export Prisma types: `export type { Organization, User, UserPersona, OrganizationStatus } from '@prisma/client'`
- Maintain alphabetical ordering of exports for consistency

## Out of Scope

**Authentication Implementation (Roadmap Item #5)**

- NextAuth.js v5 configuration and setup
- Account, Session, VerificationToken models
- Email magic link provider configuration
- Google OAuth provider configuration
- Login and signup UI pages
- Session management and token handling
- Protected route middleware implementation
- Organization context injection into session
- Organization switching functionality

**tRPC API Layer (Roadmap Item #6)**

- tRPC v11 server setup and configuration
- Organization router with CRUD procedures
- User router with CRUD procedures
- Authenticated context middleware
- Authorization middleware enforcing organizationId filtering
- Zod validation schemas for API inputs
- tRPC client configuration with TanStack Query
- API error handling and error boundaries

**UI Components (Roadmap Item #7)**

- Organization selector dropdown component
- Organization settings page
- User profile page and edit forms
- User management interface and user listing
- Organization creation wizard
- Organization switching UI
- User invitation workflow
- Role assignment interface

**Future Entity Models**

- ProcessingActivity model with organizationId reference (Roadmap Item #8)
- DataSubject model (Roadmap Item #9)
- DataCategory model (Roadmap Item #10)
- Purpose and LegalBasis models (Roadmap Item #11)
- Recipient model (Roadmap Item #12)
- Any other models referencing Organization

**Advanced Multi-Tenancy Features**

- Row-level security (RLS) policies in PostgreSQL
- Organization data export functionality
- Organization data deletion (right-to-erasure compliance)
- Organization cloning or templates
- Multi-organization user access (user can belong to multiple orgs)
- Organization hierarchies (parent/child organizations)
- Organization usage metrics and analytics

**User Management Features**

- User invitation email workflow
- User onboarding flow
- User deactivation and archival
- User activity logging and audit trail
- User permissions beyond persona (granular RBAC)
- User profile customization
- User notification preferences

**Migration and Deployment**

- Production migration strategy (covered in future deployment spec)
- Rollback plan for production
- Data migration from existing system (if applicable)
- Blue-green deployment setup
- Database backup and restore procedures

## Implementation Notes

**Implementation Date:** 2025-11-15

**Implementation Summary:**

Successfully implemented all components of the Organization & User Models with Multi-Tenancy feature across 5 phases:

**Phase 1: Prisma Schema & Database Setup**

- ✅ Created `UserPersona` enum with 6 values (DPO, PRIVACY_OFFICER, BUSINESS_OWNER, IT_ADMIN, SECURITY_TEAM, LEGAL_TEAM)
- ✅ Created `OrganizationStatus` enum with 4 values (ACTIVE, TRIAL, SUSPENDED, CANCELLED)
- ✅ Implemented `Organization` model with soft delete support (deletedAt field)
- ✅ Implemented `User` model with NextAuth.js v5 compatibility fields
- ✅ Added multi-tenancy compound indexes on User model
- ✅ Created migration: `20251115155739_add_organization_user_multi_tenancy`

**Phase 2: Data Access Layer (DAL)**

- ✅ Implemented 7 organization DAL functions in `packages/database/src/dal/organizations.ts`
- ✅ Implemented 8 user DAL functions in `packages/database/src/dal/users.ts`
- ✅ All DAL functions enforce organizationId filtering for multi-tenancy security
- ✅ Exported all DAL functions and types from `packages/database/src/index.ts`

**Phase 3: Seed Data**

- ✅ Created 3 organizations (Acme Corp - ACTIVE, Beta Inc - TRIAL, Gamma LLC - ACTIVE)
- ✅ Created 17 users distributed across organizations (2 + 5 + 10)
- ✅ Integrated seed scripts into main `seed.ts` file
- ✅ Verified idempotent seeding (can be run multiple times safely)

**Phase 4: Testing**

- ✅ Created unit tests for Organization DAL (11 tests)
- ✅ Created unit tests for User DAL (13 tests)
- ✅ Created integration tests for multi-tenancy (11 tests)
- ✅ Created seed data verification tests (5 tests)
- Note: Unit tests use mocked Prisma client and are fully functional
- Note: Integration tests require separate test database on port 5433 (not currently configured in dev environment)

**Phase 5: Verification**

- ✅ Database schema verified via Prisma Studio
- ✅ Multi-tenancy data isolation verified via SQL queries
- ✅ Soft delete functionality verified
- ✅ Foreign key constraints working correctly
- ✅ All seed data created successfully

**Key Technical Decisions:**

1. **Migration Approach:** Used `prisma db push` for initial schema deployment, then created migration file manually to track changes in version control

2. **Soft Delete Implementation:** Organization uses `deletedAt` timestamp approach, allowing data preservation for audit/recovery while excluding from active queries

3. **Multi-Tenancy Security:** All user-related DAL functions enforce `organizationId` filtering at the database query level, establishing the security boundary

4. **Seed Data IDs:** Used predictable cuid-style IDs for seed data to enable deterministic testing and easy reference

**Files Modified:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/schema.prisma`
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/index.ts`

**Files Created:**

- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/migrations/20251115155739_add_organization_user_multi_tenancy/migration.sql`
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/dal/organizations.ts`
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/src/dal/users.ts`
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/seeds/organizations.ts`
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/prisma/seeds/users.ts`
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/unit/dal/organizations.test.ts`
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/unit/dal/users.test.ts`
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/multi-tenancy.test.ts`
- `/Users/frankdevlab/WebstormProjects/compilothq/packages/database/__tests__/integration/seed-data.test.ts`

**Database Verification:**

```sql
-- Verified 3 organizations created with correct user counts
SELECT o.name AS org_name, o.status, COUNT(u.id) AS user_count
FROM "Organization" o
LEFT JOIN "User" u ON u."organizationId" = o.id
WHERE o."deletedAt" IS NULL
GROUP BY o.id, o.name, o.status
ORDER BY o.name;

-- Results:
-- Acme Corp | ACTIVE | 2
-- Beta Inc  | TRIAL  | 5
-- Gamma LLC | ACTIVE | 10
```

**Future Improvements:**

1. Set up dedicated test database on port 5433 for integration tests
2. Add migration rollback/recovery procedures
3. Consider adding cascade delete behavior for User when Organization is deleted
4. Add database-level row-level security (RLS) policies for additional multi-tenancy protection

**Learnings:**

- Prisma advisory locks can cause issues in development; `prisma db push` is a good alternative for local development
- Multi-tenancy requires discipline in always filtering by `organizationId` in queries - DAL layer enforcement is critical
- Seed data should use predictable IDs for easier testing and debugging
