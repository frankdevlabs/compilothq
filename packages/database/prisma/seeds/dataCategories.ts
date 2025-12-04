import type { PrismaClient } from '../../generated/client/client'

/**
 * Seed data categories for development and testing
 * Creates sample data categories across multiple organizations
 */
export async function seedDataCategories(prisma: PrismaClient): Promise<number> {
  // Check if data categories already exist
  const existingCount = await prisma.dataCategory.count()
  if (existingCount > 0) {
    console.log(`Skipping data categories seed - ${existingCount} data categories already exist`)
    return existingCount
  }

  console.log('Seeding data categories...')

  // Fetch organizations for tenant context
  const orgs = await prisma.organization.findMany({
    where: { slug: { in: ['acme-corp', 'beta-inc'] } },
  })

  if (orgs.length === 0) {
    console.log('⚠ No organizations found - skipping data categories seed')
    return 0
  }

  const acmeOrg = orgs.find((o) => o.slug === 'acme-corp')
  const betaOrg = orgs.find((o) => o.slug === 'beta-inc')

  const dataCategories = [
    // Acme Corp data categories
    ...(acmeOrg
      ? [
          {
            id: 'dc_acme_contact_001',
            name: 'Contact Information',
            description: 'Basic contact details for customers and employees',
            organizationId: acmeOrg.id,
            sensitivity: 'INTERNAL' as const,
            isSpecialCategory: false,
            exampleFields: ['email', 'phone', 'address'],
          },
          {
            id: 'dc_acme_identity_002',
            name: 'Identity Data',
            description: 'Personal identification information',
            organizationId: acmeOrg.id,
            sensitivity: 'CONFIDENTIAL' as const,
            isSpecialCategory: false,
            exampleFields: ['name', 'date_of_birth', 'passport_number'],
          },
          {
            id: 'dc_acme_health_003',
            name: 'Health Data',
            description: 'Health and medical information',
            organizationId: acmeOrg.id,
            sensitivity: 'RESTRICTED' as const,
            isSpecialCategory: true,
            exampleFields: ['medical_records', 'prescriptions', 'diagnoses'],
          },
          {
            id: 'dc_acme_financial_004',
            name: 'Financial Data',
            description: 'Payment and financial information',
            organizationId: acmeOrg.id,
            sensitivity: 'RESTRICTED' as const,
            isSpecialCategory: false,
            exampleFields: ['credit_card', 'bank_account', 'salary'],
          },
        ]
      : []),
    // Beta Inc data categories
    ...(betaOrg
      ? [
          {
            id: 'dc_beta_contact_001',
            name: 'Customer Contact Data',
            description: 'Customer contact information',
            organizationId: betaOrg.id,
            sensitivity: 'INTERNAL' as const,
            isSpecialCategory: false,
            exampleFields: ['email', 'phone'],
          },
          {
            id: 'dc_beta_usage_002',
            name: 'Usage Data',
            description: 'Product usage and analytics data',
            organizationId: betaOrg.id,
            sensitivity: 'INTERNAL' as const,
            isSpecialCategory: false,
            exampleFields: ['login_times', 'feature_usage', 'session_duration'],
          },
        ]
      : []),
  ]

  const result = await prisma.dataCategory.createMany({
    data: dataCategories,
    skipDuplicates: true,
  })

  console.log(`✓ Created ${result.count} data categories`)

  return result.count
}
