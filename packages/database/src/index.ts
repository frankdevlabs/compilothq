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
export * from './dal/countries'
export * from './dal/dataCategories'
export * from './dal/dataNatures'
export * from './dal/dataProcessingActivities'
export * from './dal/dataSubjectCategories'
export * from './dal/devSessions'
export * from './dal/externalOrganizations'
export * from './dal/invitations'
export * from './dal/legalBases'
export * from './dal/organizations'
export * from './dal/processingActs'
export * from './dal/purposes'
export * from './dal/recipientCategories'
export * from './dal/recipients'
export * from './dal/transferMechanisms'
export * from './dal/users'

// Export validation functions
export * from './validation/recipientHierarchyValidation'

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
  Agreement,
  Country,
  DataCategory,
  DataCategoryDataNature,
  DataNature,
  DataProcessingActivity,
  DataSubjectCategory,
  ExternalOrganization,
  Invitation,
  LegalBasis,
  Organization,
  ProcessingAct,
  Purpose,
  Recipient,
  RecipientCategory,
  Session,
  TransferMechanism,
  User,
  VerificationToken,
} from '../generated/client/client'

// Export custom types from DAL (not in Prisma schema)
export type {
  CrossBorderTransferAssessment,
  DuplicateOrganizationGroup,
  ExpiringAgreement,
  HierarchyHealthReport,
  RecipientMissingAgreement,
  RecipientStatistics,
  ThirdCountryRecipient,
} from './dal/recipients'

// Export validation types
export type { HierarchyRules, ValidationResult } from './validation/recipientHierarchyValidation'
