import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { getOrgIdFromSlug } from '@/lib/routing'
import { generateSlugFromOrgId } from '@/lib/org-slug'

export default async function OrgSlugSettingsPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  // Resolve org slug to org ID
  const orgId = await getOrgIdFromSlug(params.orgSlug)
  
  if (!orgId) {
    redirect('/')
  }

  // TODO: Re-enable auth after fixing code verification
  // const session = await getSession()
  // if (!session) {
  //   redirect('/login')
  // }
  
  // Temporary: Use dev user
  const user = await prisma.user.findFirst({
    where: { email: 'dev@central.local' },
    include: { org: true },
  }) || await prisma.user.create({
    data: {
      email: 'dev@central.local',
      name: 'Dev User',
      orgId: 'default-org',
    },
    include: { org: true },
  })

  // Verify user belongs to this org
  if (user.orgId !== orgId) {
    redirect('/')
  }

  // Ensure org exists
  if (!user.org) {
    // Create default org if it doesn't exist
    const org = await prisma.org.upsert({
      where: { id: orgId },
      update: {},
      create: {
        id: orgId,
        name: 'Default Organization',
        slug: generateSlugFromOrgId(orgId), // Auto-generate slug from org ID
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
