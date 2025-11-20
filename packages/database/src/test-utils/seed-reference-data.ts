import { DataNatureType, PrismaClient, TransferMechanismCategory } from '.prisma/client'

/**
 * Seed minimal reference data for test database
 * This uses a subset of production seed data for faster test execution
 *
 * Seeds the following tables:
 * - Country (5-10 records covering EU, EEA, Adequate, and Third Country)
 * - DataNature (5-10 records covering both SPECIAL and NON_SPECIAL types)
 * - ProcessingAct (5-10 common processing operations)
 * - TransferMechanism (5-10 common transfer mechanisms)
 * - RecipientCategory (5-10 common recipient categories)
 *
 * @param client - Prisma client instance (should be test database client)
 */
export async function seedReferenceData(client: PrismaClient): Promise<void> {
  // Helper function to parse GDPR status
  function parseGdprStatus(status: string): string[] {
    const result: string[] = []

    if (status.includes('EU')) {
      result.push('EU', 'EEA')
    } else if (status.includes('EEA')) {
      result.push('EEA')
    }

    if (status.includes('Third Country')) {
      result.push('Third Country')
    }

    if (status.includes('Adequate')) {
      result.push('Adequate')
    }

    return result.length > 0 ? result : ['Third Country']
  }

  // Seed Countries (10 records covering different GDPR statuses)
  await client.country.createMany({
    data: [
      // EU countries
      {
        name: 'France',
        isoCode: 'FR',
        isoCode3: 'FRA',
        gdprStatus: parseGdprStatus('EU'),
        description: 'Member of the European Union',
        isActive: true,
      },
      {
        name: 'Germany',
        isoCode: 'DE',
        isoCode3: 'DEU',
        gdprStatus: parseGdprStatus('EU'),
        description: 'Member of the European Union',
        isActive: true,
      },
      // EEA (non-EU)
      {
        name: 'Norway',
        isoCode: 'NO',
        isoCode3: 'NOR',
        gdprStatus: parseGdprStatus('EEA'),
        description: 'European Economic Area member',
        isActive: true,
      },
      // Countries with adequacy
      {
        name: 'Switzerland',
        isoCode: 'CH',
        isoCode3: 'CHE',
        gdprStatus: parseGdprStatus('Third Country (Adequate)'),
        description: 'GDPR adequacy decision',
        isActive: true,
      },
      {
        name: 'United Kingdom',
        isoCode: 'GB',
        isoCode3: 'GBR',
        gdprStatus: parseGdprStatus('Third Country (Adequate)'),
        description: 'GDPR adequacy decision',
        isActive: true,
      },
      // Third countries (no adequacy)
      {
        name: 'United States',
        isoCode: 'US',
        isoCode3: 'USA',
        gdprStatus: parseGdprStatus('Third Country'),
        description: 'No adequacy decision',
        isActive: true,
      },
      {
        name: 'Canada',
        isoCode: 'CA',
        isoCode3: 'CAN',
        gdprStatus: parseGdprStatus('Third Country (Adequate)'),
        description: 'GDPR adequacy decision (commercial organizations)',
        isActive: true,
      },
      {
        name: 'Japan',
        isoCode: 'JP',
        isoCode3: 'JPN',
        gdprStatus: parseGdprStatus('Third Country (Adequate)'),
        description: 'GDPR adequacy decision',
        isActive: true,
      },
      {
        name: 'China',
        isoCode: 'CN',
        isoCode3: 'CHN',
        gdprStatus: parseGdprStatus('Third Country'),
        description: 'No adequacy decision',
        isActive: true,
      },
      {
        name: 'India',
        isoCode: 'IN',
        isoCode3: 'IND',
        gdprStatus: parseGdprStatus('Third Country'),
        description: 'No adequacy decision',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })

  // Seed DataNatures (10 records: 5 SPECIAL + 5 NON_SPECIAL)
  await client.dataNature.createMany({
    data: [
      // Special category data
      {
        name: 'Health Data',
        description:
          'Data concerning physical or mental health, including medical history and health services',
        type: DataNatureType.SPECIAL,
        gdprArticle: 'Art. 9(1)',
        isActive: true,
      },
      {
        name: 'Racial or Ethnic Origin',
        description: 'Information revealing racial or ethnic origin of a data subject',
        type: DataNatureType.SPECIAL,
        gdprArticle: 'Art. 9(1)',
        isActive: true,
      },
      {
        name: 'Biometric Data',
        description:
          'Biometric data for uniquely identifying a person (fingerprints, facial recognition, iris scans)',
        type: DataNatureType.SPECIAL,
        gdprArticle: 'Art. 9(1)',
        isActive: true,
      },
      {
        name: 'Political Opinions',
        description: 'Information about political opinions, affiliations, or voting preferences',
        type: DataNatureType.SPECIAL,
        gdprArticle: 'Art. 9(1)',
        isActive: true,
      },
      {
        name: 'Religious or Philosophical Beliefs',
        description:
          'Information about religious beliefs, philosophical convictions, or worldviews',
        type: DataNatureType.SPECIAL,
        gdprArticle: 'Art. 9(1)',
        isActive: true,
      },
      // Non-special personal data
      {
        name: 'Name',
        description: 'Personal names including first name, last name, maiden name, and aliases',
        type: DataNatureType.NON_SPECIAL,
        gdprArticle: 'Art. 4(1)',
        isActive: true,
      },
      {
        name: 'Contact Information',
        description: 'Email addresses, phone numbers, postal addresses, and other contact details',
        type: DataNatureType.NON_SPECIAL,
        gdprArticle: 'Art. 4(1)',
        isActive: true,
      },
      {
        name: 'Financial Data',
        description:
          'Bank account details, credit card information, financial transactions, income, and assets',
        type: DataNatureType.NON_SPECIAL,
        gdprArticle: 'Art. 4(1)',
        isActive: true,
      },
      {
        name: 'Employment Data',
        description:
          'Job title, employer, work history, salary, performance reviews, and professional qualifications',
        type: DataNatureType.NON_SPECIAL,
        gdprArticle: 'Art. 4(1)',
        isActive: true,
      },
      {
        name: 'Device and Technical Data',
        description:
          'IP addresses, device IDs, browser types, operating systems, and technical specifications',
        type: DataNatureType.NON_SPECIAL,
        gdprArticle: 'Art. 4(1)',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })

  // Seed ProcessingActs (10 common operations)
  await client.processingAct.createMany({
    data: [
      {
        name: 'Collection',
        description: 'Gathering or obtaining personal data from any source',
        examples: [
          'Collecting contact information via web forms',
          'Gathering customer data during registration',
          'Obtaining employee data during onboarding',
        ],
        requiresDPA: false,
        triggersDPIA: false,
        gdprArticle: 'Art. 4(2)',
        isActive: true,
      },
      {
        name: 'Storage',
        description: 'Preserving or retaining personal data in any form',
        examples: [
          'Storing customer records in databases',
          'Archiving employee files',
          'Maintaining backup copies of data',
        ],
        requiresDPA: false,
        triggersDPIA: false,
        gdprArticle: 'Art. 4(2)',
        isActive: true,
      },
      {
        name: 'Use',
        description: 'Processing data for the intended purpose',
        examples: [
          'Using contact details to send invoices',
          'Using employee data for payroll',
          'Using customer data for service delivery',
        ],
        requiresDPA: false,
        triggersDPIA: false,
        gdprArticle: 'Art. 4(2)',
        isActive: true,
      },
      {
        name: 'Disclosure by Transmission',
        description: 'Making personal data available to recipients',
        examples: [
          'Sharing data with service providers',
          'Transmitting data to subsidiaries',
          'Sending data to payment processors',
        ],
        requiresDPA: true,
        triggersDPIA: false,
        gdprArticle: 'Art. 4(2)',
        isActive: true,
      },
      {
        name: 'Erasure',
        description: 'Permanent deletion or destruction of personal data',
        examples: [
          'Deleting customer accounts upon request',
          'Destroying paper records after retention period',
          'Removing data from backup systems',
        ],
        requiresDPA: false,
        triggersDPIA: false,
        gdprArticle: 'Art. 4(2)',
        isActive: true,
      },
      {
        name: 'Profiling',
        description: 'Automated processing to evaluate personal aspects',
        examples: [
          'Creating customer behavior profiles',
          'Automated credit scoring',
          'Behavioral analysis for marketing',
        ],
        requiresDPA: false,
        triggersDPIA: true,
        gdprArticle: 'Art. 4(4)',
        isActive: true,
      },
      {
        name: 'Consultation',
        description: 'Accessing or retrieving personal data for review',
        examples: [
          'Viewing customer records',
          'Accessing employee files',
          'Reviewing transaction history',
        ],
        requiresDPA: false,
        triggersDPIA: false,
        gdprArticle: 'Art. 4(2)',
        isActive: true,
      },
      {
        name: 'Structuring',
        description: 'Organizing or arranging personal data',
        examples: [
          'Creating customer databases',
          'Organizing employee records by department',
          'Categorizing data for reporting',
        ],
        requiresDPA: false,
        triggersDPIA: false,
        gdprArticle: 'Art. 4(2)',
        isActive: true,
      },
      {
        name: 'Restriction',
        description: 'Limiting the processing of personal data',
        examples: [
          'Temporarily blocking data from processing',
          'Marking data as restricted',
          'Preventing automated processing',
        ],
        requiresDPA: false,
        triggersDPIA: false,
        gdprArticle: 'Art. 4(2)',
        isActive: true,
      },
      {
        name: 'Automated Decision Making',
        description: 'Making decisions solely by automated means without human intervention',
        examples: [
          'Automated loan approval/rejection',
          'Automated hiring screening',
          'Automated pricing based on profiling',
        ],
        requiresDPA: false,
        triggersDPIA: true,
        gdprArticle: 'Art. 22',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })

  // Seed TransferMechanisms (10 common mechanisms)
  await client.transferMechanism.createMany({
    data: [
      {
        code: 'ADEQUACY_DECISION',
        name: 'Adequacy Decision',
        description: 'Transfer based on EU Commission adequacy decision',
        typicalUseCase:
          'Transfers to countries with adequacy decisions (UK, Switzerland, Japan, etc.)',
        gdprArticle: 'Art. 45',
        category: TransferMechanismCategory.ADEQUACY,
        isDerogation: false,
        requiresAdequacy: true,
        requiresDocumentation: false,
        isActive: true,
      },
      {
        code: 'SCC',
        name: 'Standard Contractual Clauses (SCCs)',
        description: 'EU Commission approved standard contractual clauses',
        typicalUseCase: 'Transfers to processors and controllers in third countries',
        gdprArticle: 'Art. 46(2)(c)',
        category: TransferMechanismCategory.SAFEGUARD,
        isDerogation: false,
        requiresAdequacy: false,
        requiresDocumentation: true,
        isActive: true,
      },
      {
        code: 'BCR',
        name: 'Binding Corporate Rules (BCRs)',
        description: 'Approved binding corporate rules for intra-group transfers',
        typicalUseCase: 'Transfers within multinational corporate groups',
        gdprArticle: 'Art. 46(2)(b)',
        category: TransferMechanismCategory.SAFEGUARD,
        isDerogation: false,
        requiresAdequacy: false,
        requiresDocumentation: true,
        isActive: true,
      },
      {
        code: 'EXPLICIT_CONSENT',
        name: 'Explicit Consent',
        description: 'Data subject has explicitly consented to the transfer',
        typicalUseCase: 'One-off or occasional transfers with informed consent',
        gdprArticle: 'Art. 49(1)(a)',
        category: TransferMechanismCategory.DEROGATION,
        isDerogation: true,
        requiresAdequacy: false,
        requiresDocumentation: true,
        isActive: true,
      },
      {
        code: 'CONTRACT_PERFORMANCE',
        name: 'Contract Performance',
        description: 'Transfer necessary for performance of contract with data subject',
        typicalUseCase: 'Transfers needed to deliver services to customers',
        gdprArticle: 'Art. 49(1)(b)',
        category: TransferMechanismCategory.DEROGATION,
        isDerogation: true,
        requiresAdequacy: false,
        requiresDocumentation: true,
        isActive: true,
      },
      {
        code: 'PUBLIC_INTEREST',
        name: 'Public Interest',
        description: 'Transfer necessary for important public interest reasons',
        typicalUseCase: 'Transfers for legal, regulatory, or public safety purposes',
        gdprArticle: 'Art. 49(1)(d)',
        category: TransferMechanismCategory.DEROGATION,
        isDerogation: true,
        requiresAdequacy: false,
        requiresDocumentation: true,
        isActive: true,
      },
      {
        code: 'LEGAL_CLAIMS',
        name: 'Legal Claims',
        description: 'Transfer necessary for establishment, exercise or defense of legal claims',
        typicalUseCase: 'Transfers related to litigation or dispute resolution',
        gdprArticle: 'Art. 49(1)(e)',
        category: TransferMechanismCategory.DEROGATION,
        isDerogation: true,
        requiresAdequacy: false,
        requiresDocumentation: true,
        isActive: true,
      },
      {
        code: 'VITAL_INTERESTS',
        name: 'Vital Interests',
        description: 'Transfer necessary to protect vital interests of data subject',
        typicalUseCase: 'Emergency medical situations or life-threatening scenarios',
        gdprArticle: 'Art. 49(1)(f)',
        category: TransferMechanismCategory.DEROGATION,
        isDerogation: true,
        requiresAdequacy: false,
        requiresDocumentation: true,
        isActive: true,
      },
      {
        code: 'PUBLIC_REGISTER',
        name: 'Public Register',
        description: 'Transfer from public register intended for public consultation',
        typicalUseCase: 'Transfers from publicly accessible registers',
        gdprArticle: 'Art. 49(1)(g)',
        category: TransferMechanismCategory.DEROGATION,
        isDerogation: true,
        requiresAdequacy: false,
        requiresDocumentation: false,
        isActive: true,
      },
      {
        code: 'INTRA_EEA',
        name: 'Intra-EEA Transfer',
        description: 'Transfer within European Economic Area (no additional safeguards needed)',
        typicalUseCase: 'Transfers between EU/EEA countries',
        gdprArticle: 'N/A',
        category: TransferMechanismCategory.NONE,
        isDerogation: false,
        requiresAdequacy: false,
        requiresDocumentation: false,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })

  // Seed RecipientCategories (10 common categories)
  await client.recipientCategory.createMany({
    data: [
      {
        code: 'SERVICE_PROVIDER',
        name: 'Service Providers / Processors',
        examples: [
          'Cloud hosting providers',
          'Email service providers',
          'Payment processors',
          'Analytics platforms',
        ],
        commonReasons: 'To provide technical infrastructure, process payments, or deliver services',
        requiresDPA: true,
        requiresImpactAssessment: false,
        defaultRole: 'Processor',
        isActive: true,
      },
      {
        code: 'GROUP_COMPANY',
        name: 'Group Companies / Affiliates',
        examples: ['Parent companies', 'Subsidiaries', 'Sister companies', 'Joint ventures'],
        commonReasons: 'For internal administration, consolidated reporting, or shared services',
        requiresDPA: false,
        requiresImpactAssessment: false,
        defaultRole: 'Joint Controller',
        isActive: true,
      },
      {
        code: 'LEGAL_AUTHORITY',
        name: 'Legal and Regulatory Authorities',
        examples: ['Tax authorities', 'Law enforcement agencies', 'Courts', 'Regulatory bodies'],
        commonReasons: 'To comply with legal obligations or respond to lawful requests',
        requiresDPA: false,
        requiresImpactAssessment: false,
        defaultRole: null,
        isActive: true,
      },
      {
        code: 'PROFESSIONAL_ADVISOR',
        name: 'Professional Advisors',
        examples: ['Lawyers', 'Accountants', 'Auditors', 'Consultants'],
        commonReasons: 'To obtain professional advice, audit services, or legal representation',
        requiresDPA: true,
        requiresImpactAssessment: false,
        defaultRole: 'Processor',
        isActive: true,
      },
      {
        code: 'MARKETING_PARTNER',
        name: 'Marketing and Advertising Partners',
        examples: [
          'Advertising networks',
          'Social media platforms',
          'Marketing agencies',
          'Analytics providers',
        ],
        commonReasons: 'For marketing campaigns, targeted advertising, or audience analysis',
        requiresDPA: true,
        requiresImpactAssessment: false,
        defaultRole: 'Joint Controller',
        isActive: true,
      },
      {
        code: 'BUSINESS_PARTNER',
        name: 'Business Partners',
        examples: ['Distributors', 'Resellers', 'Suppliers', 'Strategic partners'],
        commonReasons: 'To facilitate business relationships, sales, or supply chain operations',
        requiresDPA: true,
        requiresImpactAssessment: false,
        defaultRole: 'Independent Controller',
        isActive: true,
      },
      {
        code: 'CUSTOMER',
        name: 'Customers / Clients',
        examples: ['B2B customers', 'Enterprise clients', 'Business users'],
        commonReasons: 'To fulfill contractual obligations or provide requested services',
        requiresDPA: false,
        requiresImpactAssessment: false,
        defaultRole: 'Independent Controller',
        isActive: true,
      },
      {
        code: 'DATA_SUBJECT',
        name: 'Data Subjects (Individuals)',
        examples: ['The individual to whom the data relates', 'Account holders', 'Service users'],
        commonReasons: 'To provide access to personal data or fulfill data subject rights',
        requiresDPA: false,
        requiresImpactAssessment: false,
        defaultRole: null,
        isActive: true,
      },
      {
        code: 'ACQUIRER',
        name: 'Potential Acquirers / Investors',
        examples: ['Merger partners', 'Acquisition targets', 'Investors', 'Due diligence advisors'],
        commonReasons: 'For due diligence in connection with business transactions',
        requiresDPA: true,
        requiresImpactAssessment: true,
        defaultRole: 'Independent Controller',
        isActive: true,
      },
      {
        code: 'RESEARCH',
        name: 'Research and Development Partners',
        examples: [
          'Universities',
          'Research institutions',
          'Innovation labs',
          'Clinical trial organizations',
        ],
        commonReasons: 'For research, development, or innovation projects',
        requiresDPA: true,
        requiresImpactAssessment: true,
        defaultRole: 'Joint Controller',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })
}
