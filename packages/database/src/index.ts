import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../generated/client/client'

// Create PostgreSQL adapter with connection string
// Prisma 7 requires explicit driver adapters for all databases
const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'],
})

// Singleton pattern for PrismaClient
// Prevents multiple Prisma Client instances in development
// This ensures connection pooling works correctly in serverless environments
// and prevents the "too many connections" error during Next.js hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

// Export all DAL functions
export * from './dal/activities'
export * from './dal/countries'
export * from './dal/dataNatures'
export * from './dal/devSessions'
export * from './dal/invitations'
export * from './dal/organizations'
export * from './dal/processingActs'
export * from './dal/processors'
export * from './dal/recipientCategories'
export * from './dal/transferMechanisms'
export * from './dal/users'

// NOTE: Server-only utilities (tokens) are NOT exported from the main index
// to avoid bundling Node.js modules (crypto) in Edge Runtime (middleware).
// Import directly from '@compilothq/database/src/utils/tokens' when needed on the server.

// Re-export PrismaClient type and class for use in other files
export { PrismaClient } from '../generated/client/client'

// Re-export all Prisma types, enums, and utilities for convenience
// This includes both types and runtime values (enums)
export * from '../generated/client/client'

// Explicit type exports for documentation
export type {
  Account,
  Activity,
  Country,
  DataNature,
  Invitation,
  Organization,
  ProcessingAct,
  Processor,
  RecipientCategory,
  Session,
  TransferMechanism,
  User,
  VerificationToken,
} from '../generated/client/client'
