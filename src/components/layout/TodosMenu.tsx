'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, Plus, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, getDateHeader } from '@/lib/utils'
import { TodoCheckbox } from '@/components/todos/TodoCheckbox'
import { Kbd } from '@/components/ui/kbd'
import { useQuickLauncher } from '@/components/quick-launcher/QuickLauncherProvider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Todo {
  id: string
  title: string
  status: string
  ownerId: string
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

export function TodosMenu({ todos, isOpen, onClose, currentUserId }: { todos: Todo[]; isOpen: boolean; onClose: () => void; currentUserId?: string }) {
  const router = useRouter()
  const quickLauncher = useQuickLauncher()
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 256, y: 20 }) // Start at left-64 (256px) + some padding
  const [size, setSize] = useState({ width: 320, height: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // Load saved position and size from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('todosMenuPosition')
      if (saved) {
        const parsed = JSON.parse(saved)
        setPosition(parsed.position || position)
        setSize(parsed.size || size)
      }
    }
  }, [])

  // Save position and size to localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      localStorage.setItem('todosMenuPosition', JSON.stringify({ position, size }))
    }
  }, [position, size, isOpen])

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('todosMenuOpen'))
    } else {
      window.dispatchEvent(new CustomEvent('todosMenuClose'))
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        // Keep within viewport bounds
        const maxX = window.innerWidth - size.width
        const maxY = window.innerHeight - size.height
        setPosition({
          x: Math.max(0, Math.min(maxX, newX)),
          y: Math.max(0, Math.min(maxY, newY)),
        })
      } else if (isResizing) {
        const newWidth = resizeStart.width + (e.clientX - resizeStart.x)
        const newHeight = resizeStart.height + (e.clientY - resizeStart.y)
        setSize({
          width: Math.max(280, Math.min(800, newWidth)), // Min 280px, max 800px
          height: Math.max(400, Math.min(window.innerHeight - 40, newHeight)), // Min 400px, max screen height
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart])

  const handleDragStart = (e: React.MouseEvent) => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    e.preventDefault()
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    })
  }

  if (!isOpen) {
    return null
  }

  const handleNewTodo = () => {
    quickLauncher.open()
  }

  // Organize todos by date headers
  const organizeTodosByDate = () => {
    const organized: { [key: string]: Todo[] } = {}
    
    // Sort todos: those with due dates first (soonest first), then those without
    const sortedTodos = [...todos].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1 // No due date goes to end
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
    
    sortedTodos.forEach((todo) => {
      const header = getDateHeader(todo.dueDate ? new Date(todo.dueDate) : null)
      if (!organized[header]) {
        organized[header] = []
      }
      organized[header].push(todo)
    })

    // Sort headers: Today, Tomorrow, then by date
    const headerOrder = ['Today', 'Tomorrow', 'Yesterday']
    const sortedHeaders = Object.keys(organized).sort((a, b) => {
      const aIndex = headerOrder.indexOf(a)
      const bIndex = headerOrder.indexOf(b)
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      if (a === 'No Due Date') return 1
      if (b === 'No Due Date') return -1
      
      return a.localeCompare(b)
    })

    return sortedHeaders.map(header => ({ header, todos: organized[header] }))
  }

  const organizedTodos = organizeTodosByDate()

  return (
    <>
      {/* Floating Menu */}
      <div
        ref={menuRef}
        className="fixed bg-background border shadow-2xl z-50 flex flex-col rounded-lg overflow-hidden"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        {/* Draggable Header */}
        <div
          className="p-4 border-b flex items-center justify-between bg-muted/50 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Todos</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <TooltipProvider>
          <div className="p-4 border-b">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleNewTodo} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  New Todo
                  <span className="ml-auto">
                    <Kbd className="ml-2">
                      <span>Tab</span>
                      <span>N</span>
                    </Kbd>
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Create new todo</span>
                  <Kbd>
                    <span>Tab</span>
                    <span>N</span>
                  </Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No todos yet
            </p>
          ) : (
            organizedTodos.map(({ header, todos: headerTodos }) => (
              <div key={header} className="space-y-2">
                <div className="sticky top-0 bg-background z-10 py-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {header}
                  </h3>
                </div>
                {headerTodos.map((todo) => (
                  <Card key={todo.id} className="hover:bg-accent transition-colors">
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
                          href={`/todos/${todo.id}`}
                          onClick={onClose}
                          className="flex-1 min-w-0"
                          data-no-warn="true"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-medium text-sm truncate ${todo.status === 'COMPLETED' ? 'line-through opacity-60' : ''}`}>
                                {todo.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {todo.dueDate ? formatDate(new Date(todo.dueDate)) : formatDate(todo.updatedAt)}
                                {todo._count.messages > 0 && (
                                  <> • {todo._count.messages} message(s)</>
                                )}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))
          )}
        </div>
        
        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize group"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-border group-hover:border-b-primary/50 transition-colors" />
          <div className="absolute bottom-1 right-1 w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-muted-foreground/30" />
        </div>
      </div>
    </>
  )
}
