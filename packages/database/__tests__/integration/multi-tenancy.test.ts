import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '../../src/index'

describe('Multi-Tenancy Integration Tests', () => {
  let org1Id: string
  let org2Id: string
  let user1Id: string
  let user2Id: string

  beforeAll(async () => {
    // Create test organizations
    const org1 = await prisma.organization.create({
      data: {
        name: 'Test Org 1',
        slug: 'test-org-1-integration',
        status: 'ACTIVE',
      },
    })
    org1Id = org1.id

    const org2 = await prisma.organization.create({
      data: {
        name: 'Test Org 2',
        slug: 'test-org-2-integration',
        status: 'ACTIVE',
      },
    })
    org2Id = org2.id

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        name: 'User 1 Org 1',
        email: 'user1-org1-integration@test.com',
        organizationId: org1Id,
        primaryPersona: 'DPO',
      },
    })
    user1Id = user1.id

    const user2 = await prisma.user.create({
      data: {
        name: 'User 1 Org 2',
        email: 'user1-org2-integration@test.com',
        organizationId: org2Id,
        primaryPersona: 'BUSINESS_OWNER',
      },
    })
    user2Id = user2.id
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['user1-org1-integration@test.com', 'user1-org2-integration@test.com'],
        },
      },
    })

    await prisma.organization.deleteMany({
      where: {
        slug: {
          in: ['test-org-1-integration', 'test-org-2-integration'],
        },
      },
    })
  })

  describe('Foreign Key Constraints', () => {
    it('should fail to create user with invalid organizationId', async () => {
      // Act & Assert
      await expect(
        prisma.user.create({
          data: {
            name: 'Invalid User',
            email: 'invalid-integration@test.com',
            organizationId: 'non-existent-org-id',
            primaryPersona: 'BUSINESS_OWNER',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Data Isolation', () => {
    it('should only return users from specified organization', async () => {
      // Act
      const org1Users = await prisma.user.findMany({
        where: { organizationId: org1Id },
      })

      // Assert
      expect(org1Users).toHaveLength(1)
      expect(org1Users[0]!.organizationId).toBe(org1Id)
      expect(org1Users[0]!.email).toBe('user1-org1-integration@test.com')
    })

    it('should not see other organization users', async () => {
      // Act
      const org1Users = await prisma.user.findMany({
        where: { organizationId: org1Id },
      })

      // Assert - org1 should not see org2 users
      const org2UserInOrg1 = org1Users.find((u) => u.organizationId === org2Id)
      expect(org2UserInOrg1).toBeUndefined()
    })
  })

  describe('Soft Delete', () => {
    it('should exclude deleted organizations from default queries', async () => {
      // Arrange - soft delete org1
      await prisma.organization.update({
        where: { id: org1Id },
        data: { deletedAt: new Date() },
      })

      // Act
      const activeOrgs = await prisma.organization.findMany({
        where: { deletedAt: null },
      })

      // Assert
      const org1InResults = activeOrgs.find((o) => o.id === org1Id)
      expect(org1InResults).toBeUndefined()

      // Cleanup - restore org1
      await prisma.organization.update({
        where: { id: org1Id },
        data: { deletedAt: null },
      })
    })

    it('should include deleted organizations when explicitly queried', async () => {
      // Arrange - soft delete org1
      await prisma.organization.update({
        where: { id: org1Id },
        data: { deletedAt: new Date() },
      })

      // Act - query all including deleted
      const allOrgs = await prisma.organization.findMany()

      // Assert
      const org1InResults = allOrgs.find((o) => o.id === org1Id)
      expect(org1InResults).toBeDefined()
      expect(org1InResults!.deletedAt).toBeTruthy()

      // Cleanup - restore org1
      await prisma.organization.update({
        where: { id: org1Id },
        data: { deletedAt: null },
      })
    })

    it('should restore soft-deleted organization', async () => {
      // Arrange - soft delete org1
      await prisma.organization.update({
        where: { id: org1Id },
        data: { deletedAt: new Date() },
      })

      // Act - restore
      const restored = await prisma.organization.update({
        where: { id: org1Id },
        data: { deletedAt: null },
      })

      // Assert
      expect(restored.deletedAt).toBeNull()

      const activeOrgs = await prisma.organization.findMany({
        where: { deletedAt: null },
      })
      const org1InResults = activeOrgs.find((o) => o.id === org1Id)
      expect(org1InResults).toBeDefined()
    })
  })

  describe('Unique Constraints', () => {
    it('should enforce unique email constraint', async () => {
      // Act & Assert
      await expect(
        prisma.user.create({
          data: {
            name: 'Duplicate Email User',
            email: 'user1-org1-integration@test.com', // Already exists
            organizationId: org1Id,
            primaryPersona: 'BUSINESS_OWNER',
          },
        })
      ).rejects.toThrow()
    })

    it('should enforce unique organization slug constraint', async () => {
      // Act & Assert
      await expect(
        prisma.organization.create({
          data: {
            name: 'Duplicate Slug Org',
            slug: 'test-org-1-integration', // Already exists
            status: 'ACTIVE',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Enum Validation', () => {
    it('should accept valid UserPersona enum values', async () => {
      // Act
      const user = await prisma.user.create({
        data: {
          name: 'Privacy Officer',
          email: 'privacy-officer-integration@test.com',
          organizationId: org1Id,
          primaryPersona: 'PRIVACY_OFFICER',
        },
      })

      // Assert
      expect(user.primaryPersona).toBe('PRIVACY_OFFICER')

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should accept valid OrganizationStatus enum values', async () => {
      // Act
      const org = await prisma.organization.create({
        data: {
          name: 'Trial Org',
          slug: 'trial-org-integration',
          status: 'TRIAL',
        },
      })

      // Assert
      expect(org.status).toBe('TRIAL')

      // Cleanup
      await prisma.organization.delete({ where: { id: org.id } })
    })
  })

  describe('User Count Per Organization', () => {
    it('should return correct count for each organization', async () => {
      // Act
      const org1Count = await prisma.user.count({
        where: { organizationId: org1Id },
      })
      const org2Count = await prisma.user.count({
        where: { organizationId: org2Id },
      })

      // Assert
      expect(org1Count).toBe(1)
      expect(org2Count).toBe(1)
    })
  })

  describe('User-Level Operations', () => {
    it('should retrieve user by ID from correct organization', async () => {
      // Act
      const user1 = await prisma.user.findUnique({
        where: { id: user1Id },
      })

      // Assert
      expect(user1).toBeDefined()
      expect(user1!.id).toBe(user1Id)
      expect(user1!.organizationId).toBe(org1Id)
      expect(user1!.email).toBe('user1-org1-integration@test.com')
    })

    it('should update user in org1 without affecting user in org2', async () => {
      // Arrange - Get original user2 data
      const originalUser2 = await prisma.user.findUnique({
        where: { id: user2Id },
      })

      // Act - Update user1
      const updatedUser1 = await prisma.user.update({
        where: { id: user1Id },
        data: { name: 'Updated User 1 Name' },
      })

      // Get user2 after update
      const user2AfterUpdate = await prisma.user.findUnique({
        where: { id: user2Id },
      })

      // Assert - user1 updated, user2 unchanged
      expect(updatedUser1.name).toBe('Updated User 1 Name')
      expect(updatedUser1.organizationId).toBe(org1Id)
      expect(user2AfterUpdate!.name).toBe(originalUser2!.name)
      expect(user2AfterUpdate!.organizationId).toBe(org2Id)

      // Cleanup - restore user1 original name
      await prisma.user.update({
        where: { id: user1Id },
        data: { name: 'User 1 Org 1' },
      })
    })

    it('should delete specific user by ID', async () => {
      // Arrange - Create temporary user
      const tempUser = await prisma.user.create({
        data: {
          name: 'Temp User',
          email: 'temp-user-integration@test.com',
          organizationId: org1Id,
          primaryPersona: 'BUSINESS_OWNER',
        },
      })

      // Act - Delete the temporary user
      await prisma.user.delete({
        where: { id: tempUser.id },
      })

      // Assert - User no longer exists
      const deletedUser = await prisma.user.findUnique({
        where: { id: tempUser.id },
      })
      expect(deletedUser).toBeNull()

      // Assert - Other users still exist
      const user1Still = await prisma.user.findUnique({
        where: { id: user1Id },
      })
      const user2Still = await prisma.user.findUnique({
        where: { id: user2Id },
      })
      expect(user1Still).toBeDefined()
      expect(user2Still).toBeDefined()
    })
  })
})
