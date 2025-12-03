import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createDataCategory,
  deleteDataCategory,
  getDataCategoriesBySensitivity,
  getDataCategoryById,
  getSpecialCategoryDataCategories,
  listDataCategories,
  updateDataCategory,
} from '../../../src/dal/dataCategories'
import type { Organization } from '../../../src/index'
import { prisma } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * DataCategories DAL - Integration Tests
 *
 * Tests the DataCategory Prisma model structure, relationships, DAL functions, and business logic.
 *
 * Coverage:
 * - Schema structure and constraints
 * - CRUD operations with DAL functions
 * - Multi-tenancy isolation
 * - isSpecialCategory auto-detection logic
 * - Query and filter functions
 * - Edge cases and validation
 */
describe('DataCategories - Integration Tests', () => {
  let testOrg1: Organization
  let testOrg2: Organization
  let dataNatureSpecialId: string
  let dataNatureNonSpecialId: string

  beforeAll(async () => {
    // Create test organizations
    const { org: org1 } = await createTestOrganization({
      slug: 'dc-test-org-1',
      userCount: 0,
    })
    const { org: org2 } = await createTestOrganization({
      slug: 'dc-test-org-2',
      userCount: 0,
    })
    testOrg1 = org1
    testOrg2 = org2

    // Create test DataNature records if they don't exist
    let specialNature = await prisma.dataNature.findFirst({
      where: { type: 'SPECIAL' },
    })
    let nonSpecialNature = await prisma.dataNature.findFirst({
      where: { type: 'NON_SPECIAL' },
    })

    // Create DataNature records if seed data not found
    specialNature ??= await prisma.dataNature.create({
      data: {
        name: 'Health Data (Test)',
        description: 'Health and medical data - GDPR Article 9',
        type: 'SPECIAL',
        gdprArticle: 'Article 9',
        isActive: true,
      },
    })

    nonSpecialNature ??= await prisma.dataNature.create({
      data: {
        name: 'Contact Information (Test)',
        description: 'Basic contact information - GDPR Article 4',
        type: 'NON_SPECIAL',
        gdprArticle: 'Article 4',
        isActive: true,
      },
    })

    dataNatureSpecialId = specialNature.id
    dataNatureNonSpecialId = nonSpecialNature.id
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg1.id, testOrg2.id])

    // Clean up test DataNatures if we created them
    await prisma.dataNature.deleteMany({
      where: {
        name: {
          in: ['Health Data (Test)', 'Contact Information (Test)'],
        },
      },
    })
  })

  describe('Schema and Model Structure', () => {
    it('should create DataCategory with all required fields', async () => {
      // Arrange
      const categoryData = {
        id: 'dc_test_' + Date.now(),
        name: 'Employee Health Records',
        description: 'Health data collected during wellness programs',
        organizationId: testOrg1.id,
        sensitivity: 'CONFIDENTIAL' as const,
        isSpecialCategory: true,
        exampleFields: ['blood_pressure', 'bmi', 'heart_rate'],
        metadata: {
          specialCategoryOverride: {
            overridden: false,
            justification: null,
          },
        },
        isActive: true,
      }

      // Act
      const category = await prisma.dataCategory.create({
        data: categoryData,
      })

      // Assert
      expect(category).toBeDefined()
      expect(category.id).toBe(categoryData.id)
      expect(category.name).toBe(categoryData.name)
      expect(category.description).toBe(categoryData.description)
      expect(category.organizationId).toBe(testOrg1.id)
      expect(category.sensitivity).toBe('CONFIDENTIAL')
      expect(category.isSpecialCategory).toBe(true)
      expect(category.exampleFields).toEqual(['blood_pressure', 'bmi', 'heart_rate'])
      expect(category.metadata).toEqual(categoryData.metadata)
      expect(category.isActive).toBe(true)
      expect(category.createdAt).toBeInstanceOf(Date)
      expect(category.updatedAt).toBeInstanceOf(Date)
    })

    it('should accept all four sensitivity levels: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED', async () => {
      // Test all four enum values
      const levels = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'] as const

      for (const level of levels) {
        const category = await prisma.dataCategory.create({
          data: {
            name: `Test Category ${level}`,
            organizationId: testOrg1.id,
            sensitivity: level,
            isSpecialCategory: false,
          },
        })

        expect(category.sensitivity).toBe(level)
      }
    })

    it('should reject invalid sensitivity level', async () => {
      // Arrange & Act & Assert
      await expect(
        prisma.dataCategory.create({
          data: {
            name: 'Invalid Sensitivity',
            organizationId: testOrg1.id,
            // @ts-expect-error - Testing invalid enum value
            sensitivity: 'INVALID_LEVEL',
            isSpecialCategory: false,
          },
        })
      ).rejects.toThrow()
    })

    it('should link DataCategory to multiple DataNatures', async () => {
      // Arrange - Create category
      const category = await prisma.dataCategory.create({
        data: {
          name: 'Employee Wellness Data',
          organizationId: testOrg1.id,
          sensitivity: 'CONFIDENTIAL',
          isSpecialCategory: true,
        },
      })

      // Act - Create junction entries
      await prisma.dataCategoryDataNature.create({
        data: {
          dataCategoryId: category.id,
          dataNatureId: dataNatureSpecialId,
        },
      })

      await prisma.dataCategoryDataNature.create({
        data: {
          dataCategoryId: category.id,
          dataNatureId: dataNatureNonSpecialId,
        },
      })

      // Assert - Query with relations
      const categoryWithNatures = await prisma.dataCategory.findUnique({
        where: { id: category.id },
        include: {
          dataNatures: {
            include: {
              dataNature: true,
            },
          },
        },
      })

      expect(categoryWithNatures?.dataNatures).toHaveLength(2)
      expect(
        categoryWithNatures?.dataNatures.some((n) => n.dataNatureId === dataNatureSpecialId)
      ).toBe(true)
      expect(
        categoryWithNatures?.dataNatures.some((n) => n.dataNatureId === dataNatureNonSpecialId)
      ).toBe(true)
    })

    it('should enforce unique constraint on (dataCategoryId, dataNatureId)', async () => {
      // Arrange - Create category
      const category = await prisma.dataCategory.create({
        data: {
          name: 'Test Category for Unique Constraint',
          organizationId: testOrg1.id,
          sensitivity: 'INTERNAL',
          isSpecialCategory: false,
        },
      })

      // Act - Create first junction entry
      await prisma.dataCategoryDataNature.create({
        data: {
          dataCategoryId: category.id,
          dataNatureId: dataNatureSpecialId,
        },
      })

      // Assert - Creating duplicate should fail
      await expect(
        prisma.dataCategoryDataNature.create({
          data: {
            dataCategoryId: category.id,
            dataNatureId: dataNatureSpecialId, // Same combination
          },
        })
      ).rejects.toThrow(/Unique constraint/)
    })

    it('should delete DataCategories when Organization is deleted', async () => {
      // Arrange - Create temporary organization with category
      const { org: tempOrg } = await createTestOrganization({
        slug: `dc-cascade-${Date.now()}`,
        userCount: 0,
      })

      const category = await prisma.dataCategory.create({
        data: {
          name: 'Category to be Cascade Deleted',
          organizationId: tempOrg.id,
          sensitivity: 'PUBLIC',
          isSpecialCategory: false,
        },
      })

      // Create junction entry as well
      await prisma.dataCategoryDataNature.create({
        data: {
          dataCategoryId: category.id,
          dataNatureId: dataNatureSpecialId,
        },
      })

      // Verify category exists
      const categoryBefore = await prisma.dataCategory.findUnique({
        where: { id: category.id },
      })
      expect(categoryBefore).toBeDefined()

      // Act - Delete organization (should cascade to categories)
      await prisma.organization.delete({
        where: { id: tempOrg.id },
      })

      // Assert - Category should be deleted
      const categoryAfter = await prisma.dataCategory.findUnique({
        where: { id: category.id },
      })
      expect(categoryAfter).toBeNull()

      // Assert - Junction entries should also be deleted (cascade from category)
      const junctionAfter = await prisma.dataCategoryDataNature.findMany({
        where: { dataCategoryId: category.id },
      })
      expect(junctionAfter).toHaveLength(0)
    })
  })

  describe('CRUD Operations', () => {
    it('should create category with all required fields and verify defaults', async () => {
      // Arrange
      const categoryData = {
        name: 'Customer Contact Data',
        description: 'Basic customer contact information',
        organizationId: testOrg1.id,
        sensitivity: 'INTERNAL' as const,
      }

      // Act
      const category = await createDataCategory(categoryData)

      // Assert
      expect(category).toBeDefined()
      expect(category.name).toBe(categoryData.name)
      expect(category.description).toBe(categoryData.description)
      expect(category.organizationId).toBe(testOrg1.id)
      expect(category.sensitivity).toBe('INTERNAL')
      expect(category.isSpecialCategory).toBe(false) // Default when no natures linked
      expect(category.isActive).toBe(true) // Default
      expect(category.createdAt).toBeInstanceOf(Date)
      expect(category.updatedAt).toBeInstanceOf(Date)
    })

    it('should create category with all optional fields populated', async () => {
      // Arrange
      const categoryData = {
        name: 'Employee Personal Files',
        description: 'Comprehensive employee personal data',
        organizationId: testOrg1.id,
        sensitivity: 'CONFIDENTIAL' as const,
        isSpecialCategory: true,
        exampleFields: ['ssn', 'health_records', 'performance_reviews'],
        metadata: { source: 'HR System', version: '2.0' },
      }

      // Act
      const category = await createDataCategory(categoryData)

      // Assert
      expect(category.name).toBe(categoryData.name)
      expect(category.description).toBe(categoryData.description)
      expect(category.sensitivity).toBe('CONFIDENTIAL')
      expect(category.isSpecialCategory).toBe(true)
      expect(category.exampleFields).toEqual(categoryData.exampleFields)
      expect(category.metadata).toEqual(categoryData.metadata)
    })

    it('should create category with linked DataNatures via dataNatureIds', async () => {
      // Arrange
      const categoryData = {
        name: 'Healthcare Provider Data',
        organizationId: testOrg1.id,
        sensitivity: 'RESTRICTED' as const,
        dataNatureIds: [dataNatureSpecialId, dataNatureNonSpecialId],
      }

      // Act
      const category = await createDataCategory(categoryData)

      // Assert - Verify category created
      expect(category).toBeDefined()

      // Fetch with relations to verify junction entries
      const categoryWithRelations = await getDataCategoryById(category.id, testOrg1.id)
      expect(categoryWithRelations?.dataNatures).toHaveLength(2)
    })

    it('should get category by ID with correct organization returns data with relations', async () => {
      // Arrange - Create category with relations
      const category = await createDataCategory({
        name: 'Test Get Category',
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
        dataNatureIds: [dataNatureNonSpecialId],
      })

      // Act
      const result = await getDataCategoryById(category.id, testOrg1.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(category.id)
      expect(result?.name).toBe('Test Get Category')
      expect(result?.dataNatures).toHaveLength(1)
      expect(result?.dataNatures[0]?.dataNature.id).toBe(dataNatureNonSpecialId)
    })

    it('should get category by ID with wrong organization returns null', async () => {
      // Arrange - Create category for org1
      const category = await createDataCategory({
        name: 'Org1 Private Category',
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
      })

      // Act - Try to access with org2's ID
      const result = await getDataCategoryById(category.id, testOrg2.id)

      // Assert
      expect(result).toBeNull()
    })

    it('should update category fields including clearing nullable fields with null', async () => {
      // Arrange - Create category with optional fields
      const category = await createDataCategory({
        name: 'Original Name',
        description: 'Original description',
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
        exampleFields: ['field1', 'field2'],
      })

      // Act - Update and clear nullable fields
      const updated = await updateDataCategory(category.id, testOrg1.id, {
        name: 'Updated Name',
        description: null, // Clear description
        sensitivity: 'INTERNAL',
        exampleFields: null, // Clear example fields
      })

      // Assert
      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBeNull()
      expect(updated.sensitivity).toBe('INTERNAL')
      expect(updated.exampleFields).toBeNull()
    })

    it('should delete category and verify cascade deletes junction entries', async () => {
      // Arrange - Create category with junction entries
      const category = await createDataCategory({
        name: 'Category to Delete',
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
        dataNatureIds: [dataNatureSpecialId, dataNatureNonSpecialId],
      })

      // Verify junction entries exist
      const junctionBefore = await prisma.dataCategoryDataNature.findMany({
        where: { dataCategoryId: category.id },
      })
      expect(junctionBefore).toHaveLength(2)

      // Act - Delete category
      const deleted = await deleteDataCategory(category.id, testOrg1.id)

      // Assert - Category deleted
      expect(deleted.id).toBe(category.id)

      // Verify junction entries cascade deleted
      const junctionAfter = await prisma.dataCategoryDataNature.findMany({
        where: { dataCategoryId: category.id },
      })
      expect(junctionAfter).toHaveLength(0)
    })
  })

  describe('Multi-Tenancy Isolation', () => {
    it('should list categories only for requesting organization', async () => {
      // Arrange - Create categories for both organizations
      await createDataCategory({
        name: 'Org1 Category 1',
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
      })
      await createDataCategory({
        name: 'Org1 Category 2',
        organizationId: testOrg1.id,
        sensitivity: 'INTERNAL',
      })
      await createDataCategory({
        name: 'Org2 Category 1',
        organizationId: testOrg2.id,
        sensitivity: 'PUBLIC',
      })

      // Act - List for org1
      const org1Result = await listDataCategories(testOrg1.id)

      // Assert - Should only see org1 categories
      expect(org1Result.items.length).toBeGreaterThanOrEqual(2)
      expect(org1Result.items.every((cat) => cat.organizationId === testOrg1.id)).toBe(true)
    })

    it('should not read category belonging to different organization', async () => {
      // Arrange - Create category for org2
      const category = await createDataCategory({
        name: 'Org2 Private Category',
        organizationId: testOrg2.id,
        sensitivity: 'PUBLIC',
      })

      // Act - Try to read with org1's ID
      const result = await getDataCategoryById(category.id, testOrg1.id)

      // Assert
      expect(result).toBeNull()
    })

    it('should not update category belonging to different organization', async () => {
      // Arrange - Create category for org2
      const category = await createDataCategory({
        name: 'Org2 Category',
        organizationId: testOrg2.id,
        sensitivity: 'PUBLIC',
      })

      // Act & Assert - Try to update with org1's ID should fail
      await expect(
        updateDataCategory(category.id, testOrg1.id, {
          name: 'Hacked Name',
        })
      ).rejects.toThrow(/not found or does not belong/)
    })

    it('should not delete category belonging to different organization', async () => {
      // Arrange - Create category for org2
      const category = await createDataCategory({
        name: 'Org2 Category to Protect',
        organizationId: testOrg2.id,
        sensitivity: 'PUBLIC',
      })

      // Act & Assert - Try to delete with org1's ID should fail
      await expect(deleteDataCategory(category.id, testOrg1.id)).rejects.toThrow(
        /not found or does not belong/
      )

      // Verify category still exists
      const stillExists = await getDataCategoryById(category.id, testOrg2.id)
      expect(stillExists).toBeDefined()
    })
  })

  describe('isSpecialCategory Auto-Detection', () => {
    it('should set isSpecialCategory=true when linked to SPECIAL DataNature', async () => {
      // Arrange & Act
      const category = await createDataCategory({
        name: 'Health Information Category',
        organizationId: testOrg1.id,
        sensitivity: 'RESTRICTED',
        dataNatureIds: [dataNatureSpecialId],
      })

      // Assert
      expect(category.isSpecialCategory).toBe(true)
    })

    it('should set isSpecialCategory=false when linked to only NON_SPECIAL DataNatures', async () => {
      // Arrange & Act
      const category = await createDataCategory({
        name: 'Contact Info Category',
        organizationId: testOrg1.id,
        sensitivity: 'INTERNAL',
        dataNatureIds: [dataNatureNonSpecialId],
      })

      // Assert
      expect(category.isSpecialCategory).toBe(false)
    })

    it('should set isSpecialCategory=true with mixed natures (conservative)', async () => {
      // Arrange & Act - Mixed SPECIAL and NON_SPECIAL
      const category = await createDataCategory({
        name: 'Mixed Data Category',
        organizationId: testOrg1.id,
        sensitivity: 'CONFIDENTIAL',
        dataNatureIds: [dataNatureSpecialId, dataNatureNonSpecialId],
      })

      // Assert - Conservative: ANY special nature makes it special
      expect(category.isSpecialCategory).toBe(true)
    })

    it('should recalculate to true when updating to add SPECIAL nature', async () => {
      // Arrange - Create with NON_SPECIAL nature
      const category = await createDataCategory({
        name: 'Initially Non-Special',
        organizationId: testOrg1.id,
        sensitivity: 'INTERNAL',
        dataNatureIds: [dataNatureNonSpecialId],
      })
      expect(category.isSpecialCategory).toBe(false)

      // Act - Update to add SPECIAL nature
      const updated = await updateDataCategory(category.id, testOrg1.id, {
        dataNatureIds: [dataNatureNonSpecialId, dataNatureSpecialId],
      })

      // Assert
      expect(updated.isSpecialCategory).toBe(true)
    })

    it('should recalculate to false when removing all SPECIAL natures', async () => {
      // Arrange - Create with SPECIAL nature
      const category = await createDataCategory({
        name: 'Initially Special',
        organizationId: testOrg1.id,
        sensitivity: 'RESTRICTED',
        dataNatureIds: [dataNatureSpecialId],
      })
      expect(category.isSpecialCategory).toBe(true)

      // Act - Update to remove SPECIAL nature
      const updated = await updateDataCategory(category.id, testOrg1.id, {
        dataNatureIds: [dataNatureNonSpecialId],
      })

      // Assert
      expect(updated.isSpecialCategory).toBe(false)
    })

    it('should store justification when manual override differs from calculated', async () => {
      // Arrange & Act - Manual override to false when nature is SPECIAL
      const category = await createDataCategory({
        name: 'Manually Overridden Category',
        organizationId: testOrg1.id,
        sensitivity: 'RESTRICTED',
        isSpecialCategory: false, // Manual override
        dataNatureIds: [dataNatureSpecialId], // Would auto-calculate to true
      })

      // Assert
      expect(category.isSpecialCategory).toBe(false)
      expect(category.metadata).toBeDefined()
      expect(
        (category.metadata as Record<string, unknown>)['specialCategoryOverride']
      ).toBeDefined()
    })

    it('should persist manual override through dataNatureIds updates', async () => {
      // Arrange - Create with manual override
      const category = await createDataCategory({
        name: 'Persistent Override',
        organizationId: testOrg1.id,
        sensitivity: 'RESTRICTED',
        isSpecialCategory: false, // Manual override
        dataNatureIds: [dataNatureSpecialId],
      })
      expect(category.isSpecialCategory).toBe(false)

      // Act - Update dataNatureIds but maintain manual override
      const updated = await updateDataCategory(category.id, testOrg1.id, {
        isSpecialCategory: false, // Maintain override
        dataNatureIds: [dataNatureSpecialId, dataNatureNonSpecialId],
      })

      // Assert - Manual override persists
      expect(updated.isSpecialCategory).toBe(false)
    })
  })

  describe('Query and Filter Functions', () => {
    beforeAll(async () => {
      // Create test categories for filtering
      await createDataCategory({
        name: 'Public Marketing Data',
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
        isSpecialCategory: false,
      })
      await createDataCategory({
        name: 'Internal HR Data',
        organizationId: testOrg1.id,
        sensitivity: 'INTERNAL',
        isSpecialCategory: false,
      })
      await createDataCategory({
        name: 'Confidential Finance Data',
        organizationId: testOrg1.id,
        sensitivity: 'CONFIDENTIAL',
        isSpecialCategory: false,
      })
      await createDataCategory({
        name: 'Restricted Health Data',
        organizationId: testOrg1.id,
        sensitivity: 'RESTRICTED',
        isSpecialCategory: true,
        dataNatureIds: [dataNatureSpecialId],
      })
    })

    it('should filter by sensitivity returns only matching categories', async () => {
      // Act
      const result = await listDataCategories(testOrg1.id, {
        sensitivity: 'CONFIDENTIAL',
      })

      // Assert
      expect(result.items.length).toBeGreaterThanOrEqual(1)
      expect(result.items.every((cat) => cat.sensitivity === 'CONFIDENTIAL')).toBe(true)
    })

    it('should filter by isSpecialCategory=true returns only special categories', async () => {
      // Act
      const result = await getSpecialCategoryDataCategories(testOrg1.id)

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result.every((cat) => cat.isSpecialCategory === true)).toBe(true)
      expect(result.every((cat) => cat.isActive === true)).toBe(true)
    })

    it('should search by name performs case-insensitive partial match', async () => {
      // Act
      const result = await listDataCategories(testOrg1.id, {
        search: 'health',
      })

      // Assert
      expect(result.items.length).toBeGreaterThanOrEqual(1)
      expect(result.items.some((cat) => cat.name.toLowerCase().includes('health'))).toBe(true)
    })

    it('should respect cursor pagination and return correct nextCursor', async () => {
      // Act - Get first page with limit 2
      const page1 = await listDataCategories(testOrg1.id, { limit: 2 })

      // Assert - First page
      expect(page1.items).toHaveLength(2)
      expect(page1.nextCursor).toBeDefined()

      // Act - Get second page using cursor
      const page2 = await listDataCategories(testOrg1.id, {
        limit: 2,
        cursor: page1.nextCursor!,
      })

      // Assert - Second page has different items
      expect(page2.items.length).toBeGreaterThanOrEqual(1)
      expect(page2.items[0]?.id).not.toBe(page1.items[0]?.id)
    })

    it('should apply sensitivity threshold filtering correctly', async () => {
      // Act - Get categories at CONFIDENTIAL or above
      const result = await getDataCategoriesBySensitivity(testOrg1.id, 'CONFIDENTIAL')

      // Assert - Should include CONFIDENTIAL and RESTRICTED, exclude PUBLIC and INTERNAL
      expect(result.length).toBeGreaterThanOrEqual(2)
      expect(
        result.every(
          (cat) => cat.sensitivity === 'CONFIDENTIAL' || cat.sensitivity === 'RESTRICTED'
        )
      ).toBe(true)
    })

    it('should verify sensitivity ordering (PUBLIC < INTERNAL < CONFIDENTIAL < RESTRICTED)', async () => {
      // Act - Test each threshold level
      const publicPlus = await getDataCategoriesBySensitivity(testOrg1.id, 'PUBLIC')
      const internalPlus = await getDataCategoriesBySensitivity(testOrg1.id, 'INTERNAL')
      const confidentialPlus = await getDataCategoriesBySensitivity(testOrg1.id, 'CONFIDENTIAL')
      const restrictedOnly = await getDataCategoriesBySensitivity(testOrg1.id, 'RESTRICTED')

      // Assert - Each level should include progressively fewer categories
      expect(publicPlus.length).toBeGreaterThanOrEqual(internalPlus.length)
      expect(internalPlus.length).toBeGreaterThanOrEqual(confidentialPlus.length)
      expect(confidentialPlus.length).toBeGreaterThanOrEqual(restrictedOnly.length)
    })

    it('should exclude isActive=false categories from specialized queries', async () => {
      // Arrange - Create inactive special category
      const inactive = await createDataCategory({
        name: 'Inactive Special Category',
        organizationId: testOrg1.id,
        sensitivity: 'RESTRICTED',
        isSpecialCategory: true,
        dataNatureIds: [dataNatureSpecialId],
      })

      // Deactivate it
      await updateDataCategory(inactive.id, testOrg1.id, {
        isActive: false,
      })

      // Act
      const specialCategories = await getSpecialCategoryDataCategories(testOrg1.id)

      // Assert - Should not include inactive category
      expect(specialCategories.every((cat) => cat.id !== inactive.id)).toBe(true)
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle empty dataNatureIds array creates category with no linked natures', async () => {
      // Arrange & Act
      const category = await createDataCategory({
        name: 'No Natures Category',
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
        dataNatureIds: [],
      })

      // Assert
      const withRelations = await getDataCategoryById(category.id, testOrg1.id)
      expect(withRelations?.dataNatures).toHaveLength(0)
      expect(withRelations?.isSpecialCategory).toBe(false)
    })

    it('should update with empty dataNatureIds clears all junction entries', async () => {
      // Arrange - Create with natures
      const category = await createDataCategory({
        name: 'Category with Natures',
        organizationId: testOrg1.id,
        sensitivity: 'INTERNAL',
        dataNatureIds: [dataNatureSpecialId, dataNatureNonSpecialId],
      })

      // Verify natures exist
      const before = await getDataCategoryById(category.id, testOrg1.id)
      expect(before?.dataNatures).toHaveLength(2)

      // Act - Clear all natures
      await updateDataCategory(category.id, testOrg1.id, {
        dataNatureIds: [],
      })

      // Assert
      const after = await getDataCategoryById(category.id, testOrg1.id)
      expect(after?.dataNatures).toHaveLength(0)
      expect(after?.isSpecialCategory).toBe(false)
    })

    it('should handle very long name and description correctly', async () => {
      // Arrange
      const longName = 'A'.repeat(500)
      const longDescription = 'B'.repeat(2000)

      // Act
      const category = await createDataCategory({
        name: longName,
        description: longDescription,
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
      })

      // Assert
      expect(category.name).toBe(longName)
      expect(category.description).toBe(longDescription)
    })

    it('should store empty exampleFields array as empty JSON array', async () => {
      // Arrange & Act
      const category = await createDataCategory({
        name: 'Empty Examples',
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
        exampleFields: [],
      })

      // Assert
      expect(category.exampleFields).toEqual([])
    })

    it('should handle null vs undefined for optional fields correctly', async () => {
      // Arrange - Create with values
      const category = await createDataCategory({
        name: 'Test Null Handling',
        description: 'Initial description',
        organizationId: testOrg1.id,
        sensitivity: 'PUBLIC',
        exampleFields: ['field1'],
      })

      // Act - Update with explicit null (clears fields)
      const withNull = await updateDataCategory(category.id, testOrg1.id, {
        description: null,
        exampleFields: null,
      })

      // Assert - Fields cleared
      expect(withNull.description).toBeNull()
      expect(withNull.exampleFields).toBeNull()

      // Act - Update with undefined (doesn't change fields)
      const withUndefined = await updateDataCategory(category.id, testOrg1.id, {
        description: undefined,
        exampleFields: undefined,
        sensitivity: 'INTERNAL', // Change something else
      })

      // Assert - Null values persist (undefined doesn't override)
      expect(withUndefined.description).toBeNull()
      expect(withUndefined.exampleFields).toBeNull()
      expect(withUndefined.sensitivity).toBe('INTERNAL')
    })
  })
})
