'use client'

import { useEffect, useRef } from 'react'

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean
  message?: string
}

export function useUnsavedChanges({ hasUnsavedChanges, message = 'You have unsaved changes. Are you sure you want to leave?' }: UseUnsavedChangesOptions) {
  const hasUnsavedRef = useRef(hasUnsavedChanges)

  useEffect(() => {
    hasUnsavedRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  // Warn before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRef.current) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [message])

  // Intercept link clicks and navigation
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href && !link.hasAttribute('data-no-warn')) {
        const href = link.getAttribute('href')
        // Only intercept internal links
        if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
          if (hasUnsavedRef.current) {
            const confirmed = window.confirm(message)
            if (!confirmed) {
              e.preventDefault()
              e.stopPropagation()
              return false
            }
          }
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [hasUnsavedChanges, message])
}
