# RecipientProcessingLocation Integration Contract for Item 16c (Recipient Management UI)

## Overview

This document defines the backend API contract provided by Item 15 (RecipientProcessingLocation backend) for consumption by Item 16c (Recipient Management UI implementation).

## tRPC API Procedures

All procedures are available under the `recipientProcessingLocations` router namespace.

### Create Location

```typescript
const location = await trpc.recipientProcessingLocations.create.mutate({
  recipientId: string
  service: string // 3-500 characters
  countryId: string
  locationRole: 'HOSTING' | 'PROCESSING' | 'BOTH'
  purposeId?: string | null
  purposeText?: string | null
  transferMechanismId?: string | null
  metadata?: Record<string, unknown> | null
})
```

**Returns**: RecipientProcessingLocation with all relations populated

**Validation**:
- Enforces multi-tenancy (recipient must belong to user's organization)
- Validates transfer mechanism requirement for third countries (when Organization.headquartersCountryId is set)

### Get Active Locations for Recipient

```typescript
const locations = await trpc.recipientProcessingLocations.getActiveForRecipient.useQuery({
  recipientId: string
})
```

**Returns**: Array of active RecipientProcessingLocation records with country, transferMechanism, and purpose relations

**Use Case**: Display current processing locations table on recipient detail page

### Get All Locations (Including Historical)

```typescript
const locations = await trpc.recipientProcessingLocations.getAllForRecipient.useQuery({
  recipientId: string
  isActive?: boolean
})
```

**Returns**: Array of RecipientProcessingLocation records ordered by createdAt descending

**Use Case**: Historical audit trail, document regeneration snapshots

### Get Locations with Parent Chain

```typescript
const locationsWithChain = await trpc.recipientProcessingLocations.getWithParentChain.useQuery({
  recipientId: string
})
```

**Returns**: Array of location groups with depth annotation:
```typescript
Array<{
  recipientId: string
  recipientName: string
  depth: number // 0 = current recipient, 1 = parent, 2 = grandparent
  locations: RecipientProcessingLocation[]
}>
```

**Use Case**: Show complete processing chain for sub-processors, including parent locations

### Get Locations by Country

```typescript
const locations = await trpc.recipientProcessingLocations.getByCountry.useQuery({
  countryId: string
  isActive?: boolean
})
```

**Returns**: Array of locations in specified country with recipient relation

**Use Case**: Geographic compliance dashboard, "Show all processing in US"

### Update Location

```typescript
const updated = await trpc.recipientProcessingLocations.update.mutate({
  id: string
  data: {
    service?: string
    countryId?: string
    locationRole?: 'HOSTING' | 'PROCESSING' | 'BOTH'
    purposeId?: string | null
    purposeText?: string | null
    transferMechanismId?: string | null
    isActive?: boolean
    metadata?: Record<string, unknown> | null
  }
})
```

**Returns**: Updated RecipientProcessingLocation

**Notes**:
- All fields optional (partial update)
- organizationId and recipientId are immutable
- Validates transfer mechanism requirement when country changes

### Move Location (Transactional)

```typescript
const newLocation = await trpc.recipientProcessingLocations.move.mutate({
  locationId: string
  updates: {
    countryId?: string
    service?: string
    transferMechanismId?: string | null
    locationRole?: 'HOSTING' | 'PROCESSING' | 'BOTH'
    purposeId?: string | null
    purposeText?: string | null
    metadata?: Record<string, unknown> | null
  }
})
```

**Returns**: New active location record

**Behavior**:
- Creates new location record with updates applied
- Deactivates old location record (sets isActive: false)
- All in single atomic transaction

**Use Case**: Processor moves data center from one country to another, preserving audit trail

### Deactivate Location

```typescript
const deactivated = await trpc.recipientProcessingLocations.deactivate.mutate({
  id: string
})
```

**Returns**: Deactivated location (isActive: false)

**Use Case**: Soft delete for audit trail preservation

### Detect Cross-Border Transfers

```typescript
const transfers = await trpc.recipientProcessingLocations.detectTransfers.useQuery()
```

**Returns**: Array of CrossBorderTransfer objects:
```typescript
Array<{
  organizationCountry: Country
  recipientId: string
  recipientName: string
  recipientType: string
  processingLocation: RecipientProcessingLocation & {
    country: Country
    transferMechanism: TransferMechanism | null
  }
  transferRisk: TransferRisk
  depth: number // Depth in sub-processor chain
}>
```

**Transfer Risk Levels**:
- `NONE`: Same jurisdiction
- `LOW`: Adequacy decision exists
- `MEDIUM`: Third country with safeguards in place
- `HIGH`: Third country missing safeguards
- `CRITICAL`: EU/EEA to third country without mechanism

**Note**: Requires Organization.headquartersCountryId field (implemented, will throw error if not set)

### Analyze Activity Transfers

```typescript
const analysis = await trpc.recipientProcessingLocations.analyzeActivityTransfers.useQuery({
  activityId: string
})
```

**Returns**: ActivityTransferAnalysis object:
```typescript
{
  activityId: string
  activityName: string
  organizationCountry: Country
  transfers: CrossBorderTransfer[]
  summary: {
    totalRecipients: number
    recipientsWithTransfers: number
    riskDistribution: {
      none: number
      low: number
      medium: number
      high: number
      critical: number
    }
    countriesInvolved: Array<{
      country: Country
      locationCount: number
    }>
  }
}
```

**Use Case**: Display cross-border transfer risk summary on activity detail page

**Note**: Requires Organization.headquartersCountryId field (implemented, will throw error if not set)

## UI Implementation Recommendations (Item 16c)

### Embedded Location Table Component

**Location**: Recipient detail page

**Features**:
- Display active processing locations in TanStack Table
- Columns: Country, Service, Location Role, Transfer Mechanism, Purpose, Actions
- Row actions menu: Edit, Move, Deactivate
- Inline warnings for risky locations (CRITICAL or HIGH risk)
- Add new location button

**Example Usage**:
```typescript
import { api } from '@/lib/trpc'

function RecipientLocationsTable({ recipientId }: { recipientId: string }) {
  const { data: locations, isLoading } = api.recipientProcessingLocations.getActiveForRecipient.useQuery({
    recipientId
  })

  // TanStack Table setup with columns, actions menu, etc.
}
```

### Move Location Dialog

**Trigger**: Row action menu "Move location"

**Fields**:
- Country (required, select from Country list)
- Transfer Mechanism (conditionally required based on country selection)
- Service (pre-populated, editable)
- Location Role (pre-populated, editable)
- Purpose (optional)

**Validation**:
- Real-time check: If country is third country, show transfer mechanism dropdown
- Submit validation handled by backend (will throw error if mechanism missing)

**Example Usage**:
```typescript
const moveMutation = api.recipientProcessingLocations.move.useMutation({
  onSuccess: () => {
    // Refresh locations list
    refetch()
  }
})

function handleMove(locationId: string, updates: MoveLocationInput) {
  moveMutation.mutate({ locationId, updates })
}
```

### Risk Badges

Display transfer risk level as color-coded badges:

- **NONE**: No badge (same jurisdiction)
- **LOW**: Green badge "Adequacy decision"
- **MEDIUM**: Yellow badge "Third-country with SCC" (or mechanism name)
- **HIGH**: Orange badge "Missing safeguards"
- **CRITICAL**: Red badge "Third-country without mechanism"

**Example**:
```typescript
function RiskBadge({ risk }: { risk: TransferRisk }) {
  switch (risk.level) {
    case 'NONE':
      return null
    case 'LOW':
      return <Badge variant="success">Adequacy decision</Badge>
    case 'MEDIUM':
      return <Badge variant="warning">{risk.mechanism.name}</Badge>
    case 'HIGH':
      return <Badge variant="warning">Missing safeguards</Badge>
    case 'CRITICAL':
      return <Badge variant="destructive">No mechanism</Badge>
  }
}
```

### Inline Warnings

Show warning callouts for locations with HIGH or CRITICAL risk:

```typescript
{location.transferRisk?.level === 'CRITICAL' && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Transfer mechanism required</AlertTitle>
    <AlertDescription>
      {location.country.name} is a third country without adequacy decision.
      Select an appropriate safeguard under GDPR Article 46.
    </AlertDescription>
  </Alert>
)}
```

## Multi-Tenancy Security

All tRPC procedures enforce multi-tenancy:

- User must belong to an organization (`ctx.user.organizationId` required)
- All queries scoped to user's organization
- Cross-organization access automatically rejected by DAL layer

**No additional UI checks needed** - backend handles all security.

## Error Handling

Common errors from backend:

1. **"Recipient not found or does not belong to organization"**
   - Cross-org access attempt
   - Display: "Unauthorized access" or redirect to recipient list

2. **"Transfer mechanism required: {country} is a third country..."**
   - Hard validation failure for third-country transfers
   - Display: Inline error on transfer mechanism field, pre-populate error message

3. **"Location not found"**
   - Concurrent deletion or invalid ID
   - Display: "Location no longer exists" toast, refresh list

4. **"Country not found"**
   - Invalid country selection
   - Display: "Invalid country" error

## Type Safety

All types are auto-generated by tRPC from backend implementation:

```typescript
import { api } from '@/lib/trpc'

// Input types
type CreateLocationInput = Parameters<typeof api.recipientProcessingLocations.create.mutate>[0]
type MoveLocationInput = Parameters<typeof api.recipientProcessingLocations.move.mutate>[0]

// Output types
type LocationOutput = Awaited<ReturnType<typeof api.recipientProcessingLocations.getActiveForRecipient.useQuery>>
type TransferAnalysisOutput = Awaited<ReturnType<typeof api.recipientProcessingLocations.analyzeActivityTransfers.useQuery>>
```

## Performance Considerations

- **Caching**: tRPC useQuery automatically caches location data
- **Optimistic Updates**: Use optimistic updates for deactivate/move mutations
- **Pagination**: Not needed for locations (typically <10 per recipient)
- **Prefetching**: Prefetch locations when hovering over recipient row

## Testing Recommendations (Item 16c)

Use development authentication for testing:

```bash
# Generate DPO session for testing
pnpm dev:login --persona=DPO
```

Test scenarios:
1. Create location with all fields
2. Create EU location (no mechanism required)
3. Create US location (mechanism required when validation enabled)
4. Move location (verify old deactivated, new active)
5. Deactivate location (verify excluded from active list)
6. View locations with parent chain (sub-processor scenario)

## Future Enhancements (Out of Scope for Item 16c)

- Bulk location operations (bulk import, bulk update)
- Location templates or presets
- Drag-and-drop location reordering
- Advanced filters (by risk level, by country, by mechanism)
- Email notifications for new CRITICAL risk locations

## Questions or Issues?

If any API contract needs clarification or adjustment, coordinate with backend team before implementing UI.
