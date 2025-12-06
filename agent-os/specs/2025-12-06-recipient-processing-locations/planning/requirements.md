# Spec Requirements: RecipientProcessingLocation Model and Cross-Border Transfer Detection

## Initial Description

**Roadmap Item #15:** Recipient Processing Locations & Transfer Detection

**Purpose:** Track WHERE a recipient/processor processes data (parallel to AssetProcessingLocation implemented in Item 14). Enable service layer to derive cross-border transfers by comparing organization country with processing locations.

**Key Architectural Decisions from Guidance Document:**

1. Processing locations are properties of entities (recipients) - NOT separate transfer entities
2. Cross-border transfers are DERIVED via service layer composition - NOT stored as database entities
3. Uses Country.gdprStatus JSON for compliance logic - to identify EU/EEA vs third countries
4. Includes transfer mechanism validation - for third countries requiring safeguards under Article 46
5. Supports sub-processor chain traversal - via Recipient hierarchy (parentRecipient relationships)

**Core Model:** RecipientProcessingLocation with fields for service, purpose, country, locationRole, transferMechanismId, and isActive flag.

**Service Layer:** Transfer detection comparing Organization.headquartersCountryId with RecipientProcessingLocation.countryId using Country.gdprStatus JSON to identify cross-border transfers and flag locations without transferMechanismId when safeguards required.

## Requirements Discussion

### First Round Questions

**Q1: UI Pattern - Embedded Interface vs Standalone Management Page**
I'm assuming RecipientProcessingLocations should be managed via an embedded table/list on the Recipient detail page (similar to how Item 14 manages AssetProcessingLocation within the DigitalAsset detail page), with inline add/edit/deactivate controls. Alternatively, should there be a standalone "Recipient Locations" management page with global filtering and bulk operations?

**Answer:** Embedded interface on Recipient detail page, mirroring AssetProcessingLocation pattern from Item 14. Inline add/edit/deactivate controls. Global "risky locations" view is out of scope for Item 15 (future dashboard items).

---

**Q2: Creation Workflow - Optional vs Required Locations**
I'm thinking that when creating/editing a PROCESSOR or SUB_PROCESSOR recipient, we should require at least one RecipientProcessingLocation to be added (hard validation preventing save). Alternatively, should locations be optional initially with a soft warning/reminder, allowing DPOs to create recipient records and add locations later?

**Answer:** Allow creating recipients without locations initially (including PROCESSOR/SUB_PROCESSOR). Show non-blocking warning on save for PROCESSOR/SUB_PROCESSOR if no locations. Track "missing locations" as completeness issue for future dashboards.

---

**Q3: Transfer Detection Alerts - Real-time vs Batch**
For cross-border transfer risk detection (e.g., "US location without transfer mechanism"), should the service layer provide real-time inline warnings in the Recipient detail UI when a risky location is saved, OR should detection run as a nightly batch job with results displayed in a dedicated dashboard widget?

**Answer:**
- **IN SCOPE:** Real-time inline warnings in Recipient detail UI when location requires mechanism but none is set
- **IN SCOPE:** Expose "hasRiskyLocations"/"missingMechanism" flag from service layer
- **OUT OF SCOPE:** Email notifications, dedicated dashboard widgets (Items 42-43+)

---

**Q4: Service Field - Free Text vs Controlled Vocabulary**
The `service` field is described as free text (e.g., "Email delivery via SendGrid"). Should we provide autocomplete suggestions from previously-entered services within the organization to promote consistency, OR keep it pure free text with only help text and example values?

**Answer:** Keep pure free text for service field in Item 15. Provide clear help text and example values. No autocomplete or controlled vocabulary yet (keep parity with Item 14).

---

**Q5: Hierarchy Display - Per-Recipient vs Flattened Chain View**
When displaying RecipientProcessingLocations in the context of sub-processor chains (parentRecipient relationships), should the UI show:
A) A flat list of locations per individual recipient on their detail page
B) A hierarchical tree showing parent processor locations + sub-processor locations in one nested view
C) Both views available via toggle?

