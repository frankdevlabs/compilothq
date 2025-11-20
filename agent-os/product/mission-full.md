# Compilo: Enterprise Privacy Management Without Enterprise Complexity

## The 30-Second Pitch

Stop maintaining the same processor list across 15 different DPIAs. Compilo delivers OneTrust's sophistication at one-third the cost and one-tenth the implementation time—professional GDPR documentation generated in hours instead of weeks from a single source of truth that updates all documents automatically.

**Target Customer:** 500-2,000 employee organizations with 2-5 privacy professionals who need enterprise-grade compliance infrastructure without €100K/year budgets or 6-month implementations.

---

## The Problem

### Structural Disconnect Between Data and Documents

Privacy teams at mid-to-large organizations face a fundamental architectural problem: they need to maintain structured, reusable compliance data while producing text-driven legal documents that satisfy auditors and regulators.

**The Manual Approach Doesn't Scale:**

When privacy teams manage compliance in Word documents and Excel spreadsheets, the same processor definition gets copied across 15 different DPIAs, creating 15 versions of the same information. When a DPA expires, teams must manually update all documents—and inevitably miss some. There's no way to query "which DPIAs use Recruitee as a processor?" Inconsistencies proliferate. Creating a single DPIA takes 2 weeks of gathering information, copying from templates, and coordinating with legal. Maintaining compliance for 50+ processing activities becomes impossible without dedicated teams.

**Enterprise GRC Tools Create Different Problems:**

Platforms like OneTrust and TrustArc cost €50,000-150,000 per year, require 6-8 month implementations with dedicated project managers, overwhelm teams with enterprise complexity designed for Fortune 500 companies, generate rigid output that legal teams reject as unprofessional, and provide limited true component reusability despite marketing claims.

**Simple Questionnaire Tools Lack Structure:**

SaaS form builders (Typeform, Jotform, Notion templates) generate documents without underlying relationships. Every DPIA starts from scratch with no connections between data points and no ability to query across documents. When regulatory requirements change, teams must manually update every form and every generated document.

### The Fundamental Insight

**Our Solution:** Compilo treats compliance documents as _views of structured data_, not separate sources of truth.

Like modern applications where a database generates multiple views (web interface, mobile app, API, reports), Compilo maintains a compliance graph that generates all compliance documents (DPIAs, Records of Processing, DPAs, privacy statements). Update a processor's DPA expiry date once, and all 15 DPIAs that reference it reflect the change automatically.

This architectural approach provides enterprise-grade data integrity with mid-market pricing and implementation speed.

---

## Who We Serve

### Primary Customer Profile

**Company Size:** 500-2,000 employees  
**Privacy Team:** 2-5 full-time privacy professionals (DPO + Privacy Officers)  
**Processing Activities:** 30-150 documented activities requiring compliance oversight  
**Current Pain:** Outgrown manual processes but can't justify OneTrust's cost or complexity  
**Budget Authority:** €20,000-40,000/year for compliance tooling  
**Industries:** Financial services, healthcare, SaaS/technology, professional services, mid-market retail

### User Personas

#### **Privacy Officer / DPO** (30-50 years old)

- **Role:** Data Protection Officer or Privacy Manager leading 2-5 person team
- **Context:** Managing 50-150 processing activities across multiple business units, preparing for regular supervisory authority audits, coordinating between legal, IT, and business stakeholders
- **Current Tools:** Combination of Word templates, Excel trackers, shared drives with version control nightmares
- **Specific Pain Points:**
  - Maintaining identical processor information across 15 different DPIAs manually
  - Spending 3 weeks updating all documentation when a single DPA expires
  - Unable to quickly answer auditor questions like "show me all activities processing health data with US transfers"
  - No visibility into which business units are creating new processing activities without privacy review
- **Success Metrics:** Reduce DPIA creation time from 2-3 weeks to 4-6 hours, maintain audit-ready documentation continuously, enable self-service for business stakeholders while maintaining oversight
- **What They Value:** Professional document quality legal teams approve, complete audit trail with version history, ability to delegate business intake while reviewing structured outputs

---

#### **Legal Counsel** (35-55 years old)

- **Role:** Senior Legal Counsel or General Counsel reviewing privacy documentation
- **Context:** 15+ years legal experience, moderate privacy law expertise, reviewing 20-30 DPIAs annually plus contracts and policies
- **Current Tools:** Receiving Word documents with inconsistent formatting, commenting via email chains, tracking changes manually
- **Specific Pain Points:**
  - Receiving unstructured information requiring extensive back-and-forth
  - Variable document quality—some DPIAs are professional, others are barely acceptable
  - Difficulty tracking what changed between draft versions
  - Cannot add inline legal comments in same system where data is managed
