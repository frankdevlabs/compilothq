# Spec Requirements: Recipient Model with Hierarchy

## Critical Naming Convention

- `Organization` = Existing tenant model (SVn, customer accounts) - **DO NOT CHANGE**
- `ExternalOrganization` = **NEW** model for external entities (Recruitee, LinkedIn, Belastingdienst)
- `Recipient` = **RENAMED** from `Processor` (roles that external organizations play)

---

## Requirements Discussion

### Q1: Processor vs Recipient Relationship

**Question:** Should the Recipient model be separate from the existing Processor, or should it replace/extend it?

**Answer:** **Rename Processor → Recipient** and create separate **ExternalOrganization** model.

The key insight is the conceptual separation between:
- **Legal entity** (ExternalOrganization) - the actual company/authority
- **Role** (Recipient) - the role that entity plays in a specific processing context

**Rationale:**
- Same organization can play different roles (LinkedIn as PROCESSOR for recruitment, JOINT_CONTROLLER for advertising)
- Different compliance requirements per role (Art. 28 DPA vs Art. 26 JCA)
- Agreements are with organizations, not roles
- Enables data quality (organization details maintained once)

### Q2: Vendor Reference (ExternalOrganization)

**Question:** Should we create a new Vendor model, reference the existing Processor model, or defer?

**Answer:** **Create new `ExternalOrganization` model** as part of this spec.

The `externalOrganizationId` in Recipient should reference this new model (nullable for INTERNAL_DEPARTMENT type).

**Rationale:**
- `Organization` = tenant (your existing model)
- `ExternalOrganization` = external vendors/partners/authorities (new)
- Links to existing `Country` model for transfer assessment via `headquartersCountryId`
- Enables agreement management at organization level

### Q3: Hierarchy Scope

**Question:** Should hierarchy be limited to processor-type recipients only, or can any recipient type have a parent?

**Answer:** **Allow hierarchy for TWO types only** with different semantics:

| Type | Can Have Parent | Allowed Parent Types | Max Depth | Hierarchy Type |
|------|-----------------|---------------------|-----------|----------------|
| SUB_PROCESSOR | Yes | PROCESSOR, SUB_PROCESSOR | 5 | PROCESSOR_CHAIN |
| INTERNAL_DEPARTMENT | Yes | INTERNAL_DEPARTMENT | 10 | ORGANIZATIONAL |
| All others | No | - | 0 | - |

**Rationale:**
- GDPR Art. 28(2) explicitly addresses sub-processing chains
- Internal departments need organizational structure for accountability
- Other types (JOINT_CONTROLLER, PUBLIC_AUTHORITY, etc.) don't have hierarchical relationships

### Q4: Multi-tenancy

**Question:** Should the Recipient model have organizationId for multi-tenancy support?

**Answer:** **Already properly handled** - use existing `organizationId` field for tenant scope.

- `organizationId` in Recipient = FK to `Organization` (the tenant)
- `externalOrganizationId` in Recipient = FK to `ExternalOrganization` (the vendor)

No changes needed to multi-tenancy approach.

### Q5: Business Rules & Validation

**Question:** Should type-based validation be strict database constraints or flexible application layer enforcement?

**Answer:** **Application layer enforcement** with configurable rules per RecipientType.

Provide both hard errors (blocking) and soft warnings (guidance) to support progressive compliance improvement.

**Validation Rules by Type:**

| Type | Requires ExternalOrg | Required Agreements | Can Have Parent | Max Depth |
|------|---------------------|---------------------|-----------------|-----------|
| PROCESSOR | Yes | DPA | No | 0 |
| SUB_PROCESSOR | Yes | (via parent) | Yes | 5 |
| JOINT_CONTROLLER | Yes | JCA | No | 0 |
| SERVICE_PROVIDER | Yes | - | No | 0 |
| SEPARATE_CONTROLLER | Yes | - | No | 0 |
| PUBLIC_AUTHORITY | Yes | - | No | 0 |
| INTERNAL_DEPARTMENT | No | - | Yes | 10 |

### Q6: Circular Reference Prevention

**Question:** Should we enforce max depth and prevent circular references?

**Answer:** **Yes** - enforce max depth (5 for processor chains, 10 for internal) and check circular references on every parent change.

**Implementation:**
- Iterative depth checking for create/update operations
- Recursive CTEs for tree queries
- Database constraint to prevent self-reference (`id != parentRecipientId`)

### Q7: Query Patterns to Test

**Answer:** Implement and test **15 comprehensive query patterns**:

