'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EditTodoForm } from './EditTodoForm'
import { TodoStatusButton } from './TodoStatusButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EditTodoButtonProps {
  todo: {
    id: string
    title: string
    priority: string | null
    dueDate: string | null
    visibility: string
    status: string
  }
}

export function EditTodoButton({ todo }: EditTodoButtonProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <>
        <EditTodoForm
          todo={todo}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Details</CardTitle>
              <TodoStatusButton
                todoId={todo.id}
                currentStatus={todo.status as 'OPEN' | 'COMPLETED'}
                isOwner={true}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium">Status: </span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  todo.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {todo.status}
              </span>
            </div>
            {todo.priority && (
              <div>
                <span className="text-sm font-medium">Priority: </span>
                <span className="text-sm">{todo.priority}</span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium">Visibility: </span>
              <span className="text-sm">{todo.visibility}</span>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Details</CardTitle>
          <div className="flex gap-2">
            <TodoStatusButton
              todoId={todo.id}
              currentStatus={todo.status as 'OPEN' | 'COMPLETED'}
              isOwner={true}
            />
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-sm font-medium">Status: </span>
          <span
            className={`px-2 py-1 rounded text-xs ${
              todo.status === 'COMPLETED'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {todo.status}
          </span>
        </div>
        {todo.priority && (
          <div>
            <span className="text-sm font-medium">Priority: </span>
            <span className="text-sm">{todo.priority}</span>
          </div>
        )}
        <div>
          <span className="text-sm font-medium">Visibility: </span>
          <span className="text-sm">{todo.visibility}</span>
        </div>
      </CardContent>
    </Card>
  )
}
