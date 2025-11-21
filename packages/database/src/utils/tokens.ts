import { randomBytes } from 'crypto'

/**
 * Generate a secure random token for invitations
 * Uses cryptographically secure random bytes
 * @returns 32-byte hex string (64 characters)
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Generate a URL-safe slug from a string (e.g., organization name)
 * Converts to lowercase, replaces spaces and special chars with hyphens
 * Removes consecutive hyphens and trims
 * @param name - The string to convert to a slug
 * @returns URL-safe slug string
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Calculate expiration date for invitations (7 days from now)
 * @returns Date object 7 days in the future
 */
export function getInvitationExpiryDate(): Date {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7)
  return expiryDate
}

/**
 * Calculate expiration date for magic links (15 minutes from now)
 * @returns Date object 15 minutes in the future
 */
export function getMagicLinkExpiryDate(): Date {
  const expiryDate = new Date()
  expiryDate.setMinutes(expiryDate.getMinutes() + 15)
  return expiryDate
}
