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

/** Formats a stored due date (UTC) as a calendar day so it displays correctly in all timezones. Use for due dates only. */
export function formatDueDate(date: Date | string | null): string {
  if (date == null) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const day = d.getUTCDate()
  return format(new Date(y, m, day), 'MMM d, yyyy')
}

/** Returns YYYY-MM-DD for date inputs using UTC so stored due dates show the correct calendar day in all timezones. */
export function dateToInputValue(date: Date | string | null): string {
  if (date == null) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** True if the stored due date (UTC) falls on the same calendar day as the given local date. */
export function isSameCalendarDay(storedDue: Date | string | null, localDate: Date): boolean {
  if (storedDue == null) return false
  const d = typeof storedDue === 'string' ? new Date(storedDue) : storedDue
  return d.getUTCFullYear() === localDate.getFullYear() && d.getUTCMonth() === localDate.getMonth() && d.getUTCDate() === localDate.getDate()
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
