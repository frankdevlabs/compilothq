import { dehydrate, QueryClient } from '@tanstack/react-query'

/**
 * Prefetch utilities for optimizing perceived performance in React Server Components
 *
 * These utilities allow you to prefetch tRPC queries in server components and pass
 * the prefetched data to client components via HydrationBoundary. This eliminates
 * the loading state on initial page load while maintaining client-side interactivity.
 *
 * @example
 * ```typescript
 * // In a layout.tsx or page.tsx (server component)
 * import { HydrationBoundary } from '@tanstack/react-query'
 * import { prefetchQuery } from '@/lib/trpc/prefetch'
 * import { ActivityList } from '@/components/activities/ActivityList'
 *
 * export default async function ActivitiesPage() {
 *   const queryClient = await prefetchQuery('dataProcessingActivity.list', async () => {
 *     return api.dataProcessingActivity.list({ limit: 50 })
 *   })
 *
 *   return (
 *     <HydrationBoundary state={dehydrate(queryClient)}>
 *       <ActivityList />
 *     </HydrationBoundary>
 *   )
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In the client component (ActivityList.tsx)
 * 'use client'
 * import { trpc } from '@/lib/trpc/client'
 *
 * export function ActivityList() {
 *   // This will use the prefetched data on initial render, no loading state!
 *   const { data, isLoading } = trpc.dataProcessingActivity.list.useQuery({ limit: 50 })
 *
 *   // data is immediately available from prefetch
 *   return <div>{data?.map(activity => ...)}</div>
 * }
 * ```
 */

/**
 * Prefetch a tRPC query in a server component
 *
 * Creates a QueryClient, prefetches the data using the server-side caller,
 * and returns the hydrated client for passing to HydrationBoundary.
 *
 * @param queryKey - The query key (should match client-side usage)
 * @param queryFn - Async function that calls the server-side tRPC procedure
 * @returns QueryClient with prefetched data
 *
 * @example
 * ```typescript
 * const queryClient = await prefetchQuery('dataProcessingActivity.list', async () => {
 *   return api.dataProcessingActivity.list({ limit: 50 })
 * })
 * ```
 */
export async function prefetchQuery<TData>(
  queryKey: string | readonly unknown[],
  queryFn: () => Promise<TData>
): Promise<QueryClient> {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
  })

  return queryClient
}

/**
 * Prefetch multiple tRPC queries in parallel
 *
 * Useful when a page needs to prefetch several independent queries.
 * Runs all prefetch operations in parallel for optimal performance.
 *
 * @param queries - Array of query configurations
 * @returns QueryClient with all prefetched data
 *
 * @example
 * ```typescript
 * const queryClient = await prefetchQueries([
 *   {
 *     queryKey: 'dataProcessingActivity.list',
 *     queryFn: () => api.dataProcessingActivity.list({ limit: 50 }),
 *   },
 *   {
 *     queryKey: 'processor.list',
 *     queryFn: () => api.processor.list({ limit: 20 }),
 *   },
 * ])
 * ```
 */
export async function prefetchQueries(
  queries: Array<{
    queryKey: string | readonly unknown[]
    queryFn: () => Promise<unknown>
  }>
): Promise<QueryClient> {
  const queryClient = new QueryClient()

  await Promise.all(
    queries.map(async (query) =>
      queryClient.prefetchQuery({
        queryKey: Array.isArray(query.queryKey) ? query.queryKey : [query.queryKey],
        queryFn: query.queryFn,
      })
    )
  )

  return queryClient
}

/**
 * Helper function to get dehydrated state for HydrationBoundary
 *
 * This is a convenience wrapper around `dehydrate()` that makes the
 * prefetch pattern more explicit.
 *
 * @param queryClient - The QueryClient with prefetched data
 * @returns Dehydrated state for HydrationBoundary
 *
 * @example
 * ```typescript
 * const queryClient = await prefetchQuery('dataProcessingActivity.list', () => api.dataProcessingActivity.list())
 * const dehydratedState = getDehydratedState(queryClient)
 *
 * return (
 *   <HydrationBoundary state={dehydratedState}>
 *     <ActivityList />
 *   </HydrationBoundary>
 * )
 * ```
 */
export function getDehydratedState(queryClient: QueryClient) {
  return dehydrate(queryClient)
}

/**
 * Complete prefetch pattern example:
 *
 * ```typescript
 * // Server Component (app/activities/page.tsx)
 * import { HydrationBoundary } from '@tanstack/react-query'
 * import { prefetchQuery, getDehydratedState } from '@/lib/trpc/prefetch'
 * import { api } from '@/lib/trpc/server'
 * import { ActivityList } from './ActivityList'
 *
 * export default async function ActivitiesPage() {
 *   const queryClient = await prefetchQuery('dataProcessingActivity.list', () => {
 *     return api.dataProcessingActivity.list({ limit: 50 })
 *   })
 *
 *   return (
 *     <HydrationBoundary state={getDehydratedState(queryClient)}>
 *       <ActivityList />
 *     </HydrationBoundary>
 *   )
 * }
 * ```
 *
 * ```typescript
 * // Client Component (ActivityList.tsx)
 * 'use client'
 * import { trpc } from '@/lib/trpc/client'
 *
 * export function ActivityList() {
 *   const { data } = trpc.dataProcessingActivity.list.useQuery({ limit: 50 })
 *
 *   // Data is immediately available from prefetch, no loading spinner!
 *   return (
 *     <div>
 *       {data?.map((activity) => (
 *         <ActivityCard key={activity.id} activity={activity} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * Benefits:
 * - No loading state on initial page load (data prefetched on server)
 * - Full client-side interactivity (refetch, mutations work normally)
 * - Type-safe end-to-end (tRPC inference works for both server and client)
 * - SEO-friendly (data rendered on server)
 * - Optimal perceived performance (instant content display)
 */
