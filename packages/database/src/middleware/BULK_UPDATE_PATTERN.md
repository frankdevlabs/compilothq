# Bulk Update Pattern for Tracked Models

## Overview

Models with change tracking (`AssetProcessingLocation`, `RecipientProcessingLocation`, `DataProcessingActivity`, `TransferMechanism`, `DataSubjectCategory`, `DataCategory`, etc.) **MUST NOT** use `updateMany` operations.

Change tracking requires per-row update operations to accurately log changes with before/after snapshots for each individual record.

## Why updateMany Doesn't Work

The Prisma client extension intercepts `.update()` calls to:

1. Fetch the "before" state of a specific record
2. Execute the update
3. Fetch the "after" state
4. Compare tracked fields
5. Create a `ComponentChangeLog` entry with snapshots

`updateMany` updates multiple rows in a single SQL statement and doesn't return individual record details, making it impossible to generate accurate per-record change logs.

## Correct Pattern: Per-Row Updates

### ✅ CORRECT: Iterate and Update Individually

```typescript
// Example: Bulk deactivate locations in a specific country
async function deactivateLocationsByCountry(
  organizationId: string,
  countryId: string
): Promise<number> {
  // Step 1: Fetch IDs of records to update
  const locationsToUpdate = await prisma.recipientProcessingLocation.findMany({
    where: {
      organizationId,
      countryId,
      isActive: true,
    },
    select: { id: true }, // Only fetch IDs for efficiency
  })

  // Step 2: Iterate and update each record individually
  let updatedCount = 0
  for (const location of locationsToUpdate) {
    await prismaWithTracking.recipientProcessingLocation.update({
      where: { id: location.id },
      data: { isActive: false },
    })
    updatedCount++
  }

  return updatedCount
}
```

### ✅ CORRECT: With Transaction for Atomicity

```typescript
// Example: Bulk update with transaction
async function updateTransferMechanismForCountry(
  organizationId: string,
  fromCountryId: string,
  toMechanismId: string
): Promise<number> {
  return await prisma.$transaction(async (tx) => {
    // Step 1: Fetch IDs
    const locations = await tx.recipientProcessingLocation.findMany({
      where: {
        organizationId,
        countryId: fromCountryId,
        isActive: true,
      },
      select: { id: true },
    })

    // Step 2: Update each record using prismaWithTracking
    for (const location of locations) {
      await prismaWithTracking.recipientProcessingLocation.update({
        where: { id: location.id },
        data: { transferMechanismId: toMechanismId },
      })
    }

    return locations.length
  })
}
```

### ✅ CORRECT: With Context (userId and changeReason)

```typescript
// Example: Bulk update with user context
async function bulkUpdateRiskLevel(
  organizationId: string,
  activityIds: string[],
  newRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  userId: string,
  changeReason: string
): Promise<number> {
  // Note: Context needs to be passed to the extension function
  // Current implementation doesn't support runtime context,
  // but this shows the intended pattern for future enhancement

  let updatedCount = 0
  for (const activityId of activityIds) {
    await prismaWithTracking.dataProcessingActivity.update({
      where: { id: activityId, organizationId },
      data: { riskLevel: newRiskLevel },
    })
    updatedCount++
  }

  return updatedCount
}
```

## ❌ INCORRECT Patterns

### ❌ WRONG: Using updateMany

```typescript
// ❌ WRONG: This will NOT create change logs
async function deactivateLocationsByCountry(organizationId: string, countryId: string) {
  // This bypasses change tracking!
  return await prisma.recipientProcessingLocation.updateMany({
    where: {
      organizationId,
      countryId,
      isActive: true,
    },
    data: { isActive: false },
  })
}
```

**Problem:** No change logs created. The extension doesn't intercept `updateMany`.

### ❌ WRONG: Trying to Wrap updateMany

```typescript
// ❌ WRONG: updateMany not supported by extension
async function bulkUpdate(ids: string[], data: object) {
  // This won't work - extension only intercepts .update()
  return await prismaWithTracking.recipientProcessingLocation.updateMany({
    where: { id: { in: ids } },
    data,
  })
}
```

**Problem:** Extension doesn't intercept `updateMany` operations.

## Performance Considerations

### When to Use Per-Row Pattern

Use per-row updates for tracked models when:

- ✅ Updating fewer than 1000 records
- ✅ Change audit trail is required (compliance models)
- ✅ Accurate before/after snapshots needed for each record

### Large-Scale Operations

For bulk operations on 1000+ records:

1. **Consider if tracking is necessary**: If updating non-critical fields not in `TRACKED_FIELDS_BY_MODEL`, you might temporarily disable tracking:

   ```typescript
   // Set environment variable temporarily (test/script context only)
   process.env['DISABLE_CHANGE_TRACKING'] = 'true'
   await prisma.recipientProcessingLocation.updateMany({...})
   delete process.env['DISABLE_CHANGE_TRACKING']
   ```

2. **Batch in chunks**: Process records in smaller batches with delay between batches:

   ```typescript
   const BATCH_SIZE = 100
   for (let i = 0; i < ids.length; i += BATCH_SIZE) {
     const batch = ids.slice(i, i + BATCH_SIZE)
     for (const id of batch) {
       await prismaWithTracking.model.update({...})
     }
     // Optional: Add delay to avoid overwhelming database
     await new Promise(resolve => setTimeout(resolve, 100))
   }
   ```

3. **Use background jobs**: For very large operations, use BullMQ job queues to process updates asynchronously.

## Transaction Safety

Per-row updates in transactions maintain atomicity:

```typescript
await prisma.$transaction(async (tx) => {
  for (const id of ids) {
    // All updates succeed or all fail together
    await prismaWithTracking.model.update({
      where: { id },
      data: {...},
    })
  }
})
```

## Testing Per-Row Updates

Always test bulk update functions to verify change logs are created:

```typescript
it('should create change logs for each updated record', async () => {
  // Arrange: Create test records
  const location1 = await createTestLocation()
  const location2 = await createTestLocation()

  // Act: Bulk update
  await bulkDeactivateLocations([location1.id, location2.id])

  // Assert: Change logs exist for both
  const changeLogs = await prisma.componentChangeLog.findMany({
    where: {
      componentId: { in: [location1.id, location2.id] },
      changeType: 'UPDATED',
      fieldChanged: 'isActive',
    },
  })

  expect(changeLogs).toHaveLength(2)
})
```

## Summary

| Pattern                    | Supported | Change Logs    | Use Case                       |
| -------------------------- | --------- | -------------- | ------------------------------ |
| `.update()` with single ID | ✅ Yes    | ✅ Created     | Standard single-record updates |
| Per-row iteration          | ✅ Yes    | ✅ Created     | Bulk updates on tracked models |
| `.updateMany()`            | ❌ No     | ❌ Not created | Only for non-tracked models    |

**Key Rule**: For tracked models (`AssetProcessingLocation`, `RecipientProcessingLocation`, `DataProcessingActivity`, etc.), always use per-row `.update()` calls, never `.updateMany()`.
