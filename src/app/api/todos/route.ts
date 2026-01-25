import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

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

  let body
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const { title, description, priority, dueDate, visibility, sharedWithUserIds } = body

  if (!title) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  // Parse date string (YYYY-MM-DD) to avoid timezone issues
  // Create date at local midnight instead of UTC midnight
  let parsedDueDate: Date | null = null
  if (dueDate) {
    // Use the same approach as in the PATCH route - append T00:00:00 to ensure local midnight
    parsedDueDate = new Date(dueDate + 'T00:00:00')
  }

  const todo = await prisma.todo.create({
    data: {
      title,
      description: description || null,
      ownerId: user.id,
      priority: priority || null,
      dueDate: parsedDueDate,
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

  // Create notifications for shared todos
  if (visibility === 'ORG' || (sharedWithUserIds && sharedWithUserIds.length > 0)) {
    // Get all users in the org (for ORG visibility) or specific shared users
    let usersToNotify: string[] = []
    
    if (visibility === 'ORG') {
      // Get all users in the org except the owner
      const orgUsers = await prisma.user.findMany({
        where: {
          orgId: user.orgId,
          id: { not: user.id },
        },
        select: { id: true },
      })
      usersToNotify = orgUsers.map(u => u.id)
    } else if (sharedWithUserIds && sharedWithUserIds.length > 0) {
      usersToNotify = sharedWithUserIds
    }

    // Create notification records for each user
    if (usersToNotify.length > 0) {
      await prisma.todoNotification.createMany({
        data: usersToNotify.map((userId) => ({
          todoId: todo.id,
          userId,
        })),
        skipDuplicates: true,
      })
    }
  }

  return NextResponse.json({ todo })
}
