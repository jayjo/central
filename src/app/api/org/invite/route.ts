import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { org: true },
  })

  if (!user || !user.org) {
    return NextResponse.json({ error: 'User or organization not found' }, { status: 404 })
  }

  const body = await request.json()
  const { email } = body

  if (!email || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Check if user is already in the org
  const existingUser = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  })

  if (existingUser && existingUser.orgId === user.orgId) {
    return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 })
  }

  // Check if there's already a pending invitation
  const existingInvitation = await prisma.orgInvitation.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      orgId: user.orgId,
      accepted: false,
      expires: {
        gt: new Date(),
      },
    },
  })

  if (existingInvitation) {
    return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 })
  }

  // Generate invitation token
  const token = randomBytes(32).toString('hex')
  const expires = new Date()
  expires.setDate(expires.getDate() + 7) // Expires in 7 days

  // Create invitation
  const invitation = await prisma.orgInvitation.create({
    data: {
      email: email.trim().toLowerCase(),
      orgId: user.orgId,
      invitedBy: user.id,
      token,
      expires,
    },
  })

  // Send invitation email
  const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${token}`
  
  try {
    await getResend().emails.send({
      from: process.env.EMAIL_FROM || 'Nuclio <noreply@notifications.nuclioapp.com>',
      to: email.trim().toLowerCase(),
      subject: `Invitation to join ${user.org.name || 'Nuclio'}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">You've been invited!</h2>
            <p>${user.name || user.email} has invited you to join <strong>${user.org.name}</strong> on Nuclio.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Accept Invitation</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">This invitation will expire in 7 days.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </body>
        </html>
      `,
    })
  } catch (error: any) {
    console.error('Failed to send invitation email:', error)
    // Delete the invitation if email fails
    await prisma.orgInvitation.delete({
      where: { id: invitation.id },
    })
    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, invitation })
}
