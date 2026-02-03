'use client'

import { format, isToday, addDays, startOfDay } from 'date-fns'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { TodoCheckbox } from '@/components/todos/TodoCheckbox'
import { useOrgSlug } from '@/components/layout/OrgSlugProvider'
import { Avatar } from '@/components/ui/avatar'
import { isSameCalendarDay } from '@/lib/utils'

interface Todo {
  id: string
  title: string
  status: string
  ownerId: string
  priority: string | null
  dueDate: Date | null
  owner?: { id: string; name: string | null; email: string; image: string | null }
  visibility?: string
  sharedWith?: Array<{ id: string }>
  _count?: { messages: number }
  description?: string | null
}

interface MobileWeekViewProps {
  todos: Todo[]
  currentUserId?: string
}

function getPriorityColor(priority: string | null) {
  if (!priority) return 'bg-gray-300'
  switch (priority) {
    case 'HIGH': return 'bg-red-500'
    case 'MEDIUM': return 'bg-yellow-500'
    case 'LOW': return 'bg-green-500'
    default: return 'bg-gray-300'
  }
}

export function MobileWeekView({ todos, currentUserId }: MobileWeekViewProps) {
  const orgSlug = useOrgSlug()
  const today = startOfDay(new Date())
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))

  const getTodoUrl = (todoId: string) => {
    return orgSlug ? `/${orgSlug}/todos/${todoId}` : `/todos/${todoId}`
  }

  const getTodosForDay = (date: Date) => {
    return todos.filter((todo) => todo.dueDate && isSameCalendarDay(todo.dueDate, date))
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {days.map((date) => {
        const dayTodos = getTodosForDay(date)
        const dateLabel = isToday(date) ? 'Today' : format(date, 'EEEE, MMM d')
        return (
          <section key={date.toISOString()}>
            <h2 className="text-lg font-semibold text-foreground mb-3 sticky top-0 bg-[#f8f8f8] py-2 z-10 border-b">
              {dateLabel}
            </h2>
            {dayTodos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No todos</p>
            ) : (
              <ul className="space-y-2">
                {dayTodos.map((todo) => (
                  <li key={todo.id}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <TodoCheckbox
                              todoId={todo.id}
                              currentStatus={todo.status as 'OPEN' | 'COMPLETED'}
                              isOwner={todo.ownerId === currentUserId}
                              size="md"
                            />
                          </div>
                          <Avatar
                            src={todo.owner?.image}
                            name={todo.owner?.name}
                            alt={todo.owner?.name || todo.owner?.email}
                            isShared={todo.visibility === 'ORG' || (todo.sharedWith && todo.sharedWith.length > 0)}
                            className="shrink-0"
                          />
                          <Link href={getTodoUrl(todo.id)} className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {todo.priority && (
                                  <div
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(todo.priority)}`}
                                    title={todo.priority}
                                  />
                                )}
                                <h3
                                  className={`font-semibold text-base truncate ${todo.status === 'COMPLETED' ? 'line-through opacity-60' : ''}`}
                                >
                                  {todo.title}
                                </h3>
                              </div>
                            </div>
                            {todo.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{todo.description}</p>
                            )}
                            {todo._count && todo._count.messages > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {todo._count.messages} message{todo._count.messages !== 1 ? 's' : ''}
                              </p>
                            )}
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
