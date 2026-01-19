'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameWeek, addDays, subDays, addWeeks, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { TodoCheckbox } from '@/components/todos/TodoCheckbox'
import type { TodoWithRelations } from '@/types'

type ViewMode = 'day' | 'week' | 'month'

interface TodoCalendarProps {
  todos: any[]
  currentUserId?: string
}

export function TodoCalendar({ todos, currentUserId }: TodoCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  
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

  const getTodosForDate = (date: Date) => {
    return todos.filter((todo) => {
      if (!todo.dueDate) return false
      return isSameDay(new Date(todo.dueDate), date)
    })
  }

  const getTodosForPeriod = () => {
    if (viewMode === 'day') {
      return getTodosForDate(currentDate)
    } else if (viewMode === 'week') {
      return todos.filter((todo) => {
        if (!todo.dueDate) return false
        const todoDate = new Date(todo.dueDate)
        return isSameWeek(todoDate, currentDate, { weekStartsOn: 0 })
      })
    } else {
      return todos.filter((todo) => {
        if (!todo.dueDate) return false
        const todoDate = new Date(todo.dueDate)
        return isSameMonth(todoDate, currentDate)
      })
    }
  }

  const periodTodos = getTodosForPeriod()

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {getDateLabel()}
          </h2>
          <div className="flex gap-1 border rounded-md">
            <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="rounded-r-none"
                >
                Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-none"
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="rounded-l-none"
            >
              Day
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
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
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="mb-4">
                {getTodosForDate(currentDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No todos scheduled for this day</p>
                ) : (
                  <div className="space-y-2">
                    {getTodosForDate(currentDate).map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-start gap-2 p-3 rounded-md border hover:bg-accent transition-colors"
                      >
                        <TodoCheckbox
                          todoId={todo.id}
                          currentStatus={todo.status}
                          isOwner={todo.ownerId === currentUserId}
                          size="md"
                        />
                        <Link
                          href={`/todos/${todo.id}`}
                          className="flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${todo.status === 'COMPLETED' ? 'line-through opacity-60' : ''}`}>
                                {todo.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {todo.owner.name || todo.owner.email}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
                        className="flex items-start gap-1 text-xs p-1 rounded bg-accent hover:bg-accent/80 transition-colors group overflow-hidden"
                      >
                        <TodoCheckbox
                          todoId={todo.id}
                          currentStatus={todo.status}
                          isOwner={todo.ownerId === currentUserId}
                          size="sm"
                        />
                        <Link
                          href={`/todos/${todo.id}`}
                          className="flex-1 min-w-0 break-words"
                          title={todo.title}
                          onClick={(e) => e.stopPropagation()}
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
                          className="flex items-start gap-1 text-xs p-1 rounded bg-accent hover:bg-accent/80 transition-colors group overflow-hidden"
                        >
                          <TodoCheckbox
                            todoId={todo.id}
                            currentStatus={todo.status}
                            isOwner={todo.ownerId === currentUserId}
                            size="sm"
                          />
                          <Link
                            href={`/todos/${todo.id}`}
                            className="flex-1 min-w-0 break-words"
                            title={todo.title}
                            onClick={(e) => e.stopPropagation()}
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
