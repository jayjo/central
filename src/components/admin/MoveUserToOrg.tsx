'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string | null
  org: { id: string; name: string; slug: string | null } | null
}

interface Org {
  id: string
  name: string
  slug: string | null
}

interface MoveUserToOrgProps {
  users: User[]
  orgs: Org[]
}

export function MoveUserToOrg({ users, orgs }: MoveUserToOrgProps) {
  const [movingUserId, setMovingUserId] = useState<string | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<Record<string, string>>({})

  async function handleMove(userId: string) {
    const orgId = selectedOrgId[userId]
    if (!orgId) {
      toast.error('Select an organization first')
      return
    }
    const user = users.find((u) => u.id === userId)
    if (user?.org?.id === orgId) {
      toast.error('User is already in that organization')
      return
    }
    setMovingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/org`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to move user')
      }
      toast.success('User moved successfully')
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move user')
    } finally {
      setMovingUserId(null)
    }
  }

  if (users.length === 0 || orgs.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Move user to organization</CardTitle>
        <CardDescription>
          Change which organization a user belongs to. Select a user, choose the target org, then click Move.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center gap-3 p-3 border rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{user.name || user.email}</div>
                <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                {user.org && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Current: {user.org.name} ({user.org.slug})
                  </div>
                )}
              </div>
              <Select
                value={selectedOrgId[user.id] ?? user.org?.id ?? ''}
                onValueChange={(value) =>
                  setSelectedOrgId((prev) => ({ ...prev, [user.id]: value }))
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select org" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({org.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleMove(user.id)}
                disabled={
                  movingUserId === user.id ||
                  !selectedOrgId[user.id] ||
                  selectedOrgId[user.id] === user.org?.id
                }
              >
                {movingUserId === user.id ? 'Moving...' : 'Move'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
