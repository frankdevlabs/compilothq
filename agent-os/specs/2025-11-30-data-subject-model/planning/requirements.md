# Spec Requirements: DataSubject Model

## Initial Description

Implement the DataSubjectCategory model for the GDPR compliance platform, enabling classification and management of data subject types (employees, customers, minors, etc.) with vulnerability tracking and DPIA suggestion capabilities.

## Requirements Discussion

### First Round Questions

**Q1:** Should DataSubjectCategory be system-wide or organization-specific?
**Answer:** Hybrid approach - System-wide defaults with `isSystemDefined` flag, plus optional `organizationId` for custom categories. Unique constraint on `[name, organizationId]`.

**Q2:** How should we classify categories (enum vs flexible string)?
**Answer:** Flexible string-based approach with `code` field (EMPLOYEE, CUSTOMER, MINOR, etc.), `name` field for display, and `category` field for flexible grouping (internal, external, vulnerable). TypeScript enum for UI suggestions only, not database constraint.

**Q3:** How should vulnerability be tracked?
**Answer:** Simple Boolean + Reason approach - `isVulnerable` boolean flag (GDPR Article 35(3)(c)), `vulnerabilityReason` optional text field, and `vulnerabilityArticle` for GDPR reference.

**Q4:** Should we include GDPR article references?
**Answer:** Yes - `gdprArticle` field included, pre-seeded with Article 35(3)(c), Article 9, Article 8 references.

**Q5:** How should DPIA logic work?
**Answer:** Informational only - `suggestsDPIA` boolean flag (hint, not trigger), `dpiaRationale` optional text. Application-layer suggestion logic with human judgment required.

**Q6:** What format should examples use?
**Answer:** JSON Array - matches RecipientCategory pattern with array of specific examples per category.

**Q7:** Should we include seed data?
**Answer:** Yes, comprehensive GDPR-based seed data including:
- Internal: EMPLOYEE, JOB_APPLICANT, CONTRACTOR
- External: CUSTOMER, PROSPECT, SUPPLIER, WEBSITE_VISITOR, NEWSLETTER_SUBSCRIBER
- Vulnerable: MINOR, PATIENT, STUDENT, ELDERLY, ASYLUM_SEEKER

Location: `/packages/database/prisma/seeds/data-subject-categories.json`

### Existing Code to Reference

**Similar Features Identified:**

- Feature: RecipientCategory model - Path: `/packages/database/prisma/schema/recipient-category.prisma`
- Components to potentially reuse: JSON array examples pattern, seed data structure
- Backend logic to reference: Existing category DAL patterns in `/packages/database/src/dal/`

### Follow-up Questions

No follow-up questions required - requirements were clearly defined.

## Visual Assets

### Files Provided:

No visual assets provided (not required for database model implementation).

### Visual Insights:

N/A - This is a database model implementation without UI components.

## Requirements Summary

### Functional Requirements

- DataSubjectCategory model with hybrid system-wide/organization-specific support
- Vulnerability tracking with boolean flag, reason, and GDPR article reference
- DPIA suggestion capability (informational hints only)
- Flexible string-based category classification
- JSON array format for examples
- Comprehensive GDPR-based seed data

### Reusability Opportunities

- RecipientCategory model pattern for schema structure
- Existing DAL patterns for CRUD operations
- Seed data loading patterns from existing categories
- Test infrastructure from similar model implementations

### Scope Boundaries

**In Scope:**

- DataSubjectCategory model definition
- Vulnerability flags and DPIA hints
- Seed data with common GDPR categories
- Database migration
- Basic DAL functions (CRUD)
- Integration tests

**Out of Scope:**

- Processing activity relationships (Item #13)
- UI components
- tRPC API endpoints
- Volume estimation tracking
- User permissions/access control
- Audit log integration
- Deletion/retention logic

### Technical Considerations

- Follow existing Prisma schema patterns (multi-file structure)
- Use consistent naming conventions with existing models
- Implement DAL layer following established patterns
- Seed data in JSON format at `/packages/database/prisma/seeds/`
- Integration tests following existing test infrastructure
