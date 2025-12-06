# Phase 2 Testing Plan: Comprehensive Coverage

## Overview

Phase 1 delivered 51 passing tests covering core CRUD operations, basic validation, and simple scenarios. Phase 2 expands coverage to complex real-world scenarios, edge cases, and performance baselines.

## Testing Gaps Identified

### 1. Multi-Country Scenarios (Priority: HIGH)

**Current Coverage:** EU-US transfer only
**Gap:** Organizations operating in 5+ countries with mixed mechanisms

**New Tests to Add:**
1. **Global organization scenario** - EU org with locations in US, UK, Canada, India, Singapore
2. **Mixed adequacy scenario** - Recipients in adequate countries (Japan, Canada) + third countries
3. **Multiple mechanisms** - Different mechanisms per country (SCC for US, BCR for UK)
4. **Post-Brexit UK scenario** - UK as third country requiring safeguards
5. **Adequacy decision change** - Test what happens when adequacy status changes
6. **Same service, multiple countries** - "Email processing" in both US and Switzerland

**File:** `packages/database/__tests__/integration/dal/recipientProcessingLocations-multi-country.test.ts` (NEW)
**Estimated:** 6 new tests

### 2. Deep Hierarchy Testing (Priority: HIGH)

**Current Coverage:** 2-level processor chains max
**Gap:** Deep hierarchies (3-4+ levels), sibling networks

**New Tests to Add:**
1. **4-level processor chain** - Processor → Sub → Sub-sub → Sub-sub-sub
2. **Sibling sub-processors** - Parent with 5+ sub-processors, each with locations
3. **Mixed active/inactive in hierarchy** - Some locations deactivated in chain
4. **Large sibling network** - 10+ sub-processors per parent
5. **Circular reference prevention** - Verify cannot create circular parent chains

**File:** Expand `packages/database/__tests__/integration/workflows/recipientProcessingLocation-workflows.integration.test.ts`
**Estimated:** 5 new tests

### 3. Performance Baselines (Priority: MEDIUM)

**Current Coverage:** Small datasets (1-3 entities)
**Gap:** Scale testing with 50-100+ entities

**New Tests to Add:**
1. **Large organization** - 100 recipients, 200+ locations
2. **Large activity analysis** - Activity with 50+ recipients
3. **Deep hierarchy traversal** - 10-level deep chain performance
4. **Bulk detection** - `detectCrossBorderTransfers` with 100+ recipients

**File:** `packages/database/__tests__/integration/performance/recipientProcessingLocations-scale.test.ts` (NEW)
**Estimated:** 4 new tests
**Success Criteria:**
- getActiveLocationsForRecipient: < 100ms with 10 locations
- detectCrossBorderTransfers: < 500ms with 100 recipients
- getLocationsWithParentChain: < 200ms with 10-level chain

### 4. Edge Cases & Error Scenarios (Priority: MEDIUM)

**Current Coverage:** Basic validation errors
**Gap:** Real-world edge cases, recovery scenarios

**New Tests to Add:**
1. **Inactive recipient** - Can/cannot add locations to inactive recipient?
2. **Inactive country** - Should block location creation with inactive country
3. **Concurrent updates** - Two simultaneous location moves
4. **Soft delete recovery** - Reactivate deactivated location workflow
5. **Cascade delete verification** - Org delete cascades to locations

**File:** Expand existing test files
**Estimated:** 5 new tests

### 5. Completeness Check Function (Priority: LOW)

**Current Coverage:** None (function not tested)
**Gap:** `checkRecipientLocationCompleteness()` validation

**New Tests to Add:**
1. **PROCESSOR without locations** - Should trigger warning
2. **Location with purposeText but no purposeId** - Info warning
3. **Multiple completeness issues** - Combined warnings
4. **Dashboard integration** - Verify completeness metrics

**File:** `packages/database/__tests__/integration/dal/recipientProcessingLocations-completeness.test.ts` (NEW)
**Estimated:** 4 new tests

## Total New Tests: 24 tests

**Phase 1:** 51 tests
**Phase 2 Addition:** 24 tests
**Phase 2 Total:** 75 tests

## Implementation Order

1. **Week 1:** Multi-country scenarios (6 tests)
2. **Week 1-2:** Deep hierarchy tests (5 tests)
3. **Week 2:** Performance baselines (4 tests)
4. **Week 2-3:** Edge cases (5 tests)
5. **Week 3:** Completeness checks (4 tests)

## Success Criteria

- All 75 tests passing
- Performance benchmarks established and documented
- Code coverage > 85% for DAL and service layers
- No critical gaps in multi-country validation
- Edge cases documented with expected behavior
