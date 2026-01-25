'use client'

import { useEffect, useState, createContext, useContext, useRef } from 'react'
import { QuickLauncher } from './QuickLauncher'

interface QuickLauncherContextType {
  open: () => void
  close: () => void
  toggle: () => void
  isTodosMenuOpen: () => boolean
}

const QuickLauncherContext = createContext<QuickLauncherContextType | null>(null)

export function useQuickLauncher() {
  const context = useContext(QuickLauncherContext)
  if (!context) {
    return {
      open: () => {},
      close: () => {},
      toggle: () => {},
      isTodosMenuOpen: () => false,
    }
  }
  return context
}

export function QuickLauncherProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [todosMenuOpen, setTodosMenuOpen] = useState(false)

  // Listen for todos menu state changes
  useEffect(() => {
    const handleTodosMenuOpen = () => setTodosMenuOpen(true)
    const handleTodosMenuClose = () => setTodosMenuOpen(false)

    window.addEventListener('todosMenuOpen', handleTodosMenuOpen)
    window.addEventListener('todosMenuClose', handleTodosMenuClose)
    return () => {
      window.removeEventListener('todosMenuOpen', handleTodosMenuOpen)
      window.removeEventListener('todosMenuClose', handleTodosMenuClose)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key.toLowerCase()

      // N: New todo (quick launcher)
      if (key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setIsOpen(true)
        return
      }

      // T: Open todos menu
      if (key === 't' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('openTodosMenu'))
        return
      }

      // C: Go to calendar
      if (key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        window.location.href = '/'
        return
      }

      // S: Go to settings
      if (key === 's' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        window.location.href = '/settings'
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <QuickLauncherContext.Provider
      value={{
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((prev) => !prev),
        isTodosMenuOpen: () => todosMenuOpen,
      }}
    >
      {children}
      <QuickLauncher isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </QuickLauncherContext.Provider>
  )
}
