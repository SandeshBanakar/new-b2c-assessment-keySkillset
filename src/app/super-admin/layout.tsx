'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Library,
  ShoppingBag,
  Users,
  PenTool,
  Building2,
  GitBranch,
  BookMarked,
  FileEdit,
  Upload,
  MousePointerClick,
  Terminal,
  Keyboard,
  Play,
  Layers,
  CreditCard,
  Megaphone,
  BarChart2,
  Shield,
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
          ? 'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm font-medium transition-colors bg-blue-50 text-blue-700 border-l-2 border-blue-700 pl-[6px]'
          : 'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm font-medium text-zinc-600 cursor-pointer hover:bg-zinc-50 hover:text-zinc-900 transition-colors'
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
      {label}
    </p>
  )
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <aside className="w-60 flex-shrink-0 flex flex-col bg-white border-r border-zinc-200 h-screen fixed left-0 top-0 overflow-y-auto">
        <div className="px-4 py-4 border-b border-zinc-200">
          <p className="text-sm font-semibold text-zinc-900">keySkillset</p>
          <span className="text-xs font-medium bg-blue-50 text-blue-700 rounded-md px-2 py-0.5 mt-1 inline-block">
            Super Admin
          </span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <NavItem href="/super-admin/dashboard" icon={LayoutDashboard} label="Dashboard" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Content
          </p>
          <NavItem href="/super-admin/content-bank" icon={Library} label="Content Bank" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Monetisation
          </p>
          <NavItem href="/super-admin/plans-pricing" icon={CreditCard} label="Plans & Pricing" />
          <NavItem href="/super-admin/course-store" icon={ShoppingBag} label="Course Store" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Master Organisation
          </p>
          <NavItem href="/super-admin/b2c-users" icon={Users} label="B2C Users" />
          <NavItem href="/super-admin/content-creators" icon={PenTool} label="Content Creators" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Organisations
          </p>
          <NavItem href="/super-admin/tenants" icon={Building2} label="Tenants" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Assessment Creation
          </p>
          <NavItem href="/super-admin/sources-questions" icon={GitBranch} label="Sources & Questions" />
          <NavItem href="/super-admin/question-bank" icon={BookMarked} label="Question Bank" />
          <NavItem href="/super-admin/create-assessments" icon={FileEdit} label="Create Assessments" />
          <NavItem href="/super-admin/bulk-upload" icon={Upload} label="Bulk Upload" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Course Creation
          </p>
          <NavItem href="/super-admin/click-based-course" icon={MousePointerClick} label="Click-based Course" />
          <NavItem href="/super-admin/coding-sandbox-course" icon={Terminal} label="Coding Sandbox" />
          <NavItem href="/super-admin/keyboard-trainer-course" icon={Keyboard} label="Keyboard Trainer" />
          <NavItem href="/super-admin/video-based-course" icon={Play} label="Video-based Course" />
          <NavItem href="/super-admin/combination-course" icon={Layers} label="Combination Course" />

          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-2 pt-5 pb-1 select-none">
            Configuration
          </p>
          <NavItem href="/super-admin/marketing" icon={Megaphone} label="Marketing Config" />
          <NavItem href="/super-admin/analytics" icon={BarChart2} label="Analytics" />
          <NavItem href="/super-admin/audit-log" icon={Shield} label="Audit Log" />
        </nav>

        <div className="mt-auto px-4 py-4 border-t border-zinc-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
              SA
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">Super Admin</p>
              <p className="text-xs text-zinc-400">SUPER_ADMIN</p>
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
