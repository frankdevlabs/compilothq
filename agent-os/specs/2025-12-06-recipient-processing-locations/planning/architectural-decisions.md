# Architectural Decisions: Roadmap Item 15
## RecipientProcessingLocation Model and Cross-Border Transfer Detection

**Date:** 2025-12-05
**Status:** Planning Phase
**Decision Authority:** Product/Technical Lead

---

## Context

This document captures architectural decisions for implementing Roadmap Item 15, based on:
1. **Codebase exploration** of existing patterns (Item 14: AssetProcessingLocation, Item 12: Recipient hierarchy)
2. **Guidance document** patterns from `README-items-14-16.md`
3. **Product mission** alignment with MVP scope and user needs
4. **Technical constraints** from existing infrastructure

---

## Decision Summary

| Question | Decision | Confidence |
|----------|----------|------------|
| 1. UI Pattern | Embedded interface within Recipient detail page | High |
| 2. Location Requirement | Optional during creation, soft warning for PROCESSOR types | High |
| 3. Transfer Alerts | Dashboard widgets only (no real-time/email notifications in MVP) | High |
| 4. Service Field | Free-form text with autocomplete suggestions from existing values | High |
| 5. Chain Visualization | Display all locations with badges/filters (no special distinction) | Medium |
| 6. Validation Timing | Soft warning during save + post-save dashboard alerts | High |
| 7. Historical Tracking | Manual deactivate/create pattern (no automatic "move" action) | High |
| 8. Activity Integration | Post-approval DPO compliance check (not during submission review) | Medium |
| 9. Scope Exclusions | All four proposed exclusions accepted for MVP | High |

---

## Detailed Decisions

### 1. User Interface for Recipient Location Management

**DECISION:** Use embedded interface within Recipient detail page (similar to planned AssetProcessingLocation pattern)

**Rationale:**

**From codebase exploration:**
- AssetProcessingLocation database/DAL implemented in Item 14, but **UI not yet built**
- Recipient management UI also not yet implemented (Item 16c future work)
- Existing pattern: `createDigitalAsset()` accepts optional `locations: []` array for atomic creation

