# Roadmap Strategic Notes

## Document Purpose

This document provides product strategy context for the Compilo development roadmap. It explains the rationale behind feature sequencing, defines success metrics, identifies key risks, and outlines go-to-market considerations for each development phase.

**Audience:** Product team, engineering leads, executive stakeholders, investors

**Last Updated:** 2025-11-15

---

## Strategic Foundation

### Core Product Hypothesis

**Thesis:** Mid-market organizations (500-2,000 employees) will pay €15,000-30,000/year for a GDPR compliance platform that delivers enterprise-grade data integrity at 1/3 the cost and 1/10 the implementation time of OneTrust/TrustArc.

**Key Assumptions:**

1. Privacy teams will adopt a "documents as views of data" mental model vs. traditional document-centric workflows
2. Component reusability delivers measurable time savings (70% reuse by 5th activity)
3. Professional Word/PDF output is non-negotiable for legal team adoption
4. Business stakeholders will complete guided questionnaires without privacy expertise
5. Single source of truth architecture prevents the "15 versions of the same processor" problem that makes manual approaches unsustainable

**Validation Required:**

- MVP beta users report 60%+ time reduction on DPIA creation (target: 4-6 hours vs. 2-3 weeks manual)
- Legal teams approve generated Word documents without extensive reformatting (target: <30 min formatting time)
- Component reuse reaches 50%+ by 3rd processing activity (instrumented in-app analytics)
- Business users complete discovery questionnaires in <20 minutes with <3 support requests per organization

### Target Market Segmentation

**Primary ICP (Initial Beachhead):**

- 500-2,000 employees
- 2-5 privacy professionals (DPO + Privacy Officers)
- €50K-100K current compliance spend across tools, consultants, legal reviews
- 50-150 processing activities documented (past "Excel chaos," not yet "OneTrust scale")
- Recurring regulatory audit requirements (supervisory authority audits, ISO 27001, SOC 2)

**Why This Segment:**

- Large enough to afford €15K-30K/year SaaS product
- Small enough that OneTrust pricing (€100K+) and implementation burden (6-8 months) is prohibitive
- Sophisticated enough to value data architecture benefits over simple questionnaire tools
- Pain is acute: manual processes breaking down, audits finding gaps, business stakeholders frustrated with delays

**Adjacent Segments (Future Expansion):**

- SMB (100-500 employees): Simplified product tier at €5K-10K/year with reduced features
- Enterprise (2,000+ employees): Advanced tier at €50K-100K/year with API integrations, SSO, advanced analytics

---

## MVP Phase: Foundation Strategy

### Milestone 1-2: Infrastructure Foundation (Items 1-7)

**Strategic Rationale:**

This phase establishes technical infrastructure without direct user value. The critical product decision is implementing multi-tenancy and authentication BEFORE building core features to avoid painful refactoring later.

**Key Design Decisions:**

1. **NextAuth.js v5 for Authentication:** Prioritizes developer velocity over custom auth. Magic links reduce password management burden for privacy officers. Google OAuth provides SSO for organizations already on Google Workspace.

2. **Organization-First Multi-Tenancy:** Every query filtered by `organizationId` from session context prevents cross-tenant data leakage. Compound indexes on `(organizationId, status, ...)` optimize dashboard queries.

3. **tRPC v11 Over REST:** End-to-end type safety reduces integration bugs between frontend and backend. Automatic input validation with Zod schemas. Single source of truth for API contracts.

**Success Metrics:**

- Development environment setup time <30 minutes for new engineers
- Zero cross-tenant data leakage in security audit
- 100% type coverage on API layer (enforced by TypeScript strict mode)

**Risk Mitigation:**

- **Risk:** Over-engineering infrastructure delays user value
  - **Mitigation:** Timebox foundation to 2-3 weeks maximum. Defer non-critical tooling (Storybook, advanced monitoring) to Beta phase
- **Risk:** Authentication complexity blocks feature development
  - **Mitigation:** Use magic links for MVP, defer SSO/SAML to Enterprise phase. Pre-built NextAuth Prisma adapter minimizes custom code.

### Milestone 3-4: Core Entity Models (Items 8-16)

**Strategic Rationale:**

Implementing the compliance domain model is the highest-risk architectural decision. Getting entity relationships wrong forces expensive refactoring when users have production data.

**Critical Design Patterns:**

1. **Component Change Tracking (Item 16):** This is the architectural foundation for "documents as views of data." Tracking component changes enables:
   - "3 DPIAs reference this vendor, regenerate?" notifications
   - Audit trail showing when processor DPA was updated and which documents were affected
   - Future bidirectional sync where Word edits flow back to components

