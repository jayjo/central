import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export default async function SharedTodosPage() {
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
    redirect(`/${user.org.slug}/shared`)
  }

  // If no org slug, redirect to settings
  redirect('/settings')
}