**UI Pattern (following Item 14 design intent):**
```
┌─────────────────────────────────────────────────────┐
│ Recipient: Mailchimp (PROCESSOR)                   │
├─────────────────────────────────────────────────────┤
│ Basic Info | Processing Locations | Sub-Processors │
│                                                     │
│ Processing Locations (3)              [+ Add New]  │
│ ┌─────────────────────────────────────────────────┐│
│ │ Email delivery                      🇺🇸 United  ││
│ │ Purpose: Marketing communications    States     ││
│ │ Mechanism: Standard Contractual Clauses (SCC)   ││
│ │                                    [Edit] [✕]   ││
│ ├─────────────────────────────────────────────────┤│
│ │ List segmentation analytics         🇮🇪 Ireland││
│ │ Purpose: Marketing analytics                    ││
│ │ Mechanism: Not required (EU/EEA)                ││
│ │                                    [Edit] [✕]   ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Why NOT a separate dedicated page:**
- **Context proximity:** Users need location context when viewing/editing recipients
- **Reduced navigation:** Embedded interface = fewer clicks, better UX
- **Data locality:** Locations are properties of recipients, not standalone entities
- **Existing pattern consistency:** Mirrors AssetProcessingLocation design intent

**Alternative considered:** Separate `/recipients/:id/locations` page
- **Rejected:** Adds navigation complexity, splits related data across views

**Implementation notes:**
- Use shadcn/ui Table component for list display
- Inline add/edit via Modal or Sheet component
- Real-time validation with React Hook Form + Zod
- Optimistic updates with TanStack Query

---

### 2. Location Input During Recipient Creation

**DECISION:** Allow optional location creation during recipient creation, with soft validation warning (not hard requirement) for PROCESSOR/SUB_PROCESSOR types

**Rationale:**

**From codebase exploration:**
- `createDigitalAsset()` pattern: Single function accepts optional `locations: AssetProcessingLocationInput[]`
- Uses transaction automatically when locations provided: `if (data.locations && data.locations.length > 0) { return await prisma.$transaction(...) }`
- Atomic creation: All-or-nothing for data integrity

**API Pattern (mirror Item 14):**
```typescript
// packages/database/src/dal/recipients.ts
export async function createRecipient(data: {
  organizationId: string
  name: string
  type: RecipientType
  // ... other fields
  locations?: RecipientProcessingLocationInput[]  // OPTIONAL
}): Promise<CreateRecipientResult> {

  // Transaction only if locations provided
  if (data.locations && data.locations.length > 0) {
    return await prisma.$transaction(async (tx) => {
      const recipient = await tx.recipient.create({ ... })

      await tx.recipientProcessingLocation.createMany({
        data: data.locations.map(loc => ({
          organizationId: data.organizationId,
          recipientId: recipient.id,
          ...loc
        })),
        skipDuplicates: true
      })

      const locations = await tx.recipientProcessingLocation.findMany({
        where: { recipientId: recipient.id }
      })

      return { recipient, locations }
    })
  }

  // Recipient-only creation (no transaction overhead)
  const recipient = await prisma.recipient.create({ ... })
  return { recipient, locations: [] }
}
```

**Soft Validation Pattern (service layer):**
```typescript
// Service layer warning (NOT Zod blocking validation)
export async function validateRecipientCompleteness(
  recipientId: string
): Promise<{ warnings: string[] }> {
  const recipient = await getRecipientById(recipientId, {
    includeProcessingLocations: true
  })

  const warnings: string[] = []

  // Soft warning for processors without locations
  if (
    ['PROCESSOR', 'SUB_PROCESSOR'].includes(recipient.type) &&
    recipient.processingLocations.length === 0
  ) {
    warnings.push(
      'PROCESSOR/SUB_PROCESSOR should have at least one processing location defined for GDPR compliance tracking'
    )
  }

  return { warnings }
}
```

**Why soft warning instead of hard requirement:**
1. **User workflow flexibility:** Some users create recipients before knowing exact processing locations
2. **Gradual data completion:** Enable "save draft" workflow, complete details later
3. **External constraints:** Processing locations may be unknown during initial vendor onboarding
4. **Consistency:** Matches AssetProcessingLocation pattern (optional in Item 14)

**UI Behavior:**
```tsx
// Create Recipient Form
<RecipientCreateForm>
  <BasicInfoSection />

  <ProcessingLocationsSection>
    {/* Collapsible section, initially collapsed */}
    <Accordion defaultOpen={false}>
      <AccordionTrigger>
        Processing Locations (Optional)
        {recipientType === 'PROCESSOR' && (
          <Badge variant="warning">Recommended for compliance</Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        <LocationInputTable />
      </AccordionContent>
    </Accordion>
  </ProcessingLocationsSection>

  <Button type="submit">Create Recipient</Button>
</RecipientCreateForm>
```

**Post-creation flow:**
- If PROCESSOR created without locations → Show banner: "Add processing locations to enable cross-border transfer tracking"
- Dashboard widget: "X recipients missing processing location data"

**Alternative considered:** Hard validation requiring ≥1 location for PROCESSOR types
- **Rejected:** Too restrictive, blocks workflows when data incomplete

---

### 3. Transfer Detection Alerts and Notifications

**DECISION:** Dashboard widgets showing compliance gaps ONLY. No real-time in-app warnings or email notifications in MVP scope.

**Rationale:**

**From codebase exploration:**
- **No notification system found** in current codebase (no email service, no in-app notification components)
- **No real-time validation infrastructure** for cross-entity compliance checks
- AssetProcessingLocation uses post-hoc validation pattern (service layer queries, not live alerts)

**MVP Scope Constraints:**
- Notification system = significant infrastructure (BullMQ jobs, email templates, notification preferences)
- Real-time cross-border detection = expensive queries on every recipient/location save
- Email system (Resend) listed in tech stack but **not yet integrated** (no templates found in codebase)

**Dashboard Widget Pattern:**
```typescript
// apps/web/src/app/(auth)/dashboard/components/ComplianceOverview.tsx
export function ComplianceOverview() {
  const { data: transferGaps } = trpc.compliance.getTransferGaps.useQuery()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-Border Transfer Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        {transferGaps.thirdCountryWithoutMechanism > 0 && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Transfer Mechanisms Missing</AlertTitle>
            <AlertDescription>
              {transferGaps.thirdCountryWithoutMechanism} recipient locations
              in third countries lack required transfer mechanisms.
              <Link href="/recipients?filter=missing-mechanism" className="underline">
                View details
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 mt-4">
          <MetricCard
            label="Total Processing Locations"
            value={transferGaps.totalLocations}
          />
          <MetricCard
            label="Third-Country Locations"
            value={transferGaps.thirdCountryLocations}
            status={transferGaps.thirdCountryWithoutMechanism > 0 ? 'warning' : 'ok'}
          />
          <MetricCard
            label="Active Transfer Mechanisms"
            value={transferGaps.locationsWithMechanism}
          />
        </div>
      </CardContent>
    </Card>
  )
}
```

**Service Layer (tRPC procedure):**
```typescript
// apps/web/src/server/routers/complianceRouter.ts
export const complianceRouter = router({
  getTransferGaps: orgProcedure
    .query(async ({ ctx }) => {
      const transfers = await detectCrossBorderTransfers(ctx.organizationId)

      return {
        totalLocations: transfers.length,
        thirdCountryLocations: transfers.filter(t => t.isThirdCountry).length,
        thirdCountryWithoutMechanism: transfers.filter(
          t => t.isThirdCountry && t.requiresSafeguards && !t.transferMechanismId
        ).length,
        locationsWithMechanism: transfers.filter(t => t.transferMechanismId).length
      }
    })
})
```

**Why defer notifications:**
1. **Infrastructure gap:** Email system not yet integrated (Resend configured but no templates)
2. **Complexity vs value:** Notification preferences, delivery tracking, unsubscribe = 2-3 weeks effort
3. **User workflow:** DPOs typically check dashboards weekly/monthly, not real-time monitoring
4. **MVP focus:** Core value = data tracking + document generation, not alerting

**Future roadmap item suggestion:**
- **Item 40+:** Compliance Notification System
  - Email alerts for transfer gaps
  - In-app notification center
  - Role-based alert preferences
  - Digest emails (weekly summary)

**Alternative considered:** Real-time in-app warnings on recipient detail page
- **Rejected for MVP:** Requires expensive service layer query on every page load, adds latency

**Compromise solution (low-effort enhancement):**
```tsx
// apps/web/src/app/(auth)/recipients/[id]/page.tsx
export function RecipientDetailPage({ params }) {
  const { data: recipient } = trpc.recipient.getById.useQuery({
    id: params.id,
    includeTransferAnalysis: true  // Optional flag
  })

  // Show inline warning IF transfer analysis requested
  {recipient.transferAnalysis?.hasGaps && (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        This recipient has {recipient.transferAnalysis.gapCount} processing
        location(s) in third countries without required transfer mechanisms.
      </AlertDescription>
    </Alert>
  )}
}
```

**Decision:** Include inline warning on recipient detail page only (lazy-loaded, opt-in via query flag). No dashboard-wide real-time alerts.

---

### 4. Service Field Standardization

**DECISION:** Free-form text input with autocomplete suggestions based on previously-entered services within the organization. NO enforced standardization or predefined catalog.

**Rationale:**

**From codebase exploration:**
- AssetProcessingLocation `service` field: `String` (free text, max 500 chars)
- No `ServiceCatalog` model in Prisma schema
- Initialization doc explicitly states: *"Free text initially...may evolve to service catalog FK if patterns emerge"*

**From guidance document:**
```
service: "Email delivery via SendGrid"  ✓ Good - specific vendor + function
service: "Customer data storage"        ✓ Good - clear purpose
service: "Email"                        ✗ Too vague
```

**Autocomplete Pattern (Inspired by Google Search suggestions):**
```typescript
// tRPC procedure to get service suggestions
export const recipientProcessingLocationRouter = router({
  getServiceSuggestions: orgProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // Get distinct service values from organization's locations
      const services = await prisma.$queryRaw<Array<{ service: string }>>`
        SELECT DISTINCT service
        FROM "RecipientProcessingLocation"
        WHERE "organizationId" = ${ctx.organizationId}
          AND "isActive" = true
          AND service ILIKE ${`%${input.query}%`}
        ORDER BY service ASC
        LIMIT 10
      `

      return services.map(s => s.service)
    })
})
```

**UI Component (shadcn/ui Combobox):**
```tsx
// components/RecipientProcessingLocationForm.tsx
export function ServiceInput({ value, onChange }: ServiceInputProps) {
  const [query, setQuery] = useState('')
  const { data: suggestions = [] } = trpc.recipientProcessingLocation
    .getServiceSuggestions
    .useQuery(
      { query },
      { enabled: query.length >= 2 }  // Debounced query
    )

  return (
    <Combobox
      value={value}
      onValueChange={onChange}
      items={suggestions}
      placeholder="e.g., Email delivery via SendGrid"
      emptyMessage="No suggestions found. Enter custom service description."
      allowCustomValue={true}  // KEY: User can type anything
    />
  )
}
```

**Why NOT enforce standardization:**
1. **Organic pattern emergence:** Let users define services naturally, catalog patterns later
2. **Vendor specificity:** "Mailchimp email sending" vs "SendGrid email sending" = different compliance considerations
3. **Flexibility:** Different orgs have different service taxonomies
4. **Reduce friction:** No need to maintain service catalog, request new entries, etc.

**Future evolution (data-driven):**
```typescript
// After 6-12 months of usage, analyze clustering
export async function analyzeServiceClusters(
  organizationId: string
): Promise<ServiceCluster[]> {
  const services = await prisma.recipientProcessingLocation.findMany({
    where: { organizationId, isActive: true },
    select: { service: true }
  })

  // Use fuzzy matching to cluster similar services
  // "Email delivery via SendGrid" + "SendGrid email sending" → "SendGrid Email"
  return clusterSimilarServices(services)
}
```

**Then offer:** "Convert 12 similar service descriptions to standardized catalog entry?"

**Alternative considered:** Predefined service catalog (Email, Storage, Analytics, etc.)
- **Rejected:** Premature standardization, reduces expressiveness, maintenance overhead

**Guidance for users (placeholder text + help tooltip):**
```tsx
<Input
  placeholder="e.g., Email delivery via SendGrid, Customer data storage"
  aria-describedby="service-help"
