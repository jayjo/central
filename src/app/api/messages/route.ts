import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, formatTodoNotificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

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
