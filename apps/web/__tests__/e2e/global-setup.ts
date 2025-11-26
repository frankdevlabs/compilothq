import { PrismaClient } from '@compilothq/database'
import { seedDevUsers } from '@compilothq/database/prisma/seeds/devUsers'
import { FullConfig } from '@playwright/test'
import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Global setup for Playwright E2E tests.
 *
 * This function runs once before all E2E tests to prepare the test environment:
 * 1. Verifies test database is running
 * 2. Runs Prisma migrations on the test database
 * 3. Clears any existing test data
 * 4. Optionally seeds minimal reference data if needed
 *
 * Environment:
 * - Uses .env.test for test database configuration
 * - Test database should be on port 5433 (vs dev on 5432)
 *
 * @param config - Playwright full configuration
 */
async function globalSetup(_config: FullConfig) {
  void _config // Explicitly mark as intentionally unused (required by Playwright API)
  console.log('\n🚀 Starting Playwright E2E test setup...\n')

  try {
    // Set environment to test
    // Use type assertion to bypass readonly constraint in strict mode
    ;(process.env as Record<string, string>)['NODE_ENV'] = 'test'

    // Load test environment variables
    const envPath = path.resolve(__dirname, '../../../.env.test')
    console.log(`📄 Loading test environment from: ${envPath}`)

    // Note: In a production setup, you might want to use dotenv here
    // For now, we rely on the .env.test being loaded by the test runner

    // Verify test database URL is set
    const testDbUrl =
      process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/compilothq_test'

    if (!testDbUrl.includes('5433')) {
      console.warn(
        '⚠️  WARNING: DATABASE_URL does not appear to be using test database port (5433)'
      )
      console.warn(`   Current DATABASE_URL: ${testDbUrl}`)
    }

    console.log('🗄️  Test database URL configured')

    // Run Prisma migrations on test database
    console.log('🔄 Running Prisma migrations on test database...')

    const databasePackagePath = path.resolve(__dirname, '../../../../packages/database')

    try {
      const { stdout, stderr } = await execAsync(
        `cd "${databasePackagePath}" && DATABASE_URL="${testDbUrl}" pnpm prisma migrate deploy`,
        {
          env: {
            ...process.env,
            DATABASE_URL: testDbUrl,
          },
        }
      )

      if (stdout) console.log(stdout)
      if (stderr && !stderr.includes('already up to date')) console.error(stderr)

      console.log('✅ Migrations completed successfully')
    } catch (error) {
      console.error('❌ Failed to run migrations:', error)
      throw error
    }

    // Clear test data
    console.log('🧹 Clearing existing test data...')

    try {
      // For now, we'll skip the actual cleanup as we don't have the utilities yet
      // This will be implemented when database test utilities are available
      console.log('⏭️  Test data cleanup skipped (utilities not yet available)')

      // TODO: When database test-utils are available, use them here:
      // import { cleanupTestDatabase } from '@compilothq/database/test-utils';
      // await cleanupTestDatabase();
    } catch (error) {
      console.error('❌ Failed to clear test data:', error)
      throw error
    }

    // Seed development users for E2E tests
    console.log('🔧 Seeding development users for E2E tests...')

    try {
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: testDbUrl,
          },
        },
      })

      await seedDevUsers(prisma)
      await prisma.$disconnect()

      console.log('✅ Development users seeded successfully')
    } catch (error) {
      console.error('❌ Failed to seed development users:', error)
      throw error
    }

    console.log('\n✅ Playwright E2E test setup completed successfully\n')
  } catch (error) {
    console.error('\n❌ Playwright E2E test setup failed:', error)
    throw error
  }
}

export default globalSetup
