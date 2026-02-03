import { isToday, isPast, isFuture, startOfDay } from 'date-fns'

export interface TodoForSection {
  id: string
  title: string
  status: string
  ownerId: string
  dueDate: Date | null
  updatedAt: Date
  priority?: string | null
  owner?: { id: string; name: string | null; email: string; image: string | null }
  visibility?: string
  sharedWith?: Array<{ id: string }>
  _count?: { messages: number }
  [key: string]: unknown
}

/** Normalize stored due date (UTC) to local midnight so today/upcoming comparison is correct. */
function dueAsLocalDate(due: Date | string | null): Date | null {
  if (!due) return null
  const d = typeof due === 'string' ? new Date(due) : due
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
}

export function organizeTodosBySections(todos: TodoForSection[]): {
  today: TodoForSection[]
  upcoming: TodoForSection[]
  completed: TodoForSection[]
} {
  const today: TodoForSection[] = []
  const upcoming: TodoForSection[] = []
  const completed: TodoForSection[] = []
  const now = startOfDay(new Date())

  todos.forEach((todo) => {
    if (todo.status === 'COMPLETED') {
      completed.push(todo)
    } else if (todo.dueDate) {
      const dueDate = dueAsLocalDate(todo.dueDate) ?? now
      if (isToday(dueDate) || isPast(dueDate)) {
        today.push(todo)
      } else if (isFuture(dueDate)) {
        upcoming.push(todo)
      } else {
        today.push(todo)
      }
    } else {
      upcoming.push(todo)
    }
  })

  today.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
  upcoming.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
  completed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return { today, upcoming, completed }
}
