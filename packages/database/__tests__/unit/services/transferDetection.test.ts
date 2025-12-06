import { describe, expect, it } from 'vitest'

import type { Country, TransferMechanism } from '../../../src/index'
import {
  deriveTransferRisk,
  isSameJurisdiction,
  isThirdCountry,
  requiresSafeguards,
  validateTransferMechanismRequirement,
} from '../../../src/services/transferDetection'

// Mock country factory for testing
function createMockCountry(overrides: Partial<Country>): Country {
  return {
    id: 'country-id',
    isoCode: 'XX',
    name: 'Test Country',
    gdprStatus: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Country
}

// Mock transfer mechanism factory for testing
function createMockTransferMechanism(overrides: Partial<TransferMechanism>): TransferMechanism {
  return {
    id: 'mechanism-id',
    code: 'SCC',
    name: 'Standard Contractual Clauses',
    category: 'CONTRACTUAL',
    description: null,
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TransferMechanism
}

describe('Transfer Detection Helper Functions', () => {
  describe('isSameJurisdiction', () => {
    it('should return true for two EU countries', () => {
      const france = createMockCountry({ gdprStatus: ['EU', 'EEA'] })
      const germany = createMockCountry({ gdprStatus: ['EU'] })
      expect(isSameJurisdiction(france, germany)).toBe(true)
    })

    it('should return false for EU and third country', () => {
      const france = createMockCountry({ gdprStatus: ['EU', 'EEA'] })
      const usa = createMockCountry({ gdprStatus: ['Third Country'] })
      expect(isSameJurisdiction(france, usa)).toBe(false)
    })

    it('should return true for two adequate countries', () => {
      const canada = createMockCountry({ gdprStatus: ['Adequate'] })
      const japan = createMockCountry({ gdprStatus: ['Adequate'] })
      expect(isSameJurisdiction(canada, japan)).toBe(true)
    })
  })

  describe('isThirdCountry', () => {
    it('should return false for EU country', () => {
      const france = createMockCountry({ gdprStatus: ['EU', 'EEA'] })
      expect(isThirdCountry(france)).toBe(false)
    })

    it('should return true for non-EU/EEA/Adequate country', () => {
      const usa = createMockCountry({ gdprStatus: ['Third Country'] })
      expect(isThirdCountry(usa)).toBe(true)
    })

    it('should return false for adequate country', () => {
      const canada = createMockCountry({ gdprStatus: ['Adequate'] })
      expect(isThirdCountry(canada)).toBe(false)
    })
  })

  describe('requiresSafeguards', () => {
    it('should return true for EU to third country transfer', () => {
      const france = createMockCountry({ gdprStatus: ['EU', 'EEA'] })
      const china = createMockCountry({ gdprStatus: ['Third Country'] })
      expect(requiresSafeguards(france, china)).toBe(true)
    })

    it('should return false for third country to third country', () => {
      const usa = createMockCountry({ gdprStatus: ['Third Country'] })
      const china = createMockCountry({ gdprStatus: ['Third Country'] })
      expect(requiresSafeguards(usa, china)).toBe(false)
    })

    it('should return false for EU to adequate country', () => {
      const france = createMockCountry({ gdprStatus: ['EU', 'EEA'] })
      const canada = createMockCountry({ gdprStatus: ['Adequate'] })
      expect(requiresSafeguards(france, canada)).toBe(false)
    })
  })

  describe('deriveTransferRisk', () => {
    it('should return NONE for same jurisdiction', () => {
      const france = createMockCountry({ gdprStatus: ['EU'] })
      const germany = createMockCountry({ gdprStatus: ['EU'] })
      const risk = deriveTransferRisk(france, germany, null)
      expect(risk.level).toBe('NONE')
      expect(risk.reason).toBe('SAME_JURISDICTION')
    })

    it('should return LOW for adequacy decision', () => {
      const france = createMockCountry({ gdprStatus: ['EU'] })
      const canada = createMockCountry({ gdprStatus: ['Adequate'] })
      const risk = deriveTransferRisk(france, canada, null)
      expect(risk.level).toBe('LOW')
      expect(risk.reason).toBe('ADEQUACY_DECISION')
    })

    it('should return CRITICAL for third country without mechanism', () => {
      const france = createMockCountry({ gdprStatus: ['EU'] })
      const usa = createMockCountry({ gdprStatus: ['Third Country'] })
      const risk = deriveTransferRisk(france, usa, null)
      expect(risk.level).toBe('CRITICAL')
      expect(risk.reason).toBe('THIRD_COUNTRY_NO_MECHANISM')
    })

    it('should return MEDIUM for third country with mechanism', () => {
      const france = createMockCountry({ gdprStatus: ['EU'] })
      const usa = createMockCountry({ gdprStatus: ['Third Country'] })
      const mechanism = createMockTransferMechanism({ code: 'SCC' })
      const risk = deriveTransferRisk(france, usa, mechanism)
      expect(risk.level).toBe('MEDIUM')
      expect(risk.reason).toBe('SAFEGUARDS_IN_PLACE')
      // Mechanism should be present for MEDIUM risk with SAFEGUARDS_IN_PLACE
      expect(risk.mechanism).toEqual(mechanism)
    })
  })

  describe('validateTransferMechanismRequirement', () => {
    it('should allow same jurisdiction without mechanism', () => {
      const france = createMockCountry({ gdprStatus: ['EU'] })
      const germany = createMockCountry({ gdprStatus: ['EU'] })
      const result = validateTransferMechanismRequirement(france, germany, null)
      expect(result.valid).toBe(true)
      expect(result.required).toBe(false)
    })

    it('should require mechanism for EU to third country', () => {
      const france = createMockCountry({ name: 'France', gdprStatus: ['EU'] })
      const usa = createMockCountry({ name: 'United States', gdprStatus: ['Third Country'] })
      const result = validateTransferMechanismRequirement(france, usa, null)
      expect(result.valid).toBe(false)
      expect(result.required).toBe(true)
      expect(result.error).toContain('United States')
      expect(result.error).toContain('GDPR Article 46')
    })

    it('should allow mechanism for EU to third country', () => {
      const france = createMockCountry({ gdprStatus: ['EU'] })
      const usa = createMockCountry({ gdprStatus: ['Third Country'] })
      const result = validateTransferMechanismRequirement(france, usa, 'mechanism-id')
      expect(result.valid).toBe(true)
      expect(result.required).toBe(true)
    })

    it('should allow adequacy decision without mechanism', () => {
      const france = createMockCountry({ gdprStatus: ['EU'] })
      const canada = createMockCountry({ gdprStatus: ['Adequate'] })
      const result = validateTransferMechanismRequirement(france, canada, null)
      expect(result.valid).toBe(true)
      expect(result.required).toBe(false)
    })
  })
})
