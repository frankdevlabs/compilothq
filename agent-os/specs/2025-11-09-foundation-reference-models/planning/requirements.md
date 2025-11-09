# Spec Requirements: Foundation Reference Models & Seed Data

## Initial Description

Implement core reference data models (Country, DataNature, ProcessingAct, TransferMechanism, RecipientCategories) in Prisma schema, create migrations, test in development environment, and implement comprehensive seed data covering 250+ countries with GDPR classifications, 28 data nature types, 17 processing operations, and 13 recipient categories to provide the foundation for automatic compliance validation and classification throughout the platform.

## Requirements Discussion

### First Round Questions

**Q1: Country Model Structure**
What fields should the Country model include beyond name and ISO code? Should we track EU membership separately from GDPR adequacy status? Should we include ISO 3166-1 alpha-3 codes in addition to alpha-2?

**Answer:**
Use existing structure from convex/schema.ts and convex/countries.ts. Fields: name, isoCode (2-letter), gdprStatus[] (array), optional description. Add isoCode3 for 3-letter codes if needed. No separate EU membership - implied in gdprStatus array. Reference: convex/countries.ts:10-20 (schema), convex/countries.ts:200-220 (parseGdprStatus logic)

**Q2: DataNature Types & Structure**
The spec mentions 28 types. Should these be split into "special category data" (Article 9) and "non-special" data? What fields should the DataNature model include - just name and description, or additional metadata like GDPR article references?

**Answer:**
29 types (not 28) - 9 special + 20 non-special. Fields: name, description, type: 'special' | 'non-special'. Add gdprArticle field (e.g., "Art. 9(1)"). Keep type enum instead of boolean for clarity. Reference: convex/dataNatures.ts:30-90 (seed function with all 29 types)

**Q3: ProcessingAct Operations**
You mentioned 17 operations. Are these the operations from Article 4(2) GDPR definition of "processing"? Should the model include examples field to help users understand each operation? Should we track which operations typically require DPIAs or trigger specific compliance requirements?

**Answer:**
15 operations (not 17) from Article 4(2). Fields: name, description, examples[]. Add: requiresDPA, triggersDPIA, gdprArticle for compliance automation. Reference: convex/processingActs.ts:15-180 (seed function with all 15 operations)

**Q4: TransferMechanism Model Design**
Should TransferMechanism be a separate reference table, or should it be embedded as an enum on the data transfer relationship? What categories exist - adequacy decisions, safeguards (SCCs, BCRs), derogations (consent, contract performance)?

**Answer:**
Create separate reference table (currently embedded in types). 13 mechanisms. Structure from: convex/types.ts:20-120 (TRANSFER_MECHANISM_TYPES + DESCRIPTIONS). Fields: code, name, description, typicalUseCase, gdprArticle, category (ADEQUACY/SAFEGUARD/DEROGATION/NONE), isDerogation, requiresAdequacy, requiresDocumentation. Link at DataTransfer level, not embedded in recipients.

**Q5: RecipientCategories Scope**
The 13 recipient categories - should these be a fixed reference table like Country, or should users be able to add custom categories? What fields make sense: name, description, examples, typical roles?

**Answer:**
Create separate reference table. 13 categories. Structure from: convex/types.ts:130-250 (RECIPIENT_CATEGORIES + DESCRIPTIONS). Fields: code, name, examples, commonReasons. Add: requiresDPA, requiresImpactAssessment, defaultRole for automation. Pattern: Fixed reference data (not tenant-customizable) for compliance consistency.

**Q6: Seed Data Sources**
Where will the comprehensive seed data come from? Should we extract this from your existing Convex implementation or use authoritative sources like ISO 3166, GDPR text, etc.? Should seed data live in separate JSON/CSV files or TypeScript arrays in the seed script?

**Answer:**
Extract from existing Convex files:

