/**
 * Change Tracking Middleware for Prisma Client
 *
 * Implements automatic change tracking for compliance-critical components using Prisma Client Extensions.
 * Tracks modifications to AssetProcessingLocation, RecipientProcessingLocation, DataProcessingActivity,
 * TransferMechanism, DataSubjectCategory, DataCategory, and other models to enable document staleness
 * detection and audit trails.
 *
 * Features:
 * - Automatic snapshot generation with flattened nested data
 * - Minimal includes for performance (Country, TransferMechanism only for locations)
 * - Environment variable escape hatch (DISABLE_CHANGE_TRACKING=true)
 * - Optional context for userId and changeReason
 * - Synchronous logging in same transaction
 * - Tracks CREATE, UPDATE, and DELETED (soft-delete) operations
 *
 * @module changeTracking
 */

import { Prisma, type PrismaClient } from '../../generated/client/client'

/**
 * Configuration defining which fields are tracked for each model
 * Only changes to these fields will trigger ComponentChangeLog creation
 */
export const TRACKED_FIELDS_BY_MODEL: Record<string, string[]> = {
  DigitalAsset: [
    'name',
    'description',
    'type',
    'primaryHostingCountryId',
    'hostingDetail',
    'url',
    'technicalOwnerId',
    'businessOwnerId',
    'containsPersonalData',
    'integrationStatus',
    'lastScannedAt',
    'discoveredVia',
    'metadata',
  ],
  AssetProcessingLocation: ['countryId', 'transferMechanismId', 'locationRole', 'isActive'],
  RecipientProcessingLocation: ['countryId', 'transferMechanismId', 'locationRole', 'isActive'],
  DataProcessingActivity: [
    'riskLevel',
    'requiresDPIA',
    'dpiaStatus',
    'retentionPeriodValue',
    'retentionPeriodUnit',
    'retentionJustification',
    'status',
  ],
  TransferMechanism: [
    'name',
    'code',
    'description',
    'gdprArticle',
    'category',
    'requiresSupplementaryMeasures',
    'isActive',
  ],
  DataSubjectCategory: ['name', 'isVulnerable', 'vulnerabilityReason', 'suggestsDPIA', 'isActive'],
  DataCategory: ['name', 'description', 'sensitivity', 'isSpecialCategory', 'isActive'],
  Purpose: ['name', 'description', 'category', 'scope', 'isActive'],
  LegalBasis: ['type', 'name', 'framework', 'requiresConsent', 'consentMechanism', 'isActive'],
  Recipient: [
    'type',
    'externalOrganizationId',
    'purpose',
    'description',
    'parentRecipientId',
    'isActive',
  ],
}

/**
 * Context interface for runtime parameters
 * Passed to change tracking operations to capture user and reason
 */
export interface ChangeTrackingContext {
  userId?: string
  organizationId?: string
  changeReason?: string
}

/**
 * Check if change tracking is disabled via environment variable
 * Escape hatch for tests and scripts where tracking is not needed
 */
function isChangeTrackingDisabled(): boolean {
  return process.env['DISABLE_CHANGE_TRACKING'] === 'true'
}

/**
 * Compare two objects and detect which tracked fields changed
 * Only returns fields that are in the TRACKED_FIELDS configuration
 *
 * @param modelName - Name of the model being compared
 * @param before - Object state before update
 * @param after - Object state after update
 * @returns Array of field names that changed
 */
function detectChangedFields(
  modelName: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): string[] {
  // Safe: TRACKED_FIELDS_BY_MODEL is a controlled constant, not user input
  // eslint-disable-next-line security/detect-object-injection
  const trackedFields = TRACKED_FIELDS_BY_MODEL[modelName] ?? []
  const changedFields: string[] = []

  for (const field of trackedFields) {
    // Add type guard to validate field exists before access
    if (!(field in before) || !(field in after)) continue

    // Safe: field comes from TRACKED_FIELDS_BY_MODEL constant, validated via type guard
    // eslint-disable-next-line security/detect-object-injection
    const beforeValue = before[field]
    // eslint-disable-next-line security/detect-object-injection
    const afterValue = after[field]

    if (beforeValue !== afterValue) {
      changedFields.push(field)
    }
  }

  return changedFields
}

