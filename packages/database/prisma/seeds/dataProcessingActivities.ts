import type { PrismaClient } from '../../generated/client/client'

/**
 * Seed data processing activities for development and testing
 * Creates sample activities with junction table relationships to demonstrate many-to-many patterns
 */
export async function seedDataProcessingActivities(prisma: PrismaClient): Promise<number> {
  // Check if activities already exist
  const existingCount = await prisma.dataProcessingActivity.count()
  if (existingCount > 0) {
    console.log(
      `Skipping data processing activities seed - ${existingCount} activities already exist`
    )
    return existingCount
  }

  console.log('Seeding data processing activities...')

  // Fetch organizations for tenant context
  const orgs = await prisma.organization.findMany({
    where: { slug: { in: ['acme-corp', 'beta-inc'] } },
  })

  if (orgs.length === 0) {
    console.log('⚠ No organizations found - skipping data processing activities seed')
    return 0
  }

  const acmeOrg = orgs.find((o) => o.slug === 'acme-corp')
  const betaOrg = orgs.find((o) => o.slug === 'beta-inc')

  // Fetch users for owner assignments
  const acmeUsers = acmeOrg
    ? await prisma.user.findMany({
        where: { organizationId: acmeOrg.id },
        take: 2,
      })
    : []

  const betaUsers = betaOrg
    ? await prisma.user.findMany({
        where: { organizationId: betaOrg.id },
        take: 1,
      })
    : []

  const activities = [
    // Acme Corp activities
    ...(acmeOrg
      ? [
          {
            id: 'activity_acme_marketing_001',
            name: 'Customer Email Marketing',
            description:
              'Send promotional emails and newsletters to customers based on their preferences',
            organizationId: acmeOrg.id,
            status: 'ACTIVE' as const,
            riskLevel: 'LOW' as const,
            requiresDPIA: false,
            businessOwnerId: acmeUsers[0]?.id ?? null,
            processingOwnerId: acmeUsers[1]?.id ?? null,
            retentionPeriodValue: 2,
            retentionPeriodUnit: 'YEARS' as const,
            retentionJustification: 'Marketing consent retention period',
          },
          {
            id: 'activity_acme_hr_002',
            name: 'Employee Performance Management',
            description:
              'Track and manage employee performance reviews, goals, and development plans',
            organizationId: acmeOrg.id,
            status: 'ACTIVE' as const,
            riskLevel: 'MEDIUM' as const,
            requiresDPIA: false,
            businessOwnerId: acmeUsers[0]?.id ?? null,
            retentionPeriodValue: 7,
            retentionPeriodUnit: 'YEARS' as const,
            retentionJustification: 'Legal requirement for employment records',
          },
          {
            id: 'activity_acme_health_003',
            name: 'Employee Health Records',
            description: 'Manage employee health and medical records for insurance and compliance',
            organizationId: acmeOrg.id,
            status: 'UNDER_REVIEW' as const,
            riskLevel: 'HIGH' as const,
            requiresDPIA: true,
            dpiaStatus: 'IN_PROGRESS' as const,
            businessOwnerId: acmeUsers[0]?.id ?? null,
            retentionPeriodValue: 10,
            retentionPeriodUnit: 'YEARS' as const,
            retentionJustification: 'Medical records retention requirement',
          },
        ]
      : []),
    // Beta Inc activities
    ...(betaOrg
      ? [
          {
            id: 'activity_beta_analytics_001',
            name: 'Product Usage Analytics',
            description: 'Collect and analyze user behavior data to improve product features',
            organizationId: betaOrg.id,
            status: 'ACTIVE' as const,
            riskLevel: 'LOW' as const,
            requiresDPIA: false,
            businessOwnerId: betaUsers[0]?.id ?? null,
            retentionPeriodValue: 18,
            retentionPeriodUnit: 'MONTHS' as const,
            retentionJustification: 'Analytics data relevance period',
          },
          {
            id: 'activity_beta_payments_002',
            name: 'Payment Processing',
            description: 'Process customer subscription payments and maintain billing records',
            organizationId: betaOrg.id,
            status: 'ACTIVE' as const,
            riskLevel: 'MEDIUM' as const,
            requiresDPIA: false,
            businessOwnerId: betaUsers[0]?.id ?? null,
            retentionPeriodValue: 7,
            retentionPeriodUnit: 'YEARS' as const,
            retentionJustification: 'Financial records retention requirement',
          },
        ]
      : []),
  ]

  const result = await prisma.dataProcessingActivity.createMany({
    data: activities,
    skipDuplicates: true,
  })

  console.log(`✓ Created ${result.count} data processing activities`)

  return result.count
}