- **Success Metrics:** Review DPIAs in 2-3 hours instead of full day, provide structured feedback once instead of multiple review rounds, confidence that approved documents maintain quality over time
- **What They Value:** Native Word format for review (not PDFs or proprietary formats), professional document structure meeting regulatory standards, clear approval workflow with accountability

---

#### **Business Unit Lead / Project Manager** (30-45 years old)

- **Role:** Department head, product manager, or project lead requiring privacy approval
- **Context:** Launching new marketing campaigns, products, or vendor integrations that process personal data
- **Current Tools:** Email threads with privacy team, incomplete understanding of requirements, waiting weeks for responses
- **Specific Pain Points:**
  - Privacy requirements blocking projects for 2-3 weeks while waiting for DPO capacity
  - Incomprehensible legal jargon in privacy questionnaires
  - No visibility into approval progress—"did privacy receive my request?"
  - Having to answer the same questions for similar projects repeatedly
- **Success Metrics:** Get compliance approval in 3-5 days instead of 3 weeks, complete intake questionnaire in 15 minutes without privacy expertise, understand privacy requirements in plain language
- **What They Value:** Guided workflows with plain language, progress visibility, smart suggestions from past similar projects, clear "what happens next" communication

---

#### **IT Manager / Information Security Officer** (30-50 years old)

- **Role:** IT Manager, Security Lead, or Infrastructure Director
- **Context:** Managing 50-200 business systems (SaaS tools, databases, applications), responsible for data security and responding to technical privacy requests
- **Current Tools:** CMDB or asset management system disconnected from privacy compliance, manual surveys asking "what systems process PII?", spreadsheet hell for DSAR fulfillment
- **Specific Pain Points:**
  - Privacy team asks "inventory all systems processing personal data" but no unified inventory exists
  - Manual system documentation becomes stale within weeks as new tools are adopted
  - Responding to DSARs requires manually querying 30+ databases with no centralized tracking
  - No integration between security controls and privacy compliance documentation
- **Success Metrics:** Automated system inventory, integration with existing tools (Okta, AWS, Google Workspace), DSAR fulfillment automation, visibility into which systems require specific privacy controls
- **What They Value:** API access for custom automation, integration with existing CMDB/ITSM tools, technical documentation separate from legal documentation, automated discovery of new systems

---

## Why Now?

### Regulatory Pressure Intensified

GDPR enforcement actions increased 300% from 2022-2024, with supervisory authorities demanding detailed DPIAs for all high-risk processing. The informal "best effort" compliance that worked in 2018-2020 no longer satisfies regulators. Privacy teams that managed compliance manually with 10-15 processing activities now face 50-150 activities requiring formal documentation.

**Schrems II fallout:** The 2020 Court of Justice ruling invalidating Privacy Shield created ongoing uncertainty around US data transfers. Organizations now perform Transfer Impact Assessments for hundreds of vendor relationships, multiplying documentation burden 5-10x.

**Enforcement precedent:** €1.2B Meta fine (2023), €746M Amazon fine (2021), and hundreds of smaller penalties established that inadequate documentation itself violates GDPR. Supervisory authorities explicitly require "appropriate technical and organizational measures" including documented risk assessments.

### Mid-Market Privacy Professionalization

Organizations in the 500-2,000 employee range doubled privacy headcount from 2018-2024. Where a part-time privacy officer sufficed in 2018, companies now employ dedicated 2-5 person privacy teams. These professionals are too sophisticated for basic questionnaire tools but lack budgets for €100K+ enterprise platforms.

This created a market gap: **10,000+ organizations need enterprise-grade compliance infrastructure at mid-market pricing.**

### Technical Maturity Enables New Solutions

Modern development frameworks (Next.js, TypeScript, tRPC, Prisma) combined with cloud infrastructure enable rapid development of sophisticated SaaS applications. What required 18-24 month builds in 2015 now takes 3-6 months, making mid-market privacy tools economically viable.

Graph databases, real-time validation engines, and document generation pipelines that were enterprise-only technology in 2018 are now accessible to mid-market tools, enabling proper compliance architecture without enterprise costs.

### Market Timing: OneTrust Consolidation Creates Opportunity