**Answer:**
- On Recipient detail: flat table of that recipient's locations
- In hierarchy view: small indicators per node (e.g., "3 locations · 1 third-country w/o mechanism")
- Allow filters/badges for active vs inactive location risk
- No nested location trees

---

**Q6: Transfer Mechanism Validation - Hard vs Soft Enforcement**
When a RecipientProcessingLocation is in a third country requiring safeguards (per Country.gdprStatus JSON), should transferMechanismId be:
A) HARD required - location cannot be saved without mechanism selection, with validation error
B) SOFT recommended - location can be saved, but flagged as incomplete with warning badge

**Answer:** HARD validation at location creation/update. If third-country transfer requires safeguards, transferMechanismId is REQUIRED. Save must fail if missing with clear error message. Validation in service/DAL layer.

---

**Q7: Historical Tracking - isActive Flag vs Versioned Records**
For tracking location changes over time (e.g., processor moves from US to EU), should we:
A) Set isActive=false on old records when locations change, create new active record
B) Keep single record and version the changes in a separate RecipientProcessingLocationHistory table
C) Hybrid: isActive for current state + audit log in ComponentChangeLog (Item 16)

**Answer:** Set isActive=false on old records when locations change, create new active record. Provide "Move Location"/"Change Country" helper action in UI that clones existing row, lets user adjust country/mechanism/service, and marks old row isActive=false. Allow manual deactivate + create for edge cases.

---

**Q8: Activity Integration - Show Locations in ActivityReview UI?**
When reviewing a ProcessingActivity that links to Recipients (via DataProcessingActivityRecipient junction), should the ActivityReview UI display:
- Each recipient's current processing locations with risk badges?
- A summary section "Cross-border risks detected: 2 recipients without transfer mechanisms"?
- Or defer this to later dashboard Items (42-43+)?

**Answer:**
- **IN SCOPE:** Show linked recipients and location risk status in ActivityReview UI
- Display badges: "EU-only", "Third-country with SCC", "Third-country missing mechanism"
- Small "Cross-border risks" summary section
- **OUT OF SCOPE:** Deeper analytics/trend views (later dashboard items)

---

**Q9: Scope Exclusions - What's Explicitly Out?**
Are there any features you want to explicitly exclude from Item 15 to keep scope tight? For example:
- Bulk CSV import/export of locations
- Advanced transfer risk scoring (beyond basic "requires mechanism" detection)
- External vendor database integration for location auto-discovery
- Complex timeline visualizations of location history

**Answer:**

**OUT OF SCOPE:**
- Advanced transfer risk scoring
- Bulk CSV import/export
- Complex timeline visualizations
- External vendor database integrations
- Automatic location discovery

**IN SCOPE:**
- Core CRUD for RecipientProcessingLocation
- Validation of third-country + transferMechanismId
- Basic risk indicators in Recipient detail and ActivityReview UI

---

### Existing Code to Reference

**Similar Features Identified:**

**Item 14 - DigitalAsset & AssetProcessingLocation:**
- Model structure: `packages/database/prisma/schema.prisma` (AssetProcessingLocation model)
- DAL patterns: service/purpose/country/mechanism fields, isActive behavior
- UI patterns: embedded table on asset detail page for location management
- Location-based pattern to follow closely

**Recipient Models and DAL:**
- Path: `packages/database/src/dal/recipients.ts`
- Functions: `getDescendantTree()`, hierarchy queries
- Pattern: Sub-processor chain traversal logic

**Existing Recipient Detail Routes:**
- Web app routes for Recipient detail pages
- Component patterns for displaying recipient hierarchy

**Country Model and gdprStatus JSON:**
- Schema: `packages/database/prisma/schema.prisma`
- DAL: `packages/database/src/dal/countries.ts`
- Logic: GDPR status parsing for EU/EEA vs third country detection

