# Task Breakdown: Purpose & Legal Basis Models

## Overview

Total Tasks: 26
Estimated Implementation: Database Layer only (schema, migrations, seeds, DAL, tests)

## Task List

### Database Layer

#### Task Group 1: Prisma Schema - Enums

**Dependencies:** None

- [ ] 1.0 Complete enum definitions in Prisma schema
  - [ ] 1.1 Add PurposeCategory enum to Reference Data section
    - File: `/home/user/compilothq/packages/database/prisma/schema.prisma`
    - Location: After `TransferMechanismCategory` enum (line ~168)
    - Values: MARKETING, ANALYTICS, CUSTOMER_SERVICE, HR, LEGAL_COMPLIANCE, SECURITY, PRODUCT_DELIVERY, RESEARCH_DEVELOPMENT, FINANCIAL, OTHER
    - Include descriptive comments for each value matching UserPersona enum pattern
  - [ ] 1.2 Add PurposeScope enum to Reference Data section
    - File: `/home/user/compilothq/packages/database/prisma/schema.prisma`
    - Location: After PurposeCategory enum
    - Values: INTERNAL, EXTERNAL, BOTH
    - Include descriptive comments for each value
  - [ ] 1.3 Add LegalBasisType enum to Reference Data section
    - File: `/home/user/compilothq/packages/database/prisma/schema.prisma`
    - Location: After PurposeScope enum
    - Values: CONSENT, CONTRACT, LEGAL_OBLIGATION, VITAL_INTERESTS, PUBLIC_TASK, LEGITIMATE_INTERESTS
    - Include GDPR Article 6(1) references in comments (e.g., "Article 6(1)(a)")
  - [ ] 1.4 Add RegulatoryFramework enum to Reference Data section
    - File: `/home/user/compilothq/packages/database/prisma/schema.prisma`
    - Location: After LegalBasisType enum
    - Values: GDPR, UK_GDPR, LGPD, CCPA, PIPEDA, POPIA, PDPA_SG, OTHER
    - Include framework full names in comments
  - [ ] 1.5 Run `pnpm prisma format` to validate schema syntax
    - Execute from: `/home/user/compilothq/packages/database/`

**Acceptance Criteria:**

- All four enums are defined in schema.prisma
- Enum values match spec requirements exactly
- Comments follow existing codebase patterns (UserPersona style)
- Prisma format passes without errors

---

#### Task Group 2: Prisma Schema - LegalBasis Model

**Dependencies:** Task Group 1

- [ ] 2.0 Complete LegalBasis model definition
  - [ ] 2.1 Add LegalBasis model to Reference Data section
    - File: `/home/user/compilothq/packages/database/prisma/schema.prisma`
    - Location: After TransferMechanism model (line ~235), before RecipientCategory
    - Follow DataNature model pattern (shared reference data, NO organizationId)
  - [ ] 2.2 Define core fields for LegalBasis
    - `id` (String, @id @default(cuid()))
    - `type` (LegalBasisType enum)
    - `name` (String)
    - `description` (String)
  - [ ] 2.3 Define framework fields for LegalBasis
    - `framework` (RegulatoryFramework, @default(GDPR))
    - `applicableFrameworks` (Json?, for additional framework mappings)
    - `articleReference` (String, e.g., "Article 6(1)(a)")
    - `articleDetails` (Json?, for structured article data)
  - [ ] 2.4 Define consent and assessment flag fields
    - `requiresConsent` (Boolean, @default(false))
    - `requiresExplicitConsent` (Boolean, @default(false))
    - `requiresOptIn` (Boolean, @default(false))
    - `withdrawalSupported` (Boolean, @default(false))
    - `requiresLIA` (Boolean, @default(false))
    - `requiresBalancingTest` (Boolean, @default(false))
  - [ ] 2.5 Define additional LegalBasis fields
    - `usageGuidance` (String?, implementation guidance)
    - `isActive` (Boolean, @default(true))
    - `createdAt` (DateTime, @default(now()))
    - `updatedAt` (DateTime, @updatedAt)
  - [ ] 2.6 Add indexes for LegalBasis
    - @@index([type])
    - @@index([framework])
  - [ ] 2.7 Run `pnpm prisma format` to validate schema

**Acceptance Criteria:**

- LegalBasis model matches spec exactly
- No organizationId field (shared reference data pattern)
- All flag fields have appropriate defaults
- Indexes defined on type and framework columns
- Prisma format passes without errors

---

#### Task Group 3: Prisma Schema - Purpose Model

**Dependencies:** Task Group 1

