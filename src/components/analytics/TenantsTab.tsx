'use client'

import { useEffect, useState } from 'react'
import { Loader2, Building2, Users, IndianRupee, CheckCircle } from 'lucide-react'
import { fetchTenantsAnalytics, type TenantsData, type TenantRow, type DateRange } from '@/lib/supabase/analytics'

function formatInr(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString()}`
}

function exportCsv(data: TenantsData) {
  const rows = [
    ['Tenant', 'Active', 'Total Learners', 'Active Learners (Period)', 'ARR (INR)', 'Contract End'],
    ...data.tenantRows.map((r) => [
      r.name, r.isActive ? 'Yes' : 'No',
      r.totalLearners, r.activeLearners, r.arr,
      r.contractEnd ?? '—',
    ]),
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'tenants-analytics.csv'; a.click()
  URL.revokeObjectURL(url)
}

function LearnerBar({ active, total }: { active: number; total: number }) {
  const pct = total > 0 ? Math.round((active / total) * 100) : 0
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-700' : 'bg-zinc-300'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-100 rounded-full h-1.5 min-w-16">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500 whitespace-nowrap">{active}/{total}</span>
    </div>
  )
}

function TenantTableRow({ row }: { row: TenantRow }) {
  const endFormatted = row.contractEnd
    ? new Date(row.contractEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3 font-medium text-zinc-900">{row.name}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
          row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <LearnerBar active={row.activeLearners} total={row.totalLearners} />
      </td>
      <td className="px-4 py-3 text-right font-medium text-zinc-900">{formatInr(row.arr)}</td>
      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
        {endFormatted}
        {row.isExpiringSoon && (
          <span className="ml-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
            Expiring
          </span>
        )}
      </td>
    </tr>
  )
}

export default function TenantsTab({ range }: { range: DateRange }) {
  const [data, setData]       = useState<TenantsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await fetchTenantsAnalytics(range)
      if (!cancelled) { setData(result); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading tenant analytics…
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="flex justify-end">
        <button
          onClick={() => exportCsv(data)}
          className="text-xs font-medium text-zinc-500 border border-zinc-200 rounded-md px-3 py-1.5 hover:bg-zinc-50 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Tenants</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{data.totalTenants}</p>
          <p className="text-xs text-zinc-400">{data.activeTenants} active</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Active Tenants</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{data.activeTenants}</p>
          <p className="text-xs font-medium text-emerald-600">100% retention</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">B2B Learners</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{data.totalB2BLearners}</p>
          <p className="text-xs text-zinc-400">across all tenants</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <IndianRupee className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total ARR</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{formatInr(data.totalArrInr)}</p>
          <p className="text-xs text-zinc-400">converted at ₹83/USD</p>
        </div>
      </div>

      {/* Tenant table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100">
          <p className="text-sm font-medium text-zinc-900">Tenant Overview</p>
          <p className="text-xs text-zinc-400 mt-0.5">Active learners shown for selected period</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">TENANT</th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">STATUS</th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 min-w-40">LEARNER ACTIVITY</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">ARR</th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">CONTRACT END</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.tenantRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">
                  No tenant data available.
                </td>
              </tr>
            ) : (
              data.tenantRows.map((row) => <TenantTableRow key={row.id} row={row} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Expiring soon note */}
      {data.tenantRows.every((r) => !r.isExpiringSoon) && (
        <p className="text-xs text-zinc-400 text-center">
          No contracts expiring within the selected date range.
        </p>
      )}
    </div>
  )
}
