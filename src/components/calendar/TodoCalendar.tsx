'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameWeek, addDays, subDays, addWeeks, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'
import Link from 'next/link'
import { TodoCheckbox } from '@/components/todos/TodoCheckbox'
import { useOrgSlug } from '@/components/layout/OrgSlugProvider'
import type { TodoWithRelations } from '@/types'
import { Avatar } from '@/components/ui/avatar'
import { isSameCalendarDay } from '@/lib/utils'

type ViewMode = 'day' | 'week' | 'month'
type FilterMode = 'all' | 'shared' | 'mine'

interface TodoCalendarProps {
  todos: any[]
  currentUserId?: string
}

const MOBILE_BREAKPOINT = 768

export function TodoCalendar({ todos, currentUserId }: TodoCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const orgSlug = useOrgSlug()

  // Default to day view on mobile (set after mount to avoid hydration mismatch)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT) {
      setViewMode('day')
    }
  }, [])
  
  const getTodoUrl = (todoId: string, highlight: boolean = false) => {
    const baseUrl = orgSlug ? `/${orgSlug}/todos/${todoId}` : `/todos/${todoId}`
    if (highlight) {
      return `${baseUrl}?highlight=${todoId}`
    }
    return baseUrl
  }

  // Keyboard shortcuts for view modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key.toLowerCase()

      // M: Month view
      if (key === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setViewMode('month')
        return
      }

      // W: Week view
      if (key === 'w' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setViewMode('week')
        return
      }

      // D: Day view
      if (key === 'd' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setViewMode('day')
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Get the calendar view start (beginning of week containing month start)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  // Get the calendar view end (end of week containing month end)
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  // All days to display in the calendar grid
  const allCalendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const navigatePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(subDays(currentDate, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(subMonths(currentDate, 1))
    }
  }

  const navigateNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  const getFilteredTodos = () => {
    return todos.filter((todo) => {
      if (filterMode === 'mine') {
        return todo.ownerId === currentUserId
      } else if (filterMode === 'shared') {
        return todo.visibility === 'ORG' || (todo.sharedWith && todo.sharedWith.length > 0) || todo.ownerId !== currentUserId
      }
      // 'all' - no filter
      return true
    })
  }

  const getTodosForDate = (date: Date) => {
    return getFilteredTodos().filter((todo) => {
      if (!todo.dueDate) return false
      return isSameCalendarDay(todo.dueDate, date)
    })
  }

  /** Normalize stored due date to local midnight so week/month comparisons use the intended calendar day. */
  const todoDueAsLocalDate = (due: string | Date | null) => {
    if (!due) return null
    const d = typeof due === 'string' ? new Date(due) : due
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  }

  const getTodosForPeriod = () => {
    const filtered = getFilteredTodos()
    if (viewMode === 'day') {
      return getTodosForDate(currentDate)
    } else if (viewMode === 'week') {
      return filtered.filter((todo) => {
        const local = todoDueAsLocalDate(todo.dueDate)
        return local != null && isSameWeek(local, currentDate, { weekStartsOn: 0 })
      })
    } else {
      return filtered.filter((todo) => {
        const local = todoDueAsLocalDate(todo.dueDate)
        return local != null && isSameMonth(local, currentDate)
      })
    }
  }

  const periodTodos = getTodosForPeriod()

  // Priority color mapping - matches TodosMenu drawer
  const getPriorityColor = (priority: string | null) => {
    if (!priority) return 'bg-gray-300'
    switch (priority) {
      case 'HIGH': return 'bg-red-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const getPriorityClass = (priority: string | null) => {
    if (!priority) return 'priority-none'
    switch (priority) {
      case 'HIGH': return 'priority-high'
      case 'MEDIUM': return 'priority-medium'
      case 'LOW': return 'priority-low'
      default: return 'priority-none'
    }
  }

  const getDateLabel = () => {
    if (viewMode === 'day') {
      const dayTodos = getTodosForDate(currentDate)
      return `${format(currentDate, 'EEEE, MMMM d')} (${dayTodos.length})`
    } else if (viewMode === 'week') {
      return `${format(currentDate, 'MMMM yyyy')} (${periodTodos.length})`
    } else {
      return `${format(currentDate, 'MMMM yyyy')} (${periodTodos.length})`
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="grid grid-cols-3 items-center mb-6">
        <h2 className="text-2xl font-bold">
          {getDateLabel()}
        </h2>
        <div className="flex justify-center gap-4">
          <TooltipProvider>
            <div className="flex gap-1 border rounded-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="rounded-r-none"
                  >
                    Month
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    <span>Month view</span>
                    <Kbd>
                      <span>M</span>
                    </Kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className="rounded-none"
                  >
                    Week
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    <span>Week view</span>
                    <Kbd>
                      <span>W</span>
                    </Kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                    className="rounded-l-none"
                  >
                    Day
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    <span>Day view</span>
                    <Kbd>
                      <span>D</span>
                    </Kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <TooltipProvider>
            <div className="flex gap-1 border rounded-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={filterMode === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterMode('all')}
                    className="rounded-r-none"
                  >
                    All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Show all todos</span>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={filterMode === 'shared' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterMode('shared')}
                    className="rounded-none"
                  >
                    Shared
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Show shared todos only</span>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={filterMode === 'mine' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterMode('mine')}
                    className="rounded-l-none"
                  >
                    Mine
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Show my todos only</span>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === 'day' ? (
        <div className="flex-1">
          <div className="space-y-4">
            {getTodosForDate(currentDate).length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">No todos scheduled for this day</p>
                </CardContent>
              </Card>
            ) : (
              getTodosForDate(currentDate).map((todo) => {
                return (
                  <Card key={todo.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <TodoCheckbox
                            todoId={todo.id}
                            currentStatus={todo.status}
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
                        <div className="flex-1 min-w-0">
                          <Link
                            href={getTodoUrl(todo.id, true)}
                            className="block"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Keep drawer open by dispatching event
                              window.dispatchEvent(new CustomEvent('openTodosMenu'))
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {todo.priority && (
                                  <div 
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(todo.priority)}`}
                                    title={`Priority: ${todo.priority}`}
                                  />
                                )}
                                <h3 className={`font-semibold text-base ${todo.status === 'COMPLETED' ? 'line-through opacity-60' : ''}`}>
                                  {todo.title}
                                </h3>
                              </div>
                              {todo.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {todo.description}
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-3">
                              <p>Owner: {todo.owner.name || todo.owner.email}</p>
                              {todo._count.messages > 0 && (
                                <p className="mt-1">{todo._count.messages} message{todo._count.messages !== 1 ? 's' : ''}</p>
                              )}
                            </div>
                          </Link>
                          {todo.messages && todo.messages.length > 0 && (
                            <div className="mt-3 pt-3 border-t space-y-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent Messages</h4>
                              {todo.messages.slice(-3).map((message: any) => (
                                <div key={message.id} className="text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-xs">
                                      {message.author.name || message.author.email}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(message.createdAt, 'MMM d, h:mm a')}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground line-clamp-2">{message.content}</p>
                                </div>
                              ))}
                              {todo.messages.length > 3 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  +{todo.messages.length - 3} more message{todo.messages.length - 3 !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      ) : viewMode === 'week' ? (
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="flex-1 grid grid-cols-7 gap-2">
            {/* Week days */}
            {daysInWeek.map((day) => {
              const dayTodos = getTodosForDate(day)
              const isToday = isSameDay(day, new Date())

              return (
                <Card
                  key={day.toISOString()}
                  className={`h-full p-2 overflow-hidden relative ${
                    isToday ? 'border-2 border-primary' : ''
                  }`}
                >
                  <div className={`text-sm font-medium absolute top-2 left-2 z-10 ${isToday ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <CardContent className="p-0 overflow-hidden flex flex-col h-full items-start">
                    <div className="space-y-1 overflow-hidden pt-5">
                    {dayTodos.slice(0, 5).map((todo) => (
                      <div
                        key={todo.id}
                        className={`flex items-start gap-1 text-xs p-1 rounded bg-accent hover:bg-accent/80 transition-colors group overflow-hidden border-l-2 ${getPriorityClass(todo.priority)} ${
                          todo.priority === 'HIGH' ? 'border-l-red-500' :
                          todo.priority === 'MEDIUM' ? 'border-l-yellow-500' :
                          todo.priority === 'LOW' ? 'border-l-green-500' :
                          'border-l-transparent'
                        }`}
                        data-priority={todo.priority || 'none'}
                      >
                        <TodoCheckbox
                          todoId={todo.id}
                          currentStatus={todo.status}
                          isOwner={todo.ownerId === currentUserId}
                          size="sm"
                        />
                        <Avatar
                          src={todo.owner?.image}
                          name={todo.owner?.name}
                          alt={todo.owner?.name || todo.owner?.email}
                          isShared={todo.visibility === 'ORG' || (todo.sharedWith && todo.sharedWith.length > 0)}
                          className="w-6 h-6 shrink-0"
                        />
                        <Link
                          href={getTodoUrl(todo.id, true)}
                          className="flex-1 min-w-0 break-words"
                          title={todo.title}
                          onClick={(e) => {
                            e.stopPropagation()
                            // Keep drawer open by dispatching event
                            window.dispatchEvent(new CustomEvent('openTodosMenu'))
                          }}
                        >
                          <span className={`${todo.status === 'COMPLETED' ? 'line-through opacity-60' : ''} break-words`}>
                            {todo.title}
                          </span>
                        </Link>
                      </div>
                    ))}
                    {dayTodos.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayTodos.length - 5} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* All calendar days (including previous/next month) */}
          {allCalendarDays.map((day) => {
            const dayTodos = getTodosForDate(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)

            return (
              <Card
                key={day.toISOString()}
                className={`min-h-[100px] p-2 overflow-hidden relative items-start ${
                  isToday ? 'border-2 border-primary' : ''
                } ${!isCurrentMonth ? 'opacity-50 bg-muted/30' : ''}`}
              >
                <div className={`text-sm font-medium absolute top-2 left-2 z-10 ${
                  isToday ? 'text-primary' : !isCurrentMonth ? 'text-muted-foreground' : ''
                }`}>
                  {format(day, 'd')}
                </div>
                <CardContent className="p-0 overflow-hidden flex flex-col items-start">
                  {isCurrentMonth && (
                    <div className="space-y-1 overflow-hidden pt-5">
                      {dayTodos.slice(0, 3).map((todo) => (
                        <div
                          key={todo.id}
                          className={`flex items-start gap-1 text-xs p-1 rounded bg-accent hover:bg-accent/80 transition-colors group overflow-hidden border-l-2 ${getPriorityClass(todo.priority)} ${
                            todo.priority === 'HIGH' ? 'border-l-red-500' :
                            todo.priority === 'MEDIUM' ? 'border-l-yellow-500' :
                            todo.priority === 'LOW' ? 'border-l-green-500' :
                            'border-l-transparent'
                          }`}
                          data-priority={todo.priority || 'none'}
                        >
                          <TodoCheckbox
                            todoId={todo.id}
                            currentStatus={todo.status}
                            isOwner={todo.ownerId === currentUserId}
                            size="sm"
                          />
                          <Avatar
                            src={todo.owner?.image}
                            name={todo.owner?.name}
                            alt={todo.owner?.name || todo.owner?.email}
                            isShared={todo.visibility === 'ORG' || (todo.sharedWith && todo.sharedWith.length > 0)}
                            className="w-5 h-5 shrink-0"
                          />
                          <Link
                            href={getTodoUrl(todo.id, true)}
                            className="flex-1 min-w-0 break-words"
                            title={todo.title}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Keep drawer open by dispatching event
                              window.dispatchEvent(new CustomEvent('openTodosMenu'))
                            }}
                          >
                            <span className={`${todo.status === 'COMPLETED' ? 'line-through opacity-60' : ''} break-words`}>
                              {todo.title}
                            </span>
                          </Link>
                        </div>
                      ))}
                      {dayTodos.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayTodos.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
