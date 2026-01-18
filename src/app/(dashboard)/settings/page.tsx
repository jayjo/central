import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  // TODO: Re-enable auth after fixing code verification
  // const session = await getSession()
  // if (!session) {
  //   redirect('/login')
  // }
  
  // Temporary: Use dev user
  const user = await prisma.user.findFirst({
    where: { email: 'dev@central.local' },
  }) || await prisma.user.create({
    data: {
      email: 'dev@central.local',
      name: 'Dev User',
      orgId: 'default-org',
    },
  })

  return <SettingsForm user={user} />
}
