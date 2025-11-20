import { beforeEach, describe, expect, it, vi } from 'vitest'

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
import type { User } from '../../../src/index'
import { prisma } from '../../../src/index'

// Mock the prisma client
vi.mock('../../../src/index', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Users DAL - Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('createUser', () => {
    it('should create user with organizationId', async () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: null,
        image: null,
        organizationId: 'org1',
        primaryPersona: 'BUSINESS_OWNER',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

      // Act
      const result = await createUser({
        name: 'Test User',
        email: 'test@example.com',
        organizationId: 'org1',
      })

      // Assert
      expect(result).toEqual(mockUser)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          organizationId: 'org1',
          primaryPersona: 'BUSINESS_OWNER',
          emailVerified: null,
          image: null,
        },
      })
    })

    it('should create user with custom persona', async () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        name: 'DPO User',
        email: 'dpo@example.com',
        emailVerified: null,
        image: null,
        organizationId: 'org1',
        primaryPersona: 'DPO',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

      // Act
      await createUser({
        name: 'DPO User',
        email: 'dpo@example.com',
        organizationId: 'org1',
        primaryPersona: 'DPO',
      })

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'DPO User',
          email: 'dpo@example.com',
          organizationId: 'org1',
          primaryPersona: 'DPO',
          emailVerified: null,
          image: null,
        },
      })
    })
  })

  describe('getUserById', () => {
    it('should return user when ID exists', async () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: null,
        image: null,
        organizationId: 'org1',
        primaryPersona: 'BUSINESS_OWNER',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      // Act
      const result = await getUserById('1')

      // Assert
      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should return null when ID does not exist', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      // Act
      const result = await getUserById('non-existent')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('should return user when email exists', async () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: null,
        image: null,
        organizationId: 'org1',
        primaryPersona: 'BUSINESS_OWNER',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      // Act
      const result = await getUserByEmail('test@example.com')

      // Assert
      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should return null when email does not exist', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      // Act
      const result = await getUserByEmail('nonexistent@example.com')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('listUsersByOrganization', () => {
    it('should filter users by organizationId', async () => {
      // Arrange
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          emailVerified: null,
          image: null,
          organizationId: 'org1',
          primaryPersona: 'BUSINESS_OWNER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersByOrganization('org1')

      // Assert
      expect(result).toEqual(mockUsers)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter by persona when provided', async () => {
      // Arrange
      const mockUsers: User[] = []
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers)

      // Act
      await listUsersByOrganization('org1', { persona: 'DPO' })

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1', primaryPersona: 'DPO' },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should apply limit when provided', async () => {
      // Arrange
      const mockUsers: User[] = []
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers)

      // Act
      await listUsersByOrganization('org1', { limit: 5 })

      // Assert
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    })
  })

  describe('listUsersByPersona', () => {
    it('should filter by organizationId and persona', async () => {
      // Arrange
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'DPO User',
          email: 'dpo@example.com',
          emailVerified: null,
          image: null,
          organizationId: 'org1',
          primaryPersona: 'DPO',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersByPersona('org1', 'DPO')

      // Assert
      expect(result).toEqual(mockUsers)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org1',
          primaryPersona: 'DPO',
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('getUsersCount', () => {
    it('should return count for organization', async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockResolvedValue(5)

      // Act
      const result = await getUsersCount('org1')

      // Assert
      expect(result).toBe(5)
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
      })
    })
  })

  describe('updateUser', () => {
    it('should update user fields', async () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        name: 'Updated User',
        email: 'updated@example.com',
        emailVerified: null,
        image: null,
        organizationId: 'org1',
        primaryPersona: 'PRIVACY_OFFICER',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.update).mockResolvedValue(mockUser)

      // Act
      const result = await updateUser('1', {
        name: 'Updated User',
        primaryPersona: 'PRIVACY_OFFICER',
      })

      // Assert
      expect(result).toEqual(mockUser)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated User', primaryPersona: 'PRIVACY_OFFICER' },
      })
    })
  })

  describe('deleteUser', () => {
    it('should delete user', async () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: null,
        image: null,
        organizationId: 'org1',
        primaryPersona: 'BUSINESS_OWNER',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.user.delete).mockResolvedValue(mockUser)

      // Act
      const result = await deleteUser('1')

      // Assert
      expect(result).toEqual(mockUser)
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })
  })
})
