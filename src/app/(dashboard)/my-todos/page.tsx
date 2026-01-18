import { prisma } from '@/lib/db'
import { TodoList } from '@/components/todos/TodoList'
import { CreateTodoForm } from '@/components/todos/CreateTodoForm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function MyTodosPage({
  searchParams,
}: {
  searchParams: { new?: string }
}) {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Todos</h1>
        {!searchParams.new && (
          <a href="/my-todos?new=true">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Todo
              <span className="ml-2">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span>⌘</span>
                  <span>K</span>
                </kbd>
              </span>
            </Button>
          </a>
        )}
      </div>

      {searchParams.new ? (
        <div className="mb-6">
          <CreateTodoForm />
        </div>
      ) : null}

      <TodoList todos={todos} />
    </div>
  )
}
