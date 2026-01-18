import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDevUser } from '@/lib/dev-auth'

export async function PATCH(request: NextRequest) {
  // TODO: Re-enable auth after fixing code verification
  const user = await getDevUser()

  const body = await request.json()
  const { name, zipCode } = body

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name: name || null }),
      ...(zipCode !== undefined && { zipCode: zipCode || null }),
    },
  })

  return NextResponse.json({ user: updated })
}
