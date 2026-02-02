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
  try {
    // Exclude certain paths that shouldn't be treated as org slugs - CHECK FIRST
    const excludedPaths = ['favicon.ico', 'api', 'admin', '_next', 'login', 'settings', 'todos', 'my-todos', 'shared']
    const orgSlugLower = params.orgSlug.toLowerCase()
    const hasFileExtension = params.orgSlug.includes('.')
    
    if (excludedPaths.includes(orgSlugLower) || hasFileExtension) {
      // This is not an org slug, return 404
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">404</h1>
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </div>
      )
    }
    
    const session = await getSession()
    
    if (!session?.user?.email) {
      redirect('/login')
    }
    
    // Get the actual logged-in user FIRST
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { org: true },
    })
    
    if (!user) {
      redirect('/login')
    }
    
    // If user's org slug matches the requested slug, allow access immediately
    // This handles the case where getOrgIdFromSlug might fail but the user owns the org
    if (user.org?.slug !== params.orgSlug) {
      // Try to resolve org slug to org ID
      const orgId = await getOrgIdFromSlug(params.orgSlug)
      
      if (!orgId) {
        // Org slug doesn't exist, redirect to user's own org
        if (user.org?.slug) {
          redirect(`/${user.org.slug}`)
        }
        redirect('/settings')
      } else {
        // Verify user belongs to this org
        if (user.orgId !== orgId) {
          if (user.org?.slug) {
            redirect(`/${user.org.slug}`)
          }
          redirect('/settings')
        }
      }
    }

    // Get recent todos for the sidebar menu (own, shared with user, org-visible), ordered by due date
    const recentTodos = await prisma.todo.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { sharedWith: { some: { id: user.id } } },
        { visibility: 'ORG', owner: { orgId: user.orgId } },
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
          <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar userEmail={session.user?.email} todos={recentTodos} currentUserId={user.id} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </OrgSlugProvider>
      </QuickLauncherProvider>
    )
  } catch (error) {
    // If there's a database error, redirect to login
    redirect('/login')
  }
}
