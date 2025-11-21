import { type PrismaClient, UserPersona } from '../../generated/client'

/**
 * Seed users for development and testing
 * Creates 17 users across 3 organizations with different personas
 */
export async function seedUsers(prisma: PrismaClient): Promise<number> {
  // Check if users already exist
  const existingCount = await prisma.user.count()
  if (existingCount > 0) {
    console.log(`Skipping users seed - ${existingCount} users already exist`)
    return existingCount
  }

  console.log('Seeding users...')

  // Fetch organization IDs by slug to establish foreign key relationships
  const acmeCorp = await prisma.organization.findUnique({ where: { slug: 'acme-corp' } })
  const betaInc = await prisma.organization.findUnique({ where: { slug: 'beta-inc' } })
  const gammaLLC = await prisma.organization.findUnique({ where: { slug: 'gamma-llc' } })

  if (!acmeCorp || !betaInc || !gammaLLC) {
    throw new Error('Organizations must be seeded before users')
  }

  // Create 17 users distributed across 3 organizations
  const users = [
    // Acme Corp (2 users)
    {
      id: 'user_john_doe_001',
      name: 'John Doe',
      email: 'john.doe@acme.example.com',
      emailVerified: null,
      image: null,
      organizationId: acmeCorp.id,
      primaryPersona: 'DPO' as UserPersona,
    },
    {
      id: 'user_jane_smith_002',
      name: 'Jane Smith',
      email: 'jane.smith@acme.example.com',
      emailVerified: null,
      image: null,
      organizationId: acmeCorp.id,
      primaryPersona: 'BUSINESS_OWNER' as UserPersona,
    },

    // Beta Inc (5 users)
    {
      id: 'user_alice_johnson_003',
      name: 'Alice Johnson',
      email: 'alice.johnson@beta.example.com',
      emailVerified: null,
      image: null,
      organizationId: betaInc.id,
      primaryPersona: 'DPO' as UserPersona,
    },
    {
      id: 'user_bob_wilson_004',
      name: 'Bob Wilson',
      email: 'bob.wilson@beta.example.com',
      emailVerified: null,
      image: null,
      organizationId: betaInc.id,
      primaryPersona: 'PRIVACY_OFFICER' as UserPersona,
    },
    {
      id: 'user_carol_martinez_005',
      name: 'Carol Martinez',
      email: 'carol.martinez@beta.example.com',
      emailVerified: null,
      image: null,
      organizationId: betaInc.id,
      primaryPersona: 'BUSINESS_OWNER' as UserPersona,
    },
    {
      id: 'user_david_lee_006',
      name: 'David Lee',
      email: 'david.lee@beta.example.com',
      emailVerified: null,
      image: null,
      organizationId: betaInc.id,
      primaryPersona: 'BUSINESS_OWNER' as UserPersona,
    },
    {
      id: 'user_eva_garcia_007',
      name: 'Eva Garcia',
      email: 'eva.garcia@beta.example.com',
      emailVerified: null,
      image: null,
      organizationId: betaInc.id,
      primaryPersona: 'LEGAL_TEAM' as UserPersona,
    },

    // Gamma LLC (10 users)
    {
      id: 'user_frank_brown_008',
      name: 'Frank Brown',
      email: 'frank.brown@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'DPO' as UserPersona,
    },
    {
      id: 'user_grace_taylor_009',
      name: 'Grace Taylor',
      email: 'grace.taylor@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'PRIVACY_OFFICER' as UserPersona,
    },
    {
      id: 'user_henry_anderson_010',
      name: 'Henry Anderson',
      email: 'henry.anderson@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'PRIVACY_OFFICER' as UserPersona,
    },
    {
      id: 'user_iris_thomas_011',
      name: 'Iris Thomas',
      email: 'iris.thomas@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'BUSINESS_OWNER' as UserPersona,
    },
    {
      id: 'user_jack_robinson_012',
      name: 'Jack Robinson',
      email: 'jack.robinson@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'BUSINESS_OWNER' as UserPersona,
    },
    {
      id: 'user_kate_white_013',
      name: 'Kate White',
      email: 'kate.white@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'BUSINESS_OWNER' as UserPersona,
    },
    {
      id: 'user_liam_harris_014',
      name: 'Liam Harris',
      email: 'liam.harris@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'BUSINESS_OWNER' as UserPersona,
    },
    {
      id: 'user_mia_clark_015',
      name: 'Mia Clark',
      email: 'mia.clark@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'BUSINESS_OWNER' as UserPersona,
    },
    {
      id: 'user_noah_lewis_016',
      name: 'Noah Lewis',
      email: 'noah.lewis@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'IT_ADMIN' as UserPersona,
    },
    {
      id: 'user_olivia_walker_017',
      name: 'Olivia Walker',
      email: 'olivia.walker@gamma.example.com',
      emailVerified: null,
      image: null,
      organizationId: gammaLLC.id,
      primaryPersona: 'LEGAL_TEAM' as UserPersona,
    },
  ]

  const result = await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  })

  console.log(`✓ Created ${result.count} users`)

  return result.count
}
