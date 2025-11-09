import { z } from 'zod'

/**
 * Validation schema for creating a Country
 * Matches Prisma schema definition
 */
export const CountryCreateSchema = z.object({
  name: z.string().min(1, 'Country name is required'),
  isoCode: z.string().length(2, 'ISO code must be exactly 2 characters').toUpperCase(),
  isoCode3: z
    .string()
    .length(3, 'ISO 3-letter code must be exactly 3 characters')
    .toUpperCase()
    .optional()
    .nullable(),
  gdprStatus: z
    .array(
      z.enum(['EU', 'EEA', 'EFTA', 'Third Country', 'Adequate'], {
        errorMap: () => ({
          message: 'GDPR status must be one of: EU, EEA, EFTA, Third Country, Adequate',
        }),
      })
    )
    .min(1, 'At least one GDPR status is required'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

/**
 * Validation schema for updating a Country
 */
export const CountryUpdateSchema = CountryCreateSchema.partial()

/**
 * Inferred TypeScript types
 */
export type CountryCreate = z.infer<typeof CountryCreateSchema>
export type CountryUpdate = z.infer<typeof CountryUpdateSchema>
