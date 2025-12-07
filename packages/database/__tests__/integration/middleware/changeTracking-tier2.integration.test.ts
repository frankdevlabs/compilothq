import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Organization } from '../../../generated/client/client'
import { prisma } from '../../../src'
import { createPrismaWithTracking } from '../../../src/middleware/changeTracking'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils'

describe('Change Tracking Extension - Tier 2 Models', () => {
  let testOrg: Organization

  beforeAll(async () => {
    const { org } = await createTestOrganization({
      name: `ChangeTrackTier2-${Date.now()}`,
      slug: `change-track-tier2-${Date.now()}`,
      userCount: 1,
    })
    testOrg = org
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id])
  })

  describe('TransferMechanism tracking', () => {
    it('should track TransferMechanism code change', async () => {
      // Create extended client with organizationId context for global models
      const prismaWithTracking = createPrismaWithTracking(prisma, {
        organizationId: testOrg.id,
      })

      // Create a transfer mechanism (TransferMechanism is global, no organizationId)
      const mechanism = await prismaWithTracking.transferMechanism.create({
        data: {
          name: 'Test Mechanism',
          code: `TEST-001-${Date.now()}`,
          description: 'Test description',
          typicalUseCase: 'Testing',
          gdprArticle: 'Article 46',
          category: 'ADEQUACY',
          isDerogation: false,
          requiresAdequacy: true,
          requiresDocumentation: true,
          isActive: true,
        },
      })

      // Update code (tracked field)
      await prismaWithTracking.transferMechanism.update({
        where: { id: mechanism.id },
        data: { code: `TEST-002-${Date.now()}` },
      })

      // Verify change log was created
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'TransferMechanism',
          componentId: mechanism.id,
          fieldChanged: 'code',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')
      expect(changeLog!.oldValue).toBeDefined()
      expect(changeLog!.newValue).toBeDefined()

      // Verify snapshot includes tracked fields
      const oldSnapshot = changeLog!.oldValue as Record<string, unknown>
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(oldSnapshot.code).toContain('TEST-001')
      expect(newSnapshot.code).toContain('TEST-002')
      expect(oldSnapshot).toHaveProperty('gdprArticle')
      expect(oldSnapshot).toHaveProperty('category')
    })

    it('should track TransferMechanism GDPR article change', async () => {
      // Create extended client with organizationId context
      const prismaWithTracking = createPrismaWithTracking(prisma, {
        organizationId: testOrg.id,
      })

      // Create a transfer mechanism
      const mechanism = await prismaWithTracking.transferMechanism.create({
        data: {
          name: 'Article Test',
          code: `ART-TEST-${Date.now()}`,
          description: 'Testing article changes',
          typicalUseCase: 'Testing',
          gdprArticle: 'Article 46',
          category: 'ADEQUACY',
          isDerogation: false,
          requiresAdequacy: true,
          requiresDocumentation: true,
          isActive: true,
        },
      })

      // Update GDPR article (tracked field)
      await prismaWithTracking.transferMechanism.update({
        where: { id: mechanism.id },
        data: { gdprArticle: 'Article 49' },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'TransferMechanism',
          componentId: mechanism.id,
          fieldChanged: 'gdprArticle',
        },
      })

      expect(changeLog).toBeDefined()
      const oldSnapshot = changeLog!.oldValue as Record<string, unknown>
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(oldSnapshot.gdprArticle).toBe('Article 46')
      expect(newSnapshot.gdprArticle).toBe('Article 49')
    })
  })

  describe('DataSubjectCategory tracking', () => {
    it('should track DataSubjectCategory vulnerability flag change', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a data subject category
      const category = await prismaWithTracking.dataSubjectCategory.create({
        data: {
          organizationId: testOrg.id,
          code: `TEST_${Date.now()}`,
          name: 'Test Subjects',
          isVulnerable: false,
          suggestsDPIA: false,
          isActive: true,
        },
      })

      // Update vulnerability flag (tracked field)
      await prismaWithTracking.dataSubjectCategory.update({
        where: { id: category.id },
        data: {
          isVulnerable: true,
          vulnerabilityReason: 'Added children as subjects',
        },
      })

      // Verify change logs created (should have 2 logs - one for each field)
      const changeLogs = await prisma.componentChangeLog.findMany({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataSubjectCategory',
          componentId: category.id,
        },
        orderBy: { changedAt: 'asc' },
      })

      // Should have CREATED + 2 UPDATED logs
      expect(changeLogs.length).toBeGreaterThanOrEqual(2)

      // Find the isVulnerable change log
      const vulnerabilityLog = changeLogs.find((log) => log.fieldChanged === 'isVulnerable')
      expect(vulnerabilityLog).toBeDefined()

      // Verify snapshot includes vulnerability fields
      const newSnapshot = vulnerabilityLog!.newValue as Record<string, unknown>
      expect(newSnapshot.isVulnerable).toBe(true)
      expect(newSnapshot.vulnerabilityReason).toBe('Added children as subjects')
      expect(newSnapshot).toHaveProperty('suggestsDPIA')
    })

    it('should track DataSubjectCategory DPIA suggestion change', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a data subject category
      const category = await prismaWithTracking.dataSubjectCategory.create({
        data: {
          organizationId: testOrg.id,
          code: `TEST_${Date.now()}`,
          name: 'DPIA Test Subjects',
          isVulnerable: false,
          suggestsDPIA: false,
          isActive: true,
        },
      })

      // Update DPIA suggestion (tracked field)
      await prismaWithTracking.dataSubjectCategory.update({
        where: { id: category.id },
        data: { suggestsDPIA: true },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataSubjectCategory',
          componentId: category.id,
          fieldChanged: 'suggestsDPIA',
        },
      })

      expect(changeLog).toBeDefined()
      const oldSnapshot = changeLog!.oldValue as Record<string, unknown>
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(oldSnapshot.suggestsDPIA).toBe(false)
      expect(newSnapshot.suggestsDPIA).toBe(true)
    })
  })

  describe('DataCategory tracking', () => {
    it('should track DataCategory sensitivity change', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a data category
      const category = await prismaWithTracking.dataCategory.create({
        data: {
          organizationId: testOrg.id,
          name: 'Test Data',
          description: 'Testing category',
          sensitivity: 'PUBLIC',
          isSpecialCategory: false,
          isActive: true,
        },
      })

      // Update sensitivity (tracked field)
      await prismaWithTracking.dataCategory.update({
        where: { id: category.id },
        data: { sensitivity: 'RESTRICTED' },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataCategory',
          componentId: category.id,
          fieldChanged: 'sensitivity',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')

      // Verify snapshot includes sensitivity and special category fields
      const oldSnapshot = changeLog!.oldValue as Record<string, unknown>
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(oldSnapshot.sensitivity).toBe('PUBLIC')
      expect(newSnapshot.sensitivity).toBe('RESTRICTED')
      expect(oldSnapshot).toHaveProperty('isSpecialCategory')
      expect(newSnapshot).toHaveProperty('isSpecialCategory')
    })

    it('should track DataCategory special category flag change', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a data category
      const category = await prismaWithTracking.dataCategory.create({
        data: {
          organizationId: testOrg.id,
          name: 'Special Category Test',
          description: 'Testing special category changes',
          sensitivity: 'INTERNAL',
          isSpecialCategory: false,
          isActive: true,
        },
      })

      // Update special category flag (tracked field)
      await prismaWithTracking.dataCategory.update({
        where: { id: category.id },
        data: { isSpecialCategory: true },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataCategory',
          componentId: category.id,
          fieldChanged: 'isSpecialCategory',
        },
      })

      expect(changeLog).toBeDefined()
      const oldSnapshot = changeLog!.oldValue as Record<string, unknown>
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(oldSnapshot.isSpecialCategory).toBe(false)
      expect(newSnapshot.isSpecialCategory).toBe(true)
    })
  })

  describe('Tier 2 soft-delete tracking', () => {
    it('should track isActive flip for TransferMechanism', async () => {
      // Create extended client with organizationId context
      const prismaWithTracking = createPrismaWithTracking(prisma, {
        organizationId: testOrg.id,
      })

      // Create a transfer mechanism
      const mechanism = await prismaWithTracking.transferMechanism.create({
        data: {
          name: 'Soft Delete Test',
          code: `SD-TEST-${Date.now()}`,
          description: 'Testing soft delete',
          typicalUseCase: 'Testing',
          gdprArticle: 'Article 46',
          category: 'ADEQUACY',
          isDerogation: false,
          requiresAdequacy: true,
          requiresDocumentation: true,
          isActive: true,
        },
      })

      // Soft delete (flip isActive from true to false)
      await prismaWithTracking.transferMechanism.update({
        where: { id: mechanism.id },
        data: { isActive: false },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'TransferMechanism',
          componentId: mechanism.id,
          fieldChanged: 'isActive',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')
      const oldSnapshot = changeLog!.oldValue as Record<string, unknown>
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(oldSnapshot.isActive).toBe(true)
      expect(newSnapshot.isActive).toBe(false)
    })

    it('should track isActive flip for DataSubjectCategory', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a data subject category
      const category = await prismaWithTracking.dataSubjectCategory.create({
        data: {
          organizationId: testOrg.id,
          code: `TEST_${Date.now()}`,
          name: 'Deactivation Test',
          isVulnerable: false,
          suggestsDPIA: false,
          isActive: true,
        },
      })

      // Soft delete
      await prismaWithTracking.dataSubjectCategory.update({
        where: { id: category.id },
        data: { isActive: false },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataSubjectCategory',
          componentId: category.id,
          fieldChanged: 'isActive',
        },
      })

      expect(changeLog).toBeDefined()
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(newSnapshot.isActive).toBe(false)
    })

    it('should track isActive flip for DataCategory', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a data category
      const category = await prismaWithTracking.dataCategory.create({
        data: {
          organizationId: testOrg.id,
          name: 'Deactivation Test Data',
          description: 'Testing deactivation',
          sensitivity: 'INTERNAL',
          isSpecialCategory: false,
          isActive: true,
        },
      })

      // Soft delete
      await prismaWithTracking.dataCategory.update({
        where: { id: category.id },
        data: { isActive: false },
      })

      // Verify change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataCategory',
          componentId: category.id,
          fieldChanged: 'isActive',
        },
      })

      expect(changeLog).toBeDefined()
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(newSnapshot.isActive).toBe(false)
    })
  })

  describe('Tier 2 CREATE tracking', () => {
    it('should track TransferMechanism creation', async () => {
      // Create extended client with organizationId context
      const prismaWithTracking = createPrismaWithTracking(prisma, {
        organizationId: testOrg.id,
      })

      // Create a transfer mechanism
      const mechanism = await prismaWithTracking.transferMechanism.create({
        data: {
          name: 'Created Mechanism',
          code: `CREATE-TEST-${Date.now()}`,
          description: 'Testing creation tracking',
          typicalUseCase: 'Testing',
          gdprArticle: 'Article 46',
          category: 'ADEQUACY',
          isDerogation: false,
          requiresAdequacy: true,
          requiresDocumentation: true,
          isActive: true,
        },
      })

      // Verify CREATED change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'TransferMechanism',
          componentId: mechanism.id,
          changeType: 'CREATED',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.fieldChanged).toBeNull()
      expect(changeLog!.oldValue).toBeNull()
      expect(changeLog!.newValue).toBeDefined()

      // Verify snapshot includes all relevant fields
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(newSnapshot.code).toContain('CREATE-TEST')
      expect(newSnapshot.gdprArticle).toBe('Article 46')
      expect(newSnapshot.category).toBe('ADEQUACY')
    })

    it('should track DataSubjectCategory creation', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a data subject category
      const category = await prismaWithTracking.dataSubjectCategory.create({
        data: {
          organizationId: testOrg.id,
          code: `TEST_${Date.now()}`,
          name: 'Created Category',
          isVulnerable: true,
          vulnerabilityReason: 'Children',
          suggestsDPIA: true,
          isActive: true,
        },
      })

      // Verify CREATED change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataSubjectCategory',
          componentId: category.id,
          changeType: 'CREATED',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.oldValue).toBeNull()

      // Verify snapshot includes vulnerability flags
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(newSnapshot.isVulnerable).toBe(true)
      expect(newSnapshot.vulnerabilityReason).toBe('Children')
      expect(newSnapshot.suggestsDPIA).toBe(true)
    })

    it('should track DataCategory creation', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a data category
      const category = await prismaWithTracking.dataCategory.create({
        data: {
          organizationId: testOrg.id,
          name: 'Created Data Category',
          description: 'Testing creation',
          sensitivity: 'RESTRICTED',
          isSpecialCategory: true,
          isActive: true,
        },
      })

      // Verify CREATED change log
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'DataCategory',
          componentId: category.id,
          changeType: 'CREATED',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.oldValue).toBeNull()

      // Verify snapshot includes sensitivity and special category
      const newSnapshot = changeLog!.newValue as Record<string, unknown>
      expect(newSnapshot.sensitivity).toBe('RESTRICTED')
      expect(newSnapshot.isSpecialCategory).toBe(true)
    })
  })
})
