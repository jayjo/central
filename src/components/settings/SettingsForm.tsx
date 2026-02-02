'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
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
  password: string | null
  image: string | null
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
  const [imageUrl, setImageUrl] = useState(user.image || '')
  const [orgSlug, setOrgSlug] = useState(org.slug || '')
  const [loading, setLoading] = useState(false)
  const [slugLoading, setSlugLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugMessage, setSlugMessage] = useState<string>('')
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [profileSaved, setProfileSaved] = useState(true)
  const [locationSaved, setLocationSaved] = useState(true)
  const [slugSaved, setSlugSaved] = useState(true)
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const hasPassword = !!user.password
  
  // Invitation state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [invitations, setInvitations] = useState<Array<{
    id: string
    email: string
    createdAt: Date
    expires: Date
    inviter: { name: string | null; email: string }
  }>>([])
  
  // Team members state
  const [members, setMembers] = useState<Array<{
    id: string
    email: string
    name: string | null
    createdAt: Date
  }>>([])
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null)
  const [reinvitingInvitationId, setReinvitingInvitationId] = useState<string | null>(null)
  
  const hasProfileChanges = name !== (user.name || '') || imageUrl !== (user.image || '')
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

  // Load invitations and members on mount
  useEffect(() => {
    async function loadInvitations() {
      try {
        const response = await fetch('/api/org/invitations')
        if (response.ok) {
          const data = await response.json()
          setInvitations(data.invitations || [])
        }
      } catch (error) {
        console.error('Failed to load invitations:', error)
      }
    }
    
    async function loadMembers() {
      try {
        const response = await fetch('/api/org/members')
        if (response.ok) {
          const data = await response.json()
          setMembers(data.members || [])
        }
      } catch (error) {
        console.error('Failed to load members:', error)
      }
    }
    
    loadInvitations()
    loadMembers()
  }, [])

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
        body: JSON.stringify({ 
          name: name.trim() || null,
          image: imageUrl.trim() || null,
        }),
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

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setPasswordLoading(true)

    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update password')
      }

      toast.success(hasPassword ? 'Password updated successfully' : 'Password set successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!inviteEmail.trim()) {
      toast.error('Email is required')
      return
    }

    setInviteLoading(true)

    try {
      const response = await fetch('/api/org/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success('Invitation sent successfully')
      setInviteEmail('')
      // Reload invitations
      const invitationsResponse = await fetch('/api/org/invitations')
      if (invitationsResponse.ok) {
        const data = await invitationsResponse.json()
        setInvitations(data.invitations || [])
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return
    }

    setRevokingInvitationId(invitationId)

    try {
      const response = await fetch(`/api/org/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke invitation')
      }

      toast.success('Invitation revoked')
      // Reload invitations
      const invitationsResponse = await fetch('/api/org/invitations')
      if (invitationsResponse.ok) {
        const data = await invitationsResponse.json()
        setInvitations(data.invitations || [])
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke invitation')
    } finally {
      setRevokingInvitationId(null)
    }
  }

  async function handleReinvite(invitationId: string) {
    setReinvitingInvitationId(invitationId)
    try {
      const response = await fetch(`/api/org/invitations/${invitationId}/reinvite`, {
        method: 'POST',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resend invitation')
      }
      toast.success('Invitation resent')
      const invitationsResponse = await fetch('/api/org/invitations')
      if (invitationsResponse.ok) {
        const data = await invitationsResponse.json()
        setInvitations(data.invitations || [])
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation')
    } finally {
      setReinvitingInvitationId(null)
    }
  }

  async function handleRemoveMember(memberId: string, memberEmail: string) {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the organization?`)) {
      return
    }

    setRemovingMemberId(memberId)

    try {
      const response = await fetch(`/api/org/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      toast.success('Member removed from organization')
      // Reload members
      const membersResponse = await fetch('/api/org/members')
      if (membersResponse.ok) {
        const data = await membersResponse.json()
        setMembers(data.members || [])
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member')
    } finally {
      setRemovingMemberId(null)
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
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Profile Picture URL</Label>
                <div className="flex items-center gap-4">
                  {imageUrl && (
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-full object-cover border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="imageUrl"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value)
                        setProfileSaved(false)
                      }}
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter a URL to your profile picture. Leave empty to use initials.
                    </p>
                  </div>
                </div>
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

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage members of your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {members.length > 0 && (
              <div className="space-y-2">
                <Label>Current Members</Label>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {member.name || member.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                          {member.id === user.id && ' • You'}
                        </p>
                      </div>
                      {member.id !== user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.email)}
                          disabled={removingMemberId === member.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Team Invitations</CardTitle>
            <CardDescription>Invite people to join your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>

            {invitations.length > 0 && (
              <div className="space-y-2">
                <Label>Invitations</Label>
                <div className="space-y-2">
                  {invitations.map((invitation) => {
                    const isExpired = new Date(invitation.expires) <= new Date()
                    return (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{invitation.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Invited by {invitation.inviter.name || invitation.inviter.email} •{' '}
                            {new Date(invitation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {isExpired ? (
                            <p className="text-xs text-muted-foreground">
                              Expired {new Date(invitation.expires).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Expires {new Date(invitation.expires).toLocaleDateString()}
                            </p>
                          )}
                          {isExpired ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReinvite(invitation.id)}
                                disabled={reinvitingInvitationId === invitation.id}
                              >
                                {reinvitingInvitationId === invitation.id ? 'Sending...' : 'Reinvite'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeInvitation(invitation.id)}
                                disabled={revokingInvitationId === invitation.id}
                                className="text-destructive hover:text-destructive"
                              >
                                {revokingInvitationId === invitation.id ? 'Revoking...' : 'Revoke'}
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvitation(invitation.id)}
                              disabled={revokingInvitationId === invitation.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {revokingInvitationId === invitation.id ? 'Revoking...' : 'Revoke'}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              {hasPassword ? 'Change your password' : 'Set a password to enable password login'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showPasswordForm ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {hasPassword 
                    ? 'You can sign in with your password or use a magic link.'
                    : 'Set a password to enable password-based sign in. You can still use magic links.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordForm(true)}
                >
                  {hasPassword ? 'Change Password' : 'Set Password'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {hasPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required={hasPassword}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    {hasPassword ? 'New Password' : 'Password'}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className={confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : ''}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600">Passwords do not match</p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                    <p className="text-xs text-green-600">Passwords match</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={passwordLoading || (confirmPassword && newPassword !== confirmPassword) || newPassword.length < 8}
                  >
                    {passwordLoading ? 'Saving...' : hasPassword ? 'Update Password' : 'Set Password'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Admin Section - Only visible to jeff@jayjodesign.com */}
        {user.email.toLowerCase() === 'jeff@jayjodesign.com' && (
          <Card>
            <CardHeader>
              <CardTitle>Admin</CardTitle>
              <CardDescription>Administrative tools and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
              >
                Open Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm('Are you sure you want to sign out?')) {
                  await signOut({ callbackUrl: '/login' })
                }
              }}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
