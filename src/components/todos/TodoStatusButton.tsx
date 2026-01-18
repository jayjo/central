'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle } from 'lucide-react'

interface TodoStatusButtonProps {
  todoId: string
  currentStatus: 'OPEN' | 'COMPLETED'
  isOwner: boolean
}

export function TodoStatusButton({ todoId, currentStatus, isOwner }: TodoStatusButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isCompleted = currentStatus === 'COMPLETED'

  async function handleToggle() {
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

      toast.success(`Todo marked as ${newStatus === 'COMPLETED' ? 'completed' : 'open'}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update todo status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isCompleted ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={loading || !isOwner}
      className="flex items-center gap-2"
    >
      {isCompleted ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Mark as Open
        </>
      ) : (
        <>
          <Circle className="h-4 w-4" />
          Mark as Complete
        </>
      )}
    </Button>
  )
}
