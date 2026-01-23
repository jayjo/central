import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export default async function TodoDetailPage({
  params,
}: {
  params: { id: string }
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
    redirect(`/${user.org.slug}/todos/${params.id}`)
  }

  // If no org slug, redirect to settings
  redirect('/settings')
  
  const session = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  }

  const todo = await prisma.todo.findUnique({
    where: { id: params.id },
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
      messages: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!todo) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Todo not found</h1>
      </div>
    )
  }

  // Check access
  const hasAccess =
    todo.ownerId === user.id ||
    todo.sharedWith.some((u) => u.id === user.id) ||
    (todo.visibility === 'ORG' && todo.owner.orgId === user.orgId)

  if (!hasAccess) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Access denied</h1>
      </div>
    )
  }

  const isOwner = todo.ownerId === user.id

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{todo.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Owner: {todo.owner.name || todo.owner.email}</span>
          <span>•</span>
          <span>Created: {formatDate(todo.createdAt)}</span>
          {todo.dueDate && (
            <>
              <span>•</span>
              <span>Due: {formatDate(todo.dueDate)}</span>
            </>
          )}
        </div>
      </div>

      {isOwner ? (
        <EditTodoButton 
          todo={{
            id: todo.id,
            title: todo.title,
            priority: todo.priority,
            dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
            visibility: todo.visibility,
            status: todo.status,
          }} 
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Details</CardTitle>
              <TodoStatusButton
                todoId={todo.id}
                currentStatus={todo.status}
                isOwner={isOwner}
              />
            </div>
          </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm font-medium">Status: </span>
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
          {todo.priority && (
            <div>
              <span className="text-sm font-medium">Priority: </span>
              <span className="text-sm">{todo.priority}</span>
            </div>
          )}
          <div>
            <span className="text-sm font-medium">Visibility: </span>
            <span className="text-sm">{todo.visibility}</span>
          </div>
          {todo.sharedWith.length > 0 && (
            <div>
              <span className="text-sm font-medium">Shared with: </span>
              <span className="text-sm">
                {todo.sharedWith.map((u) => u.name || u.email).join(', ')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Messages ({todo.messages.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todo.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet</p>
          ) : (
            <div className="space-y-4">
              {todo.messages.map((message) => (
                <div key={message.id} className="border-l-2 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {message.author.name || message.author.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              ))}
            </div>
          )}
          <MessageForm todoId={todo.id} />
        </CardContent>
      </Card>
    </div>
  )
}
