'use client'

/**
 * Toast Test Page
 *
 * Development-only page to verify toast notifications work app-wide.
 * Tests all four variants: success, error, warning, info
 *
 * This page can be accessed at /toast-test during development.
 */

import { Button, toast } from '@compilothq/ui'

export default function ToastTestPage() {
  const handleSuccess = () => {
    toast.success('Operation completed successfully!', {
      description: 'Your changes have been saved.',
    })
  }

  const handleError = () => {
    toast.error('An error occurred!', {
      description: 'Please try again or contact support.',
      action: {
        label: 'Retry',
        onClick: () => console.log('Retry clicked'),
      },
    })
  }

  const handleWarning = () => {
    toast.warning('Warning: Action required', {
      description: 'Please review the following items.',
    })
  }

  const handleInfo = () => {
    toast.info('Did you know?', {
      description: 'You can customize your dashboard settings.',
    })
  }

  const handleWithAction = () => {
    toast.success('Item deleted', {
      action: {
        label: 'Undo',
        onClick: () => toast.info('Item restored'),
      },
    })
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Toast Test Page</h1>
        <p className="mb-6 text-muted-foreground">
          Click the buttons below to test all four toast variants and verify styling matches design
          tokens.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Basic Toasts</h2>

            <Button
              onClick={handleSuccess}
              className="w-full bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90"
            >
              Success Toast (4s)
            </Button>

            <Button onClick={handleError} variant="destructive" className="w-full">
              Error Toast (8s)
            </Button>

            <Button
              onClick={handleWarning}
              className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
            >
              Warning Toast (5s)
            </Button>

            <Button
              onClick={handleInfo}
              className="w-full bg-blue-500 text-white hover:bg-blue-600"
            >
              Info Toast (5s)
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">With Actions</h2>

            <Button onClick={handleWithAction} variant="outline" className="w-full">
              Toast with Undo Action
            </Button>

            <div className="mt-4 rounded-md border border-border bg-muted/50 p-4">
              <h3 className="mb-2 font-medium">Design Token Verification</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Success: Gold accent (#D4A853)</li>
                <li>Error: Destructive red</li>
                <li>Warning: Yellow-500</li>
                <li>Info: Blue-500</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border p-4">
          <h3 className="mb-2 font-medium">Duration Reference</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Success: 4000ms (4 seconds)</li>
            <li>Error: 8000ms (8 seconds) - persists longer for user to read</li>
            <li>Warning: 5000ms (5 seconds)</li>
            <li>Info: 5000ms (5 seconds)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