- Countries (249): convex/countries.ts:200-450
- DataNatures (29): convex/dataNatures.ts:30-90
- ProcessingActs (15): convex/processingActs.ts:15-180
- TransferMechanisms (13): convex/types.ts:20-120
- RecipientCategories (13): convex/types.ts:130-250
  Create: packages/database/prisma/seeds/\*.ts files mirroring Convex seed pattern

**Q7: Model Relationships & Multi-tenancy**
Should these reference models be global (shared across all tenants) or tenant-specific? Will they be referenced by foreign keys from other models like ProcessingActivity, Recipient, or DataCategory? Should they be read-only after seeding or editable by admins?

**Answer:**
Global reference data (no tenantId), read-only after seeding. Pattern from: convex/schema.ts - all reference tables use v.id('tableName') foreign keys. Implementation: Foreign key relations via Prisma @relation, no tenant-specific overrides (shared across all tenants). Add isActive boolean for soft-delete if needed. Referenced by: ProcessingActivity, DataCategory, Recipient, DigitalAsset models

**Q8: Scope Boundaries - What's Excluded**
Are we including legal bases (legitimate interest, consent, etc.) in this spec, or is that a separate roadmap item? What about retention period templates, security measure types, or risk categories?

**Answer:**
Include only what roadmap specifies. Phase 1 (This Spec): ✅ Country, DataNature, ProcessingAct, TransferMechanism, RecipientCategory. Defer to Later: ❌ LegalBases (already exists in convex/legalBases.ts - separate spec), ❌ Retention templates, security measures, risk categories

**Q9: Existing Code Reuse**
Are there existing features in your codebase with similar patterns we should reference? For example: Similar interface elements or UI components to re-use, Comparable page layouts or navigation patterns, Related backend logic or service objects, Existing models or controllers with similar functionality.

**Answer:**
Follow patterns from:

- Reference Models: convex/countries.ts - Complete CRUD + seed pattern, convex/dataNatures.ts - Type classification pattern, convex/legalBases.ts - Simple reference pattern
- Seed Implementation pattern from convex/countries.ts:200-210
- Create Prisma equivalent: packages/database/prisma/seeds/countries.ts, use same data arrays from Convex, call from prisma/seed.ts main file
- Use prisma migrate dev for migrations

**Q10: Visual Assets**
Do you have any design mockups, wireframes, or screenshots that could help guide the development?

**Answer:**
None exist in the Convex repo. User is open to generating ERD diagrams showing: 1) Existing Convex schema structure, 2) Proposed Prisma schema with new models, 3) Relationship diagrams. Place in: agent-os/specs/2025-11-09-foundation-reference-models/planning/visuals/

### Existing Code to Reference

**Similar Features Identified:**

**Reference Model Patterns:**

- Feature: Countries Reference Model
  - Path: `https://github.com/frankdevlabs/compilot/blob/main/convex/countries.ts`
  - Schema Definition: `https://github.com/frankdevlabs/compilot/blob/main/convex/schema.ts`
  - Pattern: Complete CRUD mutations + comprehensive seed function + parseGdprStatus logic
  - Implementation: Lines 10-20 (schema), 147-166 (GDPR status parsing), 200-450 (seed data)

- Feature: Data Natures Reference Model
  - Path: `https://github.com/frankdevlabs/compilot/blob/main/convex/dataNatures.ts`
  - Pattern: Type classification (special vs non-special) with seed function
  - Implementation: Lines 6-9 (validator), 30-90 (seed with all 29 types)

- Feature: Processing Acts Reference Model
  - Path: `https://github.com/frankdevlabs/compilot/blob/main/convex/processingActs.ts`
  - Pattern: Article 4(2) operations with examples array
  - Implementation: Lines 104-243 (seed with all 15 operations)

- Feature: Transfer Mechanisms & Recipient Categories (Type Definitions)
  - Path: `https://github.com/frankdevlabs/compilot/blob/main/convex/types.ts`
  - Pattern: Currently type definitions, need extraction to reference tables
  - Implementation: Lines 20-120 (transfer mechanisms), 130-250 (recipient categories)

