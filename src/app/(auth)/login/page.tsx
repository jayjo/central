import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/auth/SignInForm'

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-center">Welcome to Nuclio</h1>
          <p className="mt-2 text-center text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
