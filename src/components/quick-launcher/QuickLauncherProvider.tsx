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
  const [tabPressed, setTabPressed] = useState(false)
  const [todosMenuOpen, setTodosMenuOpen] = useState(false)
  const tabTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      // Cmd+K or Ctrl+K - keep for quick launcher
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.altKey && !e.optionKey) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        setTabPressed(false)
        return
      }

      // Tab key - start sequence
      if (e.key === 'Tab' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setTabPressed(true)
        
        // Clear existing timeout
        if (tabTimeoutRef.current) {
          clearTimeout(tabTimeoutRef.current)
        }
        
        // Reset after 1 second if no follow-up key
        tabTimeoutRef.current = setTimeout(() => {
          setTabPressed(false)
        }, 1000)
        return
      }

      // If Tab was pressed, handle follow-up keys
      if (tabPressed) {
        const key = e.key.toLowerCase()
        
        // Tab+T: Open todos menu
        if (key === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault()
          setTabPressed(false)
          if (tabTimeoutRef.current) {
            clearTimeout(tabTimeoutRef.current)
          }
          window.dispatchEvent(new CustomEvent('openTodosMenu'))
          return
        }
        
        // Tab+C: Go to calendar
        if (key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault()
          setTabPressed(false)
          if (tabTimeoutRef.current) {
            clearTimeout(tabTimeoutRef.current)
          }
          window.location.href = '/'
          return
        }
        
        // Tab+N: New todo (only when todos menu is open)
        if (key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && todosMenuOpen) {
          e.preventDefault()
          setTabPressed(false)
          if (tabTimeoutRef.current) {
            clearTimeout(tabTimeoutRef.current)
          }
          setIsOpen(true)
          return
        }
        
        // Any other key resets the sequence
        setTabPressed(false)
        if (tabTimeoutRef.current) {
          clearTimeout(tabTimeoutRef.current)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (tabTimeoutRef.current) {
        clearTimeout(tabTimeoutRef.current)
      }
    }
  }, [tabPressed, todosMenuOpen])

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
