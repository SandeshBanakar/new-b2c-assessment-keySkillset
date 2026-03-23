'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BarChart2,
  Users,
  BookOpen,
  Award,
  Activity,
  Download,
  Search,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'learner' | 'content' | 'certificates' | 'activity'

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function downloadCSV(
  headers: string[],
  rows: (string | number | null)[][],
  filename: string,
) {
  const esc = (v: string | number | null) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function csvTimestamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'ASSESSMENT' | 'COURSE' }) {
  return type === 'ASSESSMENT' ? (
    <span className="text-xs font-medium rounded-md px-2 py-0.5 border bg-blue-50 text-blue-700 border-blue-200">
      Assessment
    </span>
  ) : (
    <span className="text-xs font-medium rounded-md px-2 py-0.5 border bg-violet-50 text-violet-700 border-violet-200">
      Course
    </span>
  )
}

function StatusBadge({
  status,
}: {
  status: 'Passed' | 'Failed' | 'In Progress'
}) {
  const cls = {
    Passed:      'bg-green-50 text-green-700 border-green-200',
    Failed:      'bg-rose-50 text-rose-700 border-rose-200',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  }[status]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${cls}`}>
      {status}
    </span>
  )
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      Export CSV
    </button>
  )
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="py-1.5 pl-3 pr-7 text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
    >
      {children}
    </select>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-700 w-52"
      />
    </div>
  )
}

function TableLoading() {
  return <div className="px-6 py-12 text-center text-sm text-zinc-400">Loading…</div>
}

function TableEmpty({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-zinc-500">{message}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

function RowCount({ shown, total, unit }: { shown: number; total: number; unit: string }) {
  return (
    <p className="mt-3 text-xs text-zinc-400">
      {shown} {shown !== 1 ? unit + 's' : unit}{shown < total ? ` of ${total}` : ''}
    </p>
  )
}

// ─── R3: Learner Performance ──────────────────────────────────────────────────

interface LearnerPerfRow {
  key: string
  learner_id: string
  learner_name: string
  dept_name: string
  content_id: string
  content_title: string
  content_type: 'ASSESSMENT' | 'COURSE'
  attempts: number
  best_score: number
  last_attempt: string
  status: 'Passed' | 'Failed' | 'In Progress'
}

function LearnerPerformanceTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<LearnerPerfRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [depts, setDepts] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: attempts }, { data: learnerRows }, { data: deptRows }] =
        await Promise.all([
          supabase
            .from('learner_attempts')
            .select('learner_id, content_id, content_type, score_pct, passed, attempted_at')
            .eq('tenant_id', tenantId),
          supabase
            .from('learners')
            .select('id, full_name, department_id')
            .eq('tenant_id', tenantId),
          supabase
            .from('departments')
            .select('id, name')
            .eq('tenant_id', tenantId),
        ])

      if (!attempts?.length) { setLoading(false); return }

      const deptMap: Record<string, string> = Object.fromEntries(
        (deptRows ?? []).map(d => [d.id, d.name])
      )
      const learnerMap: Record<string, { name: string; dept: string }> =
        Object.fromEntries(
          (learnerRows ?? []).map(l => [
            l.id,
            { name: l.full_name, dept: deptMap[l.department_id ?? ''] ?? '—' },
          ])
        )

      // Resolve content titles
      const aIds = [...new Set(attempts.filter(a => a.content_type === 'ASSESSMENT').map(a => a.content_id))]
      const cIds = [...new Set(attempts.filter(a => a.content_type === 'COURSE').map(a => a.content_id))]
      const titleMap: Record<string, string> = {}
      if (aIds.length) {
        const { data } = await supabase.from('content_items').select('id, title').in('id', aIds)
        ;(data ?? []).forEach(r => { titleMap[r.id] = r.title })
      }
      if (cIds.length) {
        const { data } = await supabase.from('courses').select('id, title').in('id', cIds)
        ;(data ?? []).forEach(r => { titleMap[r.id] = r.title })
      }

      // Aggregate per (learner, content)
      const grouped: Record<string, typeof attempts> = {}
      for (const a of attempts) {
        const k = `${a.learner_id}|${a.content_id}`
        ;(grouped[k] ??= []).push(a)
      }

      const result: LearnerPerfRow[] = Object.entries(grouped).map(([k, grp]) => {
        const [learner_id, content_id] = k.split('|')
        const content_type = grp[0].content_type as 'ASSESSMENT' | 'COURSE'
        const best_score = Math.max(...grp.map(a => Number(a.score_pct)))
        const last_attempt = [...grp].sort(
          (a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime()
        )[0].attempted_at
        const passed_any = grp.some(a => a.passed)

        let status: LearnerPerfRow['status']
        if (passed_any) status = 'Passed'
        else if (content_type === 'COURSE' && best_score > 0 && best_score < 100) status = 'In Progress'
        else status = 'Failed'

        return {
          key: k,
          learner_id,
          learner_name: learnerMap[learner_id]?.name ?? '—',
          dept_name: learnerMap[learner_id]?.dept ?? '—',
          content_id,
          content_title: titleMap[content_id] ?? '—',
          content_type,
          attempts: grp.length,
          best_score,
          last_attempt,
          status,
        }
      })

      result.sort((a, b) => new Date(b.last_attempt).getTime() - new Date(a.last_attempt).getTime())
      setRows(result)
      setDepts(deptRows ?? [])
      setLoading(false)
    }
    void load()
  }, [tenantId])

  const filtered = rows.filter(r => {
    if (deptFilter !== 'ALL' && r.dept_name !== deptFilter) return false
    if (typeFilter !== 'ALL' && r.content_type !== typeFilter) return false
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.learner_name.toLowerCase().includes(q) && !r.content_title.toLowerCase().includes(q))
        return false
    }
    return true
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search learner or content…" />
        <FilterSelect value={deptFilter} onChange={setDeptFilter}>
          <option value="ALL">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </FilterSelect>
        <FilterSelect value={typeFilter} onChange={setTypeFilter}>
          <option value="ALL">All Types</option>
          <option value="ASSESSMENT">Assessment</option>
          <option value="COURSE">Course</option>
        </FilterSelect>
        <FilterSelect value={statusFilter} onChange={setStatusFilter}>
          <option value="ALL">All Statuses</option>
          <option value="Passed">Passed</option>
          <option value="In Progress">In Progress</option>
          <option value="Failed">Failed</option>
        </FilterSelect>
        <ExportButton onClick={() => downloadCSV(
          ['Learner', 'Department', 'Content', 'Type', 'Attempts', 'Best Score (%)', 'Last Attempt', 'Status'],
          filtered.map(r => [r.learner_name, r.dept_name, r.content_title, r.content_type, r.attempts, r.best_score, formatDate(r.last_attempt), r.status]),
          `keyskillset_learner_scores_${csvTimestamp()}.csv`,
        )} />
      </div>

      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        {loading ? <TableLoading /> : filtered.length === 0 ? (
          <TableEmpty message="No results match your filters." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Learner</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Department</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide w-[22%]">Content</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Attempts</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Best Score</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Last Attempt</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(r => (
                <tr key={r.key} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900">{r.learner_name}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.dept_name}</td>
                  <td className="px-4 py-3 text-zinc-700 max-w-xs truncate">{r.content_title}</td>
                  <td className="px-4 py-3"><TypeBadge type={r.content_type} /></td>
                  <td className="px-4 py-3 text-right text-zinc-700">{r.attempts}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${r.best_score >= 60 ? 'text-green-700' : 'text-rose-600'}`}>
                      {r.best_score.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{formatDate(r.last_attempt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && filtered.length > 0 && <RowCount shown={filtered.length} total={rows.length} unit="row" />}
    </div>
  )
}

