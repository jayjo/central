'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked' | 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    return (
      <label 
        htmlFor={id}
        className="relative inline-flex items-center cursor-pointer"
      >
        <input
          type="checkbox"
          ref={ref}
          id={id}
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'relative h-4 w-4 rounded border-2 border-input bg-background transition-colors flex items-center justify-center shrink-0',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            checked && 'bg-primary border-primary',
            !disabled && 'cursor-pointer',
            className
          )}
        >
          {checked && (
            <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
          )}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'
