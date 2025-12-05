import type { AssetType, DigitalAsset, IntegrationStatus, LocationRole, Prisma } from '../index'
import { prisma } from '../index'

/**
 * Input type for creating asset processing locations
 */
export type AssetProcessingLocationInput = {
  service: string
  countryId: string
  locationRole: LocationRole
  purposeId?: string | null
  purposeText?: string | null
  transferMechanismId?: string | null
  isActive?: boolean
  metadata?: Prisma.InputJsonValue | null
}

/**
 * Return type for createDigitalAsset function
 */
export type CreateDigitalAssetResult = {
  asset: DigitalAsset
  locations: Prisma.AssetProcessingLocationGetPayload<object>[]
}

/**
 * Create digital asset with optional processing locations atomically
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * If locations are provided, uses Prisma transaction to ensure atomicity.
 * All locations or none are created - no partial state.
 *
 * @param data - Asset creation data with optional locations array
 * @returns Promise with created asset and locations array
 *
 * @example
 * // Create asset without locations
 * const { asset, locations } = await createDigitalAsset({
 *   organizationId: 'org-123',
 *   name: 'Google Analytics',
 *   type: 'ANALYTICS_PLATFORM',
 *   containsPersonalData: true
 * })
 *
 * @example
 * // Create asset with locations atomically
 * const { asset, locations } = await createDigitalAsset({
 *   organizationId: 'org-123',
 *   name: 'AWS S3',
 *   type: 'FILE_STORAGE',
 *   containsPersonalData: true,
 *   locations: [
 *     {
 *       service: 'S3 bucket',
 *       countryId: 'us-id',
 *       locationRole: 'HOSTING',
 *       purposeText: 'Backup storage'
 *     }
 *   ]
 * })
 */
export async function createDigitalAsset(data: {
  organizationId: string
  name: string
  type: AssetType
  description?: string | null
  primaryHostingCountryId?: string | null
  url?: string | null
  technicalOwnerId?: string | null
  businessOwnerId?: string | null
  containsPersonalData: boolean
  integrationStatus?: IntegrationStatus
  lastScannedAt?: Date | null
  discoveredVia?: string | null
  metadata?: Prisma.InputJsonValue | null
  locations?: AssetProcessingLocationInput[]
}): Promise<CreateDigitalAssetResult> {
  // If locations provided, use transaction for atomicity
  if (data.locations && data.locations.length > 0) {
    // Capture locations to preserve type narrowing across async boundary
    const locationsToCreate = data.locations

    return await prisma.$transaction(async (tx) => {
      // Create the asset
      const asset = await tx.digitalAsset.create({
        data: {
          organizationId: data.organizationId,
          name: data.name,
          type: data.type,
          description: data.description ?? undefined,
          primaryHostingCountryId: data.primaryHostingCountryId ?? undefined,
          url: data.url ?? undefined,
          technicalOwnerId: data.technicalOwnerId ?? undefined,
          businessOwnerId: data.businessOwnerId ?? undefined,
          containsPersonalData: data.containsPersonalData,
          integrationStatus: data.integrationStatus,
          lastScannedAt: data.lastScannedAt ?? undefined,
          discoveredVia: data.discoveredVia ?? undefined,
          metadata: data.metadata ?? undefined,
        },
      })

      // Create all locations
      await tx.assetProcessingLocation.createMany({
        data: locationsToCreate.map((loc) => ({
          organizationId: data.organizationId,
          digitalAssetId: asset.id,
          service: loc.service,
          countryId: loc.countryId,
          locationRole: loc.locationRole,
          purposeId: loc.purposeId ?? undefined,
          purposeText: loc.purposeText ?? undefined,
          transferMechanismId: loc.transferMechanismId ?? undefined,
          isActive: loc.isActive ?? true,
          metadata: loc.metadata ?? undefined,
        })),
        skipDuplicates: true,
      })

      // Fetch created locations to return
      const locations = await tx.assetProcessingLocation.findMany({
        where: { digitalAssetId: asset.id },
      })

      return { asset, locations }
    })
  }

  // Asset-only creation (no transaction needed)
  const asset = await prisma.digitalAsset.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      type: data.type,
      description: data.description ?? undefined,
      primaryHostingCountryId: data.primaryHostingCountryId ?? undefined,
      url: data.url ?? undefined,
      technicalOwnerId: data.technicalOwnerId ?? undefined,
      businessOwnerId: data.businessOwnerId ?? undefined,
      containsPersonalData: data.containsPersonalData,
      integrationStatus: data.integrationStatus,
      lastScannedAt: data.lastScannedAt ?? undefined,
      discoveredVia: data.discoveredVia ?? undefined,
      metadata: data.metadata ?? undefined,
    },
  })

  return { asset, locations: [] }
}

/**
 * Add processing locations to existing digital asset
 * SECURITY: Automatically inherits organizationId from parent asset
 *
 * @param assetId - The asset ID to add locations to
 * @param locations - Array of location data to create
 * @returns Promise with all locations for the asset (including newly created)
 *
 * @example
 * await addAssetProcessingLocations('asset-123', [
 *   {
 *     service: 'EU backup',
 *     countryId: 'de-id',
 *     locationRole: 'HOSTING',
 *     purposeText: 'GDPR compliance backup'
 *   }
 * ])
 */