/>
<FormDescription id="service-help">
  Describe the specific service this recipient provides. Be specific about
  vendor and function (e.g., "Mailchimp email campaigns" not just "Email").
</FormDescription>
```

---

### 5. Sub-Processor Chain Visualization

**DECISION:** Display all locations in hierarchy equally with simple badges for depth level, active/inactive status, and direct vs inherited. Use filters/toggles to hide/show inactive locations.

**Rationale:**

**From codebase exploration:**
- Recipient DAL includes `getDescendantTree()` with recursive CTE, returns `{ depth: number }` for each node
- Recipient hierarchy already supports multi-level chains via `parentRecipientId`
- No existing UI components found for hierarchy visualization (Item 16c future work)

**Visualization Pattern (Flat List with Depth Indicators):**
```
┌─────────────────────────────────────────────────────────────┐
│ Recipient: AWS (PROCESSOR)                                  │
├─────────────────────────────────────────────────────────────┤
│ Processing Locations in Chain (5)     [Show Inactive: ✓]   │
│                                                              │
│ Direct Locations (2)                                        │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ● S3 object storage         🇺🇸 US East (N. Virginia)   ││
│ │   Mechanism: Standard Contractual Clauses               ││
│ │   Active                                      [Edit] [✕] ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ ● Database hosting          🇮🇪 EU West (Ireland)       ││
│ │   Mechanism: Not required (EU/EEA)                      ││
│ │   Active                                      [Edit] [✕] ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Sub-Processor Locations (3)                                 │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ⮑ Equinix (Level 1)                                      ││
│ │   ● Data center colocation  🇺🇸 United States           ││
│ │   Mechanism: Standard Contractual Clauses               ││
│ │   Active                                                ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ ⮑ Cloudflare (Level 1)                                   ││
│ │   ● CDN edge caching        🇬🇧 United Kingdom          ││
│ │   Mechanism: Not required (adequacy decision)           ││
│ │   Active                                                ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ ⮑⮑ Zayo (Level 2 - via Equinix)                          ││
│ │    ● Network infrastructure 🇺🇸 United States           ││
│ │    Mechanism: Standard Contractual Clauses              ││
│ │    Inactive (Historical)                                ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Data Structure:**
```typescript
interface ProcessingLocationWithContext {
  location: RecipientProcessingLocation & {
    country: Country
    transferMechanism: TransferMechanism | null
    recipient: Recipient
  }
  depth: number  // 0 = direct, 1+ = sub-processor levels
  isInherited: boolean  // true if from parent/ancestor recipient
  ancestorChain?: string[]  // ["Equinix", "Zayo"] for breadcrumb
}
```

