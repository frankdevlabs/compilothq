import { type PrismaClient, UserPersona } from '../../generated/client'

/**
 * Seed development users for local development and testing
 * Creates a shared "Compilo Dev" organization with one user per persona
 *
 * SECURITY: These users use @dev.compilo.local email domain which should
 * never exist in production. Only runs in development/test environments.
 */
export async function seedDevUsers(prisma: PrismaClient): Promise<number> {
  // Skip in production (defense in depth)
  if (process.env['NODE_ENV'] === 'production') {
    console.log('⏭️  Skipping dev users seed - production environment detected')
    return 0
  }

  // Check if dev org already exists
  const existingDevOrg = await prisma.organization.findUnique({
    where: { slug: 'compilo-dev' },
  })

  if (existingDevOrg) {
    console.log('⏭️  Skipping dev users seed - Compilo Dev organization already exists')
    return 0
  }

  console.log('🔧 Seeding development users...')

  // Create development organization
  const devOrg = await prisma.organization.create({
    data: {
      id: 'org_dev_compilo_001',
      name: 'Compilo Dev',
      slug: 'compilo-dev',
      status: 'ACTIVE',
    },
  })

  // Create one user per persona
  const devUsers = await prisma.user.createMany({
    data: [
      {
        id: 'user_dev_dpo_001',
        name: 'Dev DPO',
        email: 'dpo@dev.compilo.local',
        emailVerified: new Date(),
        organizationId: devOrg.id,
        primaryPersona: UserPersona.DPO,
      },
      {
        id: 'user_dev_privacy_officer_002',
        name: 'Dev Privacy Officer',
        email: 'privacy-officer@dev.compilo.local',
        emailVerified: new Date(),
        organizationId: devOrg.id,
        primaryPersona: UserPersona.PRIVACY_OFFICER,
      },
      {
        id: 'user_dev_business_owner_003',
        name: 'Dev Business Owner',
        email: 'business-owner@dev.compilo.local',
        emailVerified: new Date(),
        organizationId: devOrg.id,
        primaryPersona: UserPersona.BUSINESS_OWNER,
      },
      {
        id: 'user_dev_it_admin_004',
        name: 'Dev IT Admin',
        email: 'it-admin@dev.compilo.local',
        emailVerified: new Date(),
        organizationId: devOrg.id,
        primaryPersona: UserPersona.IT_ADMIN,
      },
      {
        id: 'user_dev_security_team_005',
        name: 'Dev Security Team',
        email: 'security-team@dev.compilo.local',
        emailVerified: new Date(),
        organizationId: devOrg.id,
        primaryPersona: UserPersona.SECURITY_TEAM,
      },
      {
        id: 'user_dev_legal_team_006',
        name: 'Dev Legal Team',
        email: 'legal-team@dev.compilo.local',
        emailVerified: new Date(),
        organizationId: devOrg.id,
        primaryPersona: UserPersona.LEGAL_TEAM,
      },
    ],
    skipDuplicates: true,
  })

  console.log(`✓ Created ${devUsers.count} development users in "Compilo Dev" organization`)
  console.log(
    '  Personas: DPO, PRIVACY_OFFICER, BUSINESS_OWNER, IT_ADMIN, SECURITY_TEAM, LEGAL_TEAM'
  )

  return devUsers.count + 1 // users + org
}
