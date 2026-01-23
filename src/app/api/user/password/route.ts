import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDevUser } from '@/lib/dev-auth'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest) {
  // TODO: Re-enable auth after fixing code verification
  const user = await getDevUser()

  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters long' },
      { status: 400 }
    )
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // If user has a password, verify current password
  if (dbUser.password) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }
  }

  // Hash and update password
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  return NextResponse.json({ success: true })
}
