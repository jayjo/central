import { prisma } from '@/lib/db'
import { TodoList } from '@/components/todos/TodoList'
import { CreateTodoForm } from '@/components/todos/CreateTodoForm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'
import { getOrgIdFromSlug } from '@/lib/routing'
import { redirect } from 'next/navigation'
import { getMyTodosUrl } from '@/lib/org-routing'
import { getSession } from '@/lib/auth'

export default async function OrgSlugMyTodosPage({
  params,
  searchParams,
}: {
  params: { orgSlug: string }
  searchParams: { new?: string }
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

  const todos = await prisma.todo.findMany({
    where: {
      AND: [
        {
          OR: [
            { ownerId: user.id },
            { visibility: 'ORG', owner: { orgId: orgId } },
          ],
        },
        {
          owner: {
            orgId: orgId,
          },
        },
      ],
    },
    include: {
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

  const myTodosUrl = getMyTodosUrl(params.orgSlug)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Todos</h1>
        {!searchParams.new && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href={`${myTodosUrl}?new=true`}>
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
