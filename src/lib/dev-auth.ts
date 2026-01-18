import { prisma } from './db'

// Temporary dev auth bypass - TODO: Remove after fixing real auth
export async function getDevUser() {
  return await prisma.user.findFirst({
    where: { email: 'dev@central.local' },
  }) || await prisma.user.create({
    data: {
      email: 'dev@central.local',
      name: 'Dev User',
      orgId: 'default-org',
    },
  })
}
