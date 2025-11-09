import type { RecipientCategory } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import { Factory } from './base-factory'

/**
 * Type for building RecipientCategory data (excludes auto-generated fields)
 */
type RecipientCategoryBuildData = Omit<RecipientCategory, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Factory for generating RecipientCategory test data
 * Generates valid recipient category data that passes Zod validation
 *
 * @example
 * // Build data without persisting
 * const categoryData = new RecipientCategoryFactory().build()
 *
 * // Create and persist to database
 * const category = await new RecipientCategoryFactory().create({ name: 'Service Providers' })
 *
 * // Create category requiring DPA
 * const dpaCategory = await new RecipientCategoryFactory()
 *   .params({ requiresDPA: true })
 *   .create()
 */
export class RecipientCategoryFactory extends Factory<
  RecipientCategory,
  RecipientCategoryBuildData
> {
  /**
   * Define default values for a RecipientCategory
   */
  protected defaults(): Partial<RecipientCategoryBuildData> {
    const seq = this.nextSequence()
    const code = `RC${seq.toString().padStart(3, '0')}`

    return {
      code: code,
      name: `Test Recipient Category ${seq}`,
      examples: [
        `Example recipient ${seq}-1`,
        `Example recipient ${seq}-2`,
        `Example recipient ${seq}-3`,
      ],
      commonReasons: `Common reasons for sharing data with test category ${seq}`,
      requiresDPA: false,
      requiresImpactAssessment: false,
      defaultRole: 'Processor',
      isActive: true,
    }
  }

  /**
   * Persist the recipient category to the database
   */
  protected async persist(data: RecipientCategoryBuildData): Promise<RecipientCategory> {
    return this.prisma.recipientCategory.create({
      data,
    })
  }
}

/**
 * Pre-configured factory for recipients requiring DPA
 * Categories that require Data Processing Agreement
 */
export const createDPARequiredRecipientCategoryFactory = (prisma?: PrismaClient) =>
  new RecipientCategoryFactory(prisma).params({
    requiresDPA: true,
    defaultRole: 'Processor',
    commonReasons: 'Processing personal data on behalf of the controller',
  })

/**
 * Pre-configured factory for recipients requiring impact assessment
 * High-risk recipient categories requiring impact assessment
 */
export const createImpactAssessmentRequiredRecipientCategoryFactory = (prisma?: PrismaClient) =>
  new RecipientCategoryFactory(prisma).params({
    requiresImpactAssessment: true,
    commonReasons: 'High-risk processing requiring impact assessment',
  })

/**
 * Pre-configured factory for joint controller recipients
 * Recipients acting as joint controllers
 */
export const createJointControllerRecipientCategoryFactory = (prisma?: PrismaClient) =>
  new RecipientCategoryFactory(prisma).params({
    defaultRole: 'Joint Controller',
    requiresDPA: false,
    commonReasons: 'Shared processing responsibilities',
  })
