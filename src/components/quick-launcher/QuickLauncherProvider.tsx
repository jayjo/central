'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { QuickLauncher } from './QuickLauncher'

interface QuickLauncherContextType {
  open: () => void
  close: () => void
  toggle: () => void
}

const QuickLauncherContext = createContext<QuickLauncherContextType | null>(null)

export function useQuickLauncher() {
  const context = useContext(QuickLauncherContext)
  if (!context) {
    return {
      open: () => {},
      close: () => {},
      toggle: () => {},
    }
  }
  return context
}

export function QuickLauncherProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <QuickLauncherContext.Provider
      value={{
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((prev) => !prev),
      }}
    >
      {children}
      <QuickLauncher isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </QuickLauncherContext.Provider>
  )
}
