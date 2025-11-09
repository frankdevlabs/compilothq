# Specification: Foundation Reference Models

## Goal

Implement five core reference data models (Country, DataNature, ProcessingAct, TransferMechanism, RecipientCategory) in the Prisma schema with comprehensive seed data covering 249 countries, 29 data nature types, 15 processing operations, 13 transfer mechanisms, and 13 recipient categories to provide the foundational compliance validation layer for the platform.

## User Stories

- As a compliance engineer, I want accurate GDPR-classified country data so that I can automatically validate cross-border data transfers
- As a data protection officer, I want standardized processing operations and data nature types so that I can consistently classify processing activities across the organization

## Specific Requirements

**Country Reference Model Implementation**

- Add Country model to `packages/database/prisma/schema.prisma` with fields: id (String @id @default(cuid())), name (String), isoCode (String @unique), isoCode3 (String? @unique), gdprStatus (Json storing array of statuses), description (String?), createdAt, updatedAt
- Create unique indexes on isoCode and isoCode3, non-unique index on name for search performance
- Implement GDPR status as JSON array containing values: "EU", "EEA", "EFTA", "Third Country", "Adequate" to support multiple classifications per country
- Port the parseGdprStatus logic from convex/countries.ts:147-166 to seed script handling hierarchical expansion (EU implies EEA, adequacy decisions append to base status)
- Seed 249 countries extracted from convex/countries.ts:200-450 with accurate GDPR classifications
- Add comment section "// Reference Data Models" above the Country model in schema.prisma

**DataNature Reference Model Implementation**

- Add DataNature model with fields: id, name, description, type (Enum: SPECIAL | NON_SPECIAL), gdprArticle (String), createdAt, updatedAt
- Create DataNatureType enum with values SPECIAL and NON_SPECIAL for Article 9 vs standard personal data classification
- Index on name and type fields for filtering special category data queries
- Seed 29 data nature types from convex/dataNatures.ts:30-90 including 9 special categories (racial/ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, biometric data, health data, sex life, sexual orientation) and 20 non-special types
- Map SPECIAL type to gdprArticle "Art. 9(1)" and NON_SPECIAL to "Art. 4(1)" for compliance tracking
- Ensure type field is required (not nullable) for clear classification

**ProcessingAct Reference Model Implementation**

- Add ProcessingAct model with fields: id, name, description, examples (Json array), requiresDPA (Boolean @default(false)), triggersDPIA (Boolean @default(false)), gdprArticle (String), createdAt, updatedAt
- Create index on name for lookup performance
- Seed 15 processing operations from GDPR Article 4(2) extracted from convex/processingActs.ts:104-243 (collection, recording, organization, storage, adaptation, retrieval, use, disclosure, dissemination, alignment, restriction, erasure, anonymization, encryption, backup)
- Store examples as JSON array of strings showing concrete implementation scenarios for each operation
- Set compliance automation flags (requiresDPA, triggersDPIA) based on operation risk level per existing Convex data structure
- Link each operation to "Art. 4(2)" in gdprArticle field for regulatory reference

**TransferMechanism Reference Model Implementation**

- Add TransferMechanism model with fields: id, code (String @unique), name, description, typicalUseCase, gdprArticle (String), category (Enum: ADEQUACY | SAFEGUARD | DEROGATION | NONE), isDerogation (Boolean), requiresAdequacy (Boolean), requiresDocumentation (Boolean), createdAt, updatedAt
- Create TransferMechanismCategory enum with four classification types for legal basis categorization
- Create unique index on code and non-unique index on name
- Extract and seed 13 transfer mechanisms from convex/types.ts:20-120 including adequacy decisions (Art. 45), SCCs (Art. 46.2c), BCRs (Art. 46.2b), codes of conduct (Art. 46.2e), certification (Art. 46.2f), and all Article 49 derogations
- Set isDerogation=true for Article 49 mechanisms to flag exceptional/limited use cases
- Populate compliance flags (requiresAdequacy, requiresDocumentation) to automate validation checks in data transfer workflows

**RecipientCategory Reference Model Implementation**

- Add RecipientCategory model with fields: id, code (String @unique), name, examples (Json array), commonReasons (String), requiresDPA (Boolean @default(false)), requiresImpactAssessment (Boolean @default(false)), defaultRole (String?), createdAt, updatedAt
- Create unique index on code and non-unique index on name
- Extract and seed 13 recipient categories from convex/types.ts:130-250 (affiliates, service providers, cloud/IT providers, payment processors, marketing partners, business partners, professional advisors, government bodies, law enforcement, insurance, research institutions, public/nonprofit, miscellaneous)
- Store examples as JSON array of specific recipient types within each category
- Set automation flags (requiresDPA, requiresImpactAssessment) based on category risk profile from existing Convex structure
- Optional defaultRole field (e.g., "processor", "controller", "joint controller") to pre-populate recipient relationships

**Database Migration Strategy**

- Create new migration from `packages/database/` directory using `pnpm prisma migrate dev --name add-reference-models --create-only`
- Review generated migration SQL to ensure proper table creation, indexes, enum definitions, and constraints before applying
- Apply migration to development PostgreSQL 17 database using `pnpm prisma migrate dev`
- Regenerate Prisma client types with `pnpm prisma generate` to update TypeScript definitions
- Test migration rollback capability to ensure safe deployment process

**Comprehensive Seed Data Implementation**

