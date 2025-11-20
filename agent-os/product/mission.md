# Product Mission

## Pitch

Compilo delivers OneTrust's sophistication at one-third the cost and one-tenth the implementation time. Stop maintaining the same processor list across 15 different DPIAs—generate professional GDPR documentation in hours instead of weeks from a single source of truth that updates all documents automatically.

**Target:** 500-2,000 employee organizations with 2-5 privacy professionals who need enterprise-grade compliance infrastructure without €100K/year budgets or 6-month implementations.

## Users

### Primary Customers

- **Mid-to-Large Organizations (500-2,000 employees)**: Companies with dedicated privacy teams (2-5 FTE) who have outgrown manual processes but can't justify OneTrust's complexity or cost
- **Privacy Professionals**: Privacy officers and DPOs managing 30-150 processing activities with limited resources, preparing for regular supervisory authority audits
- **Legal Teams**: Senior counsel reviewing 20-30 DPIAs annually who need professional document quality without extensive reformatting
- **Business Stakeholders**: Department heads and project managers requiring compliance approvals without becoming privacy experts
- **IT/Security Teams**: IT managers and security officers responsible for system inventory, data discovery, and technical privacy controls

### User Personas

**Privacy Officer / DPO** (30-50 years old)

- **Role:** Data Protection Officer or Privacy Manager leading 2-5 person team
- **Context:** Managing 50-150 processing activities, coordinating between legal, IT, and business stakeholders, preparing for audits
- **Pain Points:** Maintaining identical processor information across 15 DPIAs manually, spending 3 weeks updating all documentation when a DPA expires, unable to answer auditor queries like "show me all activities processing health data with US transfers," no visibility into business units creating new processing without privacy review
- **Goals:** Reduce DPIA creation from 2-3 weeks to 4-6 hours, maintain audit-ready documentation continuously, enable self-service for business stakeholders while maintaining oversight, query compliance data instantly

**Legal Counsel** (35-55 years old)

- **Role:** Senior Legal Counsel reviewing privacy documentation
- **Context:** 15+ years legal experience, moderate privacy expertise, reviewing 20-30 DPIAs annually
- **Pain Points:** Receiving unstructured information requiring extensive back-and-forth, variable document quality, difficulty tracking changes between versions, cannot add inline legal comments in same system
- **Goals:** Review DPIAs in 2-3 hours instead of full day, provide feedback once instead of multiple rounds, confidence in maintained quality over time, work in native Word format

**Project Manager / Business Stakeholder** (30-45 years old)

- **Role:** Department lead managing projects requiring privacy approval
- **Context:** Launching marketing campaigns, products, or vendor integrations processing personal data
- **Pain Points:** Privacy requirements blocking projects 2-3 weeks, incomprehensible legal jargon, no visibility into approval progress, answering same questions for similar projects repeatedly
- **Goals:** Get compliance approval in 3-5 days instead of 3 weeks, complete intake in 15 minutes without privacy expertise, understand requirements in plain language

**IT Manager / Information Security Officer** (30-50 years old)

- **Role:** IT Manager or Security Lead managing 50-200 business systems
- **Context:** Responsible for data security, technical privacy controls, and DSAR fulfillment
- **Pain Points:** No central inventory when privacy asks "what systems process PII?", manual documentation becomes stale immediately, responding to DSARs requires manually querying 30+ databases
- **Goals:** Automated system inventory, integration with existing CMDB/ITSM tools, DSAR fulfillment automation, API access for custom workflows

## The Problem

### Structural Disconnect Between Data and Documents

Privacy teams face a fundamental architectural problem: they need to maintain structured, reusable data while producing text-driven legal documents.

Manual approaches using Word and Excel lead to the same processor being copied across 15 DPIAs creating 15 different versions. When a DPA expires, teams must manually update all documents. There's no way to query "which DPIAs use Recruitee?" Inconsistencies proliferate. Creating one DPIA takes 2 weeks. Maintaining compliance at scale becomes impossible.

Enterprise GRC tools like OneTrust and TrustArc cost €50,000-150,000 per year, require 6-8 month implementations, overwhelm mid-market teams with enterprise complexity, generate poor quality documents that legal teams reject, and provide limited true component reusability despite marketing claims.

Simple questionnaire tools (Typeform, Jotform, Notion) generate documents without underlying structure. Every DPIA starts from scratch with no relationships between data and no ability to query across documents.

**Our Solution:** Compilo treats documents as views of structured data, not separate sources of truth. Like modern applications where a database generates multiple views (web, mobile, API, reports), Compilo maintains a compliance graph that generates all documents (DPIA, RoPA, DPAs, privacy statements). When you update the database, all views update automatically.

This architectural approach provides enterprise-grade data integrity with mid-market pricing and implementation speed.

## Differentiators

### Single Source of Truth

Unlike manual Word documents that duplicate data everywhere, update compliance data once and all documents reflect changes automatically. Define Google Cloud as a processor once—all 15 DPIAs that reference it pull from this single definition. Update the DPA expiry date, all documents update automatically. Query "which DPIAs use processors with expiring DPAs?" and get instant answers.

This results in 70% component reuse by the 5th processing activity and reduction of DPIA creation time from 2-3 weeks to 4-6 hours.

### Professional Document Generation

Unlike enterprise GRC tools that produce rigid, template-driven output legal teams reject, we generate fully-formatted Word documents indistinguishable from expert-drafted DPIAs. Legal counsel review in native Microsoft Word format with professional formatting matching regulatory expectations—cover pages, table of contents, proper headings, signature blocks, automatic numbering, and cross-references.

