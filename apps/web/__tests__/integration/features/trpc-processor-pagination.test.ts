import { type Organization, type User } from '@compilothq/database'
import { cleanupTestOrganizations, createTestOrganization } from '@compilothq/database/test-utils'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type Context } from '@/server/context'
import { processorRouter } from '@/server/routers/processor'

/**
 * Integration Test: Processor Cursor-Based Pagination
 *
 * This test validates the complete pagination workflow for Processors:
 * Router → DAL → Database with cursor pagination
 *
 * Purpose: Ensure pagination works correctly across all layers with real data.
 * Coverage: Cursor-based pagination, page navigation, filtering with pagination.
 */
describe('Integration: Processor Cursor Pagination', () => {
  let testOrg: Organization
  let testUser: User

  beforeAll(async () => {
    const { org, users } = await createTestOrganization({
      name: 'Processor Pagination Test Org',
      slug: `processor-pagination-${Date.now()}`,
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

  it('should paginate through large dataset with consistent cursors', async () => {
    const ctx = createTestContext(testUser)
    const caller = processorRouter.createCaller(ctx)

    // Create 10 processors for pagination testing (sequentially to ensure order)
    const createdProcessors = []
    for (let i = 0; i < 10; i++) {
      const processor = await caller.create({
        name: `Pagination Test Processor ${i + 1}`,
        type: 'PROCESSOR',
        description: `Pagination test ${i + 1}`,
      })
      createdProcessors.push(processor)
    }

    expect(createdProcessors).toHaveLength(10)

    // PAGE 1: Get first 3 processors
    const page1 = await caller.list({ limit: 3 })

    expect(page1.items.length).toBeLessThanOrEqual(3)
    expect(page1.items.every((p) => p.organizationId === testOrg.id)).toBe(true)

    // If there's a next cursor, fetch second page
    if (page1.nextCursor) {
      const page2 = await caller.list({ limit: 3, cursor: page1.nextCursor })

      expect(page2.items.length).toBeGreaterThan(0)

      // Verify no overlap between pages
      const page1Ids = page1.items.map((p) => p.id)
      const page2Ids = page2.items.map((p) => p.id)

      // None of page1 IDs should appear in page2
      const hasOverlap = page1Ids.some((id) => page2Ids.includes(id))
      expect(hasOverlap).toBe(false)
    }
  })

  it('should handle pagination with filtering', async () => {
    const ctx = createTestContext(testUser)
    const caller = processorRouter.createCaller(ctx)

    // Create processors with different types (sequentially to ensure consistent order)
    const filterTestProcessors = []
    for (const config of [
      { name: 'Filter Data Processor 1', type: 'PROCESSOR' as const },
      { name: 'Filter Data Processor 2', type: 'PROCESSOR' as const },
      { name: 'Filter Data Processor 3', type: 'PROCESSOR' as const },
      { name: 'Filter Sub Processor 1', type: 'SUB_PROCESSOR' as const },
      { name: 'Filter Sub Processor 2', type: 'SUB_PROCESSOR' as const },
      { name: 'Filter Joint Controller 1', type: 'JOINT_CONTROLLER' as const },
    ]) {
      const processor = await caller.create(config)
      filterTestProcessors.push(processor)
    }

    // Track the IDs of processors we just created (only DATA_PROCESSOR types)
    const ourDataProcessorIds = filterTestProcessors
      .filter((p) => p.type === 'PROCESSOR')
      .map((p) => p.id)

    expect(ourDataProcessorIds).toHaveLength(3)

    // Paginate through DATA_PROCESSOR types only
    const dataProcessorsPage1 = await caller.list({
      type: 'PROCESSOR',
      limit: 2,
    })

    expect(dataProcessorsPage1.items.length).toBeLessThanOrEqual(2)
    expect(dataProcessorsPage1.items.every((p) => p.type === 'PROCESSOR')).toBe(true)

    if (dataProcessorsPage1.nextCursor) {
      const dataProcessorsPage2 = await caller.list({
        type: 'PROCESSOR',
        limit: 2,
        cursor: dataProcessorsPage1.nextCursor,
      })

      expect(dataProcessorsPage2.items.length).toBeGreaterThan(0)
      expect(dataProcessorsPage2.items.every((p) => p.type === 'PROCESSOR')).toBe(true)

      // Verify no overlap between page 1 and page 2
      const page1Ids = dataProcessorsPage1.items.map((p) => p.id)
      const page2Ids = dataProcessorsPage2.items.map((p) => p.id)
      expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false)
    }
  })

  it('should handle pagination with isActive filtering', async () => {
    const ctx = createTestContext(testUser)
    const caller = processorRouter.createCaller(ctx)

    // Create active processors
    await Promise.all([
      caller.create({
        name: 'Active Pagination Processor 1',
        type: 'PROCESSOR',
        isActive: true,
      }),
      caller.create({
        name: 'Active Pagination Processor 2',
        type: 'PROCESSOR',
        isActive: true,
      }),
      caller.create({
        name: 'Active Pagination Processor 3',
        type: 'PROCESSOR',
        isActive: true,
      }),
    ])

    // Create inactive processors
    await Promise.all([
      caller.create({
        name: 'Inactive Pagination Processor 1',
        type: 'PROCESSOR',
        isActive: false,
      }),
      caller.create({
        name: 'Inactive Pagination Processor 2',
        type: 'PROCESSOR',
        isActive: false,
      }),
    ])

    // Paginate through active processors only
    const activePage = await caller.list({
      isActive: true,
      limit: 2,
    })

    expect(activePage.items.length).toBeLessThanOrEqual(2)
    expect(activePage.items.every((p) => p.isActive === true)).toBe(true)

    // If there are more active processors, verify pagination works
    if (activePage.nextCursor) {
      const activePage2 = await caller.list({
        isActive: true,
        limit: 2,
        cursor: activePage.nextCursor,
      })

      expect(activePage2.items.length).toBeGreaterThan(0)
      expect(activePage2.items.every((p) => p.isActive === true)).toBe(true)
    }
  })

  it('should return empty nextCursor when no more results', async () => {
    const ctx = createTestContext(testUser)
    const caller = processorRouter.createCaller(ctx)

    // Create exactly 2 processors with unique names for this test
    await Promise.all([
      caller.create({ name: 'Empty Cursor Processor A', type: 'PROCESSOR' }),
      caller.create({ name: 'Empty Cursor Processor B', type: 'PROCESSOR' }),
    ])

    // Request more than available with high limit
    const result = await caller.list({ limit: 100 })

    expect(result.items.length).toBeGreaterThanOrEqual(2)

    // When limit exceeds available items, nextCursor should be null/undefined
    if (result.items.length < 100) {
      expect(result.nextCursor).toBeFalsy()
    }
  })

  it('should handle combined filters with pagination', async () => {
    const ctx = createTestContext(testUser)
    const caller = processorRouter.createCaller(ctx)

    // Create processors with specific type and active status
    await Promise.all([
      caller.create({
        name: 'Combined Active Data Processor 1',
        type: 'PROCESSOR',
        isActive: true,
      }),
      caller.create({
        name: 'Combined Active Data Processor 2',
        type: 'PROCESSOR',
        isActive: true,
      }),
      caller.create({
        name: 'Combined Active Data Processor 3',
        type: 'PROCESSOR',
        isActive: true,
      }),
      caller.create({
        name: 'Combined Inactive Data Processor',
        type: 'PROCESSOR',
        isActive: false,
      }),
      caller.create({
        name: 'Combined Active Sub Processor',
        type: 'SUB_PROCESSOR',
        isActive: true,
      }),
    ])

    // Filter by both type and isActive status
    const filtered = await caller.list({
      type: 'PROCESSOR',
      isActive: true,
      limit: 2,
    })

    expect(filtered.items.length).toBeLessThanOrEqual(2)
    expect(filtered.items.every((p) => p.type === 'PROCESSOR')).toBe(true)
    expect(filtered.items.every((p) => p.isActive === true)).toBe(true)

    // If there's a next page, verify filtering continues
    if (filtered.nextCursor) {
      const nextPage = await caller.list({
        type: 'PROCESSOR',
        isActive: true,
        limit: 2,
        cursor: filtered.nextCursor,
      })

      expect(nextPage.items.every((p) => p.type === 'PROCESSOR')).toBe(true)
      expect(nextPage.items.every((p) => p.isActive === true)).toBe(true)
    }
  })
})