- [ ] 3.0 Complete Purpose model definition
  - [ ] 3.1 Add Purpose model to Compliance section
    - File: `/home/user/compilothq/packages/database/prisma/schema.prisma`
    - Location: In Compliance section (line ~370+), after comment "// Future compliance models will be added here"
    - Follow Processor model pattern (organization-scoped)
  - [ ] 3.2 Define core fields for Purpose
    - `id` (String, @id @default(cuid()))
    - `name` (String)
    - `description` (String?)
    - `category` (PurposeCategory enum)
    - `scope` (PurposeScope enum)
  - [ ] 3.3 Define organization scoping for Purpose
    - `organizationId` (String, foreign key)
    - Add relation: `organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)`
  - [ ] 3.4 Define additional Purpose fields
    - `isActive` (Boolean, @default(true))
    - `createdAt` (DateTime, @default(now()))
    - `updatedAt` (DateTime, @updatedAt)
  - [ ] 3.5 Add indexes for Purpose
    - @@index([organizationId])
    - @@index([organizationId, isActive])
    - @@index([organizationId, category])
  - [ ] 3.6 Update Organization model with purposes relation
    - Add to Organization model relations: `purposes Purpose[]`
    - Location: After `processors Processor[]` relation
  - [ ] 3.7 Run `pnpm prisma format` to validate schema

**Acceptance Criteria:**

- Purpose model follows Processor pattern exactly
- Organization relation with cascade delete configured
- All required indexes defined
- Organization model includes purposes relation
- Prisma format passes without errors

---

#### Task Group 4: Database Migration

**Dependencies:** Task Groups 1, 2, 3

- [ ] 4.0 Generate and validate database migration
  - [ ] 4.1 Generate Prisma migration
    - Execute: `pnpm prisma migrate dev --name add_purpose_legal_basis_models`
    - Working directory: `/home/user/compilothq/packages/database/`
  - [ ] 4.2 Review generated migration SQL
    - Verify all enums are created (PurposeCategory, PurposeScope, LegalBasisType, RegulatoryFramework)
    - Verify LegalBasis table structure and indexes
    - Verify Purpose table structure, foreign key, and indexes
  - [ ] 4.3 Generate Prisma client
    - Execute: `pnpm prisma generate`
    - Verify new types are exported from generated client

**Acceptance Criteria:**

- Migration file created at `/home/user/compilothq/packages/database/prisma/migrations/[timestamp]_add_purpose_legal_basis_models/migration.sql`
- Migration runs without errors
- Prisma client regenerated with new types

---

#### Task Group 5: Seed Data for Legal Bases

**Dependencies:** Task Group 4

- [ ] 5.0 Complete seed data implementation for LegalBasis
  - [ ] 5.1 Create legalBases seed file
    - File: `/home/user/compilothq/packages/database/prisma/seeds/legalBases.ts`
    - Follow dataNatures.ts pattern exactly
  - [ ] 5.2 Implement seedLegalBases function
    - Export async function `seedLegalBases(prisma: PrismaClient)`
    - Add existence check: skip if records exist
    - Define typed tuple array for 6 GDPR legal bases
  - [ ] 5.3 Define CONSENT legal basis seed data
    - type: CONSENT
    - name: "Consent"
    - description: "Data subject has given consent to the processing of their personal data for one or more specific purposes"
    - articleReference: "Article 6(1)(a)"
    - requiresConsent: true, requiresOptIn: true, withdrawalSupported: true
    - usageGuidance: "Consent must be freely given, specific, informed and unambiguous"
  - [ ] 5.4 Define CONTRACT legal basis seed data
    - type: CONTRACT
    - name: "Contract Performance"
    - description: "Processing is necessary for the performance of a contract to which the data subject is party"
    - articleReference: "Article 6(1)(b)"
    - All consent flags: false
    - usageGuidance: "Only data necessary for contract execution can be processed under this basis"
  - [ ] 5.5 Define LEGAL_OBLIGATION legal basis seed data
    - type: LEGAL_OBLIGATION
    - name: "Legal Obligation"
    - description: "Processing is necessary for compliance with a legal obligation to which the controller is subject"
    - articleReference: "Article 6(1)(c)"
    - All consent flags: false
    - usageGuidance: "Must identify the specific legal requirement mandating the processing"
  - [ ] 5.6 Define VITAL_INTERESTS legal basis seed data
    - type: VITAL_INTERESTS
    - name: "Vital Interests"
    - description: "Processing is necessary to protect the vital interests of the data subject or another natural person"
    - articleReference: "Article 6(1)(d)"
    - All consent flags: false
    - usageGuidance: "Limited to life-threatening situations where consent cannot be obtained"
  - [ ] 5.7 Define PUBLIC_TASK legal basis seed data
    - type: PUBLIC_TASK
    - name: "Public Task"
    - description: "Processing is necessary for the performance of a task carried out in the public interest or in the exercise of official authority"
    - articleReference: "Article 6(1)(e)"
    - All consent flags: false
    - usageGuidance: "Must have a clear basis in law for the public interest task"
  - [ ] 5.8 Define LEGITIMATE_INTERESTS legal basis seed data
    - type: LEGITIMATE_INTERESTS
    - name: "Legitimate Interests"
    - description: "Processing is necessary for the purposes of the legitimate interests pursued by the controller or by a third party"
    - articleReference: "Article 6(1)(f)"
    - requiresLIA: true, requiresBalancingTest: true
    - usageGuidance: "Requires documented Legitimate Interest Assessment (LIA) balancing controller interests against data subject rights"
  - [ ] 5.9 Implement createMany with skipDuplicates
    - Use prisma.legalBasis.createMany()
    - Add console.log with count summary
  - [ ] 5.10 Update seed.ts to include legalBases seed
    - File: `/home/user/compilothq/packages/database/prisma/seed.ts`
    - Add import: `import { seedLegalBases } from './seeds/legalBases'`
    - Call seedLegalBases in reference data section (after seedRecipientCategories)
    - Add to seeding summary