OneTrust's acquisition of Convercent, DataGuidance, and other competitors consolidated the market, reducing competitive pressure and enabling aggressive pricing. Their focus on Fortune 500 accounts created underserved demand in the 500-2,000 employee segment.

**Mid-market organizations want OneTrust's capabilities but can't justify the investment.** Compilo fills this gap.

---

## How Compilo Wins

### 1. Professional Document Generation (Available MVP)

**The Differentiator:** Enterprise GRC platforms generate rigid, template-driven output that legal teams reject as unprofessional. Compilo generates fully-formatted Word documents indistinguishable from expert-drafted DPIAs.

**What This Means:**

- Legal counsel review in native Microsoft Word format with familiar tools
- Professional formatting matching regulatory expectations (cover page, table of contents, proper headings, signature blocks)
- Automatic section numbering, cross-references, and table generation
- Export to Word (.docx), PDF, and Markdown with identical content
- Documents legal teams approve without extensive reformatting

**Technical Implementation:**

- Docxtemplater engine with professional templates developed by privacy lawyers
- Variable injection from structured components (purposes, processors, data categories)
- Conditional sections showing/hiding based on data presence
- Table iteration for repeated elements (processors, risks, controls)
- PDF generation via Puppeteer maintaining visual fidelity

**Result:** Legal teams work in their preferred format while privacy teams maintain underlying data integrity. No more choosing between professional output and structured data.

---

### 2. Single Source of Truth Architecture (Available MVP)

**The Differentiator:** Update compliance data once, all documents reflect changes automatically. No more maintaining processor lists across 15 different DPIAs.

**What This Means:**

- Define Google Cloud as a processor once with DPA details, location, processing purposes
- All 15 DPIAs that reference Google Cloud pull from this single definition
- Update Google Cloud's DPA expiry date → all 15 DPIAs reflect the new date automatically
- Query "which DPIAs use processors with expiring DPAs?" and get instant answers
- Archive a processor → all affected DPIAs flagged for review

**Component Library:**

- **Processing Activities:** Core compliance workflows (recruiting, marketing automation, customer support)
- **Data Processors:** Third-party vendors with DPA status, locations, sub-processors
- **Data Categories:** Personal data types (contact info, financial data, health data) with sensitivity classifications
- **Purposes:** Processing objectives (contract performance, legitimate interest, legal obligation)
- **Legal Bases:** GDPR Article 6/9 justifications with regulatory references
- **Recipients:** Internal and external data recipients with transfer mechanisms
- **Data Assets:** Systems and databases (Salesforce, PostgreSQL, Google Workspace) with hosting locations
- **Risks:** Identified privacy risks with likelihood, impact, and mitigation measures
- **Controls:** Security and privacy controls with implementation status

**Technical Implementation:**

- PostgreSQL relational database with foreign key integrity
- Many-to-many relationships via junction tables
- Graph visualization showing component relationships
- Real-time updates cascading to all referencing documents
- Version history for all component changes

**Result:** 70% component reuse by the 5th processing activity. Second DPIA takes 2 hours instead of 2 weeks.

---

### 3. Compliance Guardrails (Available MVP)

**The Differentiator:** Built-in privacy rules catch errors as you work—like spell-check for GDPR compliance. Errors flagged immediately, not during legal review.

**Real-Time Validation:**

- **Processor validation:** "Google Cloud Processor requires valid DPA" → flag if no DPA or DPA expired
- **Legal basis validation:** "Special category data requires Article 9(2) legal basis" → prevent saving with insufficient basis
- **Transfer validation:** "Transfer to USA requires supplementary measures post-Schrems II" → flag missing SCCs or TIA
- **DPIA triggers:** "Large-scale processing + special categories = DPIA required" → auto-flag for assessment
- **Retention validation:** "Retention period must have legal justification" → prevent indefinite retention without basis

**Compliance Scoring:**

- Visual compliance dashboard showing percentage complete
- Color-coded status indicators (green: compliant, yellow: needs attention, red: blocking issues)
- Prioritized action items ranked by regulatory risk
- Progress tracking toward audit readiness

**Technical Implementation:**

- TypeScript validation schemas with Zod
- Real-time rule execution on save
- Configurable rule weights for risk scoring
- Audit trail of all validation failures and resolutions

**Result:** Privacy officers catch 80% of compliance issues before legal review, reducing review cycles from 3 rounds to 1.

---

