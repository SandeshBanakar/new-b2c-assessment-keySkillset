'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Loader2, FileText, Users, TrendingUp, BarChart2 } from 'lucide-react'
import {
  fetchAssessmentsAnalytics,
  type AssessmentsAnalyticsData,
  type DateRange,
} from '@/lib/supabase/analytics'
import { chartColors } from '@/lib/chartColors'

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
      <div className="flex items-center gap-2 text-zinc-400">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-zinc-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  )
}

function formatAxisDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function AssessmentsTab({ range }: { range: DateRange }) {
  const [data, setData]       = useState<AssessmentsAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await fetchAssessmentsAnalytics(range)
      if (!cancelled) { setData(result); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading assessments data…
      </div>
    )
  }
  if (!data) return null

  // Merge series by date
  const dateSet = new Set([
    ...data.attemptsSeries.map((r) => r.date),
    ...data.uniqueUsersSeries.map((r) => r.date),
  ])
  const attemptsMap: Record<string, number> = {}
  const usersMap: Record<string, number> = {}
  for (const r of data.attemptsSeries)    attemptsMap[r.date] = r.count
  for (const r of data.uniqueUsersSeries) usersMap[r.date]    = r.count

  const combined = [...dateSet].sort().map((d) => ({
    date: d,
    attempts: attemptsMap[d] ?? 0,
    uniqueUsers: usersMap[d] ?? 0,
  }))

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Users}      label="Total Users"          value={data.totalUniqueUsers} />
        <KpiCard icon={FileText}   label="Assessments in Use"   value={data.assessmentsInUse} />
        <KpiCard icon={TrendingUp} label="Avg Score"            value={`${data.avgScore}%`} />
        <KpiCard icon={BarChart2}  label="Total Attempts"       value={data.totalAttempts} />
      </div>

      {/* Chart: Attempts per day + Unique users per day */}
      {combined.length > 0 ? (
        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <p className="text-sm font-medium text-zinc-900">Assessment Activity</p>
          <p className="text-xs text-zinc-400">Attempts per day and unique users per day</p>
          <div className="mt-4" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combined} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColors.blue700}    stopOpacity={0.15} />
                    <stop offset="95%" stopColor={chartColors.blue700}    stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColors.violet600}  stopOpacity={0.15} />
                    <stop offset="95%" stopColor={chartColors.violet600}  stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.zinc300} />
                <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fontSize: 11, fill: chartColors.zinc500 }} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.zinc500 }} width={32} />
                <Tooltip
                  labelFormatter={(v) => formatAxisDate(v as string)}
                  contentStyle={{ fontSize: 12, borderColor: chartColors.zinc200, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="attempts"    name="Attempts / Day"     stroke={chartColors.blue700}   fill="url(#gradAttempts)" strokeWidth={2} />
                <Area type="monotone" dataKey="uniqueUsers" name="Unique Users / Day"  stroke={chartColors.violet600} fill="url(#gradUsers)"    strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-md p-8 text-center text-sm text-zinc-400">
          No assessment activity in the selected date range.
        </div>
      )}

      {/* Per-assessment table */}
      {data.assessmentStats.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-medium text-zinc-900">Per-Assessment Breakdown</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 uppercase tracking-wide">Assessment</th>
                <th className="text-center text-xs font-medium text-zinc-500 px-4 py-2.5 uppercase tracking-wide">Total Attempts</th>
                <th className="text-center text-xs font-medium text-zinc-500 px-4 py-2.5 uppercase tracking-wide">Unique Users</th>
                <th className="text-center text-xs font-medium text-zinc-500 px-4 py-2.5 uppercase tracking-wide">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.assessmentStats.map((stat) => (
                <tr key={stat.assessmentId} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{stat.title}</td>
                  <td className="px-4 py-3 text-center text-zinc-600">{stat.totalAttempts}</td>
                  <td className="px-4 py-3 text-center text-zinc-600">{stat.uniqueUsers}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${stat.avgScore >= 60 ? 'text-green-700' : 'text-amber-700'}`}>
                      {stat.avgScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
