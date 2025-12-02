/**
 * Test data factories for Prisma models
 * These factories generate valid test data for all reference models
 *
 * @example
 * import { CountryFactory, createEUCountryFactory } from '@compilothq/database/test-utils/factories'
 *
 * // Create a test country
 * const country = await new CountryFactory().create()
 *
 * // Create an EU country
 * const euCountry = await createEUCountryFactory().create({ name: 'France' })
 */

// Base factory infrastructure
export { Factory } from './base-factory'

// Country factories
export {
  CountryFactory,
  createAdequateCountryFactory,
  createEEACountryFactory,
  createEUCountryFactory,
} from './country-factory'

// DataNature factories
export {
  createNonSpecialDataNatureFactory,
  createSpecialDataNatureFactory,
  DataNatureFactory,
} from './data-nature-factory'

// ProcessingAct factories
export {
  createDPARequiredProcessingActFactory,
  createDPIATriggeredProcessingActFactory,
  ProcessingActFactory,
} from './processing-act-factory'

// TransferMechanism factories
export {
  createAdequacyTransferMechanismFactory,
  createDerogationTransferMechanismFactory,
  createSafeguardTransferMechanismFactory,
  TransferMechanismFactory,
} from './transfer-mechanism-factory'

// RecipientCategory factories
export {
  createDPARequiredRecipientCategoryFactory,
  createImpactAssessmentRequiredRecipientCategoryFactory,
  createJointControllerRecipientCategoryFactory,
  RecipientCategoryFactory,
} from './recipient-category-factory'

// LegalBasis factories
export {
  createConsentLegalBasisFactory,
  createContractLegalBasisFactory,
  createLegitimateInterestsLegalBasisFactory,
  LegalBasisFactory,
} from './legal-basis-factory'

// Purpose factories
export {
  createAnalyticsPurposeFactory,
  createCustomerServicePurposeFactory,
  createMarketingPurposeFactory,
  PurposeFactory,
} from './purpose-factory'

// DataSubjectCategory factories
export {
  createOrganizationDataSubjectCategoryFactory,
  createVulnerableDataSubjectCategoryFactory,
  DataSubjectCategoryFactory,
} from './data-subject-category-factory'

// Organization factories
export {
  cleanupTestOrganizations,
  createTestOrganization,
  createTestOrganizations,
  type OrganizationFactoryOptions,
} from './organizationFactory'

// User factories
export {
  cleanupTestUsers,
  createTestUser,
  createTestUsers,
  createTestUsersByPersona,
  type UserFactoryOptions,
} from './userFactory'
