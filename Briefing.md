# Compilo: Product Vision & Technical Specification

## 1. Main Idea: Problem & Core Purpose

### The Problem We're Solving

**Privacy/compliance teams face a fundamental architectural problem**: They need to maintain structured, reusable data while producing text-driven legal documents.

#### Current State (Broken)

**Manual Approach** (Word/Excel):

- Same processor copied across 15 DPIAs → 15 different versions
- DPA expires → must update 15 documents manually
- No way to ask "which DPIAs use Recruitee?"
- Inconsistencies everywhere
- Takes 2 weeks to create one DPIA
- Impossible to maintain at scale

**Enterprise GRC Tools** (OneTrust, TrustArc):

- Cost €50,000+ per year
- 6+ month implementation
- Complex, enterprise-focused
- Poor document generation (legal teams hate the output)
- Over-engineered for mid-market
- No real component reusability

**Simple Questionnaire Tools**:

- Generate documents but no underlying structure
- Every DPIA starts from scratch
- Can't answer "show me all processors"
- No relationships between data

#### The Core Insight

**Documents should be views of structured data, not separate sources of truth.**

Think about how modern applications work:

```
Database (Source of Truth)
    ↓
Multiple Views
    → Web interface
    → Mobile app
    → API responses
    → PDF reports
```

Compliance should work the same way:

```
Compliance Graph (Source of Truth)
    ↓
Multiple Documents
    → DPIA (Data Protection Impact Assessment)
    → RoPA (Article 30 Register)
    → Data Processing Agreements
    → Privacy Statements
    → Consent Forms
```

When you update the database, all views update automatically.

### Core Purpose

**Compilo is a component-based compliance platform that bridges structured data with text-driven legal workflows.**

#### What This Means in Practice

**For Privacy Officers**:
"I can maintain one canonical list of processors, data categories, and risks, and generate all required documents from this single source of truth. When a processor's DPA expires, I update it once and all 15 DPIAs automatically reflect the change."

**For Legal Teams**:
"I get professional Word documents I can review and approve, with the confidence that they're consistent across the organization and based on accurate, validated data."

**For Business Stakeholders**:
"I fill out a 15-minute questionnaire in plain language, and the system automatically structures the data and generates the compliance documentation we need."

#### The Three Pillars

1. **Component Library**: Reusable compliance building blocks
   - Processors, data categories, risks, controls
   - Explicit relationships (this processor handles this data for this activity)
   - Validation rules (processor needs DPA, special data needs legal basis)

2. **Guided Questionnaires**: Business-friendly data collection
   - Discovery questionnaires (high-level project intake)
   - Deep-dive questionnaires (detailed justifications)
   - Smart branching based on answers
   - Multi-stakeholder (different sections → different people)

3. **Document Generation**: Professional output
   - Auto-generate from components
   - Mix of structured (tables) and narrative (justifications)
   - Export to Word/PDF
   - Bidirectional sync (edits flow back to components)

### Positioning Statement

**"Component-based compliance for modern organizations. Generate DPIAs, RoPAs, and DPAs in hours, not weeks, with reusable compliance components that ensure consistency and enable true audit readiness."**

---

## 2. Key Features (Detailed)

### MVP Phase (Months 1-3): Core Foundation

#### Feature 1: Compliance Component Library

**Purpose**: Maintain structured, reusable compliance data

**Components** (all as explicit Prisma models):

**Foundation Models**:

- **Country**: Geographic reference data
  - Name, ISO code (e.g., "NL", "US")
  - GDPR status array (can have multiple: 'EU', 'EEA', 'EFTA', 'Third Country', 'Adequate')
  - Description
  - Pre-seeded with 250+ countries with automatic GDPR classification
  - Indexed by GDPR status for fast filtering
  - Used by: processors, digital assets, international transfers

- **DataNature**: Classification system for personal data types
  - Name (e.g., "Health Data", "Financial Data", "Contact Information")
  - Type: 'special' or 'non-special' (Art. 9 distinction)
  - Description and examples
  - Pre-seeded with 28 standard nature types:
    - Special: Genetic, biometric, health, racial/ethnic origin, political opinions, religious beliefs, trade union membership, sex life/orientation, criminal history
    - Non-special: Contact info, financial data, employment data, education records, precise geolocation, online identifiers, browsing behavior, etc.
  - Links from: PersonalDataCategory
  - Enables automatic detection of special category data requirements

- **ProcessingAct**: Enumeration of data operations
  - Name (e.g., "Collection", "Storage", "Use", "Disclosure", "Deletion")
  - Description
  - Examples of when this act applies
  - Pre-seeded with standard processing operations
  - Links to: digital assets (what operations are performed)
  - Enables granular tracking of what happens to data

**Core Entities**:

- **ProcessingActivity**: Main container (Art. 30 register entry)
  - Name, purpose, description
  - Scale (small/medium/large/very large)
  - Status (draft/active/approved/archived)
  - Flags (automated decisions, profiling, special data, etc.)
  - **Flow Layout**: Visual graph representation with nodes and edges (JSON)
    - Enables React Flow visualization of data flows
    - Automatically updated when relationships change
    - Shows connections between subjects, data, processors, assets
  - **Used by tracking**: Maintains list of related component IDs
  - Links to: all other components via junction tables

- **PersonalDataCategory**: Types of personal data
  - Name (e.g., "CV", "Email address")
  - Type (gewoon/gevoelig/bijzonder/strafrechtelijk/identifier)
  - **Nature reference**: Links to DataNature for classification
  - Collection method and purpose
  - Examples
  - **Used by activities**: Array of activity IDs (bidirectional reference)
  - Links to: processors, assets, retention rules, necessity tests
- **DataProcessor** (Recipients): External parties
  - Name (e.g., "Recruitee B.V.")
  - Role (processor/subprocessor/joint-controller)
  - **Category**: Pre-defined categories with metadata (13 types)
    - Cloud Service Provider, Software Service Provider, Payment Processor, Marketing Platform, Analytics Provider, Customer Support Tool, HR Platform, Legal Service, Financial Institution, Government Authority, Regulatory Body, Business Partner, Other Third Party
    - Each category includes common examples and typical sharing reasons
  - **Country reference**: Links to Country model
  - **Structured address**: Embedded object (street, city, state, postal code)
  - International organization flag
  - DPA (Data Processing Agreement) with signed date, expiry date, status
  - **Onward Transfers**: Array of subsequent transfers
    - Each transfer includes: recipient name, country reference, address, transfer mechanism
    - Tracks secondary/subprocessor transfer chains
  - Contact details
  - Certifications
  - **Used by activities**: Array of activity IDs (bidirectional reference)
  - Links to: activities, data categories, security measures

- **DataAsset** (Digital Assets): Systems/databases where data lives
  - Name (e.g., "Recruitee Database", "HR File Server")
  - Type (database/file-storage/application/API/backup)
  - **Processing Locations**: Array of location objects (multi-country support)
    - Each location includes:
      - Country reference
      - Physical location description
      - Structured address
      - **Transfer mechanism** (per-location safeguard)
  - **Vendors**: Array of processor/recipient IDs
  - Technical details (hostname, IP, URL)
  - Security (encryption at rest/in transit, access controls)
  - **Used by activities**: Array of activity IDs (bidirectional reference)
  - Links to: activities, data categories, security measures, processing acts

- **DataSubjectCategory**: Whose data?
  - Name (e.g., "Employees", "Customers", "Candidates", "Suppliers")
  - Description
  - Estimated volume
  - Is vulnerable (children, patients, etc.)
  - **Used by activities**: Array of activity IDs (bidirectional reference)
  - Links to: activities, rights implementations

**Purpose**: Linking entities with context

- **Purpose**: Business purposes for processing
  - Name and description
  - **Used by activities**: Array of activity IDs (bidirectional reference)
  - Referenced in: all junction tables for contextual mapping

**Legal Components**:

- **LegalBasis**: Rechtsgrond (Art. 6)
  - Name and type (consent/contract/legal obligation/vital interest/public task/legitimate interest)
  - Justification text
  - For legitimate interest: full balancing test (purpose/necessity/balancing)
  - For consent: mechanism and withdrawal process
  - **Used by activities**: Array of activity IDs (bidirectional reference)
  - **Referential integrity**: Cannot be deleted if referenced by processing activities

- **RetentionRule**: Bewaartermijnen (managed via junction table)
  - Duration + unit (days/weeks/months/years)
  - Rationale and legal basis
  - **Start event**: Trigger when retention begins (e.g., "Contract end", "Last contact")
  - **End event**: Trigger for deletion (optional)
  - Deletion process description
  - Automatic deletion flag
  - Links to: data categories, data subjects, activities

