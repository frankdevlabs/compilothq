# Spec Requirements: Organization & User Models with Multi-Tenancy

## Initial Description

Organization & User Models with Multi-Tenancy — Implement Organization model with settings and metadata, implement User model with UserPersona enum (DPO, PRIVACY_OFFICER, BUSINESS_OWNER, IT_ADMIN, SECURITY_TEAM, LEGAL_TEAM), establish organizationId foreign keys with cascading deletes, add compound indexes for multi-tenant queries, and create migrations testing that all queries properly isolate by organization to establish secure multi-tenancy foundation.

## Requirements Discussion

### First Round Questions

**Q1: NextAuth.js v5 Integration — Should we include all NextAuth.js v5 required fields NOW or defer to item #5?**

**Answer:** Include User fields NOW, defer Account/Session/VerificationToken to item #5.

- Add to User model: id (String @id @default(cuid())), name (String - REQUIRED, not nullable), email (String @unique), emailVerified (DateTime?), image (String?)
- Keep name required since existing schema has it as non-null

**Q2: Organization settings field structure — Should we define a structured schema now or use Json?**

**Answer:** Leave completely unstructured. Use `Json?` (nullable).

- Don't define schema upfront - will evolve based on actual usage
- When structured later (Beta phase items 31-34), will use Zod schemas for validation

**Q3: Organization status enum values — Are these the right statuses?**

**Answer:** Use the proposed values:

```prisma
enum OrganizationStatus {
  ACTIVE
  TRIAL
  SUSPENDED
  CANCELLED
}
```

**Q4: UserPersona default value — Should primaryPersona be required with default or nullable?**

**Answer:** Required (non-nullable) with `@default(BUSINESS_OWNER)`

- Every user must have a role
- BUSINESS_OWNER is the most restrictive persona for default assignment

**Q5: Seed data scope — Should we create comprehensive or minimal seed data?**

**Answer:** Comprehensive - create 3 organizations with varied user counts:

- **Small org:** 2 users (1 DPO, 1 BUSINESS_OWNER)
- **Medium org:** 5 users (1 DPO, 1 PRIVACY_OFFICER, 2 BUSINESS_OWNER, 1 LEGAL_TEAM)
- **Large org:** 10 users (1 DPO, 2 PRIVACY_OFFICER, 5 BUSINESS_OWNER, 1 IT_ADMIN, 1 LEGAL_TEAM)
- Example orgs: Acme Corp (ACTIVE), Beta Inc (TRIAL), Gamma LLC (ACTIVE)

### Existing Code to Reference

No similar existing features identified for reference.

This is a foundational feature establishing the multi-tenancy pattern that all future features will follow.

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

Not applicable - this is a database schema and backend infrastructure feature without UI components.

## Requirements Summary

### Functional Requirements

**Organization Model:**

- id: String @id @default(cuid())
- name: String (required, organization display name)
- slug: String @unique (URL-safe identifier, lowercase, derived from name)
- settings: Json? (nullable, unstructured settings object)
- status: OrganizationStatus enum (ACTIVE, TRIAL, SUSPENDED, CANCELLED)
- deletedAt: DateTime? (soft delete timestamp)
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt
- Relation: users (one-to-many User relationship)

**User Model:**

- id: String @id @default(cuid())
- name: String (required, user full name)
- email: String @unique (required, unique email address)
- emailVerified: DateTime? (nullable, email verification timestamp)
- image: String? (nullable, profile image URL)
- organizationId: String (required foreign key to Organization)
- primaryPersona: UserPersona enum (required, @default(BUSINESS_OWNER))
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt
- Relation: organization (many-to-one Organization relationship)

**UserPersona Enum:**

- DPO (Data Protection Officer)
- PRIVACY_OFFICER (Privacy Manager/Officer)
- BUSINESS_OWNER (Business stakeholder/project manager)
- IT_ADMIN (IT Manager/System Administrator)
- SECURITY_TEAM (Information Security Officer)
- LEGAL_TEAM (Legal Counsel)

**OrganizationStatus Enum:**

- ACTIVE (fully active organization)
- TRIAL (trial period organization)
- SUSPENDED (temporarily suspended)
- CANCELLED (cancelled/deactivated organization)

**Cascade Behavior:**

- Organization soft delete: Set deletedAt timestamp (preserve data)
- Organization-owned entities: Hard cascade delete when organization deleted
- User deletion: Configurable based on future requirements

**Indexes:**

