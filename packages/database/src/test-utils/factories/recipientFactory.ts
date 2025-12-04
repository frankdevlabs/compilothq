/**
 * Test factory for Recipient entities
 *
 * Recipient represents the roles that external organizations play in data processing
 * (processors, sub-processors, controllers, etc.) and is scoped to an organization (tenant).
 *
 * Usage:
 *   // Create a simple processor
 *   const recipient = await createTestRecipient(organizationId, {
 *     type: 'PROCESSOR',
 *     externalOrganizationId: externalOrg.id,
 *   })
 *
 *   // Create a processor chain (hierarchy)
 *   const chain = await createTestRecipientHierarchy(organizationId, 3, 'PROCESSOR_CHAIN')
 *   // Returns: [processor, subProcessor1, subProcessor2] with parent-child links
 *
 *   // Create an internal department hierarchy
 *   const departments = await createTestRecipientHierarchy(organizationId, 4, 'ORGANIZATIONAL')
 *   // Returns: [dept1, dept2, dept3, dept4] with nested parent-child links
 */

import type { HierarchyType, Recipient, RecipientType } from '../../index'
import { prisma } from '../../index'

let sequenceNumber = 0

/**
 * Create a test recipient with sensible defaults
 *
 * @param organizationId - Required organization ID (tenant scope)
 * @param overrides - Optional partial Recipient data to override defaults
 * @returns Promise<Recipient>
 *
 * @example
 * ```typescript
 * // Create a processor
 * const processor = await createTestRecipient(org.id, {
 *   type: 'PROCESSOR',
 *   externalOrganizationId: externalOrg.id,
 *   name: 'AWS Cloud Services',
 * })
 *
 * // Create an internal department (no externalOrganizationId needed)
 * const dept = await createTestRecipient(org.id, {
 *   type: 'INTERNAL_DEPARTMENT',
 *   name: 'HR Department',
 * })
 *
 * // Create a sub-processor with parent
 * const subProcessor = await createTestRecipient(org.id, {
 *   type: 'SUB_PROCESSOR',
 *   externalOrganizationId: subProcessorOrg.id,
 *   parentRecipientId: processor.id,
 *   hierarchyType: 'PROCESSOR_CHAIN',
 * })
 * ```
 */
export async function createTestRecipient(
  organizationId: string,
  overrides: Partial<{
    name: string
    type: RecipientType
    externalOrganizationId: string
    purpose: string
    description: string
    parentRecipientId: string
    hierarchyType: HierarchyType
    isActive: boolean
  }> = {}
): Promise<Recipient> {
  sequenceNumber++

  // Default to PROCESSOR type if not specified
  const type = overrides.type ?? 'PROCESSOR'

  const defaults = {
    name: overrides.name ?? `Test Recipient ${sequenceNumber}`,
    type,
    organizationId,
    purpose: overrides.purpose ?? null,
    description: overrides.description ?? null,
    parentRecipientId: overrides.parentRecipientId ?? null,
    hierarchyType: overrides.hierarchyType ?? null,
    isActive: overrides.isActive ?? true,
    // externalOrganizationId is required for all types except INTERNAL_DEPARTMENT
    externalOrganizationId:
      type === 'INTERNAL_DEPARTMENT' ? null : (overrides.externalOrganizationId ?? null),
  }

  return await prisma.recipient.create({
    data: {
      ...defaults,
      ...overrides,
    },
  })
}

/**
 * Create a recipient hierarchy (parent-child chain) for testing
 *
 * This helper function creates a chain of recipients with proper parent-child relationships,
 * useful for testing hierarchy queries, validation, and traversal logic.
 *
 * @param organizationId - Required organization ID (tenant scope)
 * @param depth - Number of recipients to create in the chain (1-10)
 * @param hierarchyType - Type of hierarchy: 'PROCESSOR_CHAIN' or 'ORGANIZATIONAL'
 * @param overrides - Optional overrides for recipient properties
 * @returns Promise<Recipient[]> - Array of created recipients, ordered from root to leaf
 *
 * @example
 * ```typescript
 * // Create a 3-level processor chain
 * const chain = await createTestRecipientHierarchy(org.id, 3, 'PROCESSOR_CHAIN', {
 *   externalOrganizationId: externalOrg.id,
 * })
 * // Returns: [processor, subProcessor1, subProcessor2]
 * // chain[0] is the root processor (no parent)
 * // chain[1] is a sub-processor with chain[0] as parent
 * // chain[2] is a sub-processor with chain[1] as parent
 *
 * // Create a 4-level internal department structure
 * const departments = await createTestRecipientHierarchy(org.id, 4, 'ORGANIZATIONAL')
 * // Returns: [dept1, dept2, dept3, dept4]
 * // dept1 is root (CEO office)
 * // dept2 is child of dept1 (Operations)
 * // dept3 is child of dept2 (IT Department)
 * // dept4 is child of dept3 (Security Team)
 * ```
 */
export async function createTestRecipientHierarchy(
  organizationId: string,
  depth: number,
  hierarchyType: 'PROCESSOR_CHAIN' | 'ORGANIZATIONAL' = 'PROCESSOR_CHAIN',
  overrides: Partial<{
    externalOrganizationId: string
    namePrefix: string
  }> = {}
): Promise<Recipient[]> {
  if (depth < 1 || depth > 10) {
    throw new Error('Depth must be between 1 and 10')
  }

  const recipients: Recipient[] = []

  for (let i = 0; i < depth; i++) {
    const isRoot = i === 0
    const parentRecipient = isRoot ? null : recipients[i - 1]

    let type: RecipientType
    let name: string

    if (hierarchyType === 'PROCESSOR_CHAIN') {
      // Root is PROCESSOR, children are SUB_PROCESSOR
      type = isRoot ? 'PROCESSOR' : 'SUB_PROCESSOR'
      const prefix = overrides.namePrefix ?? 'Test Processor'
      name = isRoot ? `${prefix} (Root)` : `${prefix} - Sub-processor Level ${i}`
    } else {
      // All are INTERNAL_DEPARTMENT
      type = 'INTERNAL_DEPARTMENT'
      const prefix = overrides.namePrefix ?? 'Test Department'
      name = isRoot ? `${prefix} (Root)` : `${prefix} - Level ${i}`
    }

    const recipient = await createTestRecipient(organizationId, {
      name,
      type,
      externalOrganizationId:
        type === 'INTERNAL_DEPARTMENT' ? undefined : overrides.externalOrganizationId,
      parentRecipientId: parentRecipient?.id ?? undefined,
      hierarchyType: isRoot ? hierarchyType : hierarchyType,
    })

    recipients.push(recipient)
  }

  return recipients
}

/**
 * Clean up test recipients
 *
 * This function deletes recipients by ID. Due to the self-referential foreign key
 * (parentRecipientId), you should delete children before parents, or rely on
 * the onDelete: SetNull cascade behavior.
 *
 * @param ids - Array of recipient IDs to delete
 *
 * @example
 * ```typescript
 * const recipient1 = await createTestRecipient(org.id)
 * const recipient2 = await createTestRecipient(org.id)
 *
 * // Clean up after test
 * await cleanupTestRecipients([recipient1.id, recipient2.id])
 * ```
 */
export async function cleanupTestRecipients(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  // The parentRecipientId has onDelete: SetNull, so we can delete in any order
  // Prisma will automatically set parentRecipientId to null for children
  await prisma.recipient.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  })
}
