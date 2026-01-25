import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function DELETE(
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

  const memberToRemove = await prisma.user.findUnique({
    where: { id: params.id },
  })

  if (!memberToRemove) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Verify member belongs to user's org
  if (memberToRemove.orgId !== user.orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Prevent removing yourself
  if (memberToRemove.id === user.id) {
    return NextResponse.json(
      { error: 'You cannot remove yourself from the organization' },
      { status: 400 }
    )
  }

  // Check if this is the only member (prevent removing last member)
  const memberCount = await prisma.user.count({
    where: { orgId: user.orgId },
  })

  if (memberCount <= 1) {
    return NextResponse.json(
      { error: 'Cannot remove the last member of the organization' },
      { status: 400 }
    )
  }

  // Remove member from org by assigning them to default org
  // This preserves their data but removes them from the current org
  await prisma.user.update({
    where: { id: params.id },
    data: { orgId: 'default-org' },
  })

  return NextResponse.json({ success: true })
}
