'use client'

import type { ExternalToast } from 'sonner'
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner'

/**
 * Toast duration constants (in milliseconds)
 *
 * Success: 4000ms - Quick acknowledgment
 * Error: 8000ms - Persists longer for users to read and take action
 * Warning: 5000ms - Moderate duration for attention
 * Info: 5000ms - Moderate duration for information
 */
const TOAST_DURATIONS = {
  success: 4000,
  error: 8000,
  warning: 5000,
  info: 5000,
} as const

/**
 * Toast action configuration for undo operations and similar actions
 */
export interface ToastAction {
  /** Label text for the action button */
  label: string
  /** Callback function when action button is clicked */
  onClick: () => void
}

/**
 * Extended toast options with action button support
 */
export interface ToastOptions extends Omit<ExternalToast, 'action'> {
  /** Optional action button configuration */
  action?: ToastAction
}

/**
 * Typed toast helper functions for app-wide usage.
 *
 * Provides consistent styling and durations across the application:
 * - Success: 4s duration, gold accent
 * - Error: 8s duration (persists longer), destructive red
 * - Warning: 5s duration
 * - Info: 5s duration
 *
 * All variants support action buttons for undo operations.
 *
 * @example
 * ```tsx
 * // Simple toast
 * toast.success('Changes saved!')
 *
 * // Toast with action button
 * toast.error('Item deleted', {
 *   action: {
 *     label: 'Undo',
 *     onClick: () => restoreItem()
 *   }
 * })
 * ```
 */
export const toast = {
  /**
   * Show a success toast with gold accent styling.
   * Duration: 4000ms
   */
  success: (message: string | React.ReactNode, options?: ToastOptions): string | number => {
    const { action, ...restOptions } = options ?? {}
    return sonnerToast.success(message, {
      duration: TOAST_DURATIONS.success,
      ...restOptions,
      ...(action && {
        action: {
          label: action.label,
          onClick: action.onClick,
        },
      }),
    })
  },

  /**
   * Show an error toast with destructive red styling.
   * Duration: 8000ms (persists longer for user to read and act)
   */
  error: (message: string | React.ReactNode, options?: ToastOptions): string | number => {
    const { action, ...restOptions } = options ?? {}
    return sonnerToast.error(message, {
      duration: TOAST_DURATIONS.error,
      ...restOptions,
      ...(action && {
        action: {
          label: action.label,
          onClick: action.onClick,
        },
      }),
    })
  },

  /**
   * Show a warning toast.
   * Duration: 5000ms
   */
  warning: (message: string | React.ReactNode, options?: ToastOptions): string | number => {
    const { action, ...restOptions } = options ?? {}
    return sonnerToast.warning(message, {
      duration: TOAST_DURATIONS.warning,
      ...restOptions,
      ...(action && {
        action: {
          label: action.label,
          onClick: action.onClick,
        },
      }),
    })
  },

  /**
   * Show an info toast.
   * Duration: 5000ms
   */
  info: (message: string | React.ReactNode, options?: ToastOptions): string | number => {
    const { action, ...restOptions } = options ?? {}
    return sonnerToast.info(message, {
      duration: TOAST_DURATIONS.info,
      ...restOptions,
      ...(action && {
        action: {
          label: action.label,
          onClick: action.onClick,
        },
      }),
    })
  },

  /**
   * Dismiss a specific toast or all toasts.
   * @param toastId - Optional toast ID to dismiss. If not provided, dismisses all toasts.
   */
  dismiss: (toastId?: string | number): string | number | undefined => {
    return sonnerToast.dismiss(toastId)
  },

  /**
   * Show a loading toast. Returns ID for later dismissal or update.
   */
  loading: (message: string | React.ReactNode, options?: ToastOptions): string | number => {
    const { action, ...restOptions } = options ?? {}
    return sonnerToast.loading(message, {
      ...restOptions,
      ...(action && {
        action: {
          label: action.label,
          onClick: action.onClick,
        },
      }),
    })
  },

  /**
   * Show a promise-based toast that auto-updates based on promise state.
   * Returns a wrapped promise with an unwrap method to access the original promise.
   */
  promise: <T,>(
    promise: Promise<T> | (() => Promise<T>),
    options: {
      loading: string | React.ReactNode
      success: string | React.ReactNode | ((data: T) => string | React.ReactNode)
      error: string | React.ReactNode | ((error: unknown) => string | React.ReactNode)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    })
  },

  /**
   * Show a custom toast (generic variant).
   * Note: action is stripped from options as custom toasts handle their own content.
   */
  custom: (
    jsx: (id: number | string) => React.ReactElement,
    options?: ToastOptions
  ): string | number => {
    const { action: _action, ...restOptions } = options ?? {}
    return sonnerToast.custom(jsx, restOptions)
  },

  /**
   * Show a message toast (basic variant without icon).
   */
  message: (message: string | React.ReactNode, options?: ToastOptions): string | number => {
    const { action, ...restOptions } = options ?? {}
    return sonnerToast.message(message, {
      ...restOptions,
      ...(action && {
        action: {
          label: action.label,
          onClick: action.onClick,
        },
      }),
    })
  },
} as const

/**
 * Toast duration constants exported for external use.
 */
export { TOAST_DURATIONS }

/**
 * Toaster component for displaying toast notifications.
 *
 * Should be placed in the root layout, inside ThemeProvider.
 * Configured with:
 * - Position: top-right
 * - Rich colors for variant styling
 * - Theme-aware styling
 *
 * @example
 * ```tsx
 * // In root layout.tsx
 * <ThemeProvider>
 *   {children}
 *   <Toaster />
 * </ThemeProvider>
 * ```
 */
function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'group rounded-lg border shadow-lg',
          title: 'font-medium',
          description: 'text-sm opacity-90',
          actionButton:
            'bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-3 py-1.5 rounded-md text-sm',
          cancelButton:
            'bg-muted text-muted-foreground hover:bg-muted/80 font-medium px-3 py-1.5 rounded-md text-sm',
          closeButton: 'bg-background text-foreground border',
          // Success variant styling with gold accent
          success: 'bg-background text-foreground border-accent-gold [&>svg]:text-accent-gold',
          // Error variant styling with destructive red
          error: 'bg-background text-foreground border-destructive [&>svg]:text-destructive',
          // Warning variant styling
          warning: 'bg-background text-foreground border-yellow-500 [&>svg]:text-yellow-500',
          // Info variant styling
          info: 'bg-background text-foreground border-blue-500 [&>svg]:text-blue-500',
        },
      }}
    />
  )
}

export { Toaster }
