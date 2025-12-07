# Tier 3 Change Tracking Implementation Pattern

**Status:** Deferred to future implementation
**Models:** Purpose, LegalBasis, Recipient

This document provides the implementation pattern for adding change tracking to Tier 3 models (Purpose, LegalBasis, Recipient). The pattern is identical to Tier 1 and Tier 2 implementations.

## Overview

Tier 3 models are deferred from Item 16 but can be implemented using the same generic framework established for Tier 1 and Tier 2. This document shows the exact steps needed.

## Implementation Steps

### Step 1: Add Tracked Fields Configuration

In `src/middleware/changeTracking.ts`, the `TRACKED_FIELDS_BY_MODEL` configuration already includes Tier 3 models:

```typescript
export const TRACKED_FIELDS_BY_MODEL: Record<string, string[]> = {
  // ... Tier 1 and Tier 2 fields ...

  // TIER 3 (CAN) - Deferred to future implementation
  Purpose: ['name', 'description', 'category', 'scope', 'isActive'],
  LegalBasis: ['type', 'name', 'framework', 'requiresConsent', 'consentMechanism', 'isActive'],
  Recipient: [
    'type',
    'externalOrganizationId',
    'purpose',
    'description',
    'parentRecipientId',
    'isActive',
  ],
}
```

**No code changes needed** - configuration already exists.

### Step 2: Add Extension Wrappers

Add the following code blocks to the `createPrismaWithTracking` function in `changeTracking.ts`:

```typescript
// PURPOSE Change Tracking
purpose: {
  ...basePrisma.purpose,
  create: async (args: any) => {
    if (isDisabled()) return basePrisma.purpose.create(args)

    const result = await basePrisma.purpose.create(args)

    // Log CREATED
    await logChange({
      organizationId: contextOrganizationId ?? result.organizationId,
      componentType: 'Purpose',
      componentId: result.id,
      changeType: 'CREATED',
      oldValue: null,
      newValue: result,
      context,
    })

    return result
  },

  update: async (args: any) => {
    if (isDisabled()) return basePrisma.purpose.update(args)

    // Fetch before state
    const before = await basePrisma.purpose.findUnique({
      where: args.where,
    })

    if (!before) {
      throw new Error('Cannot update non-existent Purpose')
    }

    // Execute update
    const result = await basePrisma.purpose.update(args)

    // Detect changed fields
    const trackedFields = TRACKED_FIELDS_BY_MODEL['Purpose'] ?? []
    const changedFields = trackedFields.filter(
      (field) => (before as any)[field] !== (result as any)[field]
    )

    // Log each changed field
    for (const field of changedFields) {
      await logChange({
        organizationId: contextOrganizationId ?? result.organizationId,
        componentType: 'Purpose',
        componentId: result.id,
        changeType: 'UPDATED',
        fieldChanged: field,
        oldValue: before,
        newValue: result,
        context,
      })
    }

    return result
  },
},

// LEGAL BASIS Change Tracking
legalBasis: {
  ...basePrisma.legalBasis,
  create: async (args: any) => {
    if (isDisabled()) return basePrisma.legalBasis.create(args)

    const result = await basePrisma.legalBasis.create(args)

    // Log CREATED
    await logChange({
      organizationId: contextOrganizationId ?? result.organizationId,
      componentType: 'LegalBasis',
      componentId: result.id,
      changeType: 'CREATED',
      oldValue: null,
      newValue: result,
      context,
    })

    return result
  },

  update: async (args: any) => {
    if (isDisabled()) return basePrisma.legalBasis.update(args)

    // Fetch before state
    const before = await basePrisma.legalBasis.findUnique({
      where: args.where,
    })

    if (!before) {
      throw new Error('Cannot update non-existent LegalBasis')
    }

    // Execute update
    const result = await basePrisma.legalBasis.update(args)

    // Detect changed fields
    const trackedFields = TRACKED_FIELDS_BY_MODEL['LegalBasis'] ?? []
    const changedFields = trackedFields.filter(
      (field) => (before as any)[field] !== (result as any)[field]
    )

    // Log each changed field
    for (const field of changedFields) {
      await logChange({
        organizationId: contextOrganizationId ?? result.organizationId,
        componentType: 'LegalBasis',
        componentId: result.id,
        changeType: 'UPDATED',
        fieldChanged: field,
        oldValue: before,
        newValue: result,
        context,
      })
    }

    return result
  },
},

// RECIPIENT Change Tracking
recipient: {
  ...basePrisma.recipient,
  create: async (args: any) => {
    if (isDisabled()) return basePrisma.recipient.create(args)

    const result = await basePrisma.recipient.create(args)

    // Log CREATED
    await logChange({
      organizationId: contextOrganizationId ?? result.organizationId,
      componentType: 'Recipient',
      componentId: result.id,
      changeType: 'CREATED',
      oldValue: null,
      newValue: result,
      context,
    })

    return result
  },

  update: async (args: any) => {
    if (isDisabled()) return basePrisma.recipient.update(args)

    // Fetch before state (no nested includes needed for Recipient)
    const before = await basePrisma.recipient.findUnique({
      where: args.where,
    })

    if (!before) {
      throw new Error('Cannot update non-existent Recipient')
    }

    // Execute update
    const result = await basePrisma.recipient.update(args)

    // Detect changed fields
    const trackedFields = TRACKED_FIELDS_BY_MODEL['Recipient'] ?? []
    const changedFields = trackedFields.filter(
      (field) => (before as any)[field] !== (result as any)[field]
    )

    // Log each changed field
    for (const field of changedFields) {
      await logChange({
        organizationId: contextOrganizationId ?? result.organizationId,
        componentType: 'Recipient',
        componentId: result.id,
        changeType: 'UPDATED',
        fieldChanged: field,
        oldValue: before,
        newValue: result,
        context,
      })
    }

    return result
  },
},
```

