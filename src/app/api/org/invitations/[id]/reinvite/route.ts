import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const invitation = await prisma.orgInvitation.findUnique({
    where: { id: params.id },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }

  if (invitation.orgId !== user.orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (invitation.accepted) {
    return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
  }

  const token = randomBytes(32).toString('hex')
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  await prisma.orgInvitation.update({
    where: { id: params.id },
    data: { token, expires },
  })

  const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${token}`

  try {
    await getResend().emails.send({
      from: process.env.EMAIL_FROM || 'Nuclio <noreply@notifications.nuclioapp.com>',
      to: invitation.email,
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
  } catch (error: unknown) {
    console.error('Failed to send reinvite email:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
