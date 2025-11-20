import type { PrismaClient } from '@prisma/client'

/**
 * Seed organizations for development and testing
 * Creates 3 organizations with different statuses to represent different scenarios
 */
export async function seedOrganizations(prisma: PrismaClient): Promise<number> {
  // Check if organizations already exist
  const existingCount = await prisma.organization.count()
  if (existingCount > 0) {
    console.log(`Skipping organizations seed - ${existingCount} organizations already exist`)
    return existingCount
  }

  console.log('Seeding organizations...')

  // Create 3 organizations with different statuses
  const organizations = [
    {
      id: 'org_acme_corp_001',
      name: 'Acme Corp',
      slug: 'acme-corp',
      status: 'ACTIVE' as const,
    },
    {
      id: 'org_beta_inc_002',
      name: 'Beta Inc',
      slug: 'beta-inc',
      status: 'TRIAL' as const,
    },
    {
      id: 'org_gamma_llc_003',
      name: 'Gamma LLC',
      slug: 'gamma-llc',
      status: 'ACTIVE' as const,
    },
  ]

  const result = await prisma.organization.createMany({
    data: organizations,
    skipDuplicates: true,
  })

  console.log(`✓ Created ${result.count} organizations`)

  return result.count
}
