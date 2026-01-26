'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { useOrgSlug } from '@/components/layout/OrgSlugProvider'
import type { TodoWithRelations } from '@/types'
import { Avatar } from '@/components/ui/avatar'

export function TodoList({ todos }: { todos: any[] }) {
  const orgSlug = useOrgSlug()
  
  const getTodoUrl = (todoId: string) => {
    if (orgSlug) {
      return `/${orgSlug}/todos/${todoId}`
    }
    return `/todos/${todoId}`
  }
  if (todos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No todos found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <Link key={todo.id} href={getTodoUrl(todo.id)}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={todo.owner?.image}
                  name={todo.owner?.name}
                  alt={todo.owner?.name || todo.owner?.email}
                  isShared={todo.visibility === 'ORG' || (todo.sharedWith && todo.sharedWith.length > 0)}
                  className="shrink-0"
                />
                <div className="flex items-center justify-between flex-1">
                  <div className="flex-1">
                    <h3 className="font-medium">{todo.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {todo.owner.email} • {formatDate(todo.updatedAt)}
                      {todo._count.messages > 0 && (
                        <> • {todo._count.messages} message(s)</>
                      )}
                    </p>
                    </div>
                  <div className="flex items-center gap-2">
                    {todo.priority && (
                      <span className="text-xs px-2 py-1 rounded bg-secondary">
                        {todo.priority}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        todo.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {todo.status}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
