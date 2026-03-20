'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Library,
  BarChart2,
  UserCog,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'

interface TenantRow {
  id: string
  name: string
  feature_toggle_mode: string
}

// DESIGN DEVIATION: violet-700 / violet-50 for CA active nav state — differentiates Client Admin from Super Admin
function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: LucideIcon
  label: string
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={
        isActive
          ? 'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm font-medium transition-colors bg-violet-50 text-violet-700 border-l-2 border-violet-700 pl-1.5'
          : 'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm font-medium text-zinc-600 cursor-pointer hover:bg-zinc-50 hover:text-zinc-900 transition-colors'
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function ClientAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)
  const base = `/client-admin/${tenantSlug}`

  const [tenant, setTenant] = useState<TenantRow | null>(null)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('tenants')
      .select('id, name, feature_toggle_mode')
      .eq('id', tenantId)
      .single()
      .then(({ data }) => {
        if (data) setTenant(data as TenantRow)
      })
  }, [tenantId])

  const isFullCreator = tenant?.feature_toggle_mode === 'FULL_CREATOR'

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-zinc-200 h-screen fixed left-0 top-0 overflow-y-auto">
        <div className="px-4 py-4 border-b border-zinc-200">
          <p className="text-sm font-semibold text-zinc-900">
            {tenant?.name ?? 'Loading…'}
          </p>
          <span className="text-xs font-medium bg-violet-50 text-violet-700 rounded-md px-2 py-0.5 mt-1 inline-block">
            Client Admin
          </span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <NavItem href={`${base}/dashboard`} icon={LayoutDashboard} label="Dashboard" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Organisation
          </p>
          <NavItem href={`${base}/org`} icon={Building2} label="Departments & Teams" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            People
          </p>
          <NavItem href={`${base}/learners`} icon={Users} label="Learners" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Content
          </p>
          <NavItem href={`${base}/catalog`} icon={BookOpen} label="Catalog" />
          {isFullCreator && (
            <NavItem href={`${base}/content-bank`} icon={Library} label="Content Bank" />
          )}

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Insights
          </p>
          <NavItem href={`${base}/reports`} icon={BarChart2} label="Reports" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Settings
          </p>
          <NavItem href={`${base}/users-roles`} icon={UserCog} label="Users & Roles" />
          <NavItem href={`${base}/audit-log`} icon={ClipboardList} label="Audit Log" />
        </nav>

        <div className="mt-auto px-4 py-4 border-t border-zinc-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">
              {tenant ? getInitials(tenant.name) : 'CA'}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {tenant?.name ?? 'Client Admin'}
              </p>
              <p className="text-xs text-zinc-400">CLIENT_ADMIN</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-60 flex-1 min-h-screen bg-zinc-50 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
