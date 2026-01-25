'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Item as SelectItem,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrgSlug } from '@/components/layout/OrgSlugProvider'

interface QuickLauncherProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickLauncher({ isOpen, onClose }: QuickLauncherProps) {
  const router = useRouter()
  const orgSlug = useOrgSlug()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [createAnother, setCreateAnother] = useState(false)
  const [loading, setLoading] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  const getTodoUrl = (todoId: string) => {
    if (orgSlug) {
      return `/${orgSlug}/todos/${todoId}`
    }
    return `/todos/${todoId}`
  }

  useEffect(() => {
    if (isOpen) {
      // Reset form when opened
      setTitle('')
      setPriority('')
      setDueDate('')
      setIsShared(false)
      setCreateAnother(false)
      // Focus the title input with multiple attempts
      const focusInput = () => {
        if (titleInputRef.current) {
          titleInputRef.current.focus()
          return true
        }
        return false
      }
      // Try immediately, then with delays
      setTimeout(() => focusInput(), 0)
      setTimeout(() => focusInput(), 50)
      setTimeout(() => focusInput(), 100)
    } else {
      // Reset form when closed
      setTitle('')
      setPriority('')
      setDueDate('')
      setIsShared(false)
      setCreateAnother(false)
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
          visibility: isShared ? 'ORG' : 'PRIVATE',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create todo')
      }

      toast.success('Todo created successfully')
      
      if (createAnother) {
        // Reset form and keep it open
        setTitle('')
        setPriority('')
        setDueDate('')
        setIsShared(false)
        router.refresh()
        // Focus title input after reset
        setTimeout(() => {
          titleInputRef.current?.focus()
        }, 0)
      } else {
        onClose()
        router.refresh()
        router.push(getTodoUrl(data.todo.id))
      }
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
                  ref={titleInputRef}
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
                <Label htmlFor="quick-launcher-dueDate">Due Date</Label>
                <Input
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

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="quick-launcher-shared"
                    checked={isShared}
                    onCheckedChange={setIsShared}
                  />
                  <Label htmlFor="quick-launcher-shared" className="text-sm font-normal cursor-pointer">
                    Share with organization
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="quick-launcher-createAnother"
                    checked={createAnother}
                    onChange={(e) => setCreateAnother(e.target.checked)}
                    className="h-4 w-4 rounded border-2 border-input cursor-pointer"
                  />
                  <Label htmlFor="quick-launcher-createAnother" className="text-sm font-normal cursor-pointer">
                    Create another
                  </Label>
                </div>
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
