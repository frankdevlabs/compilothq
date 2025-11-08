# Product Roadmap

## MVP Phase: Core Foundation

### Application Foundation

1. [x] Next.js Application Foundation & Routing Setup — Set up Next.js 16 App Router with directory structure, TypeScript configuration, base layout with navigation, route groups for authenticated vs public pages, Tailwind CSS with shadcn/ui theme, environment variables, and configuration management to provide the application shell for all features. `S`

2. [ ] Monorepo & Prisma Infrastructure Setup — Set up monorepo structure with pnpm workspaces, create packages/database with Prisma schema and client, configure packages/ui for shared components, establish cross-package dependencies, set up Prisma Client exports and singleton pattern, configure migration scripts to work from root and package level, and prepare development tooling. `S`

**Milestone 1: Foundation Ready** ✓ _Development environment established_

---

### Database Schema (Enhanced)

#### Foundation & Reference Data

3. [ ] Foundation Reference Models & Seed Data — Implement core reference data models (Country, DataNature, ProcessingAct, TransferMechanism, RecipientCategories) in Prisma schema, create migrations, test in development environment, and implement comprehensive seed data covering 250+ countries with GDPR classifications, 28 data nature types, 17 processing operations, and 13 recipient categories to provide the foundation for automatic compliance validation and classification throughout the platform. `M`

#### Core Entity Models

4. [ ] Core Processing Activity & Data Subject Models — Implement ProcessingActivity model with workflow status tracking, risk flags for automated decisions and special data, flow visualization support, and multi-tenancy; implement DataSubjectCategory model with vulnerability tracking and volume estimation; create migrations and test to enable activity management and DPIA requirements detection. `S`

5. [ ] Personal Data Category Model — Implement PersonalDataCategory model with references to DataNature for automatic classification, collection method tracking, and purpose documentation; create migrations and test to enable special category data detection and compliance validation across processing activities. `S`

6. [ ] Data Processor & Recipient Model — Implement DataProcessor model with role management, location tracking, DPA lifecycle management including expiry tracking, onward transfer chains for subprocessor flows, and certification tracking; create migrations and test to enable automatic transfer requirement detection and processor compliance monitoring. `M`

7. [ ] Digital Asset Model — Implement DataAsset model supporting multiple processing locations with per-location transfer mechanisms, vendor associations, technical details, and security measures; create migrations and test to track systems processing personal data across multiple jurisdictions and automatically detect transfer requirements. `M`

#### Legal & Purpose Framework

8. [ ] Purpose & Legal Basis Models — Implement Purpose model for documenting processing objectives and LegalBasis model with support for all six GDPR legal bases including legitimate interest assessments and consent mechanisms; create migrations and test to enable legal compliance validation and special category data checks. `S`

9. [ ] Retention Rule Model — Implement RetentionRule model with duration specifications, legal rationale, start/end event triggers, deletion process documentation, and automatic deletion flags; create migrations and test to enable reusable retention policies across multiple activities and data categories with proper justification tracking. `S`

#### Junction Tables with Contextual Metadata

10. [ ] Core Activity Junction Tables — Implement junction tables linking ProcessingActivity to DataSubject, LegalBasis, and RetentionPeriod with contextual metadata including associated purposes and data categories per relationship; create migrations, test queries, and validate composite indexes to enable granular queries like "What purposes and data apply to this activity-subject combination?" and support accurate compliance documentation. `L`

11. [ ] Recipient & Asset Junction Tables — Implement junction tables linking ProcessingActivity to Recipients with context-specific roles and to DigitalAssets with specific processing operations (collection, storage, use, etc.); create migrations and test to track what data recipients receive and what operations are performed on which assets with granular purpose and data category mapping. `M`

#### Risk, Security & Compliance Models

12. [ ] Risk Management & Control Models — Implement Risk model with categorization, likelihood/impact scoring, and status tracking; implement Control model with implementation lifecycle and effectiveness ratings; establish many-to-many relationships to link risks with their controls and to all compliance entities (activities, processors, assets); create migrations and test to enable comprehensive risk tracking and residual risk calculation. `M`

13. [ ] Security, Certification & Rights Models — Implement SecurityMeasure model for documenting technical and organizational measures, Certification model for tracking processor and asset certifications with expiry dates, and DataSubjectRightsImplementation model for documenting how each GDPR right is fulfilled with request processes and response times linked to data subject categories; create migrations and test. `S`

