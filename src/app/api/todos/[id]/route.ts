import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
    (todo.visibility === 'ORG' && todo.owner.orgId === user.orgId)

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

  const body = await request.json()
  const { title, status, priority, dueDate, visibility, sharedWithUserIds } =
    body

  const updated = await prisma.todo.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(status && { status }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
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
}