**Completeness Validation Patterns:**
- Concept: `validateAssetCompleteness()` → adapt to `validateRecipientCompleteness()`
- Pattern: Soft warnings for incomplete data, tracking for dashboard metrics

### Follow-up Questions

**Follow-up 1: UI Placement for "Move Location" Helper**

The "Move Location"/"Change Country" helper action sounds useful. WHERE in the UI should this helper appear?
- As a button/menu item on each row in the locations table?
- As a separate action in a row's dropdown menu?
- Or as a modal that opens when clicking "Edit" on a location record?

Please clarify the preferred UI placement for this helper.

**Answer:**

**UI Placement Decision: Option B - Row Actions Menu (... menu) ✓**

**SCOPE SPLIT BETWEEN ITEM 15 AND ITEM 16c:**

**✅ IN SCOPE FOR ITEM 15 (Backend/API/Behavior):**

1. **Service/DAL function `moveRecipientProcessingLocation`** that:
   - Validates organization ownership and permissions
   - Reads the existing RecipientProcessingLocation row
   - Creates a new location row with:
     - Same base fields as original
     - Overridden fields from user input (countryId, service, transferMechanismId, etc.)
     - isActive = true on new row
   - Sets isActive = false on original row
   - Applies transfer mechanism validation (hard validation for third countries requiring safeguards)
   - Runs everything in a single transaction

2. **tRPC endpoint/service method** with clear input shape:
   - recipientId
   - locationId (source)
   - updatedFields (country, mechanism, etc.)

3. **Tests** that:
   - Old row is correctly deactivated
   - New row is created with updated values
   - Validation still applies (cannot "move" into non-compliant third-country without mechanism)

4. **Explicit statement in spec:** "Expose this capability in the UI as a 'Move location' action on each location row (via the row's ... actions menu) as part of the Recipient Management UI (see Item 16c)."

**⏸ DEFERRED TO ITEM 16c (Recipient Management UI):**

1. The embedded RecipientProcessingLocation table on Recipient detail page
2. Row actions UI:
   - Edit (simple in-place edit)
   - ... menu with:
     - Move location → opens dialog calling moveRecipientProcessingLocation
     - Deactivate location (if active)
3. "Move location" dialog component:
   - Pre-fills current values
   - Lets user change fields
   - On submit, calls Item 15 service and refreshes table
4. TanStack Table wiring, shadcn dialog components, icon/button placement

**NOT IN ITEM 15 SCOPE:**
- Exact icon/button placement in React/shadcn
- TanStack Table wiring or dialog component implementation
- Any global "Move location" view beyond per-recipient table

---

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

No visual assets available for analysis.

## Requirements Summary

### Functional Requirements

**Core Entity: RecipientProcessingLocation**
- Link processing locations to Recipient entities
- Track service context (free text), optional Purpose link, and fallback purposeText
- Store country (FK to Country), locationRole enum (HOSTING/PROCESSING/BOTH)
- Optional transferMechanismId when cross-border safeguards required
- isActive flag for historical tracking (false for old/inactive locations)
- metadata JSON for extensibility

**Creation and Management:**
- Embedded UI on Recipient detail page (mirroring Item 14 pattern) - **DEFERRED TO ITEM 16c**
- Inline add/edit/deactivate controls - **DEFERRED TO ITEM 16c**
- Allow recipient creation without locations initially
- Non-blocking warning for PROCESSOR/SUB_PROCESSOR without locations
- Track "missing locations" for completeness metrics

**Validation:**
- HARD validation: transferMechanismId REQUIRED for third-country locations requiring safeguards
- Use Country.gdprStatus JSON to determine safeguard requirements
- Save must fail with clear error message if validation fails
- Validation enforced in service/DAL layer

