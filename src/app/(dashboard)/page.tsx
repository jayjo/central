import { WeatherCard } from '@/components/dashboard/WeatherCard'
import { MotivationalCard } from '@/components/dashboard/MotivationalCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { getTodayMessage } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  const message = await getTodayMessage()

  // Get recent todos
  const recentTodos = await prisma.todo.findMany({
    where: {
      OR: [
        { ownerId: user?.id },
        { sharedWith: { some: { id: user?.id } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Left column - Main content */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <QuickActions />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Todos</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTodos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No todos yet. Create your first one!
              </p>
            ) : (
              <div className="space-y-2">
                {recentTodos.map((todo) => (
                  <Link
                    key={todo.id}
                    href={`/todos/${todo.id}`}
                    className="block p-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{todo.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {todo.owner.email === session.user.email
                            ? 'You'
                            : todo.owner.name || todo.owner.email}
                          {' • '}
                          {formatDate(todo.updatedAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          todo.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {todo.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right column - Widgets */}
      <div className="space-y-6">
        <WeatherCard zipCode={user?.zipCode} />
        <MotivationalCard message={message} />
      </div>
    </div>
  )
}
