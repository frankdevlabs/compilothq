import { TRPCClientError } from '@trpc/client'

/**
 * Type guard for tRPC error data with code
 */
interface TRPCErrorData {
  code: string
  cause?: unknown
}

function isTRPCErrorData(data: unknown): data is TRPCErrorData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'code' in data &&
    typeof (data as { code: unknown }).code === 'string'
  )
}

/**
 * Error message mappings for different tRPC error codes
 *
 * These provide user-friendly messages for common error scenarios
 */
const ERROR_MESSAGES: Record<string, string> = {
  BAD_REQUEST: 'The request contains invalid data. Please check your input and try again.',
  UNAUTHORIZED: 'You need to be signed in to perform this action.',
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: 'The requested resource could not be found.',
  TIMEOUT: 'The request took too long to complete. Please try again.',
  CONFLICT: 'This resource already exists. Please use a different name or identifier.',
  PRECONDITION_FAILED: 'The operation cannot be completed due to current state.',
  PAYLOAD_TOO_LARGE: 'The data you are trying to send is too large.',
  METHOD_NOT_SUPPORTED: 'This operation is not supported.',
  UNPROCESSABLE_CONTENT: 'The request data could not be processed.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment and try again.',
  CLIENT_CLOSED_REQUEST: 'The request was cancelled.',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  NOT_IMPLEMENTED: 'This feature is not yet available.',
}

/**
 * Default error message for unknown error codes
 */
const DEFAULT_ERROR_MESSAGE = 'An error occurred. Please try again.'

/**
 * Extract a user-friendly error message from a tRPC error
 *
 * @param error - The error object from a tRPC query or mutation
 * @returns A user-friendly error message string
 *
 * @example
 * ```tsx
 * const mutation = trpc.activity.create.useMutation({
 *   onError: (error) => {
 *     toast.error(getTRPCErrorMessage(error))
 *   }
 * })
 * ```
 */
export function getTRPCErrorMessage(error: unknown): string {
  // Handle tRPC client errors
  if (error instanceof TRPCClientError) {
    const errorData: unknown = error.data

    // If the server provided a custom message, use it
    if (error.message && isTRPCErrorData(errorData) && error.message !== errorData.code) {
      return error.message
    }

    // Otherwise, use the mapped message for the error code
    if (isTRPCErrorData(errorData)) {
      const code = errorData.code
      if (code in ERROR_MESSAGES) {
        // eslint-disable-next-line security/detect-object-injection
        return ERROR_MESSAGES[code]
      }
    }

    return DEFAULT_ERROR_MESSAGE
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return error.message || DEFAULT_ERROR_MESSAGE
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Fallback for unknown error types
  return DEFAULT_ERROR_MESSAGE
}

/**
 * Check if an error is a tRPC client error with a specific code
 *
 * @param error - The error object to check
 * @param code - The tRPC error code to match
 * @returns True if the error matches the specified code
 *
 * @example
 * ```tsx
 * if (isTRPCErrorCode(error, 'NOT_FOUND')) {
 *   // Handle not found case
 * } else if (isTRPCErrorCode(error, 'UNAUTHORIZED')) {
 *   // Redirect to login
 * }
 * ```
 */
export function isTRPCErrorCode(error: unknown, code: string): boolean {
  if (!(error instanceof TRPCClientError)) return false

  const errorData: unknown = error.data
  return isTRPCErrorData(errorData) && errorData.code === code
}

/**
 * Check if an error is a network error (connection issues, timeout, etc.)
 *
 * @param error - The error object to check
 * @returns True if the error is likely a network error
 *
 * @example
 * ```tsx
 * if (isNetworkError(error)) {
 *   toast.error('Connection lost. Please check your internet connection.')
 * }
 * ```
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('offline')
  )
}

/**
 * Format validation errors from Zod into user-friendly messages
 *
 * @param error - The tRPC error that may contain validation issues
 * @returns Array of validation error messages, or empty array if no validation errors
 *
 * @example
 * ```tsx
 * const validationErrors = getValidationErrors(error)
 * if (validationErrors.length > 0) {
 *   validationErrors.forEach(err => toast.error(err))
 * }
 * ```
 */
interface ZodIssue {
  path?: (string | number)[]
  message: string
}

interface ZodCause {
  issues?: ZodIssue[]
}

export function getValidationErrors(error: unknown): string[] {
  if (!(error instanceof TRPCClientError)) return []

  const errorData: unknown = error.data

  // Check if this is a BAD_REQUEST with Zod validation errors
  if (!isTRPCErrorData(errorData) || errorData.code !== 'BAD_REQUEST') return []

  // tRPC wraps Zod validation errors in the message
  // Try to extract individual field errors if available
  const cause = errorData.cause
  if (typeof cause === 'object' && cause !== null && 'issues' in cause) {
    const zodCause = cause as ZodCause
    if (zodCause.issues && Array.isArray(zodCause.issues)) {
      return zodCause.issues.map((issue) => {
        const path = issue.path?.join('.') ?? 'field'
        return `${path}: ${issue.message}`
      })
    }
  }

  return []
}
