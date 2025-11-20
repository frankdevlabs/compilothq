import { Factory } from './base-factory'
import type { DataNature, DataNatureType, PrismaClient } from '.prisma/client'

/**
 * Type for building DataNature data (excludes auto-generated fields)
 */
type DataNatureBuildData = Omit<DataNature, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Factory for generating DataNature test data
 * Generates valid data nature data that passes Zod validation
 *
 * @example
 * // Build data without persisting
 * const dataNatureData = new DataNatureFactory().build()
 *
 * // Create and persist to database
 * const dataNature = await new DataNatureFactory().create({ name: 'Health Data' })
 *
 * // Create special category data
 * const specialData = await new DataNatureFactory()
 *   .params({ type: 'SPECIAL' })
 *   .create()
 */
export class DataNatureFactory extends Factory<DataNature, DataNatureBuildData> {
  /**
   * Define default values for a DataNature
   */
  protected defaults(): Partial<DataNatureBuildData> {
    const seq = this.nextSequence()

    return {
      name: `Test Data Nature ${seq}`,
      description: `Description for test data nature ${seq}`,
      type: 'NON_SPECIAL' as DataNatureType,
      gdprArticle: 'Art. 4(1)',
      isActive: true,
    }
  }

  /**
   * Persist the data nature to the database
   */
  protected async persist(data: DataNatureBuildData): Promise<DataNature> {
    return this.prisma.dataNature.create({
      data,
    })
  }
}

/**
 * Pre-configured factory for special category data
 * Special category data is defined in GDPR Article 9
 */
export const createSpecialDataNatureFactory = (prisma?: PrismaClient) =>
  new DataNatureFactory(prisma).params({
    type: 'SPECIAL' as DataNatureType,
    gdprArticle: 'Art. 9(1)',
    description: 'Special category of personal data requiring enhanced protection',
  })

/**
 * Pre-configured factory for non-special category data
 * Standard personal data not requiring special protection
 */
export const createNonSpecialDataNatureFactory = (prisma?: PrismaClient) =>
  new DataNatureFactory(prisma).params({
    type: 'NON_SPECIAL' as DataNatureType,
    gdprArticle: 'Art. 4(1)',
    description: 'Standard personal data',
  })
