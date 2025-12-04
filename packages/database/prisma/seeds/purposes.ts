import type { PrismaClient } from '../../generated/client/client'

/**
 * Seed purposes for development and testing
 * Creates sample purposes across multiple organizations
 */
export async function seedPurposes(prisma: PrismaClient): Promise<number> {
  // Check if purposes already exist
  const existingCount = await prisma.purpose.count()
  if (existingCount > 0) {
    console.log(`Skipping purposes seed - ${existingCount} purposes already exist`)
    return existingCount
  }

  console.log('Seeding purposes...')

  // Fetch organizations for tenant context
  const orgs = await prisma.organization.findMany({
    where: { slug: { in: ['acme-corp', 'beta-inc'] } },
  })

  if (orgs.length === 0) {
    console.log('⚠ No organizations found - skipping purposes seed')
    return 0
  }

  const acmeOrg = orgs.find((o) => o.slug === 'acme-corp')
  const betaOrg = orgs.find((o) => o.slug === 'beta-inc')

  const purposes = [
    // Acme Corp purposes
    ...(acmeOrg
      ? [
          {
            id: 'purpose_acme_marketing_001',
            name: 'Marketing Communications',
            description: 'Send promotional emails and marketing materials to customers',
            category: 'MARKETING' as const,
            scope: 'EXTERNAL' as const,
            organizationId: acmeOrg.id,
          },
          {
            id: 'purpose_acme_customer_service_002',
            name: 'Customer Support',
            description: 'Provide customer support and respond to inquiries',
            category: 'CUSTOMER_SERVICE' as const,
            scope: 'INTERNAL' as const,
            organizationId: acmeOrg.id,
          },
          {
            id: 'purpose_acme_hr_003',
            name: 'Employee Management',
            description: 'Manage employee records, payroll, and performance reviews',
            category: 'HR' as const,
            scope: 'INTERNAL' as const,
            organizationId: acmeOrg.id,
          },
          {
            id: 'purpose_acme_compliance_004',
            name: 'Legal Compliance',
            description: 'Comply with legal and regulatory obligations',
            category: 'LEGAL_COMPLIANCE' as const,
            scope: 'BOTH' as const,
            organizationId: acmeOrg.id,
          },
        ]
      : []),
    // Beta Inc purposes
    ...(betaOrg
      ? [
          {
            id: 'purpose_beta_analytics_001',
            name: 'Product Analytics',
            description: 'Analyze product usage to improve user experience',
            category: 'ANALYTICS' as const,
            scope: 'INTERNAL' as const,
            organizationId: betaOrg.id,
          },
          {
            id: 'purpose_beta_delivery_002',
            name: 'Service Delivery',
            description: 'Deliver core product features and services',
            category: 'PRODUCT_DELIVERY' as const,
            scope: 'INTERNAL' as const,
            organizationId: betaOrg.id,
          },
        ]
      : []),
  ]

  const result = await prisma.purpose.createMany({
    data: purposes,
    skipDuplicates: true,
  })

  console.log(`✓ Created ${result.count} purposes`)

  return result.count
}
