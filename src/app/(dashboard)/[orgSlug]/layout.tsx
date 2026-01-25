import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getOrgIdFromSlug } from '@/lib/routing'
import { Sidebar } from '@/components/layout/Sidebar'
import { QuickLauncherProvider } from '@/components/quick-launcher/QuickLauncherProvider'
import { OrgSlugProvider } from '@/components/layout/OrgSlugProvider'
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider'

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

  const session = await getSession()
  if (!session?.user?.email) {
    redirect('/login')
  }
  
  // Get the actual logged-in user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { org: true },
  })
  
  if (!user) {
    redirect('/login')
  }
  
  // Verify user belongs to this org
  if (user.orgId !== orgId) {
    redirect('/')
  }

  // Get recent todos for the sidebar menu, ordered by due date (soonest first)
  const recentTodos = await prisma.todo.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { sharedWith: { some: { id: user.id } } },
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
      visibility: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      sharedWith: {
        select: {
          id: true,
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
        <OnboardingProvider userCreatedAt={user.createdAt}>
          <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar userEmail={session.user?.email} todos={recentTodos} currentUserId={user.id} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </OnboardingProvider>
      </OrgSlugProvider>
    </QuickLauncherProvider>
  )
}
