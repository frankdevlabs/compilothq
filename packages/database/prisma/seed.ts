import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../generated/client/client'
import { seedCountries } from './seeds/countries'
import { seedDataNatures } from './seeds/dataNatures'
import { seedDevUsers } from './seeds/devUsers'
import { seedOrganizations } from './seeds/organizations'
import { seedProcessingActs } from './seeds/processingActs'
import { seedRecipientCategories } from './seeds/recipientCategories'
import { seedTransferMechanisms } from './seeds/transferMechanisms'
import { seedUsers } from './seeds/users'

// Seed scripts need their own client instance with driver adapter
const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'],
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting database seeding...\n')

  try {
    // Seed reference data first
    const countriesCount = await seedCountries(prisma)
    const dataNaturesCount = await seedDataNatures(prisma)
    const processingActsCount = await seedProcessingActs(prisma)
    const transferMechanismsCount = await seedTransferMechanisms(prisma)
    const recipientCategoriesCount = await seedRecipientCategories(prisma)

    // Seed organizations and users (organizations must be seeded before users)
    const organizationsCount = await seedOrganizations(prisma)
    const usersCount = await seedUsers(prisma)

    // Seed development users (skipped in production)
    const devUsersCount = await seedDevUsers(prisma)

    const totalRecords =
      countriesCount +
      dataNaturesCount +
      processingActsCount +
      transferMechanismsCount +
      recipientCategoriesCount +
      organizationsCount +
      usersCount +
      devUsersCount

    console.log('\n=== Seeding Summary ===')
    console.log(`Countries: ${countriesCount}`)
    console.log(`Data Natures: ${dataNaturesCount}`)
    console.log(`Processing Acts: ${processingActsCount}`)
    console.log(`Transfer Mechanisms: ${transferMechanismsCount}`)
    console.log(`Recipient Categories: ${recipientCategoriesCount}`)
    console.log(`Organizations: ${organizationsCount}`)
    console.log(`Users: ${usersCount}`)
    console.log(`Development Users: ${devUsersCount}`)
    console.log(`Total Records: ${totalRecords}`)
    console.log('======================\n')

    console.log('Database seeding completed successfully!')
  } catch (error) {
    console.error('Error during database seeding:', error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
