'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NavIcon } from './NavIcon'
import { TodosMenu } from './TodosMenu'
import { useCalendarUrl, useMyTodosUrl, useSettingsUrl, useOrgSlug } from '@/components/layout/OrgSlugProvider'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { WeatherCard } from '@/components/dashboard/WeatherCard'
import { MotivationalCard } from '@/components/dashboard/MotivationalCard'

interface MotivationalMessage {
  message: string
  author: string | null
  category: string | null
}

interface Todo {
  id: string
  title: string
  status: string
  ownerId: string
  priority: string | null
  dueDate: Date | null
  updatedAt: Date
  visibility: string
  owner: {
    id: string
    email: string
    name: string | null
    image: string | null
  }
  sharedWith: Array<{ id: string }>
  _count: { messages: number }
}

export function Sidebar({
  userEmail,
  todos,
  currentUserId,
  message,
  zipCode,
  todayCount = 0,
  upcomingCount = 0,
  somedayCount = 0,
}: {
  userEmail?: string
  todos?: Todo[]
  currentUserId?: string
  message?: MotivationalMessage | null
  zipCode?: string | null
  todayCount?: number
  upcomingCount?: number
  somedayCount?: number
}) {
  const pathname = usePathname()
  const [showTodosMenu, setShowTodosMenu] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const orgSlug = useOrgSlug()
  const calendarUrl = useCalendarUrl()
  const myTodosUrl = useMyTodosUrl()
  const settingsUrl = useSettingsUrl()

  const isCalendar = pathname === calendarUrl || pathname === (orgSlug ? `/${orgSlug}` : '/')
  const isMyTodos = pathname === myTodosUrl
  const isSettings = pathname === settingsUrl || pathname === '/settings'

  useEffect(() => {
    const handleOpenTodosMenu = () => setShowTodosMenu(true)
    const checkUrlForHighlight = () => {
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('highlight')) {
        setShowTodosMenu(true)
      }
    }
    window.addEventListener('openTodosMenu', handleOpenTodosMenu)
    checkUrlForHighlight()
    window.addEventListener('popstate', checkUrlForHighlight)
    return () => {
      window.removeEventListener('openTodosMenu', handleOpenTodosMenu)
      window.removeEventListener('popstate', checkUrlForHighlight)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('highlight')) {
      setShowTodosMenu(true)
    }
  }, [pathname])

  return (
    <>
      <div className="flex flex-col h-screen w-60 border-r bg-muted/50 shrink-0 overflow-y-auto">
        {/* Nav items: default state from Figma node 2088-699 — icon/text #B0B0B0, badge #E8E8E8 / #4B4B4B */}
        <nav className="p-3 space-y-0.5 border-b">
          <Link
            href={myTodosUrl}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isMyTodos
                ? 'bg-white text-foreground shadow-sm'
                : 'text-[#B0B0B0] hover:bg-accent hover:text-foreground'
            )}
          >
            <NavIcon icon="star" />
            <span>Today</span>
            {todayCount > 0 && (
              <span
                className={cn(
                  'ml-auto text-xs px-2 py-0.5 rounded-md min-w-[1.25rem] text-center',
                  isMyTodos ? 'bg-muted text-foreground' : 'bg-[#E8E8E8] text-[#4B4B4B]'
                )}
              >
                {todayCount}
              </span>
            )}
          </Link>
          <Link
            href={myTodosUrl}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              'text-[#B0B0B0] hover:bg-accent hover:text-foreground'
            )}
          >
            <NavIcon icon="clock-upcoming" />
            <span>Upcoming</span>
            {upcomingCount > 0 && (
              <span className="ml-auto text-xs bg-[#E8E8E8] text-[#4B4B4B] px-2 py-0.5 rounded-md min-w-[1.25rem] text-center">
                {upcomingCount}
              </span>
            )}
          </Link>
          <Link
            href={myTodosUrl}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              'text-[#B0B0B0] hover:bg-accent hover:text-foreground'
            )}
          >
            <NavIcon icon="someday" />
            <span>Someday</span>
            {somedayCount > 0 && (
              <span className="ml-auto text-xs bg-[#E8E8E8] text-[#4B4B4B] px-2 py-0.5 rounded-md min-w-[1.25rem] text-center">
                {somedayCount}
              </span>
            )}
          </Link>
          <Link
            href={calendarUrl}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isCalendar
                ? 'bg-white text-foreground shadow-sm'
                : 'text-[#B0B0B0] hover:bg-accent hover:text-foreground'
            )}
          >
            <NavIcon icon="calendar" />
            <span>Calendar</span>
          </Link>
        </nav>

        {/* Weather & Inspiration */}
        <div className="p-3 space-y-3 flex-1 min-h-0">
          <WeatherCard zipCode={zipCode} />
          <MotivationalCard message={message ?? null} />
        </div>

        {/* Help, Feedback, Settings — same nav-item default state (node): #B0B0B0, no badge */}
        <div className="p-3 space-y-0.5 border-t">
          <button
            type="button"
            onClick={() => setShowOnboardingModal(true)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              'text-[#B0B0B0] hover:bg-accent hover:text-foreground'
            )}
          >
            <NavIcon icon="help" />
            <span>Help & Onboarding</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFeedbackModal(true)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              'text-[#B0B0B0] hover:bg-accent hover:text-foreground'
            )}
          >
            <NavIcon icon="chat-circle" />
            <span>Leave Feedback</span>
          </button>
          <Link
            href={settingsUrl}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isSettings
                ? 'bg-white text-foreground shadow-sm'
                : 'text-[#B0B0B0] hover:bg-accent hover:text-foreground'
            )}
          >
            <NavIcon icon="settings" />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Todos drawer - desktop only */}
      {todos && (
        <div className="hidden md:block">
          <TodosMenu
            todos={todos}
            isOpen={showTodosMenu}
            onClose={() => setShowTodosMenu(false)}
            currentUserId={currentUserId}
            highlightedTodoId={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('highlight') || undefined : undefined}
          />
        </div>
      )}

      <OnboardingModal isOpen={showOnboardingModal} onClose={() => setShowOnboardingModal(false)} />
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} userEmail={userEmail} />
    </>
  )
}
