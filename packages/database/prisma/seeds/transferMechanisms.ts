import { type PrismaClient, TransferMechanismCategory } from '../../generated/client/client'

export async function seedTransferMechanisms(prisma: PrismaClient) {
  // Check if transfer mechanisms already exist
  const existingCount = await prisma.transferMechanism.count()
  if (existingCount > 0) {
    console.log(
      `Skipping transfer mechanisms seed - ${existingCount} transfer mechanisms already exist`
    )
    return existingCount
  }

  // Transfer mechanisms for cross-border data transfers
  // [code, name, description, typicalUseCase, gdprArticle, category, isDerogation, requiresAdequacy, requiresDocumentation]
  const transferMechanismsData: [
    string,
    string,
    string,
    string,
    string,
    TransferMechanismCategory,
    boolean,
    boolean,
    boolean,
  ][] = [
    [
      'ADEQUACY',
      'Adequacy Decision',
      'Transfer to countries recognized by the European Commission as providing adequate data protection',
      'Transfers to countries like UK, Switzerland, Japan, Canada, New Zealand, Israel, and others with adequacy decisions',
      'Art. 45',
      TransferMechanismCategory.ADEQUACY,
      false,
      true,
      false,
    ],
    [
      'SCC',
      'Standard Contractual Clauses (SCCs)',
      'Using European Commission-approved standard data protection clauses',
      'Most common mechanism for transfers to US service providers, cloud platforms, and international vendors',
      'Art. 46(2)(c)',
      TransferMechanismCategory.SAFEGUARD,
      false,
      false,
      true,
    ],
    [
      'BCR',
      'Binding Corporate Rules (BCRs)',
      'Legally binding internal rules for multinational organizations',
      'Large multinational corporations transferring data within their corporate group across borders',
      'Art. 46(2)(b)',
      TransferMechanismCategory.SAFEGUARD,
      false,
      false,
      true,
    ],
    [
      'CODE_OF_CONDUCT',
      'Approved Code of Conduct',
      'Industry-approved code of conduct with binding enforceable commitments',
      'Industry associations or consortiums with approved transfer frameworks',
      'Art. 46(2)(e)',
      TransferMechanismCategory.SAFEGUARD,
      false,
      false,
      true,
    ],
    [
      'CERTIFICATION',
      'Approved Certification Mechanism',
      'Certification under an approved mechanism with binding safeguards',
      'Organizations certified under approved frameworks for international transfers',
      'Art. 46(2)(f)',
      TransferMechanismCategory.SAFEGUARD,
      false,
      false,
      true,
    ],
    [
      'EXPLICIT_CONSENT',
      'Explicit Consent',
      'Data subject has explicitly consented to the transfer after being informed of risks',
      'One-off transfers with fully informed individual consent (use sparingly)',
      'Art. 49(1)(a)',
      TransferMechanismCategory.DEROGATION,
      true,
      false,
      true,
    ],
    [
      'CONTRACT_PERFORMANCE',
      'Contract Performance',
      'Transfer necessary for performance of a contract between data subject and controller',
      'Processing customer orders that require international shipping or service delivery',
      'Art. 49(1)(b)',
      TransferMechanismCategory.DEROGATION,
      true,
      false,
      true,
    ],
    [
      'PUBLIC_INTEREST',
      'Public Interest',
      'Transfer necessary for important reasons of public interest',
      'Public health emergencies, international cooperation, legal compliance requirements',
      'Art. 49(1)(d)',
      TransferMechanismCategory.DEROGATION,
      true,
      false,
      true,
    ],
    [
      'LEGAL_CLAIMS',
      'Legal Claims',
      'Transfer necessary for establishment, exercise, or defense of legal claims',
      'Litigation, arbitration, regulatory investigations requiring cross-border disclosure',
      'Art. 49(1)(e)',
      TransferMechanismCategory.DEROGATION,
      true,
      false,
      true,
    ],
    [
      'VITAL_INTERESTS',
      'Vital Interests',
      'Transfer necessary to protect vital interests when consent cannot be obtained',
      'Medical emergencies requiring international data sharing to save lives',
      'Art. 49(1)(f)',
      TransferMechanismCategory.DEROGATION,
      true,
      false,
      true,
    ],
    [
      'PUBLIC_REGISTER',
      'Public Register',
      'Transfer from a register intended to provide information to the public',
      'Publicly accessible business registers, professional directories, land registries',
      'Art. 49(1)(g)',
      TransferMechanismCategory.DEROGATION,
      true,
      false,
      false,
    ],
    [
      'LEGITIMATE_INTERESTS',
      'Compelling Legitimate Interests',
      'Occasional transfers based on compelling legitimate interests where no other mechanism is available',
      'Rare, non-repetitive transfers necessary for legitimate business interests (last resort)',
      'Art. 49(1) second subparagraph',
      TransferMechanismCategory.DEROGATION,
      true,
      false,
      true,
    ],
    [
      'NONE',
      'Not Applicable / No Transfer',
      'No cross-border data transfer occurring (data remains within EEA)',
      'Domestic processing within EU/EEA countries only',
      'N/A',
      TransferMechanismCategory.NONE,
      false,
      false,
      false,
    ],
  ]

  const transferMechanisms = transferMechanismsData.map(
    ([
      code,
      name,
      description,
      typicalUseCase,
      gdprArticle,
      category,
      isDerogation,
      requiresAdequacy,
      requiresDocumentation,
    ]) => ({
      code,
      name,
      description,
      typicalUseCase,
      gdprArticle,
      category,
      isDerogation,
      requiresAdequacy,
      requiresDocumentation,
      isActive: true,
    })
  )

  await prisma.transferMechanism.createMany({
    data: transferMechanisms,
    skipDuplicates: true,
  })

  const count = await prisma.transferMechanism.count()
  console.log(`Seeded ${count} transfer mechanisms`)
  return count
}
