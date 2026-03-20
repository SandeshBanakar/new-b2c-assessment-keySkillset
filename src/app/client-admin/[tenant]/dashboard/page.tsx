'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, Building2, BookOpen, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'

interface Stats {
  learnerCount: number
  deptCount: number
  teamCount: number
  certCount: number
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | null
  icon: React.ElementType
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-md px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-md bg-violet-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-violet-700" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-zinc-900">
          {value === null ? '—' : value}
        </p>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
    </div>
  )
}

export default function ClientAdminDashboard() {
  const params = useParams()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)

  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!tenantId) return

    Promise.all([
      supabase
        .from('learners')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE'),
      supabase
        .from('departments')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
    ]).then(([learners, depts, teams, certs]) => {
      setStats({
        learnerCount: learners.count ?? 0,
        deptCount: depts.count ?? 0,
        teamCount: teams.count ?? 0,
        certCount: certs.count ?? 0,
      })
    })
  }, [tenantId])

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Overview of your organisation
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Learners"
          value={stats?.learnerCount ?? null}
          icon={Users}
        />
        <StatCard
          label="Departments"
          value={stats?.deptCount ?? null}
          icon={Building2}
        />
        <StatCard
          label="Teams"
          value={stats?.teamCount ?? null}
          icon={Building2}
        />
        <StatCard
          label="Certificates Issued"
          value={stats?.certCount ?? null}
          icon={Award}
        />
      </div>

      <div className="mt-8 bg-white border border-zinc-200 rounded-md px-6 py-12 flex flex-col items-center justify-center text-center">
        <BookOpen className="w-8 h-8 text-zinc-300 mb-3" />
        <p className="text-sm font-medium text-zinc-500">
          More dashboard widgets coming soon
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Activity feed, content completion trends, and team performance
        </p>
      </div>
    </div>
  )
}
