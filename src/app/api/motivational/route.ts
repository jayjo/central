import { NextResponse } from 'next/server'
import { getTodayMessage } from '@/lib/db'

export async function GET() {
  const message = await getTodayMessage()
  return NextResponse.json({ message })
}
