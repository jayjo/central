'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TodoCheckboxProps {
  todoId: string
  currentStatus: 'OPEN' | 'COMPLETED'
  isOwner: boolean
  size?: 'sm' | 'md'
  onToggle?: () => void
}

export function TodoCheckbox({ 
  todoId, 
  currentStatus, 
  isOwner,
  size = 'sm',
  onToggle 
}: TodoCheckboxProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const isCompleted = status === 'COMPLETED'

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isOwner) {
      toast.error('Only the owner can change the status')
      return
    }

    setLoading(true)
    try {
      const newStatus = isCompleted ? 'OPEN' : 'COMPLETED'
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update todo status')
      }

      setStatus(newStatus)
      toast.success(`Todo marked as ${newStatus === 'COMPLETED' ? 'completed' : 'open'}`)
      
      if (onToggle) {
        onToggle()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update todo status')
    } finally {
      setLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <button
      onClick={handleToggle}
      disabled={loading || !isOwner}
      className={cn(
        'flex-shrink-0 transition-opacity hover:opacity-80 disabled:opacity-50',
        !isOwner && 'cursor-not-allowed'
      )}
      title={isOwner ? (isCompleted ? 'Mark as open' : 'Mark as complete') : 'Only owner can change status'}
    >
      {isCompleted ? (
        <CheckCircle2 className={cn(iconSize, 'text-green-600')} />
      ) : (
        <Circle className={cn(iconSize, 'text-muted-foreground')} />
      )}
    </button>
  )
}
