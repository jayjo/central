import { prisma } from '@/lib/db'
import { QuickLauncherProvider } from '@/components/quick-launcher/QuickLauncherProvider'
import { OrgSlugProvider } from '@/components/layout/OrgSlugProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout is only used for routes that haven't been migrated to org-slug routes yet
  // Most routes should redirect to org-slug routes, so we just pass through children
  // The org-slug layout will handle the sidebar
  
  // Get user's org slug for the provider (needed for components that use org slug hooks)
  // TODO: Re-enable auth after fixing code verification
  const devUser = await prisma.user.findFirst({
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

  const orgSlug = devUser.org?.slug || null

  return (
    <QuickLauncherProvider>
      <OrgSlugProvider orgSlug={orgSlug}>
        {children}
      </OrgSlugProvider>
    </QuickLauncherProvider>
  )
}