#### International Transfers

14. [ ] International Transfer Model — Implement DataTransfer model supporting three transfer scenarios (recipient-based, asset-based with specific location tracking, and manual/ad-hoc) with appropriate transfer mechanisms per scenario, linked to activities via junction table with associated purposes; create migrations and test to enable flexible tracking of all international data transfer types and automatic safeguard requirement detection. `M`

**Milestone 2: Complete Database Schema** ✓ _All data models implemented and tested_

---

### API & Authentication

15. [ ] tRPC API Layer Foundation — Set up tRPC v11 server with Next.js App Router integration, create base router structure organized by domain, implement Zod validation schemas for all entities, create reusable tRPC context with database access, set up tRPC client for React components with TanStack Query, and implement error handling middleware to enable type-safe API communication between frontend and backend. `M`

16. [ ] Authentication & Authorization — Set up NextAuth.js v5 with email magic links and Google OAuth, configure Prisma adapter for session management, implement role-based access control (admin, privacy officer, legal, business user), create organization multi-tenancy structure, build protected route middleware, and create login/logout UI components to secure all application features. `M`

17. [ ] Base UI Component Library Setup — Install and configure shadcn/ui components (Button, Input, Select, Dialog, Sheet, Table), set up Radix UI primitives, create reusable form components with React Hook Form and Zod, build base layout components (Header, Sidebar, PageContainer), implement loading states and error boundaries, and set up toast notification system to provide UI building blocks for all features. `S`

**Milestone 3: Technical Foundation Complete** ✓ _Full-stack infrastructure ready for feature development_

---

### Component Library UI

18. [ ] Component List Views with TanStack Table — Build table views for ProcessingActivity, DataProcessor, DataAsset, Risk, and Control entities with TanStack Table supporting sorting, filtering, pagination, column visibility controls, row selection for bulk operations, search across all component types, and quick filters by status, risk level, and owner to enable users to browse and manage compliance components. `M`

19. [ ] Component Detail Pages & Relationship Views — Create detail page layouts for each component type displaying all attributes with edit capabilities, show related components (activity → processors, risks, assets), implement inline editing of basic fields, add breadcrumb navigation, and display audit trails with created/updated timestamps and users to enable detailed component viewing and management. `M`

20. [ ] Graph Visualization with React Flow — Implement React Flow for visualizing component relationships with node types for each component (activity, processor, asset, etc.), edge rendering showing relationship types, interactive features (zoom, pan, node selection, expand/collapse), layout algorithms (hierarchical, force-directed), and graph export functionality (PNG, SVG) to provide visual understanding of compliance data structure. `L`

21. [ ] Kanban Board Views for Workflow Management — Build kanban board component with drag-and-drop, workflow columns based on ProcessingActivity status, card customization (compact vs detailed views), filtering and grouping options, bulk status updates via drag-and-drop, and swimlanes for grouping by owner or priority to enable visual workflow management for compliance teams. `M`

22. [ ] Bulk Operations & CSV/Excel Import — Implement bulk edit functionality (status updates, assignment, tagging), bulk delete with confirmation dialogs, CSV import wizard with field mapping, Excel import using SheetJS, validation during import with error reporting, and import preview with conflict resolution UI to enable efficient data management and migration from existing tools. `M`

23. [ ] Validation Engine Core — Implement TypeScript-based validation rules including processor DPA requirements, special category data legal basis checks, third country transfer safeguards, DPIA requirements for large-scale processing, retention period justifications, and visual compliance scoring with error/warning/success indicators. `M`

24. [ ] Discovery Questionnaire System — Create project intake questionnaire (15-20 minutes) for business stakeholders with project basics, data subject identification, volume estimation, data category selection with smart warnings for special categories, external system identification with processor suggestions, automated decision and profiling detection, and automatic ProcessingActivity creation with linked components. `L`

25a. [ ] Data Necessity Assessment Questionnaire — Build detailed questionnaire for data field necessity assessments covering collection purpose documentation, usage patterns analysis, necessity tests, proportionality justifications, and retention rationale to enable privacy officers to conduct data minimization reviews and document compliance with GDPR Article 5(1)(c). `M`

25b. [ ] Processor Details Deep-Dive Questionnaire — Build detailed questionnaire for comprehensive processor information gathering including full contact information, processing location details, data category mapping, DPA upload and lifecycle tracking, subprocessor chain management, security measures documentation, and certification tracking to enable privacy officers to collect complete Article 28 processor information and maintain DPA compliance. `M`

