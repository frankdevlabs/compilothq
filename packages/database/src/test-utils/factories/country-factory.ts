import { Factory } from './base-factory'
import type { Country, PrismaClient } from '.prisma/client'

/**
 * Type for building Country data (excludes auto-generated fields)
 */
type CountryBuildData = Omit<Country, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Factory for generating Country test data
 * Generates valid country data that passes Zod validation
 *
 * @example
 * // Build data without persisting
 * const countryData = new CountryFactory().build()
 *
 * // Create and persist to database
 * const country = await new CountryFactory().create({ name: 'France' })
 *
 * // Create with custom params
 * const euCountry = await new CountryFactory().params({ gdprStatus: ['EU', 'EEA'] }).create()
 */
export class CountryFactory extends Factory<Country, CountryBuildData> {
  /**
   * Define default values for a Country
   * Generates unique ISO codes using sequence number to avoid conflicts
   */
  protected defaults(): Partial<CountryBuildData> {
    const seq = this.nextSequence()
    const isoCode = `T${seq.toString().padStart(1, '0')}`
    const isoCode3 = `TS${seq.toString().padStart(1, '0')}`

    return {
      name: `Test Country ${seq}`,
      isoCode: isoCode.toUpperCase().substring(0, 2),
      isoCode3: isoCode3.toUpperCase().substring(0, 3),
      gdprStatus: ['Third Country'],
      description: `Test country for GDPR compliance testing`,
      isActive: true,
    }
  }

  /**
   * Persist the country data to the database
   */
  protected async persist(data: CountryBuildData): Promise<Country> {
    return this.prisma.country.create({
      data: data as Parameters<typeof this.prisma.country.create>[0]['data'],
    })
  }
}

/**
 * Pre-configured factory for EU countries
 * EU countries have gdprStatus including 'EU' and 'EEA'
 */
export const createEUCountryFactory = (prisma?: PrismaClient) =>
  new CountryFactory(prisma).params({
    gdprStatus: ['EU', 'EEA'],
    description: 'EU Member State',
  })

/**
 * Pre-configured factory for EEA countries (non-EU)
 * EEA countries have gdprStatus including 'EEA' but not 'EU'
 */
export const createEEACountryFactory = (prisma?: PrismaClient) =>
  new CountryFactory(prisma).params({
    gdprStatus: ['EEA'],
    description: 'EEA Member (non-EU)',
  })

/**
 * Pre-configured factory for third countries with adequacy decision
 * These countries have gdprStatus including 'Third Country' and 'Adequate'
 */
export const createAdequateCountryFactory = (prisma?: PrismaClient) =>
  new CountryFactory(prisma).params({
    gdprStatus: ['Third Country', 'Adequate'],
    description: 'Third Country with Adequacy Decision',
  })
