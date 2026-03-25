'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import {
  LayoutDashboard,
  Library,
  Users,
  PenTool,
  Building2,
  GitBranch,
  BookMarked,
  FileEdit,
  Upload,
  CreditCard,
  Megaphone,
  Shield,
  PlaySquare,
  LogOut,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'

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
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={
        isActive
          ? 'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm font-medium transition-colors bg-blue-50 text-blue-700 border-l-2 border-blue-700 pl-1.5'
          : 'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm font-medium text-zinc-600 cursor-pointer hover:bg-zinc-50 hover:text-zinc-900 transition-colors'
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}


export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <ToastProvider>
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-zinc-200 h-screen fixed left-0 top-0 overflow-y-auto">
        <div className="px-4 py-4 border-b border-zinc-200">
          <p className="text-sm font-semibold text-zinc-900">keySkillset</p>
          <span className="text-xs font-medium bg-blue-50 text-blue-700 rounded-md px-2 py-0.5 mt-1 inline-block">
            Super Admin
          </span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <NavItem href="/super-admin/dashboard" icon={LayoutDashboard} label="Dashboard" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Content Management
          </p>
          <NavItem href="/super-admin/content-bank" icon={Library} label="Content Bank" />
          <NavItem href="/super-admin/plans-pricing" icon={CreditCard} label="Plans & Pricing" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Master Organisation
          </p>
          <NavItem href="/super-admin/b2c-users" icon={Users} label="B2C Users" />
          <NavItem href="/super-admin/content-creators" icon={PenTool} label="Content Creators" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Client Admins
          </p>
          <NavItem href="/super-admin/tenants" icon={Building2} label="Client Admins" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Course Creation
          </p>
          <NavItem href="/super-admin/create-course" icon={PlaySquare} label="Create Course" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Assessment Creation
          </p>
          <NavItem href="/super-admin/sources-questions" icon={GitBranch} label="Sources & Questions" />
          <NavItem href="/super-admin/question-bank" icon={BookMarked} label="Question Bank" />
          <NavItem href="/super-admin/create-assessments" icon={FileEdit} label="Create Assessments" />
          <NavItem href="/super-admin/bulk-upload" icon={Upload} label="Bulk Upload" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Configuration
          </p>
          <NavItem href="/super-admin/marketing" icon={Megaphone} label="Marketing Config" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Compliance
          </p>
          <NavItem href="/super-admin/audit-log" icon={Shield} label="Audit Log" />
        </nav>

        <div className="mt-auto px-3 py-3 border-t border-zinc-200">
          <div ref={menuRef} className="relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                SA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">Super Admin</p>
                <p className="text-xs text-zinc-400 truncate">SUPER_ADMIN</p>
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

      <main className="ml-60 flex-1 min-h-screen bg-zinc-50 overflow-y-auto">
        {children}
      </main>
    </div>
    </ToastProvider>
  )
}