- Organization: @@index([deletedAt]) for soft delete queries
- User: Compound indexes for multi-tenant query performance
  - @@index([organizationId, primaryPersona]) for role-based queries
  - @@index([organizationId, createdAt]) for chronological queries
  - @@index([email]) implicit from @unique constraint

**Seed Data Requirements:**

1. **Acme Corp (ACTIVE)** - 2 users:
   - John Doe (DPO)
   - Jane Smith (BUSINESS_OWNER)

2. **Beta Inc (TRIAL)** - 5 users:
   - Alice Johnson (DPO)
   - Bob Wilson (PRIVACY_OFFICER)
   - Carol Martinez (BUSINESS_OWNER)
   - David Lee (BUSINESS_OWNER)
   - Eva Garcia (LEGAL_TEAM)

3. **Gamma LLC (ACTIVE)** - 10 users:
   - Frank Brown (DPO)
   - Grace Taylor (PRIVACY_OFFICER)
   - Henry Anderson (PRIVACY_OFFICER)
   - Iris Thomas (BUSINESS_OWNER)
   - Jack Robinson (BUSINESS_OWNER)
   - Kate White (BUSINESS_OWNER)
   - Liam Harris (BUSINESS_OWNER)
   - Mia Clark (BUSINESS_OWNER)
   - Noah Lewis (IT_ADMIN)
   - Olivia Walker (LEGAL_TEAM)

**Migrations:**

- Create Organization model migration
- Create UserPersona enum migration
- Create OrganizationStatus enum migration
- Create User model migration with foreign key to Organization
- Add indexes for multi-tenant query optimization

**Vitest Tests:**

- Multi-tenancy isolation: Verify queries filter by organizationId correctly
- Cascade behavior: Test organization deletion cascades properly
- Soft delete: Verify deletedAt filtering works correctly
- Unique constraints: Test email uniqueness enforcement
- Foreign key integrity: Test Organization-User relationship constraints
- Enum validation: Test UserPersona and OrganizationStatus enum values
- Seed data integrity: Verify all seed data created correctly

**DAL Functions Required:**

Organization DAL:

- `createOrganization(data)` - Create new organization
- `getOrganizationById(id)` - Get organization by ID
- `getOrganizationBySlug(slug)` - Get organization by slug
- `updateOrganization(id, data)` - Update organization
- `softDeleteOrganization(id)` - Set deletedAt timestamp
- `listOrganizations(filters)` - List organizations with filters
- `restoreOrganization(id)` - Clear deletedAt timestamp

User DAL:

- `createUser(data)` - Create new user
- `getUserById(id)` - Get user by ID
- `getUserByEmail(email)` - Get user by email
- `updateUser(id, data)` - Update user
- `deleteUser(id)` - Delete user
- `listUsersByOrganization(organizationId, filters)` - List users for organization
- `listUsersByPersona(organizationId, persona)` - List users by role
- `getUsersCount(organizationId)` - Count users per organization

### Reusability Opportunities

This is a foundational feature establishing patterns that will be reused:

**Multi-tenancy Pattern:**

- All future entity models will include `organizationId` foreign key
- All future queries will filter by `organizationId` from session context
- Compound indexes pattern `@@index([organizationId, ...])` will be standard

**Soft Delete Pattern:**

- Organization soft delete using `deletedAt` establishes pattern
- Future high-value entities may adopt same pattern (ProcessingActivity, DPIAAssessment)

**Enum Pattern:**

- UserPersona and OrganizationStatus establish enum usage pattern
- Future features will use enums for status fields (AssessmentStatus, WorkflowStatus, RiskLevel, etc.)

**Seed Data Pattern:**

- Comprehensive seed data approach establishes development data standards
- Future models will follow same pattern (reference data, example entities, test scenarios)

**DAL Pattern:**

- Data Access Layer functions establish separation between API and database
- All future tRPC routers will consume DAL functions, never raw Prisma queries
- Security boundary: All DAL functions enforce organizationId filtering

### Scope Boundaries

**In Scope:**

1. Prisma schema implementation:
   - Organization model with all specified fields
   - User model with NextAuth.js v5 fields
   - UserPersona enum (6 values)
   - OrganizationStatus enum (4 values)
   - Foreign key relationships
   - Compound indexes for multi-tenancy

2. Database migrations:
   - Migration files for all models and enums
   - Index creation migrations
   - Tested in development environment

3. Seed data:
   - 3 organizations (Acme Corp, Beta Inc, Gamma LLC)
   - 17 total users across organizations
   - Varied user persona distribution
   - Realistic example data

4. Vitest tests:
   - Multi-tenancy isolation tests
   - Cascade behavior tests
   - Soft delete tests
   - Foreign key integrity tests
   - Enum validation tests
   - Seed data verification tests

