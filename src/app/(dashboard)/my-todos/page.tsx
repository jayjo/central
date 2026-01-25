import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export default async function MyTodosPage({
  searchParams,
}: {
  searchParams: { new?: string }
}) {
  const session = await getSession()
  if (!session?.user?.email) {
    redirect('/login')
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { org: true },
  })
  
  if (!user) {
    redirect('/login')
  }

  // If user has an org slug, redirect to org-scoped route
  if (user.org?.slug) {
    const query = searchParams.new ? '?new=true' : ''
    redirect(`/${user.org.slug}/my-todos${query}`)
  }

  // If no org slug, redirect to settings
  redirect('/settings')

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href="/my-todos?new=true">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Todo
                    <span className="ml-2">
                      <Kbd>
                        <span>N</span>
                      </Kbd>
                    </span>
                  </Button>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Create new todo</span>
                  <Kbd>
                    <span>N</span>
                  </Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {searchParams.new ? (
        <div className="mb-6" key="create-todo-form">
          <CreateTodoForm />
        </div>
      ) : null}

      <TodoList todos={todos} />
    </div>
  )
}
