'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface User {
  id: string
  email: string
  name: string | null
  zipCode: string | null
}

interface Org {
  id: string
  name: string
  slug: string | null
}

export function SettingsForm({ user, org }: { user: User; org: Org }) {
  const router = useRouter()
  const [name, setName] = useState(user.name || '')
  const [zipCode, setZipCode] = useState(user.zipCode || '')
  const [orgSlug, setOrgSlug] = useState(org.slug || '')
  const [loading, setLoading] = useState(false)
  const [slugLoading, setSlugLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugMessage, setSlugMessage] = useState<string>('')
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [profileSaved, setProfileSaved] = useState(true)
  const [locationSaved, setLocationSaved] = useState(true)
  const [slugSaved, setSlugSaved] = useState(true)
  
  const hasProfileChanges = name !== (user.name || '')
  const hasLocationChanges = zipCode !== (user.zipCode || '')
  const hasSlugChanges = orgSlug !== (org.slug || '')
  
  // Check slug availability
  useEffect(() => {
    if (slugCheckTimeoutRef.current) {
      clearTimeout(slugCheckTimeoutRef.current)
    }

    if (!orgSlug) {
      setSlugAvailable(null)
      setSlugMessage('')
      return
    }

    // Validate format
    const slugRegex = /^[a-z0-9-]{3,30}$/
    if (!slugRegex.test(orgSlug)) {
      setSlugAvailable(false)
      setSlugMessage('Slug must be 3-30 characters and contain only lowercase letters, numbers, and hyphens')
      return
    }

    // If slug hasn't changed, it's available
    if (orgSlug === org.slug) {
      setSlugAvailable(true)
      setSlugMessage('This is your current slug')
      return
    }

    // Debounce slug check
    setSlugLoading(true)
    slugCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/org/slug?slug=${encodeURIComponent(orgSlug)}`)
        const data = await response.json()
        
        if (data.available) {
          setSlugAvailable(true)
          setSlugMessage('This slug is available!')
        } else {
          setSlugAvailable(false)
          setSlugMessage(data.error || 'This slug is already taken')
        }
      } catch (error) {
        setSlugAvailable(false)
        setSlugMessage('Error checking slug availability')
      } finally {
        setSlugLoading(false)
      }
    }, 500)

    return () => {
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current)
      }
    }
  }, [orgSlug, org.slug])

  // Warn before navigation if there are unsaved changes
  useUnsavedChanges({
    hasUnsavedChanges: (hasProfileChanges && !profileSaved) || (hasLocationChanges && !locationSaved) || (hasSlugChanges && !slugSaved),
    message: 'You have unsaved changes. Are you sure you want to leave?',
  })

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      toast.success('Profile updated successfully')
      setProfileSaved(true)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleLocationSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode }),
      })

      if (!response.ok) {
        throw new Error('Failed to update location')
      }

      toast.success('Location updated successfully')
      setLocationSaved(true)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update location')
    } finally {
      setLoading(false)
    }
  }

  async function handleOrgSlugSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (!slugAvailable) {
      toast.error('Please choose an available slug')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/org/slug', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: orgSlug }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update organization slug')
      }

      toast.success('Organization slug updated successfully')
      setSlugSaved(true)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update organization slug')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email} disabled />
                <p className="text-sm text-muted-foreground">
                  Your email address cannot be changed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setProfileSaved(false)
                  }}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Set your zip code for weather information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  value={zipCode}
                  onChange={(e) => {
                    setZipCode(e.target.value)
                    setLocationSaved(false)
                  }}
                  placeholder="12345"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Configure your organization's unique URL slug</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleOrgSlugSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Organization Slug</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">https://domain.com/</span>
                    <Input
                      id="orgSlug"
                      type="text"
                      value={orgSlug}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        setOrgSlug(value)
                        setSlugSaved(false)
                      }}
                      placeholder="unique-org-name"
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">/todos/...</span>
                  </div>
                  {slugMessage && (
                    <p className={`text-sm ${
                      slugAvailable === true ? 'text-green-600' : 
                      slugAvailable === false ? 'text-red-600' : 
                      'text-muted-foreground'
                    }`}>
                      {slugLoading ? 'Checking availability...' : slugMessage}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Your organization slug will be used in shareable todo URLs. 
                    Must be 3-30 characters, lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
              </div>
              <Button type="submit" disabled={loading || !slugAvailable || slugLoading}>
                {loading ? 'Saving...' : 'Save Slug'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              More preferences coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
