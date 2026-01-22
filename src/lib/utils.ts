import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isThisWeek, isPast, differenceInDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function getDateHeader(date: Date | null): string {
  if (!date) return 'No Due Date'
  
  const todoDate = new Date(date)
  todoDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (isToday(todoDate)) {
    return 'Today'
  } else if (isTomorrow(todoDate)) {
    return 'Tomorrow'
  } else if (isPast(todoDate)) {
    const daysPast = differenceInDays(today, todoDate)
    if (daysPast === 1) return 'Yesterday'
    return `${daysPast} days ago`
  } else {
    const daysUntil = differenceInDays(todoDate, today)
    if (daysUntil <= 7) {
      return format(todoDate, 'EEEE') // Day of week
    } else if (daysUntil <= 14) {
      return 'Next Week'
    } else {
      return format(todoDate, 'MMMM yyyy') // Month and year
    }
  }
}
