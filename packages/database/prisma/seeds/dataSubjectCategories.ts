import { type PrismaClient } from '../../generated/client/client'

export async function seedDataSubjectCategories(prisma: PrismaClient) {
  // Check if data subject categories already exist
  const existingCount = await prisma.dataSubjectCategory.count()
  if (existingCount > 0) {
    console.log(
      `Skipping data subject categories seed - ${existingCount} data subject categories already exist`
    )
    return existingCount
  }

  // Data subject categories for GDPR compliance
  // [code, name, description, category, examples[], isVulnerable, vulnerabilityReason, vulnerabilityArticle, gdprArticle, suggestsDPIA, dpiaRationale]
  const dataSubjectCategoriesData: [
    string, // code
    string, // name
    string, // description
    string, // category
    string[], // examples
    boolean, // isVulnerable
    string | null, // vulnerabilityReason
    string | null, // vulnerabilityArticle
    string | null, // gdprArticle
    boolean, // suggestsDPIA
    string | null, // dpiaRationale
  ][] = [
    // Internal categories
    [
      'EMPLOYEE',
      'Employees',
      'Current employees and staff members of the organization',
      'internal',
      [
        'Full-time employees',
        'Part-time employees',
        'Temporary staff',
        'Interns',
        'Remote workers',
      ],
      false,
      null,
      null,
      'Art. 6(1)(b), Art. 88',
      false,
      null,
    ],
    [
      'JOB_APPLICANT',
      'Job Applicants',
      'Individuals who have applied for employment positions',
      'internal',
      [
        'Job candidates',
        'Interview participants',
        'Recruitment pipeline contacts',
        'Reference check subjects',
      ],
      false,
      null,
      null,
      'Art. 6(1)(b), Art. 6(1)(f)',
      false,
      null,
    ],
    [
      'CONTRACTOR',
      'Contractors',
      'Independent contractors and freelancers working with the organization',
      'internal',
      [
        'Freelance consultants',
        'Independent contractors',
        'Self-employed professionals',
        'Temporary project workers',
      ],
      false,
      null,
      null,
      'Art. 6(1)(b)',
      false,
      null,
    ],

    // External categories
    [
      'CUSTOMER',
      'Customers',
      "Individuals who have purchased or are using the organization's products or services",
      'external',
      [
        'Paying customers',
        'Service users',
        'Product purchasers',
        'Subscription holders',
        'Account holders',
      ],
      false,
      null,
      null,
      'Art. 6(1)(b)',
      false,
      null,
    ],
    [
      'PROSPECT',
      'Prospects',
      'Potential customers who have shown interest but not yet purchased',
      'external',
      [
        'Sales leads',
        'Trial users',
        'Demo requesters',
        'Inquiry contacts',
        'Marketing qualified leads',
      ],
      false,
      null,
      null,
      'Art. 6(1)(f)',
      false,
      null,
    ],
    [
      'SUPPLIER',
      'Suppliers',
      'Individuals from supplier or vendor organizations',
      'external',
      ['Vendor contacts', 'Supplier representatives', 'Business partners', 'Procurement contacts'],
      false,
      null,
      null,
      'Art. 6(1)(b), Art. 6(1)(f)',
      false,
      null,
    ],
    [
      'WEBSITE_VISITOR',
      'Website Visitors',
      "Individuals who visit the organization's website or digital properties",
      'external',
      [
        'Anonymous visitors',
        'Cookie consent subjects',
        'Analytics data subjects',
        'Form submitters',
      ],
      false,
      null,
      null,
      'Art. 6(1)(f)',
      false,
      null,
    ],
    [
      'NEWSLETTER_SUBSCRIBER',
      'Newsletter Subscribers',
      'Individuals who have subscribed to newsletters or mailing lists',
      'external',
      [
        'Email subscribers',
        'Newsletter recipients',
        'Mailing list members',
        'Marketing communication recipients',
      ],
      false,
      null,
      null,
      'Art. 6(1)(a)',
      false,
      null,
    ],

    // Vulnerable categories
    [
      'MINOR',
      'Minors (Children)',
      'Children and young individuals under the age of 16',
      'vulnerable',
      [
        'Children under 16',
        'Underage users',
        'Minor account holders',
        'Youth program participants',
      ],
      true,
      'Children require special protection due to their limited understanding of risks and consequences related to the processing of their personal data',
      'Art. 8',
      'Art. 8, Art. 35(3)(b)',
      true,
      "Processing of children's data is considered high-risk and typically requires a Data Protection Impact Assessment",
    ],
    [
      'PATIENT',
      'Patients',
      'Individuals receiving healthcare or medical services',
      'vulnerable',
      [
        'Medical patients',
        'Healthcare recipients',
        'Clinical trial participants',
        'Telehealth users',
      ],
      true,
      'Processing of health data is considered sensitive and requires special protection under GDPR',
      'Art. 9',
      'Art. 9, Art. 35(3)(b)',
      true,
      'Processing of health data on a large scale is considered high-risk and typically requires a Data Protection Impact Assessment',
    ],
    [
      'STUDENT',
      'Students',
      'Individuals enrolled in educational programs or courses',
      'vulnerable',
      [
        'School students',
        'University students',
        'Training participants',
        'Online course enrollees',
        'Educational institution attendees',
      ],
      true,
      'Students, particularly minors, require special protection in educational contexts where there may be power imbalances',
      'Art. 35(3)(b)',
      'Art. 6(1)(b), Art. 35(3)(b)',
      true,
      'Large-scale processing of student data, especially for minors, may require a Data Protection Impact Assessment',
    ],
    [
      'ELDERLY',
      'Elderly Individuals',
      'Senior citizens and elderly individuals who may be vulnerable',
      'vulnerable',
      [
        'Senior citizens',
        'Retirement home residents',
        'Elderly care recipients',
        'Pension recipients',
      ],
      true,
      'Elderly individuals may be vulnerable due to potential cognitive decline, limited digital literacy, or dependency on care services',
      'Art. 35(3)(b)',
      'Art. 6(1)(b), Art. 35(3)(b)',
      true,
      "Processing of elderly individuals' data, particularly in care contexts, may require enhanced protection and impact assessment",
    ],
    [
      'ASYLUM_SEEKER',
      'Asylum Seekers',
      'Individuals seeking asylum or refugee status',
      'vulnerable',
      ['Asylum applicants', 'Refugees', 'Immigration applicants', 'Protection seekers'],
      true,
      'Asylum seekers are in vulnerable situations due to their legal status, potential persecution risks, and dependency on state services',
      'Art. 35(3)(b)',
      'Art. 6(1)(c), Art. 35(3)(b)',
      true,
      'Processing of asylum seeker data is high-risk due to potential consequences for the data subject and typically requires a Data Protection Impact Assessment',
    ],
  ]

  const dataSubjectCategories = dataSubjectCategoriesData.map(
    ([
      code,
      name,
      description,
      category,
      examples,
      isVulnerable,
      vulnerabilityReason,
      vulnerabilityArticle,
      gdprArticle,
      suggestsDPIA,
      dpiaRationale,
    ]) => ({
      code,
      name,
      description,
      category,
      examples,
      isVulnerable,
      vulnerabilityReason,
      vulnerabilityArticle,
      gdprArticle,
      suggestsDPIA,
      dpiaRationale,
      isActive: true,
      isSystemDefined: true,
      organizationId: null,
    })
  )

  await prisma.dataSubjectCategory.createMany({
    data: dataSubjectCategories,
    skipDuplicates: true,
  })

  const count = await prisma.dataSubjectCategory.count()
  console.log(`Seeded ${count} data subject categories`)
  return count
}
