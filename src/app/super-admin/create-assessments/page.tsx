'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileEdit, MoreVertical, Plus, Zap, ChevronDown, X, AlertCircle,
  Eye, Edit2, Send, ArchiveIcon, Copy, Trash2, Radio, WifiOff, RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { fetchPlansContainingContent, type PlanUsageItem } from '@/lib/supabase/plans'
import { ContentPlanUsageModal } from '@/components/plans/ContentPlanUsageModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaintenanceWindow {
  start_time: string
  end_time: string
}

interface AssessmentConfig {
  maintenance_window?: MaintenanceWindow | null
  [key: string]: unknown
}

interface Assessment {
  id: string
  title: string
  description: string | null
  test_type: string | null
  status: string
  assessment_type: string
  created_at: string
  updated_at: string
  category_name: string | null
  created_by_name: string | null
  last_modified_by_name: string | null
  assessment_config: AssessmentConfig | null
}

interface ExamCategory {
  id: string
  name: string
}

type ActionType =
  | 'preview' | 'edit' | 'publish' | 'ready_to_publish'
  | 'take_offline' | 'end_maintenance' | 'archive' | 'make_live'
  | 'duplicate' | 'delete'

// ─── State machine ────────────────────────────────────────────────────────────

function statusActions(status: string): ActionType[] {
  switch (status) {
    case 'DRAFT':       return ['preview', 'edit', 'publish', 'duplicate', 'delete']
    case 'INACTIVE':    return ['preview', 'edit', 'ready_to_publish', 'duplicate', 'delete']
    case 'LIVE':        return ['preview', 'take_offline', 'archive', 'duplicate', 'delete']
    case 'MAINTENANCE': return ['preview', 'end_maintenance', 'delete']
    case 'ARCHIVED':    return ['preview', 'make_live', 'duplicate', 'delete']
    default:            return ['preview']
  }
}

