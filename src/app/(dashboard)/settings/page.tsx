import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { generateSlugFromOrgId } from '@/lib/org-slug'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session?.user?.email) {
    redirect('/login')
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { org: true },
  })
  
  if (!user) {
    redirect('/login')
  }

  // If user has an org slug, redirect to org-scoped settings
  if (user.org?.slug) {
    redirect(`/${user.org.slug}/settings`)
  }

  // Ensure org exists
  if (!user.org) {
    // Create default org if it doesn't exist
    const org = await prisma.org.upsert({
      where: { id: 'default-org' },
      update: {},
      create: {
        id: 'default-org',
        name: 'Default Organization',
        slug: generateSlugFromOrgId('default-org'), // Auto-generate slug from org ID
      },
    })
    return <SettingsForm user={user} org={org} />
  }

  // Auto-generate slug if it doesn't exist (use org ID)
  if (!user.org.slug) {
    const autoSlug = generateSlugFromOrgId(user.org.id)
    
    const updatedOrg = await prisma.org.update({
      where: { id: user.org.id },
      data: { slug: autoSlug },
    })

    // Redirect to org-scoped settings with the new slug
    redirect(`/${autoSlug}/settings`)
  }

  return <SettingsForm user={user} org={user.org} />
}
