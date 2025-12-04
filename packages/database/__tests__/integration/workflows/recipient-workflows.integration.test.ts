/**
 * End-to-End Recipient Workflow Integration Tests
 *
 * These tests verify critical user workflows for the recipient hierarchy feature.
 * They test integration points between DAL functions, validation, and factories.
 *
 * Focus areas:
 * 1. End-to-end processor chain creation with validation
 * 2. Internal department hierarchy creation with validation
 * 3. Missing agreement detection and remediation workflow
 * 4. Third-country transfer assessment workflow
 * 5. Hierarchy health check with multiple violation types
 * 6. Multi-tenant data isolation in complex scenarios
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  assessCrossBorderTransfers,
  checkHierarchyHealth,
  findRecipientsMissingAgreements,
  getDescendantTree,
} from '../../../src/dal/recipients'
import type { Country, Organization } from '../../../src/index'
import {
  cleanupTestAgreements,
  cleanupTestCountries,
  cleanupTestExternalOrganizations,
  cleanupTestOrganizations,
  cleanupTestRecipients,
  createAdequateCountryFactory,
  createEUCountryFactory,
  createTestAgreement,
  createTestExternalOrganization,
  createTestOrganization,
  createTestRecipient,
  createTestRecipientHierarchy,
  createThirdCountryFactory,
} from '../../../src/test-utils/factories'
import {
  validateRecipientData,
  validateRecipientHierarchy,
  validateRequiredAgreements,
} from '../../../src/validation/recipientHierarchyValidation'

describe('Recipient Workflows - End-to-End Integration Tests', () => {
  let org1: Organization
  let org2: Organization
  let euCountry: Country
  let thirdCountry: Country
  let adequateCountry: Country

  beforeAll(async () => {
    // Create test organizations
    const { org: testOrg1 } = await createTestOrganization({
      slug: 'workflow-test-org1',
      userCount: 1,
    })
    const { org: testOrg2 } = await createTestOrganization({
      slug: 'workflow-test-org2',
      userCount: 1,
    })

    org1 = testOrg1
    org2 = testOrg2

    // Create test countries using factories (generates unique ISO codes)
    euCountry = await createEUCountryFactory().create({
      name: 'Netherlands (Test Workflows)',
    })

    thirdCountry = await createThirdCountryFactory().create({
      name: 'United States (Test Workflows)',
    })

    adequateCountry = await createAdequateCountryFactory().create({
      name: 'Canada (Test Workflows)',
    })
  })

  afterAll(async () => {
    await cleanupTestOrganizations([org1.id, org2.id])
    await cleanupTestCountries([euCountry.id, thirdCountry.id, adequateCountry.id])
  })

  describe('Workflow 1: End-to-end processor chain creation with validation', () => {
    it('should create a 4-level processor chain with validation at each step', async () => {
      // Arrange - Create external organizations for the chain
      const processorOrg = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Main Processor Ltd',
        headquartersCountryId: euCountry.id,
      })
      const subProcessor1Org = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Sub-Processor 1 Inc',
        headquartersCountryId: euCountry.id,
      })
      const subProcessor2Org = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Sub-Processor 2 GmbH',
        headquartersCountryId: thirdCountry.id,
      })
      const subProcessor3Org = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Sub-Processor 3 LLC',
        headquartersCountryId: thirdCountry.id,
      })

      // Create DPA for main processor
      const dpa = await createTestAgreement({
        organizationId: org1.id,
        externalOrganizationId: processorOrg.id,
        type: 'DPA',
        status: 'ACTIVE',
      })

      try {
        // Act - Step 1: Create root processor and validate
        const processor = await createTestRecipient(org1.id, {
          name: 'Main Processor',
          type: 'PROCESSOR',
          externalOrganizationId: processorOrg.id,
        })

        const step1DataValidation = validateRecipientData('PROCESSOR', processorOrg.id)
        expect(step1DataValidation.isValid).toBe(true)

        const step1AgreementValidation = await validateRequiredAgreements(processor.id, org1.id)
        expect(step1AgreementValidation.warnings).toHaveLength(0) // Has DPA

        // Act - Step 2: Create first sub-processor
        const subProcessor1 = await createTestRecipient(org1.id, {
          name: 'Sub-Processor Level 1',
          type: 'SUB_PROCESSOR',
          externalOrganizationId: subProcessor1Org.id,
          parentRecipientId: processor.id,
          hierarchyType: 'PROCESSOR_CHAIN',
        })

        const step2HierarchyValidation = await validateRecipientHierarchy(
          subProcessor1.id,
          'SUB_PROCESSOR',
          processor.id,
          org1.id
        )
        expect(step2HierarchyValidation.isValid).toBe(true)

        // Act - Step 3: Create second sub-processor
        const subProcessor2 = await createTestRecipient(org1.id, {
          name: 'Sub-Processor Level 2',
          type: 'SUB_PROCESSOR',
          externalOrganizationId: subProcessor2Org.id,
          parentRecipientId: subProcessor1.id,
          hierarchyType: 'PROCESSOR_CHAIN',
        })

        const step3HierarchyValidation = await validateRecipientHierarchy(
          subProcessor2.id,
          'SUB_PROCESSOR',
          subProcessor1.id,
          org1.id
        )
        expect(step3HierarchyValidation.isValid).toBe(true)

        // Act - Step 4: Create third sub-processor
        const subProcessor3 = await createTestRecipient(org1.id, {
          name: 'Sub-Processor Level 3',
          type: 'SUB_PROCESSOR',
          externalOrganizationId: subProcessor3Org.id,
          parentRecipientId: subProcessor2.id,
          hierarchyType: 'PROCESSOR_CHAIN',
        })

        const step4HierarchyValidation = await validateRecipientHierarchy(
          subProcessor3.id,
          'SUB_PROCESSOR',
          subProcessor2.id,
          org1.id
        )
        expect(step4HierarchyValidation.isValid).toBe(true)

        // Assert - Verify complete chain structure
        const fullTree = await getDescendantTree(processor.id, org1.id, 10)
        expect(fullTree).toHaveLength(3) // 3 sub-processors
        expect(fullTree.find((r) => r.id === subProcessor1.id)?.depth).toBe(1)
        expect(fullTree.find((r) => r.id === subProcessor2.id)?.depth).toBe(2)
        expect(fullTree.find((r) => r.id === subProcessor3.id)?.depth).toBe(3)

        // Assert - Verify cross-border transfers detected
        const transferAssessment = await assessCrossBorderTransfers(processor.id, org1.id)
        const uniqueCountries = new Set(transferAssessment.map((t) => t.country.id))
        expect(uniqueCountries.has(euCountry.id)).toBe(true)
        expect(uniqueCountries.has(thirdCountry.id)).toBe(true)

        // Cleanup
        await cleanupTestRecipients([
          processor.id,
          subProcessor1.id,
          subProcessor2.id,
          subProcessor3.id,
        ])
        await cleanupTestAgreements([dpa.id])
        await cleanupTestExternalOrganizations([
          processorOrg.id,
          subProcessor1Org.id,
          subProcessor2Org.id,
          subProcessor3Org.id,
        ])
      } catch (error) {
        // Cleanup on error
        await cleanupTestAgreements([dpa.id])
        await cleanupTestExternalOrganizations([
          processorOrg.id,
          subProcessor1Org.id,
          subProcessor2Org.id,
          subProcessor3Org.id,
        ])
        throw error
      }
    })

    it('should prevent creation of processor chain exceeding max depth of 5', async () => {
      // Arrange - Create 6-level chain (should fail at level 6)
      const externalOrg = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Chain Depth Test Org',
      })

      try {
        const chain = await createTestRecipientHierarchy(org1.id, 7, 'PROCESSOR_CHAIN', {
          externalOrganizationId: externalOrg.id,
        })

        // Act - Try to validate the deepest recipient (level 6, depth 6 from root)
        const deepestRecipient = chain[6] // Index 6 = 7th recipient
        const validationResult = await validateRecipientHierarchy(
          deepestRecipient.id,
          'SUB_PROCESSOR',
          chain[5].id,
          org1.id
        )

        // Assert - Should fail due to max depth exceeded
        expect(validationResult.isValid).toBe(false)
        expect(validationResult.errors.some((e) => e.includes('exceeds maximum depth'))).toBe(true)

        // Cleanup
        await cleanupTestRecipients(chain.map((r) => r.id))
        await cleanupTestExternalOrganizations([externalOrg.id])
      } catch (error) {
        await cleanupTestExternalOrganizations([externalOrg.id])
        throw error
      }
    })
  })

  describe('Workflow 2: Internal department hierarchy with validation', () => {
    it('should create a 5-level internal department structure with no external organizations', async () => {
      // Act - Create internal department hierarchy using factory
      const departments = await createTestRecipientHierarchy(org1.id, 5, 'ORGANIZATIONAL', {
        namePrefix: 'Department',
      })

      try {
        // Assert - Verify all are INTERNAL_DEPARTMENT type
        departments.forEach((dept) => {
          expect(dept.type).toBe('INTERNAL_DEPARTMENT')
          expect(dept.externalOrganizationId).toBeNull()
          expect(dept.hierarchyType).toBe('ORGANIZATIONAL')
        })

        // Assert - Verify parent-child relationships
        expect(departments[0].parentRecipientId).toBeNull() // Root
        expect(departments[1].parentRecipientId).toBe(departments[0].id)
        expect(departments[2].parentRecipientId).toBe(departments[1].id)
        expect(departments[3].parentRecipientId).toBe(departments[2].id)
        expect(departments[4].parentRecipientId).toBe(departments[3].id)

        // Assert - Validate each department
        for (const [i, dept] of departments.entries()) {
          const dataValidation = validateRecipientData('INTERNAL_DEPARTMENT', null)
          expect(dataValidation.isValid).toBe(true)

          if (i > 0) {
            const hierarchyValidation = await validateRecipientHierarchy(
              dept.id,
              'INTERNAL_DEPARTMENT',
              departments[i - 1].id,
              org1.id
            )
            expect(hierarchyValidation.isValid).toBe(true)
          }
        }

        // Assert - Verify descendant tree
        const fullTree = await getDescendantTree(departments[0].id, org1.id, 10)
        expect(fullTree).toHaveLength(4) // 4 descendants
        expect(fullTree.find((d) => d.id === departments[1].id)?.depth).toBe(1)
        expect(fullTree.find((d) => d.id === departments[4].id)?.depth).toBe(4)

        // Cleanup
        await cleanupTestRecipients(departments.map((d) => d.id))
      } catch (error) {
        await cleanupTestRecipients(departments.map((d) => d.id))
        throw error
      }
    })

    it('should allow internal departments up to max depth of 10', async () => {
      // Act - Create 10-level department hierarchy
      const departments = await createTestRecipientHierarchy(org1.id, 10, 'ORGANIZATIONAL', {
        namePrefix: 'Deep Department',
      })

      try {
        // Assert - Validate the deepest department (depth 9 from root, index 9)
        const deepestDept = departments[9]
        const validationResult = await validateRecipientHierarchy(
          deepestDept.id,
          'INTERNAL_DEPARTMENT',
          departments[8].id,
          org1.id
        )

        expect(validationResult.isValid).toBe(true)

        // Assert - Verify full tree structure
        const fullTree = await getDescendantTree(departments[0].id, org1.id, 15)
        expect(fullTree).toHaveLength(9) // 9 descendants
        expect(fullTree.find((d) => d.id === departments[9].id)?.depth).toBe(9)

        // Cleanup
        await cleanupTestRecipients(departments.map((d) => d.id))
      } catch (error) {
        await cleanupTestRecipients(departments.map((d) => d.id))
        throw error
      }
    })
  })

  describe('Workflow 3: Missing agreement detection and remediation', () => {
    it('should detect recipients missing required agreements and track remediation', async () => {
      // Arrange - Create processor WITHOUT DPA
      const processorOrgNoDPA = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Processor Without DPA',
      })

      // Create joint controller WITHOUT JCA
      const jointControllerOrgNoJCA = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Joint Controller Without JCA',
      })

      // Create processor WITH DPA
      const processorOrgWithDPA = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Processor With DPA',
      })

      const dpa = await createTestAgreement({
        organizationId: org1.id,
        externalOrganizationId: processorOrgWithDPA.id,
        type: 'DPA',
        status: 'ACTIVE',
      })

      try {
        const processor1 = await createTestRecipient(org1.id, {
          name: 'Processor Without DPA',
          type: 'PROCESSOR',
          externalOrganizationId: processorOrgNoDPA.id,
        })

        const jointController1 = await createTestRecipient(org1.id, {
          name: 'Joint Controller Without JCA',
          type: 'JOINT_CONTROLLER',
          externalOrganizationId: jointControllerOrgNoJCA.id,
        })

        const processor2 = await createTestRecipient(org1.id, {
          name: 'Processor With DPA',
          type: 'PROCESSOR',
          externalOrganizationId: processorOrgWithDPA.id,
        })

        // Act - Step 1: Detect missing agreements
        const missingAgreements = await findRecipientsMissingAgreements(org1.id)

        // Assert - Should find 2 recipients with missing agreements
        expect(missingAgreements.length).toBeGreaterThanOrEqual(2)
        const missingIds = missingAgreements.map((r) => r.id)
        expect(missingIds).toContain(processor1.id)
        expect(missingIds).toContain(jointController1.id)
        expect(missingIds).not.toContain(processor2.id)

        // Act - Step 2: Remediate by creating DPA for processor1
        const newDPA = await createTestAgreement({
          organizationId: org1.id,
          externalOrganizationId: processorOrgNoDPA.id,
          type: 'DPA',
          status: 'ACTIVE',
        })

        // Act - Step 3: Verify remediation
        const missingAfterRemediation = await findRecipientsMissingAgreements(org1.id)
        const missingIdsAfter = missingAfterRemediation.map((r) => r.id)

        // Assert - processor1 should no longer be in missing list
        expect(missingIdsAfter).not.toContain(processor1.id)
        // But joint controller still missing
        expect(missingIdsAfter).toContain(jointController1.id)

        // Cleanup
        await cleanupTestRecipients([processor1.id, jointController1.id, processor2.id])
        await cleanupTestAgreements([dpa.id, newDPA.id])
        await cleanupTestExternalOrganizations([
          processorOrgNoDPA.id,
          jointControllerOrgNoJCA.id,
          processorOrgWithDPA.id,
        ])
      } catch (error) {
        await cleanupTestAgreements([dpa.id])
        await cleanupTestExternalOrganizations([
          processorOrgNoDPA.id,
          jointControllerOrgNoJCA.id,
          processorOrgWithDPA.id,
        ])
        throw error
      }
    })
  })

  describe('Workflow 4: Third-country transfer assessment', () => {
    it('should assess cross-border transfers in complex processor chain', async () => {
      // Arrange - Create chain with mixed country locations
      const euOrg = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'EU Processor',
        headquartersCountryId: euCountry.id,
      })
      const usOrg = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'US Sub-Processor',
        headquartersCountryId: thirdCountry.id,
      })
      const canadaOrg = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Canada Sub-Processor',
        headquartersCountryId: adequateCountry.id,
      })

      try {
        // Create chain: EU -> US -> Canada
        const euProcessor = await createTestRecipient(org1.id, {
          name: 'EU Processor',
          type: 'PROCESSOR',
          externalOrganizationId: euOrg.id,
        })

        const usSubProcessor = await createTestRecipient(org1.id, {
          name: 'US Sub-Processor',
          type: 'SUB_PROCESSOR',
          externalOrganizationId: usOrg.id,
          parentRecipientId: euProcessor.id,
          hierarchyType: 'PROCESSOR_CHAIN',
        })

        const canadaSubProcessor = await createTestRecipient(org1.id, {
          name: 'Canada Sub-Processor',
          type: 'SUB_PROCESSOR',
          externalOrganizationId: canadaOrg.id,
          parentRecipientId: usSubProcessor.id,
          hierarchyType: 'PROCESSOR_CHAIN',
        })

        // Act - Assess cross-border transfers
        const transferAssessment = await assessCrossBorderTransfers(euProcessor.id, org1.id)

        // Assert - Should identify all 3 countries in chain
        expect(transferAssessment).toHaveLength(3)

        const countryIds = transferAssessment.map((t) => t.country.id)
        expect(countryIds).toContain(euCountry.id)
        expect(countryIds).toContain(thirdCountry.id)
        expect(countryIds).toContain(adequateCountry.id)

        // Assert - Verify depth information
        const euTransfer = transferAssessment.find((t) => t.country.id === euCountry.id)
        const usTransfer = transferAssessment.find((t) => t.country.id === thirdCountry.id)
        const canadaTransfer = transferAssessment.find((t) => t.country.id === adequateCountry.id)

        expect(euTransfer?.depth).toBe(0) // Root processor
        expect(usTransfer?.depth).toBe(1) // First sub-processor
        expect(canadaTransfer?.depth).toBe(2) // Second sub-processor

        // Cleanup
        await cleanupTestRecipients([euProcessor.id, usSubProcessor.id, canadaSubProcessor.id])
        await cleanupTestExternalOrganizations([euOrg.id, usOrg.id, canadaOrg.id])
      } catch (error) {
        await cleanupTestExternalOrganizations([euOrg.id, usOrg.id, canadaOrg.id])
        throw error
      }
    })
  })

  describe('Workflow 5: Hierarchy health check with multiple violations', () => {
    it('should detect multiple types of hierarchy violations in single health check', async () => {
      // Arrange - Create scenario with multiple violations
      const externalOrg = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Health Check Test Org',
      })

      try {
        // Violation 1: Orphaned sub-processor (parent missing)
        const orphanedSubProcessor = await createTestRecipient(org1.id, {
          name: 'Orphaned Sub-Processor',
          type: 'SUB_PROCESSOR',
          externalOrganizationId: externalOrg.id,
          parentRecipientId: null, // Should have parent but doesn't
        })

        // Violation 2: Create a valid processor for comparison
        const validProcessor = await createTestRecipient(org1.id, {
          name: 'Valid Processor',
          type: 'PROCESSOR',
          externalOrganizationId: externalOrg.id,
        })

        // Violation 3: Unlinked recipient (missing externalOrganizationId for non-internal type)
        const unlinkedProcessor = await createTestRecipient(org1.id, {
          name: 'Unlinked Processor',
          type: 'PROCESSOR',
          externalOrganizationId: null, // Should have external org
        })

        // Act - Run hierarchy health check
        const healthReport = await checkHierarchyHealth(org1.id)

        // Assert - Orphaned sub-processors detected
        const orphanedIds = healthReport.orphanedSubProcessors.map((r) => r.id)
        expect(orphanedIds).toContain(orphanedSubProcessor.id)

        // Unlinked recipients detected
        const unlinkedIds = healthReport.unlinkedRecipients.map((r) => r.id)
        expect(unlinkedIds).toContain(unlinkedProcessor.id)

        // Valid processor should not appear in violations
        expect(orphanedIds).not.toContain(validProcessor.id)
        expect(unlinkedIds).not.toContain(validProcessor.id)

        // Cleanup
        await cleanupTestRecipients([
          orphanedSubProcessor.id,
          validProcessor.id,
          unlinkedProcessor.id,
        ])
        await cleanupTestExternalOrganizations([externalOrg.id])
      } catch (error) {
        await cleanupTestExternalOrganizations([externalOrg.id])
        throw error
      }
    })
  })

  describe('Workflow 6: Multi-tenant data isolation in complex scenarios', () => {
    it('should maintain strict tenant isolation across all hierarchy operations', async () => {
      // Arrange - Create identical structures in both orgs
      const externalOrg = await createTestExternalOrganization({
        organizationId: org1.id,
        legalName: 'Multi-Tenant Test Org',
      })

      try {
        // Org1 chain
        const org1Chain = await createTestRecipientHierarchy(org1.id, 3, 'PROCESSOR_CHAIN', {
          externalOrganizationId: externalOrg.id,
          namePrefix: 'Org1 Processor',
        })

        // Org2 chain
        const org2Chain = await createTestRecipientHierarchy(org2.id, 3, 'PROCESSOR_CHAIN', {
          externalOrganizationId: externalOrg.id,
          namePrefix: 'Org2 Processor',
        })

        // Act & Assert - Descendant tree should respect tenant boundaries
        const org1Tree = await getDescendantTree(org1Chain[0].id, org1.id, 10)
        const org2Tree = await getDescendantTree(org2Chain[0].id, org2.id, 10)

        // Each tree should only contain recipients from its own org
        expect(org1Tree.every((r) => r.organizationId === org1.id)).toBe(true)
        expect(org2Tree.every((r) => r.organizationId === org2.id)).toBe(true)

        // Trees should not contain recipients from other org
        const org1Ids = org1Tree.map((r) => r.id)
        const org2Ids = org2Tree.map((r) => r.id)
        org2Chain.forEach((recipient) => {
          expect(org1Ids).not.toContain(recipient.id)
        })
        org1Chain.forEach((recipient) => {
          expect(org2Ids).not.toContain(recipient.id)
        })

        // Act & Assert - Missing agreements should only return recipients from queried org
        const org1Missing = await findRecipientsMissingAgreements(org1.id)
        const org2Missing = await findRecipientsMissingAgreements(org2.id)

        org1Missing.forEach((recipient) => {
          expect(recipient.organizationId).toBe(org1.id)
        })
        org2Missing.forEach((recipient) => {
          expect(recipient.organizationId).toBe(org2.id)
        })

        // Cleanup
        await cleanupTestRecipients([...org1Chain.map((r) => r.id), ...org2Chain.map((r) => r.id)])
        await cleanupTestExternalOrganizations([externalOrg.id])
      } catch (error) {
        await cleanupTestExternalOrganizations([externalOrg.id])
        throw error
      }
    })
  })
})
