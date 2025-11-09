import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  CountryFactory,
  createEUCountryFactory,
  setupTestDatabase,
  cleanupTestDatabase,
  disconnectTestDatabase,
} from '../../../../src/test-utils'
import { CountryCreateSchema } from '@compilothq/validation/schemas/reference/country'

describe('CountryFactory', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  beforeEach(async () => {
    await cleanupTestDatabase()
  })

  describe('build()', () => {
    it('should generate valid Country data by default', () => {
      // Arrange
      const factory = new CountryFactory()

      // Act
      const countryData = factory.build()

      // Assert
      expect(countryData).toBeDefined()
      expect(countryData.name).toBeDefined()
      expect(countryData.isoCode).toBeDefined()
      expect(countryData.isoCode).toHaveLength(2)
      expect(countryData.gdprStatus).toBeDefined()
      expect(Array.isArray(countryData.gdprStatus)).toBe(true)
      expect(countryData.isActive).toBe(true)

      // Validate against Zod schema
      const result = CountryCreateSchema.safeParse(countryData)
      expect(result.success).toBe(true)
    })

    it('should generate unique ISO codes for multiple builds', () => {
      // Arrange
      const factory = new CountryFactory()

      // Act
      const country1 = factory.build()
      const country2 = factory.build()
      const country3 = factory.build()

      // Assert
      expect(country1.isoCode).not.toBe(country2.isoCode)
      expect(country2.isoCode).not.toBe(country3.isoCode)
      expect(country1.isoCode).not.toBe(country3.isoCode)
    })
  })

  describe('params()', () => {
    it('should override default values with params', () => {
      // Arrange
      const factory = new CountryFactory()

      // Act
      const customFactory = factory.params({
        name: 'Custom Country',
        gdprStatus: ['EU', 'EEA'],
      })
      const countryData = customFactory.build()

      // Assert
      expect(countryData.name).toBe('Custom Country')
      expect(countryData.gdprStatus).toEqual(['EU', 'EEA'])

      // Validate against Zod schema
      const result = CountryCreateSchema.safeParse(countryData)
      expect(result.success).toBe(true)
    })

    it('should allow build() to override params', () => {
      // Arrange
      const factory = new CountryFactory()
      const customFactory = factory.params({
        name: 'Base Name',
        gdprStatus: ['EU', 'EEA'],
      })

      // Act
      const countryData = customFactory.build({
        name: 'Override Name',
      })

      // Assert
      expect(countryData.name).toBe('Override Name')
      expect(countryData.gdprStatus).toEqual(['EU', 'EEA']) // params preserved
    })
  })

  describe('create()', () => {
    it('should persist country to database', async () => {
      // Arrange
      const factory = new CountryFactory()

      // Act
      const country = await factory.create({
        name: 'Test Country',
        isoCode: 'TC',
      })

      // Assert
      expect(country).toBeDefined()
      expect(country.id).toBeDefined()
      expect(country.name).toBe('Test Country')
      expect(country.isoCode).toBe('TC')
      expect(country.createdAt).toBeInstanceOf(Date)
      expect(country.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('createEUCountryFactory()', () => {
    it('should create EU country with correct GDPR status', () => {
      // Arrange
      const factory = createEUCountryFactory()

      // Act
      const countryData = factory.build()

      // Assert
      expect(countryData.gdprStatus).toEqual(['EU', 'EEA'])
      expect(countryData.description).toBe('EU Member State')

      // Validate against Zod schema
      const result = CountryCreateSchema.safeParse(countryData)
      expect(result.success).toBe(true)
    })
  })
})
