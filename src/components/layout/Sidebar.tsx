'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckSquare, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TodosMenu } from './TodosMenu'

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
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/">
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
          <Button variant="ghost" className="w-full justify-start" disabled>
            Nav2
          </Button>
          <Button variant="ghost" className="w-full justify-start" disabled>
            Nav3
          </Button>
        </nav>

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
