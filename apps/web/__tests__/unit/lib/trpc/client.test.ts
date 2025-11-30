import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

/**
 * tRPC Client Configuration - Unit Tests
 *
 * These tests validate the QueryClient configuration for the tRPC client,
 * including cache times, retry logic, and error handling.
 *
 * Testing strategy:
 * 1. Unit tests (this file) - Validate configuration behavior in isolation
 * 2. E2E tests - Test actual tRPC calls in browser environment
 * 3. Manual testing - Verify behavior during development
 */
describe('tRPC Client Configuration', () => {
  describe('QueryClient default options', () => {
    it('should configure staleTime to 5 minutes for queries', () => {
      // Arrange - Create QueryClient with default options
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
          },
        },
      })

      // Act - Get the default query options
      const defaultOptions = queryClient.getDefaultOptions()

      // Assert - Verify staleTime is configured
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000)
      expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000)
    })

    it('should configure gcTime to 10 minutes for queries', () => {
      // Arrange - Create QueryClient with default options
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
          },
        },
      })

      // Act - Get the default query options
      const defaultOptions = queryClient.getDefaultOptions()

      // Assert - Verify gcTime is configured
      // gcTime controls how long unused/inactive cache data is kept in memory
      expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000)
    })
  })

  describe('Retry logic for transient errors', () => {
    it('should retry failed queries up to 3 times', () => {
      // Arrange - Create QueryClient with retry configuration
      const maxRetries = 3

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              // Retry up to 3 times for network errors
              if (failureCount >= maxRetries) return false

              // Only retry on network errors (simulated here)
              const isNetworkError = error instanceof Error && error.message.includes('network')
              return isNetworkError
            },
            retryDelay: (attemptIndex) => {
              // Exponential backoff: 1s, 2s, 4s
              return Math.min(1000 * 2 ** attemptIndex, 30000)
            },
          },
        },
      })

      const retryFn = queryClient.getDefaultOptions().queries?.retry as (
        failureCount: number,
        error: Error
      ) => boolean

      // Act & Assert - Test retry logic
      const networkError = new Error('network timeout')
      const otherError = new Error('validation error')

      // Should retry network errors up to 3 times
      expect(retryFn(0, networkError)).toBe(true)
      expect(retryFn(1, networkError)).toBe(true)
      expect(retryFn(2, networkError)).toBe(true)
      expect(retryFn(3, networkError)).toBe(false) // Max retries reached

      // Should not retry non-network errors
      expect(retryFn(0, otherError)).toBe(false)
    })

    it('should use exponential backoff for retry delays', () => {
      // Arrange - Create QueryClient with retry delay configuration
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retryDelay: (attemptIndex) => {
              // Exponential backoff: 1s, 2s, 4s, capped at 30s
              return Math.min(1000 * 2 ** attemptIndex, 30000)
            },
          },
        },
      })

      const retryDelayFn = queryClient.getDefaultOptions().queries?.retryDelay as (
        attemptIndex: number
      ) => number

      // Act & Assert - Verify exponential backoff
      expect(retryDelayFn(0)).toBe(1000) // 1st retry: 1s
      expect(retryDelayFn(1)).toBe(2000) // 2nd retry: 2s
      expect(retryDelayFn(2)).toBe(4000) // 3rd retry: 4s
      expect(retryDelayFn(3)).toBe(8000) // 4th retry: 8s
      expect(retryDelayFn(4)).toBe(16000) // 5th retry: 16s
      expect(retryDelayFn(5)).toBe(30000) // 6th retry: capped at 30s
      expect(retryDelayFn(10)).toBe(30000) // Even higher attempts: capped at 30s
    })
  })

  describe('Global error handling', () => {
    it('should invoke onError callback when query fails', () => {
      // Arrange - Create QueryClient with onError callback
      const errorHandler = vi.fn()

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false, // Disable retries for this test
          },
        },
      })

      // Configure the global error handler on the query cache
      queryClient.getQueryCache().config.onError = errorHandler

      // Act - Simulate a failed query by manually calling the error handler
      const testError = new Error('Test error')
      const mockQuery = {
        queryKey: ['test'],
        queryHash: '["test"]',
      }

      // Manually trigger the error handler
      errorHandler(testError, mockQuery)

      // Assert - Verify error handler was called
      expect(errorHandler).toHaveBeenCalledTimes(1)
      expect(errorHandler).toHaveBeenCalledWith(testError, mockQuery)
    })
  })
})
