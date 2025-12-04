import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  assessCrossBorderTransfers,
  checkHierarchyHealth,
  createRecipient,
  findOrphanedRecipients,
  findRecipientsMissingAgreements,
  findUnlinkedRecipients,
  getRecipientsByType,
  getRecipientStatistics,
  getThirdCountryRecipients,
} from '../../../src/dal/recipients'
import type {
  AgreementStatus,
  AgreementType,
  Country,
  ExternalOrganization,
  Organization,
} from '../../../src/index'
import { prisma } from '../../../src/index'
import {
  cleanupTestCountries,
  cleanupTestOrganizations,
  createEUCountryFactory,
  createTestOrganization,
  createThirdCountryFactory,
} from '../../../src/test-utils/factories'
import { createTestExternalOrganization } from '../../../src/test-utils/factories/externalOrganizationFactory'

/**
 * Recipients DAL - Advanced Query Patterns Integration Tests
 *
 * Tests advanced recipient query patterns against a real test database.
 * Focuses on:
 * - Type filtering with pagination
 * - Missing agreements detection (complex joins)
 * - Third-country recipient identification
 * - Statistics aggregation
 * - Data quality checks (orphaned, unlinked)
 * - Cross-border transfer assessment
 * - Hierarchy health checks
 *
 * Coverage goals (2-8 focused tests):
 * - Test getRecipientsByType filtering
 * - Test findRecipientsMissingAgreements join logic
 * - Test getThirdCountryRecipients with Country join
 * - Test getRecipientStatistics aggregation
 * - Test findOrphanedRecipients data quality check
 * - Test findUnlinkedRecipients data quality check
 * - Test assessCrossBorderTransfers
 * - Test checkHierarchyHealth
 */
