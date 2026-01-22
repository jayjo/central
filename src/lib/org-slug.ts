/**
 * Utility functions for generating and managing org slugs
 */

/**
 * Generate a slug from an org ID (cuid)
 * Since cuid() generates unique IDs, we can use the org ID directly as the slug
 */
export function generateSlugFromOrgId(orgId: string): string {
  // Use the org ID directly as the slug
  // cuid() already generates URL-safe, unique identifiers
  return orgId
}
