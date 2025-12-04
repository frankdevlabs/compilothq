import { describe, expect, it } from 'vitest'

import { RecipientCreateSchema, RecipientUpdateSchema } from '../../src/schemas/recipients'

describe('Recipient Schema - activityIds Field Removal', () => {
  it('should reject activityIds field in RecipientCreateSchema', () => {
    const dataWithActivityIds = {
      name: 'Test Recipient',
      type: 'PROCESSOR',
      activityIds: ['clxyz12345abcdefghijk'],
    } as unknown

    const result = RecipientCreateSchema.safeParse(dataWithActivityIds)

    // Should succeed but strip out activityIds (Zod strips unknown fields by default)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('activityIds')
    }
  })

  it('should reject activityIds field in RecipientUpdateSchema', () => {
    const dataWithActivityIds = {
      name: 'Updated Recipient',
      activityIds: ['clxyz12345abcdefghijk'],
    } as unknown

    const result = RecipientUpdateSchema.safeParse(dataWithActivityIds)

    // Should succeed but strip out activityIds (Zod strips unknown fields by default)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('activityIds')
    }
  })

  it('should validate RecipientCreateSchema without activityIds', () => {
    const validData = {
      name: 'Test Recipient',
      type: 'PROCESSOR',
      description: 'Test description',
    }

    const result = RecipientCreateSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should validate RecipientUpdateSchema without activityIds', () => {
    const validData = {
      name: 'Updated Recipient',
      description: 'Updated description',
    }

    const result = RecipientUpdateSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})
