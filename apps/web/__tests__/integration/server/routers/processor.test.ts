import { type Organization, type User } from '@compilothq/database'
import { cleanupTestOrganizations, createTestOrganization } from '@compilothq/database/test-utils'
import { TRPCError } from '@trpc/server'
import type { Session } from 'next-auth'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type Context } from '@/server/context'
import { processorRouter } from '@/server/routers/processor'

describe('Processor Router', () => {
  let testOrg: Organization
  let testUser: User
  let otherOrg: Organization
  let otherUser: User

  beforeAll(async () => {
    // Create two test organizations for multi-tenancy testing
    const timestamp = Date.now()
    const org1 = await createTestOrganization({
      name: 'Test Org 1',
      slug: `test-org-1-${timestamp}-proc`,
      userCount: 1, // Create at least one user
    })
    testOrg = org1.org
    testUser = org1.users[0]

    // Add small delay to ensure unique timestamp
    await new Promise((resolve) => setTimeout(resolve, 10))

    const org2 = await createTestOrganization({
      name: 'Test Org 2',
      slug: `test-org-2-${Date.now()}-proc`,
      userCount: 1, // Create at least one user
    })
    otherOrg = org2.org
    otherUser = org2.users[0]
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id, otherOrg.id])
  })

  // Helper function to create test context with NextAuth session structure
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
      req: undefined as unknown, // Not needed for server-side tests
    }
  }

  describe('list', () => {
    it('should return paginated results with cursor', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      // Create multiple processors
      await caller.create({
        name: 'Processor 1',
        type: 'PROCESSOR',
        description: 'Test processor 1',
      })
      await caller.create({
        name: 'Processor 2',
        type: 'SUB_PROCESSOR',
        description: 'Test processor 2',
      })
      await caller.create({
        name: 'Processor 3',
        type: 'JOINT_CONTROLLER',
        description: 'Test processor 3',
      })

      // Get first page with limit 2
      const firstPage = await caller.list({ limit: 2 })

      expect(firstPage.items.length).toBeLessThanOrEqual(2)
      expect(firstPage.items.every((p) => p.organizationId === testOrg.id)).toBe(true)

      // If there's a next cursor, fetch next page
      if (firstPage.nextCursor) {
        const secondPage = await caller.list({ limit: 2, cursor: firstPage.nextCursor })
        expect(secondPage.items.length).toBeGreaterThan(0)
        // Ensure no overlap
        const firstIds = firstPage.items.map((p) => p.id)
        const secondIds = secondPage.items.map((p) => p.id)
        expect(firstIds.some((id) => secondIds.includes(id))).toBe(false)
      }
    })

    it('should respect limit parameter', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      // Create processors
      await caller.create({
        name: 'Processor A',
        type: 'PROCESSOR',
      })
      await caller.create({
        name: 'Processor B',
        type: 'PROCESSOR',
      })
      await caller.create({
        name: 'Processor C',
        type: 'PROCESSOR',
      })

      // List with limit
      const result = await caller.list({ limit: 2 })

      expect(result.items.length).toBeLessThanOrEqual(2)
    })

    it('should filter processors by type', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      // Create processors of different types
      await caller.create({
        name: 'Data Processor',
        type: 'PROCESSOR',
      })
      await caller.create({
        name: 'Sub Processor',
        type: 'SUB_PROCESSOR',
      })

      // Filter by type
      const dataProcessors = await caller.list({ type: 'PROCESSOR' })

      expect(dataProcessors.items.length).toBeGreaterThan(0)
      expect(dataProcessors.items.every((p) => p.type === 'PROCESSOR')).toBe(true)
    })

    it('should filter processors by isActive status', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      // Create active and inactive processors
      const active = await caller.create({
        name: 'Active Processor',
        type: 'PROCESSOR',
        isActive: true,
      })
      await caller.update({
        id: active.id,
        isActive: false,
      })

      // Filter by isActive
      const inactiveProcessors = await caller.list({ isActive: false })

      expect(inactiveProcessors.items.some((p) => p.id === active.id)).toBe(true)
      expect(inactiveProcessors.items.every((p) => p.isActive === false)).toBe(true)
    })
  })

  describe('getById', () => {
    it('should return processor with proper data', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      // Create a processor
      const created = await caller.create({
        name: 'Test Processor',
        type: 'PROCESSOR',
        description: 'Test description',
        isActive: true,
      })

      // Get the processor by ID
      const processor = await caller.getById({ id: created.id })

      expect(processor).toBeDefined()
      expect(processor.id).toBe(created.id)
      expect(processor.name).toBe('Test Processor')
      expect(processor.type).toBe('PROCESSOR')
      expect(processor.description).toBe('Test description')
      expect(processor.isActive).toBe(true)
      expect(processor.organizationId).toBe(testOrg.id)
    })

    it('should throw NOT_FOUND if processor does not exist', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      await expect(caller.getById({ id: 'non-existent-id' })).rejects.toThrow(TRPCError)
      await expect(caller.getById({ id: 'non-existent-id' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should throw NOT_FOUND if processor belongs to different organization', async () => {
      // Create processor for testOrg
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)
      const created = await caller.create({
        name: 'Test Processor',
        type: 'PROCESSOR',
      })

      // Try to access it from otherOrg
      const otherCtx = createTestContext(otherUser)
      const otherCaller = processorRouter.createCaller(otherCtx)

      await expect(otherCaller.getById({ id: created.id })).rejects.toThrow(TRPCError)
      await expect(otherCaller.getById({ id: created.id })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })

  describe('create', () => {
    it('should create processor with validation', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      const processor = await caller.create({
        name: 'New Processor',
        type: 'SERVICE_PROVIDER',
        description: 'This is a new processor',
        isActive: true,
      })

      expect(processor).toBeDefined()
      expect(processor.id).toBeDefined()
      expect(processor.name).toBe('New Processor')
      expect(processor.type).toBe('SERVICE_PROVIDER')
      expect(processor.description).toBe('This is a new processor')
      expect(processor.isActive).toBe(true)
      expect(processor.organizationId).toBe(testOrg.id)
      expect(processor.createdAt).toBeInstanceOf(Date)
      expect(processor.updatedAt).toBeInstanceOf(Date)
    })

    it('should create processor with default isActive as true', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      const processor = await caller.create({
        name: 'Default Active Processor',
        type: 'PROCESSOR',
      })

      expect(processor).toBeDefined()
      expect(processor.isActive).toBe(true)
    })

    it('should create processor without optional description', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      const processor = await caller.create({
        name: 'Processor Without Description',
        type: 'SUB_PROCESSOR',
      })

      expect(processor).toBeDefined()
      expect(processor.name).toBe('Processor Without Description')
      expect(processor.description).toBeNull()
    })
  })

  describe('update', () => {
    it('should update processor with proper authorization', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      // Create a processor
      const created = await caller.create({
        name: 'Original Name',
        type: 'PROCESSOR',
        description: 'Original description',
        isActive: true,
      })

      // Update the processor
      const updated = await caller.update({
        id: created.id,
        name: 'Updated Name',
        description: 'Updated description',
        isActive: false,
      })

      expect(updated.id).toBe(created.id)
      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('Updated description')
      expect(updated.isActive).toBe(false)
      expect(updated.organizationId).toBe(testOrg.id)
    })

    it('should throw NOT_FOUND when updating processor from different organization', async () => {
      // Create processor for testOrg
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)
      const created = await caller.create({
        name: 'Test Processor',
        type: 'PROCESSOR',
      })

      // Try to update from otherOrg
      const otherCtx = createTestContext(otherUser)
      const otherCaller = processorRouter.createCaller(otherCtx)

      await expect(
        otherCaller.update({
          id: created.id,
          name: 'Hacked Name',
        })
      ).rejects.toThrow(TRPCError)
      await expect(
        otherCaller.update({
          id: created.id,
          name: 'Hacked Name',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })

  describe('delete', () => {
    it('should delete processor with proper authorization', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      // Create a processor
      const created = await caller.create({
        name: 'Processor to Delete',
        type: 'PROCESSOR',
        description: 'Will be deleted',
      })

      // Delete the processor
      const deleted = await caller.delete({ id: created.id })

      expect(deleted.id).toBe(created.id)

      // Verify it's deleted
      await expect(caller.getById({ id: created.id })).rejects.toThrow(TRPCError)
    })

    it('should throw NOT_FOUND when deleting processor from different organization', async () => {
      // Create processor for testOrg
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)
      const created = await caller.create({
        name: 'Test Processor',
        type: 'PROCESSOR',
      })

      // Try to delete from otherOrg
      const otherCtx = createTestContext(otherUser)
      const otherCaller = processorRouter.createCaller(otherCtx)

      await expect(otherCaller.delete({ id: created.id })).rejects.toThrow(TRPCError)
      await expect(otherCaller.delete({ id: created.id })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })

  describe('multi-tenancy isolation', () => {
    it('should ensure org1 cannot access org2 processors', async () => {
      // Create processor for testOrg
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)
      const testOrgProcessor = await caller.create({
        name: 'Test Org Processor',
        type: 'PROCESSOR',
      })

      // Create processor for otherOrg
      const otherCtx = createTestContext(otherUser)
      const otherCaller = processorRouter.createCaller(otherCtx)
      const otherOrgProcessor = await otherCaller.create({
        name: 'Other Org Processor',
        type: 'PROCESSOR',
      })

      // List processors for testOrg - should NOT include otherOrg processor
      const testOrgProcessors = await caller.list()
      expect(testOrgProcessors.items.every((p) => p.organizationId === testOrg.id)).toBe(true)
      expect(testOrgProcessors.items.find((p) => p.id === otherOrgProcessor.id)).toBeUndefined()

      // List processors for otherOrg - should NOT include testOrg processor
      const otherOrgProcessors = await otherCaller.list()
      expect(otherOrgProcessors.items.every((p) => p.organizationId === otherOrg.id)).toBe(true)
      expect(otherOrgProcessors.items.find((p) => p.id === testOrgProcessor.id)).toBeUndefined()

      // Verify cross-org access is blocked
      await expect(caller.getById({ id: otherOrgProcessor.id })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
      await expect(otherCaller.getById({ id: testOrgProcessor.id })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })
})
