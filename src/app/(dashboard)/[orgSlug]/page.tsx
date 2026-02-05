import { MobileWeekView } from '@/components/dashboard/MobileWeekView'
import { prisma } from '@/lib/db'
import { TodoCalendar } from '@/components/calendar/TodoCalendar'
import { getOrgIdFromSlug } from '@/lib/routing'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function OrgSlugDashboardPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  // Resolve org slug to org ID
  const orgId = await getOrgIdFromSlug(params.orgSlug)
  
  if (!orgId) {
    redirect('/')
  }

  const session = await getSession()
  if (!session?.user?.email) {
    redirect('/login')
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  
  if (!user) {
    redirect('/login')
  }

  // Verify user belongs to this org
  if (user.orgId !== orgId) {
    redirect('/')
  }

  // Get all todos with due dates for the calendar, scoped to this org
  // Include: user's todos, todos shared with user, and org-visible todos
  const todos = await prisma.todo.findMany({
    where: {
      AND: [
        {
          OR: [
            // User's own todos
            { ownerId: user?.id },
            // Todos explicitly shared with user
            { sharedWith: { some: { id: user?.id } } },
            // Org-visible todos (visible to all in org)
            { visibility: 'ORG', owner: { orgId: orgId } },
          ],
        },
        // Ensure owner is in the same org (for org-visible todos) OR todo is shared with user
        {
          OR: [
            { owner: { orgId: orgId } },
            { sharedWith: { some: { id: user?.id } } },
          ],
        },
      ],
      dueDate: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
      priority: true,
      dueDate: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      visibility: true,
      sharedWith: {
        select: {
          id: true,
        },
      },
      messages: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  return (
    <div className="flex flex-col h-full">
      {/* Mobile: scrolling 7-day list with date headers */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f8f8f8] md:hidden">
        <MobileWeekView todos={todos} currentUserId={user.id} />
      </div>

      {/* Desktop: Calendar */}
      <div className="flex-1 p-6 bg-[#f8f8f8] hidden md:block overflow-hidden">
        <TodoCalendar todos={todos} currentUserId={user.id} />
      </div>
    </div>
  )
}
