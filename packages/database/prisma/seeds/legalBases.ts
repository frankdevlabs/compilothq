import { LegalBasisType, type PrismaClient } from '../../generated/client/client'

export async function seedLegalBases(prisma: PrismaClient) {
  // Check if legal bases already exist
  const existingCount = await prisma.legalBasis.count()
  if (existingCount > 0) {
    console.log(`Skipping legal bases seed - ${existingCount} legal bases already exist`)
    return existingCount
  }

  // Legal basis data: [type, name, description, articleReference, requiresConsent, requiresExplicitConsent, requiresOptIn, withdrawalSupported, requiresLIA, requiresBalancingTest, usageGuidance]
  const legalBasesData: [
    LegalBasisType,
    string,
    string,
    string,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    string,
  ][] = [
    [
      LegalBasisType.CONSENT,
      'Consent',
      'Data subject has given consent to the processing of their personal data for one or more specific purposes',
      'Article 6(1)(a)',
      true,
      false,
      true,
      true,
      false,
      false,
      'Consent must be freely given, specific, informed and unambiguous. The data subject must be able to withdraw consent at any time.',
    ],
    [
      LegalBasisType.CONTRACT,
      'Contract Performance',
      'Processing is necessary for the performance of a contract to which the data subject is party or in order to take steps at the request of the data subject prior to entering into a contract',
      'Article 6(1)(b)',
      false,
      false,
      false,
      false,
      false,
      false,
      'Only data necessary for contract execution can be processed under this basis. Cannot be used for non-essential processing or marketing.',
    ],
    [
      LegalBasisType.LEGAL_OBLIGATION,
      'Legal Obligation',
      'Processing is necessary for compliance with a legal obligation to which the controller is subject',
      'Article 6(1)(c)',
      false,
      false,
      false,
      false,
      false,
      false,
      'Must identify the specific legal requirement mandating the processing. The legal obligation must be established under EU or Member State law.',
    ],
    [
      LegalBasisType.VITAL_INTERESTS,
      'Vital Interests',
      'Processing is necessary in order to protect the vital interests of the data subject or of another natural person',
      'Article 6(1)(d)',
      false,
      false,
      false,
      false,
      false,
      false,
      'Limited to life-threatening situations where consent cannot be obtained. This is the most restrictive legal basis and should only be used in emergency situations.',
    ],
    [
      LegalBasisType.PUBLIC_TASK,
      'Public Task',
      'Processing is necessary for the performance of a task carried out in the public interest or in the exercise of official authority vested in the controller',
      'Article 6(1)(e)',
      false,
      false,
      false,
      false,
      false,
      false,
      'Must have a clear basis in law for the public interest task. Typically only applicable to public authorities or bodies performing tasks in the public interest.',
    ],
    [
      LegalBasisType.LEGITIMATE_INTERESTS,
      'Legitimate Interests',
      'Processing is necessary for the purposes of the legitimate interests pursued by the controller or by a third party, except where such interests are overridden by the interests or fundamental rights and freedoms of the data subject',
      'Article 6(1)(f)',
      false,
      false,
      false,
      false,
      true,
      true,
      'Requires documented Legitimate Interest Assessment (LIA) balancing controller interests against data subject rights. Must conduct balancing test and consider data subject expectations. Cannot be used by public authorities for tasks in the public interest.',
    ],
  ]

  const legalBases = legalBasesData.map(
    ([
      type,
      name,
      description,
      articleReference,
      requiresConsent,
      requiresExplicitConsent,
      requiresOptIn,
      withdrawalSupported,
      requiresLIA,
      requiresBalancingTest,
      usageGuidance,
    ]) => ({
      type,
      name,
      description,
      articleReference,
      requiresConsent,
      requiresExplicitConsent,
      requiresOptIn,
      withdrawalSupported,
      requiresLIA,
      requiresBalancingTest,
      usageGuidance,
      isActive: true,
    })
  )

  await prisma.legalBasis.createMany({
    data: legalBases,
    skipDuplicates: true,
  })

  const count = await prisma.legalBasis.count()
  console.log(`Seeded ${count} GDPR legal bases`)
  return count
}