const ACTION_META: Record<ActionType, { label: string; icon: React.ElementType; danger?: boolean; disabled?: boolean }> = {
  preview:         { label: 'Preview',                icon: Eye },
  edit:            { label: 'Edit',                   icon: Edit2 },
  publish:         { label: 'Publish',                icon: Send },
  ready_to_publish:{ label: 'Ready to Publish',       icon: Send },
  take_offline:    { label: 'Take Offline for Editing', icon: WifiOff },
  end_maintenance: { label: 'End Maintenance',        icon: RefreshCw },
  archive:         { label: 'Archive',                icon: ArchiveIcon },
  make_live:       { label: 'Make Live',              icon: Radio },
  duplicate:       { label: 'Duplicate',              icon: Copy },
  delete:          { label: 'Delete',                 icon: Trash2, danger: true },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTestType(raw: string | null): string {
  if (!raw) return '—'
  return raw.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function nowLocalString(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

function localToISO(local: string): string {
  return new Date(local).toISOString()
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  LIVE:        'bg-green-50 text-green-700 border border-green-200',
  INACTIVE:    'bg-amber-50 text-amber-700 border border-amber-200',
  ARCHIVED:    'bg-zinc-50 text-zinc-400 border border-zinc-200',
  MAINTENANCE: 'bg-orange-50 text-orange-700 border border-orange-200',
  DRAFT:       'bg-zinc-50 text-zinc-500 border border-zinc-200',
}

const STATUS_LABELS: Record<string, string> = {
  LIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
  MAINTENANCE: 'Maintenance',
  DRAFT: 'Draft',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.ARCHIVED}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return type === 'ADAPTIVE' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
      <Zap className="w-3 h-3" />Adaptive
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      Linear
    </span>
  )
}

// ─── Generic confirm modal ─────────────────────────────────────────────────────

function ConfirmModal({
  title, body, confirmLabel, confirmCls, loading, onConfirm, onCancel,
}: {
  title: string; body: React.ReactNode; confirmLabel: string
  confirmCls: string; loading?: boolean
  onConfirm: () => void; onCancel: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-semibold text-zinc-900">{title}</p>
            <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 ml-2 shrink-0"><X className="w-4 h-4" /></button>
          </div>
          <div className="text-sm text-zinc-600 mb-5">{body}</div>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmCls}`}>
              {loading ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Take Offline modal ───────────────────────────────────────────────────────

function TakeOfflineModal({
  assessmentTitle, loading, onConfirm, onCancel,
}: {
  assessmentTitle: string; loading: boolean
  onConfirm: (startTime: string, endTime: string) => void
  onCancel: () => void
}) {
  const [startTime, setStartTime] = useState(nowLocalString())
  const [endTime, setEndTime] = useState('')
  const [err, setErr] = useState('')

  function handleConfirm() {
    if (!endTime) { setErr('End time is required.'); return }
    if (endTime <= startTime) { setErr('End time must be after start time.'); return }
    setErr('')
    onConfirm(localToISO(startTime), localToISO(endTime))
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Take Offline for Editing</p>
              <p className="text-xs text-zinc-400 mt-0.5">Learners will see a maintenance page during this window.</p>
            </div>
            <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 ml-2 shrink-0"><X className="w-4 h-4" /></button>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-md px-3 py-2 mb-4">
            <p className="text-xs text-orange-700">
              <span className="font-medium">"{assessmentTitle}"</span> will be set to Maintenance immediately. Learners cannot access it during this window.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Maintenance Start</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Maintenance End <span className="text-rose-500">*</span></label>
              <input
                type="datetime-local"
                value={endTime}
                min={startTime}
                onChange={e => { setEndTime(e.target.value); setErr('') }}
                className={`w-full border rounded-md px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none ${err ? 'border-rose-400' : 'border-zinc-200'}`}
              />
              {err && <p className="mt-1 text-xs text-rose-500">{err}</p>}
              <p className="mt-1 text-xs text-zinc-400">Assessment auto-reverts to Inactive when this time passes.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onCancel} className="px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Setting…' : 'Set Maintenance'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  item, loading, onConfirm, onCancel,
}: {
  item: Assessment; loading: boolean
  onConfirm: () => void; onCancel: () => void
}) {
  const [plans, setPlans] = useState<PlanUsageItem[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchPlansContainingContent(item.id)
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setFetching(false))
  }, [item.id])

  const isBlocked = item.status === 'LIVE' || item.status === 'MAINTENANCE'
  const inPlans = plans.length > 0

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-semibold text-zinc-900">Delete Assessment</p>
            <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 ml-2 shrink-0"><X className="w-4 h-4" /></button>
          </div>

          {isBlocked && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-md px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <p className="text-xs text-rose-700">
                Cannot delete an <span className="font-medium">{STATUS_LABELS[item.status]}</span> assessment. Take it offline and set it to Inactive first.
              </p>
            </div>
          )}

          <p className="text-sm text-zinc-600 mb-4">
            Permanently delete <span className="font-medium text-zinc-900">"{item.title}"</span>? This cannot be undone. All learner access will be revoked.
          </p>

          {fetching ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
              <div className="w-3 h-3 border border-zinc-300 border-t-transparent rounded-full animate-spin" />
              Checking plan associations…
            </div>
          ) : inPlans ? (
            <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5 mb-4">
              <p className="text-xs font-medium text-amber-700 mb-1">This assessment is in {plans.length} plan{plans.length > 1 ? 's' : ''}:</p>
              <ul className="space-y-0.5">
                {plans.map(p => (
                  <li key={p.pcmId} className="text-xs text-amber-700">• {p.planName} <span className="text-amber-500">({p.planStatus})</span></li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-2">Remove from all plans and set to Inactive before deleting.</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">Cancel</button>
            {!isBlocked && !inPlans && (
              <button
                onClick={onConfirm}
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

function RowMenu({
  item,
  onAction,
}: {
  item: Assessment
  onAction: (action: ActionType, item: Assessment) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const actions = statusActions(item.status)

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
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-52 bg-white border border-zinc-200 rounded-md shadow-lg py-1">
          {actions.map(action => {
            const meta = ACTION_META[action]
            const Icon = meta.icon
            const isDeleteBlocked = action === 'delete' && (item.status === 'LIVE' || item.status === 'MAINTENANCE')
            return (
              <button
                key={action}
                onClick={() => {
                  setOpen(false)
                  onAction(action, item)
                }}
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                  meta.danger
                    ? isDeleteBlocked
                      ? 'text-zinc-300 cursor-not-allowed'
                      : 'text-rose-600 hover:bg-rose-50'
                    : 'text-zinc-700 hover:bg-zinc-50'
                }`}
                disabled={isDeleteBlocked}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {meta.label}
                {action === 'edit' && item.status === 'INACTIVE' && (
                  <span className="ml-auto text-xs text-zinc-400">Continue Editing</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Filter dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({
  label, value, options, onChange,
}: {
  label: string; value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.value === value)

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
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
      >
        {current?.value ? current.label : label}
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-9 left-0 z-20 min-w-36 bg-white border border-zinc-200 rounded-md shadow-lg py-1">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                value === opt.value ? 'text-blue-700 bg-blue-50' : 'text-zinc-700 hover:bg-zinc-50'
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

// ─── Modal state ──────────────────────────────────────────────────────────────

type ModalType = 'publish' | 'ready_to_publish' | 'take_offline' | 'end_maintenance'
              | 'archive' | 'make_live' | 'duplicate' | 'delete' | null

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateAssessmentsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Assessment[]>([])
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [modalTarget, setModalTarget] = useState<Assessment | null>(null)

  // Plan usage badge state
  const [planCounts, setPlanCounts] = useState<Record<string, number>>({})
  const [planModal, setPlanModal] = useState<{ id: string; title: string } | null>(null)

  // Maintenance auto-revert banner
  const [revertedCount, setRevertedCount] = useState(0)

  const fetchPlanCounts = useCallback(async (assessmentIds: string[]) => {
    if (assessmentIds.length === 0) return
    const { data } = await supabase
      .from('plan_content_map')
      .select('content_item_id')
      .in('content_item_id', assessmentIds)
      .eq('content_type', 'ASSESSMENT')
    if (!data) return
    const counts: Record<string, number> = {}
    ;(data as { content_item_id: string }[]).forEach(r => {
      counts[r.content_item_id] = (counts[r.content_item_id] ?? 0) + 1
    })
    setPlanCounts(counts)
  }, [])

  const fetchData = useCallback(() => {
    async function doFetch() {
      const [{ data: assessments, error: assessErr }, { data: cats }] = await Promise.all([
        supabase
          .from('assessment_items')
          .select(`
            id, title, description, test_type, status, assessment_type, assessment_config,
            created_at, updated_at, assessments_id,
            exam_categories!exam_category_id ( name ),
            created_by_user:admin_users!fk_assessment_items_created_by ( name ),
            last_modified_by_user:admin_users!fk_assessment_items_last_modified_by ( name )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('exam_categories').select('id, name').eq('is_active', true).order('display_order'),
      ])

      if (assessErr) console.error('Failed to load assessments:', assessErr)

      let mapped: Assessment[] = []
      if (assessments) {
        mapped = assessments.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          title: a.title as string,
          description: a.description as string | null,
          test_type: a.test_type as string | null,
          status: a.status as string,
          assessment_type: (a.assessment_type as string) ?? 'LINEAR',
          created_at: a.created_at as string,
          updated_at: a.updated_at as string,
          category_name: (a.exam_categories as { name: string } | null)?.name ?? null,
          created_by_name: (a.created_by_user as { name: string } | null)?.name ?? null,
          last_modified_by_name: (a.last_modified_by_user as { name: string } | null)?.name ?? null,
          assessment_config: (a.assessment_config as AssessmentConfig | null) ?? null,
        }))

        const now = new Date().toISOString()
        const expired = mapped.filter(
          a => a.status === 'MAINTENANCE' && a.assessment_config?.maintenance_window?.end_time
            && a.assessment_config.maintenance_window.end_time < now
        )
        if (expired.length > 0) {
          await Promise.all(
            expired.map(a =>
              supabase.from('assessment_items').update({
                status: 'INACTIVE',
                assessment_config: { ...a.assessment_config, maintenance_window: null },
                updated_at: now,
              }).eq('id', a.id)
            )
          )
          expired.forEach(a => { a.status = 'INACTIVE' })
          return { mapped, cats, revertedCount: expired.length }
        }
      }

      return { mapped, cats, revertedCount: 0 }
    }

    doFetch().then(({ mapped, cats, revertedCount }) => {
      setItems(mapped)
      if (cats) setCategories(cats as ExamCategory[])
      if (revertedCount > 0) setRevertedCount(revertedCount)
      setLoading(false)
      fetchPlanCounts(mapped.map(a => a.id))
    })
  }, [fetchPlanCounts])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Action handlers ────────────────────────────────────────────────────────

  function openModal(action: ModalType, item: Assessment) {
    setModalTarget(item)
    setActiveModal(action)
  }

  function closeModal() {
    setActiveModal(null)
    setModalTarget(null)
  }

  function handleAction(action: ActionType, item: Assessment) {
    if (action === 'preview') {
      router.push(`/assessments/${item.id}`)
      return
    }
    if (action === 'edit') {
      router.push(
        item.assessment_type === 'ADAPTIVE'
          ? `/super-admin/create-assessments/adaptive/${item.id}`
          : `/super-admin/create-assessments/linear/${item.id}`
      )
      return
    }
    openModal(action as ModalType, item)
  }

  async function execTransition(id: string, newStatus: string, extraConfig?: Partial<AssessmentConfig>) {
    setActionLoading(true)
    const now = new Date().toISOString()

    if (extraConfig) {
      const { data: row } = await supabase.from('assessment_items').select('assessment_config').eq('id', id).single()
      const existing = (row as { assessment_config: AssessmentConfig } | null)?.assessment_config ?? {}
      await supabase.from('assessment_items').update({
        status: newStatus,
        assessment_config: { ...existing, ...extraConfig },
        updated_at: now,
      }).eq('id', id)
    } else {
      await supabase.from('assessment_items').update({ status: newStatus, updated_at: now }).eq('id', id)
    }

    setActionLoading(false)
    closeModal()
    fetchData()
  }

  async function handlePublish()         { await execTransition(modalTarget!.id, 'LIVE') }
  async function handleReadyToPublish()  { await execTransition(modalTarget!.id, 'LIVE') }
  async function handleArchive()         { await execTransition(modalTarget!.id, 'ARCHIVED') }
  async function handleMakeLive()        { await execTransition(modalTarget!.id, 'LIVE') }
  async function handleEndMaintenance()  {
    await execTransition(modalTarget!.id, 'INACTIVE', { maintenance_window: null })
  }

  async function handleTakeOffline(startTime: string, endTime: string) {
    await execTransition(modalTarget!.id, 'MAINTENANCE', {
      maintenance_window: { start_time: startTime, end_time: endTime },
    })
  }

  async function handleDuplicate() {
    if (!modalTarget) return
    setActionLoading(true)
    const { data: source } = await supabase
      .from('assessment_items')
      .select('*')
      .eq('id', modalTarget.id)
      .single()

    if (source) {
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = source as Record<string, unknown>
      void _id; void _ca; void _ua
      const now = new Date().toISOString()
      await supabase.from('assessment_items').insert({
        ...rest,
        title: `Copy of ${rest.title}`,
        status: 'INACTIVE',
        created_at: now,
        updated_at: now,
      })
    }
    setActionLoading(false)
    closeModal()
    fetchData()
  }

  async function handleDelete() {
    if (!modalTarget) return
    setActionLoading(true)
    await supabase.from('assessment_items').delete().eq('id', modalTarget.id)
    setActionLoading(false)
    closeModal()
    fetchData()
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  const filtered = items.filter(item => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType && item.assessment_type !== filterType) return false
    if (filterCategory && item.category_name !== filterCategory) return false
    if (filterStatus && item.status !== filterStatus) return false
    return true
  })

  const hasFilters = search || filterType || filterCategory || filterStatus

  function clearFilters() {
    setSearch(''); setFilterType(''); setFilterCategory(''); setFilterStatus('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-8 py-8">

      {/* Maintenance auto-revert banner */}
      {revertedCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-4 py-2.5 mb-4">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            Maintenance window ended for <span className="font-medium">{revertedCount} assessment{revertedCount > 1 ? 's' : ''}</span> — now set to Inactive.
          </p>
          <button onClick={() => setRevertedCount(0)} className="ml-auto text-amber-400 hover:text-amber-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
            <FileEdit className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Create Assessments</h1>
            <p className="text-sm text-zinc-500">Build full tests, subject tests, and chapter tests.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push('/super-admin/create-assessments/linear')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />Create Linear
          </button>
          <button
            onClick={() => router.push('/super-admin/create-assessments/adaptive')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-md hover:bg-violet-100 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />Create Adaptive
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title…"
            className="pl-3 pr-8 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-44"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

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
          options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.name, label: c.name }))]}
          onChange={setFilterCategory}
        />
        <FilterDropdown
          label="All Statuses"
          value={filterStatus}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'LIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'DRAFT', label: 'Draft' },
            { value: 'MAINTENANCE', label: 'Maintenance' },
            { value: 'ARCHIVED', label: 'Archived' },
          ]}
          onChange={setFilterStatus}
        />
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition-colors">
            <X className="w-3 h-3" />Clear
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
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Created by</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Last edited</th>
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
                      <p className="text-xs text-zinc-400">{hasFilters ? 'Try adjusting your filters.' : 'Get started by creating a Linear or Adaptive assessment.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-zinc-900 leading-snug">{item.title}</p>
                          {(planCounts[item.id] ?? 0) > 0 && (
                            <button
                              onClick={() => setPlanModal({ id: item.id, title: item.title })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors shrink-0"
                            >
                              <AlertCircle className="w-3 h-3" />
                              In {planCounts[item.id]} plan{planCounts[item.id] !== 1 ? 's' : ''}
                            </button>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-64">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={item.assessment_type} /></td>
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{formatTestType(item.test_type)}</td>
                    <td className="px-4 py-3">
                      {item.category_name
                        ? <span className="text-zinc-700 font-medium">{item.category_name}</span>
                        : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap hidden md:table-cell">
                      {item.created_by_name ?? <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap hidden lg:table-cell">
                      {formatDate(item.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <RowMenu item={item} onAction={handleAction} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'publish' && modalTarget && (
        <ConfirmModal
          title="Publish Assessment"
          body={<>Publish <span className="font-medium text-zinc-900">"{modalTarget.title}"</span>? It will be immediately visible and accessible to learners.</>}
          confirmLabel="Publish"
          confirmCls="bg-blue-700 hover:bg-blue-800"
          loading={actionLoading}
          onConfirm={handlePublish}
          onCancel={closeModal}
        />
      )}

      {activeModal === 'ready_to_publish' && modalTarget && (
        <ConfirmModal
          title="Ready to Publish"
          body={<>Publish <span className="font-medium text-zinc-900">"{modalTarget.title}"</span>? It will be immediately visible and accessible to learners.</>}
          confirmLabel="Publish"
          confirmCls="bg-blue-700 hover:bg-blue-800"
          loading={actionLoading}
          onConfirm={handleReadyToPublish}
          onCancel={closeModal}
        />
      )}

      {activeModal === 'archive' && modalTarget && (
        <ConfirmModal
          title="Archive Assessment"
          body={<><span className="font-medium text-zinc-900">"{modalTarget.title}"</span> will be hidden from learners and cannot be attempted. You can restore it later.</>}
          confirmLabel="Archive"
          confirmCls="bg-zinc-700 hover:bg-zinc-800"
          loading={actionLoading}
          onConfirm={handleArchive}
          onCancel={closeModal}
        />
      )}

      {activeModal === 'make_live' && modalTarget && (
        <ConfirmModal
          title="Re-publish Assessment"
          body={<>Re-publish <span className="font-medium text-zinc-900">"{modalTarget.title}"</span>? It will be immediately visible and accessible to learners.</>}
          confirmLabel="Make Live"
          confirmCls="bg-blue-700 hover:bg-blue-800"
          loading={actionLoading}
          onConfirm={handleMakeLive}
          onCancel={closeModal}
        />
      )}

      {activeModal === 'end_maintenance' && modalTarget && (
        <ConfirmModal
          title="End Maintenance"
          body={<>End the maintenance window for <span className="font-medium text-zinc-900">"{modalTarget.title}"</span> now? It will move to Inactive. Use "Ready to Publish" to re-activate.</>}
          confirmLabel="End Maintenance"
          confirmCls="bg-orange-600 hover:bg-orange-700"
          loading={actionLoading}
          onConfirm={handleEndMaintenance}
          onCancel={closeModal}
        />
      )}

      {activeModal === 'duplicate' && modalTarget && (
        <ConfirmModal
          title="Duplicate Assessment"
          body={<>Create a copy of <span className="font-medium text-zinc-900">"{modalTarget.title}"</span>? The copy will be titled "Copy of {modalTarget.title}" and set to Inactive.</>}
          confirmLabel="Duplicate"
          confirmCls="bg-blue-700 hover:bg-blue-800"
          loading={actionLoading}
          onConfirm={handleDuplicate}
          onCancel={closeModal}
        />
      )}

      {activeModal === 'take_offline' && modalTarget && (
        <TakeOfflineModal
          assessmentTitle={modalTarget.title}
          loading={actionLoading}
          onConfirm={handleTakeOffline}
          onCancel={closeModal}
        />
      )}

      {activeModal === 'delete' && modalTarget && (
        <DeleteModal
          item={modalTarget}
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={closeModal}
        />
      )}

      {planModal && (
        <ContentPlanUsageModal
          contentId={planModal.id}
          contentTitle={planModal.title}
          onClose={() => setPlanModal(null)}
          onRemoved={() => fetchPlanCounts(items.map(a => a.id))}
        />
      )}
    </div>
  )
}
