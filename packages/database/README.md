# @compilothq/database

Type-safe Prisma database client for Compilot HQ.

## Purpose

Provides a singleton Prisma Client instance with proper connection pooling for the Next.js application. This package centralizes all database access and ensures type safety across the application.

## Usage

```typescript
import { prisma } from '@compilothq/database'

// Use the prisma client instance
const users = await prisma.user.findMany()
```

### Using DAL Functions

The database package provides Data Access Layer (DAL) functions for type-safe database operations:

```typescript
import { createDigitalAsset, listDigitalAssets, getDigitalAssetById } from '@compilothq/database'

// Create asset with processing locations
const { asset, locations } = await createDigitalAsset({
  organizationId: 'org-123',
  name: 'AWS S3',
  type: 'FILE_STORAGE',
  containsPersonalData: true,
  locations: [
    {
      service: 'S3 bucket - us-east-1',
      countryId: 'us-id',
      locationRole: 'HOSTING',
      purposeText: 'Backup storage',
    },
  ],
})

// Query personal data inventory
const inventory = await listDigitalAssets('org-123', {
  containsPersonalData: true,
  includeProcessingLocations: true,
})
```

See [DAL API Reference](./docs/DAL_API_DIGITAL_ASSETS.md) for complete documentation.

## Available Scripts

- `pnpm generate` - Generate Prisma Client from schema
- `pnpm migrate` - Run database migrations in development
- `pnpm push` - Push schema changes to database without migrations
- `pnpm studio` - Open Prisma Studio for database management
- `pnpm seed` - Seed the database (structure only, implementation pending)
- `pnpm build` - Build TypeScript to dist/
- `pnpm dev` - Watch mode for TypeScript compilation
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests
- `pnpm test:integration` - Run integration tests

## Singleton Pattern

This package implements a singleton pattern to prevent multiple Prisma Client instances in development (Next.js hot reload issue):

```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

This ensures:

- Connection pooling works correctly in serverless environments
- No multiple database connections during development hot reloads
- Single source of truth for database access

## Environment Variables

Required environment variable:

```
DATABASE_URL="postgresql://user:password@localhost:5432/compilothq"
```

Copy `.env.example` to `.env` and update with your database credentials.

## Schema Organization

The Prisma schema (`prisma/schema.prisma`) uses a monolithic structure organized by comment sections:

- **Authentication** - User accounts and auth-related models
- **Core GDPR Models** - Purpose, Country, DataSubjectCategory, PersonalDataCategory, Recipient, TransferMechanism
- **Data Processing Activities** - DataProcessingActivity and junction tables
- **Digital Assets** - DigitalAsset, AssetProcessingLocation, DataProcessingActivityDigitalAsset
- **Compliance Documents** - Documents and related models

## Development Workflow

1. Make changes to `prisma/schema.prisma`
2. Run `pnpm generate` to update Prisma Client
3. Run `pnpm migrate` to create and apply migrations
4. Run `pnpm build` to compile TypeScript

Or from the root:

```bash
pnpm db:generate
pnpm db:migrate
```

## Documentation

### Digital Asset Models

Complete documentation for the Digital Asset feature:

- **[DAL API Reference](./docs/DAL_API_DIGITAL_ASSETS.md)** - Complete API documentation for all 15 DAL functions
- **[Schema Design Decisions](./docs/SCHEMA_DESIGN_DECISIONS.md)** - Rationale for architectural decisions and trade-offs
- **[Migration Procedures](./docs/MIGRATION_PROCEDURES.md)** - Step-by-step migration guide for all environments

### Models Overview

**DigitalAsset** - Systems, tools, and platforms that process personal data

- 16 fields including ownership, metadata, integration status
- 4 compound indexes for multi-tenancy and performance
- Supports optional processing locations for compliance tracking

**AssetProcessingLocation** - Geographic tracking of WHERE and HOW data is processed

- 14 fields including service, country, role, purpose, transfer mechanism
- 3 compound indexes for geographic and compliance queries
- Soft delete via `isActive` flag for audit trail preservation

**DataProcessingActivityDigitalAsset** - Junction table linking activities to assets

- Many-to-many relationship with asymmetric cascade rules
- Bidirectional indexes for fast lookups in both directions

### DAL Functions (15 total)

**Asset Operations (6):**

- `createDigitalAsset()` - Create with optional locations atomically
- `addAssetProcessingLocations()` - Add locations post-creation
- `getDigitalAssetById()` - Retrieve with optional relations
- `listDigitalAssets()` - List with filters (type, containsPersonalData, etc.)
- `updateDigitalAsset()` - Partial update support
- `deleteDigitalAsset()` - Delete with safeguards (blocks if linked to activities)

**Location Operations (4):**

- `getActiveLocationsForAsset()` - Get active locations (isActive: true)
- `updateAssetProcessingLocation()` - Update location fields
- `deactivateAssetProcessingLocation()` - Soft delete for audit trail
- `getLocationsByCountry()` - Geographic compliance queries

**Junction Operations (5):**

- `linkAssetToActivity()` - Create junction record
- `unlinkAssetFromActivity()` - Remove junction record
- `syncActivityAssets()` - Atomic bulk sync
- `getAssetsForActivity()` - Retrieve assets for activity
- `getActivitiesForAsset()` - Retrieve activities for asset

See [DAL API Reference](./docs/DAL_API_DIGITAL_ASSETS.md) for detailed documentation with examples.

## Testing

```bash
# Run all tests
pnpm test

# Run only integration tests
pnpm test:integration

# Run specific test file
pnpm test:integration -- digitalAssets
```

Integration tests use a separate test database configured in `.env.test`.

## Multi-Tenancy

All DAL functions enforce multi-tenancy by filtering on `organizationId`. This ensures data isolation between organizations.

**Security Rule:** Always pass `organizationId` from session context, never from client input.

```typescript
// GOOD - organizationId from session
const assets = await listDigitalAssets(ctx.organizationId, filters)

// BAD - organizationId from client input (NEVER DO THIS)
const assets = await listDigitalAssets(input.organizationId, filters)
```

## Performance

The schema includes compound indexes optimized for common query patterns:

- All indexes start with `organizationId` for multi-tenancy isolation
- Expected query performance: <100ms for list operations with <1000 assets
- Transaction overhead: ~35ms for atomic operations (acceptable for writes)

See [Schema Design Decisions](./docs/SCHEMA_DESIGN_DECISIONS.md) for index strategy details.

## Compliance

The Digital Asset models support GDPR Article 30(1)(d) compliance by tracking:

- Location of processing (country, role)
- Transfer mechanism safeguards for cross-border transfers
- Purpose of processing (via FK or free text)
- Audit trail preservation (soft delete via `isActive`)

## Migration History

Recent migrations:

- `20251205152202_add_digital_asset_models` - Digital Asset, AssetProcessingLocation, DataProcessingActivityDigitalAsset models

See [Migration Procedures](./docs/MIGRATION_PROCEDURES.md) for rollback and verification procedures.
