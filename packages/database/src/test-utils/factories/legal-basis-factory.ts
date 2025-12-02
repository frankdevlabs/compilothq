import type { LegalBasis, LegalBasisType, PrismaClient, RegulatoryFramework } from '../../index'
import { Factory } from './base-factory'

/**
 * Type for building LegalBasis data (excludes auto-generated fields)
 */
type LegalBasisBuildData = Omit<LegalBasis, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Factory for generating LegalBasis test data
 * Generates valid legal basis data that passes validation
 *
 * @example
 * // Build data without persisting
 * const legalBasisData = new LegalBasisFactory().build()
 *
 * // Create and persist to database
 * const legalBasis = await new LegalBasisFactory().create({ name: 'Custom Consent' })
 *
 * // Create consent-based legal basis
 * const consent = await new LegalBasisFactory()
 *   .params({ type: 'CONSENT', requiresConsent: true })
 *   .create()
 */
export class LegalBasisFactory extends Factory<LegalBasis, LegalBasisBuildData> {
  /**
   * Define default values for a LegalBasis
   */
  protected defaults(): Partial<LegalBasisBuildData> {
    const seq = this.nextSequence()

    return {
      type: 'CONSENT' as LegalBasisType,
      name: `Test Legal Basis ${seq}`,
      description: `Description for test legal basis ${seq}`,
      framework: 'GDPR' as RegulatoryFramework,
      articleReference: 'Article 6(1)(a)',
      articleDetails: undefined,
      applicableFrameworks: undefined,
      requiresConsent: false,
      requiresExplicitConsent: false,
      requiresOptIn: false,
      withdrawalSupported: false,
      requiresLIA: false,
      requiresBalancingTest: false,
      usageGuidance: undefined,
      isActive: true,
    }
  }

  /**
   * Persist the legal basis to the database
   */
  protected async persist(data: LegalBasisBuildData): Promise<LegalBasis> {
    return this.prisma.legalBasis.create({
      data: {
        ...data,
        articleDetails: data.articleDetails ?? undefined,
        applicableFrameworks: data.applicableFrameworks ?? undefined,
        usageGuidance: data.usageGuidance ?? undefined,
      },
    })
  }
}

/**
 * Pre-configured factory for consent-based legal basis
 * Consent basis requires opt-in and supports withdrawal
 */
export const createConsentLegalBasisFactory = (prisma?: PrismaClient) =>
  new LegalBasisFactory(prisma).params({
    type: 'CONSENT' as LegalBasisType,
    name: 'Consent',
    description: 'Data subject has given consent for processing',
    articleReference: 'Article 6(1)(a)',
    requiresConsent: true,
    requiresOptIn: true,
    withdrawalSupported: true,
  })

/**
 * Pre-configured factory for legitimate interests legal basis
 * Legitimate interests requires LIA and balancing test
 */
export const createLegitimateInterestsLegalBasisFactory = (prisma?: PrismaClient) =>
  new LegalBasisFactory(prisma).params({
    type: 'LEGITIMATE_INTERESTS' as LegalBasisType,
    name: 'Legitimate Interests',
    description: 'Processing is necessary for legitimate interests',
    articleReference: 'Article 6(1)(f)',
    requiresLIA: true,
    requiresBalancingTest: true,
  })

/**
 * Pre-configured factory for contract-based legal basis
 * Contract basis for processing necessary for contract performance
 */
export const createContractLegalBasisFactory = (prisma?: PrismaClient) =>
  new LegalBasisFactory(prisma).params({
    type: 'CONTRACT' as LegalBasisType,
    name: 'Contract Performance',
    description: 'Processing is necessary for contract performance',
    articleReference: 'Article 6(1)(b)',
  })
