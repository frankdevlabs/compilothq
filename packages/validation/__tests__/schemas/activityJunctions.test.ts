import { describe, expect, it } from 'vitest'

import {
  ActivityComponentLinkSchema,
  ActivityComponentUnlinkSchema,
  ActivityDataCategorySyncSchema,
  ActivityDataSubjectSyncSchema,
  ActivityPurposeSyncSchema,
  ActivityRecipientSyncSchema,
} from '../../src/schemas/activities/junctions.schema'

describe('Activity Junction Validation Schemas', () => {
  describe('Sync Operation Schemas', () => {
    it('should validate ActivityPurposeSyncSchema with valid cuid IDs', () => {
      const validData = {
        activityId: 'clxyz12345abcdefghijk',
        purposeIds: ['clxyz12345abcdefghijk', 'clxyz67890abcdefghijk'],
      }

      const result = ActivityPurposeSyncSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject ActivityPurposeSyncSchema with invalid cuid format', () => {
      const invalidData = {
        activityId: 'invalid-uuid-format',
        purposeIds: ['clxyz12345abcdefghijk'],
      }

      const result = ActivityPurposeSyncSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['activityId'])
      }
    })

    it('should allow empty array in sync schemas', () => {
      const validData = {
        activityId: 'clxyz12345abcdefghijk',
        dataCategoryIds: [],
      }

      const result = ActivityDataCategorySyncSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate ActivityDataSubjectSyncSchema with array of cuids', () => {
      const validData = {
        activityId: 'clxyz12345abcdefghijk',
        dataSubjectIds: ['clxyz12345abcdefghijk'],
      }

      const result = ActivityDataSubjectSyncSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject ActivityRecipientSyncSchema with invalid ID in array', () => {
      const invalidData = {
        activityId: 'clxyz12345abcdefghijk',
        recipientIds: ['clxyz12345abcdefghijk', 'not-a-valid-cuid'],
      }

      const result = ActivityRecipientSyncSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['recipientIds', 1])
      }
    })
  })

  describe('Link Operation Schema', () => {
    it('should validate ActivityComponentLinkSchema with valid cuids', () => {
      const validData = {
        activityId: 'clxyz12345abcdefghijk',
        componentIds: ['clxyz12345abcdefghijk', 'clxyz67890abcdefghijk'],
      }

      const result = ActivityComponentLinkSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject ActivityComponentLinkSchema with empty array', () => {
      const invalidData = {
        activityId: 'clxyz12345abcdefghijk',
        componentIds: [],
      }

      const result = ActivityComponentLinkSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['componentIds'])
        expect(result.error.issues[0]?.message).toContain('at least 1')
      }
    })
  })

  describe('Unlink Operation Schema', () => {
    it('should validate ActivityComponentUnlinkSchema with single cuid', () => {
      const validData = {
        activityId: 'clxyz12345abcdefghijk',
        componentId: 'clxyz12345abcdefghijk',
      }

      const result = ActivityComponentUnlinkSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject ActivityComponentUnlinkSchema with invalid cuid', () => {
      const invalidData = {
        activityId: 'clxyz12345abcdefghijk',
        componentId: 'invalid-id',
      }

      const result = ActivityComponentUnlinkSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['componentId'])
      }
    })
  })
})