**Acceptance Criteria:**

- legalBases.ts follows dataNatures.ts pattern exactly
- All 6 GDPR legal bases seeded with correct flag values
- seed.ts updated to call seedLegalBases
- Running `pnpm prisma db seed` succeeds and logs legal basis count

---

#### Task Group 6: Data Access Layer (DAL)

**Dependencies:** Task Group 4

- [ ] 6.0 Complete DAL implementation
  - [ ] 6.1 Create legalBases DAL module
    - File: `/home/user/compilothq/packages/database/src/dal/legalBases.ts`
    - Follow countries.ts pattern
  - [ ] 6.2 Implement legalBases DAL functions
    - `listLegalBases(): Promise<LegalBasis[]>` - list all active legal bases
    - `getLegalBasisById(id: string): Promise<LegalBasis | null>`
    - `getLegalBasisByType(type: LegalBasisType): Promise<LegalBasis | null>`
    - `getLegalBasesByFramework(framework: RegulatoryFramework): Promise<LegalBasis[]>`
  - [ ] 6.3 Create purposes DAL module
    - File: `/home/user/compilothq/packages/database/src/dal/purposes.ts`
    - Follow processors.ts pattern (organization-scoped)
  - [ ] 6.4 Implement purposes DAL functions
    - `listPurposesByOrganization(organizationId: string): Promise<Purpose[]>`
    - `getPurposeById(id: string): Promise<Purpose | null>`
    - `createPurpose(data: PurposeCreateInput): Promise<Purpose>`
    - `updatePurpose(id: string, data: PurposeUpdateInput): Promise<Purpose>`
    - `deletePurpose(id: string): Promise<Purpose>`
  - [ ] 6.5 Export DAL modules from index
    - File: `/home/user/compilothq/packages/database/src/index.ts`
    - Add exports for legalBases and purposes DAL modules

**Acceptance Criteria:**

- DAL functions follow existing patterns
- All CRUD operations for Purpose implemented
- Query functions for LegalBasis implemented
- Exports added to package index

---

### Testing Layer

#### Task Group 7: Test Factories

**Dependencies:** Task Group 4

- [ ] 7.0 Complete test factory implementation
  - [ ] 7.1 Create LegalBasis factory
    - File: `/home/user/compilothq/packages/database/src/test-utils/factories/legal-basis-factory.ts`
    - Follow data-nature-factory.ts pattern
    - Define defaults() with type: CONSENT, framework: GDPR
  - [ ] 7.2 Create Purpose factory
    - File: `/home/user/compilothq/packages/database/src/test-utils/factories/purpose-factory.ts`
    - Follow data-nature-factory.ts pattern
    - Define defaults() with category: OTHER, scope: INTERNAL
    - Require organizationId in build/create
  - [ ] 7.3 Export factories from index
    - File: `/home/user/compilothq/packages/database/src/test-utils/factories/index.ts`
    - Add exports for LegalBasisFactory and PurposeFactory

**Acceptance Criteria:**

- Factories extend base Factory class
- Factories generate valid test data
- Factories exported from test-utils

