'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'

import type { AppRouter } from '@/server/routers/_app'

export const trpc = createTRPCReact<AppRouter>()

/**
 * Create a QueryClient with optimized defaults for the tRPC client
 *
 * Configuration:
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - gcTime: 10 minutes - Unused cache data is garbage collected after 10 minutes
 * - retry: Up to 3 retries for network errors with exponential backoff
 * - onError: Global error handling for logging and user feedback
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache configuration
        staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time

        // Retry configuration for transient network errors
        retry: (failureCount, error) => {
          // Don't retry more than 3 times
          if (failureCount >= 3) return false

          // Only retry on network errors, not on application errors (4xx, 5xx)
          // Network errors typically have specific error messages
          const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
          const isNetworkError =
            errorMessage.includes('network') ||
            errorMessage.includes('fetch') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('connection')

          return isNetworkError
        },

        // Exponential backoff for retries: 1s, 2s, 4s
        retryDelay: (attemptIndex) => {
          return Math.min(1000 * 2 ** attemptIndex, 30000)
        },
      },
    },
  })
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = createQueryClient()

    // Global error handler for logging and analytics
    client.getQueryCache().config.onError = (error, query) => {
      // Log errors for monitoring and debugging
      console.error('[tRPC Query Error]', {
        error,
        queryKey: query.queryKey,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })

      // In production, you could send this to an error tracking service
      // Example: Sentry.captureException(error, { contexts: { query: { key: query.queryKey } } })
    }

    return client
  })

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')}/api/trpc`,
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
