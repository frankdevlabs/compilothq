import type { Country, LocationRole, Prisma, RecipientProcessingLocation } from '../index'
import { prisma } from '../index'
import { validateTransferMechanismRequirement } from '../services/transferDetection'

/**
 * Create a new recipient processing location with validation
 * SECURITY: Enforces multi-tenancy by validating organizationId
 *
 * Validates:
 * - Recipient belongs to organization
 * - Transfer mechanism required for third countries (hard validation - when Organization.headquartersCountryId is set)
 * - Purpose belongs to organization if provided
 *
 * @param data - Location data
 * @returns Promise with created location
 * @throws Error if validation fails or entities not found
 *
 * @example
 * const location = await createRecipientProcessingLocation({
 *   organizationId: 'org-123',
 *   recipientId: 'recipient-456',
 *   service: 'Email delivery via SendGrid API',
 *   countryId: 'us-id',
 *   locationRole: 'PROCESSING',
 *   transferMechanismId: 'scc-id'
 * })
 */
export async function createRecipientProcessingLocation(data: {
  organizationId: string
  recipientId: string
  service: string
  countryId: string
  locationRole: LocationRole
  purposeId?: string | null
  purposeText?: string | null
  transferMechanismId?: string | null
  metadata?: Prisma.InputJsonValue | null
}): Promise<RecipientProcessingLocation> {
  // Step 1: Validate recipient belongs to organization
  const recipient = await prisma.recipient.findUnique({
    where: { id: data.recipientId },
  })

  if (!recipient || recipient.organizationId !== data.organizationId) {
    throw new Error('Recipient not found or does not belong to organization')
  }

  // Step 2: Get location country for validation
  const locationCountry = await prisma.country.findUnique({
    where: { id: data.countryId },
  })

  if (!locationCountry) {
    throw new Error('Country not found')
  }

  // Step 3: Validate transfer mechanism requirement (hard validation)
  // If organization has a headquarters country set, validate transfer requirements
  const org = await prisma.organization.findUnique({
    where: { id: data.organizationId },
    select: {
      id: true,
      headquartersCountryId: true,
    },
  })

  if (org?.headquartersCountryId) {
    const orgCountry = await prisma.country.findUnique({
      where: { id: org.headquartersCountryId },
    })

    if (orgCountry) {
      const validation = validateTransferMechanismRequirement(
        orgCountry,
        locationCountry,
        data.transferMechanismId ?? null
      )

      if (!validation.valid) {
        throw new Error(validation.error)
      }
    }
  }

  // Step 4: Validate purpose belongs to organization if provided
  if (data.purposeId) {
    const purpose = await prisma.purpose.findUnique({
      where: { id: data.purposeId },
    })

    if (!purpose || purpose.organizationId !== data.organizationId) {
      throw new Error('Purpose not found or does not belong to organization')
    }
  }

  // Step 5: Create location
  return prisma.recipientProcessingLocation.create({
    data: {
      organizationId: data.organizationId,
      recipientId: data.recipientId,
      service: data.service,
      countryId: data.countryId,
      locationRole: data.locationRole,
      purposeId: data.purposeId ?? undefined,
      purposeText: data.purposeText ?? undefined,
      transferMechanismId: data.transferMechanismId ?? undefined,
      metadata: data.metadata ?? undefined,
      isActive: true,
    },
  })
}

/**
 * Get active processing locations for a recipient
 * SECURITY: Filters by isActive: true to exclude historical locations
 *
 * Returns locations with related country, transferMechanism, and purpose data.
 * Sorted chronologically by creation date.
 *
 * @param recipientId - The recipient ID to retrieve locations for
 * @returns Promise with array of active locations (empty if none)
 *
 * @example
 * const activeLocations = await getActiveLocationsForRecipient('recipient-123')
 * console.log(`Found ${activeLocations.length} active processing locations`)
 */
export async function getActiveLocationsForRecipient(recipientId: string): Promise<
  Array<
    RecipientProcessingLocation & {
      country: Prisma.CountryGetPayload<object>
      transferMechanism: Prisma.TransferMechanismGetPayload<object> | null
      purpose: Prisma.PurposeGetPayload<object> | null
    }
  >
