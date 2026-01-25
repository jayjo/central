'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AuthMethod = 'email' | 'password'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const switchToPassword = () => {
    setAuthMethod('password')
    setError('')
    setPassword('')
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Pass callbackUrl to make it a magic link instead of code
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: window.location.origin + '/',
      })
      
      if (result?.error) {
        console.error('Sign in result error:', result.error)
        // Map NextAuth error codes to user-friendly messages
        let errorMessage = 'Failed to send email. Please try again.'
        if (result.error === 'EmailSignin') {
          errorMessage = 'Failed to send email. Please check your email address and try again. If the problem persists, check your Resend configuration.'
        } else if (result.error.includes('email') || result.error.includes('Email')) {
          errorMessage = result.error
        }
        setError(errorMessage)
        setLoading(false)
      } else {
        setSubmitted(true)
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      setError(error?.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
      } else if (result?.ok) {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (submitted && authMethod === 'email') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a sign-in link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to sign in. The link will expire in 24 hours.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false)
              setEmail('')
            }}
            className="w-full"
          >
            Use a different email
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          {authMethod === 'email' 
            ? "We'll send you a link to sign in. No password needed."
            : "Sign in with your email and password"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {authMethod === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              <button 
                type="button" 
                onClick={switchToPassword} 
                className="text-primary underline hover:text-primary/80"
              >
                Sign in using your password instead
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-password">Email</Label>
              <Input
                id="email-password"
                type="email"
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Implement forgot password functionality
                    toast.error('Forgot password feature coming soon')
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              <button 
                type="button" 
                onClick={() => {
                  setAuthMethod('email')
                  setError('')
                  setPassword('')
                }} 
                className="text-primary underline hover:text-primary/80"
              >
                Use magic link instead
              </button>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