/**
 * Create snapshot for DigitalAsset
 * Includes tracked compliance and hosting fields
 */
function createDigitalAssetSnapshot(asset: Record<string, unknown>): Prisma.InputJsonValue {
  return {
    name: asset['name'],
    description: asset['description'],
    type: asset['type'],
    primaryHostingCountryId: asset['primaryHostingCountryId'],
    hostingDetail: asset['hostingDetail'],
    url: asset['url'],
    technicalOwnerId: asset['technicalOwnerId'],
    businessOwnerId: asset['businessOwnerId'],
    containsPersonalData: asset['containsPersonalData'],
    integrationStatus: asset['integrationStatus'],
    lastScannedAt: asset['lastScannedAt'],
    discoveredVia: asset['discoveredVia'],
    metadata: asset['metadata'],
  } as Prisma.InputJsonValue
}

/**
 * Create flattened snapshot for location models
 * Includes nested country and transferMechanism data for human readability
 *
 * @param location - AssetProcessingLocation or RecipientProcessingLocation with includes
 * @returns Flattened snapshot object
 */
function createLocationSnapshot(
  location: Record<string, unknown> & {
    country?: { id: string; name: string; isoCode: string; gdprStatus: unknown }
    transferMechanism?: { id: string; name: string; code: string; gdprArticle: string } | null
  }
): Prisma.InputJsonValue {
  const snapshot: Record<string, unknown> = {
    countryId: location['countryId'],
    locationRole: location['locationRole'],
    transferMechanismId: location['transferMechanismId'],
    isActive: location['isActive'],
  }

  // Flatten country data
  if (location['country']) {
    snapshot['country'] = {
      id: location['country'].id,
      name: location['country'].name,
      isoCode: location['country'].isoCode,
      gdprStatus: location['country'].gdprStatus,
    }
  }

  // Flatten transfer mechanism data
  if (location['transferMechanism']) {
    snapshot['transferMechanism'] = {
      id: location['transferMechanism'].id,
      name: location['transferMechanism'].name,
      code: location['transferMechanism'].code,
      gdprArticle: location['transferMechanism'].gdprArticle,
    }
  } else if (location['transferMechanismId'] === null) {
    snapshot['transferMechanism'] = null
  }

  return snapshot as Prisma.InputJsonValue
}

/**
 * Create snapshot for DataProcessingActivity
 * Includes all tracked fields
 *
 * @param activity - DataProcessingActivity data
 * @returns Snapshot object with tracked fields
 */
function createActivitySnapshot(activity: Record<string, unknown>): Prisma.InputJsonValue {
  return {
    riskLevel: activity['riskLevel'],
    requiresDPIA: activity['requiresDPIA'],
    dpiaStatus: activity['dpiaStatus'],
    retentionPeriodValue: activity['retentionPeriodValue'],
    retentionPeriodUnit: activity['retentionPeriodUnit'],
    retentionJustification: activity['retentionJustification'],
    status: activity['status'],
  } as Prisma.InputJsonValue
}

/**
 * Create snapshot for TransferMechanism
 * Includes GDPR article, category, and supplementary measures classification
 *
 * @param mechanism - TransferMechanism data
 * @returns Snapshot object with classification fields
 */
function createTransferMechanismSnapshot(
  mechanism: Record<string, unknown>
): Prisma.InputJsonValue {
  return {
    name: mechanism['name'],
    code: mechanism['code'],
    description: mechanism['description'],
    gdprArticle: mechanism['gdprArticle'],
    category: mechanism['category'],
    requiresSupplementaryMeasures: mechanism['requiresSupplementaryMeasures'],
    isActive: mechanism['isActive'],
  } as Prisma.InputJsonValue
}

