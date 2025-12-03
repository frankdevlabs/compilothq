import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  calculateHierarchyDepth,
  checkCircularReference,
  createRecipient,
  getAncestorChain,
  getDescendantTree,
  getDirectChildren,
} from '../../../src/dal/recipients'
import type { ExternalOrganization, Organization, Recipient } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'
import {
  cleanupTestExternalOrganizations,
  createTestExternalOrganization,
} from '../../../src/test-utils/factories/externalOrganizationFactory'

/**
 * Recipients DAL - Hierarchy Operations Integration Tests
 *
 * Tests recipient hierarchy traversal functions against a real test database.
 * Focuses on:
 * - Direct children queries
 * - Descendant tree with depth tracking
 * - Ancestor chain traversal
 * - Circular reference detection
 * - Max depth enforcement
 *
 * Coverage goals (2-8 focused tests):
 * - Test getDirectChildren returns only immediate children
 * - Test getDescendantTree with depth tracking
 * - Test getAncestorChain traverses up to root
 * - Test circular reference detection
 * - Test max depth enforcement (5 for processors, 10 for internal)
 * - Multi-tenancy enforcement in hierarchy queries
 */
describe('Recipients DAL - Hierarchy Operations Integration Tests', () => {
  // Shared test organizations
  let org1: Organization
  let org2: Organization
  let externalOrg1: ExternalOrganization

  beforeAll(async () => {
    // Create shared test organizations
    const { org: testOrg1 } = await createTestOrganization({
      slug: 'recipients-hierarchy-org1',
      userCount: 1,
    })
    const { org: testOrg2 } = await createTestOrganization({
      slug: 'recipients-hierarchy-org2',
      userCount: 1,
    })

    org1 = testOrg1
    org2 = testOrg2

    // Create shared external organization
    externalOrg1 = await createTestExternalOrganization({
      legalName: 'Hierarchy Test Vendor Inc.',
      tradingName: 'TestVendor',
    })
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([org1.id, org2.id])
    await cleanupTestExternalOrganizations([externalOrg1.id])
  })

  describe('getDirectChildren', () => {
    it('should return only immediate children, not grandchildren', async () => {
      // Arrange - Create 3-level hierarchy: root -> child -> grandchild
      const root = await createRecipient({
        name: 'Root Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const child1 = await createRecipient({
        name: 'Child Sub-Processor 1',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: root.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const child2 = await createRecipient({
        name: 'Child Sub-Processor 2',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: root.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const grandchild = await createRecipient({
        name: 'Grandchild Sub-Processor',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: child1.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Act - Get direct children of root
      const directChildren = await getDirectChildren(root.id, org1.id)

      // Assert - Should return only child1 and child2, not grandchild
      expect(directChildren.length).toBe(2)
      const childIds = directChildren.map((r) => r.id)
      expect(childIds).toContain(child1.id)
      expect(childIds).toContain(child2.id)
      expect(childIds).not.toContain(grandchild.id)
    })

    it('should return empty array when recipient has no children', async () => {
      // Arrange - Create leaf node
      const leaf = await createRecipient({
        name: 'Leaf Processor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act
      const children = await getDirectChildren(leaf.id, org1.id)

      // Assert
      expect(children).toEqual([])
    })

    it('should enforce multi-tenancy - not return children from different organization', async () => {
      // Arrange - Create parent in org1, child in org2
      const org1Parent = await createRecipient({
        name: 'Org1 Parent',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Create child in org2 (should never happen in real system, but testing enforcement)
      const org2Child = await createRecipient({
        name: 'Org2 Child',
        type: 'SUB_PROCESSOR',
        organizationId: org2.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: org1Parent.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Act - Try to get children for org1Parent in org1 context
      const children = await getDirectChildren(org1Parent.id, org1.id)

      // Assert - Should not return org2Child
      expect(children.every((c) => c.organizationId === org1.id)).toBe(true)
      expect(children.some((c) => c.id === org2Child.id)).toBe(false)
    })
  })

  describe('getDescendantTree', () => {
    it('should return all descendants with depth tracking', async () => {
      // Arrange - Create 4-level hierarchy
      const root = await createRecipient({
        name: 'Root for Tree',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const child = await createRecipient({
        name: 'Child Level 1',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: root.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const grandchild = await createRecipient({
        name: 'Grandchild Level 2',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: child.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const greatGrandchild = await createRecipient({
        name: 'Great-Grandchild Level 3',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: grandchild.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Act - Get full descendant tree
      const tree = await getDescendantTree(root.id, org1.id)

      // Assert - Should return all descendants with correct depths
      expect(tree.length).toBe(3)

      const childNode = tree.find((n) => n.id === child.id)
      expect(childNode?.depth).toBe(1)

      const grandchildNode = tree.find((n) => n.id === grandchild.id)
      expect(grandchildNode?.depth).toBe(2)

      const greatGrandchildNode = tree.find((n) => n.id === greatGrandchild.id)
      expect(greatGrandchildNode?.depth).toBe(3)
    })

    it('should respect maxDepth parameter', async () => {
      // Arrange - Create 4-level hierarchy
      const root = await createRecipient({
        name: 'Root for MaxDepth Test',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const child = await createRecipient({
        name: 'Child',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: root.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const grandchild = await createRecipient({
        name: 'Grandchild',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: child.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      await createRecipient({
        name: 'Great-Grandchild',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: grandchild.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Act - Get tree with maxDepth = 2
      const tree = await getDescendantTree(root.id, org1.id, 2)

      // Assert - Should return only child and grandchild (depth 1 and 2)
      expect(tree.length).toBe(2)
      expect(tree.every((n) => n.depth <= 2)).toBe(true)
      expect(tree.some((n) => n.id === child.id)).toBe(true)
      expect(tree.some((n) => n.id === grandchild.id)).toBe(true)
    })
  })

  describe('getAncestorChain', () => {
    it('should return ancestors from immediate parent to root', async () => {
      // Arrange - Create 4-level hierarchy
      const root = await createRecipient({
        name: 'Root for Ancestor',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const child = await createRecipient({
        name: 'Child',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: root.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const grandchild = await createRecipient({
        name: 'Grandchild',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: child.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const greatGrandchild = await createRecipient({
        name: 'Great-Grandchild',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: grandchild.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Act - Get ancestor chain for great-grandchild
      const ancestors = await getAncestorChain(greatGrandchild.id, org1.id)

      // Assert - Should return [grandchild, child, root] in order
      expect(ancestors.length).toBe(3)
      expect(ancestors[0]?.id).toBe(grandchild.id) // Immediate parent
      expect(ancestors[1]?.id).toBe(child.id)
      expect(ancestors[2]?.id).toBe(root.id) // Root
    })

    it('should return empty array for root recipient with no parent', async () => {
      // Arrange - Create root recipient
      const root = await createRecipient({
        name: 'Root with No Parent',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act
      const ancestors = await getAncestorChain(root.id, org1.id)

      // Assert
      expect(ancestors).toEqual([])
    })
  })

  describe('checkCircularReference', () => {
    it('should detect circular reference when setting parent to descendant', async () => {
      // Arrange - Create chain: root -> child -> grandchild
      const root = await createRecipient({
        name: 'Root for Circular Test',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const child = await createRecipient({
        name: 'Child',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: root.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const grandchild = await createRecipient({
        name: 'Grandchild',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: child.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Act - Try to set root's parent to grandchild (would create cycle)
      const hasCircularRef = await checkCircularReference(root.id, grandchild.id, org1.id)

      // Assert - Should detect circular reference
      expect(hasCircularRef).toBe(true)
    })

    it('should detect direct self-reference', async () => {
      // Arrange - Create recipient
      const recipient = await createRecipient({
        name: 'Self-Reference Test',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Act - Try to set parent to self
      const hasCircularRef = await checkCircularReference(recipient.id, recipient.id, org1.id)

      // Assert - Should detect self-reference
      expect(hasCircularRef).toBe(true)
    })

    it('should return false for valid parent relationship', async () => {
      // Arrange - Create separate recipients
      const parent = await createRecipient({
        name: 'Valid Parent',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const child = await createRecipient({
        name: 'Valid Child',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Act - Check valid parent-child relationship
      const hasCircularRef = await checkCircularReference(child.id, parent.id, org1.id)

      // Assert - Should not detect circular reference
      expect(hasCircularRef).toBe(false)
    })
  })

  describe('calculateHierarchyDepth', () => {
    it('should return 0 for root recipient with no parent', async () => {
      // Arrange - Create root recipient
      const root = await createRecipient({
        name: 'Root for Depth Test',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      // Act
      const depth = await calculateHierarchyDepth(root.id, org1.id)

      // Assert
      expect(depth).toBe(0)
    })

    it('should return correct depth for nested recipient', async () => {
      // Arrange - Create 5-level hierarchy
      const root = await createRecipient({
        name: 'Root',
        type: 'PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
      })

      const level1 = await createRecipient({
        name: 'Level 1',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: root.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const level2 = await createRecipient({
        name: 'Level 2',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: level1.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const level3 = await createRecipient({
        name: 'Level 3',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: level2.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      const level4 = await createRecipient({
        name: 'Level 4',
        type: 'SUB_PROCESSOR',
        organizationId: org1.id,
        externalOrganizationId: externalOrg1.id,
        parentRecipientId: level3.id,
        hierarchyType: 'PROCESSOR_CHAIN',
      })

      // Act - Check depth at various levels
      const rootDepth = await calculateHierarchyDepth(root.id, org1.id)
      const level1Depth = await calculateHierarchyDepth(level1.id, org1.id)
      const level2Depth = await calculateHierarchyDepth(level2.id, org1.id)
      const level3Depth = await calculateHierarchyDepth(level3.id, org1.id)
      const level4Depth = await calculateHierarchyDepth(level4.id, org1.id)

      // Assert
      expect(rootDepth).toBe(0)
      expect(level1Depth).toBe(1)
      expect(level2Depth).toBe(2)
      expect(level3Depth).toBe(3)
      expect(level4Depth).toBe(4)
    })

    it('should test internal department hierarchy with higher max depth', async () => {
      // Arrange - Create internal department hierarchy (max depth 10)
      const rootDept = await createRecipient({
        name: 'Root Department',
        type: 'INTERNAL_DEPARTMENT',
        organizationId: org1.id,
      })

      let currentParent: Recipient = rootDept
      const depths: number[] = [0]

      // Create 8 levels (total depth 8, within limit of 10)
      for (let i = 1; i <= 8; i++) {
        const dept = await createRecipient({
          name: `Department Level ${i}`,
          type: 'INTERNAL_DEPARTMENT',
          organizationId: org1.id,
          parentRecipientId: currentParent.id,
          hierarchyType: 'ORGANIZATIONAL',
        })
        currentParent = dept

        // Calculate depth for this level
        const depth = await calculateHierarchyDepth(dept.id, org1.id)
        depths.push(depth)
      }

      // Assert - Verify depth increases correctly
      expect(depths).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    })
  })
})