26a. [ ] Questionnaire Engine Foundation & Question Types — Implement core questionnaire engine with all question types (text, textarea, choice, multi-choice, yes/no, date, number, dynamic list, compound, file upload), question rendering components, answer storage and validation, form state management with React Hook Form, and section/page navigation to provide the foundation for all questionnaire features. `M`

26b. [ ] Questionnaire Conditional Logic & Auto-Risk Detection — Implement conditional logic engine with branching based on answers, show/hide rules for questions and sections, dependency chains for complex flows, and auto-risk detection based on responses (large-scale processing, special category data, automated decisions, third country transfers) with visual risk indicators to enable dynamic questionnaires that adapt to user answers and automatically flag compliance risks. `M`

26c. [ ] Questionnaire Smart Features & Collaboration — Implement smart suggestions from existing components with search and selection UI, progress tracking with section completion indicators, multi-stakeholder assignment with email notifications, context-aware help text per question type, and questionnaire versioning to enable collaborative questionnaire completion with intelligent assistance. `M`

27a. [ ] DPIA Template Foundation & Auto-Generated Sections — Create comprehensive DPIA document structure with version control table, management summary with variable injection, and fully auto-generated blocks including personal data category tables, data processor listings with DPA status, processing location tables with transfer mechanisms, technical and organizational measures, legal framework documentation, and retention period tables to generate 70% of DPIA content automatically from component data. `M`

27b. [ ] DPIA Template Flexibility & Free Text Sections — Implement template-with-override pattern for sections requiring judgment (risk matrices, control assessments) with default values from component data and manual override capability, free text sections with variable support for custom content, and section show/hide logic based on processing activity characteristics to enable privacy officers to customize DPIAs while maintaining data integrity. `S`

27c. [ ] DPIA Data Flow Diagram Generation — Implement automatic data flow diagram generation using Mermaid.js based on processing activity relationships including data subject → collection → processing locations → processors → recipients flow visualization, transfer mechanism annotations for international flows, visual indicators for special category data and automated decisions, diagram customization options (layout, styling), and both embedded and standalone diagram exports to provide visual compliance understanding. `M`

28. [ ] RoPA Document Template — Build Article 30 Register generation with processing activity listings including name/description, purpose, data subject categories, personal data categories, recipient categories, international transfers, retention periods, and security measures with exports to Excel/CSV, Word table, and web dashboard views. `M`

29a. [ ] Word Document Export with Docxtemplater — Implement professional Word document export using Docxtemplater with template file management, variable injection for all document types (DPIA, RoPA, DPA), professional formatting with styles and themes, headers/footers with page numbers and document metadata, auto-generated table of contents, and track changes support for bidirectional sync to enable legal teams to work in their preferred Word format. `M`

29b. [ ] PDF Export with Puppeteer — Implement PDF export using Puppeteer with HTML-to-PDF rendering from document templates, perfect visual formatting matching Word output, digital signature support for document authenticity, PDF metadata injection, and watermarking options to provide read-only, distributable document format for external stakeholders and regulators. `S`

29c. [ ] Markdown Export for Version Control — Implement Markdown export with clean text-based formatting, Git-friendly diffs for tracking document changes over time, component links embedded as references, and automatic file naming conventions to enable internal version control and developer-friendly document review workflows. `XS`

**Milestone 4: MVP Complete** ✓ _Core value proposition delivered: component library + questionnaires + document generation_

---

## Beta Phase: Collaboration & Intelligence

30. [ ] Bidirectional Document Sync — Implement document metadata embedding in Word properties, change detection algorithm comparing original vs edited documents for table rows, cell edits, and text changes, user review dialog for approving/rejecting changes, automatic component updates from approved changes, conflict resolution when components changed since generation, and affected document regeneration. `XL`

31. [ ] Collaboration Features — Build comment system on any component or document section with @mentions, structured approval workflows with role-based steps and status tracking, comprehensive notification system (email and in-app) for assignments, component updates, DPA expiries, review due dates, and comments, plus activity feed showing recent changes across organization. `L`

32. [ ] Smart Suggestions System — Implement component reuse intelligence analyzing similar projects and suggesting commonly-used components, pre-fill capabilities from past activities, duplicate detection when adding components, completion suggestions identifying missing required fields with time estimates, and learning from organization-specific patterns. `M`

