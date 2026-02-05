'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronDown, Search, Plus } from 'lucide-react'
import { useOrgSlug } from '@/components/layout/OrgSlugProvider'
import { useQuickLauncher } from '@/components/quick-launcher/QuickLauncherProvider'
import { getMyTodosUrl, getSharedTodosUrl } from '@/lib/org-routing'
import { cn } from '@/lib/utils'

export function TopBar({ orgName }: { orgName: string }) {
  const pathname = usePathname()
  const orgSlug = useOrgSlug()
  const quickLauncher = useQuickLauncher()
  const myTodosUrl = orgSlug ? getMyTodosUrl(orgSlug) : '/my-todos'
  const sharedUrl = orgSlug ? getSharedTodosUrl(orgSlug) : '/shared'

  const isTaskView = pathname === myTodosUrl || pathname === sharedUrl
  const isAll = pathname === myTodosUrl
  const isShared = pathname === sharedUrl

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <span className="font-semibold text-foreground">{orgName}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
            <Link href={orgSlug ? `/${orgSlug}` : '/'}>
              <ChevronDown className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Search">
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label="New"
          onClick={() => quickLauncher.open()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'rounded-md',
            isTaskView && 'underline underline-offset-4 decoration-2 decoration-primary'
          )}
          asChild
        >
          <Link href={myTodosUrl}>Tasks</Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn('rounded-md', isAll && 'border border-border bg-secondary/50')}
          asChild
        >
          <Link href={myTodosUrl}>All</Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn('rounded-md', isShared && 'border border-border bg-secondary/50')}
          asChild
        >
          <Link href={sharedUrl}>Shared</Link>
        </Button>
        <Button variant="ghost" size="sm" className="rounded-md" asChild>
          <Link href={myTodosUrl}>Mine</Link>
        </Button>
      </nav>
    </header>
  )
}
