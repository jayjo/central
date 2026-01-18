import { WeatherCard } from '@/components/dashboard/WeatherCard'
import { MotivationalCard } from '@/components/dashboard/MotivationalCard'
import { getTodayMessage } from '@/lib/db'
import { prisma } from '@/lib/db'
import { TodoCalendar } from '@/components/calendar/TodoCalendar'

export default async function DashboardPage() {
  // TODO: Re-enable auth after fixing code verification
  // const session = await getSession()
  // if (!session?.user?.email) {
  //   redirect('/login')
  // }
  
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

  const message = await getTodayMessage()

  // Get all todos with due dates for the calendar
  const todos = await prisma.todo.findMany({
    where: {
      OR: [
        { ownerId: user?.id },
        { sharedWith: { some: { id: user?.id } } },
        { visibility: 'ORG', owner: { orgId: user.orgId } },
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
      dueDate: true,
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
      <div className="flex-1 p-6">
        <TodoCalendar todos={todos} currentUserId={user.id} />
      </div>
    </div>
  )
}
