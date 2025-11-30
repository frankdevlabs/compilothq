import { cn } from '@compilothq/ui'
import type { ReactNode } from 'react'

/**
 * Props for the PageContainer component
 */
export interface PageContainerProps {
  /** Page title rendered as h1 heading */
  title: string
  /** Optional subtitle/description below the heading */
  subtitle?: string
  /** Optional pre-rendered breadcrumb component slot */
  breadcrumbs?: ReactNode
  /** Optional right-aligned action buttons area */
  actions?: ReactNode
  /** Page content */
  children: ReactNode
  /** Optional className for additional styling */
  className?: string
  /** Data test id for testing */
  'data-testid'?: string
}

/**
 * PageContainer - Standardized page layout component
 *
 * Provides consistent page structure with:
 * - Title rendered as h1 with appropriate heading styles
 * - Optional subtitle with muted text styling
 * - Optional breadcrumbs slot above the title
 * - Optional actions slot (right-aligned)
 * - Standardized p-6 padding and max-w-7xl responsive constraint
 *
 * This component is server-compatible and does not require client-side state.
 *
 * @example
 * ```tsx
 * <PageContainer
 *   title="Dashboard"
 *   subtitle="Overview of your activities"
 *   breadcrumbs={<Breadcrumb items={[...]} />}
 *   actions={<Button>Create New</Button>}
 * >
 *   <DashboardContent />
 * </PageContainer>
 * ```
 */
export function PageContainer({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  className,
  'data-testid': dataTestId,
}: PageContainerProps) {
  return (
    <div className={cn('mx-auto max-w-7xl p-6', className)} data-testid={dataTestId}>
      {/* Breadcrumbs slot - renders above title section */}
      {breadcrumbs && (
        <div data-slot="breadcrumbs" className="mb-4">
          {breadcrumbs}
        </div>
      )}

      {/* Header section with title and actions */}
      <header data-slot="page-header" className="mb-6 flex items-start justify-between gap-4">
        {/* Title and subtitle group */}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p data-slot="subtitle" className="mt-2 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions slot - right-aligned */}
        {actions && (
          <div data-slot="actions" className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </header>

      {/* Main content area */}
      <main>{children}</main>
    </div>
  )
}