/**
 * Create snapshot for DataSubjectCategory
 * Includes vulnerability flags and DPIA suggestion
 *
 * @param category - DataSubjectCategory data
 * @returns Snapshot object with vulnerability and DPIA fields
 */
function createDataSubjectCategorySnapshot(
  category: Record<string, unknown>
): Prisma.InputJsonValue {
  return {
    name: category['name'],
    isVulnerable: category['isVulnerable'],
    vulnerabilityReason: category['vulnerabilityReason'],
    suggestsDPIA: category['suggestsDPIA'],
    isActive: category['isActive'],
  } as Prisma.InputJsonValue
}

/**
 * Create snapshot for DataCategory
 * Includes sensitivity and special category classification
 *
 * @param category - DataCategory data
 * @returns Snapshot object with sensitivity and special category flags
 */
function createDataCategorySnapshot(category: Record<string, unknown>): Prisma.InputJsonValue {
  return {
    name: category['name'],
    description: category['description'],
    sensitivity: category['sensitivity'],
    isSpecialCategory: category['isSpecialCategory'],
    isActive: category['isActive'],
  } as Prisma.InputJsonValue
}

/**
 * Create Prisma Client extension with change tracking
 * Uses modern Prisma client extensions API ($extends)
 *
 * This extension intercepts create and update operations on tracked models and automatically
 * creates ComponentChangeLog entries for:
 * - CREATE operations (logs CREATED changeType with null oldValue)
 * - UPDATE operations (logs UPDATED changeType when tracked fields change)
 * - DELETED operations (detects isActive flip from true→false)
 *
 * @param basePrisma - The base Prisma client to extend
 * @param context - Optional change tracking context
 * @returns Extended Prisma client with change tracking
 */