5. DAL functions:
   - Organization CRUD operations
   - User CRUD operations
   - Organization-scoped user queries
   - Soft delete operations
   - Restoration operations

**Out of Scope:**

1. **UI Components** (Roadmap item #7):
   - Organization selector component
   - User profile component
   - Organization settings page
   - User management interface
   - Organization creation wizard

2. **tRPC Routers** (Roadmap item #6):
   - Organization router procedures
   - User router procedures
   - API endpoints for CRUD operations
   - Authorization middleware

3. **Authentication Logic** (Roadmap item #5):
   - NextAuth.js configuration
   - Account/Session/VerificationToken models
   - Email magic link setup
   - Google OAuth provider
   - Session management
   - Protected route middleware
   - Login/signup pages

4. **Authorization Middleware** (Roadmap item #6):
   - Role-based access control
   - Permission checking
   - Organization context injection
   - Session-to-organizationId resolution

5. **Future Models:**
   - ProcessingActivity model (Roadmap item #8)
   - DataSubject model (Roadmap item #9)
   - DataCategory model (Roadmap item #10)
   - Any other entity models referencing Organization

### Technical Considerations

**Database Technology:**

- PostgreSQL 17 (production and development)
- Prisma ORM for type-safe database access
- ACID transactions for data integrity

**Multi-Tenancy Architecture:**

- Row-level multi-tenancy using organizationId foreign key
- All queries must filter by organizationId (enforced by DAL layer)
- Compound indexes starting with organizationId for query performance
- No shared data between organizations

**Soft Delete Implementation:**

- Organization uses deletedAt timestamp approach
- Queries must filter WHERE deletedAt IS NULL by default
- Restoration capability via clearing deletedAt
- Hard delete reserved for GDPR right-to-erasure compliance

**Foreign Key Constraints:**

- User.organizationId references Organization.id
- onDelete behavior: To be determined based on business requirements
- Referential integrity enforced at database level

**Prisma Configuration:**

- Using cuid() for ID generation (collision-resistant, sortable)
- @updatedAt decorator for automatic timestamp updates
- Strict mode enabled for null safety
- Type generation for end-to-end type safety

**Migration Strategy:**

- Development: `prisma migrate dev` for iterative schema changes
- Production: `prisma migrate deploy` for applying migrations
- Migration naming: Descriptive names indicating purpose
- Never edit migrations after creation (create new migration instead)

**Performance Considerations:**

- Compound indexes planned for common query patterns
- Index on Organization.deletedAt for soft delete queries
- Index on User.email for authentication lookups
- organizationId always first field in compound indexes (left-most principle)

**Data Integrity:**

- Email uniqueness enforced at database level
- Organization slug uniqueness enforced at database level
- Required fields enforced via Prisma schema
- Enum values validated at database level

**Testing Strategy:**

- Unit tests using Vitest with in-memory database or test database
- Tests verify multi-tenancy isolation (cannot access other org's data)
- Tests verify cascade behavior on organization deletion
- Tests verify soft delete filtering works correctly
- Tests verify all DAL functions work as expected

**Security Considerations:**

- All DAL functions will enforce organizationId filtering
- No raw Prisma queries allowed in tRPC routers (must use DAL)
- Session context will provide organizationId (implemented in item #5)
- Future middleware will validate organizationId matches authenticated user

**Integration Points:**

- NextAuth.js v5 will extend User model with auth-specific fields (item #5)
- tRPC routers will consume DAL functions (item #6)
- All future entity models will reference Organization.id
- Reference data models already created (item #3) are organization-agnostic

**Monorepo Structure:**

- Schema located in: `packages/database/prisma/schema.prisma`
- Migrations in: `packages/database/prisma/migrations/`
- Seed script in: `packages/database/prisma/seed.ts`
- DAL functions in: `packages/database/src/dal/organization.ts` and `packages/database/src/dal/user.ts`
- Tests in: `packages/database/src/__tests__/`

**Development Workflow:**

1. Update Prisma schema in `packages/database/prisma/schema.prisma`
2. Run `pnpm --filter @compilothq/database prisma migrate dev --name descriptive-name`
3. Implement DAL functions in `packages/database/src/dal/`
4. Write Vitest tests in `packages/database/src/__tests__/`
5. Update seed script in `packages/database/prisma/seed.ts`
6. Run `pnpm --filter @compilothq/database prisma db seed` to test seed data
7. Verify tests pass: `pnpm --filter @compilothq/database test`
