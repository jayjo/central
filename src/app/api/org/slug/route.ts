import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  // Validate slug format (alphanumeric and hyphens only, 3-30 chars)
  const slugRegex = /^[a-z0-9-]{3,30}$/
  if (!slugRegex.test(slug)) {
    return NextResponse.json({ 
      available: false, 
      error: 'Slug must be 3-30 characters and contain only lowercase letters, numbers, and hyphens' 
    }, { status: 200 })
  }

  // Check if slug is taken
  const existingOrg = await prisma.org.findUnique({
    where: { slug },
  })

  return NextResponse.json({ 
    available: !existingOrg,
    slug 
  })
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userWithOrg = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { org: true },
  })

  if (!userWithOrg?.org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const body = await request.json()
  const { slug } = body

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9-]{3,30}$/
  if (!slugRegex.test(slug)) {
    return NextResponse.json({ 
      error: 'Slug must be 3-30 characters and contain only lowercase letters, numbers, and hyphens' 
    }, { status: 400 })
  }

  // Check if slug is already taken by another org
  const existingOrg = await prisma.org.findUnique({
    where: { slug },
  })

  if (existingOrg && existingOrg.id !== userWithOrg.org.id) {
    return NextResponse.json({ error: 'This slug is already taken' }, { status: 409 })
  }

  // Update org slug
  try {
    const updated = await prisma.org.update({
      where: { id: userWithOrg.org.id },
      data: { slug },
    })

    return NextResponse.json({ org: updated })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This slug is already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update slug' }, { status: 500 })
  }
}