### 4. Guided Business Workflows (Available MVP)

**The Differentiator:** Questionnaires that learn from your organization's past activities—second DPIA is 70% pre-filled from similar projects.

**Smart Questionnaires:**

- Plain language questions avoiding legal jargon
- Conditional logic showing only relevant questions based on previous answers
- Context-aware help text explaining why each question matters
- Progress indicators showing completion percentage and estimated time remaining
- Multi-section workflows with save-and-resume capability

**Intelligent Pre-Fill:**

- "This looks similar to 'Q4 2024 Marketing Campaign' processing activity—pre-fill from there?"
- Suggested components based on business unit, project type, and data subjects
- Duplicate detection preventing accidental recreation of existing activities
- Component recommendations: "Marketing projects typically use these 5 purposes"

**Workflow Automation:**

- Automatic assignment to business owners with email notifications
- Structured approval routing (Business → Privacy → Legal → DPO)
- In-line comments and questions without leaving the platform
- Activity feed showing all updates and approvals

**Result:** Project managers complete intake in 15 minutes (down from 2+ hours), privacy officers review structured outputs instead of gathering information via email.

---

## Product Capabilities

### Available in MVP (Q2 2026 Target)

**Immediate Value Delivery:**

- **Component Library Management:** Create and maintain reusable compliance components (processors, purposes, data categories, legal bases, recipients, data assets) with relationship mapping and visual dependency graphs
- **Guided Questionnaires:** Business-friendly intake with discovery questionnaires (15-20 minutes for high-level project capture) and detailed assessments (30-45 minutes for complete DPIA requirements) featuring conditional logic, smart branching, and progress tracking
- **Automated DPIA Generation:** Generate complete Data Protection Impact Assessments following Article 35 GDPR structure with professional Word export, PDF generation, and Markdown output
- **Processing Activity Management:** Document all Article 30 processing activities with status tracking (Draft, Under Review, Approved, Active), risk level assessment, DPIA requirement flagging, and review date tracking
- **Real-Time Validation:** Built-in compliance rules checking processor DPA status, legal basis sufficiency, transfer mechanism validity, and DPIA triggers with visual compliance scoring
- **Approval Workflows:** Multi-stage review and approval with role-based routing (Business Owner → Privacy Officer → Legal Counsel → DPO), in-line comments, and comprehensive activity feeds
- **Basic Collaboration:** Comments on components and assessments, user assignment and delegation, email notifications for tasks and approvals
- **Multi-Tenant Architecture:** Secure organization isolation, user role management (DPO, Privacy Officer, Business Owner, Legal Team, IT Admin), and comprehensive audit logging

**Implementation Timeline:** 2-4 weeks from contract signature to production use
**Pricing:** €25,000-35,000/year based on user count and organization size

---

### Coming in Beta (Q3 2026)

**Collaboration & Intelligence:**

- **Bidirectional Document Sync:** Legal teams edit DPIAs in Word with changes flowing back to update underlying components through change detection, user review dialogs, and conflict resolution
- **Advanced Collaboration:** Threaded comments with @mentions, parallel approval workflows, real-time notifications across email/in-app/Slack, and shared activity feeds across entire organization
- **Smart Suggestions:** Component reuse intelligence suggesting purposes, processors, and controls based on similar past activities; duplicate detection preventing accidental recreation; completion time estimates based on organizational patterns
- **Additional Document Templates:** Auto-generate Records of Processing Activities (Article 30 RoPA), Data Processing Agreements with controller/processor terms, Privacy Statements aggregating processing activities into public-facing disclosures
- **Risk Assessment Workflows:** Structured risk identification with suggested risks from questionnaire responses, likelihood/impact assessment guidance, control linking and effectiveness tracking, residual risk calculation with executive approval for high risks
- **Document Versioning:** Immutable document snapshots with complete component state preservation, version comparison showing changes between generations, superseding workflows with user-controlled version lifecycle

**Expected Release:** August-September 2026
**Pricing:** Included in base subscription, no additional license fees

---

### Future Vision - Enterprise Scale (Q4 2026+)

**Integrations & Advanced Features:**