2. **Discriminated Assessment Pattern (Item 21, future milestone):** Avoids polymorphic anti-patterns. ProcessingActivityAssessment, VendorAssessment, AssetAssessment are separate tables with one-to-one relationships to base Assessment model. Database enforces referential integrity.

3. **Recipient Hierarchy (Item 12):** Self-referential `parentRecipientId` enables sub-processor chains. Critical for demonstrating GDPR Article 28(2) compliance where processors engage sub-processors.

4. **Processing Locations Architecture (Items 14-15):** Uses specialized location models (`AssetProcessingLocation`, `RecipientProcessingLocation`) attached to entities rather than discriminated polymorphic `DataTransfer` model. This architectural decision is foundational for geographic compliance tracking and cross-border transfer management.

**Why Processing Locations Over DataTransfer:**

The architecture models what GDPR Article 30(1)(d) actually requires: WHERE data is processed (locations), WHO processes it (recipients), and UNDER WHAT mechanism (safeguards). If a location crosses borders, a transfer exists as a **derived fact**, not a stored entity.

**Key Benefits:**

1. **GDPR Semantic Alignment:**
   - Article 30(1)(d) asks about processing locations and safeguards, not abstract "transfers"
   - Processing locations model this directly: "Mailchimp processes in US-Virginia and EU-Ireland"
   - Transfers are computed by comparing organization country with processing location countries