33. [ ] DPA & Privacy Statement Templates — Create data processing agreement template with variable injection from processor and activity components, privacy statement generation aggregating all processing activities into public-facing documentation with automatic updates when underlying activities change, and consent form generation based on legal basis requirements. `M`

34. [ ] Risk Assessment Questionnaires — Build risk review workflows for privacy officers to review auto-detected risks, add manual risks, assess likelihood and impact for each risk, identify and link controls, calculate residual risk scores, and generate risk matrices and heatmaps for reporting. `L`

**Milestone 5: Beta Phase Complete** ✓ _Collaboration and intelligence features increase stickiness and multi-user value_

---

## Scale Phase: Integrations & Enterprise

35. [ ] Microsoft Word Plugin — Develop Office.js add-in with component panel sidebar showing linked components, inline warnings highlighting missing required fields, quick actions for adding processors and linking risks, live sync to cloud in real-time, offline mode with sync when online, and full integration with Compilo backend via REST API. `XL`

36. [ ] REST API & GraphQL — Build comprehensive API layer with GraphQL schema for querying activities, processors, risks, controls with nested relationships, REST endpoints for CRUD operations on all components, API authentication with API keys and OAuth, rate limiting, and complete API documentation with examples. `L`

37. [ ] Webhook System — Implement webhook infrastructure for event notifications including DPA expiring alerts, DPIA approval notifications, component update events, risk threshold breaches, and custom webhook configurations per organization with payload customization and retry logic. `M`

38. [ ] Integration Connectors — Build connectors for HR systems (sync employee processing activities), CRM platforms (import customer processing data), ISMS tools (export risks to ISO 27001 platforms), GRC platforms (bidirectional sync with OneTrust/TrustArc), and procurement systems (DPA renewal tracking and alerts). `XL`

39. [ ] Analytics Dashboard — Create executive compliance health overview showing overall score, status breakdown, risk distribution, and upcoming obligations; processor inventory dashboard with region distribution, DPA status tracking, and most-used processor analytics; data category heatmaps showing which data is processed where; risk matrices with likelihood/impact visualization; and trend analysis over time. `L`

40. [ ] Background Job System — Implement BullMQ with Redis for async processing including document generation jobs, scheduled DPA expiry checks, DPIA review reminders, bulk operations, email sending with rate limiting, and webhook delivery with retries. `M`

41. [ ] Advanced Search & Reporting — Build full-text search across all components using PostgreSQL pg_trgm, advanced filtering with multiple criteria combinations, saved search/filter presets, custom report builder with component selection and export options, and scheduled report generation with email delivery. `L`

> Notes
>
> - Roadmap ordered by technical dependencies: application foundation → database models → API layer → authentication → UI components → features → integrations
> - Each item represents an end-to-end functional and testable feature combining frontend and backend work
> - Items 1-2 establish Next.js and Prisma infrastructure before schema modeling begins
> - Items 3-14 implement database schema incrementally: reference data → core entities → junction tables → compliance models
> - Foundation reference data (item 3) includes comprehensive seed data: 250+ countries with GDPR classifications, 28 data nature types, 17 processing operations, 13 transfer mechanisms, and 13 recipient categories
> - Junction tables (items 10-11) implement contextual metadata pattern with granular purpose and data category mapping per relationship
> - International transfers (item 14) use discriminated union pattern for recipient-based, asset-based, and manual transfer scenarios
> - Items 15-17 establish API, authentication, and base UI components required for all feature development
> - Letter-suffixed items (25a/b, 26a/b/c, 27a/b/c, 29a/b/c) represent focused features within related domains: questionnaire types, DPIA template sections, and export formats
> - Questionnaire engine (26a/b/c) divided into foundation with question types, conditional logic with auto-risk detection, and smart features with collaboration tools
> - DPIA template (27a/b/c) divided into auto-generated sections, template flexibility with overrides, and data flow diagram generation
> - Document export (29a/b/c) divided by output format and use case: Word for legal teams, PDF for external distribution, Markdown for version control
> - Milestones mark completion of major development phases: Foundation Ready (1-2), Complete Database Schema (3-14), Technical Foundation Complete (15-17), MVP Complete (18-29c), Beta Phase Complete (30-34)
> - MVP phase delivers core value: component library + discovery questionnaires + automated document generation
> - Beta phase adds collaboration features, intelligent suggestions, and risk assessment workflows
> - Scale phase enables enterprise adoption through integrations, webhooks, analytics, and advanced search