- **Microsoft Word Plugin:** Native Office add-in with component panel sidebar showing linked processors/purposes/risks, inline warnings for missing required fields, quick actions to add components while reviewing documents, live sync with WebSocket updates, offline mode with conflict resolution
- **REST API & GraphQL:** Comprehensive API for custom integrations, webhook support for event-driven automation, bulk operations for programmatic data management, OpenAPI documentation with code examples
- **Integration Ecosystem:** Pre-built connectors for HR systems (BambooHR, Workday, Personio), CRM platforms (Salesforce, HubSpot), ISMS tools (Vanta, Drata, Secureframe), GRC platforms (OneTrust, ServiceNow), and procurement systems (Coupa, SAP Ariba)
- **Executive Analytics:** Compliance health dashboards with trend analysis, processor inventory with geographic distribution and risk heat maps, data category heat maps showing processing concentration, risk matrices with likelihood/impact grids, scheduled executive reporting via email
- **Automated Data Discovery:** Integration with identity providers (Okta, Entra ID, Google Workspace) to discover systems, automated PII classification using ML, shadow IT detection for unauthorized systems, continuous monitoring with change alerts
- **Advanced Workflow Automation:** Background job system for scheduled reassessments, automated DPA expiry monitoring with escalation, stale risk detection and owner reminders, scheduled report generation and delivery

**Expected Timeline:** Q4 2026 and beyond based on customer demand
**Pricing:** Premium tier add-on, €10,000-15,000/year additional

---

## Go-To-Market Strategy

### Sales Motion: Sales-Assisted with Product-Led Discovery

**Target Sales Cycle:** 30-45 days from initial demo to contract signature

**Discovery Phase (Week 1-2):**

- Inbound lead qualification (organization size, privacy team headcount, current tools)
- Initial demo focused on DPIA generation pain points
- Technical deep-dive for IT/Security stakeholders
- Pricing proposal based on user count and activity volume

**Evaluation Phase (Week 2-4):**

- Pilot project: Import 3-5 existing processing activities
- Generate sample DPIA for legal team review
- Technical integration assessment (SSO, user provisioning)
- Legal review of MSA and DPA terms

**Decision Phase (Week 4-6):**

- Executive presentation with compliance metrics and ROI calculation
- Reference calls with similar-sized customers
- Contract negotiation and approval
- Implementation planning workshop

**Onboarding Phase (Week 7-10):**

- Kickoff call with privacy team and IT stakeholders
- Component library setup (import existing processors, purposes, data categories)
- User training sessions (2 hours for privacy team, 1 hour for business users)
- First DPIA generation guided session
- Go-live with ongoing support

---

### Pricing Strategy

**Tiered Annual Subscription:**

**Professional Tier:** €25,000/year

- Up to 10 named users
- Up to 100 processing activities
- Unlimited DPIAs and document generation
- Email support with 24-hour response SLA
- Monthly implementation support calls (first 3 months)
- Suitable for: 500-1,000 employee organizations with 2-3 privacy professionals

**Enterprise Tier:** €35,000-45,000/year

- Up to 25 named users
- Unlimited processing activities
- Everything in Professional plus:
  - SSO integration (SAML, Okta, Entra ID)
  - Priority support with 4-hour response SLA
  - Dedicated customer success manager
  - Quarterly business reviews
  - Custom training sessions
- Suitable for: 1,000-2,000 employee organizations with 4-6 privacy professionals

**Add-Ons:**

- Additional users: €1,500/user/year beyond plan limits
- Premium support: €5,000/year for 1-hour response SLA
- Professional services: €2,500/day for custom template development, data migration, advanced training

**Payment Terms:** Annual payment in advance, 30-day money-back guarantee

---

### Distribution Channels

**Direct Sales (Primary - 80% of revenue):**

- Inbound marketing via content (GDPR compliance guides, DPIA templates, webinars)
- Outbound prospecting targeting privacy officers at 500-2,000 employee companies
- LinkedIn advertising targeting DPO/privacy professional titles
- Conference presence at IAPP summits and privacy-focused events

**Channel Partners (Secondary - 20% of revenue):**

- Privacy consulting firms offering Compilo to implementation clients
- Law firms with privacy practices recommending for operational compliance
- Accounting/audit firms bundling with GDPR compliance audits
- Partner program: 20% recurring revenue share, co-marketing opportunities

**Content Marketing:**

- Weekly blog posts on GDPR compliance best practices
- Monthly webinars featuring privacy experts and customers
- Free resources: DPIA templates, Article 30 RoPA guides, processor questionnaire templates
- SEO targeting "GDPR DPIA tool," "privacy compliance software," "Article 30 RoPA automation"

---

### Customer Success Model

**Onboarding (Week 1-4):**

