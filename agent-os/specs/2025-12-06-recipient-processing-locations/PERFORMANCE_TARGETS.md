# Performance Targets & Baselines

## Query Performance Targets

### DAL Layer

| Operation | Target | Test Dataset | Notes |
|-----------|--------|--------------|-------|
| getActiveLocationsForRecipient | < 100ms | 10 locations | Index on recipientId + isActive |
| getAllLocationsForRecipient | < 150ms | 10 locations | Index on recipientId |
| getRecipientLocationsByCountry | < 200ms | 20 recipients | Index on organizationId + countryId |
| getLocationsWithParentChain | < 200ms | 10-level chain | Index on parentRecipientId |
| createRecipientProcessingLocation | < 50ms | Single insert | With validation |
| updateRecipientProcessingLocation | < 75ms | Single update | With validation |
| moveRecipientProcessingLocation | < 150ms | Transaction | Create + deactivate |
| deactivateRecipientProcessingLocation | < 50ms | Single update | Soft delete |

### Service Layer

| Operation | Target | Test Dataset | Notes |
|-----------|--------|--------------|-------|
| detectCrossBorderTransfers | < 500ms | 100 recipients | With 200 locations |
| getActivityTransferAnalysis | < 1000ms | 50 recipients | Full analysis |
| validateTransferMechanismRequirement | < 10ms | Single validation | Pure function |

### tRPC API

| Procedure | Target | Notes |
|-----------|--------|-------|
| create | < 100ms | Includes validation + DB insert |
| getActiveForRecipient | < 150ms | Includes serialization |
| detectTransfers | < 600ms | Service layer + serialization |
| analyzeActivityTransfers | < 1200ms | Service layer + serialization |

## Index Effectiveness Verification

### Critical Indexes

1. **RecipientProcessingLocation.recipientId**
   - Usage: All recipient-scoped queries
   - Verify: Seq Scan never appears in EXPLAIN

2. **RecipientProcessingLocation.organizationId**
   - Usage: Multi-tenancy filtering
   - Verify: Always used in WHERE clause

3. **RecipientProcessingLocation.countryId**
   - Usage: Country-based filtering
   - Verify: Used for location grouping

4. **Recipient.parentRecipientId**
   - Usage: Hierarchy traversal
   - Verify: Used in recursive CTEs

5. **Organization.headquartersCountryId**
   - Usage: Transfer detection
   - Verify: Used in joins

### Verification Queries

```sql
-- Verify index usage for active locations query
EXPLAIN ANALYZE
SELECT * FROM "RecipientProcessingLocation"
WHERE "recipientId" = 'test-id'
  AND "isActive" = true
  AND "organizationId" = 'org-id';

-- Should show: Index Scan using RecipientProcessingLocation_recipientId_idx

-- Verify hierarchy traversal efficiency
EXPLAIN ANALYZE
WITH RECURSIVE ancestor_chain AS (
  SELECT * FROM "Recipient" WHERE id = 'test-id'
  UNION ALL
  SELECT r.* FROM "Recipient" r
  INNER JOIN ancestor_chain ac ON r.id = ac."parentRecipientId"
)
SELECT * FROM ancestor_chain;

-- Should show: Index Scan using Recipient_parentRecipientId_idx
```

## Baseline Measurements (To Be Established)

### Small Dataset (Development Baseline)
- 10 recipients, 20 locations
- detectCrossBorderTransfers: **TBD ms** (measure in Phase 2)
- getActivityTransferAnalysis: **TBD ms**

### Medium Dataset (Typical Production)
- 50 recipients, 100 locations
- detectCrossBorderTransfers: **TBD ms**
- getActivityTransferAnalysis: **TBD ms**

### Large Dataset (Stress Test)
- 100 recipients, 200 locations
- detectCrossBorderTransfers: **TBD ms**
- getActivityTransferAnalysis: **TBD ms**

## Performance Testing Checklist

- [ ] Measure all DAL operations with standard datasets
- [ ] Measure service layer operations with large datasets
- [ ] Verify index usage with EXPLAIN ANALYZE
- [ ] Document actual measurements as baselines
- [ ] Identify optimization opportunities if targets not met
- [ ] Add performance regression tests to CI/CD

## Optimization Opportunities (If Needed)

1. **Add indexes** for specific query patterns
2. **Denormalize** transfer risk calculations if too slow
3. **Cache** country GDPR status lookups
4. **Batch** hierarchy traversals if needed
5. **Optimize** recursive CTEs with better WHERE clauses
