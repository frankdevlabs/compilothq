import { prisma } from '../index'
import type { Country } from '.prisma/client'

/**
 * List all countries ordered by name
 */
export async function listCountries(): Promise<Country[]> {
  return prisma.country.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get a country by its ID
 */
export async function getCountryById(id: string): Promise<Country | null> {
  return prisma.country.findUnique({
    where: { id },
  })
}

/**
 * Get a country by its ISO 2-letter code
 */
export async function getCountryByIsoCode(isoCode: string): Promise<Country | null> {
  return prisma.country.findUnique({
    where: { isoCode },
  })
}

/**
 * Get a country by its ISO 3-letter code
 */
export async function getCountryByIsoCode3(isoCode3: string): Promise<Country | null> {
  return prisma.country.findUnique({
    where: { isoCode3 },
  })
}

/**
 * Get countries by GDPR status
 * @param status - GDPR status to filter by (e.g., "EU", "EEA", "Adequate", "Third Country")
 */
export async function getCountriesByGdprStatus(status: string): Promise<Country[]> {
  // Query countries where the JSON array contains the specified status
  const countries = await prisma.country.findMany({
    where: {
      isActive: true,
    },
    orderBy: { name: 'asc' },
  })

  // Filter in application code since Prisma JSON array queries can be complex
  return countries.filter((country) => {
    const gdprStatus = country.gdprStatus as string[]
    return gdprStatus.includes(status)
  })
}
