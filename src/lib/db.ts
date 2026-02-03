import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test database connection on startup
if (typeof window === 'undefined') {
  prisma.$connect().catch(() => {
    // Database connection error - fail silently in production
  })
}

export async function getTodayMessage() {
  try {
    // Use UTC date range so "today" is consistent across servers (e.g. Vercel UTC)
    // and matches messages stored as UTC midnight by import/seed
    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

    let message = await prisma.motivationalMessage.findFirst({
      where: {
        date: {
          gte: todayStart,
          lt: tomorrowStart,
        },
        active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Fallback: if no message for today (e.g. table empty or no match), show most recent active message
    if (!message) {
      message = await prisma.motivationalMessage.findFirst({
        where: { active: true },
        orderBy: { date: 'desc' },
      })
    }

    return message ? {
      message: message.message,
      author: message.author,
      category: message.category,
    } : null
  } catch (error) {
    return null
  }
}
