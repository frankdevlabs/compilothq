# Purpose & Legal Basis Models - Requirements

## Purpose Model

### 1. Category Classification
**Decision:** Use an enum (`PurposeCategory`)

**Reasoning:**
- Codebase uses enums for structured classifications (DataNatureType, TransferMechanismCategory, ProcessorType)
- Purpose categories are relatively stable and finite
- Enums provide type safety and prevent invalid values
- Database indexes work efficiently on enum columns

**Enum Values:**
```prisma
enum PurposeCategory {
  MARKETING              // Marketing communications, campaigns, analytics
  ANALYTICS              // Business intelligence, usage analytics
  CUSTOMER_SERVICE       // Support, helpdesk, customer relations
  HR                     // Recruitment, payroll, performance management
  LEGAL_COMPLIANCE       // Legal obligations, regulatory compliance
  SECURITY               // Fraud prevention, security monitoring
  PRODUCT_DELIVERY       // Core service delivery, contract fulfillment
  RESEARCH_DEVELOPMENT   // Product research, innovation
  FINANCIAL              // Billing, payments, accounting
  OTHER                  // Catch-all for edge cases
}
```

### 2. Internal/External Flags
**Decision:** Use a single scope enum field (`PurposeScope`)

**Reasoning:**
- More explicit and self-documenting than dual booleans
- Prevents invalid state (both false)
- Clearer query semantics: `WHERE scope = 'INTERNAL'`
- Matches codebase pattern with ProcessorRole enum

**Enum Values:**
```prisma
enum PurposeScope {
  INTERNAL  // Only used within organization
  EXTERNAL  // Shared with external parties
  BOTH      // Used internally and externally
}
```

### 3. Organization Scoping
**Decision:** Organization-scoped (include `organizationId`)

**Reasoning:**
- Business-specific: "Employee Onboarding" at Company A ≠ Company B
- Customization: Different industries need different purposes
- Lifecycle Management: Organizations create, modify, archive their purposes
- Not Standardized: Unlike legal bases, purposes are not defined by law
- Matches pattern of DataProcessingActivity and Processor

---

## Legal Basis Model

### 4. Regulatory Framework
**Decision:** Use enum with support for multiple frameworks via optional Json field

**Enum Values:**
```prisma
enum RegulatoryFramework {
  GDPR        // EU General Data Protection Regulation
  UK_GDPR     // UK GDPR (post-Brexit)
  LGPD        // Brazilian Lei Geral de Proteção de Dados
  CCPA        // California Consumer Privacy Act
  PIPEDA      // Canadian Personal Information Protection
  POPIA       // South African Protection of Personal Information Act
  PDPA_SG     // Singapore Personal Data Protection Act
  OTHER       // Extensibility for new regulations
}
```

**Implementation:**
- `framework: RegulatoryFramework @default(GDPR)` - primary framework
- `applicableFrameworks: Json?` - array of additional frameworks this basis applies to

### 5. Article References
**Decision:** Use string field with optional Json for structured data

**Implementation:**
- `articleReference: String` - Primary human-readable reference: "Article 6(1)(a)"
- `articleDetails: Json?` - Optional structured data for advanced use cases

**Example JSON structure:**
```json
{
  "primary": { "article": 6, "paragraph": 1, "subparagraph": "a" },
  "related": ["Article 7", "Article 9"],
  "framework": "GDPR"
}
```

### 6. Consent Requirement Flags
**Decision:** Include multiple consent-related flags

**Fields:**
- `requiresConsent: Boolean @default(false)`
- `requiresExplicitConsent: Boolean @default(false)` - Art 9 special category data
- `requiresOptIn: Boolean @default(false)` - vs. opt-out mechanisms
- `withdrawalSupported: Boolean @default(false)` - Can users withdraw consent?

**Additional assessment flags:**
- `requiresLIA: Boolean @default(false)` - Legitimate Interest Assessment
- `requiresBalancingTest: Boolean @default(false)`

### 7. Organization Scoping
**Decision:** Shared reference data (NO organizationId)

**Reasoning:**
- Legal Standardization: Six GDPR legal bases are defined by law, not organizations
- Cannot Customize: Organizations can't invent new legal bases (invalid under GDPR)
- Cross-Organization Consistency: All organizations use the same legal framework
- Matches pattern: Country, DataNature, ProcessingAct - standardized reference data

**Legal Basis Type Enum:**
```prisma
enum LegalBasisType {
  CONSENT              // Article 6(1)(a) - freely given, specific, informed
  CONTRACT             // Article 6(1)(b) - necessary for contract performance
  LEGAL_OBLIGATION     // Article 6(1)(c) - compliance with legal duty
  VITAL_INTERESTS      // Article 6(1)(d) - protection of life
  PUBLIC_TASK          // Article 6(1)(e) - public interest or official authority
  LEGITIMATE_INTERESTS // Article 6(1)(f) - legitimate interests not overridden by rights
}
```

---

## Scope & Exclusions

### Include in This Spec:
- ✅ Purpose model with enums (PurposeCategory, PurposeScope)
- ✅ LegalBasis model with enums (LegalBasisType, RegulatoryFramework)
- ✅ Migrations for both models
- ✅ Seed data for six GDPR legal bases
- ✅ Unit tests for model validation

### Explicitly EXCLUDE (separate specs):
- ❌ Junction tables (spec #13 handles relationships)
- ❌ tRPC routers/API endpoints (separate implementation)
- ❌ UI components (separate frontend spec)
- ❌ Seed data for common purposes (organization-specific, handle in onboarding)

---

## Summary Table

| Decision Area | Choice | Reasoning |
|--------------|--------|-----------|
| Purpose Category | Enum (PurposeCategory) | Type safety, matches codebase pattern, stable domain |
| Purpose Scope | Single enum (PurposeScope) | Clearer than dual booleans, prevents invalid states |
| Purpose Organization Scope | Organization-scoped (has organizationId) | Business-specific, not standardized, matches Processor pattern |
| LegalBasis Framework | Enum with Json for multiple | Future-proof for international regulations |
| LegalBasis Article Ref | String + optional Json | Simple for 80% cases, flexible for complexity |
| LegalBasis Consent Flags | Include multiple flags | Required for GDPR compliance validation |
| LegalBasis Organization Scope | Shared reference data (NO organizationId) | Standardized by law, matches Country/DataNature pattern |
| Scope Exclusions | Models + migrations + seeds only | Junction tables in spec #13, UI/API separate |

---

## Seed Data Requirements

Pre-seed six GDPR legal bases with:
- type, name, description
- framework (GDPR)
- articleReference
- Appropriate consent/assessment flags
- usageGuidance text