- Dedicated onboarding specialist guides setup
- Component library migration from existing spreadsheets
- User training with role-specific sessions
- First DPIA generation walkthrough
- Success milestone: Generate first approved DPIA within 30 days

**Ongoing Support:**

- **Professional Tier:** Email support, knowledge base, monthly office hours
- **Enterprise Tier:** Dedicated CSM, quarterly business reviews, Slack channel access
- Average response time: 4 hours for Enterprise, 24 hours for Professional
- Escalation path: Support → CSM → Product Team → Founder

**Expansion Opportunities:**

- Month 3-6: Upsell additional users as adoption spreads
- Month 6-12: Upgrade to Enterprise tier for SSO and priority support
- Month 12+: Add premium features (API access, advanced integrations)

**Retention Metrics:**

- Target: >90% annual retention rate
- Leading indicators: Monthly active users, DPIAs generated per month, component library growth
- At-risk signals: No logins in 30 days, declining document generation, support tickets indicating frustration

---

## Market Opportunity

### Total Addressable Market (TAM)

**EU/EEA Market:**

- Total companies: ~25 million
- Companies with 500-2,000 employees: ~100,000 (0.4% of total)
- Subject to GDPR: ~100,000 (all are within scope)
- With dedicated privacy resources (2+ FTE): ~30,000 companies (30% have professionalized privacy)
- Willing to pay for specialized tooling: ~15,000 companies (50% of those with dedicated teams)

**Target Annual Contract Value:** €30,000 average
**TAM = 15,000 companies × €30,000 = €450M addressable market**

**UK Market (Post-Brexit):**

- Companies 500-2,000 employees: ~15,000
- With dedicated privacy resources: ~4,500
- Willing to pay for tooling: ~2,000
- TAM = 2,000 × €30,000 = €60M additional

**Total TAM: €510M (EU/EEA + UK)**

---

### Serviceable Addressable Market (SAM)

Realistically reachable market given distribution and competitive dynamics:

**Reachable via Direct Sales:** ~5,000 companies (inbound marketing + outbound prospecting)
**Reachable via Channel Partners:** ~2,000 companies (privacy consultants, law firms)
**Total SAM: 7,000 companies × €30,000 = €210M**

---

### Serviceable Obtainable Market (SOM) - 5 Year Projections

**Year 1 (2026):** 50 customers × €28,000 average = **€1.4M ARR**

- Focus: Product-market fit, reference customers, case studies
- Sales team: 2 AEs, 1 SDR, founder selling
- Customer profile: Early adopters with acute pain, willing to adopt new tools

**Year 2 (2027):** 200 customers × €29,000 average = **€5.8M ARR**

- Focus: Proven ROI, documented implementation methodology, channel partnerships
- Sales team: 5 AEs, 2 SDRs, channel manager
- Customer profile: Mainstream mid-market, requiring references

**Year 3 (2028):** 500 customers × €31,000 average = **€15.5M ARR**

- Focus: Feature differentiation vs OneTrust, enterprise-lite positioning
- Sales team: 10 AEs, 4 SDRs, expanded channel network
- Market penetration: ~7% of SAM

**Year 4 (2029):** 1,000 customers × €32,000 average = **€32M ARR**

- Focus: Category leadership in mid-market privacy segment
- Market penetration: ~14% of SAM

**Year 5 (2030):** 1,750 customers × €33,000 average = **€58M ARR**

- Focus: Begin upmarket expansion to 2,000-5,000 employee segment
- Market penetration: ~25% of SAM

**Path to €100M ARR:** Requires expanding upmarket (5,000+ employees) or geographic expansion (US via CPRA, GDPR for non-EU subsidiaries)

---

## Our Unfair Advantage

### 1. Founder Domain Expertise

**Built by privacy practitioners who lived the pain:** Founding team includes privacy jurists who managed 50+ DPIAs manually at financial institutions and supervised technology companies. We spent years maintaining the same processor lists across dozens of documents, updating legal bases when guidance changed, and explaining complex requirements to frustrated business stakeholders.

**We know exactly where manual processes break** because we've personally experienced:

- The 2AM scramble updating DPAs before audit deadlines
- The embarrassment of inconsistent processor descriptions in front of regulators
- The impossibility of answering "show me all US transfers" without days of spreadsheet archaeology
- The frustration of legal teams rejecting poor-quality auto-generated DPIAs

This lived experience informs every product decision. We're not building what we _think_ privacy teams need—we're building what we _know_ they need because we were those privacy teams.

