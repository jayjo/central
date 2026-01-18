import { TodoStatus, Priority, Visibility } from '@prisma/client'

export type { TodoStatus, Priority, Visibility }

export interface TodoWithRelations {
  id: string
  title: string
  status: TodoStatus
  priority: Priority | null
  dueDate: Date | null
  visibility: Visibility
  aiGenerated: boolean
  createdAt: Date
  updatedAt: Date
  owner: {
    id: string
    name: string | null
    email: string
  }
  sharedWith: Array<{
    id: string
    name: string | null
    email: string
  }>
  messages: Array<{
    id: string
    content: string
    createdAt: Date
    author: {
      id: string
      name: string | null
      email: string
    }
  }>
  _count: {
    messages: number
  }
}
