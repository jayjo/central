'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickActions() {
  const router = useRouter()

  return (
    <div className="flex gap-2">
      <Button onClick={() => router.push('/my-todos?new=true')}>
        <Plus className="mr-2 h-4 w-4" />
        New Todo
      </Button>
    </div>
  )
}
