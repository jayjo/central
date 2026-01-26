import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const feedback = formData.get('feedback') as string
    const userEmail = formData.get('userEmail') as string || session.user.email
    const screenshot = formData.get('screenshot') as File | null

    if (!feedback || !feedback.trim()) {
      return NextResponse.json({ error: 'Feedback is required' }, { status: 400 })
    }

    // Prepare email content
    let emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">New Feedback from Nuclio</h2>
          <p><strong>From:</strong> ${userEmail}</p>
          <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${feedback.trim()}</p>
          </div>
        </body>
      </html>
    `

    // Prepare email data
    const emailData: any = {
      from: process.env.EMAIL_FROM || 'Nuclio <noreply@notifications.nuclioapp.com>',
      to: 'jeff@jayjodesign.com',
      subject: `Feedback from Nuclio - ${userEmail}`,
      html: emailHtml,
    }

    // Attach screenshot if provided
    if (screenshot && screenshot.size > 0) {
      const screenshotBuffer = Buffer.from(await screenshot.arrayBuffer())
      emailData.attachments = [
        {
          filename: screenshot.name || 'screenshot.png',
          content: screenshotBuffer,
        },
      ]
    }

    // Send email
    const result = await getResend().emails.send(emailData)

    if (result.error) {
      console.error('Failed to send feedback email:', result.error)
      return NextResponse.json(
        { error: 'Failed to send feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process feedback' },
      { status: 500 }
    )
  }
}
