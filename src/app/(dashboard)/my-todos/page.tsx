import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { TodoList } from '@/components/todos/TodoList'

export default async function MyTodosPage() {
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

  const todos = await prisma.todo.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { visibility: 'ORG', owner: { orgId: user.orgId } },
      ],
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      sharedWith: {
        select: {
          id: true,
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
    orderBy: [
      { status: 'asc' },
      { dueDate: { sort: 'asc', nulls: 'last' } },
    ],
  })

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Todos</h1>
      <TodoList todos={todos} />
    </div>
  )
}
