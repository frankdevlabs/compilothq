/**
 * Unit tests for database test utilities
 *
 * These tests verify that:
 * - setupTestDatabase() runs migrations successfully
 * - cleanupTestDatabase() truncates tables in correct order
 * - seedReferenceData() populates reference tables
 * - getTestDatabaseClient() returns a valid Prisma client
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  cleanupTestDatabase,
  disconnectTestDatabase,
  getTestDatabaseClient,
  seedReferenceData,
  setupTestDatabase,
} from '../../../src/test-utils'

describe('Database Test Utilities', () => {
  beforeAll(() => {
    // Ensure test database is set up and migrated
    setupTestDatabase()
  })

  afterAll(async () => {
    // Clean up database connection
    await disconnectTestDatabase()
  })

  describe('setupTestDatabase', () => {
    it('should run migrations successfully on test database', async () => {
      // Act: setupTestDatabase is called in beforeAll
      // Assert: If migrations failed, beforeAll would throw

      // Verify we can connect to the database
      const client = getTestDatabaseClient()
      const result = await client.$queryRaw<
        [{ count: bigint }]
      >`SELECT COUNT(*) as count FROM "Country"`

      // Verify the query executed successfully (table exists after migration)
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should validate DATABASE_URL uses compilothq_test database', () => {
      // Arrange
      const databaseUrl = process.env['DATABASE_URL']

      // Assert
      expect(databaseUrl).toBeDefined()
      expect(databaseUrl).toContain('compilothq_test')
    })
  })

  describe('cleanupTestDatabase', () => {
    it('should truncate tables in correct order without FK constraint errors', async () => {
      // Arrange: Insert some test data
      const client = getTestDatabaseClient()
      await client.country.create({
        data: {
          name: 'Test Country',
          isoCode: 'TC',
          isoCode3: 'TST',
          gdprStatus: ['Third Country'],
          isActive: true,
        },
      })

      // Verify data was inserted
      const countBefore = await client.country.count()
      expect(countBefore).toBeGreaterThan(0)

      // Act: Clean up the database
      await cleanupTestDatabase()

      // Assert: Verify all tables are empty
      const countAfter = await client.country.count()
      expect(countAfter).toBe(0)

      // Verify other reference tables are also empty
      const dataNaturesCount = await client.dataNature.count()
      const processingActsCount = await client.processingAct.count()
      const transferMechanismsCount = await client.transferMechanism.count()
      const recipientCategoriesCount = await client.recipientCategory.count()

      expect(dataNaturesCount).toBe(0)
      expect(processingActsCount).toBe(0)
      expect(transferMechanismsCount).toBe(0)
      expect(recipientCategoriesCount).toBe(0)
    })
  })

  describe('seedReferenceData', () => {
    it('should populate reference tables with valid data', async () => {
      // Arrange: Ensure tables are empty
      const client = getTestDatabaseClient()
      await cleanupTestDatabase()

      // Act: Seed reference data
      await seedReferenceData(client)

      // Assert: Verify each table has data
      const countriesCount = await client.country.count()
      const dataNaturesCount = await client.dataNature.count()
      const processingActsCount = await client.processingAct.count()
      const transferMechanismsCount = await client.transferMechanism.count()
      const recipientCategoriesCount = await client.recipientCategory.count()

      // Should have seeded 5-10 records per table
      expect(countriesCount).toBeGreaterThanOrEqual(5)
      expect(countriesCount).toBeLessThanOrEqual(15)

      expect(dataNaturesCount).toBeGreaterThanOrEqual(5)
      expect(dataNaturesCount).toBeLessThanOrEqual(15)

      expect(processingActsCount).toBeGreaterThanOrEqual(5)
      expect(processingActsCount).toBeLessThanOrEqual(15)

      expect(transferMechanismsCount).toBeGreaterThanOrEqual(5)
      expect(transferMechanismsCount).toBeLessThanOrEqual(15)

      expect(recipientCategoriesCount).toBeGreaterThanOrEqual(5)
      expect(recipientCategoriesCount).toBeLessThanOrEqual(15)

      // Verify data integrity: Countries should have valid GDPR status
      const countries = await client.country.findMany({ take: 1 })
      expect(countries[0]).toBeDefined()
      expect(countries[0]?.gdprStatus).toBeDefined()
      expect(Array.isArray(countries[0]?.gdprStatus)).toBe(true)

      // Verify DataNatures have valid types
      const dataNatures = await client.dataNature.findMany({ take: 1 })
      expect(dataNatures[0]).toBeDefined()
      expect(['SPECIAL', 'NON_SPECIAL']).toContain(dataNatures[0]?.type)
    })
  })

  describe('getTestDatabaseClient', () => {
    it('should return a valid Prisma client instance', async () => {
      // Act
      const client = getTestDatabaseClient()

      // Assert
      expect(client).toBeDefined()
      expect(client.$connect).toBeDefined()
      expect(client.$disconnect).toBeDefined()
      expect(client.country).toBeDefined()
      expect(client.dataNature).toBeDefined()

      // Verify the client can execute queries
      const result = await client.$queryRaw<[{ value: number }]>`SELECT 1 as value`
      expect(result[0].value).toBe(1)
    })
  })
})