1. Get direct children
2. Get full descendant tree (recursive CTE)
3. Get ancestor chain
4. Get recipients by type
5. Find orphaned recipients (data quality)
6. Get recipients for activity
7. Find recipients missing required agreements
8. Get third-country recipients
9. Get recipient statistics (dashboard)
10. Find duplicate external organizations
11. Get expiring agreements
12. Find unlinked recipients
13. Assess cross-border transfers
14. Check hierarchy health
15. Audit recipient access

### Q8: Explicit Exclusions

**Exclude from this spec:**

1. UI Components - Forms, tables, visualizations
2. tRPC Procedures - API layer (basic signatures only)
3. Junction Table - RecipientDataProcessingActivity (roadmap #13)
4. Full Agreement Model - Include shell interface only
5. Transfer Mechanism Logic - Assignment/validation
6. Notification System - Expiring agreements infrastructure
7. Import/Export - Data portability features
8. Audit Logging - Infrastructure (cross-cutting concern)
9. Document Generation - DPIAs, RoPA exports
10. Questionnaire Integration - Separate workflow

---

## Schema Specification

### ExternalOrganization Model (NEW)

```prisma
model ExternalOrganization {
  id                    String   @id @default(cuid())
  legalName             String   // "Recruitee B.V."
  tradingName           String?  // "Recruitee"

  // Registration
  jurisdiction          String?   // Country code
  registrationNumber    String?   // KvK, Company House, etc.
  vatNumber             String?

  // Location (links to existing Country model)
  headquartersCountryId String?
  operatingCountries    String[]  // Array of country codes

  // Contact
  website               String?
  contactEmail          String?
  contactPhone          String?

  // Classification
  isPublicAuthority     Boolean   @default(false)
  sector                String?

  // Metadata
  notes                 String?   @db.Text
  metadata              Json?

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  headquartersCountry   Country?  @relation(fields: [headquartersCountryId], references: [id])
  recipients            Recipient[]
  agreements            Agreement[]

  @@index([legalName])
  @@index([tradingName])
  @@index([headquartersCountryId])
}
```

### Recipient Model (RENAMED from Processor)

```prisma
enum RecipientType {
  PROCESSOR           // Art. 28 - Data processor
  SUB_PROCESSOR       // Art. 28(2) - Sub-processor
  JOINT_CONTROLLER    // Art. 26 - Joint controller
  SERVICE_PROVIDER    // General service provider
  SEPARATE_CONTROLLER // Independent controller receiving data (NEW)
  PUBLIC_AUTHORITY    // Government/regulatory body (NEW)
  INTERNAL_DEPARTMENT // Internal recipient (NEW)
}

enum HierarchyType {
  PROCESSOR_CHAIN     // For sub-processor hierarchies
  ORGANIZATIONAL      // For internal department hierarchies
  GROUPING            // For logical grouping (future)
}

model Recipient {
  id                      String        @id @default(cuid())
  name                    String        // Display name for this role
  type                    RecipientType

  // Tenant context (existing multi-tenancy)
  organizationId          String        // FK to Organization (tenant)

  // External organization link (null for INTERNAL_DEPARTMENT)
  externalOrganizationId  String?       // FK to ExternalOrganization

  // Purpose and context
  purpose                 String?       // Why do they receive data?
  description             String?

  // Hierarchy support
  parentRecipientId       String?       // Self-referential FK
  hierarchyType           HierarchyType?

  // Activity linking (temporary until roadmap #13)
  activityIds             String[]      @default([])

  // Status
  isActive                Boolean       @default(true)

  // Timestamps
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  // Relations
  organization            Organization           @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  externalOrganization    ExternalOrganization?  @relation(fields: [externalOrganizationId], references: [id], onDelete: SetNull)
  parentRecipient         Recipient?             @relation("RecipientHierarchy", fields: [parentRecipientId], references: [id], onDelete: SetNull)
  children                Recipient[]            @relation("RecipientHierarchy")

  @@index([organizationId])
  @@index([organizationId, isActive])
  @@index([organizationId, type])
  @@index([externalOrganizationId])
  @@index([parentRecipientId])
}
```

### Agreement Model (Shell Interface)

```prisma
enum AgreementType {
  DPA                       // Data Processing Agreement (Art. 28)
  JOINT_CONTROLLER_AGREEMENT // Joint Controller Agreement (Art. 26)
  SCC                       // Standard Contractual Clauses
  BCR                       // Binding Corporate Rules
  DPF                       // Data Privacy Framework
  NDA                       // Non-Disclosure Agreement
}

enum AgreementStatus {
  DRAFT
  PENDING_SIGNATURE
  ACTIVE
  EXPIRING_SOON
  EXPIRED
  TERMINATED
}

model Agreement {
  id                      String          @id @default(cuid())
  externalOrganizationId  String
  type                    AgreementType
  status                  AgreementStatus @default(DRAFT)
  signedDate              DateTime?
  expiryDate              DateTime?

  createdAt               DateTime        @default(now())
  updatedAt               DateTime        @updatedAt

  externalOrganization    ExternalOrganization @relation(fields: [externalOrganizationId], references: [id], onDelete: Cascade)

  @@index([externalOrganizationId])
  @@index([type])
  @@index([status])
  @@index([expiryDate])
}
```

---

## Validation Rules

### Hierarchy Rules Configuration

```typescript
interface HierarchyRules {
  canHaveParent: boolean;
  allowedParentTypes: RecipientType[];
  maxDepth: number;
  hierarchyType: HierarchyType | null;
}

const HIERARCHY_RULES: Record<RecipientType, HierarchyRules> = {
  PROCESSOR: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
  },
  SUB_PROCESSOR: {
    canHaveParent: true,
    allowedParentTypes: ['PROCESSOR', 'SUB_PROCESSOR'],
    maxDepth: 5,
    hierarchyType: 'PROCESSOR_CHAIN',
  },
  JOINT_CONTROLLER: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
  },
  SERVICE_PROVIDER: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
  },
  SEPARATE_CONTROLLER: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
  },
  PUBLIC_AUTHORITY: {
    canHaveParent: false,
    allowedParentTypes: [],
    maxDepth: 0,
    hierarchyType: null,
  },
  INTERNAL_DEPARTMENT: {
    canHaveParent: true,
    allowedParentTypes: ['INTERNAL_DEPARTMENT'],
    maxDepth: 10,
    hierarchyType: 'ORGANIZATIONAL',
  },
};
```

---

## Deliverables

### In Scope

1. **ExternalOrganization model** - New model for external legal entities
2. **Recipient model** - Renamed from Processor with expanded types
3. **RecipientType enum** - 7 values (3 new: SEPARATE_CONTROLLER, PUBLIC_AUTHORITY, INTERNAL_DEPARTMENT)
4. **HierarchyType enum** - 3 values for categorizing hierarchies
5. **Agreement model interface** - Basic shell structure
6. **Database migrations** - Schema changes with data migration
7. **DAL functions** - CRUD + 15 query patterns
8. **Validation service** - Type-based rules with errors/warnings
9. **Circular reference prevention** - Depth checking + cycle detection
10. **Test factories** - For all new models
11. **Unit tests** - For hierarchical queries and validation

### Out of Scope

1. UI components
2. Full tRPC implementation (basic signatures OK)
3. RecipientDataProcessingActivity junction table (roadmap #13)
4. Full Agreement workflow (draft → sign → manage)
5. Transfer mechanism assignment logic
6. Notification system infrastructure
7. Import/export functionality
8. Audit logging infrastructure
9. Document generation (DPIA, RoPA)
10. Questionnaire integration

---

## Migration Strategy

### Rename Processor → Recipient

1. Create new RecipientType enum with expanded values
2. Create ExternalOrganization model
3. Migrate existing Processor data:
   - Create ExternalOrganization records from Processor names
   - Map ProcessorType → RecipientType
   - Populate externalOrganizationId references
4. Rename Processor table to Recipient
5. Add new columns (purpose, hierarchyType, activityIds, isActive)
6. Create Agreement shell table

### Data Migration Example

```typescript
// ProcessorType → RecipientType mapping
const TYPE_MAPPING = {
  'DATA_PROCESSOR': 'PROCESSOR',
  'SUB_PROCESSOR': 'SUB_PROCESSOR',
  'JOINT_CONTROLLER': 'JOINT_CONTROLLER',
  'SERVICE_PROVIDER': 'SERVICE_PROVIDER',
};
```

---

## GDPR Compliance Alignment

- **Art. 4(9)**: Definition of recipient (all types covered)
- **Art. 26**: Joint controllers (JOINT_CONTROLLER type)
- **Art. 28**: Processors and sub-processors (PROCESSOR, SUB_PROCESSOR types)
- **Art. 28(2)**: Sub-processor chains (hierarchy support)
- **Art. 30**: Records of processing activities (recipient tracking)
- **Art. 44-49**: Third-country transfers (ExternalOrganization + Country link)

---

## Visual Assets

No visual assets provided (backend/data model spec).

---

## Related Roadmap Items

- **#13**: RecipientDataProcessingActivity junction table (depends on this spec)
- Future: Agreement Management UI
- Future: Recipient Hierarchy Visualization
- Future: DPIA Generation
- Future: Transfer Assessment Workflow