---

### 2. Technical Architecture as Competitive Moat

**Developer tooling principles applied to legal documentation:** While competitors treat compliance as document generation, we treat it as software engineering.

**Our architectural advantages:**

- **Versioning from Day One:** Immutable assessment snapshots, component change tracking, document version chains with superseding relationships—the infrastructure OneTrust added after years of customer complaints, we ship in MVP
- **Real-time validation engine:** TypeScript-based rule execution catching errors immediately vs. competitors' batch validation finding errors during legal review
- **Graph-based relationships:** Proper foreign key integrity, cascade rules, and relationship traversal vs. competitors' disconnected data models
- **API-first design:** Every feature accessible via API from launch, enabling custom integrations competitors can't match without rearchitecture

**This matters because:** As complexity grows (vendors with sub-processors, international transfers with evolving mechanisms, multi-year DPIAs requiring updates), our architecture scales elegantly while competitors accumulate technical debt.

---

### 3. Market Timing: Perfect Window

**Three converging factors create unique opportunity:**

**Regulatory enforcement matured (2022-2024):** The "grace period" for informal compliance ended. Organizations that avoided structured documentation 2018-2021 now face enforcement risk. This created urgent demand for compliance infrastructure.

**OneTrust's upmarket focus:** Their acquisition strategy targeted Fortune 500 accounts, explicitly deprioritizing mid-market. Former OneTrust customers report 40-60% price increases at renewal with declining support quality. We inherit dissatisfied mid-market accounts.

**Privacy team professionalization:** Organizations hiring 2-5 person privacy teams need proper tooling. They're too sophisticated for Typeform but can't justify OneTrust. This segment barely existed in 2018—now it's 15,000+ companies.

**Window closes in 3-5 years:** As OneTrust or competitors notice mid-market demand, they'll launch "lite" versions. First-mover advantage in this segment creates customer lock-in (migrating compliance data is painful) and network effects (shared component libraries increase value).

---

### 4. Network Effects (Future Moat)

**Every component created makes the next team faster:** As our customer base grows, we build anonymized shared intelligence:

- **Common processor database:** Pre-filled Google Workspace, AWS, Salesforce profiles with typical DPA terms
- **Industry-specific templates:** Healthcare DPIA templates learning from 100+ healthcare customers
- **Risk libraries:** Anonymized risk scenarios from similar processing activities
- **Control frameworks:** Pre-mapped security controls across regulations

**This creates defensibility:** New competitors must build component libraries from scratch. Our library becomes more valuable with each customer, creating switching costs and competitive advantage that compounds over time.

---

## Competitive Positioning

### Market Landscape

```
                    Professional Output Quality
                            ↑
                            |
            OneTrust ●      |      ● Compilo
            TrustArc ●      |      (Target Position)
          (€100K+/yr)       |    (€30K/yr avg)
                            |
        ←───────────────────┼───────────────────→
        Complex Setup       |      Fast Setup
        (6+ months)         |      (2-4 weeks)
                            |
                  Jotform ● |
                 Typeform ● |
                (€5K/yr)    |
                            |
                            ↓
                    Template Output
```

**Compilo's Position:** "Enterprise-Lite" quadrant combining OneTrust's professional quality with mid-market speed and pricing.

---

### Head-to-Head Comparison

**vs. OneTrust / TrustArc (Enterprise Platforms)**

| Factor               | OneTrust/TrustArc             | Compilo                           |
| -------------------- | ----------------------------- | --------------------------------- |
| **Annual Cost**      | €100,000-150,000              | €25,000-45,000                    |
| **Implementation**   | 6-8 months                    | 2-4 weeks                         |
| **Complexity**       | Enterprise-grade overwhelming | Sophisticated but approachable    |
| **Document Quality** | Rigid, template-driven        | Professional, legal-team approved |
| **Component Reuse**  | Limited, module-specific      | True graph relationships          |
| **User Experience**  | Power-user focused            | Role-optimized interfaces         |

**When to choose Compilo:** 500-2,000 employees, 2-5 privacy professionals, need professional quality without enterprise complexity

**When to choose OneTrust:** 5,000+ employees, 20+ privacy professionals, need entire GRC suite (vendor risk, ethics, ESG beyond privacy)

---

**vs. Jotform / Typeform / Notion (Questionnaire Tools)**