export async function addAssetProcessingLocations(
  assetId: string,
  locations: AssetProcessingLocationInput[]
): Promise<Prisma.AssetProcessingLocationGetPayload<object>[]> {
  // Verify asset exists
  const asset = await prisma.digitalAsset.findUnique({
    where: { id: assetId },
  })

  if (!asset) {
    throw new Error(`DigitalAsset with id ${assetId} not found`)
  }

  // Create locations
  await prisma.assetProcessingLocation.createMany({
    data: locations.map((loc) => ({
      organizationId: asset.organizationId,
      digitalAssetId: assetId,
      service: loc.service,
      countryId: loc.countryId,
      locationRole: loc.locationRole,
      purposeId: loc.purposeId ?? undefined,
      purposeText: loc.purposeText ?? undefined,
      transferMechanismId: loc.transferMechanismId ?? undefined,
      isActive: loc.isActive ?? true,
      metadata: loc.metadata ?? undefined,
    })),
    skipDuplicates: true,
  })

  // Return all locations for asset
  return prisma.assetProcessingLocation.findMany({
    where: { digitalAssetId: assetId },
  })
}

/**
 * Get digital asset by ID with optional relation loading
 * Returns null if not found (no error thrown)
 *
 * @param id - The asset ID to retrieve
 * @param options - Optional includes for relations
 * @returns Promise with asset or null if not found
 *
 * @example
 * // Get asset with processing locations
 * const asset = await getDigitalAssetById('asset-123', {
 *   includeProcessingLocations: true
 * })
 */
export async function getDigitalAssetById(
  id: string,
  options?: {
    includeProcessingLocations?: boolean
    includeActivities?: boolean
    includeOwners?: boolean
  }
) {
  return prisma.digitalAsset.findUnique({
    where: { id },
    include: {
      processingLocations: options?.includeProcessingLocations
        ? { where: { isActive: true }, include: { country: true, transferMechanism: true } }
        : false,
      activities: options?.includeActivities ? { include: { activity: true } } : false,
      technicalOwner: options?.includeOwners ?? false,
      businessOwner: options?.includeOwners ?? false,
      primaryHostingCountry: true,
    },
  })
}

/**
 * List digital assets for organization with filtering options
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * @param organizationId - The organization ID to list assets for
 * @param options - Optional filters and includes
 * @returns Promise with array of assets
 *
 * @example
 * // List all personal data inventory
 * const assets = await listDigitalAssets('org-123', {
 *   containsPersonalData: true
 * })
 */
export async function listDigitalAssets(
  organizationId: string,
  options?: {
    type?: AssetType
    containsPersonalData?: boolean
    primaryHostingCountryId?: string
    includeProcessingLocations?: boolean
  }
) {
  return prisma.digitalAsset.findMany({
    where: {
      organizationId,
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.containsPersonalData !== undefined
        ? { containsPersonalData: options.containsPersonalData }
        : {}),
      ...(options?.primaryHostingCountryId
        ? { primaryHostingCountryId: options.primaryHostingCountryId }
        : {}),
    },
    include: {
      processingLocations: options?.includeProcessingLocations
        ? { where: { isActive: true } }
        : false,
      primaryHostingCountry: true,
    },
    orderBy: [{ name: 'asc' }],
  })
}

/**
 * Update digital asset (partial update)
 * Does NOT update locations - use separate location functions
 *
 * @param id - The asset ID to update
 * @param data - Partial asset data to update
 * @returns Promise with updated asset
 *
 * @example
 * await updateDigitalAsset('asset-123', {
 *   name: 'New Name',
 *   integrationStatus: 'CONNECTED'
 * })
 */
export async function updateDigitalAsset(
  id: string,
  data: {
    name?: string
    description?: string | null
    type?: AssetType
    primaryHostingCountryId?: string | null
    url?: string | null
    technicalOwnerId?: string | null
    businessOwnerId?: string | null
    containsPersonalData?: boolean
    integrationStatus?: IntegrationStatus
    lastScannedAt?: Date | null
    discoveredVia?: string | null
    metadata?: Prisma.InputJsonValue | null
  }
): Promise<DigitalAsset> {
  return prisma.digitalAsset.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description !== undefined ? (data.description ?? undefined) : undefined,
      type: data.type,
      primaryHostingCountryId:
        data.primaryHostingCountryId !== undefined
          ? (data.primaryHostingCountryId ?? undefined)
          : undefined,
      url: data.url !== undefined ? (data.url ?? undefined) : undefined,
      technicalOwnerId:
        data.technicalOwnerId !== undefined ? (data.technicalOwnerId ?? undefined) : undefined,
      businessOwnerId:
        data.businessOwnerId !== undefined ? (data.businessOwnerId ?? undefined) : undefined,
      containsPersonalData: data.containsPersonalData,
      integrationStatus: data.integrationStatus,
      lastScannedAt:
        data.lastScannedAt !== undefined ? (data.lastScannedAt ?? undefined) : undefined,
      discoveredVia:
        data.discoveredVia !== undefined ? (data.discoveredVia ?? undefined) : undefined,
      metadata: data.metadata !== undefined ? (data.metadata ?? undefined) : undefined,
    },
  })
}

/**
 * Delete digital asset with safeguard preventing deletion if linked to activities
 * SECURITY: Prevents accidental data loss by checking for activity links
 *
 * Cascade will automatically delete processingLocations.
 *
 * @param id - The asset ID to delete
 * @returns Promise with deleted asset
 * @throws Error if asset is linked to any activities
 *
 * @example
 * try {
 *   await deleteDigitalAsset('asset-123')
 * } catch (error) {
 *   // Handle error - asset may be linked to activities
 * }
 */
export async function deleteDigitalAsset(id: string): Promise<DigitalAsset> {
  // Check if asset is linked to any activities
  const junctionCount = await prisma.dataProcessingActivityDigitalAsset.count({
    where: { digitalAssetId: id },
  })

  if (junctionCount > 0) {
    throw new Error(
      `Cannot delete DigitalAsset ${id}: linked to ${junctionCount} activities. ` +
        `Unlink from all activities before deletion.`
    )
  }

  // Safe to delete (cascade will delete processingLocations)
  return prisma.digitalAsset.delete({
    where: { id },
  })
}
