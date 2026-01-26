import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { org: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const todo = await prisma.todo.findUnique({
    where: { id: params.id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
        include: {
          org: true,
        },
      },
      sharedWith: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  // Check access
  const hasAccess =
    todo.ownerId === user.id ||
    todo.sharedWith.some((u) => u.id === user.id) ||
    (todo.visibility === 'ORG' && todo.owner.org?.id === user.org?.id)

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ todo })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const todo = await prisma.todo.findUnique({
    where: { id: params.id },
  })

  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  if (todo.ownerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const { title, description, status, priority, dueDate, visibility, sharedWithUserIds } =
    body

  try {
    // Process description - handle string, null, or undefined
    let processedDescription: string | null = null
    if (description !== undefined) {
      if (typeof description === 'string' && description.trim()) {
        processedDescription = description.trim()
      } else {
        processedDescription = null
      }
    }

    const updated = await prisma.todo.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description: processedDescription }),
        ...(status && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && {
          dueDate: dueDate
            ? (() => {
                // Parse date string (YYYY-MM-DD) to avoid timezone issues
                const dateMatch = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
                if (dateMatch) {
                  const [, year, month, day] = dateMatch
                  // Create date in local timezone at midnight
                  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0)
                } else {
                  // Fallback to regular Date parsing if format is different
                  return new Date(dueDate)
                }
              })()
            : null,
        }),
        ...(visibility && { visibility }),
        ...(sharedWithUserIds && {
          sharedWith: {
            set: sharedWithUserIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ todo: updated })
  } catch (error: any) {
    console.error('Error updating todo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update todo' },
      { status: 500 }
    )
  }
}