**Query Pattern:**
```typescript
// Service layer function
export async function getAllProcessingLocationsInChain(
  recipientId: string,
  organizationId: string,
  options?: { includeInactive?: boolean }
): Promise<ProcessingLocationWithContext[]> {
  // Get recipient + direct locations
  const recipient = await prisma.recipient.findUnique({
    where: { id: recipientId, organizationId },
    include: {
      processingLocations: {
        where: options?.includeInactive ? {} : { isActive: true },
        include: { country: true, transferMechanism: true }
      }
    }
  })

  // Get descendant tree
  const descendants = await getDescendantTree(recipientId, organizationId)

  // Get locations for all descendants
  const descendantLocations = await prisma.recipientProcessingLocation.findMany({
    where: {
      recipientId: { in: descendants.map(d => d.id) },
      ...(options?.includeInactive ? {} : { isActive: true })
    },
    include: {
      country: true,
      transferMechanism: true,
      recipient: true
    }
  })

  // Flatten and annotate
  const directLocations: ProcessingLocationWithContext[] =
    recipient.processingLocations.map(loc => ({
      location: { ...loc, recipient },
      depth: 0,
      isInherited: false
    }))

  const inheritedLocations: ProcessingLocationWithContext[] =
    descendantLocations.map(loc => {
      const descendant = descendants.find(d => d.id === loc.recipientId)!
      return {
        location: loc,
        depth: descendant.depth,
        isInherited: true,
        ancestorChain: getAncestorNames(descendant, descendants)
      }
    })

  return [...directLocations, ...inheritedLocations]
}
```

**Why NOT special distinction between direct/sub-processor:**
- **Unified view:** All locations contribute to compliance risk equally
- **Simpler UI:** Single table/list component, no complex nested views
- **Filtering sufficiency:** Depth badge + toggle filters provide needed control
- **Scalability:** Works for 3-level chains (most common) and 10-level chains equally

**Badge System:**
```tsx
<div className="flex gap-2">
  {/* Depth indicator */}
  {context.depth === 0 ? (
    <Badge variant="default">Direct</Badge>
  ) : (
    <Badge variant="secondary">Level {context.depth}</Badge>
  )}

  {/* Active status */}
  {!location.isActive && (
    <Badge variant="outline">Inactive</Badge>
  )}

  {/* Transfer warning */}
  {requiresSafeguards && !location.transferMechanismId && (
    <Badge variant="destructive">Missing Mechanism</Badge>
  )}
</div>
```

**Alternative considered:** Tree view with expandable nodes
- **Rejected:** Adds UI complexity, hides data behind interactions, harder to scan

**Future enhancement:** React Flow diagram visualization (Item 40+)
- Nodes = recipients, edges = parentRecipient relationships
- Color-code by country risk (green = EU, yellow = adequate, red = third country)
- Show processing locations as node details

---

### 6. Transfer Mechanism Validation Timing

**DECISION:** Soft warning during location save + post-save dashboard alerts. NO blocking validation that prevents save.

**Rationale:**

**From codebase exploration:**
- AssetProcessingLocation uses Zod for hard validation (field types, required fields)
- **No compliance-level hard validation** found in codebase (all soft warnings via service layer)
- Pattern: `validateAssetCompleteness()` returns `{ warnings: string[] }`, doesn't throw

**Validation Strategy Matrix:**

| Validation Type | Implementation | User Impact | Use Case |
|----------------|----------------|-------------|----------|
| **Hard (Zod)** | `.min(1)`, `.cuid()`, `.refine()` | Blocks save (400 error) | Data integrity (required fields, formats) |
| **Soft (Service Layer)** | Return warnings array | Shows banner, allows save | Business rules, compliance guidance |
| **Post-save (Dashboard)** | Background queries | Passive notification | Aggregate compliance tracking |

**Implementation:**

**1. Soft Warning During Save (Immediate Feedback):**
```typescript
// tRPC mutation
export const recipientProcessingLocationRouter = router({
  create: orgProcedure
    .input(RecipientProcessingLocationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Create location (always succeeds if valid data)
      const location = await createRecipientProcessingLocation({
        organizationId: ctx.organizationId,
        ...input
      })

      // Run compliance validation (non-blocking)
      const validation = await validateLocationCompliance(location.id)

      return {
        location,
        warnings: validation.warnings  // Returned to client
      }
    })
})
```