- **TransferMechanism**: International transfer safeguards
  - **Standard mechanisms**:
    - Adequacy Decision (Art. 45)
    - Standard Contractual Clauses (SCCs)
    - Binding Corporate Rules (BCRs)
    - Code of Conduct with binding enforcement
    - Certification Mechanism
  - **Derogations** (Art. 49 - exceptional use only):
    - Explicit Consent
    - Contract Performance
    - Public Interest
    - Legal Claims
    - Vital Interests
    - Public Register
    - Legitimate Interests (rare, assessed case-by-case)
  - None (for EEA transfers)
  - Used by: processor locations, digital asset locations, onward transfers

**Risk Components**:

- **Risk**: Privacy/security risks
  - Title and description
  - Category (technical/organizational/legal/reputational)
  - Likelihood (laag/middel/hoog)
  - Impact (laag/middelgroot/groot)
  - Risk score (calculated or manual)
  - Source (auto-detected/manual/DPIA/audit)
  - Status (identified/under-review/mitigated/accepted)
  - Links to: activities, data categories, processors, assets, controls
- **Control**: Maatregelen (mitigations)
  - Title and description
  - Type (technical/organizational/juridical/physical)
  - Status (planned/in-progress/implemented/verified)
  - Implementation date, verification date
  - Responsible person
  - Effectiveness rating
  - Links to: risks

**Security Components**:

- **SecurityMeasure**: Beveiligingsmaatregelen
  - Name and description
  - Type (access control/encryption/pseudonymization/backup/incident response/etc.)
  - Implementation status
  - Links to: activities, processors, assets
- **Certification**: ISO 27001, SOC 2, etc.
  - Name, issued by, dates
  - Certificate number
  - Links to: processors, assets

**International Transfer Components**:

- **DataTransfer**: Flexible international transfer tracking
  - Name and description
  - **Type**: Discriminated union supporting three variants:
    - **Recipient-based**: Links to recipient/processor
    - **Digital Asset-based**: Links to digital asset + specific location + transfer mechanism
    - **Manual**: Free-text transfer details for one-off cases
  - Documentation and justification
  - Links to: activities, purposes

**Data Subject Rights**:

- **DataSubjectRightsImplementation**: How rights are fulfilled
  - Right (information/access/rectification/erasure/restriction/portability/object)
  - Implementation description
  - Limitations (if any)
  - Request process and response time
  - Links to: data subject categories

**Junction Tables** (Relationship tables with contextual metadata):
These tables link processing activities to components while capturing relationship-specific details:

- **ProcessingActivityDataSubject**: Links activities to data subject categories
  - Processing activity reference
  - Data subject category reference
  - **Associated purposes**: Array of purpose IDs that apply to this specific relationship
  - **Associated data categories**: Array of data category IDs involved
  - **Description**: Contextual justification or notes
  - **Composite index**: Unique on (activity + subject), indexed by activity, indexed by subject

- **ProcessingActivityLegalBasis**: Links activities to legal bases
  - Processing activity reference
  - Data subject category reference (legal basis can vary by subject)
  - Legal basis reference
  - **Associated purposes**: Which purposes this legal basis covers
  - **Associated data categories**: Which data categories this legal basis covers
  - **Description**: Specific justification text
  - **Indexed** for efficient validation queries

- **ProcessingActivityRetentionPeriod**: Links activities to retention periods
  - Processing activity reference
  - Data subject category reference (retention can vary by subject)
  - Retention period details (amount, unit, start event, end event)
  - **Associated purposes**: Which purposes require this retention
  - **Associated data categories**: Which data categories have this retention
  - **Description**: Rationale for this specific retention period
  - **Indexed** by activity + subject

