import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/auth/SignInForm'
import { prisma } from '@/lib/db'

export default async function LoginPage() {
  try {
    const session = await getSession()

    if (session?.user?.email) {
      // Get user's org slug and redirect there
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { org: true },
      })
      
      if (user?.org?.slug) {
        redirect(`/${user.org.slug}`)
      } else if (user) {
        // User exists but no org - redirect to root to create one
        redirect('/')
      }
    }
  } catch (error) {
    // Continue to show login form even if session check fails
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
