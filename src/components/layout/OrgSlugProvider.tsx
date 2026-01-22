'use client'

import { createContext, useContext } from 'react'
import { 
  getOrgUrl, 
  getTodoUrl, 
  getMyTodosUrl, 
  getSharedTodosUrl, 
  getSettingsUrl, 
  getCalendarUrl 
} from '@/lib/org-routing'

const OrgSlugContext = createContext<string | null>(null)

export function OrgSlugProvider({ 
  children, 
  orgSlug 
}: { 
  children: React.ReactNode
  orgSlug: string | null 
}) {
  return (
    <OrgSlugContext.Provider value={orgSlug}>
      {children}
    </OrgSlugContext.Provider>
  )
}

export function useOrgSlug() {
  return useContext(OrgSlugContext)
}

export function useOrgUrl(path: string): string {
  const orgSlug = useOrgSlug()
  return getOrgUrl(path, orgSlug)
}

export function useTodoUrl(todoId: string): string {
  const orgSlug = useOrgSlug()
  return getTodoUrl(todoId, orgSlug)
}

export function useMyTodosUrl(): string {
  const orgSlug = useOrgSlug()
  return getMyTodosUrl(orgSlug)
}

export function useSharedTodosUrl(): string {
  const orgSlug = useOrgSlug()
  return getSharedTodosUrl(orgSlug)
}

export function useSettingsUrl(): string {
  const orgSlug = useOrgSlug()
  return getSettingsUrl(orgSlug)
}

export function useCalendarUrl(): string {
  const orgSlug = useOrgSlug()
  return getCalendarUrl(orgSlug)
}
