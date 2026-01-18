import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { rationalizeRequest } from '@/lib/ai'
import { prisma } from '@/lib/db'

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
  const { text, todoId } = body

  if (!text) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 })
  }

  // Get context if analyzing a specific todo
  let context
  if (todoId) {
    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
      include: { messages: true },
    })
    if (todo) {
      context = { todos: [todo], messages: todo.messages }
    }
  }

  try {
    // Create interaction record
    const interaction = await prisma.aIInteraction.create({
      data: {
        userId: user.id,
        prompt: text,
        status: 'PROCESSING',
      },
    })

    const result = await rationalizeRequest(text, context)

    // Update interaction with result
    await prisma.aIInteraction.update({
      where: { id: interaction.id },
      data: {
        response: result.summary,
        actionItems: JSON.stringify(result.suggestedTodos),
        status: 'COMPLETED',
      },
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('AI processing error:', error)

    // Update interaction with error
    if (body.todoId) {
      await prisma.aIInteraction.updateMany({
        where: {
          userId: user.id,
          status: 'PROCESSING',
        },
        data: {
          status: 'ERROR',
        },
      })
    }

    return NextResponse.json(
      { error: error.message || 'AI processing failed' },
      { status: 500 }
    )
  }
}
