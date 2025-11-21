import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  createUser,
  deleteUser,
  getUserByEmail,
  getUserById,
  getUsersCount,
  listUsersByOrganization,
  listUsersByPersona,
  updateUser,
} from '../../../src/dal/users'
import type { Organization, User } from '../../../src/index'
import {
  cleanupTestOrganizations,
  createTestOrganization,
  createTestUser,
} from '../../../src/test-utils/factories'

/**
 * Users DAL - Integration Tests
 *
 * Tests user data access layer functions against a real test database.
 * Uses hybrid setup: shared data for read operations, per-test data for mutations.
 */
describe('Users DAL - Integration Tests', () => {
  // Shared data for READ-ONLY tests (faster)
  let sharedOrg: Organization
  let sharedUser: User

  beforeAll(async () => {
    // Create shared test organization and user for read operations
    const { org, users } = await createTestOrganization({
      slug: 'users-dal-shared-org',
      userCount: 1,
    })
    sharedOrg = org
    sharedUser = users[0]!
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([sharedOrg.id])
  })

  describe('getUserById', () => {
    it('should retrieve user by ID from database', async () => {
      // Act
      const result = await getUserById(sharedUser.id)

      // Assert - Verify complete data integrity
      expect(result).toBeDefined()
      expect(result?.id).toBe(sharedUser.id)
      expect(result?.email).toBe(sharedUser.email)
      expect(result?.organizationId).toBe(sharedOrg.id)
      expect(result?.primaryPersona).toBe('DPO') // Factory default for first user
    })

    it('should return null when user ID does not exist in database', async () => {
      // Act - Query with non-existent UUID
      const result = await getUserById('00000000-0000-0000-0000-000000000000')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('should retrieve user by email from database', async () => {
      // Act
      const result = await getUserByEmail(sharedUser.email)

      // Assert - Verify complete data integrity
      expect(result).toBeDefined()
      expect(result?.id).toBe(sharedUser.id)
      expect(result?.email).toBe(sharedUser.email)
      expect(result?.organizationId).toBe(sharedOrg.id)
    })

    it('should return null when email does not exist in database', async () => {
      // Act
      const result = await getUserByEmail('nonexistent-email-12345@example.com')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('listUsersByOrganization', () => {
    it('should return only users belonging to specified organization', async () => {
      // Arrange - Create multi-tenant scenario
      const { org: org1 } = await createTestOrganization({ slug: 'test-org-users-1', userCount: 2 })
      const { org: org2 } = await createTestOrganization({ slug: 'test-org-users-2', userCount: 1 })

      // Act - Query org1 users
      const result = await listUsersByOrganization(org1.id)

      // Assert - Verify multi-tenancy isolation
      expect(result).toHaveLength(2)
      expect(result.every((u) => u.organizationId === org1.id)).toBe(true)

      // Cleanup
      await cleanupTestOrganizations([org1.id, org2.id])
    })

    it('should filter users by persona when provided', async () => {
      // Arrange - Create org with users of different personas
      const { org } = await createTestOrganization({
        slug: 'test-org-persona-filter',
        userCount: 0,
      })
      await createTestUser({ organizationId: org.id, primaryPersona: 'DPO' })
      await createTestUser({ organizationId: org.id, primaryPersona: 'PRIVACY_OFFICER' })
      await createTestUser({ organizationId: org.id, primaryPersona: 'BUSINESS_OWNER' })

      // Act - Filter by DPO persona
      const result = await listUsersByOrganization(org.id, { persona: 'DPO' })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]?.primaryPersona).toBe('DPO')

      // Cleanup
      await cleanupTestOrganizations([org.id])
    })

    it('should respect limit parameter', async () => {
      // Arrange - Create org with multiple users
      const { org } = await createTestOrganization({ slug: 'test-org-limit', userCount: 5 })

      // Act - Query with limit
      const result = await listUsersByOrganization(org.id, { limit: 3 })

      // Assert
      expect(result).toHaveLength(3)

      // Cleanup
      await cleanupTestOrganizations([org.id])
    })
  })

  describe('listUsersByPersona', () => {
    it('should filter users by organization and persona', async () => {
      // Arrange - Create org with mixed personas
      const { org } = await createTestOrganization({ slug: 'test-org-persona-list', userCount: 0 })
      await createTestUser({ organizationId: org.id, primaryPersona: 'DPO' })
      await createTestUser({ organizationId: org.id, primaryPersona: 'DPO' })
      await createTestUser({ organizationId: org.id, primaryPersona: 'PRIVACY_OFFICER' })

      // Act
      const result = await listUsersByPersona(org.id, 'DPO')

      // Assert
      expect(result).toHaveLength(2)
      expect(result.every((u) => u.primaryPersona === 'DPO')).toBe(true)
      expect(result.every((u) => u.organizationId === org.id)).toBe(true)

      // Cleanup
      await cleanupTestOrganizations([org.id])
    })
  })

  describe('getUsersCount', () => {
    it('should return correct user count for organization', async () => {
      // Arrange - Create org with known number of users
      const { org } = await createTestOrganization({ slug: 'test-org-count', userCount: 7 })

      // Act
      const result = await getUsersCount(org.id)

      // Assert
      expect(result).toBe(7)

      // Cleanup
      await cleanupTestOrganizations([org.id])
    })
  })

  // Mutation tests - Use per-test isolation
  describe('Mutation Operations', () => {
    let testData: { org: Organization; user: User }

    beforeEach(async () => {
      // Create fresh data for each mutation test
      const { org, users } = await createTestOrganization({
        slug: `test-org-mutation-${Date.now()}`,
        userCount: 1,
      })
      testData = { org, user: users[0]! }
    })

    afterEach(async () => {
      // Cleanup after each mutation test
      await cleanupTestOrganizations([testData.org.id])
    })

    describe('createUser', () => {
      it('should create user with organization ID and default values', async () => {
        // Act
        const result = await createUser({
          name: 'New Test User',
          email: `new-user-${Date.now()}@example.com`,
          organizationId: testData.org.id,
        })

        // Assert - Verify user created
        expect(result).toBeDefined()
        expect(result.name).toBe('New Test User')
        expect(result.organizationId).toBe(testData.org.id)
        expect(result.primaryPersona).toBe('BUSINESS_OWNER') // Default from DAL
        expect(result.emailVerified).toBeNull()
        expect(result.image).toBeNull()

        // Verify persistence - Re-fetch from database
        const refetched = await getUserById(result.id)
        expect(refetched?.name).toBe('New Test User')
      })

      it('should create user with custom persona', async () => {
        // Act
        const result = await createUser({
          name: 'DPO User',
          email: `dpo-user-${Date.now()}@example.com`,
          organizationId: testData.org.id,
          primaryPersona: 'DPO',
        })

        // Assert
        expect(result).toBeDefined()
        expect(result.primaryPersona).toBe('DPO')

        // Verify persistence
        const refetched = await getUserById(result.id)
        expect(refetched?.primaryPersona).toBe('DPO')
      })
    })

    describe('updateUser', () => {
      it('should update user fields and persist changes to database', async () => {
        // Arrange - Get initial state
        const initialName = testData.user.name
        const initialPersona = testData.user.primaryPersona

        // Act - Update user
        const result = await updateUser(testData.user.id, {
          name: 'Updated Name',
          primaryPersona: 'PRIVACY_OFFICER',
        })

        // Assert - Verify update
        expect(result.name).toBe('Updated Name')
        expect(result.name).not.toBe(initialName)
        expect(result.primaryPersona).toBe('PRIVACY_OFFICER')
        expect(result.primaryPersona).not.toBe(initialPersona)

        // Verify persistence - Re-fetch from database
        const refetched = await getUserById(testData.user.id)
        expect(refetched?.name).toBe('Updated Name')
        expect(refetched?.primaryPersona).toBe('PRIVACY_OFFICER')
      })
    })

    describe('deleteUser', () => {
      it('should delete user from database', async () => {
        // Arrange - Verify user exists
        const beforeDelete = await getUserById(testData.user.id)
        expect(beforeDelete).toBeDefined()

        // Act - Delete user
        const result = await deleteUser(testData.user.id)

        // Assert - Verify returned deleted user
        expect(result.id).toBe(testData.user.id)

        // Verify user no longer exists in database
        const afterDelete = await getUserById(testData.user.id)
        expect(afterDelete).toBeNull()
      })
    })
  })
})