// ─── R5: Content Performance ──────────────────────────────────────────────────

interface ContentPerfRow {
  content_id: string
  content_title: string
  content_type: 'ASSESSMENT' | 'COURSE'
  category: string
  total_attempts: number
  unique_learners: number
  avg_score: number
  pass_rate: number
  avg_attempts_to_pass: number | null
}

function ContentPerformanceTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<ContentPerfRow[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    async function load() {
      const { data: attempts } = await supabase
        .from('learner_attempts')
        .select('learner_id, content_id, content_type, score_pct, passed, attempted_at')
        .eq('tenant_id', tenantId)

      if (!attempts?.length) { setLoading(false); return }

      const aIds = [...new Set(attempts.filter(a => a.content_type === 'ASSESSMENT').map(a => a.content_id))]
      const cIds = [...new Set(attempts.filter(a => a.content_type === 'COURSE').map(a => a.content_id))]

      const infoMap: Record<string, { title: string; category: string }> = {}

      if (aIds.length) {
        const { data: cis } = await supabase
          .from('content_items')
          .select('id, title, exam_category_id')
          .in('id', aIds)
        const catIds = [...new Set((cis ?? []).map(c => c.exam_category_id).filter(Boolean))] as string[]
        let catMap: Record<string, string> = {}
        if (catIds.length) {
          const { data: cats } = await supabase.from('exam_categories').select('id, name').in('id', catIds)
          catMap = Object.fromEntries((cats ?? []).map(c => [c.id, c.name]))
        }
        ;(cis ?? []).forEach(c => {
          infoMap[c.id] = { title: c.title, category: catMap[c.exam_category_id ?? ''] ?? '—' }
        })
      }
      if (cIds.length) {
        const { data: cs } = await supabase.from('courses').select('id, title, course_type').in('id', cIds)
        ;(cs ?? []).forEach(c => {
          infoMap[c.id] = {
            title: c.title,
            category: (c.course_type as string ?? '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          }
        })
      }

      // Group by content_id
      const grouped: Record<string, typeof attempts> = {}
      for (const a of attempts) { (grouped[a.content_id] ??= []).push(a) }

      const result: ContentPerfRow[] = Object.entries(grouped).map(([cid, grp]) => {
        const content_type = grp[0].content_type as 'ASSESSMENT' | 'COURSE'
        const unique_learners = new Set(grp.map(a => a.learner_id)).size
        const total_attempts = grp.length
        const avg_score = grp.reduce((s, a) => s + Number(a.score_pct), 0) / total_attempts

        const passerIds = [...new Set(grp.filter(a => a.passed).map(a => a.learner_id))]
        const pass_rate = (passerIds.length / unique_learners) * 100

        let avg_attempts_to_pass: number | null = null
        if (passerIds.length) {
          const counts = passerIds.map(lid => {
            const la = grp
              .filter(a => a.learner_id === lid)
              .sort((a, b) => new Date(a.attempted_at).getTime() - new Date(b.attempted_at).getTime())
            return la.findIndex(a => a.passed) + 1
          })
          avg_attempts_to_pass = Math.round((counts.reduce((s, n) => s + n, 0) / counts.length) * 10) / 10
        }

        return {
          content_id: cid,
          content_title: infoMap[cid]?.title ?? '—',
          content_type,
          category: infoMap[cid]?.category ?? '—',
          total_attempts,
          unique_learners,
          avg_score: Math.round(avg_score * 10) / 10,
          pass_rate: Math.round(pass_rate * 10) / 10,
          avg_attempts_to_pass,
        }
      })

      result.sort((a, b) => a.pass_rate - b.pass_rate) // worst first
      setRows(result)
      setLoading(false)
    }
    void load()
  }, [tenantId])

  const filtered = rows.filter(r => typeFilter === 'ALL' || r.content_type === typeFilter)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <FilterSelect value={typeFilter} onChange={setTypeFilter}>
          <option value="ALL">All Types</option>
          <option value="ASSESSMENT">Assessment</option>
          <option value="COURSE">Course</option>
        </FilterSelect>
        <ExportButton onClick={() => downloadCSV(
          ['Content', 'Type', 'Category', 'Total Attempts', 'Unique Learners', 'Avg Score (%)', 'Pass Rate (%)', 'Avg Attempts to Pass'],
          filtered.map(r => [r.content_title, r.content_type, r.category, r.total_attempts, r.unique_learners, r.avg_score, r.pass_rate, r.avg_attempts_to_pass ?? 'N/A']),
          `keyskillset_content_performance_${csvTimestamp()}.csv`,
        )} />
      </div>

      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        {loading ? <TableLoading /> : filtered.length === 0 ? (
          <TableEmpty message="No content data available." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide w-[24%]">Content</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Attempts</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Learners</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Avg Score</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Pass Rate</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Avg Attempts to Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(r => (
                <tr key={r.content_id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900 max-w-xs truncate">{r.content_title}</td>
                  <td className="px-4 py-3"><TypeBadge type={r.content_type} /></td>
                  <td className="px-4 py-3 text-zinc-600">{r.category}</td>
                  <td className="px-4 py-3 text-right text-zinc-700">{r.total_attempts}</td>
                  <td className="px-4 py-3 text-right text-zinc-700">{r.unique_learners}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${r.avg_score >= 60 ? 'text-green-700' : 'text-amber-700'}`}>
                      {r.avg_score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${r.pass_rate >= 60 ? 'text-green-700' : r.pass_rate >= 40 ? 'text-amber-700' : 'text-rose-600'}`}>
                      {r.pass_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600">
                    {r.avg_attempts_to_pass != null
                      ? r.avg_attempts_to_pass.toFixed(1)
                      : <span className="text-zinc-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && filtered.length > 0 && <RowCount shown={filtered.length} total={rows.length} unit="item" />}
    </div>
  )
}

// ─── R6: Certificates ─────────────────────────────────────────────────────────

interface CertRow {
  id: string
  learner_id: string
  learner_name: string
  dept_name: string
  content_title: string
  certificate_number: string
  issued_at: string
}

function CertificatesTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<CertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [depts, setDepts] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: certs }, { data: learnerRows }, { data: deptRows }] = await Promise.all([
        supabase
          .from('certificates')
          .select('id, learner_id, learner_name, content_title, certificate_number, issued_at')
          .eq('tenant_id', tenantId)
          .order('issued_at', { ascending: false }),
        supabase.from('learners').select('id, department_id').eq('tenant_id', tenantId),
        supabase.from('departments').select('id, name').eq('tenant_id', tenantId),
      ])

      const deptMap: Record<string, string> = Object.fromEntries(
        (deptRows ?? []).map(d => [d.id, d.name])
      )
      const learnerDeptMap: Record<string, string> = Object.fromEntries(
        (learnerRows ?? []).map(l => [l.id, deptMap[l.department_id ?? ''] ?? '—'])
      )

      setRows(
        (certs ?? []).map(c => ({
          id: c.id,
          learner_id: c.learner_id,
          learner_name: c.learner_name,
          dept_name: learnerDeptMap[c.learner_id] ?? '—',
          content_title: c.content_title,
          certificate_number: c.certificate_number,
          issued_at: c.issued_at,
        }))
      )
      setDepts(deptRows ?? [])
      setLoading(false)
    }
    void load()
  }, [tenantId])

  const filtered = rows.filter(r => {
    if (deptFilter !== 'ALL' && r.dept_name !== deptFilter) return false
    if (search && !r.learner_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search learner…" />
        <FilterSelect value={deptFilter} onChange={setDeptFilter}>
          <option value="ALL">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </FilterSelect>
        <ExportButton onClick={() => downloadCSV(
          ['Learner', 'Department', 'Course', 'Certificate Number', 'Issued Date'],
          filtered.map(r => [r.learner_name, r.dept_name, r.content_title, r.certificate_number, formatDate(r.issued_at)]),
          `keyskillset_certificates_${csvTimestamp()}.csv`,
        )} />
      </div>

      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        {loading ? <TableLoading /> : filtered.length === 0 ? (
          <TableEmpty
            message="No certificates issued yet"
            sub="Certificates are issued when learners complete a course."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Learner</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Department</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Course</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Certificate No.</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900">{r.learner_name}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.dept_name}</td>
                  <td className="px-4 py-3 text-zinc-700">{r.content_title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">{r.certificate_number}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{formatDate(r.issued_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && filtered.length > 0 && <RowCount shown={filtered.length} total={rows.length} unit="certificate" />}
    </div>
  )
}

// ─── R7: Learner Activity ─────────────────────────────────────────────────────

interface ActivityRow {
  id: string
  learner_name: string
  dept_name: string
  team_name: string
  status: string
  last_active_at: string | null
  days_since: number | null
}

function LearnerActivityTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [depts, setDepts] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: learnerRows }, { data: deptRows }, { data: teamRows }] =
        await Promise.all([
          supabase
            .from('learners')
            .select('id, full_name, department_id, team_id, status, last_active_at')
            .eq('tenant_id', tenantId),
          supabase.from('departments').select('id, name').eq('tenant_id', tenantId),
          supabase.from('teams').select('id, name').eq('tenant_id', tenantId),
        ])

      const deptMap: Record<string, string> = Object.fromEntries(
        (deptRows ?? []).map(d => [d.id, d.name])
      )
      const teamMap: Record<string, string> = Object.fromEntries(
        (teamRows ?? []).map(t => [t.id, t.name])
      )
      const now = Date.now()

      const result: ActivityRow[] = (learnerRows ?? []).map(l => ({
        id: l.id,
        learner_name: l.full_name,
        dept_name: deptMap[l.department_id ?? ''] ?? '—',
        team_name: teamMap[l.team_id ?? ''] ?? '—',
        status: (l.status as string | null) ?? 'ACTIVE',
        last_active_at: l.last_active_at as string | null,
        days_since: l.last_active_at
          ? Math.floor((now - new Date(l.last_active_at as string).getTime()) / 86_400_000)
          : null,
      }))

      // Sort: most dormant first (null = never = top)
      result.sort((a, b) => {
        if (a.days_since == null && b.days_since == null) return 0
        if (a.days_since == null) return -1
        if (b.days_since == null) return 1
        return b.days_since - a.days_since
      })

      setRows(result)
      setDepts(deptRows ?? [])
      setLoading(false)
    }
    void load()
  }, [tenantId])

  const filtered = rows.filter(r => {
    if (deptFilter !== 'ALL' && r.dept_name !== deptFilter) return false
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
    if (search && !r.learner_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function dormancyClass(days: number | null) {
    if (days == null || days >= 30) return 'text-rose-600 font-medium'
    if (days >= 14) return 'text-amber-700 font-medium'
    return 'text-zinc-700'
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search learner…" />
        <FilterSelect value={deptFilter} onChange={setDeptFilter}>
          <option value="ALL">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </FilterSelect>
        <FilterSelect value={statusFilter} onChange={setStatusFilter}>
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </FilterSelect>
        <ExportButton onClick={() => downloadCSV(
          ['Learner', 'Department', 'Team', 'Status', 'Last Active', 'Days Since Active'],
          filtered.map(r => [
            r.learner_name, r.dept_name, r.team_name, r.status,
            r.last_active_at ? formatDate(r.last_active_at) : 'Never',
            r.days_since ?? 'Never',
          ]),
          `keyskillset_learner_activity_${csvTimestamp()}.csv`,
        )} />
      </div>

      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        {loading ? <TableLoading /> : filtered.length === 0 ? (
          <TableEmpty message="No learners match your filters." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Learner</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Department</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Team</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Last Active</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Days Since Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900">{r.learner_name}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.dept_name}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{r.team_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-md px-2 py-0.5 border ${r.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                      {r.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {r.last_active_at
                      ? <span className="text-zinc-500">{formatDate(r.last_active_at)}</span>
                      : <span className="text-rose-600 font-medium">Never</span>}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm ${dormancyClass(r.days_since)}`}>
                    {r.days_since != null ? `${r.days_since}d` : <span className="text-rose-600 font-medium">Never</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && filtered.length > 0 && <RowCount shown={filtered.length} total={rows.length} unit="learner" />}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; Icon: typeof Users }[] = [
  { key: 'learner',      label: 'Learner Performance', Icon: Users },
  { key: 'content',      label: 'Content Performance', Icon: BookOpen },
  { key: 'certificates', label: 'Certificates',        Icon: Award },
  { key: 'activity',     label: 'Learner Activity',    Icon: Activity },
]

export default function ReportsPage() {
  const params = useParams()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)
  const [activeTab, setActiveTab] = useState<Tab>('learner')

  if (!tenantId) return null

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-zinc-400" />
            <h1 className="text-xl font-semibold text-zinc-900">Reports</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Learning insights and analytics for your organisation
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center border-b border-zinc-200 mb-6">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? 'border-violet-700 text-violet-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        {activeTab === 'learner'      && <LearnerPerformanceTab tenantId={tenantId} />}
        {activeTab === 'content'      && <ContentPerformanceTab tenantId={tenantId} />}
        {activeTab === 'certificates' && <CertificatesTab       tenantId={tenantId} />}
        {activeTab === 'activity'     && <LearnerActivityTab    tenantId={tenantId} />}
      </div>
    </div>
  )
}
