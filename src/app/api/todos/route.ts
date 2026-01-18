import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams
  const filter = searchParams.get('filter') || 'my'

  let todos

  if (filter === 'my') {
    todos = await prisma.todo.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { visibility: 'ORG', owner: { orgId: user.orgId } },
        ],
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
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: { sort: 'asc', nulls: 'last' } },
      ],
    })
  } else if (filter === 'shared') {
    todos = await prisma.todo.findMany({
      where: {
        AND: [
          { ownerId: { not: user.id } },
          {
            OR: [
              { visibility: 'ORG', owner: { orgId: user.orgId } },
              { sharedWith: { some: { id: user.id } } },
            ],
          },
        ],
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
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: { sort: 'asc', nulls: 'last' } },
      ],
    })
  } else {
    return NextResponse.json({ error: 'Invalid filter' }, { status: 400 })
  }

  return NextResponse.json({ todos })
}

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
  const { title, priority, dueDate, visibility, sharedWithUserIds } = body

  if (!title) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  const todo = await prisma.todo.create({
    data: {
      title,
      ownerId: user.id,
      priority: priority || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      visibility: visibility || 'PRIVATE',
      sharedWith: sharedWithUserIds
        ? {
            connect: sharedWithUserIds.map((id: string) => ({ id })),
          }
        : undefined,
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

  // Send notifications if shared
  if (visibility !== 'PRIVATE' && todo.sharedWith.length > 0) {
    // TODO: Implement email notifications
  }

  return NextResponse.json({ todo })
}