- Create modular seed structure: `packages/database/prisma/seeds/countries.ts`, `seeds/dataNatures.ts`, `seeds/processingActs.ts`, `seeds/transferMechanisms.ts`, `seeds/recipientCategories.ts`
- Create main orchestrator at `packages/database/prisma/seed.ts` that imports and executes all seed modules sequentially
- Extract raw data arrays from Convex files maintaining exact data structure and values for migration consistency
- Implement batch insertion pattern using `prisma.model.createMany()` for performance with large datasets (249 countries)
- Add idempotency checks to prevent duplicate seeding (check if data exists, skip if already seeded)
- Configure `prisma.seed` script in `packages/database/package.json` pointing to compiled seed.ts file
- Execute seeding from `packages/database/` directory using `pnpm prisma db seed`
- Log seeding progress with record counts for verification (e.g., "Seeded 249 countries, 29 data natures, 15 processing acts...")

**Data Access Layer Foundation**

- Create DAL file structure: `packages/database/src/dal/countries.ts`, `dal/dataNatures.ts`, `dal/processingActs.ts`, `dal/transferMechanisms.ts`, `dal/recipientCategories.ts`
- Implement basic query functions for each model: listAll(), getById(id), getByCode(code) or getByIsoCode(isoCode) depending on model
- Add filtering functions where relevant: getCountriesByGdprStatus(status), getDataNaturesByType(type), getTransferMechanismsByCategory(category)
- Export all DAL functions from `packages/database/src/index.ts` for consumption by tRPC routers
- Follow singleton Prisma client pattern from existing index.ts to prevent connection pooling issues
- Ensure all DAL functions use async/await with proper error handling and return typed Prisma model objects

**Global Reference Data Architecture**

- Implement all five models WITHOUT tenantId field - these are shared global reference tables accessed by all tenants
- Set all models as read-only after initial seeding (no create/update/delete operations exposed via API initially)
- Define foreign key relationships using @relation decorator for future dependent models (ProcessingActivity, DataProcessor, DataCategory, etc.) but do NOT implement the dependent models in this spec
- Add isActive Boolean @default(true) field to each model for soft-delete capability if reference data deprecation is needed in future
- Use RESTRICT on delete cascade rules (to be configured when dependent models are added) to prevent orphaned foreign key references

**Development Environment Testing**

- Test complete workflow from clean database: run migrations, regenerate client, execute seeds, verify all 536+ records inserted
- Validate data integrity by querying each model and checking record counts match expected totals (249 countries, 29 data natures, 15 processing acts, 13 transfer mechanisms, 13 recipient categories)
- Test DAL functions by executing sample queries for each model from Next.js server context
- Verify indexes are created correctly by checking PostgreSQL query plans for name/code lookups
- Test that JSON fields (gdprStatus, examples, etc.) serialize/deserialize properly through Prisma client
- Confirm no tenant isolation on reference tables by verifying queries return same data regardless of user context

## Visual Design

No visual assets provided - this is a backend-only specification focused on database schema, migrations, seed data, and data access layer.

## Existing Code to Leverage

**Prisma Schema Pattern (packages/database/prisma/schema.prisma)**

- Follow existing comment section structure (Authentication, Data Processing, Compliance) by adding new "Reference Data Models" section
- Use @id @default(cuid()) for primary keys matching User model pattern
- Use @createdAt and @updatedAt decorators for timestamp tracking
- Follow datasource and generator configuration already established for PostgreSQL provider
- Leverage existing singleton Prisma client pattern from packages/database/src/index.ts to prevent multiple instances

**Convex Countries Model (convex/countries.ts:10-20, 147-166, 200-450)**

- Reuse exact field structure (name, isoCode, gdprStatus) translating Convex validators to Prisma types
- Port parseGdprStatus hierarchical logic handling EU → EEA expansion and adequacy decision parsing
- Extract complete seed dataset of 249 countries with accurate data for migration consistency
- Mirror index strategy (by_name, by_iso_code, by_gdpr_status) as Prisma @@index directives
- Adapt CRUD mutation pattern to Prisma DAL functions maintaining same operation semantics

**Convex DataNatures Model (convex/dataNatures.ts:6-9, 30-90)**

- Reuse type classification pattern (special vs non-special) creating SPECIAL | NON_SPECIAL enum
- Extract all 29 data nature types from seed function maintaining descriptions and classifications
- Add gdprArticle field enhancement (not in original Convex) for compliance automation
- Follow validator pattern translating v.string(), v.union() to Prisma String and Enum types

**Convex ProcessingActs Model (convex/processingActs.ts:104-243)**

- Extract all 15 Article 4(2) operations with names, descriptions, and examples arrays
- Translate examples array from Convex v.array(v.string()) to Prisma Json type storing string arrays
- Add compliance automation fields (requiresDPA, triggersDPIA, gdprArticle) as Prisma Boolean and String fields
- Mirror seed function batch insertion pattern using Prisma createMany

**Convex Transfer Mechanisms & Recipient Categories (convex/types.ts:20-120, 130-250)**

- Promote from TypeScript type definitions to full Prisma models with proper schema definitions
- Extract 13 transfer mechanisms and 13 recipient categories maintaining code, name, description structure
- Add category enum for transfer mechanisms (ADEQUACY/SAFEGUARD/DEROGATION/NONE) to classify legal basis
- Add automation fields (requiresDPA, requiresImpactAssessment, defaultRole) for recipient categories to enable workflow automation

## Out of Scope

- LegalBasis model migration from convex/legalBases.ts (deferred to separate future spec)
- UI components for viewing or managing reference data (backend-only implementation)
- Full tRPC routers for reference models (only basic DAL functions required)
- Implementation of dependent models (ProcessingActivity, DataSubjectCategory, PersonalDataCategory, DataProcessor, Recipient, DataAsset)
- Retention period templates or reusable retention policies
- Security measure types catalog or control frameworks
- Risk category classifications or likelihood/impact matrices
- Tenant-specific customization or overrides of reference data
- Admin interface for editing reference data post-seeding
- API endpoints for creating/updating/deleting reference records