> {
  return prisma.recipientProcessingLocation.findMany({
    where: {
      recipientId,
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
 * Get all locations for a recipient (including historical)
 * SECURITY: Caller must verify recipient belongs to their organization
 *
 * Used for historical snapshots and document regeneration.
 *
 * @param recipientId - The recipient ID to retrieve locations for
 * @param options - Optional filters (isActive status)
 * @returns Promise with array of locations
 *
 * @example
 * // Get all historical locations
 * const allLocations = await getAllLocationsForRecipient('recipient-123')
 *
 * // Get only inactive locations
 * const inactiveLocations = await getAllLocationsForRecipient('recipient-123', { isActive: false })
 */
export async function getAllLocationsForRecipient(
  recipientId: string,
  options?: { isActive?: boolean }
): Promise<
  Array<
    RecipientProcessingLocation & {
      country: Prisma.CountryGetPayload<object>
      transferMechanism: Prisma.TransferMechanismGetPayload<object> | null
      purpose: Prisma.PurposeGetPayload<object> | null
    }
  >
> {
  return prisma.recipientProcessingLocation.findMany({
    where: {
      recipientId,
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    },
    include: {
      country: true,
      transferMechanism: true,
      purpose: true,
    },
    orderBy: [{ createdAt: 'desc' }],
  })
}

/**
 * Update existing recipient processing location
 * Supports partial updates - all fields optional
 *
 * Does NOT update organizationId or recipientId (immutable).
 * Validates transfer mechanism requirement when country changes (when Organization.headquartersCountryId is set).
 *
 * @param id - The location ID to update
 * @param data - Partial location data to update
 * @returns Promise with updated location
 * @throws Error if location not found or validation fails
 *
 * @example
 * // Update service description
 * await updateRecipientProcessingLocation('location-123', {
 *   service: 'Updated email delivery service'
 * })
 *
 * // Move to different country with mechanism
 * await updateRecipientProcessingLocation('location-123', {
 *   countryId: 'us-id',
 *   transferMechanismId: 'scc-id'
 * })
 */
export async function updateRecipientProcessingLocation(
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
): Promise<RecipientProcessingLocation> {
  // Get existing location
  const existing = await prisma.recipientProcessingLocation.findUnique({
    where: { id },
    include: {
      country: true,
    },
  })

  if (!existing) {
    throw new Error('Location not found')
  }

  // Validate transfer mechanism if country is changing
  if (data.countryId && data.countryId !== existing.countryId) {
    const newLocationCountry = await prisma.country.findUnique({
      where: { id: data.countryId },
    })

    if (!newLocationCountry) {
      throw new Error('Country not found')
    }

    // Validate if organization has headquarters country set
    const org = await prisma.organization.findUnique({
      where: { id: existing.organizationId },
      select: {
        id: true,
        headquartersCountryId: true,
      },
    })

    if (org?.headquartersCountryId) {
      const orgCountry = await prisma.country.findUnique({
        where: { id: org.headquartersCountryId },
      })

      if (orgCountry) {
        const validation = validateTransferMechanismRequirement(
          orgCountry,
          newLocationCountry,
          data.transferMechanismId ?? existing.transferMechanismId
        )

        if (!validation.valid) {
          throw new Error(validation.error)
        }
      }
    }
  }

  return prisma.recipientProcessingLocation.update({
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
 * Deactivate recipient processing location (soft delete)
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
 * await deactivateRecipientProcessingLocation('old-location-id')
 */
export async function deactivateRecipientProcessingLocation(
  id: string
): Promise<RecipientProcessingLocation> {
  return prisma.recipientProcessingLocation.update({
    where: { id },
    data: { isActive: false },
  })
}

/**
 * Move recipient processing location to new country with validation
 * ATOMIC: Creates new location and deactivates old location in single transaction
 *
 * Use when:
 * - Processor changes data center location
 * - Recipient moves hosting to different country
 * - Service provider changes infrastructure
 *
 * Pattern:
 * 1. Read existing location
 * 2. Create new location with updated fields
 * 3. Deactivate old location
 * 4. All in single transaction with validation
 *
 * @param locationId - The existing location ID to move
 * @param updates - Fields to update in new location
 * @returns Promise with new location
 * @throws Error if validation fails or location not found
 *
 * @example
 * // Move processor from EU to US with SCC
 * const newLocation = await moveRecipientProcessingLocation('location-123', {
 *   countryId: 'us-id',
 *   transferMechanismId: 'scc-id',
 *   service: 'Moved to US data center'
 * })
 */
export async function moveRecipientProcessingLocation(
  locationId: string,
  updates: {
    countryId?: string
    service?: string
    transferMechanismId?: string | null
    locationRole?: LocationRole
    purposeId?: string | null
    purposeText?: string | null
    metadata?: Prisma.InputJsonValue | null
  }
): Promise<RecipientProcessingLocation> {
  return prisma.$transaction(async (tx) => {
    // Step 1: Get existing location
    const existing = await tx.recipientProcessingLocation.findUnique({
      where: { id: locationId },
      include: {
        country: true,
      },
    })

    if (!existing) {
      throw new Error('Location not found')
    }

    // Step 2: Merge updates with existing values
    const newCountryId = updates.countryId ?? existing.countryId
    const newTransferMechanismId =
      updates.transferMechanismId !== undefined
        ? updates.transferMechanismId
        : existing.transferMechanismId

    // Step 3: Validate transfer mechanism if country changed (when Organization.headquartersCountryId is set)
    if (newCountryId !== existing.countryId) {
      const newLocationCountry = await tx.country.findUnique({
        where: { id: newCountryId },
      })

      if (!newLocationCountry) {
        throw new Error('Country not found')
      }

      // Validate if organization has headquarters country set
      const org = await tx.organization.findUnique({
        where: { id: existing.organizationId },
        select: {
          id: true,
          headquartersCountryId: true,
        },
      })

      if (org?.headquartersCountryId) {
        const orgCountry = await tx.country.findUnique({
          where: { id: org.headquartersCountryId },
        })

        if (orgCountry) {
          const validation = validateTransferMechanismRequirement(
            orgCountry,
            newLocationCountry,
            newTransferMechanismId
          )

          if (!validation.valid) {
            throw new Error(validation.error)
          }
        }
      }
    }

    // Step 4: Create new location
    const newLocation = await tx.recipientProcessingLocation.create({
      data: {
        organizationId: existing.organizationId,
        recipientId: existing.recipientId,
        service: updates.service ?? existing.service,
        countryId: newCountryId,
        locationRole: updates.locationRole ?? existing.locationRole,
        purposeId: updates.purposeId !== undefined ? updates.purposeId : existing.purposeId,
        purposeText: updates.purposeText !== undefined ? updates.purposeText : existing.purposeText,
        transferMechanismId: newTransferMechanismId ?? undefined,
        metadata:
          updates.metadata !== undefined
            ? (updates.metadata ?? undefined)
            : (existing.metadata ?? undefined),
        isActive: true,
      },
    })

    // Step 5: Deactivate old location
    await tx.recipientProcessingLocation.update({
      where: { id: locationId },
      data: { isActive: false },
    })

    return newLocation
  })
}

/**
 * Get all processing locations in a specific country for an organization
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * Use for geographic compliance queries (e.g., "Show all processing in US").
 * Includes recipient context for business understanding.
 *
 * @param organizationId - The organization ID to query
 * @param countryId - The country ID to filter by
 * @param options - Optional filters (isActive status)
 * @returns Promise with array of locations
 *
 * @example
 * // Get all active US processing locations
 * const usLocations = await getRecipientLocationsByCountry('org-123', 'us-id', {
 *   isActive: true
 * })
 */
export async function getRecipientLocationsByCountry(
  organizationId: string,
  countryId: string,
  options?: { isActive?: boolean }
): Promise<
  Array<
    RecipientProcessingLocation & {
      recipient: Prisma.RecipientGetPayload<object>
      transferMechanism: Prisma.TransferMechanismGetPayload<object> | null
      purpose: Prisma.PurposeGetPayload<object> | null
    }
  >
> {
  return prisma.recipientProcessingLocation.findMany({
    where: {
      organizationId,
      countryId,
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    },
    include: {
      recipient: true,
      transferMechanism: true,
      purpose: true,
    },
    orderBy: [{ recipient: { name: 'asc' } }],
  })
}

/**
 * Get all processing locations for a recipient including parent chain
 * SECURITY: All queries scoped to organizationId to enforce multi-tenancy
 *
 * Traverses recipient.parentRecipient hierarchy to include all locations
 * in the sub-processor chain. Used for complete transfer analysis.
 *
 * @param recipientId - The recipient ID to start from
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise with locations grouped by recipient depth
 *
 * @example
 * // Get all locations for sub-processor and parent chain
 * const locations = await getLocationsWithParentChain('subprocessor-123', 'org-456')
 * // Returns: [
 * //   { recipientId: 'subprocessor-123', depth: 0, locations: [...] },
 * //   { recipientId: 'processor-456', depth: 1, locations: [...] }
 * // ]
 */
export async function getLocationsWithParentChain(
  recipientId: string,
  organizationId: string
): Promise<
  Array<{
    recipientId: string
    recipientName: string
    depth: number
    locations: Array<RecipientProcessingLocation & { country: Country }>
  }>
> {
  // Import recipient hierarchy functions
  const { getAncestorChain } = await import('./recipients')

  // Step 1: Get ancestor chain
  const ancestors = await getAncestorChain(recipientId, organizationId)

  // Step 2: Build recipient ID list (self + ancestors)
  const recipientIds = [recipientId, ...ancestors.map((a) => a.id)]

  // Step 3: Get all locations for these recipients
  const allLocations = await prisma.recipientProcessingLocation.findMany({
    where: {
      recipientId: { in: recipientIds },
      organizationId,
      isActive: true,
    },
    include: {
      country: true,
      recipient: { select: { id: true, name: true } },
    },
    orderBy: [{ createdAt: 'asc' }],
  })

  // Step 4: Group by recipient with depth
  const result: Array<{
    recipientId: string
    recipientName: string
    depth: number
    locations: Array<RecipientProcessingLocation & { country: Country }>
  }> = []
  const depthMap = new Map<string, number>()
  depthMap.set(recipientId, 0)
  ancestors.forEach((a, i) => depthMap.set(a.id, i + 1))

  for (const rid of recipientIds) {
    const recipientLocations = allLocations.filter((l) => l.recipientId === rid)
    if (recipientLocations.length > 0) {
      result.push({
        recipientId: rid,
        recipientName: recipientLocations[0]?.recipient.name ?? '',
        depth: depthMap.get(rid) ?? 0,
        locations: recipientLocations.map((l) => ({
          ...l,
          country: l.country,
        })),
      })
    }
  }

  return result
}
