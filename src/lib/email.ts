import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Central <noreply@yourdomain.com>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Email error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export function formatTodoNotificationEmail({
  todoTitle,
  ownerName,
  message,
  todoUrl,
}: {
  todoTitle: string
  ownerName?: string
  message?: string
  todoUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">New Shared Todo</h2>
        <p><strong>${todoTitle}</strong></p>
        ${ownerName ? `<p>From: ${ownerName}</p>` : ''}
        ${message ? `<p>${message}</p>` : ''}
        <p><a href="${todoUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Todo</a></p>
      </body>
    </html>
  `
}
