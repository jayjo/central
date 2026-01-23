import { prisma } from '@/lib/db'
import { TodoList } from '@/components/todos/TodoList'
import { getOrgIdFromSlug } from '@/lib/routing'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function OrgSlugSharedTodosPage({
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

  const todos = await prisma.todo.findMany({
    where: {
      AND: [
        { ownerId: { not: user.id } },
        {
          OR: [
            { visibility: 'ORG', owner: { orgId: orgId } },
            { sharedWith: { some: { id: user.id } } },
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
