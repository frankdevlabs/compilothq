'use client'

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@compilothq/ui'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'

import { trpc } from '@/lib/trpc/client'

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [organizationName, setOrganizationName] = useState('')
  const [error, setError] = useState('')

  const createOrganization = trpc.organization.create.useMutation({
    onSuccess: () => {
      // Force full page reload to ensure fresh session with new organization
      // window.location.href is more reliable than router.push + session update
      window.location.href = '/dashboard'
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  // Redirect if user already has an organization
  useEffect(() => {
    if (status === 'authenticated' && session.user.organizationId) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/create-organization')
    }
  }, [status, router])

  // Generate slug preview (computed value, not state update in effect)
  const slug = useMemo(() => {
    if (!organizationName) return ''
    return organizationName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }, [organizationName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!organizationName || organizationName.length < 2) {
      setError('Organization name must be at least 2 characters')
      return
    }

    createOrganization.mutate({ name: organizationName })
  }

  if (status === 'loading') {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create your organization</CardTitle>
        <p className="text-center text-muted-foreground">
          Set up your organization to start managing compliance
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name *</Label>
            <Input
              id="organizationName"
              type="text"
              placeholder="Acme Corp"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              disabled={createOrganization.isPending}
              required
            />
            {slug && (
              <p className="text-xs text-muted-foreground">
                URL: <span className="font-mono">{slug}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
          )}

          <Button
            className="w-full"
            type="submit"
            disabled={createOrganization.isPending || !organizationName}
          >
            {createOrganization.isPending ? 'Creating...' : 'Create Organization'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You will be assigned as the Data Protection Officer (DPO) for this organization.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