**Service Layer: Transfer Detection**
- Compare Organization.headquartersCountryId with RecipientProcessingLocation.countryId
- Use Country.gdprStatus JSON to identify EU/EEA vs third countries
- Flag locations without transferMechanismId when safeguards required
- Traverse Recipient.parentRecipient hierarchy to include sub-processor locations
- Expose "hasRiskyLocations"/"missingMechanism" flags for UI consumption

**Historical Tracking:**
- Set isActive=false on old location records when changes occur
- Create new active record for updated locations
- Provide `moveRecipientProcessingLocation` service/DAL function
- Function clones existing row, allows adjustments, marks old row inactive
- Runs in single transaction with validation
- Allow manual deactivate + create for edge cases

**Move Location Capability (Item 15 Backend):**
- Service/DAL function: `moveRecipientProcessingLocation(recipientId, locationId, updatedFields)`
- Validates organization ownership and permissions
- Reads existing RecipientProcessingLocation row
- Creates new location with updated fields
- Sets isActive=false on original row
- Applies hard validation for third-country transfers
- Runs in single transaction
- **UI implementation deferred to Item 16c** (row actions menu with dialog)

**UI Display Patterns:**
- **Recipient Detail Page:** Flat table of that recipient's locations - **DEFERRED TO ITEM 16c**
- **Hierarchy View:** Small indicators per node (e.g., "3 locations · 1 third-country w/o mechanism") - **DEFERRED TO ITEM 16c**
- **ActivityReview UI:** Show linked recipients with location risk badges ("EU-only", "Third-country with SCC", "Third-country missing mechanism") - **DEFERRED TO LATER ITEM**
- **ActivityReview UI:** Small "Cross-border risks" summary section - **DEFERRED TO LATER ITEM**
- Filters/badges for active vs inactive location risk - **DEFERRED TO ITEM 16c**

**Real-time Warnings:**
- Inline warnings in Recipient detail UI when risky location detected - **DEFERRED TO ITEM 16c**
- Warning when location requires mechanism but none is set
- Service layer provides risk flags for UI consumption

### Reusability Opportunities

**Model Patterns:**
- AssetProcessingLocation model structure (Item 14) - nearly identical pattern
- Same field structure: service, purposeId, purposeText, countryId, locationRole, transferMechanismId, isActive, metadata
- Same LocationRole enum reuse

**DAL Patterns:**
- Recipient hierarchy traversal functions from `packages/database/src/dal/recipients.ts`
- getDescendantTree() for sub-processor chain queries
- Similar query patterns for location-based filtering

**UI Patterns (for Item 16c reference):**
- Item 14 DigitalAsset detail page with embedded AssetProcessingLocation table
- Inline add/edit/deactivate controls
- Similar table structure and interaction patterns

**Validation Patterns:**
- validateAssetCompleteness() concept → validateRecipientCompleteness()
- Soft warning patterns for incomplete data
- Completeness tracking for dashboard metrics

**Service Layer Patterns:**
- Country.gdprStatus JSON parsing logic
- Transfer safeguard requirement detection
- Risk flag calculation and exposure

### Scope Boundaries

**In Scope for Item 15:**

- RecipientProcessingLocation model with all specified fields
- CRUD DAL/service layer operations for location management (create, read, update, deactivate)
- `moveRecipientProcessingLocation` service/DAL function with transaction handling
- HARD validation of transferMechanismId for third-country locations
- Service layer transfer detection comparing org country with location countries
- Country.gdprStatus JSON parsing for EU/EEA vs third country detection
- Sub-processor chain traversal including parent locations
- isActive historical tracking with new record creation
- Service layer flags: hasRiskyLocations, missingMechanism
- Non-blocking warnings logic for PROCESSOR/SUB_PROCESSOR without locations
- Completeness tracking logic for future dashboard metrics
- tRPC endpoints for all location operations
- Tests for moveRecipientProcessingLocation function

