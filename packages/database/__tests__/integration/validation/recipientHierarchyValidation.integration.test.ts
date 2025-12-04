import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { ExternalOrganization, Organization } from '../../../src'
import {
  createRecipient,
  deleteRecipient,
  getHierarchyTypeForRecipient,
  HIERARCHY_RULES,
  validateRecipientData,
  validateRecipientHierarchy,
  validateRequiredAgreements,
} from '../../../src'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils'
import {
  cleanupTestAgreements,
  createTestAgreement,
} from '../../../src/test-utils/factories/agreementFactory'
import {
  cleanupTestExternalOrganizations,
  createTestExternalOrganization,
} from '../../../src/test-utils/factories/externalOrganizationFactory'

/**
 * Integration tests for Recipient Hierarchy Validation Service
 *
 * Tests validation rules defined in HIERARCHY_RULES:
 * - Type-based parent validation (SUB_PROCESSOR can have PROCESSOR parent)
 * - Max depth enforcement (5 for processors, 10 for internal)
 * - Circular reference prevention
 * - Required externalOrganizationId for non-internal types
 * - HierarchyType auto-assignment based on RecipientType
 */
describe('Recipient Hierarchy Validation Service', () => {
  let testOrg: Organization
  let externalOrg: ExternalOrganization
  let recipientsToCleanup: string[] = []
  let externalOrgsToCleanup: string[] = []
  let agreementsToCleanup: string[] = []

  beforeAll(async () => {
    const { org } = await createTestOrganization({ slug: `validation-test-${Date.now()}` })
    testOrg = org

    // Create external organization for testing (tenant-bound)
    externalOrg = await createTestExternalOrganization({
      organizationId: testOrg.id,
      legalName: `Test External Org ${Date.now()}`,
    })
    externalOrgsToCleanup.push(externalOrg.id)
  })

  afterAll(async () => {
    // Clean up in correct order due to foreign key constraints
    for (const id of recipientsToCleanup) {
      try {
        await deleteRecipient(id)
      } catch {
        // Ignore errors for already deleted recipients
      }
    }
    await cleanupTestOrganizations([testOrg.id])
    await cleanupTestAgreements(agreementsToCleanup)
    await cleanupTestExternalOrganizations(externalOrgsToCleanup)
  })

  describe('HIERARCHY_RULES constant', () => {
    it('should define rules for all 7 RecipientType values', () => {
      expect(HIERARCHY_RULES).toBeDefined()
      expect(Object.keys(HIERARCHY_RULES)).toHaveLength(7)

      // Verify all types are present
      expect(HIERARCHY_RULES.PROCESSOR).toBeDefined()
      expect(HIERARCHY_RULES.SUB_PROCESSOR).toBeDefined()
      expect(HIERARCHY_RULES.JOINT_CONTROLLER).toBeDefined()
      expect(HIERARCHY_RULES.SERVICE_PROVIDER).toBeDefined()
      expect(HIERARCHY_RULES.SEPARATE_CONTROLLER).toBeDefined()
      expect(HIERARCHY_RULES.PUBLIC_AUTHORITY).toBeDefined()
      expect(HIERARCHY_RULES.INTERNAL_DEPARTMENT).toBeDefined()
    })

    it('should define correct rules for PROCESSOR type', () => {
      const rules = HIERARCHY_RULES.PROCESSOR
      expect(rules.canHaveParent).toBe(false)
      expect(rules.allowedParentTypes).toEqual([])
      expect(rules.maxDepth).toBe(0)
      expect(rules.hierarchyType).toBeNull()
      expect(rules.requiresExternalOrg).toBe(true)
      expect(rules.requiredAgreementTypes).toEqual(['DPA'])
    })

    it('should define correct rules for SUB_PROCESSOR type', () => {
      const rules = HIERARCHY_RULES.SUB_PROCESSOR
      expect(rules.canHaveParent).toBe(true)
      expect(rules.allowedParentTypes).toEqual(['PROCESSOR', 'SUB_PROCESSOR'])
      expect(rules.maxDepth).toBe(5)
      expect(rules.hierarchyType).toBe('PROCESSOR_CHAIN')
      expect(rules.requiresExternalOrg).toBe(true)
      expect(rules.requiredAgreementTypes).toEqual([])
    })

    it('should define correct rules for INTERNAL_DEPARTMENT type', () => {
      const rules = HIERARCHY_RULES.INTERNAL_DEPARTMENT
      expect(rules.canHaveParent).toBe(true)
      expect(rules.allowedParentTypes).toEqual(['INTERNAL_DEPARTMENT'])
      expect(rules.maxDepth).toBe(10)
      expect(rules.hierarchyType).toBe('ORGANIZATIONAL')
      expect(rules.requiresExternalOrg).toBe(false)
      expect(rules.requiredAgreementTypes).toEqual([])
    })
  })

  describe('validateRecipientHierarchy', () => {
    it('should return error when type cannot have parent but parentRecipientId is provided', async () => {
      // Create a PROCESSOR recipient (cannot have parent)
      const processor = await createRecipient({
        name: 'Test Processor',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(processor.id)

      // Create another PROCESSOR to attempt to use as parent
      const parentProcessor = await createRecipient({
        name: 'Parent Processor',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(parentProcessor.id)

      // Try to validate PROCESSOR with a parent (should fail)
      const result = await validateRecipientHierarchy(
        processor.id,
        'PROCESSOR',
        parentProcessor.id,
        testOrg.id
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Recipient type PROCESSOR cannot have a parent according to hierarchy rules'
      )
    })

    it('should return error when parent type is not allowed', async () => {
      // Create a JOINT_CONTROLLER recipient (cannot be parent of SUB_PROCESSOR)
      const jointController = await createRecipient({
        name: 'Joint Controller',
        type: 'JOINT_CONTROLLER',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(jointController.id)

      // Create a SUB_PROCESSOR
      const subProcessor = await createRecipient({
        name: 'Sub Processor',
        type: 'SUB_PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(subProcessor.id)

      // Try to validate SUB_PROCESSOR with JOINT_CONTROLLER parent (should fail)
      const result = await validateRecipientHierarchy(
        subProcessor.id,
        'SUB_PROCESSOR',
        jointController.id,
        testOrg.id
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((err) => err.includes('not an allowed parent type'))).toBe(true)
    })

    it('should allow SUB_PROCESSOR with PROCESSOR parent', async () => {
      // Create a PROCESSOR recipient
      const processor = await createRecipient({
        name: 'Processor Parent',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(processor.id)

      // Create a SUB_PROCESSOR
      const subProcessor = await createRecipient({
        name: 'Sub Processor Child',
        type: 'SUB_PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(subProcessor.id)

      // Validate SUB_PROCESSOR with PROCESSOR parent (should succeed)
      const result = await validateRecipientHierarchy(
        subProcessor.id,
        'SUB_PROCESSOR',
        processor.id,
        testOrg.id
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect circular reference', async () => {
      // Create a chain: A -> B -> C
      const recipientA = await createRecipient({
        name: 'Recipient A',
        type: 'SUB_PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(recipientA.id)

      const recipientB = await createRecipient({
        name: 'Recipient B',
        type: 'SUB_PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
        parentRecipientId: recipientA.id,
      })
      recipientsToCleanup.push(recipientB.id)

      const recipientC = await createRecipient({
        name: 'Recipient C',
        type: 'SUB_PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
        parentRecipientId: recipientB.id,
      })
      recipientsToCleanup.push(recipientC.id)

      // Try to make A a child of C (would create cycle: C -> A -> B -> C)
      const result = await validateRecipientHierarchy(
        recipientA.id,
        'SUB_PROCESSOR',
        recipientC.id,
        testOrg.id
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.includes('circular reference'))).toBe(true)
    })

    it('should enforce max depth for processor chains (5 levels)', async () => {
      // Create a chain of 5 SUB_PROCESSORs (max allowed)
      const processor = await createRecipient({
        name: 'Root Processor',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(processor.id)

      let currentParent = processor.id

      // Create chain: depth 1, 2, 3, 4, 5
      for (let depth = 1; depth <= 5; depth++) {
        const subProcessor = await createRecipient({
          name: `Sub Processor Depth ${depth}`,
          type: 'SUB_PROCESSOR',
          organizationId: testOrg.id,
          externalOrganizationId: externalOrg.id,
          parentRecipientId: currentParent,
        })
        recipientsToCleanup.push(subProcessor.id)
        currentParent = subProcessor.id
      }

      // Try to add one more at depth 6 (should fail)
      const tooDeepSub = await createRecipient({
        name: 'Too Deep Sub Processor',
        type: 'SUB_PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(tooDeepSub.id)

      const result = await validateRecipientHierarchy(
        tooDeepSub.id,
        'SUB_PROCESSOR',
        currentParent,
        testOrg.id
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.includes('exceeds maximum depth'))).toBe(true)
    })

    it('should enforce max depth for internal departments (10 levels)', async () => {
      // Create a chain of 11 INTERNAL_DEPARTMENTs to reach max depth of 10
      let currentParent: string | undefined = undefined

      // Create chain: depth 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
      for (let depth = 0; depth <= 10; depth++) {
        const dept = await createRecipient({
          name: `Department Depth ${depth}`,
          type: 'INTERNAL_DEPARTMENT',
          organizationId: testOrg.id,
          parentRecipientId: currentParent ?? null,
        })
        recipientsToCleanup.push(dept.id)
        currentParent = dept.id
      }

      // Try to add one more at depth 11 (should fail)
      const tooDeepDept = await createRecipient({
        name: 'Too Deep Department',
        type: 'INTERNAL_DEPARTMENT',
        organizationId: testOrg.id,
      })
      recipientsToCleanup.push(tooDeepDept.id)

      const result = await validateRecipientHierarchy(
        tooDeepDept.id,
        'INTERNAL_DEPARTMENT',
        currentParent,
        testOrg.id
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.includes('exceeds maximum depth'))).toBe(true)
    })

    it('should return error when parent is in different organization', async () => {
      // Create another organization
      const { org: otherOrg } = await createTestOrganization({
        slug: `other-org-${Date.now()}`,
      })

      // Create external org for other organization
      const otherExternalOrg = await createTestExternalOrganization({
        organizationId: otherOrg.id,
        legalName: `Other Org External ${Date.now()}`,
      })
      externalOrgsToCleanup.push(otherExternalOrg.id)

      // Create recipient in other organization
      const otherOrgRecipient = await createRecipient({
        name: 'Other Org Processor',
        type: 'PROCESSOR',
        organizationId: otherOrg.id,
        externalOrganizationId: otherExternalOrg.id,
      })
      recipientsToCleanup.push(otherOrgRecipient.id)

      // Create recipient in test organization
      const testOrgRecipient = await createRecipient({
        name: 'Test Org Sub Processor',
        type: 'SUB_PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(testOrgRecipient.id)

      // Try to set parent from different organization (should fail)
      const result = await validateRecipientHierarchy(
        testOrgRecipient.id,
        'SUB_PROCESSOR',
        otherOrgRecipient.id,
        testOrg.id
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some((err) => err.includes('different organization'))).toBe(true)

      // Clean up other organization
      await cleanupTestOrganizations([otherOrg.id])
    })
  })

  describe('validateRecipientData', () => {
    it('should return error when non-internal type has no externalOrganizationId', () => {
      const result = validateRecipientData('PROCESSOR', null)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Recipient type PROCESSOR requires an external organization')
    })

    it('should return warning when INTERNAL_DEPARTMENT has externalOrganizationId', () => {
      const result = validateRecipientData('INTERNAL_DEPARTMENT', externalOrg.id)

      expect(result.isValid).toBe(true) // Valid but with warning
      expect(result.warnings).toContain(
        'Recipient type INTERNAL_DEPARTMENT should not have an external organization'
      )
    })

    it('should be valid when PROCESSOR has externalOrganizationId', () => {
      const result = validateRecipientData('PROCESSOR', externalOrg.id)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should be valid when INTERNAL_DEPARTMENT has no externalOrganizationId', () => {
      const result = validateRecipientData('INTERNAL_DEPARTMENT', null)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('validateRequiredAgreements', () => {
    it('should return warning when PROCESSOR is missing required DPA', async () => {
      // Create external org without agreements
      const externalOrgNoDPA = await createTestExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Org Without DPA ${Date.now()}`,
      })
      externalOrgsToCleanup.push(externalOrgNoDPA.id)

      // Create PROCESSOR recipient linked to org without DPA
      const processor = await createRecipient({
        name: 'Processor Without DPA',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrgNoDPA.id,
      })
      recipientsToCleanup.push(processor.id)

      const result = await validateRequiredAgreements(processor.id, testOrg.id)

      expect(result.isValid).toBe(true) // Warnings don't make it invalid
      expect(result.warnings.some((warn) => warn.includes('missing required DPA'))).toBe(true)
    })

    it('should return no warning when PROCESSOR has active DPA', async () => {
      // Create external org with active DPA
      const externalOrgWithDPA = await createTestExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Org With DPA ${Date.now()}`,
      })
      externalOrgsToCleanup.push(externalOrgWithDPA.id)

      const agreement = await createTestAgreement({
        organizationId: testOrg.id,
        externalOrganizationId: externalOrgWithDPA.id,
        type: 'DPA',
        status: 'ACTIVE',
      })
      agreementsToCleanup.push(agreement.id)

      // Create PROCESSOR recipient linked to org with DPA
      const processor = await createRecipient({
        name: 'Processor With DPA',
        type: 'PROCESSOR',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrgWithDPA.id,
      })
      recipientsToCleanup.push(processor.id)

      const result = await validateRequiredAgreements(processor.id, testOrg.id)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should return warning when JOINT_CONTROLLER is missing required JCA', async () => {
      // Create external org without JCA
      const externalOrgNoJCA = await createTestExternalOrganization({
        organizationId: testOrg.id,
        legalName: `Org Without JCA ${Date.now()}`,
      })
      externalOrgsToCleanup.push(externalOrgNoJCA.id)

      // Create JOINT_CONTROLLER recipient
      const jointController = await createRecipient({
        name: 'Joint Controller Without JCA',
        type: 'JOINT_CONTROLLER',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrgNoJCA.id,
      })
      recipientsToCleanup.push(jointController.id)

      const result = await validateRequiredAgreements(jointController.id, testOrg.id)

      expect(result.isValid).toBe(true)
      expect(
        result.warnings.some((warn) => warn.includes('missing required JOINT_CONTROLLER_AGREEMENT'))
      ).toBe(true)
    })

    it('should return no warning for types that do not require agreements', async () => {
      // Create SERVICE_PROVIDER recipient (no required agreements)
      const serviceProvider = await createRecipient({
        name: 'Service Provider',
        type: 'SERVICE_PROVIDER',
        organizationId: testOrg.id,
        externalOrganizationId: externalOrg.id,
      })
      recipientsToCleanup.push(serviceProvider.id)

      const result = await validateRequiredAgreements(serviceProvider.id, testOrg.id)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('getHierarchyTypeForRecipient', () => {
    it('should return PROCESSOR_CHAIN for SUB_PROCESSOR', () => {
      const hierarchyType = getHierarchyTypeForRecipient('SUB_PROCESSOR')
      expect(hierarchyType).toBe('PROCESSOR_CHAIN')
    })

    it('should return ORGANIZATIONAL for INTERNAL_DEPARTMENT', () => {
      const hierarchyType = getHierarchyTypeForRecipient('INTERNAL_DEPARTMENT')
      expect(hierarchyType).toBe('ORGANIZATIONAL')
    })

    it('should return null for PROCESSOR', () => {
      const hierarchyType = getHierarchyTypeForRecipient('PROCESSOR')
      expect(hierarchyType).toBeNull()
    })

    it('should return null for JOINT_CONTROLLER', () => {
      const hierarchyType = getHierarchyTypeForRecipient('JOINT_CONTROLLER')
      expect(hierarchyType).toBeNull()
    })

    it('should return null for types without hierarchy', () => {
      expect(getHierarchyTypeForRecipient('SERVICE_PROVIDER')).toBeNull()
      expect(getHierarchyTypeForRecipient('SEPARATE_CONTROLLER')).toBeNull()
      expect(getHierarchyTypeForRecipient('PUBLIC_AUTHORITY')).toBeNull()
    })
  })
})
