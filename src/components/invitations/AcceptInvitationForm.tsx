'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Invitation {
  id: string
  email: string
  org: {
    id: string
    name: string
  }
  inviter: {
    name: string | null
    email: string
  }
}

interface AcceptInvitationFormProps {
  invitation: Invitation
}

export function AcceptInvitationForm({ invitation }: AcceptInvitationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(invitation.email)

  async function handleAccept() {
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      toast.error('Email must match the invitation')
      return
    }

    setLoading(true)

    try {
      // First, sign in or create account with magic link
      const result = await signIn('email', {
        email: invitation.email,
        redirect: false,
        callbackUrl: window.location.origin + '/',
      })

      if (result?.error) {
        toast.error('Failed to send sign-in email')
        setLoading(false)
        return
      }

      // Accept the invitation via API
      const response = await fetch(`/api/org/invite/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: window.location.pathname.split('/').pop(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept invitation')
      }

      toast.success('Check your email to sign in and complete the invitation')
      // The magic link will handle the rest when they sign in
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept invitation')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
        <CardDescription>
          {invitation.inviter.name || invitation.inviter.email} has invited you to join{' '}
          <strong>{invitation.org.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            We'll send you a magic link to sign in and join the organization.
          </p>
        </div>
        <Button onClick={handleAccept} className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Accept Invitation'}
        </Button>
      </CardContent>
    </Card>
  )
}
