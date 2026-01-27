'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function VerifyCodeForm() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code || code.length !== 6) {
      setError('Please enter a 6-character code')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!email) {
        setError('Email is missing. Please go back and sign in again.')
        setLoading(false)
        return
      }

      // Verify the code and get the token
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.toUpperCase().trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code')
      }

      if (!data.token) {
        throw new Error('No token received from server')
      }

      // Redirect to NextAuth's callback URL with the token
      const callbackUrl = `/api/auth/callback/email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(data.token)}&callbackUrl=${encodeURIComponent('/')}`
      window.location.href = callbackUrl
    } catch (err: any) {
      setError('Invalid code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Code</CardTitle>
        <CardDescription>
          Enter the 6-character code sent to {email || 'your email'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="ABC123"
              value={code}
              onChange={(e) => {
                // Allow alphanumeric characters, convert to uppercase, limit to 6 chars
                const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)
                setCode(value)
                setError('')
              }}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
