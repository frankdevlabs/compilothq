import type { PrismaClient } from '../index'

/**
 * Type for Prisma transaction client
 * Automatically inferred from $transaction callback parameter type
 *
 * This is the type you get from:
 * ```typescript
 * prisma.$transaction(async (tx) => {
 *   // tx has type PrismaTransactionClient
 * })
 * ```
 */
export type PrismaTransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

/**
 * Union type accepting both regular Prisma client and transaction client
 *
 * Use this for functions that should work in both contexts:
 * - Direct database access: myFunction(prisma, ...)
 * - Within transactions: myFunction(tx, ...)
 *
 * Example:
 * ```typescript
 * async function myDalFunction(
 *   client: PrismaClientOrTransaction,
 *   data: {...}
 * ) {
 *   await client.myModel.create({ data })
 * }
 * ```
 */
export type PrismaClientOrTransaction = PrismaClient | PrismaTransactionClient
