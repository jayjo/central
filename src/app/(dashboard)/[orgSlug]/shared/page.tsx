import { prisma } from '@/lib/db'
import { TodoList } from '@/components/todos/TodoList'
import { getOrgIdFromSlug } from '@/lib/routing'
import { redirect } from 'next/navigation'

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
