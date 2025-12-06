# Known Limitations & Future Work

## Current Limitations (Phase 2)

### 1. Organization Headquarters Requirement

**Issue:** Transfer detection requires `Organization.headquartersCountryId`

**Impact:**
- Organizations without headquarters country cannot use transfer detection
- `detectCrossBorderTransfers` returns empty array
- `getActivityTransferAnalysis` throws error

**Workaround:**
- Graceful degradation: Functions return empty/default results
- UI should prompt for headquarters country on org setup

**Future Work:**
- Consider multi-headquarters support (multinational corporations)
- Add warning in UI when headquarters not set

### 2. No UI Implementation Yet

**Issue:** tRPC API exists but has no frontend consumer

**Impact:**
- Cannot test full end-to-end user workflows
- Error messages not validated in real UI context
- Form validation patterns not tested with React Hook Form

**Status:** Pending Item 16c (Recipient Management UI)

**Timeline:** TBD

### 3. Transfer Mechanism Expiration Not Supported

**Issue:** No expiration date field on TransferMechanism

**Impact:**
- Cannot track when SCCs need renewal
- No automated alerts for expired mechanisms

**Future Work:**
- Add `expiresAt` field to TransferMechanism model
- Add expiration warning system (Item 42-43 dashboard integration)

### 4. Binding Corporate Rules (BCR) Not Fully Tested

**Issue:** BCR scenario exists in spec but minimal testing

**Impact:**
- BCR-specific validation logic not exercised
- No real-world BCR scenarios in test suite

**Future Work:**
- Add BCR test scenarios when real BCR use case emerges
- Document BCR-specific requirements

### 5. Completeness Check Not Integrated

**Issue:** `checkRecipientLocationCompleteness()` function defined but not used

**Impact:**
- No automated warnings for incomplete data
- Manual verification required

**Future Work:**
- Integrate with dashboard metrics (Items 42-43)
- Add to recipient detail page as info panel

### 6. Performance Not Validated at Scale

**Issue:** All tests use small datasets (1-10 entities)

**Impact:**
- Unknown performance characteristics with 100+ recipients
- Index effectiveness not validated
- Query optimization opportunities not identified

**Future Work:**
- Add performance test suite (Phase 2)
- Document performance baselines
- Optimize queries if needed

### 7. Multi-Country Testing Limited

**Issue:** Only EU-US scenario tested in Phase 1

**Impact:**
- Unknown behavior with 5+ countries
- Mixed adequacy scenarios not tested
- Brexit-specific logic not validated

**Future Work:**
- Add multi-country test suite (Phase 2)
- Document common country combinations
- Create test data factories for global scenarios

### 8. Concurrent Update Handling Not Tested

**Issue:** No tests for simultaneous location moves

**Impact:**
- Unknown behavior when two users update same location
- Potential race conditions not identified

**Future Work:**
- Add concurrency tests
- Document expected behavior
- Add optimistic locking if needed

## Architectural Decisions Limiting Future Flexibility

### 1. Single Headquarters Model

**Decision:** Organization has one `headquartersCountryId`

**Limitation:** Cannot represent multinational corporations with multiple headquarters

**Rationale:** Simplifies transfer detection logic, covers 95% of use cases

**If Needed:** Add `Organization.operatingCountries` array field

### 2. Location Role Enum (HOSTING, PROCESSING, BOTH)

**Decision:** Three-value enum

**Limitation:** Cannot represent more granular roles (e.g., "STORAGE_ONLY", "TRANSIT")

**Rationale:** Covers GDPR Article 30 requirements

**If Needed:** Extend enum or add `roleDetails` JSON field

### 3. Single Transfer Mechanism Per Location

**Decision:** `transferMechanismId` is nullable string, not array

**Limitation:** Cannot represent locations with multiple mechanisms

**Rationale:** Simplifies validation, one mechanism is sufficient

**If Needed:** Add junction table `LocationTransferMechanisms`

## Non-Goals (Out of Scope)

### 1. Automatic Adequacy Decision Tracking

**Not Implemented:** System does not automatically update when EU Commission changes adequacy decisions

**Rationale:** Political decisions are infrequent, manual updates acceptable

### 2. Transfer Impact Assessment Automation

**Not Implemented:** No automated TIA generation based on locations

**Rationale:** Belongs in Item 38 (DPIA Generation)

### 3. Location Geolocation/Mapping

**Not Implemented:** No latitude/longitude, no map visualization

**Rationale:** Country-level precision sufficient for GDPR compliance

### 4. Real-Time Transfer Monitoring

**Not Implemented:** No tracking of actual data flows

**Rationale:** This is compliance documentation, not runtime monitoring

## Migration Path to Future Versions

### If Multi-Headquarters Required

1. Add `Organization.operatingCountries` JSON array
2. Migrate existing `headquartersCountryId` to array
3. Update transfer detection to check all operating countries
4. Add UI for managing multiple countries

### If Mechanism Expiration Required

1. Add `TransferMechanism.expiresAt` nullable date
2. Add `TransferMechanism.renewalNoticeMonths` integer
3. Create background job to check expirations
4. Add dashboard widget for expiring mechanisms

### If BCR Support Needed

1. Add `TransferMechanism.bcrDetails` JSON field
2. Add BCR-specific validation rules
3. Create BCR approval workflow
4. Document BCR requirements in spec

## Support & Questions

**For Phase 2 Testing:** See PHASE2_TESTING_PLAN.md
**For API Integration:** See integration-contract.md
**For Architectural Questions:** See planning/architectural-decisions.md
