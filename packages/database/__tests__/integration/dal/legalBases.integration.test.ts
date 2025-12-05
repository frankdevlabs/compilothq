import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  getLegalBasesByFramework,
  getLegalBasisById,
  getLegalBasisByType,
  listLegalBases,
} from '../../../src/dal/legalBases'
import { LegalBasisType, prisma, RegulatoryFramework } from '../../../src/index'
import {
  cleanupTestDatabase,
  disconnectTestDatabase,
  LegalBasisFactory,
  setupTestDatabase,
} from '../../../src/test-utils'
import { seedReferenceData } from '../../../src/test-utils/seed-reference-data'

describe('LegalBases DAL - Integration Tests', () => {
  beforeAll(() => {
    // Run migrations once before all tests
    setupTestDatabase()
  })

  beforeEach(async () => {
    // Clean database before each test for isolation
    await cleanupTestDatabase()
    // Restore reference data for other tests
    await seedReferenceData(prisma)
  })

  afterAll(async () => {
    // Disconnect from database after all tests
    await disconnectTestDatabase()
  })

  describe('listLegalBases', () => {
    it('should create legal basis and retrieve by ID', async () => {
      // Arrange - Create a legal basis using factory
      const legalBasis = await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'Test Consent',
        description: 'Test consent description',
        requiresConsent: true,
      })

      // Act - Retrieve the legal basis by ID
      const result = await getLegalBasisById(legalBasis.id)

      // Assert
      expect(result).not.toBeNull()
      expect(result?.id).toBe(legalBasis.id)
      expect(result?.type).toBe(LegalBasisType.CONSENT)
      expect(result?.name).toBe('Test Consent')
      expect(result?.requiresConsent).toBe(true)
    })

    it('should list all active legal bases ordered by type', async () => {
      // Arrange - Create multiple legal bases
      await new LegalBasisFactory().create({
        type: LegalBasisType.LEGITIMATE_INTERESTS,
        name: 'Legitimate Interests',
      })

      await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'Consent',
      })

      await new LegalBasisFactory().create({
        type: LegalBasisType.CONTRACT,
        name: 'Contract',
      })

      // Act
      const result = await listLegalBases()

      // Assert - Should be ordered by type
      expect(result).toHaveLength(3)
      expect(result[0]!.type).toBe(LegalBasisType.CONSENT)
      expect(result[1]!.type).toBe(LegalBasisType.CONTRACT)
      expect(result[2]!.type).toBe(LegalBasisType.LEGITIMATE_INTERESTS)
    })

    it('should exclude inactive legal bases from list', async () => {
      // Arrange - Create active and inactive legal bases
      await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'Active Consent',
        isActive: true,
      })

      await new LegalBasisFactory().create({
        type: LegalBasisType.CONTRACT,
        name: 'Inactive Contract',
        isActive: false,
      })

      // Act
      const result = await listLegalBases()

      // Assert - Should only include active legal bases
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Active Consent')
    })
  })

  describe('getLegalBasisByType', () => {
    it('should retrieve legal basis by type', async () => {
      // Arrange - Create legal bases of different types
      await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'Consent Basis',
        requiresConsent: true,
      })

      await new LegalBasisFactory().create({
        type: LegalBasisType.CONTRACT,
        name: 'Contract Basis',
      })

      // Act
      const result = await getLegalBasisByType(LegalBasisType.CONSENT)

      // Assert
      expect(result).not.toBeNull()
      expect(result?.type).toBe(LegalBasisType.CONSENT)
      expect(result?.name).toBe('Consent Basis')
      expect(result?.requiresConsent).toBe(true)
    })

    it('should return null for non-existent type', async () => {
      // Arrange - Create a consent basis
      await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'Consent Basis',
      })

      // Act - Query for a different type
      const result = await getLegalBasisByType(LegalBasisType.VITAL_INTERESTS)

      // Assert
      expect(result).toBeNull()
    })

    it('should return only active legal basis for type', async () => {
      // Arrange - Create active and inactive legal bases of same type
      await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'Inactive Consent',
        isActive: false,
      })

      const activeBasis = await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'Active Consent',
        isActive: true,
      })

      // Act
      const result = await getLegalBasisByType(LegalBasisType.CONSENT)

      // Assert - Should return the active one
      expect(result).not.toBeNull()
      expect(result?.id).toBe(activeBasis.id)
      expect(result?.name).toBe('Active Consent')
    })
  })

  describe('getLegalBasesByFramework', () => {
    it('should filter legal bases by regulatory framework', async () => {
      // Arrange - Create legal bases with different frameworks
      await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'GDPR Consent',
        framework: RegulatoryFramework.GDPR,
      })

      await new LegalBasisFactory().create({
        type: LegalBasisType.CONTRACT,
        name: 'GDPR Contract',
        framework: RegulatoryFramework.GDPR,
      })

      await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'UK GDPR Consent',
        framework: RegulatoryFramework.UK_GDPR,
      })

      // Act - Query by GDPR framework
      const gdprBases = await getLegalBasesByFramework(RegulatoryFramework.GDPR)

      // Assert
      expect(gdprBases).toHaveLength(2)
      expect(gdprBases.map((b) => b.name).sort()).toEqual(['GDPR Consent', 'GDPR Contract'])
    })

    it('should return empty array when no legal bases match framework', async () => {
      // Arrange - Create GDPR legal bases
      await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'GDPR Consent',
        framework: RegulatoryFramework.GDPR,
      })

      // Act - Query by CCPA framework
      const ccpaBases = await getLegalBasesByFramework(RegulatoryFramework.CCPA)

      // Assert
      expect(ccpaBases).toEqual([])
    })

    it('should exclude inactive legal bases from framework query', async () => {
      // Arrange - Create active and inactive legal bases
      await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'Active GDPR',
        framework: RegulatoryFramework.GDPR,
        isActive: true,
      })

      await new LegalBasisFactory().create({
        type: LegalBasisType.CONTRACT,
        name: 'Inactive GDPR',
        framework: RegulatoryFramework.GDPR,
        isActive: false,
      })

      // Act
      const gdprBases = await getLegalBasesByFramework(RegulatoryFramework.GDPR)

      // Assert - Should only include active legal bases
      expect(gdprBases).toHaveLength(1)
      expect(gdprBases[0]!.name).toBe('Active GDPR')
    })
  })

  describe('Consent and assessment flags', () => {
    it('should correctly store and retrieve consent flags', async () => {
      // Arrange & Act - Create legal basis with consent flags
      const consentBasis = await new LegalBasisFactory().create({
        type: LegalBasisType.CONSENT,
        name: 'Consent with Flags',
        requiresConsent: true,
        requiresExplicitConsent: false,
        requiresOptIn: true,
        withdrawalSupported: true,
      })

      // Assert
      const result = await getLegalBasisById(consentBasis.id)
      expect(result?.requiresConsent).toBe(true)
      expect(result?.requiresExplicitConsent).toBe(false)
      expect(result?.requiresOptIn).toBe(true)
      expect(result?.withdrawalSupported).toBe(true)
    })

    it('should correctly store and retrieve assessment flags', async () => {
      // Arrange & Act - Create legal basis with assessment flags
      const liaBasis = await new LegalBasisFactory().create({
        type: LegalBasisType.LEGITIMATE_INTERESTS,
        name: 'LIA Required',
        requiresLIA: true,
        requiresBalancingTest: true,
      })

      // Assert
      const result = await getLegalBasisById(liaBasis.id)
      expect(result?.requiresLIA).toBe(true)
      expect(result?.requiresBalancingTest).toBe(true)
    })
  })
})
