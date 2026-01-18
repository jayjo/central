import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDevUser } from '@/lib/dev-auth'
import { sendEmail, formatTodoNotificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  // TODO: Re-enable auth after fixing code verification
  const user = await getDevUser()

  const body = await request.json()
  const { todoId, content } = body

  if (!todoId || !content) {
    return NextResponse.json(
      { error: 'Todo ID and content required' },
      { status: 400 }
    )
  }

  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
    include: {
      owner: true,
      sharedWith: true,
    },
  })

  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  // Check access
  const hasAccess =
    todo.ownerId === user.id ||
    todo.sharedWith.some((u) => u.id === user.id) ||
    (todo.visibility === 'ORG' && todo.owner.orgId === user.orgId)

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const message = await prisma.message.create({
    data: {
      content,
      todoId,
      authorId: user.id,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  // Send email notifications to relevant users
  const recipients = [
    ...todo.sharedWith.filter((u) => u.id !== user.id),
    ...(todo.ownerId !== user.id ? [todo.owner] : []),
  ]

  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient.email,
        subject: `New message on: ${todo.title}`,
        html: formatTodoNotificationEmail({
          todoTitle: todo.title,
          ownerName: user.name || user.email,
          message: content,
          todoUrl: `${process.env.NEXTAUTH_URL}/todos/${todo.id}`,
        }),
      })
    } catch (error) {
      console.error(`Failed to send email to ${recipient.email}:`, error)
    }
  }

  return NextResponse.json({ message })
}
