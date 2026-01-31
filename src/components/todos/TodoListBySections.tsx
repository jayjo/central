'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { isToday, isPast, startOfDay } from 'date-fns'
import { TodoCheckbox } from '@/components/todos/TodoCheckbox'
import { useOrgSlug } from '@/components/layout/OrgSlugProvider'
import { Avatar } from '@/components/ui/avatar'
import { organizeTodosBySections, type TodoForSection } from '@/lib/todo-sections'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface TodoListBySectionsProps {
  todos: TodoForSection[]
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

function TodoCard({
  todo,
  currentUserId,
  getTodoUrl,
}: {
  todo: TodoForSection
  currentUserId?: string
  getTodoUrl: (id: string) => string
}) {
  const isPastDue =
    todo.dueDate &&
    todo.status !== 'COMPLETED' &&
    isPast(startOfDay(new Date(todo.dueDate))) &&
    !isToday(startOfDay(new Date(todo.dueDate)))

  return (
    <Card
      className={`hover:bg-accent transition-colors ${isPastDue ? 'border-l-4 border-l-red-500' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="pt-0.5">
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
            isShared={
              todo.visibility === 'ORG' ||
              (todo.sharedWith && todo.sharedWith.length > 0)
            }
            className="shrink-0"
          />
          <Link href={getTodoUrl(todo.id)} className="flex-1 min-w-0" data-no-warn="true">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-medium text-sm truncate ${todo.status === 'COMPLETED' ? 'line-through opacity-60' : ''} ${isPastDue ? 'text-red-600' : ''}`}
                >
                  {todo.title}
                </h3>
                <p
                  className={`text-xs mt-1 ${isPastDue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}
                >
                  {todo.dueDate
                    ? formatDate(new Date(todo.dueDate))
                    : formatDate(todo.updatedAt)}
                  {isPastDue && ' • Overdue'}
                  {todo._count && todo._count.messages > 0 && (
                    <> • {todo._count.messages} message(s)</>
                  )}
                </p>
              </div>
            </div>
          </Link>
          {todo.priority && (
            <div className="pt-0.5 flex-shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${getPriorityColor(todo.priority)}`}
                title={todo.priority}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function TodoListBySections({ todos, currentUserId }: TodoListBySectionsProps) {
  const orgSlug = useOrgSlug()
  const { today, upcoming, completed } = organizeTodosBySections(todos)

  const getTodoUrl = (todoId: string) => {
    return orgSlug ? `/${orgSlug}/todos/${todoId}` : `/todos/${todoId}`
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
    <Accordion type="multiple" defaultValue={['today', 'upcoming', 'completed']} className="space-y-2">
      <AccordionItem value="today" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline py-4">
          <span className="font-semibold">Today</span>
          <span className="text-muted-foreground text-sm ml-2">({today.length})</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pb-4">
            {today.length === 0 ? (
              <p className="text-sm text-muted-foreground">No todos for today</p>
            ) : (
              today.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  currentUserId={currentUserId}
                  getTodoUrl={getTodoUrl}
                />
              ))
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="upcoming" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline py-4">
          <span className="font-semibold">Upcoming</span>
          <span className="text-muted-foreground text-sm ml-2">({upcoming.length})</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pb-4">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming todos</p>
            ) : (
              upcoming.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  currentUserId={currentUserId}
                  getTodoUrl={getTodoUrl}
                />
              ))
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="completed" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline py-4">
          <span className="font-semibold">Completed</span>
          <span className="text-muted-foreground text-sm ml-2">({completed.length})</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pb-4">
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed todos</p>
            ) : (
              completed.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  currentUserId={currentUserId}
                  getTodoUrl={getTodoUrl}
                />
              ))
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
