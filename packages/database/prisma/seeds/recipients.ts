import type { PrismaClient } from '../../generated/client/client'

/**
 * Seed recipients for development and testing
 * Creates sample recipients across multiple organizations
 * NOTE: activityIds field has been removed - use junction tables instead
 */
export async function seedRecipients(prisma: PrismaClient): Promise<number> {
  // Check if recipients already exist
  const existingCount = await prisma.recipient.count()
  if (existingCount > 0) {
    console.log(`Skipping recipients seed - ${existingCount} recipients already exist`)
    return existingCount
  }

  console.log('Seeding recipients...')

  // Fetch organizations for tenant context
  const orgs = await prisma.organization.findMany({
    where: { slug: { in: ['acme-corp', 'beta-inc'] } },
  })

  if (orgs.length === 0) {
    console.log('⚠ No organizations found - skipping recipients seed')
    return 0
  }

  const acmeOrg = orgs.find((o) => o.slug === 'acme-corp')
  const betaOrg = orgs.find((o) => o.slug === 'beta-inc')

  const recipients = [
    // Acme Corp recipients
    ...(acmeOrg
      ? [
          {
            id: 'recipient_acme_processor_001',
            name: 'Cloud Storage Provider',
            type: 'PROCESSOR' as const,
            organizationId: acmeOrg.id,
            purpose: 'Store and backup customer data',
            description: 'Third-party cloud storage service for data backup and archival',
            isActive: true,
          },
          {
            id: 'recipient_acme_processor_002',
            name: 'Email Service Provider',
            type: 'PROCESSOR' as const,
            organizationId: acmeOrg.id,
            purpose: 'Send transactional and marketing emails',
            description: 'Email delivery service for customer communications',
            isActive: true,
          },
          {
            id: 'recipient_acme_internal_001',
            name: 'HR Department',
            type: 'INTERNAL_DEPARTMENT' as const,
            organizationId: acmeOrg.id,
            purpose: 'Manage employee data',
            description: 'Internal HR team managing employee records',
            isActive: true,
          },
          {
            id: 'recipient_acme_authority_001',
            name: 'Tax Authority',
            type: 'PUBLIC_AUTHORITY' as const,
            organizationId: acmeOrg.id,
            purpose: 'Tax compliance and reporting',
            description: 'Government tax authority for compliance reporting',
            isActive: true,
          },
        ]
      : []),
    // Beta Inc recipients
    ...(betaOrg
      ? [
          {
            id: 'recipient_beta_processor_001',
            name: 'Analytics Platform',
            type: 'PROCESSOR' as const,
            organizationId: betaOrg.id,
            purpose: 'Analyze user behavior and product usage',
            description: 'Third-party analytics service for product insights',
            isActive: true,
          },
          {
            id: 'recipient_beta_processor_002',
            name: 'Payment Processor',
            type: 'PROCESSOR' as const,
            organizationId: betaOrg.id,
            purpose: 'Process customer payments',
            description: 'Payment gateway for subscription billing',
            isActive: true,
          },
        ]
      : []),
  ]

  const result = await prisma.recipient.createMany({
    data: recipients,
    skipDuplicates: true,
  })

  console.log(`✓ Created ${result.count} recipients`)

  return result.count
}