- Feature: Legal Bases Reference Model
  - Path: `https://github.com/frankdevlabs/compilot/blob/main/convex/legalBases.ts`
  - Pattern: Simple reference data (deferred to separate spec)
  - Note: Already exists in Convex, will be migrated in future spec

**Components to Potentially Reuse:**

1. **Seed Script Pattern**: Mirror Convex mutation pattern in Prisma
   - Batch insert with `Promise.all()`
   - Transform raw data tuples into typed objects
   - Add timestamps (createdAt, updatedAt)
   - Return inserted IDs/records

2. **Schema Index Pattern**: Follow Convex indexing strategy
   - Index on name fields for lookups
   - Index on code/isoCode for unique constraints
   - Index on classification fields (gdprStatus, type, category)

3. **Data Validation Pattern**: Port Convex validators to Zod schemas
   - Required vs optional fields
   - Enum/union types for classifications
   - Array validations for multi-value fields

**Backend Logic to Reference:**

1. **GDPR Status Parsing Logic** (convex/countries.ts:147-166)
   - Hierarchical classification (EU → EEA, EEA → EFTA)
   - Adequacy decision parsing from strings
   - Array expansion from single status strings

2. **Foreign Key Relationship Pattern** (convex/schema.ts)
   - Use `v.id('tableName')` in Convex
   - Translate to Prisma `@relation` with proper field types
   - Maintain referential integrity

3. **CRUD Mutation Patterns** (countries.ts, dataNatures.ts, processingActs.ts)
   - Create: Insert with timestamps, return full record
   - Update: Validate existence, patch fields, refresh updatedAt
   - Delete: Confirm record presence, remove document
   - List: Retrieve all with optional filtering

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

User is open to generating ERD diagrams showing:

1. Existing Convex schema structure
2. Proposed Prisma schema with new models
3. Relationship diagrams between reference models and entity models

These would be placed in: `agent-os/specs/2025-11-09-foundation-reference-models/planning/visuals/` if created.

## Requirements Summary

### Functional Requirements

**Core Functionality:**

1. **Country Reference Model**
   - Fields: name, isoCode (2-letter), isoCode3 (3-letter, optional), gdprStatus (array), description (optional)
   - GDPR Status Types: EU, EEA, EFTA, Third Country, Adequate
   - Seed Data: 249 countries with accurate GDPR classifications
   - Indexing: by_name, by_iso_code, by_gdpr_status
   - Pattern: Parse GDPR status hierarchically (EU implies EEA, adequacy appends)

2. **DataNature Reference Model**
   - Fields: name, description, type ('special' | 'non-special'), gdprArticle
   - Special Categories: 9 types (Article 9 data - racial origin, political opinions, religious beliefs, trade union, genetic, biometric, health, sex life, sexual orientation)
   - Non-Special Categories: 20 types (name, contact, demographic, identifiers, employment, financial, education, device, location, communication, behavioral, marketing preferences, customer relationship, photographic/visual, publicly available, professional, user-generated content, online activity, transactional, emergency contact)
   - Total: 29 data nature types
   - GDPR Article References: Link to specific articles (e.g., "Art. 9(1)" for special categories)

3. **ProcessingAct Reference Model**
   - Fields: name, description, examples (array), requiresDPA, triggersDPIA, gdprArticle
   - Operations: 15 operations from GDPR Article 4(2) - collecting, recording, organizing/structuring, storing, adapting/altering, retrieving/consulting, using, sharing/disclosing, disseminating, aligning/combining, restricting, erasing/destroying, anonymizing/pseudonymizing, encrypting, backing up
   - Compliance Fields: requiresDPA (boolean), triggersDPIA (boolean), gdprArticle (string)
   - Examples: Array of concrete implementation scenarios per operation

