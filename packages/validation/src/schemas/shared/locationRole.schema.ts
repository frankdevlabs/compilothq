import { z } from 'zod'

/**
 * Location role enum for geographic compliance tracking
 *
 * Used across digital assets and recipients to indicate:
 * - HOSTING: Physical server location / infrastructure hosting
 * - PROCESSING: Active data processing operations
 * - BOTH: Combined hosting and processing activities
 *
 * This is a shared domain concept for transfer analysis and compliance reporting.
 */
export const LocationRoleSchema = z.enum(['HOSTING', 'PROCESSING', 'BOTH'], {
  message: 'Invalid location role. Must be one of: HOSTING, PROCESSING, BOTH',
})

/**
 * Inferred TypeScript type for location role
 */
export type LocationRole = z.infer<typeof LocationRoleSchema>
