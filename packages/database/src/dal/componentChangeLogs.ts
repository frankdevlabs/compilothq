/**
 * DAL functions for ComponentChangeLog queries
 *
 * Optional convenience functions for querying change history.
 * Core change tracking happens automatically via middleware.
 *
 * @module dal/componentChangeLogs
 */

import type { ComponentChangeLog } from '../index'
import { prisma } from '../index'

/**
 * Get change history for a specific component
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * Returns all change logs for a component in chronological order.
 * Useful for audit trails and change visualization.
 *
 * @param componentType - Model name (e.g., 'AssetProcessingLocation')
 * @param componentId - The component's ID
 * @param organizationId - Organization ID for multi-tenancy enforcement
 * @returns Promise with array of change logs
 *
 * @example
 * const history = await getComponentChangeHistory(
 *   'RecipientProcessingLocation',
 *   'location-123',
 *   'org-456'
 * )
 */
export async function getComponentChangeHistory(
  componentType: string,
  componentId: string,
  organizationId: string
): Promise<ComponentChangeLog[]> {
  return prisma.componentChangeLog.findMany({
    where: {
      organizationId,
      componentType,
      componentId,
    },
    orderBy: [{ changedAt: 'asc' }],
    include: {
      changedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Get recent changes for an organization
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * Returns most recent changes across all tracked components.
 * Useful for activity feeds and audit dashboards.
 *
 * @param organizationId - Organization ID for multi-tenancy enforcement
 * @param limit - Maximum number of changes to return (default: 50)
 * @returns Promise with array of recent change logs
 *
 * @example
 * const recentChanges = await getRecentChanges('org-123', 20)
 */
export async function getRecentChanges(
  organizationId: string,
  limit: number = 50
): Promise<ComponentChangeLog[]> {
  return prisma.componentChangeLog.findMany({
    where: {
      organizationId,
    },
    orderBy: [{ changedAt: 'desc' }],
    take: limit,
    include: {
      changedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Get changes made by a specific user
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * Returns all changes made by a user within an organization.
 * Useful for user activity tracking and compliance audits.
 *
 * @param userId - User ID to filter changes by
 * @param organizationId - Organization ID for multi-tenancy enforcement
 * @param options - Optional filters (limit, componentType)
 * @returns Promise with array of change logs
 *
 * @example
 * const userChanges = await getChangesForUser('user-123', 'org-456', {
 *   componentType: 'DataProcessingActivity',
 *   limit: 100
 * })
 */
export async function getChangesForUser(
  userId: string,
  organizationId: string,
  options?: {
    componentType?: string
    limit?: number
  }
): Promise<ComponentChangeLog[]> {
  return prisma.componentChangeLog.findMany({
    where: {
      organizationId,
      changedByUserId: userId,
      ...(options?.componentType ? { componentType: options.componentType } : {}),
    },
    orderBy: [{ changedAt: 'desc' }],
    take: options?.limit ?? 100,
  })
}

/**
 * Get changes for a specific component type across organization
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * Returns all changes for a model type (e.g., all RecipientProcessingLocation changes).
 * Useful for model-specific audit reports.
 *
 * @param componentType - Model name (e.g., 'TransferMechanism')
 * @param organizationId - Organization ID for multi-tenancy enforcement
 * @param options - Optional filters (limit, changeType)
 * @returns Promise with array of change logs
 *
 * @example
 * const mechanismChanges = await getChangesByComponentType(
 *   'TransferMechanism',
 *   'org-123',
 *   { changeType: 'UPDATED', limit: 50 }
 * )
 */
export async function getChangesByComponentType(
  componentType: string,
  organizationId: string,
  options?: {
    changeType?: 'CREATED' | 'UPDATED' | 'DELETED'
    limit?: number
  }
): Promise<ComponentChangeLog[]> {
  return prisma.componentChangeLog.findMany({
    where: {
      organizationId,
      componentType,
      ...(options?.changeType ? { changeType: options.changeType } : {}),
    },
    orderBy: [{ changedAt: 'desc' }],
    take: options?.limit ?? 100,
    include: {
      changedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Get count of changes by component type for an organization
 * SECURITY: Enforces multi-tenancy by requiring organizationId
 *
 * Returns summary statistics of changes by component type.
 * Useful for dashboards and analytics.
 *
 * @param organizationId - Organization ID for multi-tenancy enforcement
 * @returns Promise with count by component type
 *
 * @example
 * const stats = await getChangeStatsByType('org-123')
 * // Returns: { AssetProcessingLocation: 45, DataProcessingActivity: 23, ... }
 */
export async function getChangeStatsByType(
  organizationId: string
): Promise<Record<string, number>> {
  const changes = await prisma.componentChangeLog.groupBy({
    by: ['componentType'],
    where: {
      organizationId,
    },
    _count: {
      componentType: true,
    },
  })

  return changes.reduce(
    (acc, item) => {
      acc[item.componentType] = item._count.componentType
      return acc
    },
    {} as Record<string, number>
  )
}
