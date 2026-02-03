import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SEED_QUOTES = [
  { message: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'Career' },
  { message: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'Persistence' },
  { message: 'Everything you’ve ever wanted is on the other side of fear.', author: 'George Addair', category: 'Courage' },
  { message: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'Resilience' },
  { message: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins', category: 'Action' },
  { message: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein', category: 'Mindset' },
  { message: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar', category: 'Growth' },
]

async function main() {
  // Create an organization
  const orgId = 'default-org'
  const org = await prisma.org.upsert({
    where: { id: orgId },
    update: {},
    create: {
      id: orgId,
      name: 'Default Organization',
      slug: orgId,
    },
  })
  console.log('Created organization:', org)

  // Seed motivational messages for the next 7 days (UTC) so the inspiration bucket has content
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  const messages = SEED_QUOTES.map((q, i) => {
    const d = new Date(todayStart)
    d.setUTCDate(d.getUTCDate() + i)
    return {
      message: q.message,
      author: q.author,
      category: q.category,
      date: d,
      active: true,
    }
  })
  const result = await prisma.motivationalMessage.createMany({
    data: messages,
    skipDuplicates: true,
  })
  if (result.count > 0) {
    console.log('Seeded', result.count, 'motivational message(s)')
  }
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
