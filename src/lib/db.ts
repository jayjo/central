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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const message = await prisma.motivationalMessage.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return message ? {
      message: message.message,
      author: message.author,
      category: message.category,
    } : null
  } catch (error) {
    return null
  }
}
