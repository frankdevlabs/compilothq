import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import path from 'path'

/**
 * Test database client instance
 * This should use the test DATABASE_URL (port 5433)
 */
let testPrismaClient: PrismaClient | null = null

/**
 * Get the test database client instance
 * Uses DATABASE_URL from environment (should be test database on port 5433)
 */
export function getTestDatabaseClient(): PrismaClient {
  if (!testPrismaClient) {
    testPrismaClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
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
export async function setupTestDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
        'Ensure .env.test is loaded before running tests.'
    )
  }

  // Verify we're using the test database (port 5433), not dev (port 5432)
  if (!databaseUrl.includes(':5433/')) {
    throw new Error(
      `DATABASE_URL must use port 5433 for test database. ` +
        `Current URL: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`
    )
  }

  try {
    // Run migrations using Prisma CLI
    // Use --skip-seed to avoid seeding during migration
    const prismaSchemaPath = path.resolve(__dirname, '../../prisma/schema.prisma')

    execSync('pnpm prisma migrate deploy --schema=' + prismaSchemaPath, {
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
    // Get all table names from the schema
    // We'll truncate in the correct order to respect FK constraints
    const tables = [
      // Reference data tables (no FK dependencies)
      'Country',
      'DataNature',
      'ProcessingAct',
      'TransferMechanism',
      'RecipientCategory',
      // User table
      'User',
      // Add more tables here as schema grows
    ]

    // Use raw SQL to truncate all tables efficiently
    // RESTART IDENTITY resets auto-increment sequences
    // CASCADE deletes dependent rows in other tables
    await client.$executeRawUnsafe(
      `TRUNCATE TABLE "${tables.join('", "')}" RESTART IDENTITY CASCADE`
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to clean up test database: ${errorMessage}`)
  }
}
