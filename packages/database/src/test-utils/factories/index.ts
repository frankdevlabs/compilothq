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
  createEUCountryFactory,
  createEEACountryFactory,
  createAdequateCountryFactory,
} from './country-factory'

// DataNature factories
export {
  DataNatureFactory,
  createSpecialDataNatureFactory,
  createNonSpecialDataNatureFactory,
} from './data-nature-factory'

// ProcessingAct factories
export {
  ProcessingActFactory,
  createDPARequiredProcessingActFactory,
  createDPIATriggeredProcessingActFactory,
} from './processing-act-factory'

// TransferMechanism factories
export {
  TransferMechanismFactory,
  createAdequacyTransferMechanismFactory,
  createSafeguardTransferMechanismFactory,
  createDerogationTransferMechanismFactory,
} from './transfer-mechanism-factory'

// RecipientCategory factories
export {
  RecipientCategoryFactory,
  createDPARequiredRecipientCategoryFactory,
  createImpactAssessmentRequiredRecipientCategoryFactory,
  createJointControllerRecipientCategoryFactory,
} from './recipient-category-factory'
