import { PrismaClient } from '../../index'
import { getTestDatabaseClient } from '../db-helpers'

/**
 * Base factory class for generating test data
 * Provides a fluent interface for building and persisting test objects
 *
 * @template TModel - The Prisma model type
 * @template TBuild - The type of data to build (defaults to TModel)
 *
 * @example
 * class CountryFactory extends Factory<Country> {
 *   protected defaults(): Partial<Country> {
 *     return {
 *       name: 'Test Country',
 *       isoCode: 'TC',
 *       gdprStatus: ['Third Country'],
 *     }
 *   }
 *
 *   protected async persist(data: any): Promise<Country> {
 *     return this.prisma.country.create({ data })
 *   }
 * }
 */
export abstract class Factory<TModel, TBuild = Omit<TModel, 'id' | 'createdAt' | 'updatedAt'>> {
  protected prisma: PrismaClient
  private overrides: Partial<TBuild> = {}
  private sequence = 0

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? getTestDatabaseClient()
  }

  /**
   * Define default values for the factory
   * Override this method in subclasses to provide sensible defaults
   */
  protected abstract defaults(): Partial<TBuild>

  /**
   * Persist the built data to the database
   * Override this method in subclasses to use the correct Prisma model
   */
  protected abstract persist(data: TBuild): Promise<TModel>

  /**
   * Get the next sequence number for generating unique values
   * Useful for creating unique identifiers or avoiding conflicts
   */
  protected nextSequence(): number {
    return ++this.sequence
  }

  /**
   * Create a new factory instance with parameter overrides
   * This allows creating factory variants with different defaults
   *
   * @param overrides - Values to override the defaults
   * @returns A new factory instance with the overrides applied
   *
   * @example
   * const EUCountryFactory = CountryFactory.params({ gdprStatus: ['EU', 'EEA'] })
   */
  params(overrides: Partial<TBuild>): this {
    const FactoryClass = this.constructor as new (prisma?: PrismaClient) => this
    const newFactory = new FactoryClass(this.prisma)
    newFactory.overrides = { ...this.overrides, ...overrides }
    newFactory.sequence = this.sequence
    return newFactory
  }

  /**
   * Build an object with the factory defaults and any overrides
   * Does NOT persist to the database
   *
   * @param overrides - Optional values to override for this specific build
   * @returns The built object ready for use or manual persistence
   *
   * @example
   * const countryData = CountryFactory.build({ name: 'France' })
   */
  build(overrides?: Partial<TBuild>): TBuild {
    const defaults = this.defaults()
    const combined = {
      ...defaults,
      ...this.overrides,
      ...overrides,
    } as TBuild

    return combined
  }

  /**
   * Build and persist an object to the database
   * Combines build() and persist() in one call
   *
   * @param overrides - Optional values to override for this specific creation
   * @returns The persisted model with all database-generated fields (id, timestamps, etc.)
   *
   * @example
   * const country = await CountryFactory.create({ name: 'Germany' })
   */
  async create(overrides?: Partial<TBuild>): Promise<TModel> {
    const data = this.build(overrides)
    return this.persist(data)
  }

  /**
   * Build and persist multiple objects to the database
   * Useful for seeding test data or setting up complex scenarios
   *
   * @param count - Number of objects to create
   * @param overrides - Optional values to override for all created objects
   * @returns Array of persisted models
   *
   * @example
   * const countries = await CountryFactory.createMany(5)
   */
  async createMany(count: number, overrides?: Partial<TBuild>): Promise<TModel[]> {
    const promises = Array.from({ length: count }, async () => this.create(overrides))
    return Promise.all(promises)
  }
}
