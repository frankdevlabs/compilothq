import type { PrismaClient, ProcessingAct } from '@prisma/client'

import { Factory } from './base-factory'

/**
 * Type for building ProcessingAct data (excludes auto-generated fields)
 */
type ProcessingActBuildData = Omit<ProcessingAct, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Factory for generating ProcessingAct test data
 * Generates valid processing activity data that passes Zod validation
 *
 * @example
 * // Build data without persisting
 * const actData = new ProcessingActFactory().build()
 *
 * // Create and persist to database
 * const act = await new ProcessingActFactory().create({ name: 'Storage' })
 *
 * // Create act that triggers DPIA
 * const dpiaAct = await new ProcessingActFactory()
 *   .params({ triggersDPIA: true })
 *   .create()
 */
export class ProcessingActFactory extends Factory<ProcessingAct, ProcessingActBuildData> {
  /**
   * Define default values for a ProcessingAct
   */
  protected defaults(): Partial<ProcessingActBuildData> {
    const seq = this.nextSequence()

    return {
      name: `Test Processing Act ${seq}`,
      description: `Description of test processing activity ${seq}`,
      examples: [
        `Example operation ${seq}-1`,
        `Example operation ${seq}-2`,
        `Example operation ${seq}-3`,
      ],
      requiresDPA: false,
      triggersDPIA: false,
      gdprArticle: 'Art. 4(2)',
      isActive: true,
    }
  }

  /**
   * Persist the processing act to the database
   */
  protected async persist(data: ProcessingActBuildData): Promise<ProcessingAct> {
    return this.prisma.processingAct.create({
      data: data as Parameters<typeof this.prisma.processingAct.create>[0]['data'],
    })
  }
}

/**
 * Pre-configured factory for processing acts requiring DPA
 * Data Processing Agreement required acts
 */
export const createDPARequiredProcessingActFactory = (prisma?: PrismaClient) =>
  new ProcessingActFactory(prisma).params({
    requiresDPA: true,
    description: 'Processing activity requiring Data Processing Agreement',
  })

/**
 * Pre-configured factory for processing acts triggering DPIA
 * Data Protection Impact Assessment triggered acts
 */
export const createDPIATriggeredProcessingActFactory = (prisma?: PrismaClient) =>
  new ProcessingActFactory(prisma).params({
    triggersDPIA: true,
    description: 'Processing activity triggering Data Protection Impact Assessment',
  })
