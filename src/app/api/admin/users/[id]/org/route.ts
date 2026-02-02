import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const ADMIN_EMAIL = 'jeff@jayjodesign.com'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session?.user?.email || session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { orgId } = body
  if (!orgId || typeof orgId !== 'string') {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
  }

  const org = await prisma.org.findUnique({
    where: { id: orgId },
  })
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { orgId },
  })

  return NextResponse.json({ success: true, orgId })
}
