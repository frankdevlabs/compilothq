import type { PrismaClient, Purpose, PurposeCategory, PurposeScope } from '../../index'
import { Factory } from './base-factory'

/**
 * Type for building Purpose data (excludes auto-generated fields)
 */
type PurposeBuildData = Omit<Purpose, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Factory for generating Purpose test data
 * Generates valid purpose data that passes validation
 *
 * @example
 * // Build data without persisting (requires organizationId)
 * const purposeData = new PurposeFactory().build({ organizationId: 'org-123' })
 *
 * // Create and persist to database
 * const purpose = await new PurposeFactory().create({
 *   name: 'Marketing Communications',
 *   organizationId: 'org-123'
 * })
 *
 * // Create marketing purpose
 * const marketing = await new PurposeFactory()
 *   .params({ category: 'MARKETING', scope: 'EXTERNAL' })
 *   .create({ organizationId: 'org-123' })
 */
export class PurposeFactory extends Factory<Purpose, PurposeBuildData> {
  /**
   * Define default values for a Purpose
   * Note: organizationId MUST be provided when building/creating
   */
  protected defaults(): Partial<PurposeBuildData> {
    const seq = this.nextSequence()

    return {
      name: `Test Purpose ${seq}`,
      description: `Description for test purpose ${seq}`,
      category: 'OTHER' as PurposeCategory,
      scope: 'INTERNAL' as PurposeScope,
      isActive: true,
      // organizationId is required and must be provided by caller
    }
  }

  /**
   * Persist the purpose to the database
   */
  protected async persist(data: PurposeBuildData): Promise<Purpose> {
    return this.prisma.purpose.create({
      data: {
        ...data,
        description: data.description ?? undefined,
      },
    })
  }
}

/**
 * Pre-configured factory for marketing purposes
 * Marketing purposes are typically external scope
 */
export const createMarketingPurposeFactory = (prisma?: PrismaClient) =>
  new PurposeFactory(prisma).params({
    category: 'MARKETING' as PurposeCategory,
    scope: 'EXTERNAL' as PurposeScope,
    description: 'Marketing communications and campaigns',
  })

/**
 * Pre-configured factory for analytics purposes
 * Analytics purposes are typically internal scope
 */
export const createAnalyticsPurposeFactory = (prisma?: PrismaClient) =>
  new PurposeFactory(prisma).params({
    category: 'ANALYTICS' as PurposeCategory,
    scope: 'INTERNAL' as PurposeScope,
    description: 'Business intelligence and usage analytics',
  })

/**
 * Pre-configured factory for customer service purposes
 * Customer service purposes can be both internal and external
 */
export const createCustomerServicePurposeFactory = (prisma?: PrismaClient) =>
  new PurposeFactory(prisma).params({
    category: 'CUSTOMER_SERVICE' as PurposeCategory,
    scope: 'BOTH' as PurposeScope,
    description: 'Customer support and helpdesk services',
  })
