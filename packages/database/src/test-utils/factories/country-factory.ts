import type { Country, PrismaClient } from '../../index'
import { Factory } from './base-factory'

/**
 * Type for building Country data (excludes auto-generated fields)
 */
type CountryBuildData = Omit<Country, 'id' | 'createdAt' | 'updatedAt'>

// Global sequence counter shared across all factory instances
// to ensure truly unique ISO codes even when tests run in parallel
let globalCountrySequence = 0

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
   * Generates unique ISO codes using global sequence + high-resolution timestamp
   * to avoid conflicts even when multiple test suites run in parallel
   */
  protected defaults(): Partial<CountryBuildData> {
    // Use global sequence + microseconds for maximum uniqueness across parallel test runs
    const seq = ++globalCountrySequence
    const microtime = (Date.now() * 1000 + Math.floor(Math.random() * 1000)).toString()

    // Create 2-char ISO code: Letter + alphanumeric from microtime
    const firstChar = String.fromCharCode(65 + (seq % 26)) // A-Z rotation
    const secondChar = microtime.slice(-1) // Last digit of microtime
    const isoCode = `${firstChar}${secondChar}` // e.g., "A7", "B3", "C9", ...

    // Create 3-char ISO code: Letter + 2 alphanumerics from microtime
    const isoCode3 = `${String.fromCharCode(65 + (seq % 26))}${microtime.slice(-2)}` // e.g., "A47", "B89", ...

    return {
      name: `Test Country ${seq} (${microtime.slice(-4)})`, // Include timestamp fragment for debugging
      isoCode: isoCode,
      isoCode3: isoCode3,
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

/**
 * Pre-configured factory for third countries
 * These countries have gdprStatus 'Third Country' without adequacy decision
 */
export const createThirdCountryFactory = (prisma?: PrismaClient) =>
  new CountryFactory(prisma).params({
    gdprStatus: ['Third Country'],
    description: 'Third Country without Adequacy Decision',
  })

/**
 * Helper function to clean up test countries by their IDs
 * Deletes all countries with the given IDs and their related data
 *
 * @param countryIds - Array of country IDs to delete
 * @param prisma - Optional Prisma client instance (uses singleton if not provided)
 *
 * @example
 * await cleanupTestCountries([country1.id, country2.id])
 */
export async function cleanupTestCountries(
  countryIds: string[],
  prisma?: PrismaClient
): Promise<void> {
  const db = prisma ?? (await import('../../index')).prisma

  if (countryIds.length === 0) return

  // Delete countries (cascade will handle related records if configured)
  await db.country.deleteMany({
    where: {
      id: { in: countryIds },
    },
  })
}
