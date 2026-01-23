import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user?.email) {
    redirect('/login')
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { org: true },
  })
  
  if (!user) {
    redirect('/login')
  }

  // If user has an org slug, redirect to org-scoped route
  if (user.org?.slug) {
    redirect(`/${user.org.slug}`)
  }

  // If no org slug, redirect to settings to set one up
  redirect('/settings')
}
