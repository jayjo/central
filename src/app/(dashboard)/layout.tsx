import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { QuickLauncherProvider } from '@/components/quick-launcher/QuickLauncherProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Re-enable auth after fixing code verification
  // const session = await getSession()
  // if (!session) {
  //   redirect('/login')
  // }
  
  // Temporary: Create/get a dev user for testing
  const devUser = await prisma.user.findFirst({
    where: { email: 'dev@central.local' },
  }) || await prisma.user.create({
    data: {
      email: 'dev@central.local',
      name: 'Dev User',
      orgId: 'default-org',
    },
  })
  
  const session = {
    user: {
      id: devUser.id,
      email: devUser.email,
      name: devUser.name,
    },
  }

  // Get recent todos for the sidebar menu
  const recentTodos = await prisma.todo.findMany({
    where: {
      OR: [
        { ownerId: devUser.id },
        { sharedWith: { some: { id: devUser.id } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
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
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar userEmail={session.user?.email} todos={recentTodos} currentUserId={devUser.id} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </QuickLauncherProvider>
  )
}
