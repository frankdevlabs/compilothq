import { type Organization, type User } from '@compilothq/database'
import { cleanupTestOrganizations, createTestOrganization } from '@compilothq/database/test-utils'
import { TRPCError } from '@trpc/server'
import type { Session } from 'next-auth'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type Context } from '@/server/context'
import { activityRouter } from '@/server/routers/activity'

describe('Activity Router', () => {
  let testOrg: Organization
  let testUser: User
  let otherOrg: Organization
  let otherUser: User

  beforeAll(async () => {
    // Create two test organizations for multi-tenancy testing
    const org1 = await createTestOrganization({
      name: 'Test Org 1',
      slug: `test-org-1-${Date.now()}`,
      userCount: 1, // Create at least one user
    })
    testOrg = org1.org
    testUser = org1.users[0]

    const org2 = await createTestOrganization({
      name: 'Test Org 2',
      slug: `test-org-2-${Date.now()}`,
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
    it('should return only activities for current organization', async () => {
      // Create activities for both organizations
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // Create activities for test org
      await caller.create({ name: 'Activity 1', description: 'Test activity 1' })
      await caller.create({ name: 'Activity 2', description: 'Test activity 2' })

      // Create activity for other org
      const otherCtx = createTestContext(otherUser)
      const otherCaller = activityRouter.createCaller(otherCtx)
      await otherCaller.create({ name: 'Other Activity', description: 'Other org activity' })

      // List activities for test org
      const activities = await caller.list()

      expect(activities.length).toBeGreaterThanOrEqual(2)
      expect(activities.every((a) => a.organizationId === testOrg.id)).toBe(true)
      expect(activities.find((a) => a.name === 'Activity 1')).toBeDefined()
      expect(activities.find((a) => a.name === 'Activity 2')).toBeDefined()
      expect(activities.find((a) => a.name === 'Other Activity')).toBeUndefined()
    })

    it('should filter activities by status when provided', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // Create activity with DRAFT status (default)
      await caller.create({ name: 'Draft Activity', description: 'Draft' })

      // List only DRAFT activities
      const draftActivities = await caller.list({ status: 'DRAFT' })

      expect(draftActivities.length).toBeGreaterThan(0)
      expect(draftActivities.every((a) => a.status === 'DRAFT')).toBe(true)
    })

    it('should respect limit parameter', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // List with limit
      const activities = await caller.list({ limit: 1 })

      expect(activities.length).toBeLessThanOrEqual(1)
    })
  })

  describe('getById', () => {
    it('should return activity with proper data', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // Create an activity
      const created = await caller.create({
        name: 'Test Activity for Get',
        description: 'Test description',
      })

      // Get the activity by ID
      const activity = await caller.getById({ id: created.id })

      expect(activity).toBeDefined()
      expect(activity.id).toBe(created.id)
      expect(activity.name).toBe('Test Activity for Get')
      expect(activity.description).toBe('Test description')
      expect(activity.organizationId).toBe(testOrg.id)
    })

    it('should throw NOT_FOUND if activity does not exist', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      await expect(caller.getById({ id: 'non-existent-id' })).rejects.toThrow(TRPCError)
      await expect(caller.getById({ id: 'non-existent-id' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should throw FORBIDDEN if activity belongs to different organization', async () => {
      // Create activity for testOrg
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)
      const created = await caller.create({
        name: 'Test Activity for Org Check',
        description: 'Test',
      })

      // Try to access it from otherOrg
      const otherCtx = createTestContext(otherUser)
      const otherCaller = activityRouter.createCaller(otherCtx)

      await expect(otherCaller.getById({ id: created.id })).rejects.toThrow(TRPCError)
      await expect(otherCaller.getById({ id: created.id })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  describe('create', () => {
    it('should create activity with validation', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      const activity = await caller.create({
        name: 'New Activity',
        description: 'This is a new activity',
      })

      expect(activity).toBeDefined()
      expect(activity.id).toBeDefined()
      expect(activity.name).toBe('New Activity')
      expect(activity.description).toBe('This is a new activity')
      expect(activity.organizationId).toBe(testOrg.id)
      expect(activity.status).toBe('DRAFT')
      expect(activity.createdAt).toBeInstanceOf(Date)
      expect(activity.updatedAt).toBeInstanceOf(Date)
    })

    it('should create activity without optional description', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      const activity = await caller.create({
        name: 'Activity Without Description',
      })

      expect(activity).toBeDefined()
      expect(activity.name).toBe('Activity Without Description')
      expect(activity.description).toBeNull()
    })
  })

  describe('update', () => {
    it('should update activity with proper authorization', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // Create an activity
      const created = await caller.create({
        name: 'Original Name',
        description: 'Original description',
      })

      // Update the activity
      const updated = await caller.update({
        id: created.id,
        name: 'Updated Name',
        description: 'Updated description',
      })

      expect(updated.id).toBe(created.id)
      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('Updated description')
      expect(updated.organizationId).toBe(testOrg.id)
    })

    it('should throw FORBIDDEN when updating activity from different organization', async () => {
      // Create activity for testOrg
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)
      const created = await caller.create({
        name: 'Test Activity',
        description: 'Test',
      })

      // Try to update from otherOrg
      const otherCtx = createTestContext(otherUser)
      const otherCaller = activityRouter.createCaller(otherCtx)

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
        code: 'FORBIDDEN',
      })
    })
  })

  describe('delete', () => {
    it('should delete activity with proper authorization', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // Create an activity
      const created = await caller.create({
        name: 'Activity to Delete',
        description: 'Will be deleted',
      })

      // Delete the activity
      const deleted = await caller.delete({ id: created.id })

      expect(deleted.id).toBe(created.id)

      // Verify it's deleted
      await expect(caller.getById({ id: created.id })).rejects.toThrow(TRPCError)
    })

    it('should throw FORBIDDEN when deleting activity from different organization', async () => {
      // Create activity for testOrg
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)
      const created = await caller.create({
        name: 'Test Activity',
        description: 'Test',
      })

      // Try to delete from otherOrg
      const otherCtx = createTestContext(otherUser)
      const otherCaller = activityRouter.createCaller(otherCtx)

      await expect(otherCaller.delete({ id: created.id })).rejects.toThrow(TRPCError)
      await expect(otherCaller.delete({ id: created.id })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  describe('unauthorized access', () => {
    it('should reject requests without organization membership', async () => {
      // Create a user without organization
      const userWithoutOrg: User = {
        id: 'user-without-org',
        email: 'noorg@example.com',
        name: 'No Org User',
        organizationId: null,
        primaryPersona: null,
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const ctx = createTestContext(userWithoutOrg)
      const caller = activityRouter.createCaller(ctx)

      // All orgProcedure operations should throw FORBIDDEN
      await expect(caller.list()).rejects.toThrow(TRPCError)
      await expect(caller.list()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'Organization membership required',
      })

      await expect(caller.create({ name: 'Test' })).rejects.toThrow(TRPCError)
      await expect(caller.create({ name: 'Test' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })
})
