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

  const invitation = await prisma.orgInvitation.findUnique({
    where: { id: params.id },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }

  // Verify invitation belongs to user's org
  if (invitation.orgId !== user.orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete the invitation
  await prisma.orgInvitation.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
