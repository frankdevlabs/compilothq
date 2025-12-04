import {
  calculateHierarchyDepth,
  checkCircularReference,
  getRecipientById,
} from '../dal/recipients'
import type { AgreementType, HierarchyType, RecipientType } from '../index'
import { prisma } from '../index'

/**
 * Hierarchy rules configuration for each RecipientType
 *
 * Defines:
 * - Whether a type can have a parent recipient
 * - Which parent types are allowed
 * - Maximum hierarchy depth
 * - Auto-assigned hierarchy type
 * - Whether external organization is required
 * - Required agreement types
 */
export interface HierarchyRules {
  canHaveParent: boolean
  allowedParentTypes: RecipientType[]
  maxDepth: number
  hierarchyType: HierarchyType | null
  requiresExternalOrg: boolean
  requiredAgreementTypes: AgreementType[]
}

/**
 * Type-based hierarchy rules for all recipient types
 *
 * Based on GDPR Articles:
 * - Art. 28: PROCESSOR and SUB_PROCESSOR chains
 * - Art. 26: JOINT_CONTROLLER relationships
 * - Internal organizational structures
 */
export const HIERARCHY_RULES: Record<RecipientType, HierarchyRules> = {
  PROCESSOR: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
    requiresExternalOrg: true,
    requiredAgreementTypes: ['DPA'],
  },
  SUB_PROCESSOR: {
    canHaveParent: true,
    allowedParentTypes: ['PROCESSOR', 'SUB_PROCESSOR'],
    maxDepth: 5,
    hierarchyType: 'PROCESSOR_CHAIN',
    requiresExternalOrg: true,
    requiredAgreementTypes: [], // Inherits from parent processor
  },
  JOINT_CONTROLLER: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
    requiresExternalOrg: true,
    requiredAgreementTypes: ['JOINT_CONTROLLER_AGREEMENT'],
  },
  SERVICE_PROVIDER: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
    requiresExternalOrg: true,
    requiredAgreementTypes: [],
  },
  SEPARATE_CONTROLLER: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
    requiresExternalOrg: true,
    requiredAgreementTypes: [],
  },
  PUBLIC_AUTHORITY: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
    requiresExternalOrg: true,
    requiredAgreementTypes: [],
  },
  INTERNAL_DEPARTMENT: {
    canHaveParent: true,
    allowedParentTypes: ['INTERNAL_DEPARTMENT'],
    maxDepth: 10,
    hierarchyType: 'ORGANIZATIONAL',
    requiresExternalOrg: false,
    requiredAgreementTypes: [],
  },
}

/**
 * Validation result with errors (blocking) and warnings (advisory)
 *
 * - Errors: Blocking issues that must be resolved
 * - Warnings: Advisory issues for guidance
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate recipient hierarchy configuration
 *
 * Checks:
 * 1. Type can have parent (canHaveParent rule)
 * 2. Parent type is allowed (allowedParentTypes rule)
 * 3. No circular references in hierarchy
 * 4. Depth does not exceed maximum for type
 * 5. Parent is in same organization
 *
 * @param recipientId - The recipient ID to validate
 * @param type - The recipient type
 * @param parentRecipientId - The proposed parent recipient ID (optional)
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<ValidationResult> - Structured validation result
 *
 * @example
 * const result = await validateRecipientHierarchy('sub-id', 'SUB_PROCESSOR', 'processor-id', 'org-id')
 * if (!result.isValid) {
 *   console.error('Validation errors:', result.errors)
 * }
 */
