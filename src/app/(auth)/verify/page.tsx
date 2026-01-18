import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VerifyCodeForm } from '@/components/auth/VerifyCodeForm'

export default async function VerifyPage() {
  const session = await getSession()

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-center">Enter your code</h1>
          <p className="mt-2 text-center text-muted-foreground">
            We sent a 6-digit code to your email
          </p>
        </div>
        <VerifyCodeForm />
      </div>
    </div>
  )
}