**2. Service Layer Validation:**
```typescript
export async function validateLocationCompliance(
  locationId: string
): Promise<{ warnings: string[] }> {
  const location = await prisma.recipientProcessingLocation.findUnique({
    where: { id: locationId },
    include: {
      country: true,
      recipient: { include: { organization: { include: { country: true } } } }
    }
  })

  if (!location) throw new Error('Location not found')

  const warnings: string[] = []
  const orgCountry = location.recipient.organization.country

  // Check if third-country transfer without mechanism
  if (requiresSafeguards(orgCountry, location.country) && !location.transferMechanismId) {
    const countryName = location.country.name
    warnings.push(
      `Transfer to ${countryName} requires a transfer mechanism under GDPR Article 46. ` +
      `Consider adding Standard Contractual Clauses (SCC) or other appropriate safeguards.`
    )
  }

  return { warnings }
}
```

**3. UI Response (Toast Notification):**
```tsx
// components/RecipientProcessingLocationForm.tsx
const createMutation = trpc.recipientProcessingLocation.create.useMutation({
  onSuccess: (data) => {
    if (data.warnings.length > 0) {
      toast({
        title: "Location created with warnings",
        description: (
          <ul className="list-disc pl-4">
            {data.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        ),
        variant: "warning",
        duration: 10000  // Long duration for important compliance warnings
      })
    } else {
      toast({
        title: "Location created successfully",
        variant: "default"
      })
    }

    onSuccess?.()
  }
})
```

**4. Dashboard Aggregate View:**
```tsx
// apps/web/src/app/(auth)/dashboard/page.tsx
<ComplianceOverview>
  <Alert variant="warning">
    <AlertTriangle />
    <AlertTitle>5 locations require transfer mechanisms</AlertTitle>
    <AlertDescription>
      Processing locations in third countries without required safeguards.
      <Link href="/recipients?filter=missing-mechanism">Review now</Link>
    </AlertDescription>
  </Alert>
</ComplianceOverview>
```

**Why soft warning instead of blocking validation:**

**User workflow perspective:**
1. **Incomplete data scenarios:** User may not know transfer mechanism during initial setup
2. **Legal review timing:** Transfer mechanism may require legal team approval (asynchronous)
3. **Phased implementation:** Organization may add mechanisms in bulk after initial data entry
4. **Flexibility:** Some organizations may have internal exemptions or interpretations

**Product philosophy:**
- **Guide, don't block:** Compliance software should educate users, not prevent progress
- **Gradual completion:** Enable "save draft" → "review" → "finalize" workflow
- **Trust users:** DPOs are experts, they may have valid reasons to defer mechanism selection

**Alternative considered:** Hard validation blocking save if third-country + no mechanism
- **Rejected:** Too restrictive, frustrates users, blocks legitimate workflows

**Future enhancement:** "Save as Draft" vs "Mark Complete" status
```typescript
model RecipientProcessingLocation {
  // ... existing fields
  completionStatus CompletionStatus @default(DRAFT)  // DRAFT | COMPLETE
}

enum CompletionStatus {
  DRAFT      // Allows missing transferMechanismId
  COMPLETE   // Enforces all compliance requirements
}
```

---

### 7. Historical Location Tracking (isActive flag)

**DECISION:** Manual deactivate old location + create new location pattern. NO automatic "Move Location" or "Update Country" convenience action in MVP.

**Rationale:**

**From codebase exploration:**
- AssetProcessingLocation uses `isActive: Boolean @default(true)` soft delete pattern
- DAL function: `deactivateAssetProcessingLocation(id)` sets `isActive = false`
- **No "move" or "update country" helper functions** in existing codebase
- Pattern: Explicit actions preserve audit trail clarity

**User Workflow (Manual Pattern):**
```
Scenario: Mailchimp migrates from US data centers to EU data centers

Step 1: User views Mailchimp recipient
  ● Email delivery - United States (Active)

Step 2: User clicks [Deactivate] on US location
  Modal: "Deactivate this location?"
  "This will mark the location as inactive but preserve it for audit trail.
   Historical documents will continue to reference this location."
  [Cancel] [Deactivate]

Step 3: System sets isActive = false
  ○ Email delivery - United States (Inactive)

Step 4: User clicks [+ Add New]
  Form: Create new processing location
  Service: Email delivery
  Country: Ireland
  [Create]

Step 5: Result
  ● Email delivery - Ireland (Active)
  ○ Email delivery - United States (Inactive)
```

**Implementation (DAL Layer):**
```typescript
// packages/database/src/dal/recipientProcessingLocations.ts

// Deactivate (soft delete)
export async function deactivateRecipientProcessingLocation(
  id: string
): Promise<RecipientProcessingLocation> {
  return prisma.recipientProcessingLocation.update({
    where: { id },
    data: {
      isActive: false,
      updatedAt: new Date()  // Automatic, but explicit for clarity
    }
  })
}

// Create new location (standard)
export async function createRecipientProcessingLocation(
  data: RecipientProcessingLocationCreateInput
): Promise<RecipientProcessingLocation> {
  return prisma.recipientProcessingLocation.create({
    data: {
      ...data,
      isActive: true  // Explicit default
    }
  })
}
```

**Why NO automatic "Move Location" action:**

1. **Audit trail clarity:**
   - Manual deactivate + create = 2 ComponentChangeLog entries
   - Atomic "move" = 1 entry, harder to track what changed

2. **Business logic ambiguity:**
   - Should "move" preserve `service`, `purposeId`, `transferMechanismId`?
   - What if mechanism changes (US = SCC, EU = none)?
   - User intent unclear: Is this same service relocated, or service redesign?

