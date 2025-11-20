import { describe, expect, it } from 'vitest'

import { prisma } from '../../src/index'

/**
 * Seed Data Verification Tests
 * These tests verify that seed data was created correctly
 * Run seed script before running these tests: pnpm seed
 */
describe('Seed Data Verification', () => {
  describe('Organizations', () => {
    it('should have 3 organizations seeded', async () => {
      // Act
      const organizations = await prisma.organization.findMany({
        where: {
          slug: {
            in: ['acme-corp', 'beta-inc', 'gamma-llc'],
          },
        },
      })

      // Assert
      expect(organizations).toHaveLength(3)
    })

    it('should have correct organization slugs', async () => {
      // Act
      const acme = await prisma.organization.findUnique({ where: { slug: 'acme-corp' } })
      const beta = await prisma.organization.findUnique({ where: { slug: 'beta-inc' } })
      const gamma = await prisma.organization.findUnique({ where: { slug: 'gamma-llc' } })

      // Assert
      expect(acme).toBeDefined()
      expect(acme!.name).toBe('Acme Corp')
      expect(acme!.status).toBe('ACTIVE')

      expect(beta).toBeDefined()
      expect(beta!.name).toBe('Beta Inc')
      expect(beta!.status).toBe('TRIAL')

      expect(gamma).toBeDefined()
      expect(gamma!.name).toBe('Gamma LLC')
      expect(gamma!.status).toBe('ACTIVE')
    })
  })

  describe('Users', () => {
    it('should have 17 users seeded', async () => {
      // Act
      const users = await prisma.user.findMany({
        where: {
          email: {
            endsWith: '.example.com',
          },
        },
      })

      // Assert
      expect(users.length).toBeGreaterThanOrEqual(17)
    })

    it('should have Acme Corp with 2 users', async () => {
      // Arrange
      const acme = await prisma.organization.findUnique({ where: { slug: 'acme-corp' } })
      expect(acme).toBeDefined()

      // Act
      const users = await prisma.user.count({
        where: { organizationId: acme!.id },
      })

      // Assert
      expect(users).toBe(2)
    })

    it('should have Beta Inc with 5 users', async () => {
      // Arrange
      const beta = await prisma.organization.findUnique({ where: { slug: 'beta-inc' } })
      expect(beta).toBeDefined()

      // Act
      const users = await prisma.user.count({
        where: { organizationId: beta!.id },
      })

      // Assert
      expect(users).toBe(5)
    })

    it('should have Gamma LLC with 10 users', async () => {
      // Arrange
      const gamma = await prisma.organization.findUnique({ where: { slug: 'gamma-llc' } })
      expect(gamma).toBeDefined()

      // Act
      const users = await prisma.user.count({
        where: { organizationId: gamma!.id },
      })

      // Assert
      expect(users).toBe(10)
    })

    it('should have correct persona distribution', async () => {
      // Arrange
      const gamma = await prisma.organization.findUnique({ where: { slug: 'gamma-llc' } })
      expect(gamma).toBeDefined()

      // Act
      const dpoUsers = await prisma.user.count({
        where: { organizationId: gamma!.id, primaryPersona: 'DPO' },
      })
      const privacyOfficers = await prisma.user.count({
        where: { organizationId: gamma!.id, primaryPersona: 'PRIVACY_OFFICER' },
      })
      const businessOwners = await prisma.user.count({
        where: { organizationId: gamma!.id, primaryPersona: 'BUSINESS_OWNER' },
      })

      // Assert - Gamma LLC should have 1 DPO, 2 PRIVACY_OFFICER, 5 BUSINESS_OWNER
      expect(dpoUsers).toBe(1)
      expect(privacyOfficers).toBe(2)
      expect(businessOwners).toBe(5)
    })
  })
})
