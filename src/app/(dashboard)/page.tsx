import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function DashboardPage() {
  // TODO: Re-enable auth after fixing code verification
  // const session = await getSession()
  // if (!session?.user?.email) {
  //   redirect('/login')
  // }
  
  // Temporary: Use dev user
  const user = await prisma.user.findFirst({
    where: { email: 'dev@central.local' },
    include: { org: true },
  }) || await prisma.user.create({
    data: {
      email: 'dev@central.local',
      name: 'Dev User',
      orgId: 'default-org',
    },
    include: { org: true },
  })

  // If user has an org slug, redirect to org-scoped route
  if (user.org?.slug) {
    redirect(`/${user.org.slug}`)
  }

  // If no org slug, redirect to settings to set one up
  redirect('/settings')
}
