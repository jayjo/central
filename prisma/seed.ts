import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create an organization
  const org = await prisma.org.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Default Organization',
    },
  })

  console.log('Created organization:', org)

  // Note: Users will be created automatically when they sign in via NextAuth
  // But you can create a test user here if needed
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
