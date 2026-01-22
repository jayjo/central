import { WeatherCard } from '@/components/dashboard/WeatherCard'
import { MotivationalCard } from '@/components/dashboard/MotivationalCard'
import { getTodayMessage } from '@/lib/db'
import { prisma } from '@/lib/db'
import { TodoCalendar } from '@/components/calendar/TodoCalendar'
import { getOrgIdFromSlug } from '@/lib/routing'
import { redirect } from 'next/navigation'

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

  // TODO: Re-enable auth after fixing code verification
  // Temporary: Use dev user
  const user = await prisma.user.findFirst({
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
      id: user.id,
      email: user.email,
      name: user.name,
    },
  }

  // Verify user belongs to this org
  if (user.orgId !== orgId) {
    redirect('/')
  }

  const message = await getTodayMessage()

  // Get all todos with due dates for the calendar, scoped to this org
  const todos = await prisma.todo.findMany({
    where: {
      AND: [
        {
          OR: [
            { ownerId: user?.id },
            { sharedWith: { some: { id: user?.id } } },
            { visibility: 'ORG', owner: { orgId: orgId } },
          ],
        },
        {
          owner: {
            orgId: orgId,
          },
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
          name: true,
          email: true,
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
      {/* Header with Weather and Quote */}
      <div className="grid grid-cols-2 gap-4 p-6 border-b">
        <WeatherCard zipCode={user?.zipCode} />
        <MotivationalCard message={message} />
      </div>

      {/* Main Content - Calendar */}
      <div className="flex-1 p-6 bg-[#f8f8f8]">
        <TodoCalendar todos={todos} currentUserId={user.id} />
      </div>
    </div>
  )
}