---

#### Task Group 8: Integration Tests

**Dependencies:** Task Groups 6, 7

- [ ] 8.0 Complete integration tests
  - [ ] 8.1 Write 4-6 focused tests for LegalBasis DAL
    - File: `/home/user/compilothq/packages/database/__tests__/integration/dal/legalBases.integration.test.ts`
    - Follow countries.integration.test.ts pattern
    - Test: create and retrieve by ID
    - Test: list all active legal bases
    - Test: query by type
    - Test: query by framework
  - [ ] 8.2 Write 4-6 focused tests for Purpose DAL
    - File: `/home/user/compilothq/packages/database/__tests__/integration/dal/purposes.integration.test.ts`
    - Follow processors.integration.test.ts pattern
    - Test: CRUD operations with organization scoping
    - Test: cascade delete when organization deleted
    - Test: filtering by organization
    - Test: filtering by category
  - [ ] 8.3 Run integration tests and verify they pass
    - Execute: `pnpm test:integration --filter="legalBases|purposes"`
    - Working directory: `/home/user/compilothq/packages/database/`

**Acceptance Criteria:**

- 8-12 total integration tests written (4-6 per model)
- Tests follow existing vitest patterns
- All tests pass
- Tests verify organization scoping for Purpose
- Tests verify shared reference data pattern for LegalBasis

---

### Verification

#### Task Group 9: Final Verification

**Dependencies:** Task Groups 1-8

- [ ] 9.0 Complete final verification
  - [ ] 9.1 Run full test suite for database package
    - Execute: `pnpm test` in `/home/user/compilothq/packages/database/`
    - Verify no regressions in existing tests
  - [ ] 9.2 Run database seed and verify
    - Execute: `pnpm prisma db seed`
    - Verify all 6 legal bases seeded correctly
  - [ ] 9.3 Verify Prisma client exports
    - Confirm new types exported: Purpose, LegalBasis, PurposeCategory, PurposeScope, LegalBasisType, RegulatoryFramework
  - [ ] 9.4 Run type check
    - Execute: `pnpm typecheck` from repository root
    - Verify no TypeScript errors

**Acceptance Criteria:**

- All existing tests continue to pass
- All new tests pass
- Database seeds successfully
- TypeScript compilation succeeds
- All new types properly exported

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1**: Enum definitions (foundation for models)
2. **Task Group 2**: LegalBasis model (no dependencies on other models)
3. **Task Group 3**: Purpose model (requires Organization relation update)
4. **Task Group 4**: Migration generation (requires completed schema)
5. **Task Group 5**: Seed data (requires migration applied)
6. **Task Group 6**: DAL functions (requires migration applied)
7. **Task Group 7**: Test factories (requires migration applied)
8. **Task Group 8**: Integration tests (requires DAL and factories)
9. **Task Group 9**: Final verification (all components complete)

## File Changes Summary

| File Path | Action | Description |
|-----------|--------|-------------|
| `packages/database/prisma/schema.prisma` | Modify | Add enums, LegalBasis model, Purpose model, Organization relation |
| `packages/database/prisma/migrations/[timestamp]_add_purpose_legal_basis_models/migration.sql` | Create | Generated migration |
| `packages/database/prisma/seeds/legalBases.ts` | Create | Seed data for 6 GDPR legal bases |
| `packages/database/prisma/seed.ts` | Modify | Import and call seedLegalBases |
| `packages/database/src/dal/legalBases.ts` | Create | DAL functions for LegalBasis |
| `packages/database/src/dal/purposes.ts` | Create | DAL functions for Purpose |
| `packages/database/src/index.ts` | Modify | Export new DAL modules |
| `packages/database/src/test-utils/factories/legal-basis-factory.ts` | Create | Test factory for LegalBasis |
| `packages/database/src/test-utils/factories/purpose-factory.ts` | Create | Test factory for Purpose |
| `packages/database/src/test-utils/factories/index.ts` | Modify | Export new factories |
| `packages/database/__tests__/integration/dal/legalBases.integration.test.ts` | Create | Integration tests for LegalBasis |
| `packages/database/__tests__/integration/dal/purposes.integration.test.ts` | Create | Integration tests for Purpose |

## Out of Scope (per spec)

- Junction tables linking Purpose/LegalBasis to DataProcessingActivity (spec #13)
- tRPC routers and API endpoints
- UI components
- Seed data for common purposes (organization-specific)
- Purpose templates or libraries
- Consent management workflow
- LIA workflow implementation
- Data subject rights handling
- Audit logging
