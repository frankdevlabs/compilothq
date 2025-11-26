import { PrismaClient } from '../generated/client'

// Prevent multiple Prisma Client instances in development
// This singleton pattern ensures connection pooling works correctly in serverless environments
// and prevents the "too many connections" error during Next.js hot reload

declare global {
  var prisma: PrismaClient | undefined
}

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

// Export all DAL functions
export * from './dal/countries'
export * from './dal/dataNatures'
export * from './dal/devSessions'
export * from './dal/invitations'
export * from './dal/organizations'
export * from './dal/processingActs'
export * from './dal/recipientCategories'
export * from './dal/transferMechanisms'
export * from './dal/users'

// NOTE: Server-only utilities (tokens) are NOT exported from the main index
// to avoid bundling Node.js modules (crypto) in Edge Runtime (middleware).
// Import directly from '@compilothq/database/src/utils/tokens' when needed on the server.

// Re-export all Prisma types, enums, and utilities for convenience
// This includes both types and runtime values (enums)
export * from '../generated/client'

// Explicit type exports for documentation (these are also included in export * above)
export type {
  Account,
  Country,
  DataNature,
  Invitation,
  Organization,
  ProcessingAct,
  RecipientCategory,
  Session,
  TransferMechanism,
  User,
  VerificationToken,
} from '../generated/client'
