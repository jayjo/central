'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors duration-200 ease-in-out',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            checked ? 'bg-primary' : 'bg-input',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer',
            className
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background transition-transform duration-200 ease-in-out',
              checked && 'translate-x-5'
            )}
          />
        </div>
      </label>
    )
  }
)
Switch.displayName = 'Switch'