export async function validateRecipientHierarchy(
  recipientId: string,
  type: RecipientType,
  parentRecipientId: string | null | undefined,
  organizationId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // eslint-disable-next-line security/detect-object-injection -- Safe: type is constrained to RecipientType enum values
  const rules = HIERARCHY_RULES[type]

  // Check 1: If parentRecipientId provided, verify canHaveParent=true for type
  if (parentRecipientId) {
    if (!rules.canHaveParent) {
      errors.push(`Recipient type ${type} cannot have a parent according to hierarchy rules`)
    }

    // Check 2: If parent provided, verify parent type is in allowedParentTypes
    const parent = await getRecipientById(parentRecipientId)
    if (!parent) {
      errors.push(`Parent recipient with ID ${parentRecipientId} not found`)
    } else {
      if (!rules.allowedParentTypes.includes(parent.type)) {
        errors.push(
          `Parent recipient type ${parent.type} is not an allowed parent type for ${type}. Allowed types: ${rules.allowedParentTypes.join(', ')}`
        )
      }

      // Check 5: Verify parent is in same organization
      if (parent.organizationId !== organizationId) {
        errors.push(
          `Parent recipient is in a different organization. Cross-organization hierarchies are not allowed.`
        )
      }

      // Check 3: Check circular reference using checkCircularReference DAL
      if (errors.length === 0) {
        // Only check if no other errors
        const isCircular = await checkCircularReference(
          recipientId,
          parentRecipientId,
          organizationId
        )
        if (isCircular) {
          errors.push(`Setting this parent would create a circular reference in the hierarchy`)
        }
      }

      // Check 4: Calculate depth and verify <= maxDepth for type
      if (errors.length === 0) {
        // Only check if no other errors
        // Calculate what the depth would be if this parent is set
        const parentDepth = await calculateHierarchyDepth(parentRecipientId, organizationId)
        const newDepth = parentDepth + 1

        if (newDepth > rules.maxDepth) {
          errors.push(
            `Setting this parent would result in depth ${newDepth}, which exceeds maximum depth of ${rules.maxDepth} for type ${type}`
          )
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate recipient data requirements
 *
 * Checks:
 * 1. Non-INTERNAL_DEPARTMENT types require externalOrganizationId
 * 2. INTERNAL_DEPARTMENT should not have externalOrganizationId (warning)
 *
 * This is a synchronous validation (no database queries needed).
 *
 * @param type - The recipient type
 * @param externalOrganizationId - The external organization ID (nullable)
 * @returns ValidationResult - Structured validation result
 *
 * @example
 * const result = validateRecipientData('PROCESSOR', null)
 * if (!result.isValid) {
 *   console.error('Missing external organization')
 * }
 */
export function validateRecipientData(
  type: RecipientType,
  externalOrganizationId: string | null | undefined
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // eslint-disable-next-line security/detect-object-injection -- Safe: type is constrained to RecipientType enum values
  const rules = HIERARCHY_RULES[type]

  // Check 1: If type requires external org and it's missing, add error
  if (rules.requiresExternalOrg && !externalOrganizationId) {
    errors.push(`Recipient type ${type} requires an external organization`)
  }

  // Check 2: If type is INTERNAL_DEPARTMENT and has external org, add warning
  if (type === 'INTERNAL_DEPARTMENT' && externalOrganizationId) {
    warnings.push(`Recipient type ${type} should not have an external organization`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate required agreements for recipient
 *
 * Checks if linked ExternalOrganization has required agreements:
 * - PROCESSOR types: check if active DPA exists
 * - JOINT_CONTROLLER types: check if active JCA exists
 *
 * Returns warnings (not errors) because missing agreements don't block
 * recipient creation but should be flagged for compliance review.
 *
 * @param recipientId - The recipient ID to validate
 * @param organizationId - The organization ID for multi-tenancy enforcement
 * @returns Promise<ValidationResult> - Structured validation result with warnings
 *
 * @example
 * const result = await validateRequiredAgreements('recipient-id', 'org-id')
 * if (result.warnings.length > 0) {
 *   console.warn('Missing agreements:', result.warnings)
 * }
 */
export async function validateRequiredAgreements(
  recipientId: string,
  organizationId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Get recipient with external organization and agreements
  const recipient = await prisma.recipient.findUnique({
    where: {
      id: recipientId,
      organizationId, // Enforce multi-tenancy
    },
    include: {
      externalOrganization: {
        include: {
          agreements: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      },
    },
  })

  if (!recipient) {
    errors.push(`Recipient with ID ${recipientId} not found in organization`)
    return {
      isValid: false,
      errors,
      warnings,
    }
  }

  const rules = HIERARCHY_RULES[recipient.type]
  const requiredTypes = rules.requiredAgreementTypes

  // Check if required agreements exist
  if (requiredTypes.length > 0 && recipient.externalOrganization) {
    const existingTypes = recipient.externalOrganization.agreements.map((a) => a.type)

    for (const requiredType of requiredTypes) {
      if (!existingTypes.includes(requiredType)) {
        warnings.push(
          `Recipient type ${recipient.type} is missing required ${requiredType} agreement with ${recipient.externalOrganization.legalName}`
        )
      }
    }
  }

  return {
    isValid: true, // Warnings don't make it invalid
    errors,
    warnings,
  }
}

/**
 * Get hierarchy type for recipient based on type
 *
 * Auto-assignment logic for hierarchyType field:
 * - SUB_PROCESSOR -> PROCESSOR_CHAIN
 * - INTERNAL_DEPARTMENT -> ORGANIZATIONAL
 * - All others -> null
 *
 * Use this during create/update to automatically set hierarchyType.
 *
 * @param type - The recipient type
 * @returns HierarchyType | null - The hierarchy type or null
 *
 * @example
 * const hierarchyType = getHierarchyTypeForRecipient('SUB_PROCESSOR')
 * // Returns: 'PROCESSOR_CHAIN'
 */
export function getHierarchyTypeForRecipient(type: RecipientType): HierarchyType | null {
  // eslint-disable-next-line security/detect-object-injection -- Safe: type is constrained to RecipientType enum values
  const rules = HIERARCHY_RULES[type]
  return rules.hierarchyType
}

/**
 * Validate recipient and external organization belong to same tenant
 *
 * SECURITY: Prevents cross-tenant data leakage when linking Recipients to ExternalOrganizations
 *
 * Ensures that when a Recipient references an ExternalOrganization, both entities
 * belong to the same organization (tenant), preventing unauthorized access to
 * external organization data from other tenants.
 *
 * @param recipientOrganizationId - Organization ID of the recipient
 * @param externalOrganizationId - ExternalOrganization ID to link
 * @returns ValidationResult - Contains isValid flag and any errors/warnings
 *
 * @example
 * const result = await validateRecipientExternalOrgTenant('org-id', 'ext-org-id')
 * if (!result.isValid) {
 *   console.error('Validation failed:', result.errors)
 * }
 */
export async function validateRecipientExternalOrgTenant(
  recipientOrganizationId: string,
  externalOrganizationId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  const externalOrg = await prisma.externalOrganization.findUnique({
    where: { id: externalOrganizationId },
    select: { organizationId: true },
  })

  if (!externalOrg) {
    errors.push(`ExternalOrganization with ID ${externalOrganizationId} not found`)
  } else if (externalOrg.organizationId !== recipientOrganizationId) {
    errors.push('ExternalOrganization belongs to a different organization')
  }

  return { isValid: errors.length === 0, errors, warnings }
}
