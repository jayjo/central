'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Users, User } from 'lucide-react'

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string | null
  isShared?: boolean
  className?: string
}

export function Avatar({ src, alt, name, isShared = false, className }: AvatarProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name[0].toUpperCase()
  }

  if (isShared) {
    return (
      <div
        className={cn(
          'w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0',
          className
        )}
      >
        <Users className="w-4 h-4 text-primary" />
      </div>
    )
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={cn('w-8 h-8 rounded-full object-cover shrink-0', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0',
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