| Factor                      | Questionnaire Tools      | Compilo                      |
| --------------------------- | ------------------------ | ---------------------------- |
| **Annual Cost**             | €3,000-8,000             | €25,000-45,000               |
| **Document Output**         | Generic forms/PDFs       | Professional Word DPIAs      |
| **Data Relationships**      | None—isolated responses  | Full component graph         |
| **Compliance Intelligence** | No validation            | Real-time compliance rules   |
| **Audit Readiness**         | Manual compilation       | Query-ready database         |
| **Scalability**             | Breaks at 20+ activities | Designed for 100+ activities |

**When to choose Compilo:** Need structured compliance data, managing 30+ processing activities, require audit-ready documentation

**When to choose Typeform:** <20 activities, no integration needs, extreme cost sensitivity

---

**vs. Manual (Word + Excel)**

| Factor                 | Manual Process                | Compilo                          |
| ---------------------- | ----------------------------- | -------------------------------- |
| **Annual Cost**        | €0 software, 200+ hours labor | €25,000-45,000, 80% time savings |
| **Consistency**        | High risk of inconsistencies  | Guaranteed through single source |
| **Query Capability**   | Manual spreadsheet searches   | Instant SQL queries              |
| **Update Propagation** | Manual find-and-replace       | Automatic cascade updates        |
| **Audit Trail**        | Version control in filenames  | Complete change history          |
| **Collaboration**      | Email attachments             | Structured workflows             |

**When to choose Compilo:** >30 processing activities, multiple privacy staff, regular audits, need to scale

**When to choose Manual:** <10 activities, single privacy officer, extreme budget constraints

---

### Why Customers Switch to Compilo

**From OneTrust/TrustArc:**

- "We're paying €120K/year and using 20% of features"
- "Implementation took 9 months and we still can't generate professional DPIAs"
- "Support quality declined after they moved upmarket"
- "Pricing increased 50% at renewal with no additional value"

**From Typeform/Jotform:**

- "We outgrew questionnaires—need actual compliance infrastructure"
- "Legal team won't approve our auto-generated documents"
- "Can't answer basic questions like 'which DPIAs reference this processor?'"
- "Managing 50+ processing activities in disconnected forms is chaos"

**From Manual/Excel:**

- "Spending 2 weeks per DPIA is unsustainable"
- "Auditor found inconsistencies across our documentation"
- "Can't scale to 100+ processing activities manually"
- "Team members can't collaborate effectively in shared drives"

---

## Success Metrics

### North Star Metric

**Time from project kickoff to approved DPIA:** Target <5 days (currently 14-21 days for manual processes)

### Product Metrics

- **Component Reuse Rate:** 70% by 5th processing activity
- **DPIA Generation Time:** 4-6 hours (down from 2-3 weeks manual)
- **First Value Time:** Generate first approved DPIA within 30 days of contract signature
- **Monthly Active Users:** >70% of licensed users active monthly
- **Documents Generated per Month:** Average 8-12 DPIAs per organization

### Business Metrics

- **Annual Contract Value:** €30,000 average across customer base
- **Customer Acquisition Cost:** <€15,000 (5-month payback)
- **Gross Revenue Retention:** >90% annually
- **Net Revenue Retention:** >110% with upsells and expansion
- **Customer Lifetime Value:** €180,000 (6-year average tenure × €30K)

### Customer Satisfaction

- **Net Promoter Score:** Target >50
- **Customer Health Score:** >80% accounts "green" status
- **Support Satisfaction:** >90% satisfied with resolution
- **Reference Willingness:** >60% willing to provide references

---

## What We're Not

**Clarity on what Compilo won't do:**

- ❌ **Not a full GRC platform:** We focus exclusively on privacy compliance, not vendor risk management, ethics programs, or ESG reporting
- ❌ **Not suitable for <500 employees:** Smaller organizations should use simpler tools—our sophistication requires scale to justify investment
- ❌ **Not a consulting replacement:** We provide tools for privacy teams to execute, not privacy advisory services or DPO-as-a-service
- ❌ **Not focused on consent management:** We don't compete with cookie consent platforms (OneTrust CMP, Cookiebot)—we document processing, not manage website banners
- ❌ **Not a DSAR automation platform:** While we support DSAR documentation, we don't compete with DataGrail's automated fulfillment across 2,400+ integrations

**What this means:** Compilo is a **professional compliance documentation platform** for mid-sized privacy teams managing complex processing activities. We do one thing exceptionally well: maintain structured compliance data and generate professional documentation.

---

_Last Updated: November 2025_
