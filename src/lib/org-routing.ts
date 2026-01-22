/**
 * Utility functions for generating URLs with org slug
 */

export function getOrgUrl(path: string, orgSlug: string | null): string {
  if (!orgSlug) {
    return path
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // If path is just '/', return org slug root
  if (cleanPath === '' || cleanPath === '/') {
    return `/${orgSlug}`
  }
  
  return `/${orgSlug}/${cleanPath}`
}

export function getTodoUrl(todoId: string, orgSlug: string | null): string {
  return getOrgUrl(`/todos/${todoId}`, orgSlug)
}

export function getMyTodosUrl(orgSlug: string | null): string {
  return getOrgUrl('/my-todos', orgSlug)
}

export function getSharedTodosUrl(orgSlug: string | null): string {
  return getOrgUrl('/shared', orgSlug)
}

export function getSettingsUrl(orgSlug: string | null): string {
  return getOrgUrl('/settings', orgSlug)
}

export function getCalendarUrl(orgSlug: string | null): string {
  return getOrgUrl('/', orgSlug)
}