3. **Temporal accuracy:**
   - Manual actions allow different dates if migration phased
   - Mailchimp might run US + EU parallel for 3 months (both active)

4. **KISS principle:**
   - 2-step manual > 1-step automatic with 5 edge cases
   - Fewer lines of code = fewer bugs

**Alternative considered:** Automatic "Move to Country" helper
```typescript
// NOT IMPLEMENTING THIS IN MVP
export async function moveProcessingLocation(
  locationId: string,
  newCountryId: string,
  options?: {
    effectiveDate?: Date
    preserveService?: boolean
    updateTransferMechanism?: boolean
  }
): Promise<{ deactivated: RecipientProcessingLocation, created: RecipientProcessingLocation }> {
  // ... complex logic with 15 lines of conditionals
}
```
- **Rejected:** Premature optimization, adds complexity, unclear business rules

**Future enhancement (after user feedback):**
If users request it frequently (6+ months of usage):
```tsx
// UI shortcut (still uses 2-step pattern under the hood)
<DropdownMenu>
  <DropdownMenuTrigger>[⋮]</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setIsMoveModalOpen(true)}>
      Change Country
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDeactivate} variant="destructive">
      Deactivate
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

{/* Modal with prefilled form + auto-deactivate checkbox */}
<MoveLocationModal
  location={location}
  onMove={({ newCountryId, autoDeactivateOld }) => {
    // Still 2 operations, just UX sugar
    if (autoDeactivateOld) {
      deactivateMutation.mutate({ id: location.id })
    }
    createMutation.mutate({ ...location, countryId: newCountryId })
  }}
/>
```

**Decision rationale:** Start simple, add convenience based on real user workflows, not assumptions.

---

### 8. Integration with Activity Review Workflow

**DECISION:** Transfer analysis is a post-approval DPO compliance check, NOT part of activity review workflow during business stakeholder submission.

**Rationale:**

**Separation of Concerns:**

| Workflow Stage | Persona | Focus | Transfer Analysis Relevance |
|----------------|---------|-------|----------------------------|
| **Activity Submission** | Business Stakeholder (Marketing Manager) | Describe what data is processed, why, who accesses it | Low - stakeholder may not know processor locations |
| **Activity Review** | DPO / Privacy Officer | Validate completeness, identify risks, request clarifications | Medium - identify gaps, but don't block submission |
| **Post-Approval Compliance** | DPO / Legal Counsel | Ensure all recipients have locations, mechanisms in place | High - enforce compliance before go-live |

**From codebase exploration:**
- **No activity review UI found** in existing codebase (Item 16 future work)
- Existing pattern: Recipient model tracks `purpose` field, junction to ProcessingActivity via `ActivityRecipient`

**Workflow Design:**

**Phase 1: Activity Submission (Business Stakeholder)**
```
Marketing Manager creates "Email Newsletter Campaign" activity:
  ├─ Personal Data Categories: Email, Name
  ├─ Legal Basis: Consent
  ├─ Recipients: [Mailchimp (PROCESSOR)]  ← Select from catalog
  └─ Purpose: Marketing communications

[Submit for Review]

Note: Business stakeholder does NOT see/configure processing locations
```

**Phase 2: Activity Review (DPO)**
```
DPO reviews submitted activity:

┌─────────────────────────────────────────────────────────────┐
│ Activity: Email Newsletter Campaign                         │
│ Status: Pending Review                                      │
├─────────────────────────────────────────────────────────────┤
│ Recipients (1)                                              │
│ ● Mailchimp (PROCESSOR)                                    │
│   Purpose: Marketing communications                        │
│                                                             │
│   ⚠ Compliance Check:                                       │
│   - Processing locations: Not configured                    │
│   - Recommended: Add locations before approval              │
│                                                             │
│   [Configure Locations] (link to recipient detail)         │
└─────────────────────────────────────────────────────────────┘

[Request Changes] [Approve with Notes] [Approve]
```

**DPO Actions:**
1. **Option A:** Approve activity, add locations later (soft warning)
2. **Option B:** Navigate to Mailchimp recipient, configure locations, return to review
3. **Option C:** Request changes from stakeholder: "Please provide Mailchimp's data processing location"

