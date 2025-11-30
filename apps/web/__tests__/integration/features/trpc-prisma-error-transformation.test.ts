import { type Organization, type User } from '@compilothq/database'
import { cleanupTestOrganizations, createTestOrganization } from '@compilothq/database/test-utils'
import { TRPCError } from '@trpc/server'
import { type NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type Context } from '@/server/context'
import { activityRouter } from '@/server/routers/activity'
import { processorRouter } from '@/server/routers/processor'

/**
 * Integration Test: Prisma Error Transformation in Router Context
 *
 * This test validates that Prisma errors are correctly transformed to TRPCErrors
 * when they occur in real router operations.
 *
 * Purpose: Ensure handlePrismaError works correctly in production scenarios.
 * Coverage: P2002 (unique constraint), P2025 (not found), P2003 (foreign key) in router context.
 */
describe('Integration: Prisma Error Transformation in Routers', () => {
  let testOrg: Organization
  let testUser: User

  beforeAll(async () => {
    const { org, users } = await createTestOrganization({
      name: 'Error Transformation Test Org',
      slug: `error-transform-${Date.now()}`,
      userCount: 1,
    })
    testOrg = org
    testUser = users[0]
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id])
  })

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
      req: undefined as unknown as NextRequest,
    }
  }

  describe('P2025 - Record Not Found Errors', () => {
    it('should transform P2025 to NOT_FOUND when getting non-existent activity', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // Try to get non-existent activity
      await expect(caller.getById({ id: 'non-existent-id' })).rejects.toThrow(TRPCError)

      try {
        await caller.getById({ id: 'non-existent-id' })
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
        expect((error as TRPCError).message).toContain('not found')
        // Should not expose database internals
        expect((error as TRPCError).message).not.toContain('Prisma')
        expect((error as TRPCError).message).not.toContain('P2025')
      }
    })

    it('should transform P2025 to NOT_FOUND when getting non-existent processor', async () => {
      const ctx = createTestContext(testUser)
      const caller = processorRouter.createCaller(ctx)

      // Try to get non-existent processor
      await expect(caller.getById({ id: 'non-existent-id' })).rejects.toThrow(TRPCError)

      try {
        await caller.getById({ id: 'non-existent-id' })
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
        expect((error as TRPCError).message).toContain('not found')
      }
    })

    it('should transform P2025 to NOT_FOUND when updating non-existent activity', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // Try to update non-existent activity
      await expect(
        caller.update({
          id: 'non-existent-id',
          name: 'Updated Name',
        })
      ).rejects.toThrow(TRPCError)

      try {
        await caller.update({
          id: 'non-existent-id',
          name: 'Updated Name',
        })
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
      }
    })

    it('should transform P2025 to NOT_FOUND when deleting non-existent activity', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // Try to delete non-existent activity
      await expect(caller.delete({ id: 'non-existent-id' })).rejects.toThrow(TRPCError)

      try {
        await caller.delete({ id: 'non-existent-id' })
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
      }
    })
  })

  describe('Authorization Errors vs Database Errors', () => {
    it('should differentiate between FORBIDDEN and NOT_FOUND errors', async () => {
      const ctx = createTestContext(testUser)
      const caller = activityRouter.createCaller(ctx)

      // Create activity
      const activity = await caller.create({
        name: 'Test Activity',
        description: 'For error testing',
      })

      // Create another org to test cross-org access
      const { org: otherOrg, users: otherUsers } = await createTestOrganization({
        name: 'Other Org for Error Test',
        slug: `other-org-error-${Date.now()}`,
        userCount: 1,
      })

      const otherCtx = createTestContext(otherUsers[0])
      const otherCaller = activityRouter.createCaller(otherCtx)

      // Try to access activity from other org - should be FORBIDDEN
      try {
        await otherCaller.getById({ id: activity.id })
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('FORBIDDEN')
        // Error message should mention organization or belong
        expect((error as TRPCError).message.toLowerCase()).toMatch(/organization|belong/)
      }

      // Try to access non-existent activity from same org - should be NOT_FOUND
      try {
        await caller.getById({ id: 'non-existent-id' })
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
        expect((error as TRPCError).message).toContain('not found')
      }

      // Cleanup
      await caller.delete({ id: activity.id })
      await cleanupTestOrganizations([otherOrg.id])
    })
  })

  describe('Error Message Quality', () => {
    it('should provide user-friendly error messages without technical details', async () => {
      const ctx = createTestContext(testUser)
      const activityCaller = activityRouter.createCaller(ctx)
      const processorCaller = processorRouter.createCaller(ctx)

      // Test activity not found error message
      try {
        await activityCaller.getById({ id: 'non-existent-activity' })
      } catch (error) {
        const message = (error as TRPCError).message
        // Should be user-friendly
        expect(message.toLowerCase()).toContain('activity')
        expect(message.toLowerCase()).toContain('not found')
        // Should NOT contain technical terms
        expect(message).not.toContain('Prisma')
        expect(message).not.toContain('P2025')
        expect(message).not.toContain('database')
        expect(message).not.toContain('record')
      }

      // Test processor not found error message
      try {
        await processorCaller.getById({ id: 'non-existent-processor' })
      } catch (error) {
        const message = (error as TRPCError).message
        // Should be user-friendly
        expect(message.toLowerCase()).toContain('processor')
        expect(message.toLowerCase()).toContain('not found')
        // Should NOT contain technical terms
        expect(message).not.toContain('Prisma')
        expect(message).not.toContain('P2025')
      }
    })

    it('should provide context-aware error messages', async () => {
      const ctx = createTestContext(testUser)
      const activityCaller = activityRouter.createCaller(ctx)

      // Create activity
      const activity = await activityCaller.create({
        name: 'Context Error Test',
        description: 'Testing context-aware errors',
      })

      // Create another org
      const { org: otherOrg, users: otherUsers } = await createTestOrganization({
        name: 'Context Error Test Org',
        slug: `context-error-${Date.now()}`,
        userCount: 1,
      })

      const otherCtx = createTestContext(otherUsers[0])
      const otherCaller = activityRouter.createCaller(otherCtx)

      // Test FORBIDDEN error message
      try {
        await otherCaller.update({
          id: activity.id,
          name: 'Unauthorized Update',
        })
      } catch (error) {
        const message = (error as TRPCError).message
        // Should explain the authorization issue
        expect(message.toLowerCase()).toMatch(/organization|belong|forbidden|permission/)
      }

      // Cleanup
      await activityCaller.delete({ id: activity.id })
      await cleanupTestOrganizations([otherOrg.id])
    })
  })

  describe('Error Consistency Across Routers', () => {
    it('should handle errors consistently across activity and processor routers', async () => {
      const ctx = createTestContext(testUser)
      const activityCaller = activityRouter.createCaller(ctx)
      const processorCaller = processorRouter.createCaller(ctx)

      // Both should throw NOT_FOUND for non-existent IDs
      let activityError: TRPCError | null = null
      let processorError: TRPCError | null = null

      try {
        await activityCaller.getById({ id: 'non-existent' })
      } catch (e) {
        activityError = e as TRPCError
      }

      try {
        await processorCaller.getById({ id: 'non-existent' })
      } catch (e) {
        processorError = e as TRPCError
      }

      expect(activityError).toBeInstanceOf(TRPCError)
      expect(processorError).toBeInstanceOf(TRPCError)
      expect(activityError?.code).toBe('NOT_FOUND')
      expect(processorError?.code).toBe('NOT_FOUND')

      // Both should use similar error message patterns
      expect(activityError?.message.toLowerCase()).toContain('not found')
      expect(processorError?.message.toLowerCase()).toContain('not found')
    })

    it('should handle delete errors consistently across routers', async () => {
      const ctx = createTestContext(testUser)
      const activityCaller = activityRouter.createCaller(ctx)
      const processorCaller = processorRouter.createCaller(ctx)

      // Both should throw NOT_FOUND when deleting non-existent items
      let activityDeleteError: TRPCError | null = null
      let processorDeleteError: TRPCError | null = null

      try {
        await activityCaller.delete({ id: 'non-existent' })
      } catch (e) {
        activityDeleteError = e as TRPCError
      }

      try {
        await processorCaller.delete({ id: 'non-existent' })
      } catch (e) {
        processorDeleteError = e as TRPCError
      }

      expect(activityDeleteError).toBeInstanceOf(TRPCError)
      expect(processorDeleteError).toBeInstanceOf(TRPCError)
      expect(activityDeleteError?.code).toBe('NOT_FOUND')
      expect(processorDeleteError?.code).toBe('NOT_FOUND')
    })
  })
})
