import type { AssetProcessingLocation, LocationRole, Prisma } from '../index'
import { prisma } from '../index'

/**
 * Get active processing locations for a digital asset
 * SECURITY: Filters by isActive: true to exclude historical locations
 *
 * Returns locations with related country, transferMechanism, and purpose data.
 * Sorted chronologically by creation date.
 *
 * @param assetId - The digital asset ID to retrieve locations for
 * @returns Promise with array of active locations (empty if none)
 *
 * @example
 * const activeLocations = await getActiveLocationsForAsset('asset-123')
 * console.log(`Found ${activeLocations.length} active processing locations`)
 */
export async function getActiveLocationsForAsset(assetId: string): Promise<
  Array<
    AssetProcessingLocation & {
      country: Prisma.CountryGetPayload<object>
      transferMechanism: Prisma.TransferMechanismGetPayload<object> | null
      purpose: Prisma.PurposeGetPayload<object> | null
    }
  >
> {
  return prisma.assetProcessingLocation.findMany({
    where: {
      digitalAssetId: assetId,
      isActive: true,
    },
    include: {
      country: true,
      transferMechanism: true,
      purpose: true,
    },
    orderBy: [{ createdAt: 'asc' }],
  })
}

/**
 * Update existing asset processing location
 * Supports partial updates - all fields optional
 *
 * Does NOT update organizationId or digitalAssetId (immutable).
 *
 * @param id - The location ID to update
 * @param data - Partial location data to update
 * @returns Promise with updated location
 * @throws Error if location not found
 *
 * @example
 * await updateAssetProcessingLocation('location-123', {
 *   service: 'Updated service description',
 *   transferMechanismId: 'new-mechanism-id'
 * })
 */
export async function updateAssetProcessingLocation(
  id: string,
  data: {
    service?: string
    countryId?: string
    locationRole?: LocationRole
    purposeId?: string | null
    purposeText?: string | null
    transferMechanismId?: string | null
    isActive?: boolean
    metadata?: Prisma.InputJsonValue | null
  }
): Promise<AssetProcessingLocation> {
  return prisma.assetProcessingLocation.update({
    where: { id },
    data: {
      service: data.service,
      countryId: data.countryId,
      locationRole: data.locationRole,
      purposeId: data.purposeId !== undefined ? (data.purposeId ?? undefined) : undefined,
      purposeText: data.purposeText !== undefined ? (data.purposeText ?? undefined) : undefined,
      transferMechanismId:
        data.transferMechanismId !== undefined
          ? (data.transferMechanismId ?? undefined)
          : undefined,
      isActive: data.isActive,
      metadata: data.metadata !== undefined ? (data.metadata ?? undefined) : undefined,
    },
  })
}

/**
 * Deactivate asset processing location (soft delete)
 * SECURITY: Preserves historical data for audit trail instead of deletion
 *
 * Sets isActive: false. Deactivated locations are excluded from
 * active queries but remain in database for compliance snapshots.
 *
 * @param id - The location ID to deactivate
 * @returns Promise with deactivated location
 * @throws Error if location not found
 *
 * @example
 * // Preserve audit trail when location changes
 * await deactivateAssetProcessingLocation('old-location-id')
 * await createNewLocationRecord(...)
 */
export async function deactivateAssetProcessingLocation(
  id: string
): Promise<AssetProcessingLocation> {
  return prisma.assetProcessingLocation.update({
    where: { id },
    data: { isActive: false },
  })
}

/**
 * Get all processing locations in a specific country for an organization
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * Use for geographic compliance queries (e.g., "Show all processing in US").
 * Includes digital asset context for business understanding.
 *
 * @param organizationId - The organization ID to query
 * @param countryId - The country ID to filter by
 * @param options - Optional filters (isActive status)
 * @returns Promise with array of locations
 *
 * @example
 * // Get all active US processing locations
 * const usLocations = await getLocationsByCountry('org-123', 'us-id', {
 *   isActive: true
 * })
 */
export async function getLocationsByCountry(
  organizationId: string,
  countryId: string,
  options?: {
    isActive?: boolean
  }
): Promise<
  Array<
    AssetProcessingLocation & {
      digitalAsset: Prisma.DigitalAssetGetPayload<object>
      transferMechanism: Prisma.TransferMechanismGetPayload<object> | null
      purpose: Prisma.PurposeGetPayload<object> | null
    }
  >
> {
  return prisma.assetProcessingLocation.findMany({
    where: {
      organizationId,
      countryId,
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    },
    include: {
      digitalAsset: true,
      transferMechanism: true,
      purpose: true,
    },
    orderBy: [{ digitalAsset: { name: 'asc' } }],
  })
}
