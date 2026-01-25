'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useOrgSlug } from '@/components/layout/OrgSlugProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Item as SelectItem,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CreateTodoForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [createAnother, setCreateAnother] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const orgSlug = useOrgSlug()
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  const getTodoUrl = (todoId: string) => {
    if (orgSlug) {
      return `/${orgSlug}/todos/${todoId}`
    }
    return `/todos/${todoId}`
  }

  // Focus title input on mount and when form becomes visible
  useEffect(() => {
    // Use IntersectionObserver to wait for element to be visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && titleInputRef.current) {
          // Element is visible, try to focus
          setTimeout(() => {
            titleInputRef.current?.focus()
          }, 100)
          observer.disconnect()
        }
      })
    }, { threshold: 0.1 })

    if (titleInputRef.current) {
      observer.observe(titleInputRef.current)
    }

    // Fallback: try multiple times with increasing delays
    const attempts = [0, 100, 300, 500]
    attempts.forEach((delay) => {
      setTimeout(() => {
        if (titleInputRef.current && document.activeElement !== titleInputRef.current) {
          titleInputRef.current.focus()
        }
      }, delay)
    })

    return () => observer.disconnect()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description ? description.trim() : null,
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
        setDescription('')
        setPriority('')
        setDueDate('')
        setIsShared(false)
        router.refresh()
        // Focus title input after reset
        setTimeout(() => {
          titleInputRef.current?.focus()
        }, 0)
      } else {
        // Reset form
        setTitle('')
        setDescription('')
        setPriority('')
        setDueDate('')
        setIsShared(false)
        
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
          router.push(getTodoUrl(data.todo.id))
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create todo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Todo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority || undefined} onValueChange={(value) => setPriority(value || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Switch
                id="shared"
                checked={isShared}
                onCheckedChange={setIsShared}
              />
              <Label htmlFor="shared" className="text-sm font-normal cursor-pointer">
                Share with organization
              </Label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Todo'}
              </Button>
              {onSuccess && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSuccess}
                >
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="createAnother"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="h-4 w-4 rounded border-2 border-input cursor-pointer"
              />
              <Label htmlFor="createAnother" className="text-sm font-normal cursor-pointer">
                Create another
              </Label>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