describe('Recipients DAL - Advanced Query Patterns Integration Tests', () => {
  // Shared test organizations
  let org1: Organization
  let org2: Organization
  let externalOrg1: ExternalOrganization // With DPA
  let externalOrg2: ExternalOrganization // Without agreements
  let externalOrg3: ExternalOrganization // Third-country org
  let euCountry: Country
  let thirdCountry: Country

  beforeAll(async () => {
    // Create shared test organizations
    const { org: testOrg1 } = await createTestOrganization({
      slug: 'recipients-advanced-org1',
      userCount: 1,
    })
    const { org: testOrg2 } = await createTestOrganization({
      slug: 'recipients-advanced-org2',
      userCount: 1,
    })

    org1 = testOrg1
    org2 = testOrg2

    // Create test countries using factories (generates unique ISO codes)
    euCountry = await createEUCountryFactory().create({
      name: 'Netherlands (Test)',
    })

    thirdCountry = await createThirdCountryFactory().create({
      name: 'United States (Test)',
    })

    // Create external organizations with different profiles (all for org1)
    externalOrg1 = await createTestExternalOrganization({
      organizationId: org1.id,
      legalName: 'AWS Cloud Services Inc.',
      tradingName: 'AWS',
      headquartersCountryId: euCountry.id,
    })

    externalOrg2 = await createTestExternalOrganization({
      organizationId: org1.id,
      legalName: 'Google Ireland Limited',
      tradingName: 'Google',
      headquartersCountryId: euCountry.id,
    })

    externalOrg3 = await createTestExternalOrganization({
      organizationId: org1.id,
      legalName: 'Microsoft Corporation',
      tradingName: 'Microsoft',
      headquartersCountryId: thirdCountry.id,
    })

    // Create DPA for externalOrg1
    await prisma.agreement.create({
      data: {
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        type: 'DPA' as AgreementType,
        status: 'ACTIVE' as AgreementStatus,
        signedDate: new Date(),
      },
    })
  })

  afterAll(async () => {
    // Cleanup shared test data (external orgs cascade-delete with organizations)
    await cleanupTestOrganizations([org1.id, org2.id])
    await cleanupTestCountries([euCountry.id, thirdCountry.id])
  })

  describe('getRecipientsByType', () => {
    it('should filter recipients by type with pagination', async () => {
      // Arrange - Create recipients with different types
      const processor1 = await createRecipient({
        name: 'Processor 1',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const processor2 = await createRecipient({
        name: 'Processor 2',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg2.id,
      })

      await createRecipient({
        name: 'Service Provider',
        type: 'SERVICE_PROVIDER',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act - Filter by PROCESSOR type
      const { items, _nextCursor } = await getRecipientsByType(org1.id, 'PROCESSOR', { limit: 10 })

      // Assert - Should return only PROCESSOR types
      expect(items.length).toBeGreaterThanOrEqual(2)
      expect(items.every((r) => r.type === 'PROCESSOR')).toBe(true)
      expect(items.some((r) => r.id === processor1.id)).toBe(true)
      expect(items.some((r) => r.id === processor2.id)).toBe(true)
    })
  })

  describe('findOrphanedRecipients', () => {
    it('should identify SUB_PROCESSOR types without parent', async () => {
      // Arrange - Create orphaned sub-processor
      const orphanedSubProcessor = await createRecipient({
        name: 'Orphaned Sub-Processor',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: null, // Should have parent but doesn't
      })

      // Create valid sub-processor with parent
      const parent = await createRecipient({
        name: 'Parent Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      await createRecipient({
        name: 'Valid Sub-Processor',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: parent.id,
      })

      // Act
      const orphaned = await findOrphanedRecipients(org1.id)

      // Assert - Should find the orphaned sub-processor
      expect(orphaned.some((r) => r.id === orphanedSubProcessor.id)).toBe(true)
      expect(orphaned.every((r) => r.type === 'SUB_PROCESSOR')).toBe(true)
      expect(orphaned.every((r) => r.parentRecipientId === null)).toBe(true)
    })
  })

  describe('findRecipientsMissingAgreements', () => {
    it('should identify PROCESSOR recipients without required DPA', async () => {
      // Arrange - Create processor without DPA (using externalOrg2 which has no agreements)
      const processorWithoutDPA = await createRecipient({
        name: 'Processor Without DPA',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg2.id,
      })

      // Create processor with DPA (using externalOrg1 which has DPA)
      await createRecipient({
        name: 'Processor With DPA',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act
      const missing = await findRecipientsMissingAgreements(org1.id)

      // Assert - Should find processor without DPA
      const missingProcessor = missing.find((r) => r.id === processorWithoutDPA.id)
      expect(missingProcessor).toBeDefined()
      expect(missingProcessor?.requiredAgreementType).toBe('DPA')
    })

    it('should identify JOINT_CONTROLLER recipients without required JCA', async () => {
      // Arrange - Create joint controller without JCA
      const jointControllerWithoutJCA = await createRecipient({
        name: 'Joint Controller Without JCA',
        type: 'JOINT_CONTROLLER',
        organizationId: org1.id,
        externalOrganizationId: externalOrg2.id,
      })

      // Act
      const missing = await findRecipientsMissingAgreements(org1.id)

      // Assert - Should find joint controller without JCA
      const missingJointController = missing.find((r) => r.id === jointControllerWithoutJCA.id)
      expect(missingJointController).toBeDefined()
      expect(missingJointController?.requiredAgreementType).toBe('JOINT_CONTROLLER_AGREEMENT')
    })
  })

  describe('getThirdCountryRecipients', () => {
    it('should identify recipients with headquarters in third countries', async () => {
      // Arrange - Create recipient with third-country headquarters
      const thirdCountryRecipient = await createRecipient({
        name: 'US-Based Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg3.id, // HQ in US (third country)
      })

      // Create EU-based recipient
      await createRecipient({
        name: 'EU-Based Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id, // HQ in NL (EU)
      })

      // Act
      const thirdCountryRecipients = await getThirdCountryRecipients(org1.id)

      // Assert - Should find third-country recipient
      const foundRecipient = thirdCountryRecipients.find((r) => r.id === thirdCountryRecipient.id)
      expect(foundRecipient).toBeDefined()
      expect(foundRecipient?.country).toBeDefined()
      expect(foundRecipient?.country.id).toBe(thirdCountry.id)
      expect(foundRecipient?.country.name).toBe(thirdCountry.name) // Match the factory-generated name
    })
  })

  describe('getRecipientStatistics', () => {
    it('should return accurate statistics for organization', async () => {
      // Arrange - Create recipients with various profiles
      const processor = await createRecipient({
        name: 'Stat Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const _subProcessor = await createRecipient({
        name: 'Stat Sub-Processor',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg2.id,
        parentRecipientId: processor.id,
      })

      const _internalDept = await createRecipient({
        name: 'Stat Internal Dept',
        type: 'INTERNAL_DEPARTMENT',
        organizationId: org1.id,
      })

      // Act
      const stats = await getRecipientStatistics(org1.id)

      // Assert - Verify statistics structure and values
      expect(stats).toBeDefined()
      expect(stats.totalRecipients).toBeGreaterThanOrEqual(3)
      expect(stats.byType).toBeDefined()
      expect(stats.byType.PROCESSOR).toBeGreaterThanOrEqual(1)
      expect(stats.byType.SUB_PROCESSOR).toBeGreaterThanOrEqual(1)
      expect(stats.byType.INTERNAL_DEPARTMENT).toBeGreaterThanOrEqual(1)
      expect(stats.withParent).toBeGreaterThanOrEqual(1) // subProcessor has parent
      expect(stats.withoutParent).toBeGreaterThanOrEqual(2) // processor and internalDept
      expect(stats.activeRecipients).toBeGreaterThanOrEqual(3)
      expect(stats.inactiveRecipients).toBeGreaterThanOrEqual(0)
    })
  })

  describe('findUnlinkedRecipients', () => {
    it('should identify non-internal recipients without external organization', async () => {
      // Arrange - Create processor without external organization (data quality issue)
      const unlinkedProcessor = await createRecipient({
        name: 'Unlinked Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: null, // Should have external org but doesn't
      })

      // Create internal department without external org (valid)
      await createRecipient({
        name: 'Internal Dept',
        type: 'INTERNAL_DEPARTMENT',
        organizationId: org1.id,
        externalOrganizationId: null, // Valid - internal departments don't need external org
      })

      // Act
      const unlinked = await findUnlinkedRecipients(org1.id)

      // Assert - Should find unlinked processor, not internal department
      expect(unlinked.some((r) => r.id === unlinkedProcessor.id)).toBe(true)
      expect(unlinked.every((r) => r.type !== 'INTERNAL_DEPARTMENT')).toBe(true)
      expect(unlinked.every((r) => r.externalOrganizationId === null)).toBe(true)
    })
  })

  describe('assessCrossBorderTransfers', () => {
    it('should identify all countries in recipient chain', async () => {
      // Arrange - Create chain with different countries
      const euProcessor = await createRecipient({
        name: 'EU Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id, // NL (EU)
      })

      const _usSubProcessor = await createRecipient({
        name: 'US Sub-Processor',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg3.id, // US (third country)
        parentRecipientId: euProcessor.id,
      })

      // Act
      const transfers = await assessCrossBorderTransfers(euProcessor.id, org1.id)

      // Assert - Should identify both countries in chain
      expect(transfers.length).toBeGreaterThanOrEqual(2)
      const countryIds = transfers.map((t) => t.country.id)
      expect(countryIds).toContain(euCountry.id) // Root processor
      expect(countryIds).toContain(thirdCountry.id) // Sub-processor
    })
  })

  describe('checkHierarchyHealth', () => {
    it('should detect multiple hierarchy issues', async () => {
      // Arrange - Create recipients with various issues
      // Issue 1: Orphaned sub-processor
      const orphaned = await createRecipient({
        name: 'Health Check Orphaned',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: null,
      })

      // Issue 2: Unlinked processor
      const unlinked = await createRecipient({
        name: 'Health Check Unlinked',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: null,
      })

      // Create valid processor for comparison
      await createRecipient({
        name: 'Health Check Valid',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act
      const healthReport = await checkHierarchyHealth(org1.id)

      // Assert - Should detect issues
      expect(healthReport).toBeDefined()
      expect(healthReport.orphanedSubProcessors.length).toBeGreaterThanOrEqual(1)
      expect(healthReport.orphanedSubProcessors.some((r) => r.id === orphaned.id)).toBe(true)
      expect(healthReport.unlinkedRecipients.length).toBeGreaterThanOrEqual(1)
      expect(healthReport.unlinkedRecipients.some((r) => r.id === unlinked.id)).toBe(true)
      expect(healthReport.totalIssues).toBeGreaterThanOrEqual(2)
    })
  })
})