**Phase 3: Post-Approval Compliance Dashboard (DPO)**
```
┌─────────────────────────────────────────────────────────────┐
│ Compliance Dashboard                                        │
├─────────────────────────────────────────────────────────────┤
│ Activities Approved but Incomplete (2)                      │
│                                                             │
│ ● Email Newsletter Campaign                                │
│   Approved: 2025-11-15                                     │
│   Issue: Recipient "Mailchimp" missing processing locations│
│   [Configure Now]                                          │
│                                                             │
│ ● Customer Onboarding Flow                                 │
│   Approved: 2025-11-20                                     │
│   Issue: Recipient "AWS" has US location without mechanism │
│   [Add Transfer Mechanism]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Service Layer Query:**
```typescript
export async function getApprovedActivitiesWithComplianceGaps(
  organizationId: string
): Promise<ActivityComplianceGap[]> {
  const activities = await prisma.dataProcessingActivity.findMany({
    where: {
      organizationId,
      status: 'APPROVED'
    },
    include: {
      activityRecipients: {
        include: {
          recipient: {
            include: {
              processingLocations: {
                where: { isActive: true },
                include: { country: true, transferMechanism: true }
              }
            }
          }
        }
      }
    }
  })

  // Identify gaps
  return activities.flatMap(activity => {
    const gaps: ActivityComplianceGap[] = []

    activity.activityRecipients.forEach(ar => {
      const recipient = ar.recipient

      // Gap 1: No processing locations configured
      if (recipient.processingLocations.length === 0) {
        gaps.push({
          activityId: activity.id,
          activityName: activity.name,
          recipientId: recipient.id,
          recipientName: recipient.name,
          gapType: 'MISSING_LOCATIONS',
          severity: 'HIGH'
        })
      }

      // Gap 2: Third-country location without mechanism
      recipient.processingLocations.forEach(loc => {
        if (isThirdCountry(loc.country) && !loc.transferMechanismId) {
          gaps.push({
            activityId: activity.id,
            activityName: activity.name,
            recipientId: recipient.id,
            recipientName: recipient.name,
            locationId: loc.id,
            countryName: loc.country.name,
            gapType: 'MISSING_TRANSFER_MECHANISM',
            severity: 'CRITICAL'
          })
        }
      })
    })

    return gaps
  })
}
```

**Why NOT during activity review workflow:**

1. **Role clarity:** Business stakeholders focus on "what/why", DPOs focus on "where/how"
2. **Workflow simplicity:** Don't block activity submission on data stakeholders may not have
3. **Progressive disclosure:** Show compliance details to DPOs, hide from non-experts
4. **Flexibility:** Some orgs approve activities before finalizing processor agreements

**Alternative considered:** Require recipient locations during activity submission
- **Rejected:** Burdens business stakeholders with compliance details they don't own

**Future enhancement:** Activity approval workflow stages
```
Activity Lifecycle:
  DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED_PENDING_COMPLIANCE → COMPLIANT

Post-approval transition:
  APPROVED_PENDING_COMPLIANCE → (DPO configures locations/mechanisms) → COMPLIANT