**Deferred to Item 16c (Recipient Management UI):**

- Embedded RecipientProcessingLocation table on Recipient detail page
- Inline add/edit/deactivate UI controls
- Row actions menu (... menu) with "Move location" action
- "Move location" dialog component
- Real-time inline warnings in Recipient detail UI
- TanStack Table wiring and shadcn component implementation
- Filters/badges for active vs inactive location risk
- Hierarchy view indicators per node

**Deferred to Later Items:**

- ActivityReview UI integration: recipient location badges and cross-border risk summary (Item 38 or later)
- Standalone "Recipient Locations" management page
- Global "risky locations" dashboard view (Items 42-43+)
- Email notifications for transfer risks
- Dedicated dashboard widgets for transfer detection

**Out of Scope (Future Work):**

- Advanced transfer risk scoring beyond basic mechanism detection
- Bulk CSV import/export of locations
- Complex timeline visualizations of location history
- External vendor database integrations
- Automatic location discovery
- Autocomplete or controlled vocabulary for service field (keeping parity with Item 14)
- Nested location trees in hierarchy view
- RecipientProcessingLocationHistory separate versioning table (using isActive + ComponentChangeLog from Item 16 instead)

### Technical Considerations

**Database Schema:**
- RecipientProcessingLocation model follows AssetProcessingLocation pattern exactly
- Reuse LocationRole enum from Item 14
- Compound indexes: (organizationId, recipientId), (organizationId, countryId), (organizationId, transferMechanismId)
- Foreign key constraints: organizationId, recipientId, countryId, purposeId (nullable), transferMechanismId (nullable)
- isActive Boolean field for historical records

**Service Layer Architecture:**
- Transfer detection functions comparing countries using gdprStatus JSON
- Helper functions: isSameJurisdiction(), isThirdCountry(), requiresSafeguards()
- Sub-processor chain traversal via Recipient.parentRecipient
- Expose hasRiskyLocations/missingMechanism flags for UI
- moveRecipientProcessingLocation function with transaction support

**Integration Points:**
- Item 16 (Component Change Tracking): Extend ComponentType enum to include "RecipientProcessingLocation"
- Item 16: Change detection middleware for location updates triggering document regeneration
- Item 16c: UI implementation of location management interface
- Future Item 38 (DPIA Generation): Snapshot recipient processing locations in document metadata
- Future ActivityReview UI: Display recipient locations with risk indicators

**Prerequisites Already Implemented:**
- Item 3: Country model with gdprStatus JSON, TransferMechanism model
- Item 8: DataProcessingActivity with junction table patterns
- Item 12: Recipient model with parentRecipientId hierarchy support
- Item 14: AssetProcessingLocation (parallel pattern), LocationRole enum

**Similar Code to Reference:**
- packages/database/prisma/schema.prisma: AssetProcessingLocation, Recipient, Country models
- packages/database/src/dal/recipients.ts: getDescendantTree(), hierarchy queries
- packages/database/src/dal/countries.ts: Country.gdprStatus JSON parsing
- Item 14 implementation: Model structure, DAL patterns, UI patterns

**Tech Stack:**
- Next.js 16 (App Router) for UI pages (Item 16c)
- Prisma ORM for data access
- tRPC for type-safe API
- Zod for validation schemas
- React Hook Form for location forms (Item 16c)
- shadcn/ui components for table and form UI (Item 16c)
- TanStack Table for location list display (Item 16c)

**Size Estimate:**
M (Medium) - Approximately 2-3 weeks for backend/API/service layer (Item 15)
UI implementation (Item 16c) is separate estimation

**Complexity Drivers:**
- Service layer composition (4 helper functions + 2 main functions + moveRecipientProcessingLocation)
- Recipient hierarchy traversal logic
- Country.gdprStatus JSON parsing and matching
- Transfer safeguard requirement calculation
- Transaction handling for move operations
- Validation logic enforcement
