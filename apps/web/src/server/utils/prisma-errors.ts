import { Prisma } from '@compilothq/database'
import { TRPCError } from '@trpc/server'

/**
 * Transforms Prisma errors to user-friendly TRPCErrors
 *
 * Maps common Prisma error codes to appropriate TRPC error codes:
 * - P2002 (unique constraint violation) -> CONFLICT
 * - P2025 (record not found) -> NOT_FOUND
 * - P2003 (foreign key constraint) -> BAD_REQUEST
 *
 * Non-Prisma errors and unknown Prisma error codes are passed through unchanged.
 *
 * @param promise - A promise that may reject with a Prisma error
 * @returns The same promise, but with Prisma errors transformed to TRPCErrors
 *
 * @example
 * ```typescript
 * // In a tRPC procedure
 * const user = await handlePrismaError(
 *   prisma.user.create({ data: { email: 'test@example.com' } })
 * )
 * ```
 */
export async function handlePrismaError<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    // If it's already a TRPCError, pass it through
    if (error instanceof TRPCError) {
      throw error
    }

    // If it's not a Prisma error, pass it through
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      throw error
    }

    // Transform known Prisma error codes to TRPCErrors
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        // Extract field name from meta if available
        const target = error.meta?.target as string[] | undefined
        const fieldName = Array.isArray(target) && target.length > 0 ? String(target[0]) : 'field'

        throw new TRPCError({
          code: 'CONFLICT',
          message: `A record with this ${fieldName} already exists. Please use a different value.`,
        })
      }

      case 'P2025': {
        // Record not found (typically from update/delete operations)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'The requested record was not found.',
        })
      }

      case 'P2003': {
        // Foreign key constraint violation
        // Extract field name from meta if available
        const fieldName = String(error.meta?.field_name ?? 'reference')

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid ${fieldName}: the referenced record does not exist.`,
        })
      }

      default:
        // Unknown Prisma error code - pass through the original error
        // This allows debugging while still being safe
        throw error
    }
  }
}
