import type { Country, RecipientProcessingLocation, TransferMechanism } from '../index'

/**
 * Cross-border transfer detected by service layer composition
 * Represents a derived relationship between organization and recipient location
 */
export interface CrossBorderTransfer {
  organizationCountry: Country
  recipientId: string
  recipientName: string
  recipientType: string
  processingLocation: RecipientProcessingLocation & {
    country: Country
    transferMechanism: TransferMechanism | null
  }
  transferRisk: TransferRisk
  depth: number // Depth in sub-processor chain (0 = direct recipient)
}

/**
 * Transfer risk assessment result
 * Discriminated union type for type-safe risk handling
 */
export type TransferRisk =
  | { level: 'NONE'; reason: 'SAME_JURISDICTION' }
  | { level: 'LOW'; reason: 'ADEQUACY_DECISION' }
  | { level: 'MEDIUM'; reason: 'SAFEGUARDS_IN_PLACE'; mechanism: TransferMechanism }
  | { level: 'HIGH'; reason: 'MISSING_SAFEGUARDS'; requiredMechanism: string }
  | { level: 'CRITICAL'; reason: 'THIRD_COUNTRY_NO_MECHANISM' }

/**
 * Activity-level transfer analysis
 * Aggregates all transfers for a specific processing activity
 */
export interface ActivityTransferAnalysis {
  activityId: string
  activityName: string
  organizationCountry: Country
  transfers: CrossBorderTransfer[]
  summary: {
    totalRecipients: number
    recipientsWithTransfers: number
    riskDistribution: {
      none: number
      low: number
      medium: number
      high: number
      critical: number
    }
    countriesInvolved: Array<{ country: Country; locationCount: number }>
  }
}

/**
 * Check if two countries are in the same legal jurisdiction
 * Uses Country.gdprStatus JSON to determine legal framework
 *
 * Same jurisdiction:
 * - Both EU/EEA countries
 * - Both non-EU but covered by adequacy decision
 *
 * @param country1 - First country
 * @param country2 - Second country
 * @returns true if same jurisdiction, false otherwise
 *
 * @example
 * const france = { gdprStatus: ['EU', 'EEA'] }
 * const germany = { gdprStatus: ['EU'] }
 * isSameJurisdiction(france, germany) // true
 *
 * @example
 * const usa = { gdprStatus: ['Third Country'] }
 * isSameJurisdiction(france, usa) // false
 */
export function isSameJurisdiction(country1: Country, country2: Country): boolean {
  const status1 = country1.gdprStatus as string[]
  const status2 = country2.gdprStatus as string[]

  // Both EU or EEA
  const bothEuEea =
    (status1.includes('EU') || status1.includes('EEA')) &&
    (status2.includes('EU') || status2.includes('EEA'))

  if (bothEuEea) return true

  // Both have adequacy decision (same adequate framework)
  const bothAdequate = status1.includes('Adequate') && status2.includes('Adequate')
  if (bothAdequate) return true

  return false
}

/**
 * Check if country is a third country (not EU/EEA/Adequate)
 *
 * @param country - Country to check
 * @returns true if third country, false otherwise
 *
 * @example
 * const usa = { gdprStatus: ['Third Country'] }
 * isThirdCountry(usa) // true
 *
 * @example
 * const france = { gdprStatus: ['EU', 'EEA'] }
 * isThirdCountry(france) // false
 */
export function isThirdCountry(country: Country): boolean {
  const status = country.gdprStatus as string[]
  return !status.some((s) => ['EU', 'EEA', 'Adequate'].includes(s))
}

/**
 * Check if transfer from origin to destination requires safeguards
 * Implements GDPR Article 44-46 logic
 *
 * Requires safeguards when:
 * - Origin is EU/EEA
 * - Destination is third country without adequacy decision
 *
 * @param origin - Origin country (organization country)
 * @param destination - Destination country (processing location)
 * @returns true if safeguards required, false otherwise
 *
 * @example
 * const france = { gdprStatus: ['EU', 'EEA'] }
 * const china = { gdprStatus: ['Third Country'] }
 * requiresSafeguards(france, china) // true (EU → third country requires safeguards)
 *
 * @example
 * const usa = { gdprStatus: ['Third Country'] }
 * requiresSafeguards(usa, china) // false (third → third doesn't require safeguards)
 */
export function requiresSafeguards(origin: Country, destination: Country): boolean {
  const originStatus = origin.gdprStatus as string[]

  // Origin must be EU/EEA
  const originIsEuEea = originStatus.includes('EU') || originStatus.includes('EEA')
  if (!originIsEuEea) return false

  // Destination must be third country
  return isThirdCountry(destination)
}

