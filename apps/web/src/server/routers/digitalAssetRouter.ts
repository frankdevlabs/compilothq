import type { AssetType, IntegrationStatus, LocationRole, Prisma } from '@compilothq/database'
import {
  addAssetProcessingLocations,
  createDigitalAsset,
  deleteDigitalAsset,
  getDigitalAssetById,
  listDigitalAssets,
  updateDigitalAsset,
  validateDigitalAssetWarnings,
} from '@compilothq/database'
import {
  detectAssetCrossBorderTransfers,
  getActivityAssetTransferAnalysis,
} from '@compilothq/database/services/transferDetection'
import {
  AssetTypeSchema,
  DigitalAssetUpdateSchema,
  IntegrationStatusSchema,
  LocationRoleSchema,
} from '@compilothq/validation'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { orgProcedure, router } from '../trpc'
import { handlePrismaError } from '../utils/prisma-errors'

// Input schema for location with refinement
const LocationInputSchema = z
  .object({
    organizationId: z.string().cuid('Invalid organization ID'),
    digitalAssetId: z.string().cuid('Invalid digital asset ID'),
    service: z.string().min(1, 'Service description is required').max(500),
    purposeId: z.string().cuid('Invalid purpose ID').optional().nullable(),
    purposeText: z.string().max(500).optional().nullable(),
    countryId: z.string().cuid('Invalid country ID'),
    locationRole: LocationRoleSchema,
    transferMechanismId: z.string().cuid('Invalid transfer mechanism ID').optional().nullable(),
    isActive: z.boolean().default(true),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .refine((data) => data.purposeId !== null || data.purposeText !== null, {
    message: 'Either purposeId or purposeText must be provided',
    path: ['purposeId'],
  })

export const digitalAssetRouter = router({
  /**
   * Create a new digital asset with optional processing locations
   * Asset is automatically scoped to the current organization
   * Supports atomic creation with locations in a single transaction
   */
  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Asset name is required').max(255),
        type: AssetTypeSchema,
        description: z.string().max(2000).optional().nullable(),
        primaryHostingCountryId: z.string().cuid('Invalid country ID').optional().nullable(),
        hostingDetail: z
          .string()
          .max(255, 'Hosting detail must be 255 characters or less')
          .optional()
          .nullable(),
        url: z.string().url('Invalid URL format').optional().nullable(),
        technicalOwnerId: z.string().cuid('Invalid technical owner ID').optional().nullable(),
        businessOwnerId: z.string().cuid('Invalid business owner ID').optional().nullable(),
        containsPersonalData: z.boolean().default(false),
        integrationStatus: IntegrationStatusSchema.default('NOT_INTEGRATED'),
        lastScannedAt: z.date().optional().nullable(),
        discoveredVia: z.string().max(100).optional().nullable(),
        metadata: z.record(z.string(), z.unknown()).optional().nullable(),
        locations: z.array(LocationInputSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Type-safe casting for DAL function
      return await handlePrismaError(
        createDigitalAsset({
          organizationId: ctx.organizationId, // Inject from session
          name: input.name,
          type: input.type as AssetType,
          description: input.description,
          primaryHostingCountryId: input.primaryHostingCountryId,
          hostingDetail: input.hostingDetail,
          url: input.url,
          technicalOwnerId: input.technicalOwnerId,
          businessOwnerId: input.businessOwnerId,
          containsPersonalData: input.containsPersonalData,
          integrationStatus: input.integrationStatus as IntegrationStatus,
          lastScannedAt: input.lastScannedAt,
          discoveredVia: input.discoveredVia,
          metadata: input.metadata as Prisma.InputJsonValue | null | undefined,
          locations: input.locations?.map((loc) => ({
            ...loc,
            locationRole: loc.locationRole as LocationRole,
            metadata: loc.metadata as Prisma.InputJsonValue | null | undefined,
          })),
        })
      )
    }),

  /**
   * Get a single digital asset by ID
   * Verifies asset belongs to current organization
   * Supports optional relation includes for performance
   */
  getById: orgProcedure
    .input(
      z.object({
        id: z.string().cuid('Invalid asset ID'),
        includeProcessingLocations: z.boolean().optional(),
        includeActivities: z.boolean().optional(),
        includeOwners: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const asset = await getDigitalAssetById(input.id, {
        includeProcessingLocations: input.includeProcessingLocations,
        includeActivities: input.includeActivities,
        includeOwners: input.includeOwners,
      })

      if (!asset || asset.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Digital asset not found',
        })
      }

      return asset
    }),

  /**
   * List all digital assets for the current organization
   * Supports filtering by type, containsPersonalData, and hosting country
   */
  list: orgProcedure
    .input(
      z.object({
        type: AssetTypeSchema.optional(),
        containsPersonalData: z.boolean().optional(),
        primaryHostingCountryId: z.string().cuid('Invalid country ID').optional(),
        includeProcessingLocations: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await listDigitalAssets(ctx.organizationId, {
        type: input.type as AssetType | undefined,
        containsPersonalData: input.containsPersonalData,
        primaryHostingCountryId: input.primaryHostingCountryId,
        includeProcessingLocations: input.includeProcessingLocations,
      })
    }),

  /**
   * Update an existing digital asset
   * Verifies asset belongs to current organization before update
   * Does not update locations (use addLocations or location-specific procedures)
   */
  update: orgProcedure
    .input(
      z.object({
        id: z.string().cuid('Invalid asset ID'),
        data: DigitalAssetUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify asset belongs to this organization
      const asset = await getDigitalAssetById(input.id)

      if (!asset || asset.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Digital asset not found',
        })
      }

      // Type-safe casting for DAL function
      const data = input.data as {
        name?: string
        description?: string | null
        type?: AssetType
        primaryHostingCountryId?: string | null
        hostingDetail?: string | null
        url?: string | null
        technicalOwnerId?: string | null
        businessOwnerId?: string | null
        containsPersonalData?: boolean
        integrationStatus?: IntegrationStatus
        lastScannedAt?: Date | null
        discoveredVia?: string | null
        metadata?: Prisma.InputJsonValue | null
      }

      return await handlePrismaError(
        updateDigitalAsset(input.id, {
          name: data.name,
          description: data.description,
          type: data.type,
          primaryHostingCountryId: data.primaryHostingCountryId,
          hostingDetail: data.hostingDetail,
          url: data.url,
          technicalOwnerId: data.technicalOwnerId,
          businessOwnerId: data.businessOwnerId,
          containsPersonalData: data.containsPersonalData,
          integrationStatus: data.integrationStatus,
          lastScannedAt: data.lastScannedAt,
          discoveredVia: data.discoveredVia,
          metadata: data.metadata,
        })
      )
    }),

  /**
   * Delete a digital asset
   * Verifies asset belongs to current organization before deletion
   * SAFEGUARD: Prevents deletion if asset is linked to any activities
   */
  delete: orgProcedure
    .input(
      z.object({
        id: z.string().cuid('Invalid asset ID'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify asset belongs to this organization
      const asset = await getDigitalAssetById(input.id)

      if (!asset || asset.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Digital asset not found',
        })
      }

      return await handlePrismaError(deleteDigitalAsset(input.id))
    }),

  /**
   * Add processing locations to an existing digital asset
   * Used for post-creation location additions
   * Locations automatically inherit organizationId from parent asset
   */
  addLocations: orgProcedure
    .input(
      z.object({
        assetId: z.string().cuid('Invalid asset ID'),
        locations: z.array(LocationInputSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify asset belongs to this organization
      const asset = await getDigitalAssetById(input.assetId)

      if (!asset || asset.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Digital asset not found',
        })
      }

      // Type-safe casting for DAL function
      const typedLocations = input.locations.map((loc) => ({
        ...loc,
        locationRole: loc.locationRole as LocationRole,
        metadata: loc.metadata as Prisma.InputJsonValue | null | undefined,
      }))

      return await handlePrismaError(addAssetProcessingLocations(input.assetId, typedLocations))
    }),

  /**
   * Validate digital asset and return non-blocking warnings
   * Used to surface configuration hints without blocking persistence
   * Returns array of warnings for missing country, duplicate locations, etc.
   */
  validateWarnings: orgProcedure
    .input(z.object({ assetId: z.string().cuid('Invalid asset ID') }))
    .query(async ({ ctx, input }) => {
      const asset = await getDigitalAssetById(input.assetId)

      if (!asset || asset.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Asset not found',
        })
      }

      return validateDigitalAssetWarnings(asset)
    }),

  /**
   * Detect cross-border transfers for all digital assets in organization
   * Analyzes asset processing locations against organization headquarters
   * Returns transfers requiring safeguards per GDPR Chapter V
   */
  detectAssetTransfers: orgProcedure.query(async ({ ctx }) => {
    return await detectAssetCrossBorderTransfers(ctx.organizationId)
  }),

  /**
   * Analyze cross-border transfers for digital assets linked to a specific activity
   * Combines activity-level and asset-level transfer detection
   * Returns comprehensive transfer analysis for compliance documentation
   */
  analyzeActivityAssetTransfers: orgProcedure
    .input(z.object({ activityId: z.string().cuid('Invalid activity ID') }))
    .query(async ({ input }) => {
      return await getActivityAssetTransferAnalysis(input.activityId)
    }),
})
