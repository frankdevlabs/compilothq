import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  findInvitationByToken,
  findPendingInvitationByEmail,
  getInvitationById,
  listInvitationsByOrganization,
  markExpiredInvitations,
  resendInvitation,
} from '../../../src/dal/invitations'
import type { Invitation, Organization, User } from '../../../src/index'
import { prisma } from '../../../src/index'
import { cleanupTestOrganizations, createTestOrganization } from '../../../src/test-utils/factories'

/**
 * Invitations DAL - Integration Tests
 *
 * Tests invitation data access layer functions against a real test database.
 * Uses hybrid setup: shared data for read operations, per-test data for mutations.
 *
 * Coverage goals:
 * - All CRUD operations
 * - Multi-tenancy isolation
 * - Token security
 * - Expiration handling
 * - Status transitions
 */
describe('Invitations DAL - Integration Tests', () => {
  // Shared data for READ-ONLY tests (faster)
  let sharedOrg1: Organization
  let sharedOrg2: Organization
  let sharedDpo1: User
  let sharedDpo2: User
  let sharedInvitation: Invitation

  beforeAll(async () => {
    // Create shared test organizations with DPOs for read operations
    const { org: org1, users: users1 } = await createTestOrganization({
      slug: 'invitations-dal-org1',
      userCount: 1,
    })
    const { org: org2, users: users2 } = await createTestOrganization({
      slug: 'invitations-dal-org2',
      userCount: 1,
    })

    sharedOrg1 = org1
    sharedOrg2 = org2
    sharedDpo1 = users1[0]!
    sharedDpo2 = users2[0]!

    // Create a shared invitation for read tests
    sharedInvitation = await createInvitation({
      email: 'shared-invite@example.com',
      organizationId: sharedOrg1.id,
      invitedBy: sharedDpo1.id,
      invitedPersona: 'PRIVACY_OFFICER',
    })
  })

  afterAll(async () => {
    // Cleanup shared test data
    await cleanupTestOrganizations([sharedOrg1.id, sharedOrg2.id])
  })

  describe('createInvitation', () => {
    it('should create invitation with generated token and expiry date', async () => {
      // Arrange
      const invitationData = {
        email: 'new-member@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER' as const,
      }

      // Act
      const result = await createInvitation(invitationData)

      // Assert - Verify data integrity
      expect(result).toBeDefined()
      expect(result.email).toBe(invitationData.email)
      expect(result.organizationId).toBe(invitationData.organizationId)
      expect(result.invitedBy).toBe(invitationData.invitedBy)
      expect(result.invitedPersona).toBe(invitationData.invitedPersona)
      expect(result.status).toBe('PENDING')

      // Verify token is generated (64 char hex string)
      expect(result.token).toMatch(/^[a-f0-9]{64}$/)

      // Verify expiry is ~7 days in future (allow 1 minute variance)
      const expectedExpiry = new Date()
      expectedExpiry.setDate(expectedExpiry.getDate() + 7)
      const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime())
      expect(timeDiff).toBeLessThan(60000) // Less than 1 minute difference

      // Verify timestamps
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.acceptedAt).toBeNull()
    })

    it('should generate unique tokens for multiple invitations', async () => {
      // Act - Create multiple invitations
      const invite1 = await createInvitation({
        email: 'member1@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      const invite2 = await createInvitation({
        email: 'member2@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Assert - Tokens must be unique
      expect(invite1.token).not.toBe(invite2.token)
    })
  })

  describe('findInvitationByToken', () => {
    it('should retrieve invitation with organization and inviter data', async () => {
      // Act
      const result = await findInvitationByToken(sharedInvitation.token)

      // Assert - Verify data and includes
      expect(result).toBeDefined()
      expect(result?.id).toBe(sharedInvitation.id)
      expect(result?.email).toBe(sharedInvitation.email)

      // Verify organization include
      expect(result?.organization).toBeDefined()
      expect(result?.organization.id).toBe(sharedOrg1.id)
      expect(result?.organization.name).toBe(sharedOrg1.name)
      expect(result?.organization.slug).toBe(sharedOrg1.slug)

      // Verify inviter include
      expect(result?.inviter).toBeDefined()
      expect(result?.inviter.id).toBe(sharedDpo1.id)
      expect(result?.inviter.name).toBe(sharedDpo1.name)
      expect(result?.inviter.email).toBe(sharedDpo1.email)
    })

    it('should return null when token does not exist', async () => {
      // Act - Query with non-existent token (valid format)
      const result = await findInvitationByToken('0'.repeat(64))

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getInvitationById', () => {
    it('should retrieve invitation by ID', async () => {
      // Act
      const result = await getInvitationById(sharedInvitation.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(sharedInvitation.id)
      expect(result?.email).toBe(sharedInvitation.email)
      expect(result?.organizationId).toBe(sharedOrg1.id)
    })

    it('should return null when invitation ID does not exist', async () => {
      // Act
      const result = await getInvitationById('00000000-0000-0000-0000-000000000000')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('acceptInvitation', () => {
    it('should update invitation status to ACCEPTED and set acceptedAt', async () => {
      // Arrange - Create invitation to accept
      const invitation = await createInvitation({
        email: 'accept-test@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Act
      const result = await acceptInvitation(invitation.token)

      // Assert
      expect(result.status).toBe('ACCEPTED')
      expect(result.acceptedAt).toBeInstanceOf(Date)
      expect(result.acceptedAt).not.toBeNull()
      // acceptedAt should be at or after createdAt (database can be very fast)
      expect(result.acceptedAt?.getTime()).toBeGreaterThanOrEqual(invitation.createdAt.getTime())
    })

    it('should throw error when invitation token does not exist', async () => {
      // Act & Assert
      await expect(acceptInvitation('0'.repeat(64))).rejects.toThrow()
    })
  })

  describe('cancelInvitation', () => {
    it('should update invitation status to CANCELLED', async () => {
      // Arrange - Create invitation to cancel
      const invitation = await createInvitation({
        email: 'cancel-test@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Act
      const result = await cancelInvitation(invitation.id)

      // Assert
      expect(result.status).toBe('CANCELLED')
      expect(result.id).toBe(invitation.id)
    })

    it('should throw error when invitation ID does not exist', async () => {
      // Act & Assert
      await expect(cancelInvitation('00000000-0000-0000-0000-000000000000')).rejects.toThrow()
    })
  })

  describe('resendInvitation', () => {
    it('should generate new token and reset expiration', async () => {
      // Arrange - Create invitation to resend
      const originalInvitation = await createInvitation({
        email: 'resend-test@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      const originalToken = originalInvitation.token

      // Act
      const result = await resendInvitation(originalInvitation.id)

      // Assert - Verify new token generated
      expect(result.token).not.toBe(originalToken)
      expect(result.token).toMatch(/^[a-f0-9]{64}$/)

      // Verify expiry is ~7 days from now (actual business requirement)
      const expectedExpiry = new Date()
      expectedExpiry.setDate(expectedExpiry.getDate() + 7)
      const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime())
      expect(timeDiff).toBeLessThan(60000) // Less than 1 minute difference

      // Verify status reset to PENDING
      expect(result.status).toBe('PENDING')
    })

    it('should reset status to PENDING even if invitation was EXPIRED', async () => {
      // Arrange - Create expired invitation
      const invitation = await createInvitation({
        email: 'expired-resend@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Manually mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      })

      // Act
      const result = await resendInvitation(invitation.id)

      // Assert - Status should be reset to PENDING
      expect(result.status).toBe('PENDING')
    })
  })

  describe('listInvitationsByOrganization', () => {
    it('should return only invitations for specified organization', async () => {
      // Arrange - Create invitations for both orgs
      await createInvitation({
        email: 'org1-invite1@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      await createInvitation({
        email: 'org1-invite2@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      await createInvitation({
        email: 'org2-invite@example.com',
        organizationId: sharedOrg2.id,
        invitedBy: sharedDpo2.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Act - List org1 invitations
      const org1Invitations = await listInvitationsByOrganization(sharedOrg1.id)

      // Assert - Verify multi-tenancy isolation
      expect(org1Invitations.length).toBeGreaterThanOrEqual(3) // At least our 3 new ones
      expect(org1Invitations.every((inv) => inv.organizationId === sharedOrg1.id)).toBe(true)

      // Verify inviter data is included
      expect(org1Invitations[0]?.inviter).toBeDefined()
      expect(org1Invitations[0]?.inviter.id).toBe(sharedDpo1.id)
    })

    it('should filter by status when specified', async () => {
      // Arrange - Create invitations with different statuses
      const pendingInvite = await createInvitation({
        email: 'status-pending@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      const acceptedInvite = await createInvitation({
        email: 'status-accepted@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      await acceptInvitation(acceptedInvite.token)

      // Act - List only PENDING invitations
      const pendingInvitations = await listInvitationsByOrganization(sharedOrg1.id, {
        status: 'PENDING',
      })

      // Assert - All should be PENDING
      expect(pendingInvitations.every((inv) => inv.status === 'PENDING')).toBe(true)
      expect(pendingInvitations.some((inv) => inv.id === pendingInvite.id)).toBe(true)
      expect(pendingInvitations.some((inv) => inv.id === acceptedInvite.id)).toBe(false)
    })

    it('should limit results when limit option is specified', async () => {
      // Act - List with limit
      const limitedInvitations = await listInvitationsByOrganization(sharedOrg1.id, { limit: 2 })

      // Assert
      expect(limitedInvitations).toHaveLength(2)
    })

    it('should return invitations ordered by createdAt descending', async () => {
      // Arrange - Create invitations sequentially
      const invite1 = await createInvitation({
        email: 'order-test1@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))

      const invite2 = await createInvitation({
        email: 'order-test2@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Act
      const invitations = await listInvitationsByOrganization(sharedOrg1.id)

      // Assert - Most recent first
      const invite2Index = invitations.findIndex((inv) => inv.id === invite2.id)
      const invite1Index = invitations.findIndex((inv) => inv.id === invite1.id)
      expect(invite2Index).toBeLessThan(invite1Index)
    })
  })

  describe('findPendingInvitationByEmail', () => {
    it('should find pending invitation for email and organization', async () => {
      // Arrange - Create pending invitation
      const invitation = await createInvitation({
        email: 'pending-find@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Act
      const result = await findPendingInvitationByEmail('pending-find@example.com', sharedOrg1.id)

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(invitation.id)
      expect(result?.email).toBe('pending-find@example.com')
      expect(result?.status).toBe('PENDING')
    })

    it('should return null when no pending invitation exists for email', async () => {
      // Act
      const result = await findPendingInvitationByEmail(
        'non-existent-email@example.com',
        sharedOrg1.id
      )

      // Assert
      expect(result).toBeNull()
    })

    it('should return null when invitation exists but is not PENDING', async () => {
      // Arrange - Create and accept invitation
      const invitation = await createInvitation({
        email: 'accepted-find@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      await acceptInvitation(invitation.token)

      // Act
      const result = await findPendingInvitationByEmail('accepted-find@example.com', sharedOrg1.id)

      // Assert - Should not find ACCEPTED invitation
      expect(result).toBeNull()
    })

    it('should enforce organization isolation', async () => {
      // Arrange - Create invitation for org1
      await createInvitation({
        email: 'org-isolation@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Act - Try to find invitation in org2
      const result = await findPendingInvitationByEmail('org-isolation@example.com', sharedOrg2.id)

      // Assert - Should not find invitation from different org
      expect(result).toBeNull()
    })
  })

  describe('markExpiredInvitations', () => {
    it('should mark past-expiry PENDING invitations as EXPIRED', async () => {
      // Arrange - Create invitation with past expiry
      const invitation = await createInvitation({
        email: 'expired-mark@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Manually set expiry to past date
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // Yesterday

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { expiresAt: pastDate },
      })

      // Act
      const count = await markExpiredInvitations()

      // Assert - At least 1 invitation marked as expired
      expect(count).toBeGreaterThanOrEqual(1)

      // Verify invitation status updated
      const updatedInvitation = await getInvitationById(invitation.id)
      expect(updatedInvitation?.status).toBe('EXPIRED')
    })

    it('should not mark future invitations as expired', async () => {
      // Arrange - Create invitation with future expiry (default)
      const invitation = await createInvitation({
        email: 'future-mark@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Act
      await markExpiredInvitations()

      // Assert - Invitation should still be PENDING
      const updatedInvitation = await getInvitationById(invitation.id)
      expect(updatedInvitation?.status).toBe('PENDING')
    })

    it('should not mark non-PENDING invitations as expired', async () => {
      // Arrange - Create accepted invitation with past expiry
      const invitation = await createInvitation({
        email: 'accepted-expired@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      await acceptInvitation(invitation.token)

      // Set expiry to past
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { expiresAt: pastDate },
      })

      // Act
      await markExpiredInvitations()

      // Assert - Status should remain ACCEPTED, not EXPIRED
      const updatedInvitation = await getInvitationById(invitation.id)
      expect(updatedInvitation?.status).toBe('ACCEPTED')
    })

    it('should return count of marked invitations', async () => {
      // Arrange - Create multiple expired invitations
      const invite1 = await createInvitation({
        email: 'count-test1@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      const invite2 = await createInvitation({
        email: 'count-test2@example.com',
        organizationId: sharedOrg1.id,
        invitedBy: sharedDpo1.id,
        invitedPersona: 'PRIVACY_OFFICER',
      })

      // Set both to expired
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      await prisma.invitation.updateMany({
        where: { id: { in: [invite1.id, invite2.id] } },
        data: { expiresAt: pastDate },
      })

      // Act
      const count = await markExpiredInvitations()

      // Assert - Should have marked at least our 2 invitations
      expect(count).toBeGreaterThanOrEqual(2)
    })
  })
})
