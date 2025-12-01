import type { DataSubjectCategory, PrismaClient } from '../../index'
import { Factory } from './base-factory'

/**
 * Type for building DataSubjectCategory data (excludes auto-generated fields)
 */
type DataSubjectCategoryBuildData = Omit<DataSubjectCategory, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Factory for generating DataSubjectCategory test data
 * Generates valid data subject category data that passes validation
 *
 * @example
 * // Build data without persisting
 * const categoryData = new DataSubjectCategoryFactory().build()
 *
 * // Create and persist to database
 * const category = await new DataSubjectCategoryFactory().create({ name: 'Test Customer' })
 *
 * // Create vulnerable category
 * const vulnerableCategory = await createVulnerableDataSubjectCategoryFactory().create()
 */
export class DataSubjectCategoryFactory extends Factory<
  DataSubjectCategory,
  DataSubjectCategoryBuildData
> {
  /**
   * Define default values for a DataSubjectCategory
   */
  protected defaults(): Partial<DataSubjectCategoryBuildData> {
    const seq = this.nextSequence()
    const code = `DSC${seq.toString().padStart(3, '0')}`

    return {
      code: code,
      name: `Test Data Subject Category ${seq}`,
      description: `Test description for data subject category ${seq}`,
      category: 'test',
      examples: [
        `Example data subject ${seq}-1`,
        `Example data subject ${seq}-2`,
        `Example data subject ${seq}-3`,
      ],
      isVulnerable: false,
      vulnerabilityReason: null,
      vulnerabilityArticle: null,
      gdprArticle: null,
      suggestsDPIA: false,
      dpiaRationale: null,
      isActive: true,
      isSystemDefined: false,
      organizationId: null,
    }
  }

  /**
   * Persist the data subject category to the database
   */
  protected async persist(data: DataSubjectCategoryBuildData): Promise<DataSubjectCategory> {
    return this.prisma.dataSubjectCategory.create({
      data: data as Parameters<typeof this.prisma.dataSubjectCategory.create>[0]['data'],
    })
  }
}

/**
 * Pre-configured factory for vulnerable data subject categories
 * Categories that represent vulnerable data subjects requiring special protection
 */
export const createVulnerableDataSubjectCategoryFactory = (prisma?: PrismaClient) =>
  new DataSubjectCategoryFactory(prisma).params({
    category: 'vulnerable',
    isVulnerable: true,
    vulnerabilityReason: 'Test vulnerability reason for special protection requirements',
    vulnerabilityArticle: 'Art. 35(3)(b)',
    suggestsDPIA: true,
    dpiaRationale: 'Processing of vulnerable data subjects typically requires impact assessment',
  })

/**
 * Pre-configured factory for organization-specific data subject categories
 * Creates categories scoped to a specific organization
 */
export const createOrganizationDataSubjectCategoryFactory = (
  organizationId: string,
  prisma?: PrismaClient
) =>
  new DataSubjectCategoryFactory(prisma).params({
    organizationId,
    isSystemDefined: false,
  })