4. **TransferMechanism Reference Model**
   - Fields: code, name, description, typicalUseCase, gdprArticle, category, isDerogation, requiresAdequacy, requiresDocumentation
   - Categories: ADEQUACY, SAFEGUARD, DEROGATION, NONE
   - Mechanisms: 13 total
     - Adequacy Decision
     - Standard Contractual Clauses (SCCs)
     - Binding Corporate Rules (BCRs)
     - Approved Code of Conduct
     - Approved Certification Mechanism
     - Explicit Consent (derogation)
     - Contract Performance (derogation)
     - Public Interest (derogation)
     - Legal Claims (derogation)
     - Vital Interests (derogation)
     - Public Register (derogation)
     - Legitimate Interests (derogation)
     - None/Not Applicable
   - Compliance Flags: isDerogation, requiresAdequacy, requiresDocumentation

5. **RecipientCategory Reference Model**
   - Fields: code, name, examples, commonReasons, requiresDPA, requiresImpactAssessment, defaultRole
   - Categories: 13 total
     - Affiliates & Subsidiaries
     - External Service Providers & Vendors
     - Cloud & IT Infrastructure Providers
     - Payment Processors & Financial Institutions
     - Marketing & Advertising Partners
     - Business & Strategic Partners
     - Professional Advisors & Consultants
     - Government & Regulatory Bodies
     - Law Enforcement & Public Safety Authorities
     - Insurance & Welfare Organizations
     - Research & Academic Institutions
     - Public or Nonprofit Entities
     - Miscellaneous One-Off Recipients
   - Automation Fields: requiresDPA, requiresImpactAssessment, defaultRole

**Seed Data Implementation:**

1. **Data Sources**: Extract from existing Convex repository
   - Countries: convex/countries.ts (lines 200-450) - 249 countries
   - DataNatures: convex/dataNatures.ts (lines 30-90) - 29 types
   - ProcessingActs: convex/processingActs.ts (lines 15-180) - 15 operations
   - TransferMechanisms: convex/types.ts (lines 20-120) - 13 mechanisms
   - RecipientCategories: convex/types.ts (lines 130-250) - 13 categories

2. **Seed Script Structure**:
   - Create separate seed files: `packages/database/prisma/seeds/*.ts`
   - Mirror Convex seed pattern: Transform data tuples → typed objects → batch insert
   - Main orchestrator: `packages/database/prisma/seed.ts` calls all seed scripts
   - Execution: Run from `packages/database/` directory using `pnpm prisma db seed`

3. **Data Format Pattern**:
   ```typescript
   // Example from Convex pattern
   const data = [
     ['CountryName', 'ISO2', 'GDPR Status String'],
     // ... more tuples
   ].map(([name, isoCode, status]) => ({
     name,
     isoCode,
     gdprStatus: parseGdprStatus(status),
     createdAt: now,
     updatedAt: now,
   }))
   ```

**Database Actions:**

1. Create Prisma schema models for all 5 reference types in `packages/database/prisma/schema.prisma`
2. Define proper field types, validation, and indexes
3. Establish foreign key relationships via `@relation` decorators
4. Generate migration files from `packages/database/` directory via `pnpm prisma migrate dev --create-only`
5. Review migrations for accuracy before applying
6. Apply migrations to development database from `packages/database/`
7. Implement seed scripts with comprehensive data in `packages/database/prisma/seeds/`
8. Test seeding in clean database environment from `packages/database/`
9. Validate data integrity and relationships

### Reusability Opportunities

**Existing Patterns to Follow:**

1. **Convex Schema Patterns**:
   - Use indexes strategically (by_name, by_code, by_classification)
   - Validation at schema level (required vs optional, enums, arrays)
   - Timestamp tracking (createdAt, updatedAt)
   - Foreign key relationships via proper type references

2. **Convex Seed Patterns**:
   - Data transformation from raw tuples to typed objects
   - Batch insertion with Promise.all()
   - Return inserted IDs/records for verification
   - Modular seed functions per reference type

3. **GDPR Status Parsing Logic** (from convex/countries.ts):
   - Hierarchical classification expansion (EU → EEA → EFTA)
   - Adequacy decision detection from strings
   - Array-based status for multiple classifications
   - Port this logic to Prisma seed script

