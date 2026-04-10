'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileEdit,
  MoreVertical,
  Plus,
  Zap,
  ChevronDown,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Assessment {
  id: string
  title: string
  description: string | null
  test_type: string | null
  status: string
  assessment_type: string
  source: string
  created_at: string
  updated_at: string
  category_name: string | null
  created_by_name: string | null
  last_modified_by_name: string | null
}

interface ExamCategory {
  id: string
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTestType(raw: string | null): string {
  if (!raw) return '—'
  return raw
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    LIVE:        'bg-green-50 text-green-700 border border-green-200',
    INACTIVE:    'bg-amber-50 text-amber-700 border border-amber-200',
    ARCHIVED:    'bg-zinc-50 text-zinc-400 border border-zinc-200',
    MAINTENANCE: 'bg-orange-50 text-orange-700 border border-orange-200',
    DRAFT:       'bg-zinc-50 text-zinc-500 border border-zinc-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.ARCHIVED}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return type === 'ADAPTIVE' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
      <Zap className="w-3 h-3" />
      Adaptive
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      Linear
    </span>
  )
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

function RowMenu({
  item,
  onArchive,
}: {
  item: Assessment
  onArchive: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-zinc-200 rounded-md shadow-lg py-1">
          <button
            onClick={() => {
              setOpen(false)
              const route = item.assessment_type === 'ADAPTIVE'
                ? `/super-admin/create-assessments/adaptive/${item.id}`
                : `/super-admin/create-assessments/linear/${item.id}`
              router.push(route)
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Edit
          </button>
          {item.status !== 'ARCHIVED' && (
            <button
              onClick={() => { setOpen(false); onArchive(item.id) }}
              className="w-full text-left px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
      >
        {current?.value ? current.label : label}
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-9 left-0 z-20 min-w-36 bg-white border border-zinc-200 rounded-md shadow-lg py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                value === opt.value
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Archive confirm modal ────────────────────────────────────────────────────

function ArchiveModal({
  title,
  onConfirm,
  onCancel,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <p className="text-base font-semibold text-zinc-900">Archive Assessment</p>
            <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-zinc-600 mb-6">
            Archive <span className="font-medium text-zinc-900">"{title}"</span>? It will be hidden from learners and cannot be attempted.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Create Adaptive coming-soon tooltip ─────────────────────────────────────

function AdaptiveTooltip({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute right-0 top-9 z-20 w-48 bg-zinc-900 text-white text-xs rounded-md px-3 py-2 shadow-lg">
          Adaptive exam creation is coming soon.
          <div className="absolute -top-1.5 right-3 w-3 h-3 bg-zinc-900 rotate-45" />
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateAssessmentsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Assessment[]>([])
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Archive modal
  const [archiveTarget, setArchiveTarget] = useState<Assessment | null>(null)
  const [archiving, setArchiving] = useState(false)

  async function fetchData() {
    setLoading(true)
    const [{ data: assessments }, { data: cats }] = await Promise.all([
      supabase
        .from('content_items')
        .select(`
          id, title, description, test_type, status, assessment_type, source,
          created_at, updated_at,
          exam_categories!exam_category_id ( name ),
          created_by_user:admin_users!created_by ( name ),
          last_modified_user:admin_users!last_modified_by ( name )
        `)
        .order('created_at', { ascending: false }),
      supabase.from('exam_categories').select('id, name').order('name'),
    ])

    if (assessments) {
      setItems(
        assessments.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          title: a.title as string,
          description: a.description as string | null,
          test_type: a.test_type as string | null,
          status: a.status as string,
          assessment_type: (a.assessment_type as string) ?? 'LINEAR',
          source: a.source as string,
          created_at: a.created_at as string,
          updated_at: a.updated_at as string,
          category_name: (a.exam_categories as { name: string } | null)?.name ?? null,
          created_by_name: (a.created_by_user as { name: string } | null)?.name ?? null,
          last_modified_by_name: (a.last_modified_user as { name: string } | null)?.name ?? null,
        }))
      )
    }
    if (cats) setCategories(cats as ExamCategory[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleArchive(id: string) {
    setArchiving(true)
    await supabase.from('content_items').update({ status: 'ARCHIVED', updated_at: new Date().toISOString() }).eq('id', id)
    setArchiving(false)
    setArchiveTarget(null)
    fetchData()
  }

  // Apply filters
  const filtered = items.filter((item) => {
    if (filterType && item.assessment_type !== filterType) return false
    if (filterCategory && item.category_name !== filterCategory) return false
    if (filterStatus && item.status !== filterStatus) return false
    return true
  })

  const hasFilters = filterType || filterCategory || filterStatus

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
            <FileEdit className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Create Assessments</h1>
            <p className="text-sm text-zinc-500">Build full tests, subject tests, and chapter tests.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/super-admin/create-assessments/linear')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Linear
          </button>
          <AdaptiveTooltip>
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-400 bg-violet-50 border border-violet-200 rounded-md cursor-not-allowed select-none"
            >
              <Zap className="w-3.5 h-3.5" />
              Create Adaptive
            </button>
          </AdaptiveTooltip>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        <FilterDropdown
          label="All Types"
          value={filterType}
          options={[
            { value: '', label: 'All Types' },
            { value: 'LINEAR', label: 'Linear' },
            { value: 'ADAPTIVE', label: 'Adaptive' },
          ]}
          onChange={setFilterType}
        />
        <FilterDropdown
          label="All Categories"
          value={filterCategory}
          options={[
            { value: '', label: 'All Categories' },
            ...categories.map((c) => ({ value: c.name, label: c.name })),
          ]}
          onChange={setFilterCategory}
        />
        <FilterDropdown
          label="All Statuses"
          value={filterStatus}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'LIVE', label: 'Live' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'MAINTENANCE', label: 'Maintenance' },
            { value: 'ARCHIVED', label: 'Archived' },
            { value: 'DRAFT', label: 'Draft' },
          ]}
          onChange={setFilterStatus}
        />
        {hasFilters && (
          <button
            onClick={() => { setFilterType(''); setFilterCategory(''); setFilterStatus('') }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-zinc-400">{filtered.length} assessment{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Length</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created by</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Last edited</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-zinc-400">Loading assessments…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileEdit className="w-8 h-8 text-zinc-200" />
                      <p className="text-sm font-medium text-zinc-500">No assessments found</p>
                      <p className="text-xs text-zinc-400">
                        {hasFilters ? 'Try adjusting your filters.' : 'Get started by creating a Linear assessment.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-zinc-900 leading-snug">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-64">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={item.assessment_type} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                      {formatTestType(item.test_type)}
                    </td>
                    <td className="px-4 py-3">
                      {item.category_name ? (
                        <span className="text-zinc-700 font-medium">{item.category_name}</span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {item.created_by_name ?? <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {formatDate(item.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <RowMenu item={item} onArchive={(id) => setArchiveTarget(item)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archive modal */}
      {archiveTarget && (
        <ArchiveModal
          title={archiveTarget.title}
          onConfirm={() => handleArchive(archiveTarget.id)}
          onCancel={() => setArchiveTarget(null)}
        />
      )}
    </div>
  )
}
