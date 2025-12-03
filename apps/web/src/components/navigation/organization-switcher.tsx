'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@compilothq/ui'
import { Building2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Organization type for the switcher
 */
export interface Organization {
  id: string
  name: string
}

/**
 * Props for the OrganizationSwitcher component
 */
export interface OrganizationSwitcherProps {
  /** The currently active organization */
  currentOrg: Organization
  /** List of all organizations the user has access to */
  organizations: Organization[]
  /** Optional callback when organization is changed */
  onOrganizationChange?: (organizationId: string) => void
}

/**
 * Special value for the "Create New Organization" action
 * Used to distinguish it from actual organization IDs
 */
const CREATE_ORG_VALUE = '__create_new_organization__'

/**
 * OrganizationSwitcher Component
 *
 * A dropdown component that displays the current organization and allows
 * the user to switch between organizations or create a new one.
 *
 * Features:
 * - Displays current organization name in the trigger
 * - Lists all available organizations with checkmark on active one
 * - Separator line before "Create New Organization" action
 * - Navigates to /create-organization when create action is selected
 *
 * @example
 * ```tsx
 * <OrganizationSwitcher
 *   currentOrg={{ id: 'org-1', name: 'Acme Corp' }}
 *   organizations={[
 *     { id: 'org-1', name: 'Acme Corp' },
 *     { id: 'org-2', name: 'Beta Inc' },
 *   ]}
 *   onOrganizationChange={(orgId) => console.log('Switched to:', orgId)}
 * />
 * ```
 */
export function OrganizationSwitcher({
  currentOrg,
  organizations,
  onOrganizationChange,
}: OrganizationSwitcherProps) {
  const router = useRouter()

  /**
   * Handle value change from the Select component
   * Either switch organization or navigate to create new organization
   */
  const handleValueChange = (value: string) => {
    if (value === CREATE_ORG_VALUE) {
      // Navigate to create organization route
      router.push('/create-organization')
      return
    }

    // Call the organization change callback if provided
    if (onOrganizationChange) {
      onOrganizationChange(value)
    }
  }

  return (
    <Select value={currentOrg.id} onValueChange={handleValueChange}>
      <SelectTrigger className="w-auto min-w-[180px] gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <SelectValue placeholder="Select organization">{currentOrg.name}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {/* Organization list */}
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}

        {/* Separator between organization list and create action */}
        <SelectSeparator />

        {/* Create New Organization action */}
        <SelectItem value={CREATE_ORG_VALUE} className="text-muted-foreground">
          <Plus className="h-4 w-4" />
          <span>Create New Organization</span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
