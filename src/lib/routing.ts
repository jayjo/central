import { prisma } from './db'

/**
 * Get the org slug for a user
 */
export async function getUserOrgSlug(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { org: true },
  })
  return user?.org?.slug || null
}

/**
 * Generate a todo URL, using org slug if available
 */
export async function getTodoUrl(todoId: string, userId?: string): Promise<string> {
  if (userId) {
    const orgSlug = await getUserOrgSlug(userId)
    if (orgSlug) {
      return `/${orgSlug}/todos/${todoId}`
    }
  }
  return `/todos/${todoId}`
}

/**
 * Resolve org slug to org ID
 */
export async function getOrgIdFromSlug(slug: string): Promise<string | null> {
  const org = await prisma.org.findUnique({
    where: { slug },
    select: { id: true },
  })
  return org?.id || null
}