### Step 3: Add Tests

Create tests in `__tests__/integration/middleware/changeTracking-tier3.integration.test.ts`:

```typescript
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Organization } from '../../../generated/client/client'
import { createPrismaWithTracking } from '../../../src/middleware/changeTracking'
import { prisma } from '../../../src'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils'

describe('Change Tracking Extension - Tier 3 Models', () => {
  let testOrg: Organization

  beforeAll(async () => {
    const { org } = await createTestOrganization({
      name: `ChangeTrackTier3-${Date.now()}`,
      slug: `change-track-tier3-${Date.now()}`,
      userCount: 1,
    })
    testOrg = org
  })

  afterAll(async () => {
    await cleanupTestOrganizations([testOrg.id])
  })

  describe('Purpose tracking', () => {
    it('should track Purpose name change', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a purpose
      const purpose = await prismaWithTracking.purpose.create({
        data: {
          organizationId: testOrg.id,
          code: `TEST_PURPOSE_${Date.now()}`,
          name: 'Original Purpose',
          description: 'Test purpose',
          category: 'BUSINESS',
          scope: 'INTERNAL',
          isActive: true,
        },
      })

      // Update name (tracked field)
      await prismaWithTracking.purpose.update({
        where: { id: purpose.id },
        data: { name: 'Updated Purpose Name' },
      })

      // Verify change log created
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'Purpose',
          componentId: purpose.id,
          fieldChanged: 'name',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')
    })
  })

  describe('LegalBasis tracking', () => {
    it('should track LegalBasis framework change', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create a legal basis
      const legalBasis = await prismaWithTracking.legalBasis.create({
        data: {
          organizationId: testOrg.id,
          code: `TEST_LEGAL_BASIS_${Date.now()}`,
          name: 'Test Legal Basis',
          type: 'CONSENT',
          framework: 'GDPR',
          requiresConsent: true,
          consentMechanism: 'Opt-in checkbox',
          isActive: true,
        },
      })

      // Update framework (tracked field)
      await prismaWithTracking.legalBasis.update({
        where: { id: legalBasis.id },
        data: { framework: 'CCPA' },
      })

      // Verify change log created
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'LegalBasis',
          componentId: legalBasis.id,
          fieldChanged: 'framework',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')
    })
  })

  describe('Recipient tracking', () => {
    it('should track Recipient type change', async () => {
      const prismaWithTracking = createPrismaWithTracking(prisma)

      // Create external org
      const externalOrg = await prisma.externalOrganization.create({
        data: {
          organizationId: testOrg.id,
          legalName: `Test External Org ${Date.now()}`,
        },
      })

      // Create a recipient
      const recipient = await prismaWithTracking.recipient.create({
        data: {
          organizationId: testOrg.id,
          name: 'Test Recipient',
          type: 'PROCESSOR',
          externalOrganizationId: externalOrg.id,
          isActive: true,
        },
      })

      // Update type (tracked field)
      await prismaWithTracking.recipient.update({
        where: { id: recipient.id },
        data: { type: 'CONTROLLER' },
      })

      // Verify change log created
      const changeLog = await prisma.componentChangeLog.findFirst({
        where: {
          organizationId: testOrg.id,
          componentType: 'Recipient',
          componentId: recipient.id,
          fieldChanged: 'type',
        },
      })

      expect(changeLog).toBeDefined()
      expect(changeLog!.changeType).toBe('UPDATED')
    })
  })
})
```

## Key Points

1. **Same Pattern**: Tier 3 uses identical pattern to Tier 1/2
2. **No Nested Includes**: Purpose, LegalBasis, and Recipient don't need flattened snapshots (no foreign keys to Country or TransferMechanism)
3. **Configuration Already Exists**: `TRACKED_FIELDS_BY_MODEL` already has Tier 3 fields defined
4. **Generic Framework**: The `logChange` helper function handles all the complexity

## Effort Estimate

- **Code**: ~150 lines (copy-paste from Tier 1/2 with model name changes)
- **Tests**: ~100 lines (follow same pattern as Tier 2 tests)
- **Total Time**: 2-3 hours including testing

## Future Implementation Checklist

When implementing Tier 3 in a future item:

- [ ] Add extension wrappers for Purpose, LegalBasis, Recipient (Step 2)
- [ ] Create Tier 3 test file with ~9 tests (Step 3)
- [ ] Run tests to verify tracking works
- [ ] Update exports in `src/index.ts` if needed (likely already exported)
- [ ] Document in implementation report

## References

- **Spec**: `spec.md` lines 79-84
- **Requirements**: `requirements.md` lines 325-356
- **Tier 1 Implementation**: See `AssetProcessingLocation`, `RecipientProcessingLocation`, `DataProcessingActivity` in `changeTracking.ts`
- **Tier 2 Implementation**: See `TransferMechanism`, `DataSubjectCategory`, `DataCategory` in `changeTracking.ts`
