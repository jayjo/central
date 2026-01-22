import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getOrgIdFromSlug } from '@/lib/routing'
import { Sidebar } from '@/components/layout/Sidebar'
import { QuickLauncherProvider } from '@/components/quick-launcher/QuickLauncherProvider'
import { OrgSlugProvider } from '@/components/layout/OrgSlugProvider'

export default async function OrgSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgSlug: string }
}) {
  // Resolve org slug to org ID
  const orgId = await getOrgIdFromSlug(params.orgSlug)
  
  if (!orgId) {
    // If org slug doesn't exist, redirect to home
    redirect('/')
  }

  // TODO: Re-enable auth after fixing code verification
  // const session = await getSession()
  // if (!session) {
  //   redirect('/login')
  // }
  
  // Temporary: Create/get a dev user for testing
  const devUser = await prisma.user.findFirst({
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
  
  const session = {
    user: {
      id: devUser.id,
      email: devUser.email,
      name: devUser.name,
    },
  }

  // Get recent todos for the sidebar menu, ordered by due date (soonest first)
  const recentTodos = await prisma.todo.findMany({
    where: {
      OR: [
        { ownerId: devUser.id },
        { sharedWith: { some: { id: devUser.id } } },
      ],
    },
    orderBy: [
      { dueDate: 'asc' },
      { updatedAt: 'desc' },
    ],
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
      priority: true,
      dueDate: true,
      updatedAt: true,
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  })

  return (
    <QuickLauncherProvider>
      <OrgSlugProvider orgSlug={params.orgSlug}>
        <div className="flex h-screen bg-background overflow-hidden">
          <Sidebar userEmail={session.user?.email} todos={recentTodos} currentUserId={devUser.id} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </OrgSlugProvider>
    </QuickLauncherProvider>
  )
}