// ============================================================================
// Prisma Extension Type Suppressions
// ============================================================================
// The Prisma $extends API has inherent typing limitations where callback
// parameters and return types cannot be fully typed. These suppressions are
// intentional and safe because:
// 1. Prisma validates args at runtime
// 2. Database constraints enforce data integrity
// 3. We use explicit type assertions at DAL boundaries
// ============================================================================
export function createPrismaWithTracking(
  basePrisma: PrismaClient,
  context?: ChangeTrackingContext
) {
  return basePrisma.$extends({
    name: 'changeTracking',
    query: {
      digitalAsset: {
        /**
         * Track DigitalAsset creation
         * Logs CREATED changeType with null oldValue and full snapshot in newValue
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async create({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const result = await basePrisma.digitalAsset.create({
            ...args,
          })

          await basePrisma.componentChangeLog.create({
            data: {
              organizationId:
                (result as { organizationId?: string }).organizationId ??
                context?.organizationId ??
                '',
              componentType: 'DigitalAsset',
              componentId: result.id,
              changeType: 'CREATED',
              fieldChanged: null,
              oldValue: Prisma.JsonNull,
              newValue: createDigitalAssetSnapshot(result),
              changedByUserId: context?.userId ?? null,
              changeReason: context?.changeReason ?? null,
            },
          })

          return result
        },

        /**
         * Track DigitalAsset updates
         * Logs UPDATED changeType for each tracked field that changed
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async update({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const before = await basePrisma.digitalAsset.findUnique({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: args.where,
          })

          if (!before) {
            throw new Error('DigitalAsset not found')
          }

          const result = await basePrisma.digitalAsset.update({
            ...args,
          })

          const changedFields = detectChangedFields('DigitalAsset', before, result)

          if (changedFields.length > 0) {
            for (const field of changedFields) {
              await basePrisma.componentChangeLog.create({
                data: {
                  organizationId:
                    (result as { organizationId?: string }).organizationId ??
                    context?.organizationId ??
                    '',
                  componentType: 'DigitalAsset',
                  componentId: result.id,
                  changeType: 'UPDATED',
                  fieldChanged: field,
                  oldValue: createDigitalAssetSnapshot(before),
                  newValue: createDigitalAssetSnapshot(result),
                  changedByUserId: context?.userId ?? null,
                  changeReason: context?.changeReason ?? null,
                },
              })
            }
          }

          return result
        },
      },
      assetProcessingLocation: {
        /**
         * Track AssetProcessingLocation creation
         * Logs CREATED changeType with null oldValue and full snapshot in newValue
         */
        // Prisma extension callbacks have untyped args/query - this is a Prisma limitation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async create({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const result = await basePrisma.assetProcessingLocation.create({
            ...args,
            include: {
              country: { select: { id: true, name: true, isoCode: true, gdprStatus: true } },
              transferMechanism: {
                select: { id: true, name: true, code: true, gdprArticle: true },
              },
            },
          })

          await basePrisma.componentChangeLog.create({
            data: {
              organizationId:
                (result as { organizationId?: string }).organizationId ??
                context?.organizationId ??
                '',
              componentType: 'AssetProcessingLocation',
              componentId: result.id,
              changeType: 'CREATED',
              fieldChanged: null,
              oldValue: Prisma.JsonNull,
              newValue: createLocationSnapshot(result as never),
              changedByUserId: context?.userId ?? null,
              changeReason: context?.changeReason ?? null,
            },
          })

          return result
        },

        /**
         * Track AssetProcessingLocation updates
         * Logs UPDATED changeType for each tracked field that changed
         */
        // Prisma extension callbacks have untyped args/query - this is a Prisma limitation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async update({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const before = await basePrisma.assetProcessingLocation.findUnique({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: args.where,
            include: {
              country: { select: { id: true, name: true, isoCode: true, gdprStatus: true } },
              transferMechanism: {
                select: { id: true, name: true, code: true, gdprArticle: true },
              },
            },
          })

          if (!before) {
            throw new Error('AssetProcessingLocation not found')
          }

          const result = await basePrisma.assetProcessingLocation.update({
            ...args,
            include: {
              country: { select: { id: true, name: true, isoCode: true, gdprStatus: true } },
              transferMechanism: {
                select: { id: true, name: true, code: true, gdprArticle: true },
              },
            },
          })

          // Detect restoration (soft-delete → active)
          if (before.isActive === false && result.isActive === true) {
            await basePrisma.componentChangeLog.create({
              data: {
                organizationId:
                  (result as { organizationId?: string }).organizationId ??
                  context?.organizationId ??
                  '',
                componentType: 'AssetProcessingLocation',
                componentId: result.id,
                changeType: 'RESTORED',
                fieldChanged: 'isActive',
                oldValue: createLocationSnapshot(before as never),
                newValue: createLocationSnapshot(result as never),
                changedByUserId: context?.userId ?? null,
                changeReason: context?.changeReason ?? null,
              },
            })

            return result // Exit early - prevents double-logging as UPDATED
          }

          const changedFields = detectChangedFields('AssetProcessingLocation', before, result)

          if (changedFields.length > 0) {
            for (const field of changedFields) {
              await basePrisma.componentChangeLog.create({
                data: {
                  organizationId:
                    (result as { organizationId?: string }).organizationId ??
                    context?.organizationId ??
                    '',
                  componentType: 'AssetProcessingLocation',
                  componentId: result.id,
                  changeType: 'UPDATED',
                  fieldChanged: field,
                  oldValue: createLocationSnapshot(before as never),
                  newValue: createLocationSnapshot(result as never),
                  changedByUserId: context?.userId ?? null,
                  changeReason: context?.changeReason ?? null,
                },
              })
            }
          }

          return result
        },
      },
      recipientProcessingLocation: {
        /**
         * Track RecipientProcessingLocation creation
         * Logs CREATED changeType with null oldValue and full snapshot in newValue
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async create({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const result = await basePrisma.recipientProcessingLocation.create({
            ...args,
            include: {
              country: { select: { id: true, name: true, isoCode: true, gdprStatus: true } },
              transferMechanism: {
                select: { id: true, name: true, code: true, gdprArticle: true },
              },
            },
          })

          await basePrisma.componentChangeLog.create({
            data: {
              organizationId:
                (result as { organizationId?: string }).organizationId ??
                context?.organizationId ??
                '',
              componentType: 'RecipientProcessingLocation',
              componentId: result.id,
              changeType: 'CREATED',
              fieldChanged: null,
              oldValue: Prisma.JsonNull,
              newValue: createLocationSnapshot(result as never),
              changedByUserId: context?.userId ?? null,
              changeReason: context?.changeReason ?? null,
            },
          })

          return result
        },

        /**
         * Track RecipientProcessingLocation updates
         * Logs UPDATED changeType for each tracked field that changed
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async update({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const before = await basePrisma.recipientProcessingLocation.findUnique({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: args.where,
            include: {
              country: { select: { id: true, name: true, isoCode: true, gdprStatus: true } },
              transferMechanism: {
                select: { id: true, name: true, code: true, gdprArticle: true },
              },
            },
          })

          if (!before) {
            throw new Error('RecipientProcessingLocation not found')
          }

          const result = await basePrisma.recipientProcessingLocation.update({
            ...args,
            include: {
              country: { select: { id: true, name: true, isoCode: true, gdprStatus: true } },
              transferMechanism: {
                select: { id: true, name: true, code: true, gdprArticle: true },
              },
            },
          })

          // Detect restoration (soft-delete → active)
          if (before.isActive === false && result.isActive === true) {
            await basePrisma.componentChangeLog.create({
              data: {
                organizationId:
                  (result as { organizationId?: string }).organizationId ??
                  context?.organizationId ??
                  '',
                componentType: 'RecipientProcessingLocation',
                componentId: result.id,
                changeType: 'RESTORED',
                fieldChanged: 'isActive',
                oldValue: createLocationSnapshot(before as never),
                newValue: createLocationSnapshot(result as never),
                changedByUserId: context?.userId ?? null,
                changeReason: context?.changeReason ?? null,
              },
            })

            return result // Exit early - prevents double-logging as UPDATED
          }

          const changedFields = detectChangedFields('RecipientProcessingLocation', before, result)

          if (changedFields.length > 0) {
            for (const field of changedFields) {
              await basePrisma.componentChangeLog.create({
                data: {
                  organizationId:
                    (result as { organizationId?: string }).organizationId ??
                    context?.organizationId ??
                    '',
                  componentType: 'RecipientProcessingLocation',
                  componentId: result.id,
                  changeType: 'UPDATED',
                  fieldChanged: field,
                  oldValue: createLocationSnapshot(before as never),
                  newValue: createLocationSnapshot(result as never),
                  changedByUserId: context?.userId ?? null,
                  changeReason: context?.changeReason ?? null,
                },
              })
            }
          }

          return result
        },
      },
      dataProcessingActivity: {
        /**
         * Track DataProcessingActivity creation
         * Logs CREATED changeType with null oldValue and full snapshot in newValue
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async create({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const result = await basePrisma.dataProcessingActivity.create(args)

          await basePrisma.componentChangeLog.create({
            data: {
              organizationId:
                (result as { organizationId?: string }).organizationId ??
                context?.organizationId ??
                '',
              componentType: 'DataProcessingActivity',
              componentId: result.id,
              changeType: 'CREATED',
              fieldChanged: null,
              oldValue: Prisma.JsonNull,
              newValue: createActivitySnapshot(result),
              changedByUserId: context?.userId ?? null,
              changeReason: context?.changeReason ?? null,
            },
          })

          return result
        },

        /**
         * Track DataProcessingActivity updates
         * Logs UPDATED changeType for each tracked field that changed
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async update({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const before = await basePrisma.dataProcessingActivity.findUnique({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: args.where,
          })

          if (!before) {
            throw new Error('DataProcessingActivity not found')
          }

          const result = await basePrisma.dataProcessingActivity.update(args)

          const changedFields = detectChangedFields('DataProcessingActivity', before, result)

          if (changedFields.length > 0) {
            for (const field of changedFields) {
              await basePrisma.componentChangeLog.create({
                data: {
                  organizationId:
                    (result as { organizationId?: string }).organizationId ??
                    context?.organizationId ??
                    '',
                  componentType: 'DataProcessingActivity',
                  componentId: result.id,
                  changeType: 'UPDATED',
                  fieldChanged: field,
                  oldValue: createActivitySnapshot(before),
                  newValue: createActivitySnapshot(result),
                  changedByUserId: context?.userId ?? null,
                  changeReason: context?.changeReason ?? null,
                },
              })
            }
          }

          return result
        },
      },
      transferMechanism: {
        /**
         * Track TransferMechanism creation
         * Logs CREATED changeType with null oldValue and full snapshot in newValue
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async create({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const result = await basePrisma.transferMechanism.create(args)

          await basePrisma.componentChangeLog.create({
            data: {
              organizationId:
                (result as { organizationId?: string }).organizationId ??
                context?.organizationId ??
                '',
              componentType: 'TransferMechanism',
              componentId: result.id,
              changeType: 'CREATED',
              fieldChanged: null,
              oldValue: Prisma.JsonNull,
              newValue: createTransferMechanismSnapshot(result),
              changedByUserId: context?.userId ?? null,
              changeReason: context?.changeReason ?? null,
            },
          })

          return result
        },

        /**
         * Track TransferMechanism updates
         * Logs UPDATED changeType for each tracked field that changed
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async update({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const before = await basePrisma.transferMechanism.findUnique({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: args.where,
          })

          if (!before) {
            throw new Error('TransferMechanism not found')
          }

          const result = await basePrisma.transferMechanism.update(args)

          const changedFields = detectChangedFields('TransferMechanism', before, result)

          if (changedFields.length > 0) {
            for (const field of changedFields) {
              await basePrisma.componentChangeLog.create({
                data: {
                  organizationId:
                    (result as { organizationId?: string }).organizationId ??
                    context?.organizationId ??
                    '',
                  componentType: 'TransferMechanism',
                  componentId: result.id,
                  changeType: 'UPDATED',
                  fieldChanged: field,
                  oldValue: createTransferMechanismSnapshot(before),
                  newValue: createTransferMechanismSnapshot(result),
                  changedByUserId: context?.userId ?? null,
                  changeReason: context?.changeReason ?? null,
                },
              })
            }
          }

          return result
        },
      },
      dataSubjectCategory: {
        /**
         * Track DataSubjectCategory creation
         * Logs CREATED changeType with null oldValue and full snapshot in newValue
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async create({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const result = await basePrisma.dataSubjectCategory.create(args)

          await basePrisma.componentChangeLog.create({
            data: {
              organizationId:
                (result as { organizationId?: string }).organizationId ??
                context?.organizationId ??
                '',
              componentType: 'DataSubjectCategory',
              componentId: result.id,
              changeType: 'CREATED',
              fieldChanged: null,
              oldValue: Prisma.JsonNull,
              newValue: createDataSubjectCategorySnapshot(result),
              changedByUserId: context?.userId ?? null,
              changeReason: context?.changeReason ?? null,
            },
          })

          return result
        },

        /**
         * Track DataSubjectCategory updates
         * Logs UPDATED changeType for each tracked field that changed
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async update({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const before = await basePrisma.dataSubjectCategory.findUnique({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: args.where,
          })

          if (!before) {
            throw new Error('DataSubjectCategory not found')
          }

          const result = await basePrisma.dataSubjectCategory.update(args)

          // Detect restoration (soft-delete → active)
          if (before.isActive === false && result.isActive === true) {
            await basePrisma.componentChangeLog.create({
              data: {
                organizationId:
                  (result as { organizationId?: string }).organizationId ??
                  context?.organizationId ??
                  '',
                componentType: 'DataSubjectCategory',
                componentId: result.id,
                changeType: 'RESTORED',
                fieldChanged: 'isActive',
                oldValue: createDataSubjectCategorySnapshot(before),
                newValue: createDataSubjectCategorySnapshot(result),
                changedByUserId: context?.userId ?? null,
                changeReason: context?.changeReason ?? null,
              },
            })

            return result // Exit early - prevents double-logging as UPDATED
          }

          const changedFields = detectChangedFields('DataSubjectCategory', before, result)

          if (changedFields.length > 0) {
            for (const field of changedFields) {
              await basePrisma.componentChangeLog.create({
                data: {
                  organizationId:
                    (result as { organizationId?: string }).organizationId ??
                    context?.organizationId ??
                    '',
                  componentType: 'DataSubjectCategory',
                  componentId: result.id,
                  changeType: 'UPDATED',
                  fieldChanged: field,
                  oldValue: createDataSubjectCategorySnapshot(before),
                  newValue: createDataSubjectCategorySnapshot(result),
                  changedByUserId: context?.userId ?? null,
                  changeReason: context?.changeReason ?? null,
                },
              })
            }
          }

          return result
        },
      },
      dataCategory: {
        /**
         * Track DataCategory creation
         * Logs CREATED changeType with null oldValue and full snapshot in newValue
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async create({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const result = await basePrisma.dataCategory.create(args)

          await basePrisma.componentChangeLog.create({
            data: {
              organizationId:
                (result as { organizationId?: string }).organizationId ??
                context?.organizationId ??
                '',
              componentType: 'DataCategory',
              componentId: result.id,
              changeType: 'CREATED',
              fieldChanged: null,
              oldValue: Prisma.JsonNull,
              newValue: createDataCategorySnapshot(result),
              changedByUserId: context?.userId ?? null,
              changeReason: context?.changeReason ?? null,
            },
          })

          return result
        },

        /**
         * Track DataCategory updates
         * Logs UPDATED changeType for each tracked field that changed
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async update({ args, query }: any) {
          if (isChangeTrackingDisabled()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return query(args)
          }

          const before = await basePrisma.dataCategory.findUnique({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: args.where,
          })

          if (!before) {
            throw new Error('DataCategory not found')
          }

          const result = await basePrisma.dataCategory.update(args)

          // Detect restoration (soft-delete → active)
          if (before.isActive === false && result.isActive === true) {
            await basePrisma.componentChangeLog.create({
              data: {
                organizationId:
                  (result as { organizationId?: string }).organizationId ??
                  context?.organizationId ??
                  '',
                componentType: 'DataCategory',
                componentId: result.id,
                changeType: 'RESTORED',
                fieldChanged: 'isActive',
                oldValue: createDataCategorySnapshot(before),
                newValue: createDataCategorySnapshot(result),
                changedByUserId: context?.userId ?? null,
                changeReason: context?.changeReason ?? null,
              },
            })

            return result // Exit early - prevents double-logging as UPDATED
          }

          const changedFields = detectChangedFields('DataCategory', before, result)

          if (changedFields.length > 0) {
            for (const field of changedFields) {
              await basePrisma.componentChangeLog.create({
                data: {
                  organizationId:
                    (result as { organizationId?: string }).organizationId ??
                    context?.organizationId ??
                    '',
                  componentType: 'DataCategory',
                  componentId: result.id,
                  changeType: 'UPDATED',
                  fieldChanged: field,
                  oldValue: createDataCategorySnapshot(before),
                  newValue: createDataCategorySnapshot(result),
                  changedByUserId: context?.userId ?? null,
                  changeReason: context?.changeReason ?? null,
                },
              })
            }
          }

          return result
        },
      },
    },
  })
}

/**
 * Type for the extended Prisma client
 */
export type PrismaWithTracking = ReturnType<typeof createPrismaWithTracking>

/**
 * Re-export the singleton instance from index.ts for backward compatibility
 * This allows importing from both '@compilothq/database' and '@compilothq/database/middleware/changeTracking'
 */
export { prismaWithTracking } from '../index'
