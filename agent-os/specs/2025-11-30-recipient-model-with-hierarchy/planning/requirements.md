# Spec Requirements: Recipient Model with Hierarchy

## Initial Description

Implement a Recipient model with hierarchical support to track data recipients in the GDPR compliance system. Recipients represent entities that receive personal data, including internal departments, processors, sub-processors, controllers, public authorities, and third parties.

## Requirements Discussion

### First Round Questions

**Q1:** Should the Recipient model be separate from or integrated with the existing Processor model?
**Answer:** The `Recipient` model is SEPARATE from the existing `Processor` model. Recipient represents data recipients broadly (internal departments, public authorities, etc.), while Processor tracks third-party processing relationships specifically.

**Q2:** Should Recipient have a reference to the Vendor model?
**Answer:** DEFER vendorId to a future spec. For now, add an optional `processorId` field to link to the existing Processor model when applicable.

**Q3:** What scope should the hierarchy support - only sub-processors, or any recipient type?
**Answer:** ANY recipient type can have a parent via `parentRecipientId` (e.g., internal departments can have parent departments, sub-processors can chain to processors).

**Q4:** Should the model include multi-tenancy support?
**Answer:** YES - include `organizationId` for multi-tenancy support, consistent with other models.

**Q5:** How strict should type-based validation be for parent-child relationships?
**Answer:** FLEXIBLE validation at the application layer (not strict database constraints). The schema allows any combination, but business logic can enforce rules like "only SUB_PROCESSOR should typically have a parentRecipientId pointing to a PROCESSOR."

**Q6:** Should there be a depth limit on the hierarchy?
**Answer:** NO hard depth limit. Implement circular reference prevention at the application layer.

**Q7:** What query patterns should the DAL support?
**Answer:**
- Get all children (direct sub-recipients)
- Get all descendants (recursive)
- Get parent chain (ancestors to root)
- Find recipients by type
- Find root recipients (no parent)

**Q8:** What should be excluded from this spec?
**Answer:**
- UI components
- tRPC procedures
- DataProcessingActivity junction tables (roadmap item #13)

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Processor model - Path: Existing Prisma schema (for relationship patterns)
- Feature: Other multi-tenant models - Path: Prisma schema (for organizationId pattern)
- Components to potentially reuse: Self-referential relation patterns if any exist
- Backend logic to reference: Existing DAL patterns in the codebase

### Follow-up Questions

No follow-up questions required - user provided comprehensive decisions.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

N/A - This is a backend/data model spec with no UI components.

## Requirements Summary

### Functional Requirements

- Create Recipient model with hierarchical self-referential relationship
- Support 7 recipient types: INTERNAL_DEPARTMENT, PROCESSOR, SUB_PROCESSOR, INDEPENDENT_CONTROLLER, JOINT_CONTROLLER, PUBLIC_AUTHORITY, THIRD_PARTY
- Link recipients to organizations for multi-tenancy
- Optional link to existing Processor model via processorId
- Support unlimited hierarchy depth with circular reference prevention
- Provide DAL functions for hierarchical queries

### Schema Specification

```prisma
model Recipient {
  id                String        @id @default(cuid())
  name              String
  type              RecipientType
  description       String?

  // Relationships
  organizationId    String
  organization      Organization  @relation(...)
  processorId       String?       // Optional link to Processor model
  processor         Processor?    @relation(...)
  parentRecipientId String?       // Self-referential for hierarchy
  parentRecipient   Recipient?    @relation("RecipientHierarchy", ...)
  childRecipients   Recipient[]   @relation("RecipientHierarchy")

  // Audit timestamps
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([type])
  @@index([parentRecipientId])
  @@index([organizationId])
}

enum RecipientType {
  INTERNAL_DEPARTMENT
  PROCESSOR
  SUB_PROCESSOR
  INDEPENDENT_CONTROLLER
  JOINT_CONTROLLER
  PUBLIC_AUTHORITY
  THIRD_PARTY
}
```

### Query Patterns to Implement

1. **getChildren(recipientId)** - Get all direct child recipients
2. **getDescendants(recipientId)** - Get all descendants recursively
3. **getAncestors(recipientId)** - Get parent chain up to root
4. **findByType(organizationId, type)** - Find recipients by type
5. **findRootRecipients(organizationId)** - Find recipients with no parent

### Reusability Opportunities

- Follow existing Prisma model patterns for relations
- Use existing multi-tenancy pattern with organizationId
- Reference existing DAL structure for service layer organization

### Scope Boundaries

**In Scope:**
- Prisma schema update with Recipient model
- RecipientType enum definition
- Database migration
- DAL (Data Access Layer) with CRUD operations
- DAL hierarchical query functions
- Unit tests for hierarchical queries
- Circular reference prevention logic

**Out of Scope:**
- UI components (no frontend work)
- tRPC procedures (API layer deferred)
- DataProcessingActivity junction tables (roadmap item #13)
- Vendor model integration (future spec)

### Technical Considerations

- Self-referential relation using Prisma's relation syntax
- Indexes on type, parentRecipientId, and organizationId for query performance
- Recursive queries may need optimization for deep hierarchies
- Circular reference detection required before creating/updating parent relationships
- Must maintain referential integrity with Organization and Processor models
