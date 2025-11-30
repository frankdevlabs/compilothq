import type {
  DataProcessingActivity,
  DataProcessingActivityStatus,
  DPIAStatus,
  Prisma,
  RiskLevel,
  TimeUnit,
} from '../index'
import { prisma } from '../index'

/**
 * Create a new data processing activity
 * SECURITY: Activity is automatically scoped to the provided organizationId
 */
export async function createDataProcessingActivity(data: {
  name: string
  description?: string
  organizationId: string
  status?: DataProcessingActivityStatus
  riskLevel?: RiskLevel
  requiresDPIA?: boolean
  dpiaStatus?: DPIAStatus
  businessOwnerId?: string
  processingOwnerId?: string
  retentionPeriodValue?: number
  retentionPeriodUnit?: TimeUnit
  retentionJustification?: string
  lastReviewedAt?: Date
  nextReviewDate?: Date
  reviewFrequencyMonths?: number
  metadata?: Prisma.InputJsonValue
}): Promise<DataProcessingActivity> {
  return await prisma.dataProcessingActivity.create({
    data: {
      name: data.name,
      description: data.description,
      organizationId: data.organizationId,
      status: data.status ?? 'DRAFT',
      riskLevel: data.riskLevel,
      requiresDPIA: data.requiresDPIA,
      dpiaStatus: data.dpiaStatus,
      businessOwnerId: data.businessOwnerId,
      processingOwnerId: data.processingOwnerId,
      retentionPeriodValue: data.retentionPeriodValue,
      retentionPeriodUnit: data.retentionPeriodUnit,
      retentionJustification: data.retentionJustification,
      lastReviewedAt: data.lastReviewedAt,
      nextReviewDate: data.nextReviewDate,
      reviewFrequencyMonths: data.reviewFrequencyMonths,
      metadata: data.metadata,
    },
  })
}

/**
 * Get a data processing activity by ID
 * Returns null if activity doesn't exist
 */
export async function getDataProcessingActivityById(
  id: string
): Promise<DataProcessingActivity | null> {
  return await prisma.dataProcessingActivity.findUnique({
    where: { id },
  })
}

/**
 * Get a data processing activity by ID with ownership verification
 * SECURITY: Enforces multi-tenancy by requiring both id and organizationId match
 * Returns null if activity doesn't exist or doesn't belong to the organization
 */
export async function getDataProcessingActivityByIdForOrg(
  id: string,
  organizationId: string
): Promise<DataProcessingActivity | null> {
  return await prisma.dataProcessingActivity.findUnique({
    where: {
      id,
      organizationId,
    },
  })
}

/**
 * List data processing activities by organization with cursor-based pagination
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 */
export async function listDataProcessingActivitiesByOrganization(
  organizationId: string,
  options?: {
    status?: DataProcessingActivityStatus
    riskLevel?: RiskLevel
    requiresDPIA?: boolean
    dpiaStatus?: DPIAStatus
    businessOwnerId?: string
    processingOwnerId?: string
    dueBefore?: Date // nextReviewDate <= dueBefore
    limit?: number
    cursor?: string
  }
): Promise<{
  items: DataProcessingActivity[]
  nextCursor: string | null
}> {
  const limit = options?.limit ?? 50

  const activities = await prisma.dataProcessingActivity.findMany({
    where: {
      organizationId,
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.riskLevel ? { riskLevel: options.riskLevel } : {}),
      ...(options?.requiresDPIA !== undefined ? { requiresDPIA: options.requiresDPIA } : {}),
      ...(options?.dpiaStatus ? { dpiaStatus: options.dpiaStatus } : {}),
      ...(options?.businessOwnerId ? { businessOwnerId: options.businessOwnerId } : {}),
      ...(options?.processingOwnerId ? { processingOwnerId: options.processingOwnerId } : {}),
      ...(options?.dueBefore
        ? {
            nextReviewDate: {
              lte: options.dueBefore,
            },
          }
        : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // Fetch one extra to determine if there are more
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  })

  // Check if there are more items
  const hasMore = activities.length > limit
  const items = hasMore ? activities.slice(0, limit) : activities
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

  return {
    items,
    nextCursor,
  }
}

/**
 * Update a data processing activity
 * SECURITY: Caller must verify activity belongs to their organization before calling
 * Supports explicit null values to clear optional fields
 */
export async function updateDataProcessingActivity(
  id: string,
  data: {
    name?: string
    description?: string
    status?: DataProcessingActivityStatus
    riskLevel?: RiskLevel | null // Allow explicit null to clear
    requiresDPIA?: boolean | null
    dpiaStatus?: DPIAStatus | null
    businessOwnerId?: string | null
    processingOwnerId?: string | null
    retentionPeriodValue?: number | null
    retentionPeriodUnit?: TimeUnit | null
    retentionJustification?: string | null
    lastReviewedAt?: Date | null
    nextReviewDate?: Date | null
    reviewFrequencyMonths?: number | null
    metadata?: Prisma.InputJsonValue
  }
): Promise<DataProcessingActivity> {
  return await prisma.dataProcessingActivity.update({
    where: { id },
    data,
  })
}

/**
 * Delete a data processing activity
 * SECURITY: Caller must verify activity belongs to their organization before calling
 */
export async function deleteDataProcessingActivity(id: string): Promise<DataProcessingActivity> {
  return await prisma.dataProcessingActivity.delete({
    where: { id },
  })
}

/**
 * Count data processing activities by organization with optional filters
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 * Used for dashboard widgets and statistics
 */
export async function countDataProcessingActivitiesByOrganization(
  organizationId: string,
  options?: {
    status?: DataProcessingActivityStatus
    requiresDPIA?: boolean
  }
): Promise<number> {
  return await prisma.dataProcessingActivity.count({
    where: {
      organizationId,
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.requiresDPIA !== undefined ? { requiresDPIA: options.requiresDPIA } : {}),
    },
  })
}
