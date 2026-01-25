import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token } = body

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const invitation = await prisma.orgInvitation.findUnique({
    where: { token },
    include: {
      org: true,
    },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 })
  }

  if (invitation.accepted) {
    return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
  }

  if (new Date() > invitation.expires) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
  }

  // Check if user is logged in
  const session = await getSession()
  
  if (!session?.user?.email) {
    // User needs to sign in first - return success so they can complete after sign in
    return NextResponse.json({ 
      success: true, 
      message: 'Please sign in first',
      email: invitation.email 
    })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify email matches
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'Email does not match invitation' },
      { status: 403 }
    )
  }

  // Accept invitation
  await prisma.orgInvitation.update({
    where: { id: invitation.id },
    data: { accepted: true },
  })

  // Update user's org
  await prisma.user.update({
    where: { id: user.id },
    data: { orgId: invitation.orgId },
  })

  return NextResponse.json({ success: true, orgId: invitation.orgId })
}