/**
 * Derive transfer risk level based on countries and mechanism
 * Core business logic for transfer risk assessment
 *
 * Risk levels:
 * - NONE: Same jurisdiction (both EU or both adequate)
 * - LOW: Adequacy decision exists
 * - MEDIUM: Third country with safeguards in place
 * - HIGH: Third country missing safeguards (non-EU origin)
 * - CRITICAL: Third country without mechanism (EU/EEA origin)
 *
 * @param origin - Origin country (organization country)
 * @param destination - Destination country (processing location)
 * @param transferMechanism - Transfer mechanism if present
 * @returns TransferRisk assessment
 *
 * @example
 * const france = { gdprStatus: ['EU'] }
 * const germany = { gdprStatus: ['EU'] }
 * deriveTransferRisk(france, germany, null) // { level: 'NONE', reason: 'SAME_JURISDICTION' }
 *
 * @example
 * const usa = { gdprStatus: ['Third Country'] }
 * const scc = { code: 'SCC', name: 'Standard Contractual Clauses' }
 * deriveTransferRisk(france, usa, scc) // { level: 'MEDIUM', reason: 'SAFEGUARDS_IN_PLACE', mechanism: scc }
 */
export function deriveTransferRisk(
  origin: Country,
  destination: Country,
  transferMechanism: TransferMechanism | null
): TransferRisk {
  // Step 1: Same jurisdiction - no risk
  if (isSameJurisdiction(origin, destination)) {
    return { level: 'NONE', reason: 'SAME_JURISDICTION' }
  }

  // Step 2: Destination has adequacy decision - low risk
  const status = destination.gdprStatus as string[]
  if (status.includes('Adequate')) {
    return { level: 'LOW', reason: 'ADEQUACY_DECISION' }
  }

  // Step 3: Third country requiring safeguards
  if (requiresSafeguards(origin, destination)) {
    if (transferMechanism) {
      return {
        level: 'MEDIUM',
        reason: 'SAFEGUARDS_IN_PLACE',
        mechanism: transferMechanism,
      }
    } else {
      return {
        level: 'CRITICAL',
        reason: 'THIRD_COUNTRY_NO_MECHANISM',
      }
    }
  }

  // Step 4: Other third country scenarios
  if (isThirdCountry(destination)) {
    if (transferMechanism) {
      return {
        level: 'MEDIUM',
        reason: 'SAFEGUARDS_IN_PLACE',
        mechanism: transferMechanism,
      }
    } else {
      return {
        level: 'HIGH',
        reason: 'MISSING_SAFEGUARDS',
        requiredMechanism: 'Standard Contractual Clauses or equivalent',
      }
    }
  }

  // Default: no transfer
  return { level: 'NONE', reason: 'SAME_JURISDICTION' }
}

/**
 * Validate transfer mechanism requirement
 * Used by DAL functions for hard validation
 *
 * Validation logic:
 * - Same jurisdiction: mechanism NOT required
 * - EU/EEA to third country: mechanism REQUIRED (hard validation)
 * - Other transfers: mechanism optional
 *
 * @param origin - Origin country
 * @param destination - Destination country
 * @param transferMechanismId - Transfer mechanism ID if provided
 * @returns Validation result with error message if invalid
 *
 * @example
 * const france = { gdprStatus: ['EU'] }
 * const usa = { name: 'United States', gdprStatus: ['Third Country'] }
 * await validateTransferMechanismRequirement(france, usa, null)
 * // { valid: false, required: true, error: "Transfer mechanism required: United States is a third country..." }
 */
export function validateTransferMechanismRequirement(
  origin: Country,
  destination: Country,
  transferMechanismId: string | null
): { valid: boolean; required: boolean; error?: string } {
  // Same jurisdiction - no mechanism required
  if (isSameJurisdiction(origin, destination)) {
    return { valid: true, required: false }
  }

  // Third country requiring safeguards - mechanism REQUIRED
  if (requiresSafeguards(origin, destination)) {
    if (!transferMechanismId) {
      return {
        valid: false,
        required: true,
        error: `Transfer mechanism required: ${destination.name} is a third country without adequacy decision. Select an appropriate safeguard under GDPR Article 46 (e.g., Standard Contractual Clauses).`,
      }
    }
    return { valid: true, required: true }
  }

  // Adequacy decision exists - no mechanism required but allowed
  return { valid: true, required: false }
}

