'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionContextType {
  openItems: Set<string>
  toggleItem: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextType | null>(null)
const AccordionItemContext = React.createContext<string>('')

interface AccordionProps {
  children: React.ReactNode
  defaultValue?: string[]
}

export const Accordion = React.forwardRef<
  { toggleItem: (value: string) => void; openItems: Set<string> },
  AccordionProps
>(({ children, defaultValue }, ref) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(
    new Set(defaultValue || [])
  )

  const toggleItem = React.useCallback((value: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }, [])

  React.useImperativeHandle(ref, () => ({
    toggleItem,
    openItems,
  }))

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className="space-y-1">{children}</div>
    </AccordionContext.Provider>
  )
})
Accordion.displayName = 'Accordion'

export function AccordionItem({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div data-value={value}>{children}</div>
    </AccordionItemContext.Provider>
  )
}

export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
>(({ children, className, ...props }, ref) => {
  const context = React.useContext(AccordionContext)
  const value = React.useContext(AccordionItemContext)
  
  if (!context) {
    throw new Error('AccordionTrigger must be used within Accordion')
  }

  const { openItems, toggleItem } = context
  const isOpen = openItems.has(value)

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => toggleItem(value)}
      className={cn(
        'flex w-full items-center justify-between py-3 px-4 text-sm font-semibold text-left hover:bg-accent transition-colors',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          isOpen && 'transform rotate-180'
        )}
      />
    </button>
  )
})
AccordionTrigger.displayName = 'AccordionTrigger'

export function AccordionContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  const context = React.useContext(AccordionContext)
  const value = React.useContext(AccordionItemContext)
  
  if (!context) {
    throw new Error('AccordionContent must be used within Accordion')
  }

  const { openItems } = context
  const isOpen = openItems.has(value)

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-200',
        isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0',
        className
      )}
      {...props}
    >
      <div className="px-4 pb-2">{children}</div>
    </div>
  )
}

export function AccordionItemWrapper({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  return (
    <AccordionItemContext.Provider value={value}>
      {children}
    </AccordionItemContext.Provider>
  )
}
