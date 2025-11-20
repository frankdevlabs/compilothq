import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createOrganization,
  getOrganizationById,
  getOrganizationBySlug,
  listOrganizations,
  restoreOrganization,
  softDeleteOrganization,
  updateOrganization,
} from '../../../src/dal/organizations'
import { prisma } from '../../../src/index'
import type { Organization } from '.prisma/client'

// Mock the prisma client
vi.mock('../../../src/index', () => ({
  prisma: {
    organization: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('Organizations DAL - Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('createOrganization', () => {
    it('should create organization with provided data', async () => {
      // Arrange
      const mockOrg: Organization = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        status: 'ACTIVE',
        settings: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.organization.create).mockResolvedValue(mockOrg)

      // Act
      const result = await createOrganization({
        name: 'Test Org',
        slug: 'test-org',
      })

      // Assert
      expect(result).toEqual(mockOrg)
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: 'Test Org',
            slug: 'test-org',
            status: 'ACTIVE',
          },
        })
      )
    })

    it('should create organization with custom status', async () => {
      // Arrange
      const mockOrg: Organization = {
        id: '1',
        name: 'Trial Org',
        slug: 'trial-org',
        status: 'TRIAL',
        settings: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.organization.create).mockResolvedValue(mockOrg)

      // Act
      await createOrganization({
        name: 'Trial Org',
        slug: 'trial-org',
        status: 'TRIAL',
      })

      // Assert
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: 'Trial Org',
            slug: 'trial-org',
            status: 'TRIAL',
          },
        })
      )
    })
  })

  describe('getOrganizationById', () => {
    it('should return organization when ID exists', async () => {
      // Arrange
      const mockOrg: Organization = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        status: 'ACTIVE',
        settings: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg)

      // Act
      const result = await getOrganizationById('1')

      // Assert
      expect(result).toEqual(mockOrg)
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should return null when ID does not exist', async () => {
      // Arrange
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null)

      // Act
      const result = await getOrganizationById('non-existent')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getOrganizationBySlug', () => {
    it('should return organization when slug exists', async () => {
      // Arrange
      const mockOrg: Organization = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        status: 'ACTIVE',
        settings: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg)

      // Act
      const result = await getOrganizationBySlug('test-org')

      // Assert
      expect(result).toEqual(mockOrg)
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-org' },
      })
    })

    it('should return null when slug does not exist', async () => {
      // Arrange
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null)

      // Act
      const result = await getOrganizationBySlug('non-existent')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('softDeleteOrganization', () => {
    it('should set deletedAt timestamp', async () => {
      // Arrange
      const now = new Date()
      const mockOrg: Organization = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        status: 'ACTIVE',
        settings: null,
        deletedAt: now,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.organization.update).mockResolvedValue(mockOrg)

      // Act
      const result = await softDeleteOrganization('1')

      // Assert
      expect(result.deletedAt).toBeTruthy()
      expect(prisma.organization.update).toHaveBeenCalledTimes(1)
      const callArgs = vi.mocked(prisma.organization.update).mock.calls[0]?.[0]
      expect(callArgs?.where).toEqual({ id: '1' })
      expect(callArgs?.data.deletedAt).toBeInstanceOf(Date)
    })
  })

  describe('restoreOrganization', () => {
    it('should clear deletedAt timestamp', async () => {
      // Arrange
      const mockOrg: Organization = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        status: 'ACTIVE',
        settings: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.organization.update).mockResolvedValue(mockOrg)

      // Act
      const result = await restoreOrganization('1')

      // Assert
      expect(result.deletedAt).toBeNull()
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: null },
      })
    })
  })

  describe('listOrganizations', () => {
    it('should exclude deleted organizations by default', async () => {
      // Arrange
      const mockOrgs: Organization[] = [
        {
          id: '1',
          name: 'Active Org',
          slug: 'active-org',
          status: 'ACTIVE',
          settings: null,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.organization.findMany).mockResolvedValue(mockOrgs)

      // Act
      const result = await listOrganizations()

      // Assert
      expect(result).toEqual(mockOrgs)
      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should include deleted organizations when includeDeleted=true', async () => {
      // Arrange
      const mockOrgs: Organization[] = [
        {
          id: '1',
          name: 'Active Org',
          slug: 'active-org',
          status: 'ACTIVE',
          settings: null,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Deleted Org',
          slug: 'deleted-org',
          status: 'CANCELLED',
          settings: null,
          deletedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.organization.findMany).mockResolvedValue(mockOrgs)

      // Act
      const result = await listOrganizations(true)

      // Assert
      expect(result).toEqual(mockOrgs)
      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('updateOrganization', () => {
    it('should update organization fields', async () => {
      // Arrange
      const mockOrg: Organization = {
        id: '1',
        name: 'Updated Org',
        slug: 'updated-org',
        status: 'SUSPENDED',
        settings: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.organization.update).mockResolvedValue(mockOrg)

      // Act
      const result = await updateOrganization('1', {
        name: 'Updated Org',
        status: 'SUSPENDED',
      })

      // Assert
      expect(result).toEqual(mockOrg)
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated Org', status: 'SUSPENDED' },
      })
    })
  })
})
