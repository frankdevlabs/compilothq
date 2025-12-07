import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type {
  AffectedDocument,
  ChangeType,
  ComponentChangeLog,
  DocumentStatus,
  GeneratedDocument,
  GeneratedDocumentType,
  ImpactType,
  Organization,
  User,
} from '../../../src/index'
import { prisma } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * Component Change Tracking - Integration Tests (Task 1.1)
 *
 * Tests the ComponentChangeLog, GeneratedDocument, and AffectedDocument models
 * with focus on:
 * - Model creation with required fields
 * - Multi-tenancy isolation (organizationId filtering)
 * - Enum value constraints
 * - Unique constraints
 * - Cascade delete behavior
 *
 * Test Count: 8 focused tests as per Task 1.1 specification
 */
describe('Component Change Tracking - Database Layer Tests', () => {
  let testOrg1: Organization
  let testOrg2: Organization
  let testUser1: User

  beforeAll(async () => {
    // Create test organizations
    const { org: org1, users: users1 } = await createTestOrganization({
      slug: `change-tracking-org1-${Date.now()}`,
      userCount: 1,
    })
    const { org: org2 } = await createTestOrganization({
      slug: `change-tracking-org2-${Date.now()}`,
      userCount: 0,
    })

    testOrg1 = org1
    testOrg2 = org2
    testUser1 = users1[0]!
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg1.id, testOrg2.id])
  })

  // Test 1: ComponentChangeLog creation with required fields
  it('should create ComponentChangeLog with all required fields', async () => {
    // Arrange
    const changeLog = {
      organizationId: testOrg1.id,
      componentType: 'AssetProcessingLocation',
      componentId: 'cuid_asset_123',
      changeType: 'CREATED' as ChangeType,
      fieldChanged: null, // null for CREATED
      oldValue: null, // null for CREATED
      newValue: { countryId: 'NL', locationRole: 'HOSTING' },
      changedByUserId: testUser1.id,
      changeReason: 'Initial setup for EU data hosting',
    }

    // Act
    const created: ComponentChangeLog = await prisma.componentChangeLog.create({
      data: changeLog,
    })

    // Assert
    expect(created).toBeDefined()
    expect(created.id).toBeDefined()
    expect(created.organizationId).toBe(testOrg1.id)
    expect(created.componentType).toBe('AssetProcessingLocation')
    expect(created.componentId).toBe('cuid_asset_123')
    expect(created.changeType).toBe('CREATED')
    expect(created.fieldChanged).toBeNull()
    expect(created.oldValue).toBeNull()
    expect(created.newValue).toEqual({ countryId: 'NL', locationRole: 'HOSTING' })
    expect(created.changedByUserId).toBe(testUser1.id)
    expect(created.changeReason).toBe('Initial setup for EU data hosting')
    expect(created.changedAt).toBeInstanceOf(Date)
  })

  // Test 2: Multi-tenancy isolation for ComponentChangeLog
  it('should enforce multi-tenancy isolation - changes from Org1 not visible to Org2 queries', async () => {
    // Arrange - Create change log for Org1
    const org1ChangeLog: ComponentChangeLog = await prisma.componentChangeLog.create({
      data: {
        organizationId: testOrg1.id,
        componentType: 'RecipientProcessingLocation',
        componentId: 'cuid_recipient_456',
        changeType: 'UPDATED',
        fieldChanged: 'transferMechanismId',
        oldValue: { transferMechanismId: 'OLD_SCC' },
        newValue: { transferMechanismId: 'NEW_DPF' },
      },
    })

    // Act - Try to find with Org2's ID
    const org2Query = await prisma.componentChangeLog.findMany({
      where: { organizationId: testOrg2.id },
    })

    // Assert - Org2 should not see Org1's changes
    expect(org1ChangeLog.organizationId).toBe(testOrg1.id)
    expect(org2Query.length).toBe(0)
  })

  // Test 3: GeneratedDocument minimal schema
  it('should create GeneratedDocument with minimal required fields', async () => {
    // Arrange
    const document = {
      organizationId: testOrg1.id,
      documentType: 'ROPA' as GeneratedDocumentType,
      version: 'v1.0.0',
      dataSnapshot: {
        activities: ['activity1', 'activity2'],
        timestamp: new Date().toISOString(),
      },
      generatedBy: testUser1.id,
      status: 'DRAFT' as DocumentStatus,
    }

    // Act
    const created: GeneratedDocument = await prisma.generatedDocument.create({
      data: document,
    })

    // Assert
    expect(created).toBeDefined()
    expect(created.id).toBeDefined()
    expect(created.organizationId).toBe(testOrg1.id)
    expect(created.documentType).toBe('ROPA')
    expect(created.version).toBe('v1.0.0')
    expect(created.dataSnapshot).toEqual(document.dataSnapshot)
    expect(created.status).toBe('DRAFT') // Default value
    expect(created.generatedBy).toBe(testUser1.id)
    expect(created.generatedAt).toBeInstanceOf(Date)

    // Verify optional fields are null
    expect(created.assessmentId).toBeNull()
    expect(created.dataProcessingActivityId).toBeNull()
    expect(created.wordFileUrl).toBeNull()
    expect(created.pdfFileUrl).toBeNull()
    expect(created.markdownContent).toBeNull()
  })

  // Test 4: AffectedDocument unique constraint
  it('should enforce unique constraint on (generatedDocumentId, componentChangeLogId)', async () => {
    // Arrange - Create prerequisite records
    const changeLog: ComponentChangeLog = await prisma.componentChangeLog.create({
      data: {
        organizationId: testOrg1.id,
        componentType: 'DataProcessingActivity',
        componentId: 'cuid_activity_789',
        changeType: 'UPDATED',
        fieldChanged: 'riskLevel',
        oldValue: { riskLevel: 'LOW' },
        newValue: { riskLevel: 'HIGH' },
      },
    })

    const document: GeneratedDocument = await prisma.generatedDocument.create({
      data: {
        organizationId: testOrg1.id,
        documentType: 'DPIA',
        version: 'v1.0.0',
        dataSnapshot: { riskAssessment: 'high-risk-processing' },
      },
    })

    // Act - Create first AffectedDocument record
    const firstAffectedDoc: AffectedDocument = await prisma.affectedDocument.create({
      data: {
        organizationId: testOrg1.id,
        generatedDocumentId: document.id,
        componentChangeLogId: changeLog.id,
        impactType: 'ACTIVITY_RISK_LEVEL_CHANGED',
        impactDescription: 'Risk level increased to HIGH - DPIA may be required',
      },
    })

    expect(firstAffectedDoc).toBeDefined()

    // Assert - Creating duplicate should fail
    await expect(
      prisma.affectedDocument.create({
        data: {
          organizationId: testOrg1.id,
          generatedDocumentId: document.id,
          componentChangeLogId: changeLog.id,
          impactType: 'ACTIVITY_DPIA_REQUIREMENT_CHANGED',
          impactDescription: 'Duplicate link (should fail)',
        },
      })
    ).rejects.toThrow(/Unique constraint/)
  })

  // Test 5: ChangeType enum value constraints
  it('should accept all valid ChangeType enum values and reject invalid ones', async () => {
    // Act & Assert - Valid values
    const validTypes: ChangeType[] = ['CREATED', 'UPDATED', 'DELETED']

    for (const changeType of validTypes) {
      const created: ComponentChangeLog = await prisma.componentChangeLog.create({
        data: {
          organizationId: testOrg1.id,
          componentType: 'TestModel',
          componentId: `cuid_test_${changeType}`,
          changeType,
          oldValue: changeType === 'CREATED' ? null : { old: 'value' },
          newValue: { new: 'value' },
        },
      })

      expect(created.changeType).toBe(changeType)
    }

    // Assert - Invalid value
    await expect(
      prisma.componentChangeLog.create({
        data: {
          organizationId: testOrg1.id,
          componentType: 'TestModel',
          componentId: 'cuid_invalid',
          // @ts-expect-error - Testing invalid enum value
          changeType: 'INVALID_TYPE',
          newValue: {},
        },
      })
    ).rejects.toThrow()
  })

  // Test 6: GeneratedDocumentType and DocumentStatus enum constraints
  it('should accept all valid document type and status enum values', async () => {
    // Act & Assert - Valid GeneratedDocumentType values
    const validDocTypes: GeneratedDocumentType[] = [
      'ROPA',
      'DPIA',
      'LIA',
      'DPA',
      'PRIVACY_STATEMENT',
      'DTIA',
    ]

    for (const docType of validDocTypes) {
      const created: GeneratedDocument = await prisma.generatedDocument.create({
        data: {
          organizationId: testOrg1.id,
          documentType: docType,
          version: `v1.0.${docType}`,
          dataSnapshot: { type: docType },
        },
      })

      expect(created.documentType).toBe(docType)
    }

    // Act & Assert - Valid DocumentStatus values
    const validStatuses: DocumentStatus[] = ['DRAFT', 'FINAL', 'SUPERSEDED', 'ARCHIVED']

    for (const status of validStatuses) {
      const created: GeneratedDocument = await prisma.generatedDocument.create({
        data: {
          organizationId: testOrg1.id,
          documentType: 'ROPA',
          version: `v1.0.${status}`,
          dataSnapshot: { status },
          status,
        },
      })

      expect(created.status).toBe(status)
    }
  })

  // Test 7: ImpactType enum with 15+ categories
  it('should accept all valid ImpactType enum values', async () => {
    // Arrange - Create single document for all impact types
    const document: GeneratedDocument = await prisma.generatedDocument.create({
      data: {
        organizationId: testOrg1.id,
        documentType: 'DTIA',
        version: 'v1.0.0',
        dataSnapshot: { transfers: ['transfer1'] },
      },
    })

    // Act & Assert - Test all 16 ImpactType values
    const validImpactTypes: ImpactType[] = [
      // Transfer impacts
      'TRANSFER_SECTION_OUTDATED',
      'MECHANISM_SECTION_OUTDATED',
      'LOCATION_CHANGED',
      'LOCATION_ADDED',
      'LOCATION_REMOVED',
      'THIRD_COUNTRY_ADDED',
      'SAFEGUARD_REMOVED',
      // Taxonomy impacts
      'PURPOSE_SECTION_OUTDATED',
      'LEGAL_BASIS_SECTION_OUTDATED',
      'DATA_CATEGORY_SECTION_OUTDATED',
      'DATA_SUBJECT_SECTION_OUTDATED',
      'RECIPIENT_SECTION_OUTDATED',
      // Activity impacts
      'ACTIVITY_RISK_LEVEL_CHANGED',
      'ACTIVITY_DPIA_REQUIREMENT_CHANGED',
      'RETENTION_SECTION_OUTDATED',
      // Generic
      'OTHER_COMPONENT_CHANGED',
    ]

    // Verify all 16 categories are covered
    expect(validImpactTypes.length).toBe(16)

    for (const impactType of validImpactTypes) {
      // Create a separate ComponentChangeLog for each ImpactType to avoid unique constraint violations
      const changeLog: ComponentChangeLog = await prisma.componentChangeLog.create({
        data: {
          organizationId: testOrg1.id,
          componentType: 'TransferMechanism',
          componentId: `cuid_mechanism_${impactType}`,
          changeType: 'UPDATED',
          fieldChanged: 'requiresSupplementaryMeasures',
          oldValue: { requiresSupplementaryMeasures: false },
          newValue: { requiresSupplementaryMeasures: true },
        },
      })

      const created: AffectedDocument = await prisma.affectedDocument.create({
        data: {
          organizationId: testOrg1.id,
          generatedDocumentId: document.id,
          componentChangeLogId: changeLog.id,
          impactType,
          impactDescription: `Impact description for ${impactType}`,
        },
      })

      expect(created.impactType).toBe(impactType)
    }
  })

  // Test 8: Cascade delete behavior
  it('should cascade delete ComponentChangeLog, GeneratedDocument, AffectedDocument when Organization is deleted', async () => {
    // Arrange - Create temporary organization with all change tracking models
    const { org: tempOrg, users: tempUsers } = await createTestOrganization({
      slug: `cascade-test-${Date.now()}`,
      userCount: 1,
    })

    const changeLog: ComponentChangeLog = await prisma.componentChangeLog.create({
      data: {
        organizationId: tempOrg.id,
        componentType: 'Purpose',
        componentId: 'cuid_purpose_cascade',
        changeType: 'DELETED',
        fieldChanged: 'isActive',
        oldValue: { isActive: true },
        newValue: { isActive: false },
        changedByUserId: tempUsers[0]!.id,
      },
    })

    const document: GeneratedDocument = await prisma.generatedDocument.create({
      data: {
        organizationId: tempOrg.id,
        documentType: 'ROPA',
        version: 'v1.0.0',
        dataSnapshot: { purposes: ['purpose1'] },
        generatedBy: tempUsers[0]!.id,
      },
    })

    const affectedDoc: AffectedDocument = await prisma.affectedDocument.create({
      data: {
        organizationId: tempOrg.id,
        generatedDocumentId: document.id,
        componentChangeLogId: changeLog.id,
        impactType: 'PURPOSE_SECTION_OUTDATED',
        impactDescription: 'Purpose was deleted',
        reviewedBy: tempUsers[0]!.id,
      },
    })

    // Verify records exist
    expect(changeLog).toBeDefined()
    expect(document).toBeDefined()
    expect(affectedDoc).toBeDefined()

    // Act - Delete organization
    await prisma.organization.delete({
      where: { id: tempOrg.id },
    })

    // Assert - All change tracking records should be cascade deleted
    const changeLogAfter = await prisma.componentChangeLog.findUnique({
      where: { id: changeLog.id },
    })
    const documentAfter = await prisma.generatedDocument.findUnique({
      where: { id: document.id },
    })
    const affectedDocAfter = await prisma.affectedDocument.findUnique({
      where: { id: affectedDoc.id },
    })

    expect(changeLogAfter).toBeNull()
    expect(documentAfter).toBeNull()
    expect(affectedDocAfter).toBeNull()
  })
})
