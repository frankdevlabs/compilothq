# Spec Initialization: Component Change Tracking

## Raw Idea

Extend the existing ComponentChangeLog system to track changes to 3 new component types:

- DigitalAsset
- AssetProcessingLocation
- RecipientProcessingLocation

This builds on the foundation laid by Items 14 (DigitalAsset + AssetProcessingLocation) and 15 (RecipientProcessingLocation) to enable comprehensive change tracking for geographic compliance.

## Core Requirements

### 1. Extend ComponentType Enum

Add 3 new values to the existing ComponentType enum:

- "DigitalAsset" (Item 14)
- "AssetProcessingLocation" (Item 14)
- "RecipientProcessingLocation" (Item 15)

Existing values: Vendor, Purpose, DataCategory, LegalBasis, Recipient, DataSubject

### 2. Implement Prisma Middleware for Location Change Tracking

Create middleware that intercepts updates to AssetProcessingLocation and RecipientProcessingLocation models:

- Capture before/after state snapshots
- Detect critical field changes (countryId, transferMechanismId)
- Create ComponentChangeLog entries with full context
- Include change metadata (changedBy from session context)

### 3. Detect Critical Field Changes

Focus on changes that impact cross-border transfer compliance:

- **countryId changes**: Processing location moved to different country
- **transferMechanismId changes**: Safeguard mechanism updated or removed
- Store before/after values including related entity details (country name, mechanism name)

### 4. Affected Document Tracking

When critical location fields change, identify and mark affected documents:

- Find all DataProcessingActivities using the changed asset/recipient
- Locate all GeneratedDocuments (DPIAs, RoPAs, DPAs) for those activities
- Create AffectedDocument entries linking change to impacted documents
- Provide clear impact messages explaining why regeneration may be needed

### 5. Support Document Regeneration Workflow (Item 45)

Enable the future regeneration workflow by:

- Linking ComponentChangeLog entries to AffectedDocument records
- Storing sufficient context for users to understand what changed
- Providing foundation for "show me all DPIAs impacted by this location change" queries

## Context from Roadmap

**Prerequisite Items:**

- Item 14: DigitalAsset + AssetProcessingLocation models (completed)
- Item 15: RecipientProcessingLocation model (completed)

**Enables Future Items:**

- Item 35-38: Document generation with snapshot architecture
- Item 45: Document regeneration workflow with change detection

**Related Patterns:**

- Item 4: Multi-tenancy patterns (organizationId filtering)
- Existing ComponentChangeLog implementation (extend this pattern)

## Integration Points

**Database:**

- ComponentChangeLog model (extend existing)
- AffectedDocument model (link changes to documents)
- AssetProcessingLocation model (track changes)
- RecipientProcessingLocation model (track changes)

**Service Layer:**

- Prisma middleware for automatic change capture
- Service for marking affected documents
- Helper functions for finding impacted activities and documents

**Session Context:**

- Access to ctx.userId for changedBy tracking
- Access to ctx.changeReason (optional from request)

## Success Criteria

1. All changes to AssetProcessingLocation and RecipientProcessingLocation are automatically logged
2. Critical field changes (country, mechanism) trigger affected document marking
3. DPOs can query "show all documents affected by changes to Mailchimp's processing locations"
4. Change log entries include full before/after context (not just IDs)
5. No performance impact on normal CRUD operations
6. Complete audit trail for geographic compliance changes

## Technical Constraints

- Must use Prisma middleware pattern (no manual change tracking)
- Must capture snapshots atomically with updates
- Must handle concurrent updates gracefully
- Must work within multi-tenant context (organizationId isolation)
- Must not break existing ComponentChangeLog functionality

## Documentation Reference

Full implementation details available in:
`agent-os/specs/README-items-14-16.md`

See sections:

- "Component Change Tracking (Item 16)"
- "Prisma Middleware for Location Changes"
- "Affected Document Tracking"

## Estimated Size

**M (Medium)** - 1-2 weeks

Extends existing pattern rather than creating new architecture. Main complexity is middleware implementation and affected document logic.