/**
 * Detect all cross-border transfers for an organization
 * Compares organization country with all recipient processing locations
 *
 * NOTE: This function requires Organization.headquartersCountryId field to be present in the schema.
 * If the field is not present, the function will throw an error.
 *
 * Algorithm:
 * 1. Get organization country
 * 2. Get all active recipients with active locations
 * 3. For each location, derive transfer risk
 * 4. Include parent chain locations for sub-processors
 * 5. Return aggregated transfer list
 *
 * @param organizationId - The organization ID to analyze
 * @returns Promise with array of detected cross-border transfers
 * @throws Error if organization or organization country not found
 *
 * @example
 * const transfers = await detectCrossBorderTransfers('org-123')
 * // Returns: [
 * //   {
 * //     organizationCountry: { name: 'France', gdprStatus: ['EU'] },
 * //     recipientId: 'recipient-456',
 * //     recipientName: 'Mailchimp',
 * //     transferRisk: { level: 'MEDIUM', reason: 'SAFEGUARDS_IN_PLACE', mechanism: {...} },
 * //     depth: 0
 * //   }
 * // ]
 */
export async function detectCrossBorderTransfers(
  organizationId: string
): Promise<CrossBorderTransfer[]> {
  const { prisma } = await import('../index')
  const { getAncestorChain } = await import('../dal/recipients')

  // Step 1: Get organization with headquarters country
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      headquartersCountry: true,
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Graceful degradation: If no headquarters country set, return empty array
  if (!org.headquartersCountry) {
    console.warn(
      `Organization ${organizationId} has no headquartersCountryId - transfer detection skipped`
    )
    return []
  }

  const orgCountry = org.headquartersCountry

  // Step 2: Get all active recipients with locations
  const recipients = await prisma.recipient.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      processingLocations: {
        where: { isActive: true },
        include: {
          country: true,
          transferMechanism: true,
        },
      },
    },
  })

  // Step 3: Detect transfers
  const transfers: CrossBorderTransfer[] = []

  for (const recipient of recipients) {
    // Direct recipient locations (depth 0)
    for (const location of recipient.processingLocations) {
      const risk = deriveTransferRisk(orgCountry, location.country, location.transferMechanism)

      // Only include if actual transfer detected
      if (risk.level !== 'NONE') {
        transfers.push({
          organizationCountry: orgCountry,
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientType: recipient.type,
          processingLocation: location,
          transferRisk: risk,
          depth: 0,
        })
      }
    }

    // Parent chain locations (depth > 0) for sub-processors
    if (recipient.parentRecipientId) {
      const ancestors = await getAncestorChain(recipient.id, organizationId)

      for (let i = 0; i < ancestors.length; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const ancestor = ancestors[i]
        if (!ancestor) continue

        const ancestorLocations = await prisma.recipientProcessingLocation.findMany({
          where: {
            recipientId: ancestor.id,
            isActive: true,
          },
          include: {
            country: true,
            transferMechanism: true,
          },
        })

        for (const location of ancestorLocations) {
          const risk = deriveTransferRisk(orgCountry, location.country, location.transferMechanism)

          if (risk.level !== 'NONE') {
            transfers.push({
              organizationCountry: orgCountry,
              recipientId: ancestor.id,
              recipientName: ancestor.name,
              recipientType: ancestor.type,
              processingLocation: location,
              transferRisk: risk,
              depth: i + 1,
            })
          }
        }
      }
    }
  }

  return transfers
}

/**
 * Analyze cross-border transfers for a specific processing activity
 * Gets all recipients linked to activity and analyzes their locations
 *
 * NOTE: This function requires Organization.headquartersCountryId field to be present in the schema.
 * If the field is not present, the function will throw an error.
 *
 * Algorithm:
 * 1. Get activity with linked recipients
 * 2. For each recipient, get locations (including parent chain)
 * 3. Derive transfer risks
 * 4. Aggregate summary statistics
 * 5. Return structured analysis
 *
 * @param activityId - The processing activity ID to analyze
 * @returns Promise with activity transfer analysis
 * @throws Error if activity or organization country not found
 *
 * @example
 * const analysis = await getActivityTransferAnalysis('activity-123')
 * // Returns: {
 * //   activityId: 'activity-123',
 * //   activityName: 'Email Marketing',
 * //   organizationCountry: { name: 'France', gdprStatus: ['EU'] },
 * //   transfers: [...],
 * //   summary: {
 * //     totalRecipients: 5,
 * //     recipientsWithTransfers: 2,
 * //     riskDistribution: { none: 0, low: 0, medium: 1, high: 0, critical: 1 },
 * //     countriesInvolved: [{ country: {...}, locationCount: 2 }]
 * //   }
 * // }
 */
