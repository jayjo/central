'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
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

interface EditTodoFormProps {
  todo: {
    id: string
    title: string
    priority: string | null
    dueDate: string | null
    visibility: string
  }
  onCancel: () => void
  onSuccess: () => void
}

// Helper function to extract date in YYYY-MM-DD format without timezone conversion
function getLocalDateString(dateString: string | null): string {
  if (!dateString) return ''
  
  // If it's already in YYYY-MM-DD format, return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  
  // If it's an ISO string, extract the date part before 'T'
  if (dateString.includes('T')) {
    return dateString.split('T')[0]
  }
  
  // Otherwise, parse as Date and use local date components
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function EditTodoForm({ todo, onCancel, onSuccess }: EditTodoFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(todo.title)
  const [priority, setPriority] = useState<string>(todo.priority || '')
  const [dueDate, setDueDate] = useState(getLocalDateString(todo.dueDate))
  const [visibility, setVisibility] = useState<string>(todo.visibility)
  const [loading, setLoading] = useState(false)
  
  // Track if form has been modified
  const hasChanges = 
    title !== todo.title ||
    priority !== (todo.priority || '') ||
    dueDate !== getLocalDateString(todo.dueDate) ||
    visibility !== todo.visibility

  // Warn before navigation if there are unsaved changes
  useUnsavedChanges({
    hasUnsavedChanges: hasChanges && !loading,
    message: 'You have unsaved changes. Are you sure you want to leave?',
  })

  useEffect(() => {
    // Focus title input when form opens
    const timer = setTimeout(() => {
      const input = document.getElementById('edit-todo-title')
      input?.focus()
      input?.select()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority: priority || null,
          dueDate: dueDate || null,
          visibility: visibility || 'PRIVATE',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update todo')
      }

      toast.success('Todo updated successfully')
      onSuccess()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update todo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Edit Todo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-todo-title">Title *</Label>
            <Input
              id="edit-todo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-todo-priority">Priority</Label>
              <Select value={priority || undefined} onValueChange={(value) => setPriority(value || '')}>
                <SelectTrigger id="edit-todo-priority">
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
              <Label htmlFor="edit-todo-dueDate">Due Date</Label>
              <Input
                id="edit-todo-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-todo-visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger id="edit-todo-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="ORG">Organization</SelectItem>
                <SelectItem value="SPECIFIC">Specific Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
