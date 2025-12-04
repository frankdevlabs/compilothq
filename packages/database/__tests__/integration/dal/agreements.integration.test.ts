/**
 * Integration tests for Agreement DAL functions
 *
 * Tests core CRUD operations for the tenant-bound Agreement entity.
 * Agreement represents legal agreements (DPAs, JCAs, SCCs, etc.) with external organizations
 * and is scoped to organizations (multi-tenancy).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { ExternalOrganization, Organization } from '../../../src/index'
import {
  createAgreement,
  createExternalOrganization,
  deleteAgreement,
  getAgreementById,
  getAgreementByIdWithOrganization,
  getAgreementsByExternalOrganization,
  getExpiringAgreements,
  listAgreementsByOrganization,
  updateAgreement,
} from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils'

describe('Agreement DAL', () => {
  let testOrg: Organization
  let testOrg2: Organization // For multi-tenancy tests
  let testExternalOrg: ExternalOrganization
  let testExternalOrg2: ExternalOrganization

  beforeAll(async () => {
    // Create test organizations
    const { org: org1 } = await createTestOrganization({
      name: 'Agreement Test Org 1',
      slug: `agreement-test-org-1-${Date.now()}`,
    })
    testOrg = org1

    const { org: org2 } = await createTestOrganization({
      name: 'Agreement Test Org 2',
      slug: `agreement-test-org-2-${Date.now()}`,
    })
    testOrg2 = org2

    // Create test external organizations
    testExternalOrg = await createExternalOrganization({
      organizationId: testOrg.id,
      legalName: `Test Vendor ${Date.now()}`,
      tradingName: 'Test Vendor',
    })

    testExternalOrg2 = await createExternalOrganization({
      organizationId: testOrg2.id,
      legalName: `Test Vendor 2 ${Date.now()}`,
      tradingName: 'Test Vendor 2',
    })
  })

  afterAll(async () => {
    // Clean up test organizations (cascade deletes agreements and external orgs)
    await cleanupTestOrganizations([testOrg.id, testOrg2.id])
  })

  describe('createAgreement', () => {
    it('should create agreement with required fields', async () => {
      const result = await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'DPA',
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.organizationId).toBe(testOrg.id)
      expect(result.externalOrganizationId).toBe(testExternalOrg.id)
      expect(result.type).toBe('DPA')
      expect(result.status).toBe('DRAFT') // Default
      expect(result.signedDate).toBeNull()
      expect(result.expiryDate).toBeNull()
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should create agreement with all optional fields', async () => {
      const signedDate = new Date('2024-01-01')
      const expiryDate = new Date('2026-01-01')

      const result = await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'SCC',
        status: 'ACTIVE',
        signedDate,
        expiryDate,
      })

      expect(result).toBeDefined()
      expect(result.type).toBe('SCC')
      expect(result.status).toBe('ACTIVE')
      expect(result.signedDate).toEqual(signedDate)
      expect(result.expiryDate).toEqual(expiryDate)
    })

    it('should throw error when externalOrganization belongs to different organization', async () => {
      // Try to create agreement using testOrg2's external org for testOrg
      await expect(
        createAgreement({
          organizationId: testOrg.id,
          externalOrganizationId: testExternalOrg2.id,
          type: 'DPA',
        })
      ).rejects.toThrow('ExternalOrganization not found or does not belong to organization')
    })
  })

  describe('getAgreementById', () => {
    it('should retrieve agreement by ID with correct organizationId', async () => {
      // Arrange
      const agreement = await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'JOINT_CONTROLLER_AGREEMENT',
        status: 'ACTIVE',
      })

      // Act
      const result = await getAgreementById(agreement.id, testOrg.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(agreement.id)
      expect(result?.organizationId).toBe(testOrg.id)
      expect(result?.type).toBe('JOINT_CONTROLLER_AGREEMENT')
    })

    it('should return null for non-existent ID', async () => {
      const result = await getAgreementById('non-existent-id', testOrg.id)

      expect(result).toBeNull()
    })

    it('should return null when accessing with wrong organizationId (multi-tenancy)', async () => {
      // Arrange - Create agreement for testOrg
      const agreement = await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'DPA',
      })

      // Act - Try to access with testOrg2's ID
      const result = await getAgreementById(agreement.id, testOrg2.id)

      // Assert - Should return null (access denied)
      expect(result).toBeNull()
    })
  })

  describe('getAgreementByIdWithOrganization', () => {
    it('should retrieve agreement with external organization details', async () => {
      // Arrange
      const agreement = await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'BCR',
      })

      // Act
      const result = await getAgreementByIdWithOrganization(agreement.id, testOrg.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(agreement.id)
      expect(result?.externalOrganization).toBeDefined()
      expect(result?.externalOrganization.id).toBe(testExternalOrg.id)
      expect(result?.externalOrganization.legalName).toBe(testExternalOrg.legalName)
      expect(result?.externalOrganization.tradingName).toBe(testExternalOrg.tradingName)
    })
  })

  describe('listAgreementsByOrganization', () => {
    beforeAll(async () => {
      // Create test agreements
      await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'DPA',
        status: 'ACTIVE',
      })
      await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'SCC',
        status: 'DRAFT',
      })
      await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'DPA',
        status: 'EXPIRED',
      })

      // Create one for testOrg2 for isolation testing
      await createAgreement({
        organizationId: testOrg2.id,
        externalOrganizationId: testExternalOrg2.id,
        type: 'DPA',
        status: 'ACTIVE',
      })
    })

    it('should list agreements for specific organization', async () => {
      const result = await listAgreementsByOrganization(testOrg.id)

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)

      // Verify all results belong to testOrg
      result.forEach((agreement) => {
        expect(agreement.organizationId).toBe(testOrg.id)
        expect(agreement.externalOrganization).toBeDefined()
      })
    })

    it('should not return agreements from other organizations (multi-tenancy)', async () => {
      const org1Result = await listAgreementsByOrganization(testOrg.id)
      const org2Result = await listAgreementsByOrganization(testOrg2.id)

      // Verify no overlap
      const org1Ids = org1Result.map((item) => item.id)
      const org2Ids = org2Result.map((item) => item.id)

      org1Ids.forEach((id) => {
        expect(org2Ids).not.toContain(id)
      })
    })

    it('should filter by type', async () => {
      const result = await listAgreementsByOrganization(testOrg.id, {
        type: 'DPA',
      })

      expect(result.length).toBeGreaterThan(0)
      result.forEach((agreement) => {
        expect(agreement.type).toBe('DPA')
        expect(agreement.organizationId).toBe(testOrg.id)
      })
    })

    it('should filter by status', async () => {
      const result = await listAgreementsByOrganization(testOrg.id, {
        status: 'ACTIVE',
      })

      expect(result.length).toBeGreaterThan(0)
      result.forEach((agreement) => {
        expect(agreement.status).toBe('ACTIVE')
        expect(agreement.organizationId).toBe(testOrg.id)
      })
    })

    it('should filter by externalOrganizationId', async () => {
      const result = await listAgreementsByOrganization(testOrg.id, {
        externalOrganizationId: testExternalOrg.id,
      })

      expect(result.length).toBeGreaterThan(0)
      result.forEach((agreement) => {
        expect(agreement.externalOrganizationId).toBe(testExternalOrg.id)
        expect(agreement.organizationId).toBe(testOrg.id)
      })
    })
  })

  describe('getAgreementsByExternalOrganization', () => {
    it('should retrieve all agreements for external organization', async () => {
      const result = await getAgreementsByExternalOrganization(testExternalOrg.id, testOrg.id)

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)

      result.forEach((agreement) => {
        expect(agreement.externalOrganizationId).toBe(testExternalOrg.id)
        expect(agreement.organizationId).toBe(testOrg.id)
      })
    })

    it('should filter by type', async () => {
      const result = await getAgreementsByExternalOrganization(testExternalOrg.id, testOrg.id, {
        type: 'DPA',
      })

      result.forEach((agreement) => {
        expect(agreement.type).toBe('DPA')
      })
    })

    it('should filter by status', async () => {
      const result = await getAgreementsByExternalOrganization(testExternalOrg.id, testOrg.id, {
        status: 'ACTIVE',
      })

      result.forEach((agreement) => {
        expect(agreement.status).toBe('ACTIVE')
      })
    })
  })

  describe('getExpiringAgreements', () => {
    beforeAll(async () => {
      // Create agreements expiring soon
      const now = new Date()
      const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
      const inSixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      const pastExpiry = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

      // Expiring in 10 days (should be included)
      await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'DPA',
        status: 'ACTIVE',
        expiryDate: inTenDays,
      })

      // Expiring in 60 days (should not be included with default threshold)
      await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'SCC',
        status: 'ACTIVE',
        expiryDate: inSixtyDays,
      })

      // Already expired (should not be included)
      await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'JOINT_CONTROLLER_AGREEMENT',
        status: 'ACTIVE',
        expiryDate: pastExpiry,
      })
    })

    it('should return agreements expiring within default threshold (30 days)', async () => {
      const result = await getExpiringAgreements(testOrg.id)

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)

      // Should only include agreements expiring in next 30 days, not past or too far future
      result.forEach((agreement) => {
        expect(agreement.organizationId).toBe(testOrg.id)
        expect(agreement.status).toBe('ACTIVE')
        expect(agreement.expiryDate).not.toBeNull()
        expect(agreement.externalOrganization).toBeDefined()

        // Expiry date should be in the future but within threshold
        const now = new Date()
        const expiryDate = agreement.expiryDate!
        expect(expiryDate.getTime()).toBeGreaterThan(now.getTime())
        expect(expiryDate.getTime()).toBeLessThanOrEqual(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      })
    })

    it('should return agreements expiring within custom threshold (90 days)', async () => {
      const result = await getExpiringAgreements(testOrg.id, 90)

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)

      // Should include both 10-day and 60-day expiring agreements
      const types = result.map((a) => a.type)
      expect(types).toContain('DPA') // 10 days
      expect(types).toContain('SCC') // 60 days
    })

    it('should only return agreements for specific organization (multi-tenancy)', async () => {
      const org1Result = await getExpiringAgreements(testOrg.id)
      const org2Result = await getExpiringAgreements(testOrg2.id)

      org1Result.forEach((agreement) => {
        expect(agreement.organizationId).toBe(testOrg.id)
      })

      org2Result.forEach((agreement) => {
        expect(agreement.organizationId).toBe(testOrg2.id)
      })
    })
  })

  describe('updateAgreement', () => {
    it('should update agreement fields', async () => {
      // Arrange
      const agreement = await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'DPA',
        status: 'DRAFT',
      })

      // Act
      const updated = await updateAgreement(agreement.id, testOrg.id, {
        status: 'ACTIVE',
        signedDate: new Date('2024-01-15'),
      })

      // Assert
      expect(updated.id).toBe(agreement.id)
      expect(updated.organizationId).toBe(testOrg.id)
      expect(updated.status).toBe('ACTIVE')
      expect(updated.signedDate).toEqual(new Date('2024-01-15'))
      expect(updated.type).toBe('DPA') // Unchanged
    })

    it('should throw error when updating with wrong organizationId (multi-tenancy)', async () => {
      // Arrange - Create agreement for testOrg
      const agreement = await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'DPA',
      })

      // Act & Assert - Try to update with testOrg2's ID
      await expect(
        updateAgreement(agreement.id, testOrg2.id, {
          status: 'TERMINATED',
        })
      ).rejects.toThrow('Agreement not found or does not belong to organization')
    })
  })

  describe('deleteAgreement', () => {
    it('should delete agreement', async () => {
      // Arrange
      const agreement = await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'NDA',
      })

      // Act
      const deleted = await deleteAgreement(agreement.id, testOrg.id)

      // Assert
      expect(deleted.id).toBe(agreement.id)

      // Verify deletion
      const found = await getAgreementById(agreement.id, testOrg.id)
      expect(found).toBeNull()
    })

    it('should throw error when deleting with wrong organizationId (multi-tenancy)', async () => {
      // Arrange - Create agreement for testOrg
      const agreement = await createAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: testExternalOrg.id,
        type: 'DPA',
      })

      // Act & Assert - Try to delete with testOrg2's ID
      await expect(deleteAgreement(agreement.id, testOrg2.id)).rejects.toThrow(
        'Agreement not found or does not belong to organization'
      )

      // Verify it still exists
      const found = await getAgreementById(agreement.id, testOrg.id)
      expect(found).not.toBeNull()
    })
  })
})
