import { Prisma } from '@compilothq/database'
import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'

import { handlePrismaError } from '@/server/utils/prisma-errors'

/**
 * Prisma Error Transformer - Integration Tests
 *
 * Tests the transformation of Prisma errors to user-friendly TRPCErrors.
 * Covers common Prisma error codes that occur in production.
 */
describe('handlePrismaError', () => {
  describe('P2002 - Unique constraint violation', () => {
    it('should transform P2002 to CONFLICT error', async () => {
      // Arrange - Create a promise that rejects with P2002 error
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        {
          code: 'P2002',
          clientVersion: '5.22.0',
          meta: {
            target: ['email'],
          },
        }
      )

      const promise = Promise.reject(prismaError)

      // Act & Assert - Should transform to CONFLICT
      await expect(handlePrismaError(promise)).rejects.toThrow(TRPCError)

      try {
        await handlePrismaError(promise)
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('CONFLICT')
        expect((error as TRPCError).message).toContain('already exists')
        // Should NOT expose database internals
        expect((error as TRPCError).message).not.toContain('Prisma')
        expect((error as TRPCError).message).not.toContain('constraint')
      }
    })

    it('should include field name in error message when available', async () => {
      // Arrange - P2002 with specific field in meta
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
        meta: {
          target: ['organizationSlug'],
        },
      })

      const promise = Promise.reject(prismaError)

      // Act & Assert
      try {
        await handlePrismaError(promise)
      } catch (error) {
        expect((error as TRPCError).message).toContain('organizationSlug')
      }
    })
  })

  describe('P2025 - Record not found', () => {
    it('should transform P2025 to NOT_FOUND error', async () => {
      // Arrange - Create a promise that rejects with P2025 error
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        {
          code: 'P2025',
          clientVersion: '5.22.0',
          meta: {
            cause: 'Record to update not found.',
          },
        }
      )

      const promise = Promise.reject(prismaError)

      // Act & Assert - Should transform to NOT_FOUND
      await expect(handlePrismaError(promise)).rejects.toThrow(TRPCError)

      try {
        await handlePrismaError(promise)
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
        expect((error as TRPCError).message).toContain('not found')
        // Should be user-friendly
        expect((error as TRPCError).message).not.toContain('operation failed')
      }
    })
  })

  describe('P2003 - Foreign key constraint violation', () => {
    it('should transform P2003 to BAD_REQUEST error', async () => {
      // Arrange - Create a promise that rejects with P2003 error
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed on the field: `organizationId`',
        {
          code: 'P2003',
          clientVersion: '5.22.0',
          meta: {
            field_name: 'organizationId',
          },
        }
      )

      const promise = Promise.reject(prismaError)

      // Act & Assert - Should transform to BAD_REQUEST
      await expect(handlePrismaError(promise)).rejects.toThrow(TRPCError)

      try {
        await handlePrismaError(promise)
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('BAD_REQUEST')
        expect((error as TRPCError).message).toContain('Invalid')
        // Should NOT expose database internals
        expect((error as TRPCError).message).not.toContain('foreign key')
      }
    })
  })

  describe('Non-Prisma errors', () => {
    it('should pass through non-Prisma errors unchanged', async () => {
      // Arrange - Create a promise that rejects with a generic error
      const genericError = new Error('Something went wrong')
      const promise = Promise.reject(genericError)

      // Act & Assert - Should pass through the original error
      await expect(handlePrismaError(promise)).rejects.toThrow('Something went wrong')

      try {
        await handlePrismaError(promise)
      } catch (error) {
        expect(error).toBe(genericError)
        expect(error).not.toBeInstanceOf(TRPCError)
      }
    })

    it('should pass through TRPCError unchanged', async () => {
      // Arrange - Create a promise that rejects with a TRPCError
      const trpcError = new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authorized',
      })
      const promise = Promise.reject(trpcError)

      // Act & Assert - Should pass through the TRPCError
      await expect(handlePrismaError(promise)).rejects.toThrow(TRPCError)

      try {
        await handlePrismaError(promise)
      } catch (error) {
        expect(error).toBe(trpcError)
        expect((error as TRPCError).code).toBe('UNAUTHORIZED')
      }
    })

    it('should pass through unknown Prisma error codes', async () => {
      // Arrange - Create a promise with unknown Prisma error code
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unknown error', {
        code: 'P9999',
        clientVersion: '5.22.0',
      })

      const promise = Promise.reject(prismaError)

      // Act & Assert - Should pass through unknown codes
      await expect(handlePrismaError(promise)).rejects.toThrow('Unknown error')

      try {
        await handlePrismaError(promise)
      } catch (error) {
        expect(error).toBe(prismaError)
        expect(error).not.toBeInstanceOf(TRPCError)
      }
    })
  })

  describe('Type safety and return values', () => {
    it('should preserve resolved value type with generics', async () => {
      // Arrange - Create a promise that resolves with typed data
      interface TestData {
        id: string
        name: string
      }

      const testData: TestData = {
        id: '123',
        name: 'Test',
      }

      const promise: Promise<TestData> = Promise.resolve(testData)

      // Act
      const result = await handlePrismaError(promise)

      // Assert - Type inference should work
      expect(result).toEqual(testData)
      expect(result.id).toBe('123')
      expect(result.name).toBe('Test')

      // TypeScript should infer result as TestData, not unknown
      const typedId: string = result.id // This should compile without type assertion
      expect(typedId).toBe('123')
    })
  })
})
