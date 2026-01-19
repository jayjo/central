'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckSquare, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TodosMenu } from './TodosMenu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'

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

export function Sidebar({ userEmail, todos, currentUserId }: { userEmail?: string; todos?: Todo[]; currentUserId?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [showTodosMenu, setShowTodosMenu] = useState(false)

  useEffect(() => {
    const handleOpenTodosMenu = () => {
      setShowTodosMenu(true)
    }

    window.addEventListener('openTodosMenu', handleOpenTodosMenu)
    return () => window.removeEventListener('openTodosMenu', handleOpenTodosMenu)
  }, [])

  return (
    <>
      <div className="flex flex-col h-screen w-64 border-r bg-background">
        {/* Logo */}
        <div className="p-4 border-b">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start font-bold text-lg">
              Central
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <TooltipProvider>
          <nav className="flex-1 p-4 space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/" data-no-warn="true">
                  <Button
                    variant={pathname === '/' ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      pathname === '/' && 'bg-accent'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Go to Calendar</span>
                  <Kbd>
                    <span>Tab</span>
                    <span>C</span>
                  </Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={pathname === '/my-todos' ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    pathname === '/my-todos' && 'bg-accent'
                  )}
                  onClick={() => setShowTodosMenu(!showTodosMenu)}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Todos
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Open Todos</span>
                  <Kbd>
                    <span>Tab</span>
                    <span>T</span>
                  </Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          <Button variant="ghost" className="w-full justify-start" disabled>
            Nav2
          </Button>
          <Button variant="ghost" className="w-full justify-start" disabled>
            Nav3
          </Button>
          </nav>
        </TooltipProvider>

        {/* Profile/Settings */}
        <div className="p-4 border-t">
          <Button
            variant={pathname === '/settings' ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start',
              pathname === '/settings' && 'bg-accent'
            )}
            onClick={() => router.push('/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            {userEmail || 'Settings'}
          </Button>
        </div>
      </div>

      {/* Todos Menu */}
      {todos && (
        <TodosMenu 
          todos={todos} 
          isOpen={showTodosMenu}
          onClose={() => setShowTodosMenu(false)}
          currentUserId={currentUserId}
        />
      )}
    </>
  )
}