2. **Type Safety:**
   - No nullable FKs + discriminator enum patterns that Prisma discourages
   - Database enforces referential integrity (can't have invalid country references)
   - Clean type inference: `assetLocation.digitalAsset` is always `DigitalAsset`, no manual type narrowing

3. **Reusability & Single Source of Truth:**
   - Define recipient's processing locations once: `RecipientProcessingLocation(Mailchimp, US, DPF)`
   - All activities using Mailchimp inherit these locations automatically
   - Change location once → all affected DPIAs show "transfer section outdated" (via Item 16 change tracking)
   - Prevents "15 versions of same processor" problem that breaks manual approaches

4. **Mental Model Clarity:**
   - Locations are **properties of entities** (intuitive): "Where does this asset/recipient process data?"
   - Not abstract relationships: "Create transfer from Activity X to Asset Y to Recipient Z"
   - Users think geographically, system models geographically

**Service Layer Composition:**

Transfers are **derived** via service layer, not stored as database entities:

```typescript
// Pseudo-code for transfer detection
const orgCountry = await getOrganizationCountry(orgId)
const assetLocations = await getAssetProcessingLocations(activityId)
const recipientLocations = await getRecipientProcessingLocations(activityId)

const transfers = [...assetLocations, ...recipientLocations]
  .filter((loc) => isCrossBorder(orgCountry, loc.country))
  .map((loc) => ({
    type: loc.digitalAssetId ? 'ASSET' : 'RECIPIENT',
    origin: orgCountry,
    destination: loc.country,
    mechanism: loc.transferMechanism,
    requiresSafeguards: isThirdCountry(loc.country, orgCountry),
  }))
```

This compositional approach:

- Avoids data duplication (no `sourceCountry` vs `asset.hostingCountry` conflicts)
- Automatically updates when locations change (no stale transfer records)
- Enables complex compliance queries: "Show all third-country processing without valid mechanisms"
- Maintains referential integrity (location changes cascade correctly)

**Integration with Document Generation:**

- **Item 35 (Component Snapshot):** Captures complete processing location state at DPIA generation time
- **Item 38 (DPIA Template):** Auto-generates "Processor Locations" table from `recipient.processingLocations`
- **Item 45 (Regeneration):** When `RecipientProcessingLocation.countryId` changes → ComponentChangeLog entry → affected DPIAs marked for regeneration
- **Item 16 (Change Tracking):** Extended to track location changes, enabling "3 DPIAs reference Mailchimp's US location, regenerate?" workflows

**Success Metrics:**

- Schema supports 100% of GDPR Article 30 RoPA requirements without custom JSON fields
- Component reuse reaches 40%+ by 3rd activity (users select existing Purpose/DataCategory vs. creating new)
- Zero "we need to add a column to core tables" refactoring requests in first 3 months
- **Items 14-15 specific:**
  - 100% of cross-border transfers identified automatically via service layer composition
  - Zero manual "create transfer record" workflows needed
  - Location changes propagate to all affected documents within 1 regeneration cycle
  - Query performance: "Show all third-country processing without valid mechanisms" executes <100ms

**Risk Assessment:**

- **Risk:** Entity model is too rigid, forces workarounds for edge cases
  - **Mitigation:** Include `metadata JSON` field on all models for organization-specific customization. Validate schema with 3-5 design partners reviewing real-world processing activities before finalization.
- **Risk (Items 14-15):** Service layer queries more complex than direct DataTransfer lookup
  - **Mitigation:** Create DAL helper functions encapsulating query complexity (e.g., `getActivityProcessingLocations(activityId)` returns full location graph). Optimize with compound indexes on (organizationId, digitalAssetId), (organizationId, countryId). Cache frequently-accessed location data.
- **Risk (Items 14-15):** Users confused by "no Transfer model" in schema
  - **Mitigation:** Documentation explicitly explains transfer derivation. UI shows computed transfers as if they were stored entities. UX terminology uses "transfers" while architecture uses "processing locations".
- **Risk:** Junction table explosion makes queries complex
  - **Mitigation:** Use Prisma's `include` and DataLoader patterns to prevent N+1 queries. Pre-optimize dashboard queries with compound indexes on `(organizationId, status, requiresDPIA)`.

### Milestone 5-6: Assessment Engine (Items 17-28)

**Strategic Rationale:**

The questionnaire engine is the primary user-facing innovation differentiating Compilo from "just another DPIA template." Business stakeholders must complete discovery questionnaires in 15-20 minutes without privacy expertise.

**Key Product Decisions:**

1. **Snapshot Architecture (Item 20):** `questionnaireSnapshot JSON` freezes question structure at assessment creation. Users who started an assessment don't see questions change mid-flight when questionnaire is updated. This prevents data integrity issues and user confusion.

2. **Max Nesting Depth Enforcement (Item 19):** Hard limit of 3-4 conditional logic levels prevents unmaintainable complexity. Organizations can build sophisticated flows (show processor questions only if "uses third-party vendors" = Yes) without creating spaghetti logic requiring PhD to debug.

3. **Version Migration UI (Item 28):** Controlled questionnaire evolution with user choice. Privacy officers publish v2.0 with AI processing questions; in-progress assessments see "upgrade available" banner with comparison summary. Preserves existing answers where possible, shows new questions in preview.

**User Experience Goals:**

- Business stakeholder completes discovery questionnaire in <20 minutes (instrumented via analytics)
- 80%+ of questionnaire answers auto-populate from previous similar activities
- <5% of assessments abandoned due to complexity/length (track abandonment rate)

**Success Metrics:**

- 70% reduction in "I don't understand this question" support tickets vs. baseline manual process
- 90%+ of required fields completed on first submission (vs. multiple back-and-forth rounds)
- Privacy officers approve 80%+ of business stakeholder submissions with <30 min review time

**Risk Mitigation:**

- **Risk:** Conditional logic becomes too complex, questionnaires unmaintainable
  - **Mitigation:** Enforce max nesting depth in schema validation. Provide ConditionDebugger dev tool visualizing dependency graph. Template gallery with pre-built validated questionnaires.
- **Risk:** Version migration breaks in-progress assessments
  - **Mitigation:** Comprehensive test suite covering migration with 100% answer preservation. Design partner testing with real v1→v2 migration before GA release.

### Milestone 7: Discovery Workflow (Items 29-32)

**Strategic Rationale:**

This milestone delivers the first complete user journey: business stakeholder submits project → system creates draft activity → privacy officer reviews → activity approved and goes live.

**Go-to-Market Implications:**

This is the **first demoable value proposition** for sales and marketing. Before this milestone, product is infrastructure. After this milestone, we can show:

- Business user completes questionnaire in 15 minutes
- System auto-creates processing activity with 80% fields populated
- Privacy officer reviews side-by-side (original responses + generated activity)
- Approval takes 5 minutes vs. 2-3 email rounds

**Critical UX Flows:**

1. **Response-to-Component Mapping (Item 30):** This is where "magic" happens. Questionnaire responses like "We collect names, emails, and phone numbers" map to DataCategory selections. "We use Mailchimp for email marketing" creates Recipient → Vendor link. Getting mapping wrong frustrates users; getting it right drives "wow" reactions.

2. **Activity Review UI (Item 31):** Side-by-side layout is critical. Left panel shows original questionnaire context (question text + user answer). Right panel shows generated structured data. Privacy officer edits in right panel, sees original context in left panel. This reduces back-and-forth because officer understands submission intent.

**Success Metrics:**

- 80%+ of discovery questionnaire submissions result in approved activities (not rejected/abandoned)
- Average review time <30 minutes per activity (vs. 2-4 hours manual information gathering)
- <10% of submissions require "request revision" (questions clear enough for accurate initial submission)

**Risk Assessment:**

- **Risk:** Mapping logic fails on edge cases, creates nonsensical activities
  - **Mitigation:** Validation service prevents incomplete activity creation (all-or-nothing transaction). Admin UI for testing mapping rules with sample responses. Default to manual mapping for low-confidence cases (<70% confidence score).
- **Risk:** Privacy officers reject system-generated activities, prefer manual creation
  - **Mitigation:** Make review UI editing experience identical to manual creation. Allow officers to override any auto-populated field. Track adoption: if officers consistently delete and recreate manually, mapping needs improvement.

### Milestone 8-9: DPIA Generation (Items 33-41)

**Strategic Rationale:**

Document generation is the **core value delivery** of Compilo's architecture. This milestone proves the thesis: "maintain structured data, generate professional documents automatically."

**Critical Product Decisions:**

1. **Component Snapshot for Documents (Item 35):** Every GeneratedDocument stores complete snapshot of all referenced components at generation time. This enables:
   - Immutable document history (v1.0 shows processor as it was in January 2024)
   - Change detection ("Google Cloud DPA expiry updated, regenerate 5 affected DPIAs?")
   - Future bidirectional sync (track what changed between snapshot and current state)

2. **Template Auto-Generated vs. Override Sections (Items 38-39):** Hybrid approach balances automation with professional judgment:
   - **Auto-generated:** Processor tables, data category lists, legal basis references (70% of content, updates automatically when components change)
   - **Override sections:** Risk assessment, necessity analysis, DPO opinion (30% of content, requires privacy officer expertise, preserved during regeneration)

3. **Word Export (Item 40):** Docxtemplater generates fully-formatted .docx files indistinguishable from expert-drafted DPIAs. Legal teams can open in Word, add comments, track changes. Critical for legal team adoption.

**Competitive Positioning:**

This is the primary differentiator vs. OneTrust/TrustArc. Enterprise GRC tools generate rigid, template-driven PDFs that legal teams reject and reformat manually. Compilo generates native Word documents with professional formatting (cover pages, TOC, proper headings, signature blocks).

**Demo Story:**

1. "Define Google Cloud processor once with DPA expiry 2025-12-31"
2. "Create 5 DPIAs that reference Google Cloud"
3. "Update DPA expiry to 2026-06-30"
4. "System shows '5 DPIAs may need regeneration'"
5. "Regenerate all 5, processor table updates automatically in all documents"
6. "Export to Word, legal counsel reviews, approves without reformatting"

**Success Metrics:**

- Generated Word documents require <30 min legal team formatting (vs. 4-6 hours manual drafting)
- 80%+ of DPIA content auto-populated from components (measure via field completion analytics)
- Legal teams approve generated DPIAs in first review round 70%+ of time
- Component changes trigger regeneration workflow 90%+ of time (not ignored)

**Risk Mitigation:**

- **Risk:** Generated documents don't meet legal quality standards
  - **Mitigation:** Design partner legal teams review templates before GA. Professional template design with regulatory compliance review. Include "drafted by Compilo, reviewed by [Legal Counsel Name]" disclaimer.
- **Risk:** Regeneration workflow confuses users, creates version chaos
  - **Mitigation:** Explicit version management with superseding workflow. Clear change summaries ("3 processors updated, 2 risks added"). Preview before regenerate with side-by-side diff. Allow "keep old version final" option.

---

## Beta Phase: Collaboration & Intelligence (Items 45-50)

### Strategic Shift: Multi-User Value

**Rationale:**

MVP proves value for **individual privacy officer**. Beta phase unlocks **team collaboration** and **organizational learning**.

**Product Evolution:**

1. **Document Regeneration Workflow (Item 45):** Closes the loop on "documents as views of data." Components change → system detects impact → users regenerate affected documents → data and documents stay in sync. This prevents the "15 versions of processor" problem that breaks manual approaches.

2. **Bidirectional Document Sync (Item 46):** Most ambitious technical feature. Legal teams edit DPIAs in Word, upload edited version, system parses changes and offers to update underlying components. Enables legal teams to work in Word while maintaining data integrity.

3. **Collaboration System (Item 47):** Multi-stakeholder workflows with @mentions, approval chains, email notifications. Privacy Officer assigns DPIA to Legal Counsel, Legal @mentions IT for security measures review, DPO approves final version. Activity feed shows all changes across organization.

4. **Smart Suggestions (Item 48):** System learns organizational patterns. "Marketing activities typically use Legitimate Interest + Customer Relationship legal basis, pre-fill?" Component reuse intelligence based on business unit and project type.

**Go-to-Market Timing:**

Beta phase enables **pilot-to-expansion motion**. Initial pilot with privacy team (MVP). After seeing value, expand to legal, IT, business stakeholders (Beta collaboration features drive expansion).

**Success Metrics:**

- Multi-user organizations (3+ active users) have 40% higher retention than single-user
- Component reuse reaches 70%+ by 5th activity (vs. 40% in MVP)
- Suggestion acceptance rate >60% (users accept pre-fill from similar activities)
- Time-to-DPIA-approval reduces 50% with collaboration workflow (vs. email-based coordination)

**Risk Assessment:**

- **Risk:** Bidirectional sync (Item 46) is too complex, takes 6+ months, delays beta
  - **Mitigation:** De-scope to v2.0 if validation shows legal teams accept one-way generation. Focus on collaboration (Item 47) and suggestions (Item 48) for beta.
- **Risk:** Collaboration features add complexity, confuse single-user organizations
  - **Mitigation:** Progressive disclosure: single-user mode hides approval workflows. Multi-user mode shows full collaboration features. Detect organization size and default appropriately.

---

## Enterprise Phase: Integrations & Scale (Items 51-57)

### Strategic Positioning: Enterprise Expansion

**Market Transition:**

Moving upmarket from mid-market (500-2,000 employees) to enterprise (2,000+ employees) requires:

1. API/integration ecosystem (connect to existing HR, CRM, ISMS, GRC tools)
2. Advanced analytics for executive reporting
3. Automated data discovery (reduce manual system inventory burden)

**Pricing Strategy:**

- **Premium Tier:** €10,000-15,000/year add-on for integrations and analytics
- **Total ACV:** €30,000-45,000/year for enterprise customers (base + premium)
- **Competitive Position:** Still 1/3 cost of OneTrust but with enterprise-grade integration capabilities

**Critical Features:**

1. **Microsoft Word Plugin (Item 51):** Native Office integration for legal teams. Component panel in Word sidebar, real-time sync, inline warnings for missing fields. Removes last barrier to legal team adoption.

2. **REST API & GraphQL (Item 52):** Opens platform to custom integrations. IT teams build DSAR automation, custom reporting, integration with ticketing systems. Developer-friendly API drives bottom-up adoption in large organizations.

3. **Integration Connectors (Item 54):** Pre-built integrations reduce implementation time from 6 months (OneTrust) to 4-6 weeks. HR system connector auto-creates employee processing activities, CRM connector imports consent records, ISMS connector bidirectionally syncs risks.

4. **Analytics Dashboard (Item 55):** Executive compliance reporting for board presentations. World map of processor locations, risk heat maps, compliance score trending. Enables privacy officers to demonstrate value to executive stakeholders.

**Success Metrics:**

- Enterprise customers (2,000+ employees) represent 30%+ of ARR within 12 months of enterprise phase launch
- API usage reaches 10,000+ calls/month per customer (indicates integration adoption)
- Integration connector usage: 60%+ of enterprise customers connect at least 1 external system
- Word plugin adoption: 80%+ of legal users install plugin within first month

**Risk Mitigation:**

- **Risk:** Enterprise feature complexity alienates mid-market customers
  - **Mitigation:** Separate premium tier. Mid-market customers pay base price without forced upgrades. Progressive feature disclosure based on organization size.
- **Risk:** Integration connectors require ongoing maintenance, become support burden
  - **Mitigation:** Start with 2-3 highest-ROI connectors (HR, CRM). Validate demand before building full catalog. Document API for custom integrations as alternative.

---

## Success Metrics by Phase

### MVP Success (Milestone 1-10)

**Product Metrics:**

- 10 beta organizations using product for real compliance work (not testing)
- 60% reduction in DPIA creation time (4-6 hours vs. 2-3 weeks manual baseline)
- 50% component reuse by 3rd activity
- 80% of discovery questionnaires completed without support intervention
- Legal teams approve generated Word documents in <30 min formatting time

**Business Metrics:**

- 5 design partner contracts signed (€5,000-10,000/year pilot pricing)
- Net Promoter Score (NPS) >40 among privacy officers
- 1-2 case studies documenting time savings and quality improvements
- Product-market fit validated: users express strong disappointment if product taken away

### Beta Success (Milestone 11)

**Product Metrics:**

- Component reuse reaches 70% by 5th activity
- Multi-user organizations (3+ users) represent 60% of customer base
- Suggestion acceptance rate >60%
- Document regeneration workflow used monthly by 80% of organizations
- Collaboration features (comments, approvals) used weekly by 70% of organizations

**Business Metrics:**

- 30 paying customers at €15,000-30,000/year
- €600K ARR milestone
- Customer expansion: 40% of customers expand from privacy-only to multi-team usage
- Churn <10% annually
- Customer acquisition cost (CAC) payback <12 months

### Enterprise Success (Milestone 12)

**Product Metrics:**

- API usage: 10,000+ calls/month per enterprise customer
- Integration adoption: 60%+ of enterprise customers connect external systems
- Word plugin adoption: 80%+ of legal users
- Analytics dashboard used weekly by 70% of DPOs for executive reporting
- Automated data discovery scans 100+ systems per enterprise customer

**Business Metrics:**

- €2M ARR with 50-75 customers
- Enterprise customers (2,000+ employees) represent 30%+ of ARR
- Average contract value (ACV): €35,000-40,000
- Gross retention >90%, net retention >110% (expansion revenue)
- Sales cycle for enterprise: <90 days (vs. 6-12 months for OneTrust)

---

## Key Assumptions & Dependencies

### Technical Assumptions

1. **Docxtemplater generates legal-quality Word documents** - Validation: design partner legal teams review samples before committing to architecture
2. **tRPC + Prisma scales to 1,000+ processing activities per organization** - Validation: load testing with synthetic data, optimize queries with database profiling
3. **NextAuth.js supports multi-organization switching** - Validation: prototype organization switcher in foundation phase
4. **Component change tracking doesn't create performance issues** - Validation: benchmark change log queries, add indexes on (componentType, componentId, changedAt)

### Market Assumptions

1. **Mid-market organizations (500-2,000 employees) have €15K-30K annual budget for compliance SaaS** - Validation: customer discovery calls, pricing sensitivity analysis
2. **Privacy officers adopt "documents as views of data" mental model** - Validation: user testing during MVP beta, measure time-to-value and feature adoption
3. **Legal teams accept generated Word documents vs. manual drafting** - Validation: legal counsel reviews in design partner phase
4. **Business stakeholders complete questionnaires without privacy expertise** - Validation: usability testing with non-privacy users, measure completion rates and time

### Go-to-Market Assumptions

1. **Design partners convert to paying customers** - Validation: pilot-to-paid conversion rate >60%
2. **Product-led growth possible via free trial** - Validation: test self-service signup with 5-10 organizations
3. **Case studies drive inbound leads** - Validation: publish 2 case studies, track attributed pipeline
4. **Privacy officer communities (IAPP, DPO forums) are effective distribution channels** - Validation: community engagement, webinar attendance, demo requests

---

## Risk Register

### High-Impact Risks

**Risk 1: Legal teams reject generated documents**

- **Impact:** HIGH - Core value proposition fails
- **Probability:** MEDIUM
- **Mitigation:** Design partner legal counsel review templates before GA, professional template design, allow full customization in Word
- **Contingency:** If rejection rate >30%, pivot to "documents as starting point" vs. "final output" positioning

**Risk 2: Component reuse doesn't materialize**

- **Impact:** HIGH - Time savings value prop undermined
- **Probability:** MEDIUM
- **Mitigation:** Smart suggestions, duplicate detection, pre-fill from similar activities
- **Validation:** Track reuse metrics in beta, target 50% by 3rd activity
- **Contingency:** If reuse <30%, investigate barriers (poor suggestions, unclear UI, organizational workflows)

**Risk 3: OneTrust/TrustArc discounting aggressively**

- **Impact:** HIGH - Pricing advantage erodes
- **Probability:** LOW (enterprise vendors rarely discount to mid-market levels)
- **Mitigation:** Differentiate on implementation speed (4-6 weeks vs. 6-8 months), superior UX, Word-native output
- **Contingency:** Lower pricing to €10K-15K if needed, focus on SMB market (<500 employees)

**Risk 4: Bidirectional sync too complex to ship**

- **Impact:** MEDIUM - Delays beta, but not critical path
- **Probability:** MEDIUM-HIGH (complex feature, parsing Word changes is hard)
- **Mitigation:** De-scope to v2.0, focus on one-way generation + collaboration for beta
- **Validation:** Prototype Word change detection in 2-week spike, assess feasibility

**Risk 5: GDPR regulatory requirements change**

- **Impact:** MEDIUM - Requires schema/template updates
- **Probability:** LOW-MEDIUM (GDPR stable, but enforcement guidance evolves)
- **Mitigation:** Modular template design, metadata JSON fields for custom requirements, active monitoring of regulatory developments
- **Contingency:** Rapid release cycle allows quick updates, advisory committee of privacy lawyers

### Medium-Impact Risks

**Risk 6: Database schema refactoring required after launch**

- **Impact:** MEDIUM - Engineering disruption, potential data migration
- **Probability:** MEDIUM
- **Mitigation:** Validate schema with 3-5 design partners, include metadata JSON for flexibility
- **Contingency:** Prisma migrations support schema evolution, budget 1-2 weeks for major schema changes if needed

**Risk 7: Questionnaire complexity overwhelms business users**

- **Impact:** MEDIUM - Discovery workflow fails, adoption stalls
- **Probability:** MEDIUM
- **Mitigation:** Max nesting depth enforcement, usability testing, smart branching, progress indicators
- **Validation:** Track completion rates and abandonment, target <5% abandonment

**Risk 8: Multi-tenancy bugs cause data leakage**

- **Impact:** CRITICAL (if occurs) - Regulatory breach, customer trust destroyed
- **Probability:** LOW
- **Mitigation:** Security audit before launch, 100% organizationId filtering, integration tests for cross-tenant isolation
- **Contingency:** Bug bounty program, security monitoring, incident response plan

---

## Go-to-Market Strategy

### Phase 1: Design Partner Validation (MVP)

**Target:** 5-10 design partner organizations

**Profile:**

- 500-2,000 employees
- 2-3 privacy professionals
- 30-100 processing activities
- Active relationship with data protection authority (recent audit or ongoing supervision)
- Willing to provide detailed feedback and case study participation

**Pricing:** €5,000-10,000/year pilot contracts with commitment to case study if satisfied

**Success Criteria:**

- 60%+ pilot-to-paid conversion
- NPS >40
- 2-3 detailed case studies with quantified time savings

**Timeline:** 3-4 months (recruitment + MVP development + validation)

### Phase 2: Early Adopter Launch (Beta)

**Target:** 25-50 customers

**Channels:**

- Design partner referrals
- IAPP (International Association of Privacy Professionals) community engagement
- LinkedIn content marketing targeting DPOs and Privacy Officers
- Webinars on "DPIA Automation" and "GDPR Compliance Without OneTrust Costs"
- Privacy-focused Slack/Discord communities

**Pricing:** €15,000-25,000/year for early adopter pricing

**Sales Motion:** Founder-led sales with 2-week free trial, demo-to-close in 30-45 days

**Success Criteria:**

- €600K ARR
- <10% churn
- 40% multi-user adoption (3+ users per organization)
- 5+ inbound leads per week from content marketing

**Timeline:** 6-9 months post-MVP

### Phase 3: Scale & Enterprise Expansion

**Target:** 75-150 customers

**Channels:**

- Inbound marketing (SEO, content, case studies)
- Partnership with privacy consultancies (referral revenue share)
- Outbound sales to compliance leaders at Series B-C funded startups
- Integration partnerships (HR systems, CRM platforms)

**Pricing:**

- Standard: €20,000-30,000/year (mid-market)
- Premium: €35,000-50,000/year (enterprise with integrations)

**Sales Motion:** Inside sales team (2-3 AEs), 14-day free trial, demo-to-close in 60-90 days for enterprise

**Success Criteria:**

- €2M+ ARR
- Net retention >110%
- Enterprise customers (2,000+ employees) represent 30%+ of ARR
- Self-service trial-to-paid conversion >15%

**Timeline:** 12-18 months post-beta launch

---

## Product Positioning

### Competitive Landscape

**Enterprise GRC Platforms:**

- OneTrust, TrustArc, BigID
- Strengths: Comprehensive features, established brand, enterprise sales motion
- Weaknesses: €100K+ pricing, 6-8 month implementation, complex UX, poor document quality
- **Our Advantage:** 1/3 cost, 1/10 implementation time, superior Word document generation

**Simple Questionnaire Tools:**

- Typeform, Jotform, Notion databases
- Strengths: Easy to use, low cost, fast setup
- Weaknesses: No data relationships, no component reuse, no query capabilities
- **Our Advantage:** Enterprise-grade data architecture, intelligent suggestions, cross-document relationships

**Manual Processes:**

- Word documents + Excel spreadsheets + email coordination
- Strengths: Familiar, flexible, no new tool adoption
- Weaknesses: Duplication, inconsistency, no queryability, unsustainable at scale
- **Our Advantage:** Maintains familiar Word output while adding structure, automation, collaboration

### Positioning Statement

**For** privacy teams at mid-market organizations (500-2,000 employees) **who** need enterprise-grade GDPR compliance infrastructure without OneTrust's cost and complexity, **Compilo** is a compliance data platform **that** treats documents as views of structured data, enabling professional DPIA generation in hours instead of weeks. **Unlike** enterprise GRC tools that produce rigid templates or manual Word processes that duplicate data everywhere, **Compilo** delivers single source of truth architecture with Word-native output that legal teams actually approve.

### Key Messaging

**Primary Message:** "Update compliance data once, all documents reflect changes automatically"

**Supporting Messages:**

- "Generate DPIAs in 4-6 hours, not 2-3 weeks"
- "OneTrust sophistication at 1/3 the cost and 1/10 the implementation time"
- "Professional Word documents that legal teams approve without reformatting"
- "Business-friendly questionnaires that project managers complete in 15 minutes"
- "Stop maintaining 15 versions of the same processor across different DPIAs"

**Proof Points:**

- "70% component reuse by 5th processing activity"
- "Legal review time reduced from 4-6 hours to <30 minutes"
- "4-6 week implementation vs. 6-8 months for enterprise GRC tools"
- "€15K-30K annual cost vs. €100K+ for OneTrust"

---

## Open Questions & Decisions Needed

### Technical Decisions

1. **Document Storage:** S3 vs. R2 vs. hybrid approach? (Decision needed: Q1 2025)
2. **Background Job Infrastructure:** Self-hosted BullMQ vs. managed service like Quirrel? (Decision needed: before item 56)
3. **Monitoring Stack:** Sentry + PostHog + Axiom vs. consolidated platform like DataDog? (Decision needed: Beta phase)
4. **Search Implementation:** PostgreSQL full-text vs. dedicated search (Elasticsearch, Typesense, Meilisearch)? (Decision needed: item 57)

### Product Decisions

1. **Bidirectional Sync Scope:** Ship in Beta or defer to v2.0? (Decision needed: after MVP validation, assess legal team feedback on one-way generation)
2. **Free Trial Strategy:** Self-service signup vs. demo-required? (Decision needed: before Beta launch)
3. **Pricing Model:** Per-user vs. flat organization fee vs. tiered by activity count? (Decision needed: Design partner feedback)
4. **Multi-language Support:** English-only MVP or German/French for EU market? (Decision needed: based on design partner geography)

### Go-to-Market Decisions

1. **Initial Geographic Focus:** UK vs. Germany vs. Netherlands vs. pan-European? (Decision needed: Q4 2024)
2. **Partnership Strategy:** Direct sales only vs. privacy consultancy referral partnerships? (Decision needed: Beta phase)
3. **Community Building:** IAPP sponsorship vs. own community vs. content-only? (Decision needed: Q1 2025)
4. **Enterprise Sales:** Hire enterprise AE immediately or founder-led until €1M ARR? (Decision needed: €500K ARR milestone)

---

## Appendix: Validation Experiments

### Experiment 1: Legal Team Document Quality

**Hypothesis:** Legal counsel will approve Compilo-generated Word DPIAs in <30 min with minimal reformatting

**Method:**

1. Generate 5 sample DPIAs from design partner data using Docxtemplater templates
2. Send to 3 external legal counsel (not affiliated with design partners) for blind review
3. Ask: "How long would you spend editing this to client-ready quality?"
4. Track time and types of changes requested

**Success Criteria:** Average editing time <45 min, no structural rewrites needed

**Timeline:** Week 2-3 of item 38 development

### Experiment 2: Component Reuse Rate

**Hypothesis:** Users will reuse 50%+ of components by 3rd processing activity

**Method:**

1. Instrument analytics tracking component creation vs. selection from existing
2. Analyze first 5 activities created by each design partner organization
3. Calculate reuse percentage: (selected existing / total components referenced)

**Success Criteria:** 50% reuse by 3rd activity, 70% reuse by 5th activity

**Timeline:** Throughout MVP beta period (continuous measurement)

### Experiment 3: Business User Questionnaire Completion

**Hypothesis:** Non-privacy users can complete discovery questionnaire in <20 min without support

**Method:**

1. Recruit 10 project managers / business stakeholders (not privacy professionals)
2. Usability testing: complete discovery questionnaire for sample project
3. Track completion time, abandonment points, support questions asked
4. Post-test survey: clarity rating, difficulty rating, likelihood to use again

**Success Criteria:** 80% complete in <20 min, <3 support questions per session, 70%+ "easy to use" rating

**Timeline:** Week 1-2 of item 29 development (discovery questionnaire template)

### Experiment 4: Pricing Sensitivity

**Hypothesis:** Mid-market organizations will pay €15K-25K/year for core product

**Method:**

1. Van Westendorp Price Sensitivity Meter survey with 20-30 privacy professionals
2. Questions: "At what price would this be too expensive?", "At what price would this be a bargain?", "At what price would you start to question quality?"
3. Analyze price range where "too expensive" and "too cheap" curves intersect

**Success Criteria:** Acceptable price range includes €15K-25K, <20% say this price is "too expensive"

**Timeline:** During design partner recruitment (before contracts signed)

---

## Document Change Log

| Date       | Author                 | Changes                                          |
| ---------- | ---------------------- | ------------------------------------------------ |
| 2025-11-15 | Product Planning Agent | Initial strategic notes created for roadmap v1.0 |
