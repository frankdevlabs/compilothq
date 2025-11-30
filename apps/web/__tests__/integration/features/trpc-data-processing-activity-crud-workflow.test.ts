import { type Organization, type User } from '@compilothq/database'
import { cleanupTestOrganizations, createTestOrganization } from '@compilothq/database/test-utils'
import type { Session } from 'next-auth'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type Context } from '@/server/context'
import { dataProcessingActivityRouter } from '@/server/routers/dataProcessingActivity'

/**
 * Integration Test: Full DataProcessingActivity CRUD Workflow
 *
 * This test validates the complete end-to-end data flow for DataProcessingActivities:
 * Router → DAL → Database → Validation
 *
 * Purpose: Ensure all layers work together correctly for real-world workflows.
 * Coverage: Full lifecycle from creation to deletion with updates.
 */
describe('Integration: DataProcessingActivity CRUD Workflow', () => {
  let testOrg: Organization
  let testUser: User

  beforeAll(async () => {
    const { org, users } = await createTestOrganization({
      name: 'Activity Workflow Test Org',
      slug: `activity-workflow-${Date.now()}`,
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
      req: undefined as unknown,
    }
  }

  it('should execute complete CRUD workflow: create → read → update → delete', async () => {
    const ctx = createTestContext(testUser)
    const caller = dataProcessingActivityRouter.createCaller(ctx)

    // STEP 1: CREATE - Create a new activity
    const created = await caller.create({
      name: 'Initial Activity Name',
      description: 'Initial description for testing',
    })

    expect(created).toBeDefined()
    expect(created.id).toBeDefined()
    expect(created.name).toBe('Initial Activity Name')
    expect(created.description).toBe('Initial description for testing')
    expect(created.status).toBe('DRAFT')
    expect(created.organizationId).toBe(testOrg.id)

    // STEP 2: READ - Retrieve the activity by ID
    const retrieved = await caller.getById({ id: created.id })

    expect(retrieved).toBeDefined()
    expect(retrieved.id).toBe(created.id)
    expect(retrieved.name).toBe('Initial Activity Name')
    expect(retrieved.organizationId).toBe(testOrg.id)

    // STEP 3: UPDATE - Modify the activity
    const updated = await caller.update({
      id: created.id,
      name: 'Updated Activity Name',
      description: 'Updated description after modification',
    })

    expect(updated.id).toBe(created.id)
    expect(updated.name).toBe('Updated Activity Name')
    expect(updated.description).toBe('Updated description after modification')
    expect(updated.organizationId).toBe(testOrg.id)
    expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime())

    // STEP 4: LIST - Verify activity appears in list
    const listResult = await caller.list()
    const activities = listResult.items

    const foundActivity = activities.find((a) => a.id === created.id)
    expect(foundActivity).toBeDefined()
    expect(foundActivity?.name).toBe('Updated Activity Name')

    // STEP 5: DELETE - Remove the activity
    const deleted = await caller.delete({ id: created.id })

    expect(deleted.id).toBe(created.id)

    // STEP 6: VERIFY DELETION - Ensure activity is gone
    await expect(caller.getById({ id: created.id })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })

    // Verify not in list
    const afterDeleteResult = await caller.list()
    const activitiesAfterDelete = afterDeleteResult.items
    const deletedActivity = activitiesAfterDelete.find((a) => a.id === created.id)
    expect(deletedActivity).toBeUndefined()
  })

  it('should handle partial updates correctly', async () => {
    const ctx = createTestContext(testUser)
    const caller = dataProcessingActivityRouter.createCaller(ctx)

    // Create initial activity
    const created = await caller.create({
      name: 'Partial Update Test',
      description: 'Original description',
    })

    // Update only name (description should remain unchanged)
    const updatedName = await caller.update({
      id: created.id,
      name: 'Updated Name Only',
    })

    expect(updatedName.name).toBe('Updated Name Only')
    expect(updatedName.description).toBe('Original description')

    // Update only description (name should remain unchanged)
    const updatedDescription = await caller.update({
      id: created.id,
      description: 'Updated Description Only',
    })

    expect(updatedDescription.name).toBe('Updated Name Only')
    expect(updatedDescription.description).toBe('Updated Description Only')

    // Cleanup
    await caller.delete({ id: created.id })
  })

  it('should validate input data throughout workflow', async () => {
    const ctx = createTestContext(testUser)
    const caller = dataProcessingActivityRouter.createCaller(ctx)

    // Validation on CREATE - empty name should fail
    await expect(
      // @ts-expect-error - Testing invalid input
      caller.create({ name: '' })
    ).rejects.toThrow()

    // Validation on CREATE - missing required name should fail
    await expect(
      // @ts-expect-error - Testing invalid input
      caller.create({ description: 'No name provided' })
    ).rejects.toThrow()

    // Valid creation should succeed
    const created = await caller.create({
      name: 'Valid Activity',
      description: 'With proper validation',
    })

    expect(created).toBeDefined()

    // Cleanup
    await caller.delete({ id: created.id })
  })

  it('should maintain data consistency across operations', async () => {
    const ctx = createTestContext(testUser)
    const caller = dataProcessingActivityRouter.createCaller(ctx)

    // Create activity
    const created = await caller.create({
      name: 'Consistency Test',
      description: 'Testing data consistency',
    })

    const createdTime = created.createdAt

    // Update activity multiple times
    const update1 = await caller.update({
      id: created.id,
      name: 'Update 1',
    })

    const update2 = await caller.update({
      id: created.id,
      name: 'Update 2',
    })

    // Verify timestamps are consistent
    expect(update1.createdAt.getTime()).toBe(createdTime.getTime())
    expect(update2.createdAt.getTime()).toBe(createdTime.getTime())
    expect(update1.updatedAt.getTime()).toBeGreaterThan(createdTime.getTime())
    expect(update2.updatedAt.getTime()).toBeGreaterThan(update1.updatedAt.getTime())

    // Verify organizationId never changes
    expect(update1.organizationId).toBe(testOrg.id)
    expect(update2.organizationId).toBe(testOrg.id)

    // Cleanup
    await caller.delete({ id: created.id })
  })
})