export async function getActivityTransferAnalysis(
  activityId: string
): Promise<ActivityTransferAnalysis> {
  const { prisma } = await import('../index')
  const { getAncestorChain } = await import('../dal/recipients')

  // Step 1: Get activity
  const activity = await prisma.dataProcessingActivity.findUnique({
    where: { id: activityId },
  })

  if (!activity) {
    throw new Error('Activity not found')
  }

  // Get organization with headquarters country
  const org = await prisma.organization.findUnique({
    where: { id: activity.organizationId },
    include: {
      headquartersCountry: true,
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Require headquarters country for analysis (cannot analyze without it)
  if (!org.headquartersCountry) {
    throw new Error(
      `Organization ${activity.organizationId} has no headquartersCountryId set. Please set the organization's headquarters country to enable cross-border transfer analysis.`
    )
  }

  const orgCountry = org.headquartersCountry

  // Get activity recipients with locations
  const activityRecipients = await prisma.dataProcessingActivityRecipient.findMany({
    where: { activityId },
    include: {
      recipient: {
        include: {
          processingLocations: {
            where: { isActive: true },
            include: {
              country: true,
              transferMechanism: true,
            },
          },
        },
      },
    },
  })

  // Step 2: Detect transfers for each recipient
  const transfers: CrossBorderTransfer[] = []
  const recipientsWithTransfers = new Set<string>()
  const countriesMap = new Map<string, { country: Country; count: number }>()

  for (const recipientLink of activityRecipients) {
    const recipient = recipientLink.recipient

    // Direct recipient locations
    for (const location of recipient.processingLocations) {
      const risk = deriveTransferRisk(orgCountry, location.country, location.transferMechanism)

      if (risk.level !== 'NONE') {
        transfers.push({
          organizationCountry: orgCountry,
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientType: recipient.type,
          processingLocation: location,
          transferRisk: risk,
          depth: 0,
        })

        recipientsWithTransfers.add(recipient.id)

        // Track country
        const existing = countriesMap.get(location.countryId)
        if (existing) {
          existing.count++
        } else {
          countriesMap.set(location.countryId, { country: location.country, count: 1 })
        }
      }
    }

    // Parent chain locations for sub-processors
    if (recipient.parentRecipientId) {
      const ancestors = await getAncestorChain(recipient.id, activity.organizationId)

      for (let i = 0; i < ancestors.length; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const ancestor = ancestors[i]
        if (!ancestor) continue

        const ancestorLocations = await prisma.recipientProcessingLocation.findMany({
          where: {
            recipientId: ancestor.id,
            isActive: true,
          },
          include: {
            country: true,
            transferMechanism: true,
          },
        })

        for (const location of ancestorLocations) {
          const risk = deriveTransferRisk(orgCountry, location.country, location.transferMechanism)

          if (risk.level !== 'NONE') {
            transfers.push({
              organizationCountry: orgCountry,
              recipientId: ancestor.id,
              recipientName: ancestor.name,
              recipientType: ancestor.type,
              processingLocation: location,
              transferRisk: risk,
              depth: i + 1,
            })

            recipientsWithTransfers.add(ancestor.id)

            const existing = countriesMap.get(location.countryId)
            if (existing) {
              existing.count++
            } else {
              countriesMap.set(location.countryId, { country: location.country, count: 1 })
            }
          }
        }
      }
    }
  }

  // Step 3: Calculate summary statistics
  const riskDistribution = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }

  for (const transfer of transfers) {
    switch (transfer.transferRisk.level) {
      case 'NONE':
        riskDistribution.none++
        break
      case 'LOW':
        riskDistribution.low++
        break
      case 'MEDIUM':
        riskDistribution.medium++
        break
      case 'HIGH':
        riskDistribution.high++
        break
      case 'CRITICAL':
        riskDistribution.critical++
        break
    }
  }

  const countriesInvolved = Array.from(countriesMap.values())
    .map((v) => ({ country: v.country, locationCount: v.count }))
    .sort((a, b) => b.locationCount - a.locationCount)

  return {
    activityId: activity.id,
    activityName: activity.name,
    organizationCountry: orgCountry,
    transfers,
    summary: {
      totalRecipients: activityRecipients.length,
      recipientsWithTransfers: recipientsWithTransfers.size,
      riskDistribution,
      countriesInvolved,
    },
  }
}
