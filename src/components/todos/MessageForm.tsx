'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'

export function MessageForm({ todoId }: { todoId: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, content }),
      })

      if (response.ok) {
        setContent('')
        router.refresh()
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="Add a message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <Button type="submit" disabled={loading || !content.trim()}>
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  )
}
