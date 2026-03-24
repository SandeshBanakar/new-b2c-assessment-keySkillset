'use client'

import { useEffect, useState } from 'react'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { fetchContentAnalytics, type ContentData, type ContentRow, type DateRange } from '@/lib/supabase/analytics'

function exportCsv(data: ContentData) {
  const rows = [
    ['Title', 'Type', 'Attempts', 'Avg Accuracy (%)', 'Pass Rate (%)'],
    ...[...data.rows, ...data.zeroAttempts].map((r) => [
      r.title, r.type, r.attempts,
      r.avgAccuracy ?? '—', r.passRate ?? '—',
    ]),
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'content-analytics.csv'; a.click()
  URL.revokeObjectURL(url)
}

function PassRateBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-zinc-400">—</span>
  const color = rate >= 60 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${color}`}>
      {rate}%
    </span>
  )
}

function ContentRow({ row }: { row: ContentRow }) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3 font-medium text-zinc-900 max-w-xs">
        <span className="block truncate" title={row.title}>{row.title}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
          row.type === 'Assessment'
            ? 'bg-blue-50 text-blue-700'
            : 'bg-violet-50 text-violet-700'
        }`}>
          {row.type}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-zinc-700 font-medium">{row.attempts}</td>
      <td className="px-4 py-3 text-right text-zinc-600">
        {row.avgAccuracy != null ? `${row.avgAccuracy}%` : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <PassRateBadge rate={row.passRate} />
      </td>
    </tr>
  )
}

export default function ContentTab({ range }: { range: DateRange }) {
  const [data, setData]           = useState<ContentData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [zeroOpen, setZeroOpen]   = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await fetchContentAnalytics(range)
      if (!cancelled) { setData(result); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading content analytics…
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Export */}
      <div className="flex justify-end">
        <button
          onClick={() => exportCsv(data)}
          className="text-xs font-medium text-zinc-500 border border-zinc-200 rounded-md px-3 py-1.5 hover:bg-zinc-50 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Main table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100">
          <p className="text-sm font-medium text-zinc-900">Content Performance</p>
          <p className="text-xs text-zinc-400 mt-0.5">Assessments ranked by attempt volume in selected period</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">TITLE</th>
              <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">TYPE</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">ATTEMPTS</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">AVG ACCURACY</th>
              <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2.5">PASS RATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">
                  No attempt data in the selected date range.
                </td>
              </tr>
            ) : (
              data.rows.map((row) => <ContentRow key={row.id} row={row} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Zero-attempts section */}
      {data.zeroAttempts.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
          <button
            onClick={() => setZeroOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {zeroOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
              <span className="text-sm font-medium text-zinc-700">
                Never Attempted ({data.zeroAttempts.length})
              </span>
            </div>
            <span className="text-xs text-zinc-400">All-time — no attempts recorded</span>
          </button>

          {zeroOpen && (
            <table className="w-full text-sm border-t border-zinc-100">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">TITLE</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2">TYPE</th>
                  <th className="text-right text-xs font-medium text-zinc-500 px-4 py-2">ATTEMPTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.zeroAttempts.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 text-zinc-600 max-w-xs">
                      <span className="block truncate" title={row.title}>{row.title}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-zinc-400 text-xs">0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
