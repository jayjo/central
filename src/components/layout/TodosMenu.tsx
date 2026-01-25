'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { isToday, isPast, isFuture, startOfDay } from 'date-fns'
import { TodoCheckbox } from '@/components/todos/TodoCheckbox'
import { Kbd } from '@/components/ui/kbd'
import { useQuickLauncher } from '@/components/quick-launcher/QuickLauncherProvider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useOrgSlug } from '@/components/layout/OrgSlugProvider'

interface Todo {
  id: string
  title: string
  status: string
  ownerId: string
  priority: string | null
  dueDate: Date | null
  updatedAt: Date
  owner: {
    email: string
    name: string | null
  }
  _count: {
    messages: number
  }
}

export function TodosMenu({ todos, isOpen, onClose, currentUserId, highlightedTodoId }: { todos: Todo[]; isOpen: boolean; onClose: () => void; currentUserId?: string; highlightedTodoId?: string }) {
  const router = useRouter()
  const quickLauncher = useQuickLauncher()
  const accordionRef = useRef<{ toggleItem: (value: string) => void; openItems: Set<string> } | null>(null)
  const highlightedTodoRef = useRef<HTMLDivElement>(null)
  const orgSlug = useOrgSlug()
  
  const getTodoUrl = (todoId: string) => {
    if (orgSlug) {
      return `/${orgSlug}/todos/${todoId}`
    }
    return `/todos/${todoId}`
  }

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('todosMenuOpen'))
    } else {
      window.dispatchEvent(new CustomEvent('todosMenuClose'))
    }
  }, [isOpen])

  // Scroll to highlighted todo when drawer opens and todo is highlighted
  useEffect(() => {
    if (isOpen && highlightedTodoId) {
      // Find which section the highlighted todo is in and open that accordion
      const highlightedTodo = todos.find(t => t.id === highlightedTodoId)
      if (highlightedTodo) {
        const { today, upcoming, completed } = organizeTodos()
        let sectionToOpen: string | null = null
        
        if (today.find(t => t.id === highlightedTodoId)) {
          sectionToOpen = 'today'
        } else if (upcoming.find(t => t.id === highlightedTodoId)) {
          sectionToOpen = 'upcoming'
        } else if (completed.find(t => t.id === highlightedTodoId)) {
          sectionToOpen = 'completed'
        }
        
        if (sectionToOpen && accordionRef.current) {
          // Only open if not already open
          if (!accordionRef.current.openItems.has(sectionToOpen)) {
            accordionRef.current.toggleItem(sectionToOpen)
          }
        }
      }
      
      // Small delay to ensure drawer is fully rendered and accordion is open
      setTimeout(() => {
        if (highlightedTodoRef.current) {
          highlightedTodoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    }
  }, [isOpen, highlightedTodoId, todos])

  // Keyboard shortcuts for accordion sections
  useEffect(() => {
    if (!isOpen) return

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

      const key = e.key

      // 1: Toggle Today
      if (key === '1' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        if (accordionRef.current) {
          accordionRef.current.toggleItem('today')
        }
        return
      }

      // 2: Toggle Upcoming
      if (key === '2' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        if (accordionRef.current) {
          accordionRef.current.toggleItem('upcoming')
        }
        return
      }

      // 3: Toggle Completed
      if (key === '3' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        if (accordionRef.current) {
          accordionRef.current.toggleItem('completed')
        }
        return
      }

      // Esc: Close drawer
      if (key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleNewTodo = () => {
    quickLauncher.open()
  }

  // Organize todos into Today, Upcoming, Completed
  const organizeTodos = () => {
    const today: Todo[] = []
    const upcoming: Todo[] = []
    const completed: Todo[] = []

    const now = startOfDay(new Date())

    todos.forEach((todo) => {
      if (todo.status === 'COMPLETED') {
        completed.push(todo)
      } else if (todo.dueDate) {
        const dueDate = startOfDay(new Date(todo.dueDate))
        if (isToday(dueDate) || isPast(dueDate)) {
          // Past items go to Today (but styled as overdue)
          today.push(todo)
        } else if (isFuture(dueDate)) {
          upcoming.push(todo)
        } else {
          // Today
          today.push(todo)
        }
      } else {
        // No due date goes to upcoming
        upcoming.push(todo)
      }
    })

    // Sort today by due date (past due first, then today)
    today.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    // Sort upcoming by due date
    upcoming.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    // Sort completed by updated date (most recent first)
    completed.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return { today, upcoming, completed }
  }

  const { today, upcoming, completed } = organizeTodos()

  // Priority color mapping
  const getPriorityColor = (priority: string | null) => {
    if (!priority) return 'bg-gray-300'
    switch (priority) {
      case 'HIGH': return 'bg-red-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const renderTodo = (todo: Todo) => {
    // Check if todo is past due (past but not today)
    const isPastDue = todo.dueDate && 
      todo.status === 'OPEN' && 
      isPast(startOfDay(new Date(todo.dueDate))) &&
      !isToday(startOfDay(new Date(todo.dueDate)))

    const isHighlighted = highlightedTodoId === todo.id
    
    return (
      <Card 
        key={todo.id} 
        ref={isHighlighted ? highlightedTodoRef : null}
        className={`hover:bg-accent transition-colors ${isPastDue ? 'border-l-4 border-l-red-500' : ''} ${isHighlighted ? 'ring-2 ring-primary bg-accent' : ''}`}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="pt-0.5">
              <TodoCheckbox
                todoId={todo.id}
                currentStatus={todo.status as 'OPEN' | 'COMPLETED'}
                isOwner={todo.ownerId === currentUserId}
                size="md"
                onToggle={() => {
                  router.refresh()
                }}
              />
            </div>
            <Link
              href={getTodoUrl(todo.id)}
              className="flex-1 min-w-0"
              data-no-warn="true"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-sm truncate ${todo.status === 'COMPLETED' ? 'line-through opacity-60' : ''} ${isPastDue ? 'text-red-600' : ''}`}>
                    {todo.title}
                  </h3>
                  <p className={`text-xs mt-1 ${isPastDue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                    {todo.dueDate ? formatDate(new Date(todo.dueDate)) : formatDate(todo.updatedAt)}
                    {isPastDue && ' • Overdue'}
                    {todo._count.messages > 0 && (
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
                  title={`Priority: ${todo.priority}`}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      {/* Drawer */}
      <div
        className={`fixed ${isOpen ? 'left-[72px]' : 'left-0'} top-[8px] h-[calc(100vh-16px)] w-96 bg-background border-r shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out rounded-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Todos</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {todos.length === 0 ? (
            <div className="p-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                No todos yet
              </p>
            </div>
          ) : (
            <Accordion 
              defaultValue={['today']} 
              ref={accordionRef}
            >
              <AccordionItem value="today">
                <AccordionTrigger>
                  <span>Today ({today.length})</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {today.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No todos for today</p>
                    ) : (
                      today.map(renderTodo)
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="upcoming">
                <AccordionTrigger>
                  <span>Upcoming ({upcoming.length})</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {upcoming.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No upcoming todos</p>
                    ) : (
                      upcoming.map(renderTodo)
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="completed">
                <AccordionTrigger>
                  <span>Completed ({completed.length})</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {completed.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No completed todos</p>
                    ) : (
                      completed.map(renderTodo)
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
        
        <div className="p-4 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleNewTodo} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                New Todo
                <span className="ml-auto">
                  <Kbd className="ml-2">
                    <span>N</span>
                  </Kbd>
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-2">
                <span>Create new todo</span>
                <Kbd>
                  <span>N</span>
                </Kbd>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
