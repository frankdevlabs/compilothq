import type {
  Agreement,
  Country,
  ExternalOrganization,
  HierarchyType,
  Recipient,
  RecipientType,
} from '../index'
import { Prisma, prisma } from '../index'

/**
 * Create a new recipient
 * SECURITY: Recipient is automatically scoped to the provided organizationId
 */
export async function createRecipient(data: {
  name: string
  type: RecipientType
  organizationId: string
  externalOrganizationId?: string | null
  purpose?: string | null
  description?: string | null
  parentRecipientId?: string | null
  hierarchyType?: HierarchyType | null
  isActive?: boolean
}): Promise<Recipient> {
  return await prisma.recipient.create({
    data: {
      name: data.name,
      type: data.type,
      organizationId: data.organizationId,
      externalOrganizationId: data.externalOrganizationId,
      purpose: data.purpose,
      description: data.description,
      parentRecipientId: data.parentRecipientId,
      hierarchyType: data.hierarchyType,
      isActive: data.isActive ?? true,
    },
  })
}

/**
 * Get a recipient by ID
 * Returns null if recipient doesn't exist
 * Includes relations: externalOrganization, parentRecipient, children
 */
export async function getRecipientById(id: string): Promise<Prisma.RecipientGetPayload<{
  include: {
    externalOrganization: true
    parentRecipient: true
    children: true
  }
}> | null> {
  return await prisma.recipient.findUnique({
    where: { id },
    include: {
      externalOrganization: true,
      parentRecipient: true,
      children: true,
    },
  })
}

/**
 * Get a recipient by ID with ownership verification
 * SECURITY: Enforces multi-tenancy by requiring both id and organizationId match
 * Returns null if recipient doesn't exist or doesn't belong to the organization
 */
export async function getRecipientByIdForOrg(
  id: string,
  organizationId: string
): Promise<Recipient | null> {
  return await prisma.recipient.findUnique({
    where: {
      id,
      organizationId,
    },
  })
}

