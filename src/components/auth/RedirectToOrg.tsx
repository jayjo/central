'use client'

import { useEffect } from 'react'

export function RedirectToOrg({ orgSlug }: { orgSlug: string }) {
  useEffect(() => {
    // Use a small delay to ensure the session cookie is set
    const timer = setTimeout(() => {
      window.location.href = `/${orgSlug}`
    }, 100)

    return () => clearTimeout(timer)
  }, [orgSlug])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
