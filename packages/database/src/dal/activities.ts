import type { Activity, ActivityStatus } from '../index'
import { prisma } from '../index'

/**
 * Create a new activity
 * SECURITY: Activity is automatically scoped to the provided organizationId
 */
export async function createActivity(data: {
  name: string
  description?: string
  organizationId: string
  status?: ActivityStatus
}): Promise<Activity> {
  return await prisma.activity.create({
    data: {
      name: data.name,
      description: data.description,
      organizationId: data.organizationId,
      status: data.status ?? 'DRAFT',
    },
  })
}

/**
 * Get an activity by ID
 * Returns null if activity doesn't exist
 */
export async function getActivityById(id: string): Promise<Activity | null> {
  return await prisma.activity.findUnique({
    where: { id },
  })
}

/**
 * List activities by organization
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 */
export async function listActivitiesByOrganization(
  organizationId: string,
  options?: {
    status?: ActivityStatus
    limit?: number
  }
): Promise<Activity[]> {
  return await prisma.activity.findMany({
    where: {
      organizationId,
      ...(options?.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    ...(options?.limit ? { take: options.limit } : {}),
  })
}

/**
 * Update an activity
 * SECURITY: Caller must verify activity belongs to their organization before calling
 */
export async function updateActivity(
  id: string,
  data: {
    name?: string
    description?: string
    status?: ActivityStatus
  }
): Promise<Activity> {
  return await prisma.activity.update({
    where: { id },
    data,
  })
}

/**
 * Delete an activity
 * SECURITY: Caller must verify activity belongs to their organization before calling
 */
export async function deleteActivity(id: string): Promise<Activity> {
  return await prisma.activity.delete({
    where: { id },
  })
}