/**
 * List recipients by organization with cursor-based pagination
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 */
export async function listRecipientsByOrganization(
  organizationId: string,
  options?: {
    type?: RecipientType
    isActive?: boolean
    limit?: number
    cursor?: string
  }
): Promise<{
  items: Recipient[]
  nextCursor: string | null
}> {
  const limit = options?.limit ?? 50

  const recipients = await prisma.recipient.findMany({
    where: {
      organizationId,
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // Fetch one extra to determine if there are more
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  })

  // Check if there are more items
  const hasMore = recipients.length > limit
  const items = hasMore ? recipients.slice(0, limit) : recipients
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

  return {
    items,
    nextCursor,
  }
}

/**
 * Update a recipient
 * SECURITY: Caller must verify recipient belongs to their organization before calling
 * Supports explicit null values to clear optional fields
 */
export async function updateRecipient(
  id: string,
  data: {
    name?: string
    type?: RecipientType
    externalOrganizationId?: string | null
    purpose?: string | null
    description?: string | null
    parentRecipientId?: string | null
    hierarchyType?: HierarchyType | null
    isActive?: boolean
  }
): Promise<Recipient> {
  return await prisma.recipient.update({
    where: { id },
    data,
  })
}

/**
 * Delete a recipient
 * SECURITY: Caller must verify recipient belongs to their organization before calling
 */
export async function deleteRecipient(id: string): Promise<Recipient> {
  return await prisma.recipient.delete({
    where: { id },
  })
}

// ============================================================================
// Hierarchy Operations
// ============================================================================

/**
 * Get direct children of a recipient (only immediate children, not descendants)
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * @param recipientId - The recipient ID to get children for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<Recipient[]> - Array of immediate child recipients
 *
 * @example
 * const children = await getDirectChildren('parent-id', 'org-id')
 * // Returns only immediate children, not grandchildren
 */
export async function getDirectChildren(
  recipientId: string,
  organizationId: string
): Promise<Recipient[]> {
  return await prisma.recipient.findMany({
    where: {
      parentRecipientId: recipientId,
      organizationId,
    },
    orderBy: [{ createdAt: 'asc' }],
  })
}

/**
 * Get full descendant tree for a recipient with depth tracking using recursive CTE
 * SECURITY: CTE filters by organizationId at root level to enforce multi-tenancy
 *
 * Uses PostgreSQL recursive CTE to traverse the hierarchy efficiently.
 * Depth tracking starts at 1 for immediate children.
 *
 * Max depth rationale:
 * - Processor chains: 5 levels (GDPR Art. 28(2) sub-processor chains)
 * - Internal departments: 10 levels (organizational hierarchy)
 *
 * @param recipientId - The recipient ID to get descendants for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param maxDepth - Maximum depth to traverse (default: 10)
 * @returns Promise<Array<Recipient & { depth: number }>> - Array of descendants with depth
 *
 * @example
 * const tree = await getDescendantTree('root-id', 'org-id', 5)
 * // Returns: [{ ...recipient, depth: 1 }, { ...recipient, depth: 2 }, ...]
 */
export async function getDescendantTree(
  recipientId: string,
  organizationId: string,
  maxDepth = 10
): Promise<Array<Recipient & { depth: number }>> {
  // Use recursive CTE to get full descendant tree with depth tracking
  const query = Prisma.sql`
    WITH RECURSIVE descendant_tree AS (
      -- Base case: direct children (depth 1)
      SELECT
        r.*,
        1 as depth
      FROM "Recipient" r
      WHERE r."parentRecipientId" = ${recipientId}
        AND r."organizationId" = ${organizationId}

      UNION ALL

      -- Recursive case: children of children
      SELECT
        r.*,
        dt.depth + 1 as depth
      FROM "Recipient" r
      INNER JOIN descendant_tree dt ON r."parentRecipientId" = dt.id
      WHERE dt.depth < ${maxDepth}
        AND r."organizationId" = ${organizationId}
    )
    SELECT * FROM descendant_tree
    ORDER BY depth, "createdAt" ASC
  `

  const results = await prisma.$queryRaw<Array<Recipient & { depth: bigint }>>(query)

  // Convert BigInt depth to number
  return results.map((r) => ({
    ...r,
    depth: Number(r.depth),
  }))
}

/**
 * Get ancestor chain for a recipient (from immediate parent to root)
 * SECURITY: Each iteration verifies organizationId to enforce multi-tenancy
 *
 * Uses iterative traversal up the parentRecipientId chain.
 * Returns array ordered from immediate parent to root.
 * Stops at null parentRecipientId or max iterations (15) to prevent infinite loops.
 *
 * @param recipientId - The recipient ID to get ancestors for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<Recipient[]> - Array of ancestors from parent to root
 *
 * @example
 * const ancestors = await getAncestorChain('child-id', 'org-id')
 * // Returns: [parent, grandparent, root]
 */
export async function getAncestorChain(
  recipientId: string,
  organizationId: string
): Promise<Recipient[]> {
  const ancestors: Recipient[] = []
  let currentId: string | null = recipientId
  let iterations = 0
  const MAX_ITERATIONS = 15

  // Get the starting recipient to find its parent
  let current = await prisma.recipient.findUnique({
    where: {
      id: currentId,
      organizationId,
    },
  })

  // Traverse up the parent chain
  while (current?.parentRecipientId && iterations < MAX_ITERATIONS) {
    const parent = await prisma.recipient.findUnique({
      where: {
        id: current.parentRecipientId,
        organizationId, // SECURITY: Enforce organization on each iteration
      },
    })

    if (!parent) {
      // Parent not found or doesn't belong to this organization
      break
    }

    ancestors.push(parent)
    current = parent
    iterations++
  }

  return ancestors
}

/**
 * Check if setting a parent would create a circular reference
 * SECURITY: All queries scoped to organizationId to enforce multi-tenancy
 *
 * Circular reference detection logic:
 * 1. Direct self-reference: recipientId === parentRecipientId
 * 2. Indirect cycle: parentRecipientId exists in recipientId's descendant tree
 *
 * Prevents invalid hierarchies where a recipient is its own ancestor.
 *
 * @param recipientId - The recipient that would get a new parent
 * @param parentRecipientId - The proposed parent recipient ID
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<boolean> - true if circular reference detected, false otherwise
 *
 * @example
 * const isCircular = await checkCircularReference('child-id', 'grandchild-id', 'org-id')
 * // Returns: true (grandchild is descendant of child, would create cycle)
 */
export async function checkCircularReference(
  recipientId: string,
  parentRecipientId: string,
  organizationId: string
): Promise<boolean> {
  // Check 1: Direct self-reference
  if (recipientId === parentRecipientId) {
    return true
  }

  // Check 2: Traverse ancestor chain of parentRecipientId to see if recipientId is found
  const ancestors = await getAncestorChain(parentRecipientId, organizationId)

  // If recipientId is found in the ancestor chain of parentRecipientId,
  // then setting parentRecipientId as parent of recipientId would create a cycle
  return ancestors.some((ancestor) => ancestor.id === recipientId)
}

/**
 * Calculate hierarchy depth for a recipient (number of ancestors)
 * SECURITY: Traversal scoped to organizationId to enforce multi-tenancy
 *
 * Depth calculation:
 * - 0 = root recipient (no parent)
 * - 1 = one parent above (direct child of root)
 * - N = N parents above
 *
 * Uses ancestor chain traversal to count parents.
 *
 * @param recipientId - The recipient ID to calculate depth for
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<number> - Depth level (0 for root, 1+ for nested)
 *
 * @example
 * const depth = await calculateHierarchyDepth('recipient-id', 'org-id')
 * // Returns: 2 (recipient has parent and grandparent)
 */
export async function calculateHierarchyDepth(
  recipientId: string,
  organizationId: string
): Promise<number> {
  const ancestors = await getAncestorChain(recipientId, organizationId)
  return ancestors.length
}

// ============================================================================
// Advanced Query Patterns (Q4-Q15)
// ============================================================================

/**
 * Q4: Get recipients by type with cursor-based pagination
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * Filters recipients by specific RecipientType within an organization.
 * Useful for listing all PROCESSOR, SUB_PROCESSOR, or INTERNAL_DEPARTMENT recipients.
 *
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param type - The RecipientType to filter by
 * @param options - Pagination options (limit, cursor)
 * @returns Promise<{ items: Recipient[], nextCursor: string | null }>
 *
 * @example
 * const { items, nextCursor } = await getRecipientsByType('org-id', 'PROCESSOR', { limit: 20 })
 */
export async function getRecipientsByType(
  organizationId: string,
  type: RecipientType,
  options?: {
    limit?: number
    cursor?: string
  }
): Promise<{
  items: Recipient[]
  nextCursor: string | null
}> {
  const limit = options?.limit ?? 50

  const recipients = await prisma.recipient.findMany({
    where: {
      organizationId,
      type,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  })

  const hasMore = recipients.length > limit
  const items = hasMore ? recipients.slice(0, limit) : recipients
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

  return {
    items,
    nextCursor,
  }
}

/**
 * Q5: Find orphaned recipients (SUB_PROCESSOR types without valid parent)
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * Data quality check to identify SUB_PROCESSOR recipients that should have
 * a parent (PROCESSOR or SUB_PROCESSOR) but parentRecipientId is null.
 *
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<Recipient[]> - Array of orphaned sub-processors
 *
 * @example
 * const orphaned = await findOrphanedRecipients('org-id')
 * // Returns: [{ id: '...', type: 'SUB_PROCESSOR', parentRecipientId: null, ... }]
 */
export async function findOrphanedRecipients(organizationId: string): Promise<Recipient[]> {
  return await prisma.recipient.findMany({
    where: {
      organizationId,
      type: 'SUB_PROCESSOR',
      parentRecipientId: null,
    },
    orderBy: [{ createdAt: 'desc' }],
  })
}

/**
 * Q6: Get recipients for a specific data processing activity
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * Temporary solution using activityIds array until RecipientDataProcessingActivity
 * junction table is implemented (roadmap #13).
 *
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @param activityId - The data processing activity ID
 * @returns Promise<Recipient[]> - Array of recipients linked to activity
 *
 * @example
 * const recipients = await getRecipientsForActivity('org-id', 'activity-id')
 */
export async function getRecipientsForActivity(
  organizationId: string,
  activityId: string
): Promise<Recipient[]> {
  return await prisma.recipient.findMany({
    where: {
      organizationId,
      activityIds: {
        has: activityId,
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  })
}

/**
 * Type for recipients missing required agreements
 */
export type RecipientMissingAgreement = Recipient & {
  requiredAgreementType: string
  externalOrganization: ExternalOrganization | null
}

/**
 * Q7: Find recipients missing required agreements
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * Complex join: Recipients -> ExternalOrg -> Agreements
 * Checks if:
 * - PROCESSOR types have active DPA
 * - JOINT_CONTROLLER types have active JOINT_CONTROLLER_AGREEMENT
 *
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<RecipientMissingAgreement[]> - Recipients with required agreement type
 *
 * @example
 * const missing = await findRecipientsMissingAgreements('org-id')
 * // Returns: [{ ...recipient, requiredAgreementType: 'DPA' }]
 */
export async function findRecipientsMissingAgreements(
  organizationId: string
): Promise<RecipientMissingAgreement[]> {
  // Get all recipients that require agreements (PROCESSOR or JOINT_CONTROLLER)
  const recipients = await prisma.recipient.findMany({
    where: {
      organizationId,
      type: {
        in: ['PROCESSOR', 'JOINT_CONTROLLER'],
      },
      externalOrganizationId: {
        not: null,
      },
    },
    include: {
      externalOrganization: {
        include: {
          agreements: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      },
    },
  })

  // Filter recipients missing required agreements
  const missing: RecipientMissingAgreement[] = []

  for (const recipient of recipients) {
    const requiredType = recipient.type === 'PROCESSOR' ? 'DPA' : 'JOINT_CONTROLLER_AGREEMENT'
    const hasRequiredAgreement = recipient.externalOrganization?.agreements.some(
      (agreement) => agreement.type === requiredType
    )

    if (!hasRequiredAgreement) {
      missing.push({
        ...recipient,
        requiredAgreementType: requiredType,
      })
    }
  }

  return missing
}

/**
 * Type for third-country recipients with country details
 */
export type ThirdCountryRecipient = Recipient & {
  country: Country
  externalOrganization: ExternalOrganization | null
}

/**
 * Q8: Get third-country recipients
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * Join through ExternalOrg -> Country to identify recipients with headquarters
 * in countries where gdprStatus does NOT contain 'EU', 'EEA', or 'Adequate'.
 *
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<ThirdCountryRecipient[]> - Recipients with third-country headquarters
 *
 * @example
 * const thirdCountry = await getThirdCountryRecipients('org-id')
 * // Returns: [{ ...recipient, country: { name: 'United States', ... } }]
 */
export async function getThirdCountryRecipients(
  organizationId: string
): Promise<ThirdCountryRecipient[]> {
  const recipients = await prisma.recipient.findMany({
    where: {
      organizationId,
      externalOrganization: {
        headquartersCountryId: {
          not: null,
        },
      },
    },
    include: {
      externalOrganization: {
        include: {
          headquartersCountry: true,
        },
      },
    },
  })

  // Filter for third countries (not EU/EEA/Adequate)
  const thirdCountryRecipients: ThirdCountryRecipient[] = []

  for (const recipient of recipients) {
    const country = recipient.externalOrganization?.headquartersCountry
    if (!country) continue

    const gdprStatus = country.gdprStatus as string[]
    const isThirdCountry = !gdprStatus.some((status) => ['EU', 'EEA', 'Adequate'].includes(status))

    if (isThirdCountry) {
      thirdCountryRecipients.push({
        ...recipient,
        country,
      })
    }
  }

  return thirdCountryRecipients
}

/**
 * Type for recipient statistics
 */
export interface RecipientStatistics {
  totalRecipients: number
  byType: Record<RecipientType, number>
  withParent: number
  withoutParent: number
  activeRecipients: number
  inactiveRecipients: number
  withAgreements: number
  withoutAgreements: number
  thirdCountryRecipients: number
}

/**
 * Q9: Get recipient statistics for dashboard/reporting
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * Aggregates counts by:
 * - Type (PROCESSOR, SUB_PROCESSOR, etc.)
 * - Hierarchy status (with/without parent)
 * - Active/inactive status
 * - Agreement status
 * - Third-country status
 *
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<RecipientStatistics> - Structured statistics object
 *
 * @example
 * const stats = await getRecipientStatistics('org-id')
 * // Returns: { totalRecipients: 10, byType: { PROCESSOR: 5, ... }, ... }
 */
export async function getRecipientStatistics(organizationId: string): Promise<RecipientStatistics> {
  // Get all recipients for this organization
  const recipients = await prisma.recipient.findMany({
    where: { organizationId },
    include: {
      externalOrganization: {
        include: {
          agreements: {
            where: { status: 'ACTIVE' },
          },
          headquartersCountry: true,
        },
      },
    },
  })

  // Initialize statistics
  const stats: RecipientStatistics = {
    totalRecipients: recipients.length,
    byType: {
      PROCESSOR: 0,
      SUB_PROCESSOR: 0,
      JOINT_CONTROLLER: 0,
      SERVICE_PROVIDER: 0,
      SEPARATE_CONTROLLER: 0,
      PUBLIC_AUTHORITY: 0,
      INTERNAL_DEPARTMENT: 0,
    },
    withParent: 0,
    withoutParent: 0,
    activeRecipients: 0,
    inactiveRecipients: 0,
    withAgreements: 0,
    withoutAgreements: 0,
    thirdCountryRecipients: 0,
  }

  // Calculate statistics
  for (const recipient of recipients) {
    // Count by type
    stats.byType[recipient.type]++

    // Count hierarchy status
    if (recipient.parentRecipientId) {
      stats.withParent++
    } else {
      stats.withoutParent++
    }

    // Count active/inactive
    if (recipient.isActive) {
      stats.activeRecipients++
    } else {
      stats.inactiveRecipients++
    }

    // Count agreement status
    const hasAgreements =
      recipient.externalOrganization && recipient.externalOrganization.agreements.length > 0
    if (hasAgreements) {
      stats.withAgreements++
    } else {
      stats.withoutAgreements++
    }

    // Count third-country recipients
    const country = recipient.externalOrganization?.headquartersCountry
    if (country) {
      const gdprStatus = country.gdprStatus as string[]
      const isThirdCountry = !gdprStatus.some((status) =>
        ['EU', 'EEA', 'Adequate'].includes(status)
      )
      if (isThirdCountry) {
        stats.thirdCountryRecipients++
      }
    }
  }

  return stats
}

/**
 * Type for duplicate external organizations
 */
export interface DuplicateOrganizationGroup {
  legalName: string
  count: number
  ids: string[]
}

/**
 * Q10: Find duplicate external organizations by legal name
 * SECURITY: No organizationId filter - ExternalOrganization is global
 *
 * Groups external organizations by exact legalName match to identify potential duplicates.
 * Future iteration could use Levenshtein distance for fuzzy matching.
 *
 * @returns Promise<DuplicateOrganizationGroup[]> - Groups with count > 1
 *
 * @example
 * const duplicates = await findDuplicateExternalOrgs()
 * // Returns: [{ legalName: 'AWS Inc.', count: 2, ids: ['id1', 'id2'] }]
 */
export async function findDuplicateExternalOrgs(): Promise<DuplicateOrganizationGroup[]> {
  const orgs = await prisma.externalOrganization.findMany({
    select: {
      id: true,
      legalName: true,
    },
  })

  // Group by legalName
  const groups = new Map<string, string[]>()
  for (const org of orgs) {
    const existing = groups.get(org.legalName) ?? []
    existing.push(org.id)
    groups.set(org.legalName, existing)
  }

  // Filter groups with count > 1
  const duplicates: DuplicateOrganizationGroup[] = []
  for (const [legalName, ids] of groups) {
    if (ids.length > 1) {
      duplicates.push({
        legalName,
        count: ids.length,
        ids,
      })
    }
  }

  return duplicates
}

/**
 * Type for expiring agreements
 */
export type ExpiringAgreement = Agreement & {
  externalOrganization: ExternalOrganization
}

/**
 * Q11: Get expiring agreements
 * SECURITY: No organizationId filter - Agreements are global via ExternalOrganization
 *
 * Finds active agreements expiring within specified days threshold.
 * Used for proactive agreement renewal management.
 *
 * @param daysThreshold - Number of days ahead to check (default: 30)
 * @returns Promise<ExpiringAgreement[]> - Agreements expiring soon
 *
 * @example
 * const expiring = await getExpiringAgreements(30)
 * // Returns agreements expiring in next 30 days
 */
export async function getExpiringAgreements(daysThreshold = 30): Promise<ExpiringAgreement[]> {
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

  return await prisma.agreement.findMany({
    where: {
      status: 'ACTIVE',
      expiryDate: {
        not: null,
        lte: thresholdDate,
      },
    },
    include: {
      externalOrganization: true,
    },
    orderBy: {
      expiryDate: 'asc',
    },
  })
}

/**
 * Q12: Find unlinked recipients (missing externalOrganizationId)
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * Data quality check to identify recipients that should have an external
 * organization link but don't (excludes INTERNAL_DEPARTMENT type).
 *
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<Recipient[]> - Recipients without external organization
 *
 * @example
 * const unlinked = await findUnlinkedRecipients('org-id')
 */
export async function findUnlinkedRecipients(organizationId: string): Promise<Recipient[]> {
  return await prisma.recipient.findMany({
    where: {
      organizationId,
      externalOrganizationId: null,
      type: {
        not: 'INTERNAL_DEPARTMENT',
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  })
}

/**
 * Type for cross-border transfer assessment
 */
export interface CrossBorderTransferAssessment {
  recipient: Recipient
  country: Country | null
  depth: number
}

/**
 * Q13: Assess cross-border transfers in recipient chain
 * SECURITY: All queries scoped to organizationId to enforce multi-tenancy
 *
 * Gets full descendant tree for a recipient and identifies all unique countries
 * in the processing chain. Used for GDPR Art. 44-49 transfer assessments.
 *
 * @param recipientId - The recipient ID to assess
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<CrossBorderTransferAssessment[]> - All countries in chain
 *
 * @example
 * const transfers = await assessCrossBorderTransfers('recipient-id', 'org-id')
 * // Returns: [{ recipient, country: { name: 'US' }, depth: 0 }, ...]
 */
export async function assessCrossBorderTransfers(
  recipientId: string,
  organizationId: string
): Promise<CrossBorderTransferAssessment[]> {
  // Get the root recipient
  const rootRecipient = await prisma.recipient.findUnique({
    where: { id: recipientId, organizationId },
    include: {
      externalOrganization: {
        include: {
          headquartersCountry: true,
        },
      },
    },
  })

  if (!rootRecipient) {
    return []
  }

  // Get full descendant tree
  const descendants = await getDescendantTree(recipientId, organizationId)

  // Get full details for all descendants
  const descendantDetails = await prisma.recipient.findMany({
    where: {
      id: {
        in: descendants.map((d) => d.id),
      },
      organizationId,
    },
    include: {
      externalOrganization: {
        include: {
          headquartersCountry: true,
        },
      },
    },
  })

  // Combine root and descendants
  const allRecipients = [rootRecipient, ...descendantDetails]

  // Build assessment with depth info
  const assessments: CrossBorderTransferAssessment[] = []
  const depthMap = new Map<string, number>()
  depthMap.set(recipientId, 0)
  descendants.forEach((d) => depthMap.set(d.id, d.depth))

  for (const recipient of allRecipients) {
    assessments.push({
      recipient,
      country: recipient.externalOrganization?.headquartersCountry ?? null,
      depth: depthMap.get(recipient.id) ?? 0,
    })
  }

  return assessments
}

/**
 * Type for hierarchy health report
 */
export interface HierarchyHealthReport {
  totalIssues: number
  orphanedSubProcessors: Recipient[]
  unlinkedRecipients: Recipient[]
  depthViolations: Array<{ recipient: Recipient; currentDepth: number; maxAllowed: number }>
  circularReferences: string[] // Array of recipient IDs with circular refs (complex to detect)
}

/**
 * Q14: Check hierarchy health across all recipients
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 *
 * Comprehensive validation check that identifies:
 * - Orphaned sub-processors (no parent)
 * - Unlinked recipients (no external org)
 * - Depth violations (exceeds max for type)
 * - Circular references (future: requires graph traversal)
 *
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<HierarchyHealthReport> - Structured report with all issues
 *
 * @example
 * const report = await checkHierarchyHealth('org-id')
 * // Returns: { totalIssues: 5, orphanedSubProcessors: [...], ... }
 */
export async function checkHierarchyHealth(organizationId: string): Promise<HierarchyHealthReport> {
  // Run all data quality checks in parallel
  const [orphaned, unlinked, allRecipients] = await Promise.all([
    findOrphanedRecipients(organizationId),
    findUnlinkedRecipients(organizationId),
    prisma.recipient.findMany({
      where: { organizationId },
      include: {
        externalOrganization: true,
      },
    }),
  ])

  // Check depth violations
  const depthViolations: Array<{
    recipient: Recipient
    currentDepth: number
    maxAllowed: number
  }> = []

  for (const recipient of allRecipients) {
    if (recipient.parentRecipientId) {
      const depth = await calculateHierarchyDepth(recipient.id, organizationId)
      const maxDepth = recipient.type === 'SUB_PROCESSOR' ? 5 : 10

      if (depth > maxDepth) {
        depthViolations.push({
          recipient,
          currentDepth: depth,
          maxAllowed: maxDepth,
        })
      }
    }
  }

  // Circular reference detection is complex and deferred
  // Would require graph traversal of all recipients
  const circularReferences: string[] = []

  const totalIssues =
    orphaned.length + unlinked.length + depthViolations.length + circularReferences.length

  return {
    totalIssues,
    orphanedSubProcessors: orphaned,
    unlinkedRecipients: unlinked,
    depthViolations,
    circularReferences,
  }
}

/**
 * Q15: Audit recipient access (signature only)
 * SECURITY: Would log access to recipients for compliance auditing
 *
 * PLACEHOLDER: Audit logging to be implemented separately as a cross-cutting concern.
 * This function signature is provided for API completeness but implementation is deferred.
 *
 * Future implementation would:
 * - Log recipient queries to audit table
 * - Track userId, action (read/update/delete), timestamp
 * - Enable compliance reporting on recipient data access
 *
 * @param recipientId - The recipient ID being accessed
 * @param userId - The user ID performing the action
 * @param action - The action being performed (read, update, delete)
 * @param organizationId - The organization ID for context
 * @returns void
 *
 * @example
 * auditRecipientAccess('recipient-id', 'user-id', 'read', 'org-id')
 */
export function auditRecipientAccess(
  recipientId: string,
  userId: string,
  action: string,
  organizationId: string
): void {
  // PLACEHOLDER: Implementation deferred
  // Would insert audit log record to compliance logging system
  console.log(
    `AUDIT: User ${userId} performed ${action} on recipient ${recipientId} in org ${organizationId}`
  )
}
