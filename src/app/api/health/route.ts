import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      emailFrom: process.env.EMAIL_FROM || 'NOT SET',
      nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasResendApiKey: !!process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM || 'NOT SET',
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