```

---

### 9. Scope Exclusions

**DECISION:** Exclude ALL four proposed features from MVP scope. Defer to future roadmap items (Item 40+).

**Rationale:**

#### Exclusion 1: Advanced Transfer Risk Scoring

**Proposed Feature:**
- Beyond basic "has mechanism yes/no"
- Risk matrix: Country risk + data sensitivity + mechanism strength
- Scoring: Low/Medium/High/Critical

**Why exclude:**
- **Complexity:** Requires risk scoring algorithm, data sensitivity taxonomy, mechanism strength ratings
- **Subjectivity:** Risk tolerance varies by organization, industry, jurisdiction
- **MVP scope creep:** Core value = location tracking + basic compliance flagging
- **Time estimate:** 2-3 weeks for scoring system + UI + testing

**MVP alternative:**
```typescript
// Simple boolean flags (sufficient for MVP)
interface TransferAnalysis {
  isThirdCountry: boolean
  requiresSafeguards: boolean
  hasMechanism: boolean
  isCompliant: boolean  // Derived: !requiresSafeguards || hasMechanism
}
```

**Future Item 42:** Transfer Risk Scoring System

---

#### Exclusion 2: Bulk Import/Export of Recipient Locations via CSV

**Proposed Feature:**
- CSV upload: `recipient_name,country,service,transfer_mechanism`
- CSV download: Export all locations for audit
- Template generation

**Why exclude:**
- **Low priority:** Most orgs have <50 recipients initially, manual entry acceptable
- **Error handling complexity:** Validation, duplicate detection, foreign key resolution
- **Time estimate:** 1-2 weeks for import/export + error UI + testing

**MVP alternative:**
- Manual entry via UI forms
- Database export via SQL for advanced users: `psma studio` → Export table

**Future Item 43:** Bulk Data Import/Export System (org-wide, not just locations)

---

#### Exclusion 3: Historical Location Timeline Visualization

**Proposed Feature:**
- Timeline chart: Show location changes over time
- "Mailchimp: US (2023-01) → EU (2023-06) → US+EU (2024-01)"
- Calendar view, diff visualization

**Why exclude:**
- **Nice-to-have:** Audit trail exists via ComponentChangeLog, queryable via SQL
- **Low user demand:** Requested by <5% of users in similar products
- **Time estimate:** 1-2 weeks for timeline UI component + chart library integration

**MVP alternative:**
- `isActive` flag preserves historical locations
- ComponentChangeLog tracks all changes
- Manual query: `SELECT * FROM ComponentChangeLog WHERE componentType = 'RecipientProcessingLocation'`

**Future Item 44:** Component Change Timeline Visualization (org-wide)

---

#### Exclusion 4: Integration with External Vendor Databases

**Proposed Feature:**
- Auto-populate processing locations from vendor APIs
- Examples: AWS regions API, Google Cloud locations, Salesforce data residency
- "Fetch Mailchimp's data centers automatically"

**Why exclude:**
- **API fragmentation:** Each vendor has different API structure, auth, rate limits
- **Maintenance burden:** Vendor APIs change, require ongoing updates
- **Trust issues:** Auto-populated data may be outdated, users must verify anyway
- **Time estimate:** 3-4 weeks for 3-5 vendor integrations

**MVP alternative:**
- Manual entry with guidance links
- Example placeholder text: "Check vendor's data processing addendum for locations"

**Future Item 45:** Vendor Integration Hub (after 20+ vendor integrations requested)

---

### Scope Summary

**IN SCOPE (MVP - Item 15):**
- RecipientProcessingLocation model (database + DAL + tRPC)
- Basic transfer detection service layer (isSameJurisdiction, isThirdCountry, requiresSafeguards)
- Embedded UI on recipient detail page (add/edit/deactivate locations)
- Dashboard compliance widget (gaps count + link to detail)
- Soft validation warnings (no blocking validation)
- Manual isActive flag management (deactivate old + create new)
- Sub-processor chain location aggregation (flat list with depth badges)

**OUT OF SCOPE (Future Items 42-45+):**
- Risk scoring algorithms
- CSV import/export
- Timeline visualization
- Vendor API integrations
- Real-time email notifications
- Automatic location migration helpers

---

## Implementation Priorities

### Phase 1: Foundation (Week 1)
1. Prisma schema: RecipientProcessingLocation model
2. Database migration
3. DAL functions: create, update, deactivate, getActiveForRecipient
4. Zod validation schemas

### Phase 2: Service Layer (Week 1-2)
5. Transfer detection helpers (isSameJurisdiction, isThirdCountry, requiresSafeguards)
6. Main service functions (detectCrossBorderTransfers, getActivityTransferAnalysis)
7. Sub-processor chain location aggregation (getAllProcessingLocationsInChain)
8. Compliance validation (validateLocationCompliance)

### Phase 3: API Layer (Week 2)
9. tRPC router: recipientProcessingLocationRouter (create, update, deactivate, listForRecipient)
10. tRPC router: complianceRouter (getTransferGaps)
11. Error handling integration (handlePrismaError)

### Phase 4: UI Components (Week 2-3)
12. RecipientProcessingLocationTable component (shadcn/ui Table)
13. CreateLocationModal / EditLocationModal (Form + validation)
14. Service autocomplete (Combobox with suggestions)
15. Compliance warnings (Toast notifications)
16. Dashboard ComplianceOverview widget

### Phase 5: Testing & Documentation (Week 3)
17. Integration tests (DAL layer)
18. E2E tests (Playwright - create recipient, add location, verify compliance warnings)
19. Update IMPLEMENTATION.md
20. Update ComponentChangeLog integration (Item 16 dependency)

---

## Code Reuse Reference

### Existing Features to Reference

**Item 14 - DigitalAsset & AssetProcessingLocation:**
- **Database:** `/packages/database/prisma/schema.prisma` (lines 820-917)
- **DAL:** `/packages/database/src/dal/digitalAssets.ts`, `/packages/database/src/dal/assetProcessingLocations.ts`
- **Validation:** `/packages/validation/src/schemas/digitalAssets/create.schema.ts`
- **tRPC:** `/apps/web/src/server/routers/digitalAssetRouter.ts`
- **Pattern:** Mirror field structure, indexes, cascade rules, soft delete pattern

**Item 12 - Recipient Hierarchy:**
- **Database:** `/packages/database/prisma/schema.prisma` (lines 665-704)
- **DAL:** `/packages/database/src/dal/recipients.ts`
- **Hierarchy Queries:** `getDescendantTree()` (recursive CTE), `getAncestorChain()`, `checkCircularReference()`
- **Pattern:** Reuse hierarchy traversal logic for sub-processor chain location aggregation

**Item 3 - Country & TransferMechanism:**
- **Database:** `/packages/database/prisma/schema.prisma` (lines 226-301)
- **DAL:** `/packages/database/src/dal/countries.ts`
- **Country.gdprStatus parsing:** Application-layer JSON array filtering
- **Pattern:** Use `getCountriesByGdprStatus()` pattern for compliance logic

**Service Layer Patterns:**
- **Transfer detection helpers:** Documented in `/agent-os/specs/README-items-14-16.md`
- **Soft validation pattern:** `validateAssetCompleteness()` returns `{ warnings: string[] }`
- **Error handling:** `/apps/web/src/server/utils/prisma-errors.ts` - `handlePrismaError()` wrapper

**Testing Patterns:**
- **Integration tests:** `/packages/database/__tests__/integration/dal/assetProcessingLocations.integration.test.ts`
- **Pattern:** Real database, factory functions, cleanup in `afterAll`

---

## Visual Assets (None Provided)

**Requested File Locations:**
- `/agent-os/specs/2025-12-06-recipient-processing-locations/planning/visuals/recipient-location-management-ui.png`
- `/agent-os/specs/2025-12-06-recipient-processing-locations/planning/visuals/transfer-detection-dashboard.png`
- `/agent-os/specs/2025-12-06-recipient-processing-locations/planning/visuals/sub-processor-chain-visualization.png`
- `/agent-os/specs/2025-12-06-recipient-processing-locations/planning/visuals/existing-asset-location-ui-screenshot.png`

**Status:** No visual assets provided. UI design will follow existing shadcn/ui patterns and Item 14 design intent.

---

## Review & Approval

**Next Steps:**
1. **User review:** Review decisions 1-9, provide feedback/adjustments
2. **Spec-writer agent:** Generate detailed technical specification document
3. **Task-list-creator agent:** Break down implementation into atomic tasks
4. **Implementer agent:** Execute tasks following specification

**Approval Required Before Proceeding:**
- [ ] UI pattern decision (embedded vs separate page)
- [ ] Validation timing decision (soft warnings vs hard blocking)
- [ ] Scope exclusions confirmed
- [ ] MVP timeline acceptable (2-3 weeks estimate)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-05
**Author:** Product/Technical Planning (via Claude Code)
