import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../generated/client/client'
import { createPrismaWithTracking } from './middleware/changeTracking'

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

// Extended client with automatic change tracking for Tier 1 & Tier 2 models
export const prismaWithTracking = createPrismaWithTracking(prisma)

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

// Export all DAL functions
export * from './dal/agreements'
export * from './dal/assetProcessingLocations'
export * from './dal/componentChangeLogs'
export * from './dal/countries'
export * from './dal/dataCategories'
export * from './dal/dataNatures'
export * from './dal/dataProcessingActivities'
export * from './dal/dataProcessingActivityJunctions'
export * from './dal/dataSubjectCategories'
export * from './dal/devSessions'
export * from './dal/digitalAssets'
export * from './dal/externalOrganizations'
export * from './dal/invitations'
export * from './dal/legalBases'
export * from './dal/organizations'
export * from './dal/processingActs'
export * from './dal/purposes'
export * from './dal/recipientCategories'
export * from './dal/recipientProcessingLocations'
export * from './dal/recipients'
export * from './dal/transferMechanisms'
export * from './dal/users'

// Export validation functions
export * from './validation/recipientHierarchyValidation'

// Export service layer functions
export * from './services/transferDetection'

// Export change tracking middleware
export * from './middleware/changeTracking'

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
  AffectedDocument,
  Agreement,
  AssetProcessingLocation,
  // Component Change Tracking (Item 16)
  ComponentChangeLog,
  Country,
  DataCategory,
  DataCategoryDataNature,
  DataNature,
  DataProcessingActivity,
  DataProcessingActivityDigitalAsset,
  DataSubjectCategory,
  DigitalAsset,
  ExternalOrganization,
  GeneratedDocument,
  Invitation,
  LegalBasis,
  Organization,
  ProcessingAct,
  Purpose,
  Recipient,
  RecipientCategory,
  RecipientProcessingLocation,
  Session,
  TransferMechanism,
  User,
  VerificationToken,
} from '../generated/client/client'

// Export custom types from DAL (not in Prisma schema)
export type { DataProcessingActivityWithComponents } from './dal/dataProcessingActivityJunctions'
export type { AssetProcessingLocationInput } from './dal/digitalAssets'
export type {
  CrossBorderTransferAssessment,
  DuplicateOrganizationGroup,
  HierarchyHealthReport,
  RecipientMissingAgreement,
  RecipientStatistics,
  ThirdCountryRecipient,
} from './dal/recipients'

// Export validation types
export type { HierarchyRules, ValidationResult } from './validation/recipientHierarchyValidation'

// Export service layer types
export type {
  ActivityAssetTransferAnalysis,
  ActivityTransferAnalysis,
  ActivityTransferAnalysisComplete,
  AssetCrossBorderTransfer,
  CrossBorderTransfer,
  TransferRisk,
} from './services/transferDetection'

// Export change tracking types
export type { ChangeTrackingContext, PrismaWithTracking } from './middleware/changeTracking'

// Export Prisma client type utilities
export type { PrismaClientOrTransaction, PrismaTransactionClient } from './types/prisma'
