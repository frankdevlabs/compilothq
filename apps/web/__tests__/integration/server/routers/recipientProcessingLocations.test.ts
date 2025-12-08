import {
  type Country,
  type Organization,
  prisma,
  type Recipient,
  type User,
} from '@compilothq/database'
import { cleanupTestOrganizations, createTestOrganization } from '@compilothq/database/test-utils'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type Context } from '@/server/context'
import { recipientProcessingLocationsRouter } from '@/server/routers/recipientProcessingLocations'

/**
 * Integration Test: RecipientProcessingLocations tRPC Router
 *
 * Tests the complete workflow for recipient processing locations:
 * Router → DAL → Service → Database
 *
 * Coverage: CRUD operations, validation, multi-tenancy, transfer detection
 */
describe('recipientProcessingLocations tRPC Router', () => {
  let testOrg: Organization
  let testUser: User
  let testRecipient: Recipient
  let euCountry: Country

  beforeAll(async () => {
    // Find or create test countries first (they may exist from seeds)
    euCountry =
      (await prisma.country.findFirst({ where: { isoCode: 'DE' } })) ??
      (await prisma.country.create({
        data: {
          name: 'Germany',
          isoCode: 'DE',
          gdprStatus: ['EU', 'EEA'],
        },
      }))

    // Create test organization and user with headquarters country
    const { org, users } = await createTestOrganization({ userCount: 1 })
    testOrg = org
    testUser = users[0]!

    // Set organization headquarters country
    await prisma.organization.update({
      where: { id: testOrg.id },
      data: { headquartersCountryId: euCountry.id },
    })

    // Create test recipient directly via Prisma
    testRecipient = await prisma.recipient.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Recipient',
        type: 'PROCESSOR',
        isActive: true,
      },
    })
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id])
  })

  const createTestContext = (user: User): Context => {
    const session: Session = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        organizationId: user.organizationId,
        primaryPersona: user.primaryPersona,
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    }

    return {
      session,
      req: undefined as unknown as NextRequest,
    }
  }

  describe('create procedure', () => {
    it('should create location with valid input', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      const location = await caller.create({
        recipientId: testRecipient.id,
        service: 'Email delivery service',
        countryId: euCountry.id,
        locationRole: 'PROCESSING',
      })

      expect(location).toBeDefined()
      expect(location.service).toBe('Email delivery service')
      expect(location.recipientId).toBe(testRecipient.id)
      expect(location.countryId).toBe(euCountry.id)
      expect(location.locationRole).toBe('PROCESSING')
      expect(location.isActive).toBe(true)
    })

    it('should reject invalid input (Zod validation)', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      await expect(
        caller.create({
          recipientId: testRecipient.id,
          service: 'ab', // Too short (min 3 chars)
          countryId: euCountry.id,
          locationRole: 'PROCESSING',
        })
      ).rejects.toThrow()
    })

    it('should enforce organizationId requirement', async () => {
      // Create user without organizationId
      const userWithoutOrg = await prisma.user.create({
        data: {
          email: `test-no-org-${Date.now()}@example.com`,
          name: 'User Without Org',
          primaryPersona: 'DPO',
          organizationId: null,
        },
      })

      const ctx = createTestContext(userWithoutOrg)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      await expect(
        caller.create({
          recipientId: testRecipient.id,
          service: 'Test service',
          countryId: euCountry.id,
          locationRole: 'PROCESSING',
        })
      ).rejects.toThrow(/organization/i)
    })
  })

  describe('getActiveForRecipient procedure', () => {
    it('should return correct data', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Create test location directly via Prisma
      const location = await prisma.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Test service for query',
          countryId: euCountry.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      const locations = await caller.getActiveForRecipient({
        recipientId: testRecipient.id,
      })

      expect(locations).toBeDefined()
      expect(Array.isArray(locations)).toBe(true)
      expect(locations.length).toBeGreaterThan(0)

      const found = locations.find((l) => l.id === location.id)
      expect(found).toBeDefined()
      expect(found?.service).toBe('Test service for query')
      expect(found?.country).toBeDefined()
    })
  })

  describe('update procedure', () => {
    it('should support partial updates', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Create test location directly via Prisma
      const location = await prisma.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Original service',
          countryId: euCountry.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Update only service
      const updated = await caller.update({
        id: location.id,
        service: 'Updated service',
      })

      expect(updated.service).toBe('Updated service')
      expect(updated.countryId).toBe(euCountry.id) // Unchanged
      expect(updated.locationRole).toBe('HOSTING') // Unchanged
    })
  })

  describe('move procedure', () => {
    it('should be transactional (create new + deactivate old)', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Create original location directly via Prisma
      const original = await prisma.recipientProcessingLocation.create({
        data: {
          organizationId: testOrg.id,
          recipientId: testRecipient.id,
          service: 'Original location',
          countryId: euCountry.id,
          locationRole: 'HOSTING',
          isActive: true,
        },
      })

      // Move to different country (no mechanism needed for EU->EU)
      const newLocation = await caller.move({
        locationId: original.id,
        updates: {
          service: 'Moved location',
        },
      })

      expect(newLocation).toBeDefined()
      expect(newLocation.id).not.toBe(original.id) // New record created
      expect(newLocation.service).toBe('Moved location')
      expect(newLocation.isActive).toBe(true)

      // Verify old location is deactivated
      const allLocations = await caller.getAllForRecipient({
        recipientId: testRecipient.id,
      })

      const oldLocation = allLocations.find((l) => l.id === original.id)
      expect(oldLocation).toBeDefined()
      expect(oldLocation?.isActive).toBe(false)
    })
  })

  describe('detectTransfers procedure', () => {
    it('should return array of transfers', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Should now return actual data instead of error
      const result = await caller.detectTransfers()

      expect(result).toBeInstanceOf(Array)
      // Result will be empty if no cross-border transfers exist
      // Each transfer should have organizationCountry, recipientId, transferRisk, depth
      result.forEach((transfer) => {
        expect(transfer).toHaveProperty('organizationCountry')
        expect(transfer).toHaveProperty('recipientId')
        expect(transfer).toHaveProperty('transferRisk')
        expect(transfer).toHaveProperty('depth')
      })
    })
  })

  describe('analyzeActivityTransfers procedure', () => {
    it('should return analysis object', async () => {
      const ctx = createTestContext(testUser)
      const caller = recipientProcessingLocationsRouter.createCaller(ctx)

      // Create test activity with minimal fields
      const activity = await prisma.dataProcessingActivity.create({
        data: {
          organizationId: testOrg.id,
          name: 'Test Activity',
        },
      })

      // Should now return actual analysis
      const result = await caller.analyzeActivityTransfers({
        activityId: activity.id,
      })

      // Verify analysis structure
      expect(result).toHaveProperty('activityId', activity.id)
      expect(result).toHaveProperty('activityName', 'Test Activity')
      expect(result).toHaveProperty('organizationCountry')
      expect(result).toHaveProperty('transfers')
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('totalRecipients')
      expect(result.summary).toHaveProperty('recipientsWithTransfers')
      expect(result.summary).toHaveProperty('riskDistribution')
      expect(result.summary).toHaveProperty('countriesInvolved')
    })
  })
})
