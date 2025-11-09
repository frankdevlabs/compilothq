import type { PrismaClient, TransferMechanism, TransferMechanismCategory } from '@prisma/client'

import { Factory } from './base-factory'

/**
 * Type for building TransferMechanism data (excludes auto-generated fields)
 */
type TransferMechanismBuildData = Omit<TransferMechanism, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Factory for generating TransferMechanism test data
 * Generates valid transfer mechanism data that passes Zod validation
 *
 * @example
 * // Build data without persisting
 * const mechanismData = new TransferMechanismFactory().build()
 *
 * // Create and persist to database
 * const mechanism = await new TransferMechanismFactory().create({ name: 'SCCs' })
 *
 * // Create adequacy decision mechanism
 * const adequacy = await new TransferMechanismFactory()
 *   .params({ category: 'ADEQUACY' })
 *   .create()
 */
export class TransferMechanismFactory extends Factory<
  TransferMechanism,
  TransferMechanismBuildData
> {
  /**
   * Define default values for a TransferMechanism
   */
  protected defaults(): Partial<TransferMechanismBuildData> {
    const seq = this.nextSequence()
    const code = `TM${seq.toString().padStart(3, '0')}`

    return {
      code: code,
      name: `Test Transfer Mechanism ${seq}`,
      description: `Description of test transfer mechanism ${seq}`,
      typicalUseCase: `Typical use case for mechanism ${seq}`,
      gdprArticle: 'Art. 46',
      category: 'SAFEGUARD' as TransferMechanismCategory,
      isDerogation: false,
      requiresAdequacy: false,
      requiresDocumentation: true,
      isActive: true,
    }
  }

  /**
   * Persist the transfer mechanism to the database
   */
  protected async persist(data: TransferMechanismBuildData): Promise<TransferMechanism> {
    return this.prisma.transferMechanism.create({
      data,
    })
  }
}

/**
 * Pre-configured factory for adequacy decision mechanisms
 * Based on GDPR Article 45 - adequacy decisions
 */
export const createAdequacyTransferMechanismFactory = (prisma?: PrismaClient) =>
  new TransferMechanismFactory(prisma).params({
    category: 'ADEQUACY' as TransferMechanismCategory,
    gdprArticle: 'Art. 45',
    requiresAdequacy: true,
    isDerogation: false,
    requiresDocumentation: false,
    description: 'Transfer based on adequacy decision',
  })

/**
 * Pre-configured factory for safeguard mechanisms
 * Based on GDPR Article 46 - appropriate safeguards (SCCs, BCRs, etc.)
 */
export const createSafeguardTransferMechanismFactory = (prisma?: PrismaClient) =>
  new TransferMechanismFactory(prisma).params({
    category: 'SAFEGUARD' as TransferMechanismCategory,
    gdprArticle: 'Art. 46',
    requiresAdequacy: false,
    isDerogation: false,
    requiresDocumentation: true,
    description: 'Transfer based on appropriate safeguards',
  })

/**
 * Pre-configured factory for derogation mechanisms
 * Based on GDPR Article 49 - derogations for specific situations
 */
export const createDerogationTransferMechanismFactory = (prisma?: PrismaClient) =>
  new TransferMechanismFactory(prisma).params({
    category: 'DEROGATION' as TransferMechanismCategory,
    gdprArticle: 'Art. 49',
    requiresAdequacy: false,
    isDerogation: true,
    requiresDocumentation: true,
    description: 'Transfer based on derogation for specific situations',
  })