This results in legal teams working in their preferred format while maintaining underlying data integrity.

### Compliance Guardrails

Unlike manual reviews that catch errors late in the process, we validate compliance requirements as teams work with built-in rules: "processor requires valid DPA," "special category data requires Article 9(2) legal basis," "USA transfer requires supplementary measures post-Schrems II," "large-scale processing + special categories = DPIA required." Visual compliance scoring shows percentage complete with prioritized action items.

This results in privacy officers catching 80% of compliance issues before legal review, reducing review cycles from 3 rounds to 1.

### Business-Friendly Workflows

Unlike compliance tools filled with legal jargon, we provide guided questionnaires in plain language with smart branching and intelligent pre-fill. "This looks similar to 'Q4 2024 Marketing Campaign'—pre-fill from there?" Component recommendations based on business unit and project type. Duplicate detection preventing accidental recreation.

This results in project managers completing intake in 15 minutes (down from 2+ hours) while privacy officers review structured outputs instead of gathering information via email.

## Key Features

### Available in MVP

- **Component Library:** Maintain structured, reusable compliance data including processing activities, data processors (with DPA status, locations, sub-processors), personal data categories with sensitivity classifications, purposes, legal bases with regulatory references, recipients with transfer mechanisms, data assets (Salesforce, PostgreSQL, Google Workspace), risks with likelihood/impact assessment, and security controls with implementation status
- **Guided Questionnaires:** Business-friendly data collection with discovery questionnaires (15-20 minutes for project capture), detailed assessments (30-45 minutes for DPIA requirements), conditional logic showing only relevant questions, smart suggestions from existing components, progress tracking with estimated time remaining, and multi-stakeholder assignment with email notifications
- **Automated DPIA Generation:** Generate complete Data Protection Impact Assessments following Article 35 GDPR structure with auto-populated sections from components (processors, data categories, purposes, legal basis), professional formatting with cover page and table of contents, export to Word, PDF, and Markdown formats, and immutable version snapshots preserving component state at generation time
- **Validation & Compliance Engine:** Real-time validation with TypeScript-based rules checking processor DPA validity, special category data legal basis sufficiency, third country transfer safeguard requirements, and DPIA triggers for high-risk processing, visual compliance scoring showing percentage complete, color-coded status indicators (green/yellow/red), and prioritized action items ranked by regulatory risk
- **Approval Workflows:** Multi-stage review and approval with role-based routing (Business Owner → Privacy Officer → Legal Counsel → DPO), in-line comments and questions without leaving platform, email and in-app notifications for assignments and updates, activity feeds showing all changes and approvals with complete audit trail

- **Bidirectional Document Sync:** Legal team edits in Word with changes flowing back to components through change detection, user review dialogs for approving/rejecting edits, component update propagation with conflict resolution when underlying data changed since generation
- **Advanced Collaboration:** Threaded comments with @mentions triggering notifications, parallel approval workflows for multiple reviewers, real-time updates via email/in-app/Slack, shared activity feeds across organization showing all compliance work
- **Smart Suggestions:** Component reuse intelligence based on similar projects (business unit, project type, data subjects), pre-fill from past activities ("70% of fields populated from last marketing campaign"), duplicate detection preventing accidental recreation, completion suggestions with time estimates based on organizational patterns
- **Additional Document Templates:** Auto-generate Article 30 Records of Processing Activities (RoPA) aggregating all processing activities, Data Processing Agreements with controller/processor terms and security requirements, Privacy Statements aggregating processing activities into public-facing disclosures
- **Risk Assessment Workflows:** Structured risk identification with suggested risks from questionnaire responses, likelihood/impact assessment guidance with regulatory examples, control linking showing which security measures mitigate each risk, residual risk calculation with executive approval requirements for high risks

- **Microsoft Word Plugin:** Native Office add-in with component panel sidebar showing linked processors/purposes/risks with filter and search, inline warnings detecting missing required fields with yellow highlights and tooltips, quick actions to add/edit components while reviewing documents, live sync via WebSocket receiving real-time updates from teammates, offline mode with local storage and conflict resolution on reconnection
- **REST API & GraphQL Layer:** Comprehensive REST API with CRUD endpoints for all entities (activities, vendors, assessments, components), GraphQL schema providing nested relationship queries in single request, OpenAPI/Swagger documentation with interactive explorer and code examples, webhook system for event-driven automation (DPA expiring, assessment due, high risk detected), rate limiting and API key management
- **Integration Ecosystem:** Pre-built connectors for HR systems (BambooHR, Workday, Personio) syncing employee data and triggering privacy workflows, CRM platforms (Salesforce, HubSpot, Pipedrive) importing customer data and consent records, ISMS tools (Vanta, Drata, Secureframe) bidirectionally syncing risks and controls, GRC platforms (OneTrust, ServiceNow) preventing data duplication, procurement systems (Coupa, SAP Ariba) triggering vendor privacy assessments
- **Executive Analytics Dashboard:** Compliance health overview with weighted scoring across activities/vendors/assessments, processor inventory with world map visualization showing geographic distribution and DPA status breakdown, data category heat maps showing processing concentration by sensitivity, risk matrices with likelihood/impact grids and trend analysis, scheduled executive reporting with PDF generation and email delivery
- **Automated Data Discovery:** Integration with identity providers (Okta, Entra ID, Google Workspace) discovering systems via SSO monitoring, ML-powered PII classification scanning databases and applications with 95%+ confidence, shadow IT detection identifying unauthorized systems processing personal data, continuous monitoring with change alerts when new systems appear or data categories change

**Pricing:** Premium tier add-on, €10,000-15,000/year additional