4. **Type Classification Pattern** (from convex/dataNatures.ts):
   - Binary classification (special vs non-special)
   - GDPR article reference linkage
   - Clear type field instead of boolean flags

**Components to Migrate:**

1. **Country Model**: Direct migration from convex/countries.ts
   - Keep field structure identical
   - Port parseGdprStatus logic
   - Maintain index strategy
   - Add isoCode3 if beneficial

2. **DataNature Model**: Direct migration from convex/dataNatures.ts
   - Keep type enum ('special' | 'non-special')
   - Add gdprArticle field for compliance tracking
   - Maintain all 29 types with descriptions

3. **ProcessingAct Model**: Direct migration from convex/processingActs.ts
   - Keep examples array structure
   - Add compliance automation fields (requiresDPA, triggersDPIA, gdprArticle)
   - Maintain all 15 operations

4. **TransferMechanism Model**: Extract from convex/types.ts
   - Promote from type definitions to full reference table
   - Add category enum (ADEQUACY/SAFEGUARD/DEROGATION/NONE)
   - Include compliance flags

5. **RecipientCategory Model**: Extract from convex/types.ts
   - Promote from type definitions to full reference table
   - Add automation fields (requiresDPA, requiresImpactAssessment, defaultRole)
   - Fixed reference data pattern

**Backend Service Patterns:**

1. **DAL Functions** (Data Access Layer):
   - Create DAL functions in `packages/database/src/dal/*.ts`
   - Pattern: One file per reference model
   - Functions: list(), getById(), getByCode(), getByName(), create(), update(), delete()
   - Used by tRPC routers (never direct Prisma queries in API layer)

2. **tRPC Router Structure**:
   - Create routers in `apps/web/src/server/routers/reference/*.ts`
   - Pattern: One router per reference model
   - Procedures: list, getById, getByCode (for lookup tables)
   - Use DAL functions exclusively (no direct Prisma calls)

3. **Validation Schemas**:
   - Create Zod schemas in `packages/validation/src/schemas/*.ts`
   - Mirror Convex validators
   - Share between server (tRPC) and client (React Hook Form)

### Scope Boundaries

**In Scope:**

1. Prisma Schema Implementation
   - Country model with GDPR classifications
   - DataNature model with special/non-special types
   - ProcessingAct model with GDPR Article 4(2) operations
   - TransferMechanism model with safeguards and derogations
   - RecipientCategory model with organizational types
   - Proper indexes on all reference models
   - Foreign key relationships defined (not implemented on dependent models)
   - Timestamp tracking (createdAt, updatedAt)
   - Location: `packages/database/prisma/schema.prisma`

2. Database Migrations
   - Create migration files for all 5 models in `packages/database/prisma/migrations/`
   - Review migrations before applying
   - Apply to development environment from `packages/database/`
   - Test migration rollback if needed

3. Comprehensive Seed Data
   - 249 countries with accurate GDPR status classifications
   - 29 data nature types (9 special + 20 non-special)
   - 15 processing operations from Article 4(2)
   - 13 transfer mechanisms with categories
   - 13 recipient categories with examples
   - Seed script modularization (one file per model) in `packages/database/prisma/seeds/`
   - Main seed orchestrator at `packages/database/prisma/seed.ts`

4. Data Access Layer (DAL) Foundation
   - DAL functions for basic CRUD operations in `packages/database/src/dal/`
   - Pattern: packages/database/src/dal/[model].ts
   - Functions: list(), getById(), getByCode/getByName()
   - Used by tRPC routers (architectural requirement)

5. Development Testing
   - Test migrations in clean database from `packages/database/`
   - Validate seed data completeness
   - Verify foreign key relationships
   - Test DAL functions
   - Ensure data integrity

**Out of Scope (Deferred to Later Specs):**

1. LegalBasis Model
   - Already exists in convex/legalBases.ts
   - Will be migrated in separate spec
   - Covers: Legitimate Interest, Consent, Contract, Legal Obligation, Vital Interests, Public Interest

