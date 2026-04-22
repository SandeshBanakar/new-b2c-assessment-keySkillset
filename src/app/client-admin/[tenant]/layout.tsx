'use client'

import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Library,
  BarChart2,
  UserCog,
  ClipboardList,
  MoreHorizontal,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'
import { FooterAdmins } from '@/components/layout/FooterAdmins'

interface TenantRow {
  id: string
  name: string
  feature_toggle_mode: string
  logo_url?: string | null
}

interface AdminUser {
  name: string
  email: string
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
  const router = useRouter()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)
  const base = `/client-admin/${tenantSlug}`

  const [tenant, setTenant] = useState<TenantRow | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tenantId) return

    Promise.all([
      supabase
        .from('tenants')
        .select('id, name, feature_toggle_mode, logo_url')
        .eq('id', tenantId)
        .single(),
      supabase
        .from('admin_users')
        .select('name, email')
        .eq('tenant_id', tenantId)
        .eq('role', 'CLIENT_ADMIN')
        .limit(1)
        .single(),
    ]).then(([{ data: tenantData }, { data: adminData }]) => {
      if (tenantData) setTenant(tenantData as TenantRow)
      if (adminData) setAdminUser(adminData as AdminUser)
    })
  }, [tenantId])

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const isFullCreator = tenant?.feature_toggle_mode === 'FULL_CREATOR'

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-zinc-200 h-screen fixed left-0 top-0 overflow-y-auto">
        {/* Tenant header */}
        <div className="px-4 py-4 border-b border-zinc-200">
          {tenant?.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-8 max-w-32 object-contain mb-1"
            />
          ) : (
            <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 mb-1">
              {tenant ? getInitials(tenant.name) : '…'}
            </div>
          )}
          <span className="text-xs font-medium bg-violet-50 text-violet-700 rounded-md px-2 py-0.5 inline-block">
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
          <NavItem href={`${base}/catalog`} icon={BookOpen} label="Global Catalog" />
          {isFullCreator && (
            <NavItem href={`${base}/content-bank`} icon={Library} label="Content Bank" />
          )}

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Insights
          </p>
          {/* Reports merged into Dashboard - kept for backward compatibility */}
          <NavItem href={`${base}/reports`} icon={BarChart2} label="Reports" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Settings
          </p>
          <NavItem href={`${base}/users-roles`} icon={UserCog} label="Users & Roles" />
          <NavItem href={`${base}/audit-log`} icon={ClipboardList} label="Audit Log" />
        </nav>

        {/* Admin user footer */}
        <div className="mt-auto px-3 py-3 border-t border-zinc-200">
          <div ref={menuRef} className="relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 shrink-0">
                {adminUser ? getInitials(adminUser.name) : 'CA'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {adminUser?.name ?? 'Client Admin'}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {adminUser?.email ?? ''}
                </p>
              </div>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {menuOpen && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-zinc-200 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => { setMenuOpen(false); router.push('/') }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="ml-60 flex-1 min-h-screen bg-zinc-50 overflow-y-auto flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <FooterAdmins />
      </main>
    </div>
  )
}
