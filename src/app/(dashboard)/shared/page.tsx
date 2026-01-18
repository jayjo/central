import { prisma } from '@/lib/db'
import { TodoList } from '@/components/todos/TodoList'

export default async function SharedTodosPage() {
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

  const todos = await prisma.todo.findMany({
    where: {
      AND: [
        { ownerId: { not: user.id } },
        {
          OR: [
            { visibility: 'ORG', owner: { orgId: user.orgId } },
            { sharedWith: { some: { id: user.id } } },
          ],
        },
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
      <h1 className="text-3xl font-bold mb-6">Shared Todos</h1>
      <TodoList todos={todos} />
    </div>
  )
}
