'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useOrgSlug } from '@/components/layout/OrgSlugProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  const [visibility, setVisibility] = useState<string>('PRIVATE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const orgSlug = useOrgSlug()
  
  const getTodoUrl = (todoId: string) => {
    if (orgSlug) {
      return `/${orgSlug}/todos/${todoId}`
    }
    return `/todos/${todoId}`
  }

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
          visibility: visibility || 'PRIVATE',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create todo')
      }

      // Reset form
      setTitle('')
      setDescription('')
      setPriority('')
      setDueDate('')
      setVisibility('PRIVATE')
      
      toast.success('Todo created successfully')
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
        router.push(getTodoUrl(data.todo.id))
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
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

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="ORG">Shared with Organization</SelectItem>
                <SelectItem value="SPECIFIC">Shared with Specific Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

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
        </form>
      </CardContent>
    </Card>
  )
}
