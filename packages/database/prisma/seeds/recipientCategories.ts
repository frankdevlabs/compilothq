import { PrismaClient } from '@prisma/client'

export async function seedRecipientCategories(prisma: PrismaClient) {
  // Check if recipient categories already exist
  const existingCount = await prisma.recipientCategory.count()
  if (existingCount > 0) {
    console.log(
      `Skipping recipient categories seed - ${existingCount} recipient categories already exist`
    )
    return existingCount
  }

  // Recipient categories for data sharing classification
  // [code, name, examples[], commonReasons, requiresDPA, requiresImpactAssessment, defaultRole]
  const recipientCategoriesData: [string, string, string[], string, boolean, boolean, string?][] = [
    [
      'AFFILIATES',
      'Affiliates & Subsidiaries',
      [
        'Parent companies',
        'Sister companies',
        'Wholly-owned subsidiaries',
        'Joint ventures',
        'Corporate group entities',
      ],
      'Shared corporate services, group reporting, centralized IT systems, consolidated financial reporting',
      true,
      false,
      'joint controller',
    ],
    [
      'SERVICE_PROVIDERS',
      'External Service Providers & Vendors',
      [
        'Business consultants',
        'Outsourced customer support',
        'Data analytics providers',
        'Software vendors',
        'Administrative service providers',
      ],
      'Outsourced business functions, professional services, operational support, third-party tools',
      true,
      false,
      'processor',
    ],
    [
      'CLOUD_IT',
      'Cloud & IT Infrastructure Providers',
      [
        'Cloud hosting providers (AWS, Azure, GCP)',
        'SaaS platforms',
        'Data center operators',
        'CDN providers',
        'IT maintenance and support',
      ],
      'Data storage, application hosting, infrastructure management, backup and disaster recovery',
      true,
      false,
      'processor',
    ],
    [
      'PAYMENT',
      'Payment Processors & Financial Institutions',
      [
        'Payment gateways (Stripe, PayPal)',
        'Banks and credit unions',
        'Credit card processors',
        'Digital wallets',
        'Financial service providers',
      ],
      'Processing payments, fraud detection, financial compliance, transaction settlement',
      true,
      false,
      'processor',
    ],
    [
      'MARKETING',
      'Marketing & Advertising Partners',
      [
        'Email marketing platforms',
        'Social media advertising networks',
        'Marketing automation tools',
        'Analytics platforms',
        'Advertising agencies',
      ],
      'Marketing campaigns, targeted advertising, customer engagement, lead generation, brand promotion',
      true,
      true,
      'joint controller',
    ],
    [
      'BUSINESS_PARTNERS',
      'Business & Strategic Partners',
      [
        'Distribution partners',
        'Resellers and retailers',
        'Co-marketing partners',
        'Integration partners',
        'Strategic alliance members',
      ],
      'Business development, co-selling arrangements, partnership programs, joint offerings',
      true,
      false,
      'joint controller',
    ],
    [
      'ADVISORS',
      'Professional Advisors & Consultants',
      [
        'Legal counsel and law firms',
        'Auditors and accountants',
        'Tax advisors',
        'Compliance consultants',
        'Management consultants',
      ],
      'Legal advice, audit and assurance, tax compliance, strategic consulting, regulatory guidance',
      true,
      false,
      'processor',
    ],
    [
      'GOVERNMENT',
      'Government & Regulatory Bodies',
      [
        'Tax authorities',
        'Data protection authorities',
        'Industry regulators',
        'Licensing agencies',
        'Government ministries',
      ],
      'Legal compliance, regulatory reporting, tax obligations, licensing requirements, official inquiries',
      false,
      false,
      'controller',
    ],
    [
      'LAW_ENFORCEMENT',
      'Law Enforcement & Public Safety Authorities',
      [
        'Police and law enforcement agencies',
        'National security agencies',
        'Border control authorities',
        'Anti-fraud agencies',
        'Judicial authorities',
      ],
      'Legal obligations, court orders, criminal investigations, national security, public safety',
      false,
      false,
      'controller',
    ],
    [
      'INSURANCE',
      'Insurance & Welfare Organizations',
      [
        'Insurance companies',
        'Health insurance providers',
        'Pension funds',
        'Social security organizations',
        'Employee benefits administrators',
      ],
      'Insurance claims, policy administration, employee benefits, health coverage, pension management',
      true,
      false,
      'joint controller',
    ],
    [
      'RESEARCH',
      'Research & Academic Institutions',
      [
        'Universities and research centers',
        'Clinical research organizations',
        'Market research firms',
        'Scientific institutions',
        'Think tanks and policy institutes',
      ],
      'Academic research, clinical studies, market analysis, statistical research, policy development',
      true,
      true,
      'controller',
    ],
    [
      'PUBLIC_NONPROFIT',
      'Public or Nonprofit Entities',
      [
        'Charities and foundations',
        'Non-governmental organizations',
        'Professional associations',
        'Industry groups',
        'Community organizations',
      ],
      'Charitable activities, advocacy, community programs, professional development, public interest',
      true,
      false,
      'controller',
    ],
    [
      'MISC',
      'Miscellaneous One-Off Recipients',
      [
        'Merger and acquisition parties',
        'Bankruptcy trustees',
        'Emergency responders',
        'Event organizers',
        'Other ad-hoc recipients',
      ],
      'Special circumstances, one-time disclosures, exceptional situations, unique business needs',
      true,
      true,
      undefined,
    ],
  ]

  const recipientCategories = recipientCategoriesData.map(
    ([
      code,
      name,
      examples,
      commonReasons,
      requiresDPA,
      requiresImpactAssessment,
      defaultRole,
    ]) => ({
      code,
      name,
      examples,
      commonReasons,
      requiresDPA,
      requiresImpactAssessment,
      defaultRole,
      isActive: true,
    })
  )

  await prisma.recipientCategory.createMany({
    data: recipientCategories,
    skipDuplicates: true,
  })

  const count = await prisma.recipientCategory.count()
  console.log(`Seeded ${count} recipient categories`)
  return count
}
