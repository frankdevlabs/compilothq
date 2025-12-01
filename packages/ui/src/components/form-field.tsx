'use client'

/**
 * FormFieldWrapper Component
 *
 * A convenience wrapper that combines form primitives (FormItem, FormLabel,
 * FormControl, FormDescription, FormMessage) into a single reusable component.
 *
 * This component simplifies form field creation by providing a consistent
 * layout structure with proper accessibility attributes.
 *
 * @example
 * ```tsx
 * <FormFieldWrapper
 *   label="Email"
 *   name="email"
 *   description="We'll never share your email"
 * >
 *   <Input {...field} />
 * </FormFieldWrapper>
 * ```
 */

import * as React from 'react'
import { useFormContext } from 'react-hook-form'

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './form'

interface FormFieldWrapperProps {
  /** The label text displayed above the form control */
  label: string
  /** The field name used for form state and validation */
  name: string
  /** Optional description text displayed below the form control */
  description?: string
  /** The form control element (input, select, etc.) */
  children: React.ReactNode
  /** Optional additional className for the FormItem container */
  className?: string
}

/**
 * FormFieldWrapper combines all form primitives into a single component.
 *
 * It uses useFormContext() to access the form control and composes:
 * - FormItem: Container with proper spacing
 * - FormLabel: Label with error state styling
 * - FormControl: Wrapper with accessibility attributes
 * - FormDescription: Optional helper text
 * - FormMessage: Error message display
 *
 * This component must be used within a FormProvider context.
 */
function FormFieldWrapper({
  label,
  name,
  description,
  children,
  className,
}: FormFieldWrapperProps) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>{children}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { FormFieldWrapper }
export type { FormFieldWrapperProps }
