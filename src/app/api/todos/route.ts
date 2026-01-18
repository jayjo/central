import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDevUser } from '@/lib/dev-auth'

export async function GET(request: NextRequest) {
  // TODO: Re-enable auth after fixing code verification
  const user = await getDevUser()

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
  // TODO: Re-enable auth after fixing code verification
  const user = await getDevUser()

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
