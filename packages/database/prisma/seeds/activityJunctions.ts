import type { PrismaClient } from '../../generated/client/client'

/**
 * Seed junction table relationships for data processing activities
 * Creates many-to-many relationships between activities and their components
 * Demonstrates both single and multiple component associations
 */
export async function seedActivityJunctions(prisma: PrismaClient): Promise<number> {
  // Check if junction records already exist
  const existingPurposeCount = await prisma.dataProcessingActivityPurpose.count()
  if (existingPurposeCount > 0) {
    console.log(
      `Skipping activity junctions seed - ${existingPurposeCount} junction records already exist`
    )
    return existingPurposeCount
  }

  console.log('Seeding activity junction relationships...')

  let totalCount = 0

  // Acme Corp: Customer Email Marketing activity
  const marketingActivity = await prisma.dataProcessingActivity.findUnique({
    where: { id: 'activity_acme_marketing_001' },
  })

  if (marketingActivity) {
    // Link to purposes
    await prisma.dataProcessingActivityPurpose.createMany({
      data: [
        {
          activityId: marketingActivity.id,
          purposeId: 'purpose_acme_marketing_001',
        },
        {
          activityId: marketingActivity.id,
          purposeId: 'purpose_acme_customer_service_002',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 2

    // Link to data subjects (assuming we have seeded data subject categories)
    const dataSubjects = await prisma.dataSubjectCategory.findMany({
      where: { organizationId: marketingActivity.organizationId },
      take: 2,
    })
    if (dataSubjects.length > 0) {
      await prisma.dataProcessingActivityDataSubject.createMany({
        data: dataSubjects.map((ds) => ({
          activityId: marketingActivity.id,
          dataSubjectCategoryId: ds.id,
        })),
        skipDuplicates: true,
      })
      totalCount += dataSubjects.length
    }

    // Link to data categories
    await prisma.dataProcessingActivityDataCategory.createMany({
      data: [
        {
          activityId: marketingActivity.id,
          dataCategoryId: 'dc_acme_contact_001',
        },
        {
          activityId: marketingActivity.id,
          dataCategoryId: 'dc_acme_identity_002',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 2

    // Link to recipients
    await prisma.dataProcessingActivityRecipient.createMany({
      data: [
        {
          activityId: marketingActivity.id,
          recipientId: 'recipient_acme_processor_002', // Email Service Provider
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 1
  }

  // Acme Corp: Employee Performance Management activity
  const hrActivity = await prisma.dataProcessingActivity.findUnique({
    where: { id: 'activity_acme_hr_002' },
  })

  if (hrActivity) {
    // Link to purposes
    await prisma.dataProcessingActivityPurpose.createMany({
      data: [
        {
          activityId: hrActivity.id,
          purposeId: 'purpose_acme_hr_003',
        },
        {
          activityId: hrActivity.id,
          purposeId: 'purpose_acme_compliance_004',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 2

    // Link to data subjects
    const dataSubjects = await prisma.dataSubjectCategory.findMany({
      where: { organizationId: hrActivity.organizationId },
      take: 1,
    })
    if (dataSubjects.length > 0) {
      await prisma.dataProcessingActivityDataSubject.createMany({
        data: dataSubjects.map((ds) => ({
          activityId: hrActivity.id,
          dataSubjectCategoryId: ds.id,
        })),
        skipDuplicates: true,
      })
      totalCount += dataSubjects.length
    }

    // Link to data categories
    await prisma.dataProcessingActivityDataCategory.createMany({
      data: [
        {
          activityId: hrActivity.id,
          dataCategoryId: 'dc_acme_identity_002',
        },
        {
          activityId: hrActivity.id,
          dataCategoryId: 'dc_acme_financial_004',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 2

    // Link to recipients
    await prisma.dataProcessingActivityRecipient.createMany({
      data: [
        {
          activityId: hrActivity.id,
          recipientId: 'recipient_acme_internal_001', // HR Department
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 1
  }

  // Acme Corp: Employee Health Records activity
  const healthActivity = await prisma.dataProcessingActivity.findUnique({
    where: { id: 'activity_acme_health_003' },
  })

  if (healthActivity) {
    // Link to purposes
    await prisma.dataProcessingActivityPurpose.createMany({
      data: [
        {
          activityId: healthActivity.id,
          purposeId: 'purpose_acme_hr_003',
        },
        {
          activityId: healthActivity.id,
          purposeId: 'purpose_acme_compliance_004',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 2

    // Link to data subjects
    const dataSubjects = await prisma.dataSubjectCategory.findMany({
      where: { organizationId: healthActivity.organizationId },
      take: 1,
    })
    if (dataSubjects.length > 0) {
      await prisma.dataProcessingActivityDataSubject.createMany({
        data: dataSubjects.map((ds) => ({
          activityId: healthActivity.id,
          dataSubjectCategoryId: ds.id,
        })),
        skipDuplicates: true,
      })
      totalCount += dataSubjects.length
    }

    // Link to data categories
    await prisma.dataProcessingActivityDataCategory.createMany({
      data: [
        {
          activityId: healthActivity.id,
          dataCategoryId: 'dc_acme_health_003', // Health Data
        },
        {
          activityId: healthActivity.id,
          dataCategoryId: 'dc_acme_identity_002',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 2

    // Link to recipients
    await prisma.dataProcessingActivityRecipient.createMany({
      data: [
        {
          activityId: healthActivity.id,
          recipientId: 'recipient_acme_internal_001', // HR Department
        },
        {
          activityId: healthActivity.id,
          recipientId: 'recipient_acme_processor_001', // Cloud Storage Provider
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 2
  }

  // Beta Inc: Product Usage Analytics activity
  const analyticsActivity = await prisma.dataProcessingActivity.findUnique({
    where: { id: 'activity_beta_analytics_001' },
  })

  if (analyticsActivity) {
    // Link to purposes
    await prisma.dataProcessingActivityPurpose.createMany({
      data: [
        {
          activityId: analyticsActivity.id,
          purposeId: 'purpose_beta_analytics_001',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 1

    // Link to data subjects
    const dataSubjects = await prisma.dataSubjectCategory.findMany({
      where: { organizationId: analyticsActivity.organizationId },
      take: 2,
    })
    if (dataSubjects.length > 0) {
      await prisma.dataProcessingActivityDataSubject.createMany({
        data: dataSubjects.map((ds) => ({
          activityId: analyticsActivity.id,
          dataSubjectCategoryId: ds.id,
        })),
        skipDuplicates: true,
      })
      totalCount += dataSubjects.length
    }

    // Link to data categories
    await prisma.dataProcessingActivityDataCategory.createMany({
      data: [
        {
          activityId: analyticsActivity.id,
          dataCategoryId: 'dc_beta_usage_002',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 1

    // Link to recipients
    await prisma.dataProcessingActivityRecipient.createMany({
      data: [
        {
          activityId: analyticsActivity.id,
          recipientId: 'recipient_beta_processor_001', // Analytics Platform
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 1
  }

  // Beta Inc: Payment Processing activity
  const paymentActivity = await prisma.dataProcessingActivity.findUnique({
    where: { id: 'activity_beta_payments_002' },
  })

  if (paymentActivity) {
    // Link to purposes
    await prisma.dataProcessingActivityPurpose.createMany({
      data: [
        {
          activityId: paymentActivity.id,
          purposeId: 'purpose_beta_delivery_002',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 1

    // Link to data subjects
    const dataSubjects = await prisma.dataSubjectCategory.findMany({
      where: { organizationId: paymentActivity.organizationId },
      take: 1,
    })
    if (dataSubjects.length > 0) {
      await prisma.dataProcessingActivityDataSubject.createMany({
        data: dataSubjects.map((ds) => ({
          activityId: paymentActivity.id,
          dataSubjectCategoryId: ds.id,
        })),
        skipDuplicates: true,
      })
      totalCount += dataSubjects.length
    }

    // Link to data categories
    await prisma.dataProcessingActivityDataCategory.createMany({
      data: [
        {
          activityId: paymentActivity.id,
          dataCategoryId: 'dc_beta_contact_001',
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 1

    // Link to recipients
    await prisma.dataProcessingActivityRecipient.createMany({
      data: [
        {
          activityId: paymentActivity.id,
          recipientId: 'recipient_beta_processor_002', // Payment Processor
        },
      ],
      skipDuplicates: true,
    })
    totalCount += 1
  }

  console.log(`✓ Created ${totalCount} junction table relationships`)

  return totalCount
}
