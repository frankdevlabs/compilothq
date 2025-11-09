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

## Available Scripts

- `pnpm generate` - Generate Prisma Client from schema
- `pnpm migrate` - Run database migrations in development
- `pnpm push` - Push schema changes to database without migrations
- `pnpm studio` - Open Prisma Studio for database management
- `pnpm seed` - Seed the database (structure only, implementation pending)
- `pnpm build` - Build TypeScript to dist/
- `pnpm dev` - Watch mode for TypeScript compilation

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
- **Data Processing** - Data processing activities and records
- **Compliance** - Compliance documents and related models

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
