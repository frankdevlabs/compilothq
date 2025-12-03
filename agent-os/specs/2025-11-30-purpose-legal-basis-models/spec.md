# Specification: Purpose & Legal Basis Models

## Goal

Implement Purpose and LegalBasis database models with supporting enums, migrations, seed data, and tests to enable legal compliance validation and purpose limitation tracking for GDPR Article 30 records of processing activities.

## User Stories

- As a DPO, I want to define purposes for data processing so that I can document why personal data is collected and used
- As a Privacy Officer, I want to associate legal bases with processing activities so that I can demonstrate lawful processing under GDPR Article 6

## Specific Requirements

**Purpose Model Definition**

- Create `Purpose` model in `packages/database/prisma/schema.prisma` under the Compliance section
- Include fields: `id` (cuid), `name` (String), `description` (String?), `category` (PurposeCategory enum), `scope` (PurposeScope enum)
- Include `organizationId` foreign key with cascade delete and relation to Organization
- Add `isActive` (Boolean, default true), `createdAt`, `updatedAt` audit timestamps
- Add composite index on `[organizationId, isActive]` and `[organizationId, category]`
- Add Organization relation: update Organization model with `purposes Purpose[]` relation field

**PurposeCategory Enum**

- Define enum with 10 values: MARKETING, ANALYTICS, CUSTOMER_SERVICE, HR, LEGAL_COMPLIANCE, SECURITY, PRODUCT_DELIVERY, RESEARCH_DEVELOPMENT, FINANCIAL, OTHER
- Add descriptive comments for each value matching the pattern used in UserPersona enum
- Place enum definition in Reference Data section alongside DataNatureType

**PurposeScope Enum**

- Define enum with 3 values: INTERNAL, EXTERNAL, BOTH
- INTERNAL for data used only within organization, EXTERNAL for shared with third parties, BOTH for dual use
- Place alongside PurposeCategory enum definition

**LegalBasis Model Definition**

- Create `LegalBasis` model as shared reference data (NO organizationId) matching Country/DataNature pattern
- Include fields: `id` (cuid), `type` (LegalBasisType enum), `name` (String), `description` (String)
- Include `framework` (RegulatoryFramework enum, default GDPR), `applicableFrameworks` (Json?)
- Include `articleReference` (String) for human-readable reference like "Article 6(1)(a)"
- Include `articleDetails` (Json?) for optional structured article data

**LegalBasis Consent and Assessment Flags**

- Add `requiresConsent` (Boolean, default false) for consent-based processing
- Add `requiresExplicitConsent` (Boolean, default false) for Article 9 special category data
- Add `requiresOptIn` (Boolean, default false) vs opt-out mechanism distinction
- Add `withdrawalSupported` (Boolean, default false) for consent withdrawal capability
- Add `requiresLIA` (Boolean, default false) for Legitimate Interest Assessment requirement
- Add `requiresBalancingTest` (Boolean, default false) for rights balancing requirement

**LegalBasis Additional Fields**

- Add `usageGuidance` (String?) for implementation guidance text
- Add `isActive` (Boolean, default true), `createdAt`, `updatedAt` audit timestamps
- Add index on `[type]` and `[framework]` columns

**LegalBasisType Enum**

- Define 6 GDPR Article 6(1) legal bases: CONSENT, CONTRACT, LEGAL_OBLIGATION, VITAL_INTERESTS, PUBLIC_TASK, LEGITIMATE_INTERESTS
- Add article reference comments (e.g., "Article 6(1)(a) - freely given, specific, informed")
- Place in Reference Data section

**RegulatoryFramework Enum**

- Define 8 values: GDPR, UK_GDPR, LGPD, CCPA, PIPEDA, POPIA, PDPA_SG, OTHER
- Include descriptive comments for each framework
- Default value is GDPR for primary use case

**Seed Data for Six GDPR Legal Bases**

- Create `packages/database/prisma/seeds/legalBases.ts` following dataNatures.ts pattern
- Implement `seedLegalBases(prisma: PrismaClient)` function with existence check
- Pre-seed all 6 GDPR legal bases with appropriate flag values (e.g., CONSENT has requiresConsent=true, withdrawalSupported=true)
- Update `prisma/seed.ts` to import and call seedLegalBases in reference data section
- Log seed count on completion

**Unit and Integration Tests**

- Create `__tests__/integration/dal/legalBases.integration.test.ts` following countries.integration.test.ts pattern
- Test LegalBasis CRUD operations and query by type/framework
- Create `__tests__/integration/dal/purposes.integration.test.ts` for Purpose model
- Test Purpose CRUD with organization scoping and cascade delete behavior
- Use vitest with beforeAll/afterAll for setup/teardown, factory functions for test data

## Existing Code to Leverage

**DataNature Model Pattern (schema.prisma lines 187-199)**

- Reference data model with type enum, name, description, isActive, timestamps
- No organizationId - shared across all organizations
- Replicate this pattern for LegalBasis model

**Processor Model Pattern (schema.prisma lines 351-366)**

- Organization-scoped model with organizationId foreign key
- Cascade delete on organization relation
- Composite indexes on [organizationId, isActive]
- Replicate this pattern for Purpose model

**DataNatureType and TransferMechanismCategory Enums (schema.prisma lines 158-168)**

- Simple enum definitions with descriptive values
- Placement in Reference Data Models section
- Follow same naming convention for new enums

**Seed File Pattern (prisma/seeds/dataNatures.ts)**

- Check existing count before seeding, skip if records exist
- Use typed tuple array for data definition
- createMany with skipDuplicates for idempotent seeding
- Console log with count summary

**Integration Test Pattern (**tests**/integration/seed-data.test.ts)**

- Use vitest describe/it/expect pattern
- beforeAll for setup, afterAll for cleanup
- Import factory functions from test-utils
- Test relationship queries and counts

## Out of Scope

- Junction tables linking Purpose/LegalBasis to DataProcessingActivity (handled in spec #13)
- tRPC routers and API endpoints for Purpose and LegalBasis
- UI components for Purpose and LegalBasis management
- Seed data for common/example purposes (organization-specific, handle in onboarding)
- Purpose templates or pre-defined purpose libraries
- LegalBasis customization or organization-specific overrides
- Consent management workflow or consent collection UI
- Legitimate Interest Assessment (LIA) workflow implementation
- Data subject rights request handling related to legal bases
- Audit logging for Purpose/LegalBasis changes
