import { PrismaClient } from '@prisma/client'

export async function seedProcessingActs(prisma: PrismaClient) {
  // Check if processing acts already exist
  const existingCount = await prisma.processingAct.count()
  if (existingCount > 0) {
    console.log(`Skipping processing acts seed - ${existingCount} processing acts already exist`)
    return existingCount
  }

  // Processing operations from GDPR Article 4(2)
  // [name, description, examples[], requiresDPA, triggersDPIA, gdprArticle]
  const processingActsData: [string, string, string[], boolean, boolean, string][] = [
    [
      'Collection',
      'Gathering or obtaining personal data from any source',
      [
        'Collecting customer information through website forms',
        'Gathering employee data during onboarding',
        'Obtaining contact details at events or conferences',
        'Receiving data from third-party data providers',
        'Capturing user interactions through analytics tools',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Recording',
      'Capturing and fixing data in a retrievable form',
      [
        'Storing form submissions in a database',
        'Recording customer service calls',
        'Logging user activity in application logs',
        'Saving email communications',
        'Documenting meeting minutes with participant details',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Organization',
      'Arranging and structuring data for specific purposes',
      [
        'Creating customer segments based on purchase behavior',
        'Organizing employee files by department',
        'Categorizing leads in a CRM system',
        'Structuring user profiles with preferences',
        'Grouping data by geographic region',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Structuring',
      'Arranging data in a systematic manner',
      [
        'Designing database schemas for customer data',
        'Creating hierarchical folder structures for documents',
        'Establishing data classification frameworks',
        'Building taxonomies for content organization',
        'Implementing data models for analytics',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Storage',
      'Keeping or maintaining data in a retrieval system',
      [
        'Storing customer records in cloud databases',
        'Maintaining employee files in HR systems',
        'Archiving transaction history',
        'Preserving backup copies of databases',
        'Retaining email archives for compliance',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Adaptation',
      'Modifying or altering data for specific uses',
      [
        'Updating customer contact information',
        'Correcting errors in employee records',
        'Reformatting data for system compatibility',
        'Translating content into different languages',
        'Converting data formats for migration',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Alteration',
      'Changing existing data',
      [
        'Modifying user preferences in account settings',
        'Updating product preferences',
        'Changing subscription status',
        'Revising customer shipping addresses',
        'Amending profile information',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Retrieval',
      'Accessing or obtaining stored data',
      [
        'Querying customer databases for support tickets',
        'Looking up employee information for payroll',
        'Searching transaction history for audits',
        'Accessing user profiles for personalization',
        'Retrieving archived records for legal requests',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Consultation',
      'Examining or reviewing data',
      [
        'Reviewing customer feedback surveys',
        'Analyzing sales performance dashboards',
        'Examining user activity reports',
        'Inspecting compliance audit logs',
        'Studying market research data',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Use',
      'Employing data for a specific purpose',
      [
        'Using email addresses to send newsletters',
        'Processing payment information for transactions',
        'Applying customer data for service delivery',
        'Utilizing analytics data for product improvement',
        'Employing contact information for customer support',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Disclosure by Transmission',
      'Sending or transferring data to recipients',
      [
        'Sharing customer data with shipping providers',
        'Transmitting employee data to payroll processors',
        'Sending user information to marketing partners',
        'Transferring data to cloud service providers',
        'Forwarding records to legal authorities upon request',
      ],
      true,
      false,
      'Art. 4(2)',
    ],
    [
      'Dissemination',
      'Making data available to a wide audience',
      [
        'Publishing employee directories on intranet',
        'Displaying customer testimonials on website',
        'Sharing research findings with participants',
        'Broadcasting user-generated content',
        'Publishing public records or announcements',
      ],
      false,
      true,
      'Art. 4(2)',
    ],
    [
      'Alignment or Combination',
      'Bringing together data from different sources',
      [
        'Merging customer data from multiple systems',
        'Combining online and offline purchase history',
        'Linking social media profiles with CRM records',
        'Integrating data from acquired companies',
        'Consolidating user activity across platforms',
      ],
      false,
      true,
      'Art. 4(2)',
    ],
    [
      'Restriction',
      'Limiting the processing or use of data',
      [
        'Marking records for limited access during disputes',
        'Freezing data pending deletion requests',
        'Implementing access controls for sensitive data',
        'Restricting processing while verifying accuracy',
        'Limiting use of data subject to objections',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Erasure',
      'Permanently deleting or destroying data',
      [
        'Deleting customer accounts upon request',
        'Removing inactive user profiles',
        'Purging expired transaction records',
        'Destroying physical documents securely',
        'Wiping data from decommissioned systems',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
    [
      'Destruction',
      'Physically eliminating data storage media',
      [
        'Shredding paper documents containing personal data',
        'Degaussing magnetic storage devices',
        'Incinerating outdated records',
        'Physically destroying hard drives',
        'Secure disposal of backup tapes',
      ],
      false,
      false,
      'Art. 4(2)',
    ],
  ]

  const processingActs = processingActsData.map(
    ([name, description, examples, requiresDPA, triggersDPIA, gdprArticle]) => ({
      name,
      description,
      examples,
      requiresDPA,
      triggersDPIA,
      gdprArticle,
      isActive: true,
    })
  )

  await prisma.processingAct.createMany({
    data: processingActs,
    skipDuplicates: true,
  })

  const count = await prisma.processingAct.count()
  console.log(`Seeded ${count} processing acts`)
  return count
}