2. Retention Templates
   - Reusable retention period definitions
   - Duration specifications
   - Legal rationale tracking
   - Future roadmap item

3. Security Measure Types
   - Technical and organizational measures
   - Security control categories
   - Implementation tracking
   - Future roadmap item

4. Risk Categories
   - Risk type classifications
   - Likelihood/impact frameworks
   - Residual risk calculations
   - Future roadmap item

5. UI Components
   - No frontend interface in this spec
   - Reference data is backend-only
   - UI for managing reference data (future)
   - Read-only access pattern initially

6. tRPC API Routes
   - Basic DAL functions only in this spec
   - Full tRPC routers for reference models (future)
   - Used by dependent models (ProcessingActivity, etc.)

7. Dependent Model Implementations
   - ProcessingActivity model (roadmap item 4)
   - DataSubjectCategory model (roadmap item 4)
   - PersonalDataCategory model (roadmap item 5)
   - DataProcessor/Recipient model (roadmap item 6)
   - DataAsset model (roadmap item 7)
   - These will reference the foundation models created here

### Technical Considerations

**Architecture Patterns:**

1. **Global Reference Data**
   - No tenantId field on reference models
   - Shared across all tenants
   - Read-only after seeding (admins cannot modify)
   - Consider isActive boolean for soft-delete if deprecation needed

2. **Foreign Key Relationships**
   - Reference models provide stable IDs
   - Dependent models use `@relation` to reference
   - Cascade rules: RESTRICT on delete (prevent orphans)
   - Example: ProcessingActivity.dataNatureId → DataNature.id

3. **Prisma Schema Conventions**
   - Model names: PascalCase singular (Country, DataNature)
   - Field names: camelCase (isoCode, gdprStatus)
   - Enum names: SCREAMING_SNAKE_CASE (ADEQUACY, SAFEGUARD)
   - Index naming: descriptive (idx_country_isocode)

4. **Data Integrity**
   - Unique constraints on: isoCode, isoCode3, code fields
   - Not null constraints on required fields
   - Enum validation at database level
   - Referential integrity via foreign keys

**Technology Stack Integration:**

1. **Prisma ORM** (PostgreSQL 17)
   - Schema definition in `packages/database/prisma/schema.prisma`
   - Client generation: Run `pnpm prisma generate` from `packages/database/`
   - Migration workflow: Run `pnpm prisma migrate dev` from `packages/database/`
   - Seed execution: Run `pnpm prisma db seed` from `packages/database/`

2. **Monorepo Structure** (pnpm workspaces)
   - Database package: `@compilothq/database` at `packages/database/`
   - Exports: Prisma client, DAL functions, types
   - Used by: `apps/web` and future packages
   - Hot reload: Configured for cross-package changes

3. **TypeScript Integration**
   - Prisma generates TypeScript types
   - Flow: Schema → Prisma Types → DAL Functions → tRPC → React
   - Strict mode enabled
   - Type safety end-to-end

4. **Development Environment**
   - Docker Compose: PostgreSQL 17 + Redis 7
   - Migration: Dev database local, production on Contabo VPS
   - Seed: Run `pnpm prisma db seed` from `packages/database/`
   - Testing: Clean database snapshots for tests

**Migration Strategy:**

1. **From Convex to Prisma**
   - Extract schema definitions from convex/schema.ts
   - Translate Convex validators to Prisma schema in `packages/database/prisma/schema.prisma`
   - Port seed data arrays from Convex mutation files to `packages/database/prisma/seeds/`
   - Adapt parseGdprStatus logic to TypeScript/Prisma context

2. **Data Structure Changes**
   - TransferMechanism: Promote from types to table
   - RecipientCategory: Promote from types to table
   - Country: Add isoCode3 field (optional enhancement)
   - DataNature: Add gdprArticle field (new)
   - ProcessingAct: Add requiresDPA, triggersDPIA, gdprArticle fields (new)

