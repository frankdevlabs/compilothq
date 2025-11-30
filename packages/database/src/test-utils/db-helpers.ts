import { PrismaPg } from '@prisma/adapter-pg'
import { execSync } from 'child_process'
import path from 'path'

import { PrismaClient } from '../index'

/**
 * Test database client instance
 * This should use the test DATABASE_URL (port 5433)
 */
let testPrismaClient: InstanceType<typeof PrismaClient> | null = null

/**
 * Get the test database client instance
 * Uses DATABASE_URL from environment (should be test database on port 5433)
 */
export function getTestDatabaseClient(): InstanceType<typeof PrismaClient> {
  if (!testPrismaClient) {
    const adapter = new PrismaPg({
      connectionString: process.env['DATABASE_URL'],
    })
    testPrismaClient = new PrismaClient({ adapter })
  }
  return testPrismaClient
}

/**
 * Safely disconnect from the test database
 * Call this in global afterAll hooks to clean up connections
 */
export async function disconnectTestDatabase(): Promise<void> {
  if (testPrismaClient) {
    await testPrismaClient.$disconnect()
    testPrismaClient = null
  }
}

/**
 * Set up the test database by running Prisma migrations
 * This should be called once in beforeAll hooks, not before each test
 *
 * @throws Error if DATABASE_URL is not set or migrations fail
 */
export function setupTestDatabase(): void {
  const databaseUrl = process.env['DATABASE_URL']

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
        'Ensure .env.test is loaded before running tests.'
    )
  }

  // Verify we're using the test database (compilothq_test)
  if (!databaseUrl.includes('compilothq_test')) {
    throw new Error(
      `DATABASE_URL must use compilothq_test database. ` +
        `Current URL: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`
    )
  }

  try {
    // Run migrations using Prisma CLI from the database package directory
    // Prisma 7.x requires datasource config in prisma.config.ts, not schema.prisma
    // By running from the package directory without --schema flag, Prisma will use prisma.config.ts
    const databasePackagePath = path.resolve(__dirname, '../..')
    const prismaBinPath = path.resolve(databasePackagePath, 'node_modules/.bin/prisma')

    execSync(`"${prismaBinPath}" migrate deploy`, {
      cwd: databasePackagePath,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe', // Suppress output unless there's an error
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to run migrations on test database: ${errorMessage}`)
  }
}

/**
 * Clean up the test database by truncating all tables
 * Respects foreign key constraints by using TRUNCATE CASCADE
 *
 * This should be called in beforeEach hooks to ensure test isolation
 */
export async function cleanupTestDatabase(): Promise<void> {
  const client = getTestDatabaseClient()

  try {
    // Get all table names dynamically from the database schema
    // This prevents issues with missing tables and adapts to schema changes
    const tables = await client.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname='public'
      AND tablename NOT LIKE '_prisma%'
    `

    // Truncate all tables with CASCADE to automatically handle FK constraints
    // RESTART IDENTITY resets auto-increment sequences to 1
    for (const { tablename } of tables) {
      await client.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to clean up test database: ${errorMessage}`)
  }
}
