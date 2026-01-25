'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckSquare, Calendar, Settings, MessageSquare, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TodosMenu } from './TodosMenu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'
import { useCalendarUrl, useMyTodosUrl, useSettingsUrl, useOrgSlug } from '@/components/layout/OrgSlugProvider'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const orgSlug = useOrgSlug()
  const calendarUrl = useCalendarUrl()
  const myTodosUrl = useMyTodosUrl()
  const settingsUrl = useSettingsUrl()

  useEffect(() => {
    const handleOpenTodosMenu = () => {
      setShowTodosMenu(true)
    }

    // Also check URL for highlight parameter and open drawer if present
    const checkUrlForHighlight = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('highlight')) {
          setShowTodosMenu(true)
        }
      }
    }

    window.addEventListener('openTodosMenu', handleOpenTodosMenu)
    checkUrlForHighlight()
    
    // Listen for navigation events to check for highlight
    const handlePopState = () => {
      checkUrlForHighlight()
    }
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('openTodosMenu', handleOpenTodosMenu)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Check URL for highlight parameter when pathname changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('highlight')) {
        setShowTodosMenu(true)
      }
    }
  }, [pathname])

  return (
    <>
      <div className="flex flex-col h-screen w-16 border-r bg-background">
        {/* Logo */}
        <div className="p-2 border-b">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={calendarUrl}>
                  <Button variant="ghost" className="w-full justify-center p-2 h-12">
                    <Image
                      src="/images/nuclio-logo.png"
                      alt="Nuclio"
                      width={32}
                      height={32}
                      className="object-contain"
                      priority
                    />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Nuclio</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Navigation */}
        <TooltipProvider>
          <nav className="flex-1 p-2 space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={calendarUrl} data-no-warn="true">
                  <Button
                    variant={pathname === calendarUrl || pathname === '/' ? 'secondary' : 'ghost'}
                    size="icon"
                    className={cn(
                      'w-full',
                      (pathname === calendarUrl || pathname === '/') && 'bg-accent'
                    )}
                  >
                    <Calendar className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Calendar</span>
                  <Kbd>
                    <span>C</span>
                  </Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={pathname === '/my-todos' ? 'secondary' : 'ghost'}
                  size="icon"
                  className={cn(
                    'w-full',
                    pathname === '/my-todos' && 'bg-accent'
                  )}
                  onClick={() => setShowTodosMenu(!showTodosMenu)}
                >
                  <CheckSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Todos</span>
                  <Kbd>
                    <span>T</span>
                  </Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>

        {/* Profile/Settings */}
        <div className="p-2 border-t space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
                  onClick={() => setShowOnboardingModal(true)}
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Help & Onboarding</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
                  onClick={() => setShowFeedbackModal(true)}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Send Feedback</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={settingsUrl}>
                  <Button
                    variant={pathname === settingsUrl || pathname === '/settings' ? 'secondary' : 'ghost'}
                    size="icon"
                    className={cn(
                      'w-full',
                      (pathname === settingsUrl || pathname === '/settings') && 'bg-accent'
                    )}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Settings</span>
                  <Kbd>
                    <span>S</span>
                  </Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Todos Menu */}
      {todos && (
        <TodosMenu 
          todos={todos} 
          isOpen={showTodosMenu}
          onClose={() => setShowTodosMenu(false)}
          currentUserId={currentUserId}
          highlightedTodoId={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('highlight') || undefined : undefined}
        />
      )}

      {/* Feedback Modal */}
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
      />
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userEmail={userEmail}
      />
    </>
  )
}
