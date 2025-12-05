/* eslint-disable @typescript-eslint/no-explicit-any */
// Type assertions needed due to Prisma JSON field type limitations in test data
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  getDataSubjectCategoryByCode,
  getDataSubjectCategoryById,
  getVulnerableDataSubjectCategories,
  listDataSubjectCategories,
} from '../../../src/dal/dataSubjectCategories'
import { prisma } from '../../../src/index'
import {
  cleanupTestDatabase,
  DataSubjectCategoryFactory,
  disconnectTestDatabase,
  setupTestDatabase,
} from '../../../src/test-utils'
import { seedReferenceData } from '../../../src/test-utils/seed-reference-data'

describe('DataSubjectCategories DAL - Integration Tests', () => {
  beforeAll(() => {
    // Run migrations once before all tests
    setupTestDatabase()
  })

  beforeEach(async () => {
    // Clean database before each test for isolation
    await cleanupTestDatabase()
    // Restore reference data for other tests
    await seedReferenceData(prisma)
  })

  afterAll(async () => {
    // Disconnect from database after all tests
    await disconnectTestDatabase()
  })

  describe('getDataSubjectCategoryById', () => {
    it('should create category and retrieve by ID', async () => {
      // Arrange - Create a data subject category using factory
      const categoryData = new DataSubjectCategoryFactory().build({
        name: 'Customer',
        code: 'CUSTOMER',
        category: 'external',
        examples: ['Paying customers', 'Service users'],
      })

      const createdCategory = await prisma.dataSubjectCategory.create({
        data: categoryData as any,
      })

      // Act - Retrieve the category by ID
      const result = await getDataSubjectCategoryById(createdCategory.id)

      // Assert
      expect(result).not.toBeNull()
      expect(result?.id).toBe(createdCategory.id)
      expect(result?.name).toBe('Customer')
      expect(result?.code).toBe('CUSTOMER')
      expect(result?.category).toBe('external')
    })

    it('should return null for non-existent ID', async () => {
      // Act
      const result = await getDataSubjectCategoryById('non-existent-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('listDataSubjectCategories', () => {
    it('should list all active categories ordered by name', async () => {
      // Arrange - Create multiple categories
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Employee',
          code: 'EMPLOYEE',
          category: 'internal',
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Customer',
          code: 'CUSTOMER',
          category: 'external',
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Applicant',
          code: 'APPLICANT',
          category: 'internal',
        }) as any,
      })

      // Act
      const result = await listDataSubjectCategories()

      // Assert - Should be ordered alphabetically by name
      expect(result).toHaveLength(3)
      expect(result[0]!.name).toBe('Applicant')
      expect(result[1]!.name).toBe('Customer')
      expect(result[2]!.name).toBe('Employee')
    })

    it('should filter out inactive categories', async () => {
      // Arrange - Create active and inactive categories
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Active Category',
          code: 'ACTIVE',
          isActive: true,
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Inactive Category',
          code: 'INACTIVE',
          isActive: false,
        }) as any,
      })

      // Act
      const result = await listDataSubjectCategories()

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Active Category')
    })

    it('should include both org-specific and system-wide categories', async () => {
      // Arrange - Create test organizations first
      const testOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: `test-org-${Date.now()}`,
          status: 'ACTIVE',
        },
      })

      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Organization',
          slug: `other-org-${Date.now()}`,
          status: 'ACTIVE',
        },
      })

      // Create system-wide and org-specific categories
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'System Category',
          code: 'SYSTEM',
          organizationId: null,
          isSystemDefined: true,
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Org Category',
          code: 'ORG_SPECIFIC',
          organizationId: testOrg.id,
          isSystemDefined: false,
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Other Org Category',
          code: 'OTHER_ORG',
          organizationId: otherOrg.id,
          isSystemDefined: false,
        }) as any,
      })

      // Act
      const result = await listDataSubjectCategories(testOrg.id)

      // Assert - Should include system-wide + org-specific categories only
      expect(result).toHaveLength(2)
      const names = result.map((c) => c.name).sort()
      expect(names).toEqual(['Org Category', 'System Category'])
    })
  })

  describe('getDataSubjectCategoryByCode', () => {
    it('should retrieve category by code (system-wide)', async () => {
      // Arrange
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Customer',
          code: 'CUSTOMER',
          organizationId: null,
        }) as any,
      })

      // Act
      const result = await getDataSubjectCategoryByCode('CUSTOMER')

      // Assert
      expect(result).not.toBeNull()
      expect(result?.name).toBe('Customer')
      expect(result?.code).toBe('CUSTOMER')
    })

    it('should prioritize org-specific category over system-wide', async () => {
      // Arrange - Create test organization first
      const testOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: `test-org-${Date.now()}`,
          status: 'ACTIVE',
        },
      })

      // Create both system-wide and org-specific with same code
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'System Customer',
          code: 'CUSTOMER',
          organizationId: null,
          description: 'System-wide customer category',
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Org Customer',
          code: 'CUSTOMER',
          organizationId: testOrg.id,
          description: 'Org-specific customer category',
        }) as any,
      })

      // Act
      const result = await getDataSubjectCategoryByCode('CUSTOMER', testOrg.id)

      // Assert - Should return org-specific category
      expect(result).not.toBeNull()
      expect(result?.name).toBe('Org Customer')
      expect(result?.description).toBe('Org-specific customer category')
      expect(result?.organizationId).toBe(testOrg.id)
    })

    it('should fall back to system-wide when org category not found', async () => {
      // Arrange - Create test organization first
      const testOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: `test-org-${Date.now()}`,
          status: 'ACTIVE',
        },
      })

      // Create only system-wide category
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'System Customer',
          code: 'CUSTOMER',
          organizationId: null,
        }) as any,
      })

      // Act
      const result = await getDataSubjectCategoryByCode('CUSTOMER', testOrg.id)

      // Assert - Should return system-wide category
      expect(result).not.toBeNull()
      expect(result?.name).toBe('System Customer')
      expect(result?.organizationId).toBeNull()
    })

    it('should return null when code does not exist', async () => {
      // Act
      const result = await getDataSubjectCategoryByCode('NON_EXISTENT')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getVulnerableDataSubjectCategories', () => {
    it('should filter categories by isVulnerable flag', async () => {
      // Arrange - Create vulnerable and non-vulnerable categories
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Minor',
          code: 'MINOR',
          category: 'vulnerable',
          isVulnerable: true,
          vulnerabilityArticle: 'Art. 8',
          suggestsDPIA: true,
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Patient',
          code: 'PATIENT',
          category: 'vulnerable',
          isVulnerable: true,
          vulnerabilityArticle: 'Art. 9',
          suggestsDPIA: true,
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Customer',
          code: 'CUSTOMER',
          category: 'external',
          isVulnerable: false,
        }) as any,
      })

      // Act
      const result = await getVulnerableDataSubjectCategories()

      // Assert
      expect(result).toHaveLength(2)
      const names = result.map((c) => c.name).sort()
      expect(names).toEqual(['Minor', 'Patient'])
      result.forEach((category) => {
        expect(category.isVulnerable).toBe(true)
      })
    })

    it('should include both org-specific and system-wide vulnerable categories', async () => {
      // Arrange - Create test organizations first
      const testOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: `test-org-${Date.now()}`,
          status: 'ACTIVE',
        },
      })

      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Organization',
          slug: `other-org-${Date.now()}`,
          status: 'ACTIVE',
        },
      })

      // Create vulnerable categories
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'System Minor',
          code: 'MINOR',
          organizationId: null,
          isVulnerable: true,
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Org Vulnerable',
          code: 'ORG_VULNERABLE',
          organizationId: testOrg.id,
          isVulnerable: true,
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Other Org Vulnerable',
          code: 'OTHER_VULNERABLE',
          organizationId: otherOrg.id,
          isVulnerable: true,
        }) as any,
      })

      // Act
      const result = await getVulnerableDataSubjectCategories(testOrg.id)

      // Assert
      expect(result).toHaveLength(2)
      const names = result.map((c) => c.name).sort()
      expect(names).toEqual(['Org Vulnerable', 'System Minor'])
    })

    it('should filter out inactive vulnerable categories', async () => {
      // Arrange
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Active Vulnerable',
          code: 'ACTIVE_VULNERABLE',
          isVulnerable: true,
          isActive: true,
        }) as any,
      })

      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Inactive Vulnerable',
          code: 'INACTIVE_VULNERABLE',
          isVulnerable: true,
          isActive: false,
        }) as any,
      })

      // Act
      const result = await getVulnerableDataSubjectCategories()

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Active Vulnerable')
    })

    it('should return empty array when no vulnerable categories exist', async () => {
      // Arrange - Create only non-vulnerable categories
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Customer',
          code: 'CUSTOMER',
          isVulnerable: false,
        }) as any,
      })

      // Act
      const result = await getVulnerableDataSubjectCategories()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('Unique constraints', () => {
    it('should enforce unique constraint on [code, organizationId]', async () => {
      // Arrange - Create test organization first
      const testOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: `test-org-${Date.now()}`,
          status: 'ACTIVE',
        },
      })

      // Create a category with specific code and organizationId
      await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'First Customer',
          code: 'CUSTOMER',
          organizationId: testOrg.id,
        }) as any,
      })

      // Act & Assert - Attempt to create another category with same [code, organizationId]
      await expect(
        prisma.dataSubjectCategory.create({
          data: new DataSubjectCategoryFactory().build({
            name: 'Second Customer',
            code: 'CUSTOMER', // Duplicate code
            organizationId: testOrg.id, // Same organizationId
          }) as any,
        })
      ).rejects.toThrow()
    })

    it('should allow same code across different organizations', async () => {
      // Arrange & Act - Create test organizations
      const org1 = await prisma.organization.create({
        data: {
          name: 'Organization 1',
          slug: `org-1-${Date.now()}`,
          status: 'ACTIVE',
        },
      })

      const org2 = await prisma.organization.create({
        data: {
          name: 'Organization 2',
          slug: `org-2-${Date.now()}`,
          status: 'ACTIVE',
        },
      })

      // Create categories with same code but different organizationIds
      const category1 = await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Org1 Customer',
          code: 'CUSTOMER',
          organizationId: org1.id,
        }) as any,
      })

      const category2 = await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'Org2 Customer',
          code: 'CUSTOMER',
          organizationId: org2.id,
        }) as any,
      })

      const systemCategory = await prisma.dataSubjectCategory.create({
        data: new DataSubjectCategoryFactory().build({
          name: 'System Customer',
          code: 'CUSTOMER',
          organizationId: null,
        }) as any,
      })

      // Assert - All should be created successfully
      expect(category1.code).toBe('CUSTOMER')
      expect(category2.code).toBe('CUSTOMER')
      expect(systemCategory.code).toBe('CUSTOMER')
      expect(category1.id).not.toBe(category2.id)
      expect(category2.id).not.toBe(systemCategory.id)
    })
  })

  describe('Default values', () => {
    it('should apply default values correctly', async () => {
      // Arrange & Act - Create category without specifying defaults
      const category = await prisma.dataSubjectCategory.create({
        data: {
          code: 'TEST',
          name: 'Test Category',
        } as any,
      })

      // Assert - Verify default values
      expect(category.isActive).toBe(true)
      expect(category.isSystemDefined).toBe(false)
      expect(category.isVulnerable).toBe(false)
      expect(category.suggestsDPIA).toBe(false)
    })
  })
})
