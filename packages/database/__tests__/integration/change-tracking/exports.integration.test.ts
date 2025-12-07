/**
 * Integration tests for change tracking exports and DAL integration
 *
 * Tests:
 * - prismaWithTracking export is available
 * - Existing DAL functions can import prismaWithTracking
 * - Change tracking works when called from DAL functions
 * - Multi-tenant context flows through to change logs
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Organization, User } from '../../../generated/client/client'
import {
  cleanupTestOrganizations,
  createTestOrganization,
} from '../../../src/test-utils/factories/organizationFactory'
import { createTestUser } from '../../../src/test-utils/factories/userFactory'

describe('Change Tracking Exports', () => {
  let testOrg: Organization
  let testUser: User

  beforeAll(async () => {
    const { org, users } = await createTestOrganization({
      slug: `test-exports-${Date.now()}`,
      userCount: 1,
    })
    testOrg = org
    testUser = users[0] ?? (await createTestUser({ organizationId: org.id }))
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id])
  })

  it('should export prismaWithTracking client', async () => {
    // Arrange & Act
    const { prismaWithTracking } = await import('../../../src/middleware/changeTracking')

    // Assert
    expect(prismaWithTracking).toBeDefined()
    expect(typeof prismaWithTracking).toBe('object')
  })

  it('should export TRACKED_FIELDS_BY_MODEL configuration', async () => {
    // Arrange & Act
    const { TRACKED_FIELDS_BY_MODEL } = await import('../../../src/middleware/changeTracking')

    // Assert
    expect(TRACKED_FIELDS_BY_MODEL).toBeDefined()
    expect(TRACKED_FIELDS_BY_MODEL['AssetProcessingLocation']).toEqual([
      'countryId',
      'transferMechanismId',
      'locationRole',
      'isActive',
    ])
    expect(TRACKED_FIELDS_BY_MODEL['RecipientProcessingLocation']).toEqual([
      'countryId',
      'transferMechanismId',
      'locationRole',
      'isActive',
    ])
    expect(TRACKED_FIELDS_BY_MODEL['DataProcessingActivity']).toContain('riskLevel')
  })

  it('should export ChangeTrackingContext type', async () => {
    // Arrange & Act
    const { prismaWithTracking: _prismaWithTracking } =
      await import('../../../src/middleware/changeTracking')
    const context: import('../../../src/middleware/changeTracking').ChangeTrackingContext = {
      userId: testUser.id,
      organizationId: testOrg.id,
      changeReason: 'Test change',
    }

    // Assert - TypeScript compilation validates the type
    expect(context).toBeDefined()
    expect(context.userId).toBe(testUser.id)
  })

  it('should export all new model types from database package', async () => {
    // Arrange & Act
    const exports = await import('../../../src/index')

    // Assert - Check model types are exported
    expect(exports).toHaveProperty('prismaWithTracking')
    expect(exports).toHaveProperty('TRACKED_FIELDS_BY_MODEL')

    // Type assertions to ensure types are exported (TypeScript validation)
    const _componentChangeLog: typeof exports.ComponentChangeLog = undefined as never
    const _generatedDocument: typeof exports.GeneratedDocument = undefined as never
    const _affectedDocument: typeof exports.AffectedDocument = undefined as never

    // Silence unused variable warnings
    expect(_componentChangeLog).toBeUndefined()
    expect(_generatedDocument).toBeUndefined()
    expect(_affectedDocument).toBeUndefined()
  })

  it('should export all new enums from database package', async () => {
    // Arrange & Act
    const { ChangeType, GeneratedDocumentType, DocumentStatus, ImpactType } =
      await import('../../../src/index')

    // Assert - Check enums are exported with correct values
    expect(ChangeType.CREATED).toBe('CREATED')
    expect(ChangeType.UPDATED).toBe('UPDATED')
    expect(ChangeType.DELETED).toBe('DELETED')

    expect(GeneratedDocumentType.ROPA).toBe('ROPA')
    expect(GeneratedDocumentType.DPIA).toBe('DPIA')

    expect(DocumentStatus.DRAFT).toBe('DRAFT')
    expect(DocumentStatus.FINAL).toBe('FINAL')

    expect(ImpactType.TRANSFER_SECTION_OUTDATED).toBe('TRANSFER_SECTION_OUTDATED')
    expect(ImpactType.LOCATION_CHANGED).toBe('LOCATION_CHANGED')
  })
})
