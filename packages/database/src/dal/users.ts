import type { User, UserPersona } from '../index'
import { prisma } from '../index'

/**
 * Create a new user
 * Note: organizationId is optional to support OAuth signup flow where users
 * create their organization after initial authentication
 */
export async function createUser(data: {
  name: string
  email: string
  organizationId?: string | null
  primaryPersona?: UserPersona
  emailVerified?: Date | null
  image?: string | null
}): Promise<User> {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      organizationId: data.organizationId ?? null,
      primaryPersona: data.primaryPersona ?? 'BUSINESS_OWNER',
      emailVerified: data.emailVerified ?? null,
      image: data.image ?? null,
    },
  })
}

/**
 * Get a user by their ID
 */
export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  })
}

/**
 * Get a user by their email address
 * Includes organization data for authentication context
 * Note: organization may be null for users who haven't completed onboarding
 */
export async function getUserByEmail(
  email: string
): Promise<(User & { organization: { id: string; name: string; slug: string } | null }) | null> {
  return prisma.user.findUnique({
    where: { email },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

/**
 * Get a user by their email (without organization data)
 * Used for checking existence during invitation
 */
export async function getUserByEmailSimple(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  })
}

/**
 * Update a user
 */
export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'name' | 'email' | 'primaryPersona' | 'emailVerified' | 'image'>>
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data,
  })
}

/**
 * Update a user's organization and persona
 * Used when accepting invitations
 */
export async function updateUserOrganization(
  userId: string,
  organizationId: string,
  persona: UserPersona
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      organizationId,
      primaryPersona: persona,
    },
  })
}

/**
 * Delete a user (hard delete)
 */
export async function deleteUser(id: string): Promise<User> {
  return prisma.user.delete({
    where: { id },
  })
}

/**
 * List users by organization with optional filtering
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 */
export async function listUsersByOrganization(
  organizationId: string,
  options?: {
    persona?: UserPersona
    limit?: number
  }
): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      organizationId,
      ...(options?.persona ? { primaryPersona: options.persona } : {}),
    },
    orderBy: { createdAt: 'desc' },
    ...(options?.limit ? { take: options.limit } : {}),
  })
}

/**
 * List users by organization and persona
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 */
export async function listUsersByPersona(
  organizationId: string,
  persona: UserPersona
): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      organizationId,
      primaryPersona: persona,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get count of users in an organization
 * SECURITY: Always filters by organizationId to enforce multi-tenancy
 */
export async function getUsersCount(organizationId: string): Promise<number> {
  return prisma.user.count({
    where: { organizationId },
  })
}