- **ProcessingActivityRecipient**: Links activities to data processors/recipients
  - Processing activity reference
  - Data subject category reference
  - Recipient/processor reference
  - **Role**: Specific role in this context (may differ from recipient's default role)
  - **Associated purposes**: Why data is shared with this recipient
  - **Associated data categories**: What data is shared
  - **Description**: Contextual notes about this sharing relationship
  - **Indexed** by activity + subject

- **ProcessingActivityDigitalAsset**: Links activities to digital assets
  - Processing activity reference
  - Digital asset reference
  - **Processing act reference**: What operation is performed (collection/storage/use/etc.)
  - **Associated purposes**: Why this asset is used
  - **Associated data categories**: What data is in this asset
  - **Associated data subjects**: Whose data is in this asset
  - **Description**: How this asset is used in this activity

- **ProcessingActivityDataTransfer**: Links activities to international transfers
  - Processing activity reference
  - Data transfer reference
  - **Associated purposes**: Purpose of the transfer
  - Enables tracking which transfers apply to which activities

**Key Junction Table Pattern**:
Instead of simple many-to-many links, these tables capture:

1. **Granular purpose mapping**: Which purposes apply to this specific relationship
2. **Granular data category mapping**: Which data categories are involved
3. **Contextual descriptions**: Relationship-specific justifications
4. **Performance indexes**: Composite indexes for efficient queries and duplicate prevention

---

**Architectural Patterns**:

**Pattern 1: Bidirectional Reference Tracking**

- All reference models maintain `usedByActivityIds` arrays
- When an activity links to a component, the component's array is updated
- Enables reverse queries: "Which activities use this processor?" (instant lookup, no joins)
- Example: When Activity A links to Processor B → Processor B's `usedByActivityIds` includes A's ID
- Maintained through database transactions or application-level update logic
- Trade-off: Slight write overhead for massive read performance gains

**Pattern 2: Junction Tables with Context**

- Traditional many-to-many becomes many-to-many-to-many
- Activity ↔ DataSubject junction also includes related Purposes and DataCategories
- Enables questions like: "For Activity X and Subject Y, which purposes apply and what data is involved?"
- Supports granular GDPR compliance tracking (purpose limitation, data minimization)
- Each junction table is indexed for performance

**Pattern 3: Visual Flow Layout Integration**

- ProcessingActivity includes `flowLayout` JSON field
- Stores React Flow graph data (nodes array + edges array)
- Updated whenever relationships change through mutations
- Enables instant visualization without graph computation
- Persisted to database for consistent multi-user experience

**Pattern 4: Discriminated Union Types for Flexibility**

- DataTransfer uses `type` field with variant-specific data
- Type-safe handling of different transfer scenarios
- Example: Recipient transfer (just recipient ID) vs Asset transfer (asset + location + mechanism)
- Enables flexible modeling without creating excessive tables

**Pattern 5: Structured Address Objects**

- Addresses stored as embedded objects, not separate tables
- Reduces join complexity for common operations
- Structure: { street, city, state, postalCode }
- Used in: DataProcessor, Recipients, DigitalAsset locations, Onward transfers
- PostgreSQL JSONB enables querying within address fields if needed

**Pattern 6: Multi-Location Digital Assets**

- Digital assets can process data in multiple countries
- Each location has its own country, address, transfer mechanism
- Supports complex scenarios: "Data stored in Germany AND replicated to Ireland"
- Per-location transfer mechanisms handle different legal requirements

**Pattern 7: Onward Transfer Chains**

- Recipients can have array of subsequent transfers
- Tracks: Processor → Subprocessor → Sub-subprocessor
- Each hop includes transfer mechanism
- Enables compliance with subprocessor notification requirements

**Pattern 8: Referential Integrity Enforcement**

- Deletion validation: "Cannot delete LegalBasis if referenced by activities"
- Existence validation: "Data subject not found in this processing activity"
- Prevents orphaned references and maintains data consistency
- Implemented in application layer or database constraints

**Pattern 9: Validator-First Design**

- Zod schemas as single source of truth
- Runtime validation + TypeScript type inference
- Same schema used in: API validation, form validation, database validation
- Example:
  ```
  Define: dataProcessorSchema = z.object({...})
  Types: type DataProcessor = z.infer<typeof dataProcessorSchema>
  Validate: dataProcessorSchema.parse(input)
  ```

**Pattern 10: Seed Data for Reference Tables**

- Countries, DataNatures, ProcessingActs, RecipientCategories come pre-populated
- Consistent baseline across all installations
- Seed functions/migrations ensure data availability
- Updates can be deployed through migrations

---

**Indexing Strategy**:

Strategic indexes for common query patterns and performance optimization:

**Primary Indexes**:

1. **ProcessingActivity**:
   - Index on `name` (for search/autocomplete)
   - Composite index on `status + createdAt` (for dashboard filtering and sorting)
   - Index on `organizationId` (for multi-tenant queries)

2. **Country**:
   - Index on `gdprStatus` (for filtering by EU/EEA/Adequate/Third Country)
   - Enables: "Show all processors in Third Countries" (instant)

3. **DataCategory**:
   - Index on `natureId` (for filtering by data nature type)
   - Enables: "Show all special category data" (instant)

4. **DataProcessor / Recipient**:
   - Index on `category` (for filtering by recipient type)
   - Index on `countryId` (for location-based queries)
   - Index on `organizationId` (multi-tenant)

**Junction Table Indexes**:

5. **ProcessingActivityDataSubject**:
   - **Unique composite**: `(processingActivityId, dataSubjectId)` prevents duplicates
   - Index on `processingActivityId` (forward lookup: activity → subjects)
   - Index on `dataSubjectId` (reverse lookup: subject → activities)
   - Enables efficient bidirectional queries

6. **ProcessingActivityLegalBasis**:
   - **Unique composite**: `(processingActivityId, dataSubjectId, legalBasisId)`
   - Index on `processingActivityId`
   - Index on `legalBasisId` (reverse lookup)
   - Critical for validation: "Does this activity have valid legal basis?"

7. **ProcessingActivityRetentionPeriod**:
   - Composite index on `(processingActivityId, dataSubjectId)` (typically one retention per activity+subject)
   - Index on `processingActivityId`

8. **ProcessingActivityRecipient**:
   - **Unique composite**: `(processingActivityId, dataSubjectId, recipientId)` prevents duplicate sharing relationships
   - Index on `processingActivityId`
   - Index on `recipientId` (reverse: "which activities use this processor?")
   - Index on `dataSubjectId`

9. **ProcessingActivityDigitalAsset**:
   - Composite index on `(processingActivityId, digitalAssetId, processingActId)`
   - Index on `digitalAssetId` (reverse: "which activities use this asset?")
   - Index on `processingActId` (query: "all collection operations")

**Full-Text Search Indexes**:

10. **Search across names and descriptions**:
    - PostgreSQL `GIN` index on `tsvector` for full-text search
    - Applied to: ProcessingActivity.name, DataProcessor.name, descriptions
    - Enables: Fast search across all components

**Performance Considerations**:

- Indexes speed up reads but add overhead to writes
- Junction table indexes are critical (most queries involve relationships)
- Composite indexes prevent duplicates and optimize common join patterns
- Regular `ANALYZE` on PostgreSQL to keep statistics updated
- Monitor slow queries and add indexes as needed

**Index Maintenance**:

- Include index creation in migration scripts
- Add `@@index` annotations in Prisma schema
- Consider partial indexes for specific query patterns (e.g., only index active activities)

---

**Seed Data Requirements**:

Pre-populated reference data that should be included in every installation:

**1. Countries (250+ entries)**:

- All sovereign nations with ISO codes
- Automatic GDPR status classification:
  - **EU**: 27 member states (Germany, France, Netherlands, etc.)
  - **EEA**: EU + Iceland, Liechtenstein, Norway
  - **EFTA**: Switzerland (special case)
  - **Adequate**: Countries with adequacy decisions (UK, Canada, Japan, South Korea, etc.)
  - **Third Country**: All others (US, China, India, etc. - require safeguards)
- Some countries have multiple statuses: UK is both "Third Country" AND "Adequate"
- Seed script should handle updates when new adequacy decisions are granted

**2. Data Natures (28 predefined types)**:

**Special Category Data (Art. 9 GDPR)**:

- Genetic Data
- Biometric Data (for identification)
- Health Data
- Racial or Ethnic Origin
- Political Opinions
- Religious or Philosophical Beliefs
- Trade Union Membership
- Sex Life or Sexual Orientation
- Criminal History / Offences

**Non-Special Category Data**:

- Contact Information (name, email, phone, address)
- Financial Data (bank accounts, payment info)
- Employment Data (job title, salary, performance)
- Education Records (degrees, transcripts)
- Precise Geolocation Data
- Online Identifiers (IP addresses, cookie IDs, device IDs)
- Browsing Behavior (page views, clicks)
- Purchase History
- Social Media Profile Data
- Communication Records (emails, messages)
- Identification Documents (passport, driver's license)
- Photos and Videos (non-biometric)
- Voice Recordings (non-biometric)
- Date of Birth / Age
- Nationality / Citizenship
- Physical Characteristics (height, weight - non-genetic)
- Family Information (marital status, dependents)
- Vehicle Information
- Professional Qualifications

Each nature includes:

- Type classification (special/non-special)
- Description
- Common examples
- Default recommended retention periods (optional guidance)

**3. Recipient Categories (13 types with metadata)**:

Each category includes name, description, common examples, typical reasons for sharing:

- **Cloud Service Provider**: AWS, Azure, Google Cloud | Infrastructure hosting, data storage
- **Software Service Provider**: Salesforce, HubSpot, Slack | Business operations, communication
- **Payment Processor**: Stripe, Adyen, Mollie | Payment processing, transaction handling
- **Marketing Platform**: Mailchimp, SendGrid, ActiveCampaign | Email campaigns, marketing automation
- **Analytics Provider**: Google Analytics, Mixpanel, Amplitude | Usage analysis, product optimization
- **Customer Support Tool**: Zendesk, Intercom, Freshdesk | Support ticket management, customer service
- **HR Platform**: Personio, BambooHR, Workday | HR management, payroll, recruitment
- **Legal Service**: Law firms, notaries, compliance consultants | Legal advice, contract review
- **Financial Institution**: Banks, accountants, auditors | Banking, accounting, audit
- **Government Authority**: Tax office, labor inspectorate, regulator | Legal obligations, reporting
- **Regulatory Body**: Privacy authority (AP), sector regulator | Compliance, investigation
- **Business Partner**: Joint ventures, strategic partners | Collaboration, joint processing
- **Other Third Party**: Any recipient not fitting above categories

**4. Transfer Mechanisms (13 types)**:

**Standard Mechanisms**:

- Adequacy Decision (Art. 45) | EU Commission decision that country has adequate protection
- Standard Contractual Clauses (SCCs) | EU-approved contract templates
- Binding Corporate Rules (BCRs) | Internal group policies approved by DPA
- Code of Conduct (Art. 40) | Industry code with binding enforcement
- Certification Mechanism (Art. 42) | Certified data protection scheme

**Derogations (Art. 49 - use sparingly)**:

- Explicit Consent | Data subject explicitly consents to transfer with risks informed
- Contract Performance | Transfer necessary for contract with data subject
- Public Interest | Transfer for important public interest reasons
- Legal Claims | Transfer for establishment, exercise, or defense of legal claims
- Vital Interests | Transfer to protect vital interests when consent cannot be obtained
- Public Register | Transfer from public register (limited scope)
- Legitimate Interests | Compelling legitimate interests (rare, requires assessment)

**Other**:

- None | For transfers within EEA (no safeguard needed)

**5. Processing Acts (Standard operations)**:

- **Collection**: Gathering personal data from data subjects or third parties
- **Recording**: Initial storage or documentation of personal data
- **Organization**: Structuring or arranging personal data
- **Structuring**: Organizing data into databases or filing systems
- **Storage**: Keeping personal data in any format for future retrieval
- **Adaptation**: Modifying personal data (e.g., format conversion)
- **Alteration**: Changing content of personal data
- **Retrieval**: Accessing stored personal data
- **Consultation**: Viewing or reading personal data
- **Use**: Applying personal data for a purpose (e.g., decision-making)
- **Disclosure**: Making personal data available to recipients
- **Dissemination**: Wide distribution of personal data
- **Alignment**: Combining personal data from different sources
- **Combination**: Merging datasets
- **Restriction**: Limiting further processing of personal data
- **Erasure**: Permanent deletion of personal data
- **Destruction**: Physical or technical destruction of data carriers

Each includes description and examples of when it applies.

**Seed Implementation**:

Create Prisma seed script (`prisma/seed.ts`):

```
async function main() {
  console.log('Seeding countries...');
  await seedCountries();

  console.log('Seeding data natures...');
  await seedDataNatures();

  console.log('Seeding recipient categories...');
  await seedRecipientCategories();

  console.log('Seeding transfer mechanisms...');
  await seedTransferMechanisms();

  console.log('Seeding processing acts...');
  await seedProcessingActs();

  console.log('Seed complete!');
}
```

**When to Run**:

- Fresh database setup (development, staging, production)
- Test environment initialization
- After schema migrations (idempotent - only insert if not exists)
- Can be re-run safely (upsert logic)

**Maintenance**:

- Update countries seed when new adequacy decisions granted
- Add data natures if new categories emerge
- Recipient categories should remain stable
- Transfer mechanisms change rarely (only with new GDPR guidance)

---

**UI Features**:

- Database views (Notion/Airtable style tables)
- Kanban boards for workflows
- Component detail pages with full relationship view
- Graph visualization (React Flow) showing component connections
- Search and filtering across all components
- Bulk operations
- Import from CSV/Excel
- Component templates (e.g., "Standard recruitment processor set")

**Validation Engine**:
Built-in compliance rules that validate as you work:

- "Processor requires valid DPA" (error if missing/expired)
- "Bijzondere data requires explicit legal basis" (error if only legitimate interest)
- "Third country transfer requires safeguards" (error if none specified)
- "Large-scale processing requires DPIA" (warning if missing)
- "Retention period requires justification" (warning if empty)
- Visual indicators: ✅ complete, ⚠️ warning, ❌ error

---

#### Feature 2: Guided Questionnaires

**Purpose**: Gather compliance information in business-friendly language

**Questionnaire Types**:

**A. Discovery Questionnaires** (High-level, 15-20 minutes)
Target: Project managers, business stakeholders

Example: "Project Intake Questionnaire"

- Project basics (name, purpose, launch date)
- Who is involved? (employees/customers/candidates/suppliers)
- Volume estimate (under 100 / 100-1000 / 1000-10000 / over 10000)
- What data? (checklist with smart warnings)
  - Basic: name, email, phone, address
  - Professional: CV, work history, education
  - ⚠️ Special: health, ethnicity, criminal records (flags for review)
  - ⚠️ Identifiers: BSN, passport number (requires justification)
- External systems? (dynamic list)
  - For each: name, purpose, location, contract status
  - Smart suggestions from existing processors
- Automated decisions? (yes/no with follow-up)
- Profiling? (yes/no with follow-up)

Output: Creates ProcessingActivity with linked components

**B. Deep-Dive Questionnaires** (Detailed, 30-60 minutes)
Target: Data stewards, subject matter experts

Example: "Data Field Necessity Assessment"
For each data category:

- Why do you need it? (collection purpose)
- How will it be used? (checklist: identity verification/contact/decisions/analysis/etc.)
- Could you achieve your goal without it? (necessity test)
- What alternatives did you consider? (subsidiariy)
- Why is this proportional? (proportionality justification)
- How long will you keep it? (retention period + unit)
- Why that long? (retention rationale)
- How will it be deleted? (deletion process)

Output: Creates/updates PersonalDataCategory with NecessityTest and RetentionRule

Example: "Processor Details Questionnaire"
For each processor:

- Full contact information
- Exact location (country, city, address)
- What data do they process? (select from activity's data categories)
- What do they do with it? (purpose description)
- Do you have a DPA? (if yes: upload, signed date, expiry date)
- Do they use subprocessors? (if yes: list them)
- What security measures do they have? (checklist)
- Certifications? (ISO 27001, SOC 2, etc.)

Output: Creates/updates DataProcessor with full details

**C. Risk Assessment Questionnaires**
Target: Privacy officers, risk managers

- Review auto-detected risks
- Add manual risks
- For each risk: likelihood, impact, affected components
- Identify controls
- Assess residual risk

**Question Types Supported**:

- Text (short answer)
- Textarea (long answer)
- Choice (radio buttons)
- Multi-choice (checkboxes)
- Yes/No (boolean)
- Date picker
- Number input
- Dynamic list (add multiple items with sub-fields)
- Compound (multiple fields grouped together)
- File upload

**Smart Features**:

1. **Conditional Logic**:

```
Q: Do you collect special category data?
A: Yes
  ↓ (triggers follow-up)
Q: Please explain why this is absolutely necessary.
A: [Required text field]
```

2. **Auto-Risk Detection**:
   Based on answers, system automatically flags:

- Scale > 10,000 → High risk (large-scale processing)
- Special data selected → High risk (bijzondere gegevens)
- Automated decisions = Yes → Medium risk (Art. 22 implications)
- Third country processor → High risk (international transfer)
  Creates Risk entries automatically

3. **Smart Suggestions**:

```
User types: "Recru..."
System suggests:
  → Recruitee B.V. (existing processor)
     Pre-fill: EER location, has DPA, etc.
  → Create new processor
```

4. **Progress Tracking**:

- Section completion: 3 of 5 complete
- Overall: 60% complete
- Missing required fields highlighted
- Estimated time remaining

5. **Multi-Stakeholder Assignment**:

```
Section 1: Project basics → Project manager
Section 2: Data needs → HR manager
Section 3: Systems → IT admin
Section 4: Legal review → Privacy officer
Section 5: Approval → Management
```

Each person gets email, sees only their section

6. **Context-Aware Help**:
   When special data selected:

```
⚠️ Let op: Bijzondere persoonsgegevens

Je hebt gezondheidsinformatie geselecteerd.

Dit betekent:
1. Je hebt een expliciete rechtsgrondslag nodig (Art. 9)
2. DPIA is verplicht
3. Extra beveiligingsmaatregelen vereist
4. Mogelijk AP-consultatie nodig

Weet je zeker dat dit noodzakelijk is?

[Meer uitleg] [Deselecteren] [Ga door]
```

**Technical Implementation**:

- Questionnaires stored as JSON in QuestionnaireTemplate model
- Responses stored in QuestionnaireResponse model
- Mapping engine translates answers → component fields
- Version control (template version captured with each response)
- History tracking (who answered what when)

---

#### Feature 3: Document Generation Engine

**Purpose**: Auto-generate professional compliance documents from components

**Document Templates**:

**A. DPIA (Data Protection Impact Assessment)**

Structure:

```
├─ Versiebeheer (version table)
├─ Management Samenvatting (human-written, with variable injection)
├─ Blok A: Verwerkingen
│  ├─ 3.1 Achtergrond (human-written)
│  ├─ 3.2 Persoonsgegevens (AUTO: table from components)
│  ├─ 3.3 Betrokken partijen (AUTO: processor table)
│  ├─ 3.4 Verwerkingslocaties (AUTO: location table)
│  ├─ 3.5 Technieken (AUTO: from data assets)
│  ├─ 3.6 Juridisch kader (AUTO: from legal bases)
│  └─ 3.7 Bewaartermijnen (AUTO: retention table)
├─ Blok B: Rechtmatigheid
│  ├─ 4.1 Rechtsgrond (AUTO: from legal basis)
│  ├─ 4.2 Bijzondere persoonsgegevens (AUTO: detection + justification)
│  ├─ 4.3 Doelbinding (template + data)
│  ├─ 4.4 Noodzaak en evenredigheid (AUTO: from necessity tests)
│  └─ 4.5 Rechten betrokkenen (AUTO: from rights implementation)
├─ Blok C: Risico's
│  ├─ 5.1 Risico's identificeren (AUTO: from risks)
│  └─ 5.2 Risico's inschatten (AUTO: risk matrix with override capability)
├─ Blok D: Maatregelen
│  └─ 6.1 Maatregelen & restrisico (AUTO: controls + residual risk)
├─ Goedkeuring & ondertekening (form fields)
├─ Bijlage 1: Advies FG (human-written or template)
├─ Bijlage 2: Toets gerechtvaardigd belang (AUTO: from LegitimateInterestAssessment)
└─ Bijlage 3: [Custom bijlagen as needed]
```

**Section Types**:

1. **Fully Auto-Generated** (Read-only)

```prisma
section: {
  type: 'auto-generated',
  query: `
    SELECT p.name, p.role, p.location, p.dpa_status
    FROM processors p
    WHERE p.activity_id = :activityId
  `,
  template: `
    | Organisatie | Rol | Land | DPA Status |
    {{#each processors}}
    | {{name}} | {{role}} | {{location}} | {{dpaStatus}} |
    {{/each}}
  `
}
```

Cannot be edited in document view. Change components → regenerate.

2. **Template + Overrides** (Semi-editable)

```typescript
section: {
  type: 'template-with-overrides',
  baseData: risksFromDatabase,
  allowOverrides: ['likelihood', 'impact'],
  template: riskMatrixTemplate
}
```

Shows calculated values, user can override specific cells.
System tracks: base value vs. override value vs. final value.

3. **Free Text** (Fully editable)

```typescript
section: {
  type: 'rich-text',
  content: `
    Deze DPIA betreft het {{activity.name}} proces...

    De belangrijkste risico's zijn:
    {{#topRisks limit=3}}
    - {{description}} ({{riskScore}})
    {{/topRisks}}
  `,
  variables: {
    activity: linkedActivity,
    topRisks: () => activity.risks.sort(by: 'score')
  }
}
```

Human writes text, variables auto-update from components.

4. **Data Flow Diagrams** (Auto-generated visualization)

```typescript
generateDataFlowDiagram(activity) {
  return mermaid`
    flowchart LR
      DataSubject[Kandidaat] -->|CV + Contact| Website[Bol.com Website]
      Website -->|API| Recruitee[Recruitee DB]
      Recruitee -->|Export| AFAS[AFAS HR]
      LinkedIn[LinkedIn] -->|InMail| DataSubject
  `;
}
```

**Export Formats**:

- **Word (.docx)**: Professional formatting, editable
  - Uses Docxtemplater library
  - Preserves styles, headers, footers
  - Table of contents auto-generated
  - Track changes supported
- **PDF**: Final, signed versions
  - Uses Puppeteer + Headless Chrome
  - Perfect rendering
  - Digital signatures supported
- **Markdown**: Internal version control
  - Git-friendly
  - Easy diffs
  - Convert to any format with Pandoc

**Document Metadata**:

- Version number (auto-increment)
- Generated date and by whom
- Source components (audit trail)
- Approval status and signatures
- Next review date

---

**B. RoPA (Register of Processing Activities - Art. 30)**

Much simpler than DPIA:

```
For each ProcessingActivity:
├─ Name and description
├─ Purpose
├─ Categories of data subjects
├─ Categories of personal data
├─ Categories of recipients (processors)
├─ International transfers
├─ Retention periods
├─ Security measures
└─ Last updated
```

Generated as:

- Spreadsheet (Excel/CSV) for easy sorting
- Word table for official version
- Web dashboard for live view

**C. Data Processing Agreement (DPA/Verwerkersovereenkomst)**

Template-based with variable injection:

```
VERWERKERSOVEREENKOMST

Partijen:
1. {{organization.name}} (Verwerkingsverantwoordelijke)
2. {{processor.name}} (Verwerker)

Artikel 1: Definities
...

Artikel 4: Verwerkingsdoeleinden
De Verwerker verwerkt Persoonsgegevens uitsluitend voor:
{{#each activity.purposes}}
- {{this}}
{{/each}}

Artikel 5: Categorieën Persoonsgegevens
{{#each dataCategories}}
- {{name}} ({{type}})
{{/each}}

Artikel 6: Bewaartermijnen
{{#each retentionRules}}
- {{dataCategory}}: {{duration}} {{unit}} ({{rationale}})
{{/each}}

...
```

**D. Privacy Statement (Privacyverklaring)**

Public-facing, generated from all processing activities:

```
Wij verwerken de volgende persoonsgegevens:

{{#each activities}}
Voor {{name}}:
- Persoonsgegevens: {{dataCategories.join(', ')}}
- Doel: {{purpose}}
- Rechtsgrond: {{legalBasis.type}}
- Bewaartermijn: {{retentionPeriod}}
- Delen met: {{processors.join(', ')}}
{{/each}}

Uw rechten:
...
```

---

#### Feature 4: Validation & Compliance Engine

**Real-time Validation Rules**:

Implemented as TypeScript functions that run on:

- Component save
- Questionnaire completion
- Document generation
- On-demand

Example rules:

```typescript
rules = {
  'processor-requires-dpa': {
    level: 'error',
    check: (processor) => {
      if (!processor.dpa) return false
      if (processor.dpa.expiryDate < new Date()) return false
      return processor.dpa.status === 'ACTIVE'
    },
    message: 'Verwerker {{processor.name}} heeft geen geldige DPA',
    fix: { action: 'upload-dpa', processorId: processor.id },
  },

  'special-data-legal-basis': {
    level: 'error',
    check: (activity) => {
      const hasSpecialData = activity.dataCategories.some((dc) => dc.type === 'BIJZONDER')

      if (!hasSpecialData) return true

      const validBases = ['CONSENT', 'LEGAL_OBLIGATION', 'VITAL_INTEREST']
      return activity.legalBases.some(
        (lb) => validBases.includes(lb.type) && lb.appliesToSpecialData
      )
    },
    message: 'Bijzondere persoonsgegevens vereisen expliciete rechtsgrondslag',
  },

  'third-country-safeguards': {
    level: 'error',
    check: (processor) => {
      if (processor.location.region !== 'THIRD_COUNTRY') return true
      return processor.internationalTransfers.length > 0
    },
    message: 'Doorgifte naar {{processor.location.country}} vereist waarborgen',
  },

  'dpia-required': {
    level: 'warning',
    check: (activity) => {
      const riskFactors = [
        activity.involvesSpecialData,
        activity.scale === 'VERY_LARGE',
        activity.involvesAutomatedDecisionMaking,
        activity.involvesSystematicMonitoring,
        activity.involvesVulnerablePersons,
      ].filter(Boolean).length

      if (riskFactors >= 2) {
        return activity.dpia !== null
      }
      return true
    },
    message: 'Deze verwerking vereist waarschijnlijk een DPIA',
  },
}
```

**Validation UI**:

```
┌─────────────────────────────────────────────┐
│ Processing Activity: Recruitment            │
│ Status: Draft                               │
│                                             │
│ Compliance Score: 65/100  ⚠️                │
│                                             │
│ ❌ 2 Errors (must fix before approval)      │
│ • Recruitee: DPA expired 2024-12-01         │
│ • LinkedIn: Missing international transfer  │
│   safeguards                                │
│                                             │
│ ⚠️  3 Warnings (recommended)                │
│ • DPIA recommended for this activity        │
│ • Retention period missing justification    │
│ • No security measures documented           │
│                                             │
│ ✓ 12 Checks Passed                         │
│                                             │
│ [Fix Errors] [Review Warnings]             │
└─────────────────────────────────────────────┘
```

---

### Beta Phase (Months 4-6): Collaboration & Intelligence

#### Feature 5: Bidirectional Document Sync

**Purpose**: Legal team edits in Word, changes flow back to components

**How it works**:

1. **Document Download**:

```typescript
const docx = await generateDPIA(activityId)
// Includes metadata in document properties:
// - Activity ID
// - Component IDs for each section
// - Generation timestamp
// - Version
```

2. **User Edits Document**:
   Legal team opens in Word, makes changes:

- Adds row to processor table: "Google Workspace | Verwerker | EER"
- Changes risk likelihood: Middel → Laag
- Edits management summary text

3. **Re-upload Detection**:

```typescript
const changes = detectChanges(originalDoc, editedDoc)

// Detected:
changes = [
  {
    section: '3.3',
    type: 'table-row-added',
    data: { name: 'Google Workspace', role: 'PROCESSOR', location: 'EER' },
  },
  {
    section: '5.2',
    type: 'cell-edited',
    riskId: 'R1',
    field: 'likelihood',
    oldValue: 'middel',
    newValue: 'laag',
  },
  {
    section: '2.0',
    type: 'text-edited',
    // Free text section - just save
  },
]
```

4. **User Review Dialog**:

```
┌────────────────────────────────────────────┐
│ Changes Detected in DPIA Document          │
├────────────────────────────────────────────┤
│                                            │
│ ✏️ Section 3.3: New processor added        │
│ • Google Workspace (EER)                   │
│                                            │
│ What would you like to do?                │
│ ○ Create processor in component library   │
│ ○ Keep as document-only override          │
│ ○ Discard this change                     │
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ ✏️ Section 5.2: Risk assessment changed    │
│ Risk: "Te veel gegevens verzameld"        │
│ • Likelihood: Middel → Laag                │
│ • User reason: "After implementing auto    │
│   deletion"                                │
│                                            │
│ Update risk component?                     │
│ ○ Yes - update Risk R1                    │
│ ○ Keep as document override               │
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ ✅ Section 2.0: Management summary         │
│ Text changes saved automatically           │
│                                            │
│ [Apply Changes] [Review More]             │
└────────────────────────────────────────────┘
```

5. **Component Updates**:

```typescript
if (userApproves) {
  // Create new processor
  await createDataProcessor({
    name: 'Google Workspace',
    role: 'PROCESSOR',
    location: { region: 'EER' },
    activityId: activityId,
  })

  // Update risk
  await updateRisk('R1', {
    likelihood: 'LAAG',
    notes: 'Updated from DPIA: After implementing auto deletion',
  })

  // Recalculate risk score
  await recalculateRiskScore('R1')

  // Regenerate affected documents
  await regenerateDocument(activityId, 'ROPA')

  // Notify affected users
  await notifyUsers({
    message: 'Components updated from DPIA edit',
    affectedDocs: ['RoPA', 'Privacy Statement'],
  })
}
```

**Conflict Resolution**:

```
If component changed since document generated:
┌────────────────────────────────────────────┐
│ ⚠️ Conflict Detected                        │
│                                            │
│ You changed: Risk R1 likelihood → Laag    │
│ But: Frank updated it → Middel yesterday   │
│                                            │
│ Which version should we keep?              │
│ ○ Your version (Laag)                     │
│ ○ Frank's version (Middel)                │
│ ○ Keep both as separate scenarios         │
│                                            │
│ [Show Full History]                        │
└────────────────────────────────────────────┘
```

---

#### Feature 6: Collaboration & Workflows

**Multi-user Features**:

**A. Comments & Discussions**:

```
On any component or document section:

┌────────────────────────────────────────────┐
│ DataProcessor: Recruitee B.V.              │
│                                            │
│ 💬 3 Comments                              │
│                                            │
│ Frank (2 days ago):                        │
│ "DPA expires in 2 months - has procurement │
│  started renewal process?"                 │
│                                            │
│ Marieke (1 day ago):                       │
│ "Yes, in progress. New DPA expected by     │
│  Nov 15."                                  │
│                                            │
│ [Add comment...]                           │
└────────────────────────────────────────────┘
```

**B. Approval Workflows**:

```typescript
workflow: {
  steps: [
    { role: 'PRIVACY_OFFICER', action: 'review', status: 'pending' },
    { role: 'LEGAL', action: 'approve', status: 'waiting' },
    { role: 'DPO', action: 'sign', status: 'waiting' },
    { role: 'MANAGEMENT', action: 'final-approval', status: 'waiting' },
  ]
}
```

UI shows:

```
DPIA Approval Progress:
✅ Prepared by Frank (Oct 1)
✅ Reviewed by Legal (Oct 5)
⏳ Awaiting DPO signature
⏳ Awaiting management approval
```

**C. Notifications**:

- Email/in-app notifications
- "You've been assigned questionnaire section"
- "Component you're watching was updated"
- "DPA expiring in 30 days"
- "DPIA review due next month"
- "Someone commented on your risk"

**D. Activity Feed**:

```
Recent Activity:

Today, 14:32
Frank updated Risk "Te veel gegevens verzameld"
→ Changed likelihood: Middel → Laag

Today, 11:15
Marieke added DataProcessor "Microsoft Teams"
→ Linked to activity "Recruitment"

Yesterday, 16:20
System generated DPIA v1.2
→ For activity "Recruitment"

Yesterday, 09:05
Linda completed Questionnaire "Processor Details"
→ Created 3 new processors
```

---

#### Feature 7: Smart Suggestions & Learning

**A. Component Reuse Intelligence**:

When starting new activity:

```
┌────────────────────────────────────────────┐
│ New Processing Activity                    │
│                                            │
│ Name: Customer Support Ticketing           │
│                                            │
│ 💡 Suggestions based on similar projects: │
│                                            │
│ Projects in "Customer Service" department  │
│ commonly use:                              │
│                                            │
│ ☑ Zendesk (used in 3 projects)            │
│ ☑ Google Workspace (used in 5 projects)   │
│ ☐ Salesforce (used in 2 projects)         │
│                                            │
│ Add these? [Yes] [Review individually]    │
└────────────────────────────────────────────┘
```

**B. Pre-fill from Past Projects**:

```
You created "Recruitment 2024" last year.

Want to copy as starting point?
✓ Same processors
✓ Same data categories
✓ Similar retention periods
✗ Different risks (will need review)

[Copy from 2024] [Start fresh]
```

**C. Duplicate Detection**:

```
⚠️ You're adding "Recruitee B.V."

This looks similar to:
→ "Recruitee" (added Oct 2024)
  Location: EER
  DPA expires: 2026-12-31

Are these the same?
[Yes - use existing] [No - create new]
```

**D. Completion Suggestions**:

```
Activity "Recruitment" is 60% complete.

To reach 100%:
☐ Add retention periods (3 data categories missing)
☐ Complete processor DPA for LinkedIn
☐ Add at least 1 security measure
☐ Review auto-detected risks (4 pending)

Estimated time: 15 minutes
[Complete now] [Remind me later]
```

---

### Scale Phase (Months 7-12): Integrations & Enterprise

#### Feature 8: Microsoft Word Plugin

**Purpose**: Edit documents with live component sync, without leaving Word

**Features**:

- **Component Panel**: Sidebar showing linked components
- **Inline Warnings**: Highlight missing required fields
- **Quick Actions**: "Add processor", "Link risk", etc.
- **Live Sync**: Changes save to cloud in real-time
- **Offline Mode**: Work offline, sync when online

**Architecture**:

```
Word Add-in (Office.js)
    ↓ REST API
Compilo Backend
    ↓
Component Database
```

---

#### Feature 9: API & Integrations

**REST API / GraphQL**:

```graphql
query GetActivity {
  processingActivity(id: "xyz") {
    name
    processors {
      name
      dpa {
        status
        expiryDate
      }
    }
    risks {
      title
      riskScore
      controls {
        status
      }
    }
  }
}

mutation UpdateProcessor {
  updateDataProcessor(id: "abc", data: { dpaStatus: EXPIRED }) {
    id
    affectedDocuments {
      id
      name
    }
  }
}
```

**Webhooks**:

```typescript
// Notify external systems
webhooks: [
  {
    event: 'dpa.expiring',
    url: 'https://procurement.[company-name].nl/api/dpa-alert',
    payload: { processor, dpa, daysUntilExpiry },
  },
  {
    event: 'dpia.approved',
    url: 'https://grc-tool.[company-name].nl/api/dpia-update',
    payload: { activity, dpia, approvedBy, approvedDate },
  },
]
```

**Integration Connectors**:

- **HR Systems**: Sync employee processing activities
- **CRM**: Import customer processing
- **ISMS Tools**: Export risks to ISO 27001 tool
- **GRC Platforms**: Bidirectional sync with OneTrust/TrustArc
- **Procurement**: DPA expiry alerts

---

#### Feature 10: Advanced Analytics Dashboard

**Purpose**: Executive overview of compliance posture

**Dashboards**:

**Compliance Health Overview**:

```
Overall Compliance Score: 78/100  ⚠️

By Status:
██████████░░░░░░░░░░ Active: 15 activities
░░░░░░░░░░░░░░░░░░░░ Draft: 3 activities
░░░░░░░░░░░░░░░░░░░░ Needs Review: 2 activities

By Risk:
❌ High Risk: 2 activities (DPIA required)
⚠️  Medium Risk: 8 activities
✅ Low Risk: 10 activities

Upcoming:
⚠️ 3 DPAs expiring in next 90 days
⚠️ 5 DPIAs due for annual review
```

**Processor Inventory**:

```
15 Active Processors

By Region:
██████░░░░ EER: 12
███░░░░░░░ Adequate: 2
█░░░░░░░░░ Third Country: 1 (SCCs in place)

DPA Status:
✅ Valid: 13
⚠️  Expires < 90 days: 2
❌ Expired: 0

Most Used:
1. Microsoft 365 (used in 12 activities)
2. Google Workspace (used in 8 activities)
3. Salesforce (used in 5 activities)
```

**Data Categories Heatmap**:

```
Which data is processed where?

                  Act1  Act2  Act3  Act4
Name              ✓     ✓     ✓     ✓
Email             ✓     ✓     ✓
Phone             ✓           ✓
CV                ✓
Health Data             ⚠️
Financial                     ✓     ✓
```

**Risk Heatmap**:

```
     Impact →
   │ L    M    H    VH
L  │ 2    1    0    0
i  │
k  │ 1    4    2    0
e  │
l  │ 0    2    3    1  ← Attention needed
i  │
h  │ 0    0    0    0
o  │
o  ↓
d
```

**Trend Analysis**:

```
Processing Activities Over Time

20 │                         ╱─
   │                    ╱───╯
15 │               ╱───╯
   │          ╱───╯
10 │     ╱───╯
   │╱───╯
 5 │
   │
 0 └──────────────────────────
   Jan  Feb  Mar  Apr  May  Jun
```

---

## 3. Target Users & Use Cases

### Primary Personas

#### Persona 1: Frank (Privacy Officer / DPO)

**Demographics**:

- Role: Privacy Jurist at a Dutch company
- Experience: 8+ years in GDPR compliance
- Technical: Moderate (understands databases, not a developer)
- Org size: 100-500 employees
- Industry: Semi-public sector

**Pain Points**:

- "I maintain the same processor list in 15 different DPIAs"
- "When a DPA expires, I have to manually update all documents"
- "I can't quickly answer 'which activities use LinkedIn?'"
- "Creating a DPIA from scratch takes 2 weeks"
- "Annual reviews are a nightmare - hunting down info in Word docs"
- "Business stakeholders don't understand compliance jargon"

**Use Cases**:

1. **New Project Intake**:
   - Project manager fills 15-min questionnaire
   - Frank reviews → adds legal detail → generates DPIA
   - Time: 2 hours instead of 2 weeks
2. **Processor DPA Renewal**:
   - System alerts: "Recruitee DPA expires in 60 days"
   - Frank uploads new DPA
   - All 5 DPIAs using Recruitee auto-update
3. **Annual DPIA Review**:
   - System shows: "What changed since last year?"
   - Frank answers 5 delta questions
   - Updated DPIA generated in 10 minutes
4. **Ad-hoc Queries**:
   - Board asks: "Do we process health data?"
   - Frank searches components → instant answer with details
5. **Audit Preparation**:
   - Regulator coming next week
   - Export complete RoPA, all DPIAs, DPA overview
   - Everything consistent, up-to-date, audit-ready

**Success Metrics**:

- DPIA creation time: 2 weeks → 2 hours
- Component reuse: 0% → 70%
- Audit prep time: 2 weeks → 1 day
- Confidence in consistency: Low → High

---

#### Persona 2: Marieke (Legal Counsel)

**Demographics**:

- Role: Senior Legal Counsel
- Experience: 15+ years in law, 3 years in privacy
- Technical: Low (Word/Excel expert, not technical)
- Focus: Contract review, risk assessment, stakeholder communication

**Pain Points**:

- "Privacy sends me unstructured information to review"
- "I prefer reviewing actual Word documents, not web forms"
- "Hard to see what changed between DPIA versions"
- "Quality of compliance docs varies wildly"
- "Can't add my legal comments inline"

**Use Cases**:

1. **DPIA Review**:
   - Frank generates DPIA, sends Word doc
   - Marieke reviews in familiar format
   - Adds comments: "Strengthen justification here"
   - Approves with tracked changes
2. **Contract Negotiation**:
   - Reviewing new processor DPA
   - Wants to see: "What data will they access?"
   - Opens component view → sees exactly which data categories
3. **Risk Assessment**:
   - Business wants to add health data
   - Marieke reviews risk matrix
   - Adjusts likelihood based on legal judgment
   - Changes flow back to system
4. **Stakeholder Communication**:
   - Management asks: "Are we compliant?"
   - Marieke exports executive summary
   - Professional document with metrics

**Success Metrics**:

- Review time per DPIA: 3 days → 4 hours
- Comments captured: Manual → Structured
- Document quality: Variable → Consistent
- Can work in preferred tool (Word): Yes

---

#### Persona 3: Tom (Project Manager / Business Stakeholder)

**Demographics**:

- Role: Project Manager, Marketing Department
- Experience: 10 years in marketing, new to privacy
- Technical: Moderate (uses SaaS tools daily)
- Compliance knowledge: Low

**Pain Points**:

- "Privacy requirements block my projects for weeks"
- "I don't understand legal jargon in forms"
- "I just want to launch my campaign, not become a privacy expert"
- "Can't see progress on privacy approval"

**Use Cases**:

1. **New Campaign Launch**:
   - Tom wants to use new email marketing tool (Mailchimp)
   - Fills 15-minute questionnaire in plain language:
     - "We'll collect: name, email, company name"
     - "Purpose: Send newsletter about products"
     - "Store data: 2 years or until unsubscribe"
   - System creates components, flags for privacy review
   - Frank reviews (15 min), approves
   - Tom gets green light next day instead of 3 weeks
2. **Adding New System**:
   - Tom wants to add HubSpot to existing activity
   - Fills "Processor Details" questionnaire
   - System recognizes: "HubSpot already used in Sales"
   - One-click: "Copy HubSpot details from Sales?"
   - Done in 5 minutes
3. **Progress Tracking**:
   - Tom sees dashboard:
     ```
     Campaign Privacy Review: 60% complete
     ✅ Basic info
     ✅ Data categories
     ⏳ Awaiting privacy officer review
     ⏳ Awaiting legal approval
     ```
   - Transparency → no more "black box"

**Success Metrics**:

- Time to compliance approval: 3 weeks → 2 days
- Understanding of process: Low → High
- Frustration level: High → Low
- Self-service capability: 0% → 80%

---

### Secondary Personas

#### Persona 4: IT Administrator

**Use Cases**:

- Maintain DataAsset inventory (systems/databases)
- Track which systems store which data
- Security measure documentation
- Integration with ISMS tools

#### Persona 5: Compliance Consultant

**Use Cases**:

- Manage multiple client organizations (multi-tenant)
- White-label branding
- Standardized methodology across clients
- Professional deliverables

---

### Organization Profiles

**Sweet Spot: Mid-Market Organizations**

**Size**: 50-500 employees

- Complex enough for structured approach
- Not big enough for enterprise tools (€50k+/year)
- Usually 1-3 people handling privacy

**Characteristics**:

- GDPR compliance required
- Multiple processing activities (5-30)
- Various processors (10-50)
- Mix of internal and external stakeholders
- Annual DPIA/RoPA reviews
- Budget: €3,000-10,000/year for compliance tools

**Industry Examples**:

1. **Semi-Public Institutions** (like Dutch Railway Company):
   - Accountability to government
   - Public transparency required
   - Professional documentation needed
   - Budget constraints

2. **Professional Services**:
   - Law firms, consultancies, accounting firms
   - Client data = high sensitivity
   - Reputation critical
   - Need audit-ready documentation

3. **Healthcare** (non-hospital):
   - Mental health clinics
   - Physiotherapy practices
   - Medical device companies
   - Special category data = high risk

4. **Scale-ups / Tech Companies**:
   - 50-200 employees
   - International customers
   - Privacy = competitive advantage
   - Need to scale compliance

5. **Financial Services SMEs**:
   - Investment firms
   - Fintech startups
   - Insurance brokers
   - Regulated environment

**Not Target (Initially)**:

- ❌ Large enterprises (500+ employees) → need OneTrust scale
- ❌ Micro businesses (<10 employees) → too simple, won't pay
- ❌ Non-EU organizations → GDPR not applicable

---

## 4. Tech Stack

### Core Stack

**Framework & Runtime**

```
Next.js 16 = latest update (App Router)
├─ Why: Frank already uses it (compilot project)
├─ Full-stack: API + Frontend in monorepo
├─ Server Components for performance
├─ React Server Actions for mutations
├─ Built-in: Image optimization, fonts, SEO
└─ Deployment: Zero-config on Vercel

Node.js 20 LTS
├─ Why: Stable, long-term support
├─ Native TypeScript support
└─ Excellent library ecosystem

TypeScript 5.x (Strict Mode)
├─ Why: Critical for this domain
├─ Type safety prevents errors
├─ Self-documenting code
└─ Shared types client/server
```

**Frontend**

```
React 19
├─ Why: Industry standard, huge ecosystem
├─ Server Components
├─ Concurrent features
└─ Frank already knows it

UI Framework: shadcn/ui + Radix UI
├─ Why: Beautiful, accessible components
├─ Built on Radix (accessibility-first)
├─ Tailwind CSS integration
├─ Customizable source code
└─ Example components:
    ├─ Dialog, Sheet (modals)
    ├─ Table, DataTable (component lists)
    ├─ Form, Input, Select (questionnaires)
    ├─ Tabs, Accordion (document sections)
    └─ Toast, Alert (notifications)

Tailwind CSS 4
├─ Why: Rapid styling, consistent design
├─ No CSS files needed
├─ JIT compiler
└─ Dark mode built-in

Rich Text Editor: TipTap
├─ Why: Modern, extensible
├─ Based on ProseMirror
├─ Can embed components in text
├─ Variables: {{activity.name}}
├─ Collaboration-ready
└─ Better than: Draft.js, Slate, Quill

Forms: React Hook Form + Zod
├─ Why: Type-safe validation
├─ Zod schema → TypeScript types
├─ Minimal re-renders
└─ Example:
    const schema = z.object({
      name: z.string().min(1),
      type: z.enum(['GEWOON', 'BIJZONDER']),
      processors: z.array(z.string())
    });

State Management: Zustand
├─ Why: Simpler than Redux
├─ TypeScript support
├─ Minimal boilerplate
└─ Example:
    const useStore = create<Store>((set) => ({
      activity: null,
      setActivity: (a) => set({ activity: a })
    }));

Data Fetching: TanStack Query (React Query)
├─ Why: Caching, optimistic updates
├─ Background refetching
├─ Pagination/infinite scroll
└─ Works perfectly with tRPC

Visualization: React Flow
├─ Why: Component relationship graphs
├─ Interactive node diagrams
├─ Data flow visualization
└─ Example: ProcessingActivity → Processors → DataAssets

Tables: TanStack Table
├─ Why: Powerful, headless table
├─ Sorting, filtering, pagination
├─ Column resizing
└─ CSV export built-in
```

**Backend & API**

```
tRPC v11
├─ Why: End-to-end type safety
├─ No code generation needed
├─ Share types between client/server
├─ Procedures auto-documented
└─ Example:
    export const router = t.router({
      activity: {
        list: t.procedure.query(async () => {
          return await prisma.processingActivity.findMany();
        }),
        create: t.procedure
          .input(activitySchema)
          .mutation(async ({ input }) => {
            return await prisma.processingActivity.create({
              data: input
            });
          })
      }
    });

    // Client usage (fully typed):
    const activities = await trpc.activity.list.query();

Prisma ORM
├─ Why: Type-safe database access
├─ Migrations built-in
├─ Excellent Next.js integration
├─ Auto-generated TypeScript types
├─ Schema → TypeScript types → tRPC → React
└─ Example:
    const activity = await prisma.processingActivity.findUnique({
      where: { id },
      include: {
        dataProcessors: {
          include: { dpa: true }
        }
      }
    });
    // 'activity' is fully typed!

Validation: Zod (shared client/server)
├─ Runtime validation
├─ TypeScript type inference
└─ Example:
    // Define once
    const activitySchema = z.object({
      name: z.string(),
      purpose: z.string()
    });

    // Use everywhere (same schema)
    type Activity = z.infer<typeof activitySchema>;
```

**Database**

```
PostgreSQL 17
├─ Why: Robust, proven at scale
├─ Excellent JSON support (JSONB)
├─ Full-text search built-in
├─ Foreign keys for relationships
├─ ACID transactions
└─ Extensions:
    ├─ pg_trgm (fuzzy search)
    ├─ ltree (hierarchical data)
    ├─ pgcrypto (encryption)
    └─ pg_cron (scheduled jobs)

Why NOT:
├─ MongoDB: Relationships are first-class in this domain
├─ Neo4j: Overkill, PostgreSQL with good FKs is sufficient
└─ MySQL: PostgreSQL has better JSON support

Hosting Options:
├─ Development: Docker Compose (PostgreSQL 17 + Redis 7)
└─ Production: Contabo VPS (self-hosted PostgreSQL 17 + Redis 7)
```

**Document Generation**

```
Docxtemplater
├─ Why: Best for programmatic Word generation
├─ Template in actual .docx file
├─ Supports: tables, images, loops, conditions
└─ Example template:
    Processors:
    {#processors}
    - {name} ({role})
    {/processors}

Puppeteer + Headless Chrome
├─ Why: HTML → PDF with perfect rendering
├─ Server-side rendering
└─ Alternative: Playwright (similar)

Markdown + Pandoc (Optional)
├─ For internal version control
└─ Convert: MD → DOCX → PDF
```

**File Storage**

```
S3-Compatible Storage
├─ Development: MinIO (self-hosted, S3-compatible)
├─ Production: AWS S3 or Cloudflare R2
└─ Why:
    ├─ Industry standard
    ├─ Cheap at scale
    ├─ Presigned URLs (secure uploads)
    └─ Can switch providers easily
```

**Authentication**

```
NextAuth.js v5 (Auth.js)
├─ Why: Built for Next.js
├─ Supports: Email, OAuth, SAML (for enterprise)
├─ Session management
└─ Database adapter for Prisma

Providers:
├─ Email (magic links)
├─ Google OAuth (for ease of use)
└─ SAML SSO (for enterprise phase)
```

**Background Jobs**

```
BullMQ + Redis
├─ Why: Reliable job queue
├─ Use cases:
│   ├─ Document generation (long-running)
│   ├─ Email sending (rate-limited)
│   ├─ DPA expiry checks (scheduled)
│   └─ DPIA review reminders (scheduled)
└─ Redis also used for:
    ├─ Session storage
    ├─ Rate limiting
    └─ Caching
```

**Email**

```
Resend
├─ Why: Modern, developer-friendly
├─ React Email templates
├─ Great deliverability
└─ Reasonable pricing

Alternative: Postmark (also excellent)

Template Example:
import { Email, Button } from '@react-email/components';

export function DPAExpiryAlert({ processor, daysLeft }) {
  return (
    <Email>
      <h1>DPA Expiring Soon</h1>
      <p>The DPA with {processor.name} expires in {daysLeft} days.</p>
      <Button href={`/processors/${processor.id}`}>
        Review DPA
      </Button>
    </Email>
  );
}
```

**Development Tools**

```
Testing:
├─ Vitest (Unit tests)
│   └─ Faster than Jest, better DX
├─ Playwright (E2E tests)
│   └─ Test real workflows
└─ Storybook (Component development)
    └─ Build UI in isolation

Code Quality:
├─ ESLint (Next.js config)
├─ Prettier (formatting)
├─ Husky (git hooks)
│   ├─ Pre-commit: lint & format
│   └─ Pre-push: run tests
└─ TypeScript strict mode

Development:
├─ Turborepo (monorepo if needed)
├─ pnpm (faster than npm/yarn)
└─ Docker Compose (local services)
```

**Monitoring & Observability**

```
Sentry
├─ Error tracking
├─ Performance monitoring
└─ Source maps upload

PostHog
├─ Product analytics
├─ Feature flags
├─ Session recordings
└─ Funnel analysis

Axiom or Logflare
├─ Structured logging
└─ Query logs like database
```

**Deployment**

```
Production: Vercel
├─ Why: Zero-config for Next.js
├─ Global CDN
├─ Preview deployments (per PR)
├─ Analytics built-in
└─ Scales automatically

Database:
├─ Development: Docker Compose (PostgreSQL 17 + Redis 7)
└─ Production: Contabo VPS (self-hosted PostgreSQL 17 + Redis 7)

For Dutch Data Residency:
├─ Vercel EU region
└─ Contabo Nuremberg datacenter (Germany) - meets GDPR requirements

CI/CD:
├─ GitHub Actions
├─ Runs on: push to main
└─ Pipeline:
    ├─ Run linter
    ├─ Run type checks
    ├─ Run unit tests
    ├─ Run E2E tests
    ├─ Build
    └─ Deploy to Vercel
```

### Why This Stack?

**1. Consistency**: Everything is TypeScript

- Frontend: TypeScript + React
- Backend: TypeScript + Node.js
- Database: Prisma generates TypeScript types
- API: tRPC shares types end-to-end
- Validation: Zod schemas generate types
  → One type definition flows through entire stack

**2. Type Safety Prevents Bugs**

```typescript
// Define once
const processorSchema = z.object({
  name: z.string(),
  role: z.enum(['PROCESSOR', 'JOINT_CONTROLLER']),
})

// Used in:
// 1. Database (Prisma schema)
// 2. API (tRPC input validation)
// 3. Frontend (form validation)
// 4. Types (TypeScript interfaces)

// Error caught at compile time, not runtime!
```

**3. Modern & Proven**

- Next.js: Used by Netflix, TikTok, Twitch
- Prisma: Used by Vercel, Red Bull, Typefully
- tRPC: Used by Cal.com, Ping.gg, create-t3-app
- shadcn/ui: Used by thousands of apps
  → Battle-tested, not experimental

**4. Excellent Developer Experience**

- Hot reload (see changes instantly)
- TypeScript autocomplete everywhere
- Error messages point to exact issue
- Built-in tools (Next.js Image, Font optimization)
- Storybook for isolated component development

**5. Scalable**
Start Simple:

```
Development (Local):
Docker Compose (PostgreSQL 17 + Redis 7)
= €0/month for development

Production Small (0-100 users):
Vercel free tier
+ Contabo VPS S/M (€5-12/month)
+ Resend free tier
= €5-12/month for small production

Production Medium (100-1000 users):
Vercel Pro (€20/month)
+ Contabo VPS L (€20-25/month)
+ Resend paid (€10-20/month)
= €50-65/month for medium production

Production Enterprise (1000+ users):
Vercel Pro (€20/month)
+ Contabo VPS XL or Dedicated (€40-100/month)
+ Resend enterprise (€20-50/month)
= €80-170/month for enterprise
```

Enterprise:

```
Dedicated infrastructure
+ Self-hosted database
+ Multiple regions
= Custom pricing for 1,000+ users
```

**6. Frank Already Knows It**

- Next.js: ✅ (compilot project)
- React: ✅
- TypeScript: ✅
- PostgreSQL: ✅
  → Can start building immediately

---

## Summary

**Problem**: Privacy teams maintain structured compliance data (processors, risks, data categories) but need text-driven documents (DPIAs, RoPAs). Current tools force a choice between structure (complex GRC tools) or documents (manual Word files).

**Solution**: Compilo treats documents as views of an underlying compliance graph. Reusable components generate professional documents. Questionnaires gather data in business language. Bidirectional sync lets legal edit in Word.

**MVP Features** (3 months):

1. Component Library (processors, data categories, risks, etc.)
2. Guided Questionnaires (15-min project intake, deep-dive justifications)
3. Document Generation (DPIA, RoPA, DPA templates)
4. Validation Engine (real-time compliance checking)

**Users**: Mid-market organizations (50-500 employees) with 1-3 privacy professionals. Sweet spot: semi-public institutions, professional services, healthcare, scale-ups, fintech.

**Tech**: Next.js 16 + React + TypeScript + Prisma + PostgreSQL + tRPC + shadcn/ui. Full type safety end-to-end. Modern stack Frank already knows.

**Positioning**: "Component-based compliance for modern organizations. Generate DPIAs in hours, not weeks."
