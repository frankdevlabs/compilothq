import * as React from 'react'

import { cn } from '../lib/utils'

/**
 * Base Skeleton component for loading state placeholders.
 *
 * Uses neutral muted tones (`--muted: oklch(0.97 0 0)`) per design token requirements.
 * Applies subtle pulse animation for loading indication.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-muted animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

/**
 * Props for SkeletonText component.
 */
interface SkeletonTextProps extends React.ComponentProps<'div'> {
  /** Number of lines to render (default: 3) */
  lines?: number
}

/**
 * SkeletonText component for paragraph placeholder.
 *
 * Renders multiple skeleton lines with varying widths to simulate text content.
 * The last line is 75% width to simulate natural text ending.
 */
function SkeletonText({ className, lines = 3, ...props }: SkeletonTextProps) {
  return (
    <div data-slot="skeleton-text" className={cn('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-4', index === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  )
}

/**
 * Props for SkeletonCard component.
 */
interface SkeletonCardProps extends React.ComponentProps<'div'> {
  /** Whether to show action area at the bottom (default: false) */
  showActions?: boolean
  /** Number of content lines to render (default: 3) */
  contentLines?: number
}

/**
 * SkeletonCard component for card placeholder.
 *
 * Combines card structure with skeleton elements to match existing Card component proportions.
 * Includes header area, content lines, and optional action area.
 */
function SkeletonCard({
  className,
  showActions = false,
  contentLines = 3,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn('flex flex-col gap-6 rounded-lg border bg-card shadow-sm', className)}
      {...props}
    >
      {/* Header area matching CardHeader proportions (px-6 pt-6) */}
      <div data-slot="skeleton-card-header" className="grid auto-rows-min gap-2 px-6 pt-6">
        {/* Title skeleton */}
        <Skeleton className="h-5 w-1/3" />
        {/* Description skeleton */}
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Content area matching CardContent proportions (px-6) */}
      <div data-slot="skeleton-card-content" className="px-6">
        <SkeletonText lines={contentLines} />
      </div>

      {/* Optional action area matching CardFooter proportions (px-6 pb-6) */}
      {showActions && (
        <div data-slot="skeleton-card-actions" className="flex items-center gap-2 px-6 pb-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}

      {/* Add bottom padding when no actions */}
      {!showActions && <div className="pb-6" />}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonText }
export type { SkeletonCardProps, SkeletonTextProps }
