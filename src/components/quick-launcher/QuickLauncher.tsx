'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Item as SelectItem,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Kbd } from '@/components/ui/kbd'

interface QuickLauncherProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickLauncher({ isOpen, onClose }: QuickLauncherProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus the title input immediately when opened
      const input = document.getElementById('quick-launcher-title')
      input?.focus()
    } else {
      // Reset form when closed
      setTitle('')
      setPriority('')
      setDueDate('')
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Opt+Cmd+S to focus date field
      if ((e.altKey || e.optionKey) && (e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        dateInputRef.current?.focus()
        dateInputRef.current?.showPicker()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority: priority || null,
          dueDate: dueDate || null,
          visibility: 'PRIVATE',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create todo')
      }

      toast.success('Todo created successfully')
      onClose()
      router.refresh()
      router.push(`/todos/${data.todo.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create todo')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Quick Create Todo</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quick-launcher-title">Title *</Label>
                <Input
                  id="quick-launcher-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-launcher-priority">Priority</Label>
                <Select value={priority || undefined} onValueChange={(value) => setPriority(value || '')}>
                  <SelectTrigger id="quick-launcher-priority">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-launcher-dueDate">
                  Due Date
                  <span className="ml-2 text-xs text-muted-foreground">
                    <Kbd>
                      <span>⌥</span>
                      <span>⌘</span>
                      <span>S</span>
                    </Kbd>
                  </span>
                </Label>
                <Input
                  ref={dateInputRef}
                  id="quick-launcher-dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onKeyDown={(e) => {
                    // Arrow key navigation for date
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault()
                      const currentDate = dueDate ? new Date(dueDate) : new Date()
                      const change = e.key === 'ArrowUp' ? 1 : -1
                      currentDate.setDate(currentDate.getDate() + change)
                      setDueDate(currentDate.toISOString().split('T')[0])
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault()
                      const currentDate = dueDate ? new Date(dueDate) : new Date()
                      const change = e.key === 'ArrowLeft' ? -1 : 1
                      currentDate.setDate(currentDate.getDate() + change)
                      setDueDate(currentDate.toISOString().split('T')[0])
                    }
                  }}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Todo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
