import { PrismaClient, DataNatureType } from '../../node_modules/.prisma/client'

export async function seedDataNatures(prisma: PrismaClient) {
  // Check if data natures already exist
  const existingCount = await prisma.dataNature.count()
  if (existingCount > 0) {
    console.log(`Skipping data natures seed - ${existingCount} data natures already exist`)
    return existingCount
  }

  // Data nature types: [name, description, type, gdprArticle]
  const dataNaturesData: [string, string, DataNatureType, string][] = [
    // Special Category Data (Article 9 GDPR) - 9 types
    [
      'Racial or Ethnic Origin',
      'Information revealing racial or ethnic origin of a data subject',
      DataNatureType.SPECIAL,
      'Art. 9(1)',
    ],
    [
      'Political Opinions',
      'Information about political opinions, affiliations, or voting preferences',
      DataNatureType.SPECIAL,
      'Art. 9(1)',
    ],
    [
      'Religious or Philosophical Beliefs',
      'Information about religious beliefs, philosophical convictions, or worldviews',
      DataNatureType.SPECIAL,
      'Art. 9(1)',
    ],
    [
      'Trade Union Membership',
      'Information about trade union membership or activities',
      DataNatureType.SPECIAL,
      'Art. 9(1)',
    ],
    [
      'Genetic Data',
      'Personal data relating to inherited or acquired genetic characteristics',
      DataNatureType.SPECIAL,
      'Art. 9(1)',
    ],
    [
      'Biometric Data',
      'Biometric data for uniquely identifying a person (fingerprints, facial recognition, iris scans)',
      DataNatureType.SPECIAL,
      'Art. 9(1)',
    ],
    [
      'Health Data',
      'Data concerning physical or mental health, including medical history and health services',
      DataNatureType.SPECIAL,
      'Art. 9(1)',
    ],
    [
      'Sex Life',
      "Data concerning a person's sex life or sexual behavior",
      DataNatureType.SPECIAL,
      'Art. 9(1)',
    ],
    [
      'Sexual Orientation',
      "Data revealing a person's sexual orientation or preferences",
      DataNatureType.SPECIAL,
      'Art. 9(1)',
    ],

    // Non-Special Personal Data (Article 4 GDPR) - 20 types
    [
      'Name',
      'Personal names including first name, last name, maiden name, and aliases',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Contact Information',
      'Email addresses, phone numbers, postal addresses, and other contact details',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Demographic Data',
      'Age, date of birth, gender, nationality, marital status, and family composition',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Identification Numbers',
      "National ID numbers, passport numbers, driver's license numbers, social security numbers",
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Employment Data',
      'Job title, employer, work history, salary, performance reviews, and professional qualifications',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Financial Data',
      'Bank account details, credit card information, financial transactions, income, and assets',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Education Data',
      'Educational background, degrees, certifications, academic records, and training history',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Device and Technical Data',
      'IP addresses, device IDs, browser types, operating systems, and technical specifications',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Location Data',
      'Physical location data including GPS coordinates, geolocation, and travel history',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Communication Data',
      'Email content, messages, call logs, video conference recordings, and communication metadata',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Behavioral Data',
      'User behavior patterns, preferences, interests, habits, and interaction history',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Marketing Preferences',
      'Marketing consent, communication preferences, newsletter subscriptions, and opt-in/opt-out status',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Customer Relationship Data',
      'Customer IDs, account numbers, purchase history, service records, and support tickets',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Photographic and Visual Data',
      'Photographs, videos, and images (excluding biometric identification purposes)',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Publicly Available Data',
      'Information publicly available from directories, social media profiles, or public records',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Professional Data',
      'Business cards, LinkedIn profiles, professional memberships, and industry affiliations',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'User-Generated Content',
      'Reviews, comments, posts, ratings, and other content created by users',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Online Activity Data',
      'Website visits, page views, click patterns, session duration, and browsing history',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Transactional Data',
      'Purchase records, order history, payment methods, invoices, and transaction timestamps',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
    [
      'Emergency Contact Information',
      'Emergency contact names, relationships, phone numbers, and addresses',
      DataNatureType.NON_SPECIAL,
      'Art. 4(1)',
    ],
  ]

  const dataNatures = dataNaturesData.map(([name, description, type, gdprArticle]) => ({
    name,
    description,
    type,
    gdprArticle,
    isActive: true,
  }))

  await prisma.dataNature.createMany({
    data: dataNatures,
    skipDuplicates: true,
  })

  const count = await prisma.dataNature.count()
  console.log(
    `Seeded ${count} data natures (${dataNatures.filter((d) => d.type === DataNatureType.SPECIAL).length} special, ${dataNatures.filter((d) => d.type === DataNatureType.NON_SPECIAL).length} non-special)`
  )
  return count
}