3. **Validation Translation**
   - Convex `v.string()` → Prisma `String`
   - Convex `v.array(v.union(...))` → Prisma `Json` or separate enum table
   - Convex `v.optional(v.string())` → Prisma `String?`
   - Convex `v.id('table')` → Prisma relation field

**Existing System Constraints:**

1. **Next.js 16 App Router**
   - Async request APIs required
   - Server Components by default
   - tRPC integration via App Router endpoint

2. **Multi-tenancy (Future)**
   - Reference models are tenant-agnostic
   - Dependent models (ProcessingActivity, etc.) have tenantId
   - Users access via their tenant context
   - No cross-tenant data visibility

3. **GDPR Data Residency**
   - PostgreSQL hosted in EU (Contabo Nuremberg, Germany)
   - Reference data contains no personal information
   - Compliant with Dutch/EU regulations

**Similar Code Patterns to Follow:**

1. **Convex CRUD Pattern** (countries.ts, dataNatures.ts):

   ```typescript
   // Create
   export const create = mutation({
     args: { ...validator },
     handler: async (ctx, args) => {
       const id = await ctx.db.insert('table', {
         ...args,
         createdAt: Date.now(),
         updatedAt: Date.now(),
       })
       return id
     },
   })
   ```

2. **Convex Seed Pattern** (countries.ts:200-210):

   ```typescript
   export const seed = mutation({
     handler: async (ctx) => {
       const data = rawData.map(transform)
       const ids = await Promise.all(data.map((item) => ctx.db.insert('table', item)))
       return { count: ids.length, ids }
     },
   })
   ```

3. **Prisma DAL Pattern** (to implement):

   ```typescript
   // packages/database/src/dal/countries.ts
   export async function listCountries() {
     return prisma.country.findMany({
       orderBy: { name: 'asc' },
     })
   }

   export async function getCountryByIsoCode(isoCode: string) {
     return prisma.country.findUnique({
       where: { isoCode },
     })
   }
   ```

**Technology Preferences:**

1. **Database**: PostgreSQL 17 (established)
2. **ORM**: Prisma (established) in `packages/database/`
3. **Validation**: Zod schemas (shared client/server)
4. **Migration Tool**: Prisma Migrate (built-in) - run from `packages/database/`
5. **Seed Format**: TypeScript arrays (type-safe, version-controlled) in `packages/database/prisma/seeds/`
6. **Index Strategy**: Follow Convex pattern (name, code, classification fields)

## Implementation Summary

This spec establishes the foundational reference data layer for Compilo's compliance platform by migrating 5 core reference models from Convex to Prisma with comprehensive seed data covering 249 countries, 29 data nature types, 15 processing operations, 13 transfer mechanisms, and 13 recipient categories. The implementation follows proven patterns from the existing Convex codebase while adapting to Prisma's schema and DAL architecture within the monorepo package structure at `packages/database/`, providing the foundation for automatic compliance validation and classification that will be used by all future entity models (ProcessingActivity, DataProcessor, DataAsset, etc.) per the product roadmap.

**Key Implementation Approach:**

1. Extract proven data structures and seed data from existing Convex repository
2. Translate Convex validators and schemas to Prisma models in `packages/database/prisma/schema.prisma` with enhanced compliance fields
3. Create modular seed scripts in `packages/database/prisma/seeds/` mirroring Convex mutation patterns with batch insertion
4. Implement basic DAL functions in `packages/database/src/dal/` for CRUD operations following architectural boundaries
5. Test in development environment with clean database migrations run from `packages/database/`
6. Provide stable, read-only reference data shared globally across all tenants

**Critical Success Factors:**

- Accurate migration of 536+ seed data records (249 countries + 29 data natures + 15 processing acts + 13 transfer mechanisms + 13 recipient categories + additional metadata)
- Proper indexing strategy for performance (name, code, classification lookups)
- Foreign key relationship definitions for future dependent models
- Compliance automation fields (requiresDPA, triggersDPIA, gdprArticle, etc.) for validation engine
- DAL function pattern established for consistent data access across application
- All Prisma operations run from `packages/database/` directory as part of the monorepo structure
