'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Loader2, IndianRupee, TrendingUp, Percent } from 'lucide-react'
import { fetchRevenue, type RevenueData, type DateRange } from '@/lib/supabase/analytics'
import { chartColors } from '@/lib/chartColors'

// Static trend badge (locked)
const MRR_TREND   = '+₹8,940 MoM'
const CHURN_RATE  = '2.8%'

const PIE_COLORS = [
  chartColors.blue700,
  chartColors.violet600,
  chartColors.emerald600,
  chartColors.amber500,
  chartColors.rose600,
  chartColors.blue400,
]

function formatAxisDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function formatInr(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

function exportCsv(data: RevenueData) {
  const rows = [
    ['Plan', 'Subscribers', 'Price (INR)', 'MRR (INR)'],
    ...data.planRows.map((r) => [r.name, r.subscriberCount, r.price, r.mrr]),
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'revenue.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function RevenueTab({ range }: { range: DateRange }) {
  const [data, setData]       = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await fetchRevenue(range)
      if (!cancelled) { setData(result); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading revenue…
      </div>
    )
  }
  if (!data) return null

  const pieData = data.planRows.map((r) => ({ name: r.name, value: r.subscriberCount }))

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

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <IndianRupee className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total MRR</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{formatInr(data.totalMrr)}</p>
          <p className="text-xs font-medium text-emerald-600">{MRR_TREND}</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">New Subscriptions</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">
            {data.newSubsSeries.reduce((s, r) => s + r.count, 0)}
          </p>
          <p className="text-xs font-medium text-zinc-400">in selected period</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <Percent className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Churn Rate</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">{CHURN_RATE}</p>
          <p className="text-xs font-medium text-zinc-400">static estimate</p>
        </div>
      </div>

      {/* Charts row: pie + bar */}
      <div className="grid grid-cols-2 gap-4">
        {/* Donut — subscribers by plan */}
        <div className="bg-white border border-zinc-200 rounded-md p-4">
          <p className="text-sm font-medium text-zinc-900 mb-3">Subscribers by Plan</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v} subscribers`, '']}
                  contentStyle={{ fontSize: 12, borderColor: chartColors.zinc200, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar — MRR by plan */}
        <div className="bg-white border border-zinc-200 rounded-md p-4">
          <p className="text-sm font-medium text-zinc-900 mb-3">MRR by Plan</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.planRows.map((r) => ({ name: r.name, mrr: r.mrr }))}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.zinc300} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => formatInr(v)}
                  tick={{ fontSize: 10, fill: chartColors.zinc500 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 10, fill: chartColors.zinc500 }}
                />
                <Tooltip
                  formatter={(v) => [formatInr(Number(v)), 'MRR']}
                  contentStyle={{ fontSize: 12, borderColor: chartColors.zinc200, borderRadius: 6 }}
                />
                <Bar dataKey="mrr" fill={chartColors.blue700} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* New subscriptions over time */}
      {data.newSubsSeries.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-md p-4">
          <p className="text-sm font-medium text-zinc-900">New Subscriptions Over Time</p>
          <p className="text-xs text-zinc-400">Based on subscription start date in selected period</p>
          <div className="mt-4" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.newSubsSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.zinc300} />
                <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fontSize: 11, fill: chartColors.zinc500 }} />
                <YAxis tick={{ fontSize: 11, fill: chartColors.zinc500 }} width={28} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => formatAxisDate(v as string)}
                  contentStyle={{ fontSize: 12, borderColor: chartColors.zinc200, borderRadius: 6 }}
                />
                <Bar dataKey="count" name="New Subscriptions" fill={chartColors.violet600} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Plan table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">PLAN</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">SUBSCRIBERS</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">PRICE / MONTH</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">MRR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.planRows.map((r) => (
              <tr key={r.planId} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
                <td className="px-4 py-3 text-right text-zinc-600">{r.subscriberCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-zinc-600">₹{r.price.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium text-zinc-900">{formatInr(r.mrr)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-zinc-50 border-t border-zinc-200">
            <tr>
              <td colSpan={3} className="px-4 py-2.5 text-xs font-medium text-zinc-500">Total MRR</td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-zinc-900">
                {formatInr(data.totalMrr)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
