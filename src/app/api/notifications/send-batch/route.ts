import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

// This endpoint should be called periodically (e.g., via Vercel Cron)
// to send batched todo notifications
export async function POST(request: NextRequest) {
  // Vercel Cron jobs send requests without auth headers
  // In production, you may want to add a secret check
  // For now, we'll allow it to run (you can add CRON_SECRET env var later)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all unsent notifications older than 2 hours
  const twoHoursAgo = new Date()
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

  const pendingNotifications = await prisma.todoNotification.findMany({
    where: {
      sent: false,
      createdAt: {
        lte: twoHoursAgo,
      },
    },
    include: {
      todo: {
        include: {
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (pendingNotifications.length === 0) {
    return NextResponse.json({ message: 'No notifications to send', count: 0 })
  }

  // Group notifications by user
  const notificationsByUser = new Map<string, typeof pendingNotifications>()
  
  for (const notification of pendingNotifications) {
    const userId = notification.userId
    if (!notificationsByUser.has(userId)) {
      notificationsByUser.set(userId, [])
    }
    notificationsByUser.get(userId)!.push(notification)
  }

  // Send batched emails
  const results = []
  for (const [userId, notifications] of notificationsByUser) {
    const user = notifications[0].user
    const todoCount = notifications.length

    // Build email content
    const todosList = notifications.map((n) => {
      const todo = n.todo
      const ownerName = todo.owner.name || todo.owner.email
      const dueDate = todo.dueDate
        ? new Date(todo.dueDate).toLocaleDateString()
        : 'No due date'
      
      return `
        <div style="border-left: 3px solid #2563eb; padding-left: 15px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 5px 0; color: #2563eb;">${todo.title}</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">
            Created by ${ownerName} • Due: ${dueDate}
            ${todo.description ? `<br>${todo.description}` : ''}
          </p>
        </div>
      `
    }).join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">New Shared Todos</h2>
          <p>You have ${todoCount} new shared ${todoCount === 1 ? 'todo' : 'todos'}:</p>
          ${todosList}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Todos</a>
          </div>
        </body>
      </html>
    `

    try {
      const result = await getResend().emails.send({
        from: process.env.EMAIL_FROM || 'noreply@notifications.nuclioapp.com',
        to: user.email,
        subject: `You have ${todoCount} new shared ${todoCount === 1 ? 'todo' : 'todos'}`,
        html: emailHtml,
      })

      if (!result.error) {
        // Mark all notifications as sent
        await prisma.todoNotification.updateMany({
          where: {
            userId: userId,
            id: { in: notifications.map(n => n.id) },
          },
          data: {
            sent: true,
            sentAt: new Date(),
          },
        })
        results.push({ userId, success: true, count: todoCount })
      } else {
        results.push({ userId, success: false, error: result.error })
      }
    } catch (error: any) {
      console.error(`Failed to send notification email to ${user.email}:`, error)
      results.push({ userId, success: false, error: error.message })
    }
  }

  return NextResponse.json({
    message: 'Batch notifications processed',
    total: pendingNotifications.length,
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  })
}
