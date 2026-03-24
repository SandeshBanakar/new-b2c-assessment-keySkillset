'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FileSearch,
  Loader2,
  AlertTriangle,
  ChevronDown,
  MoreVertical,
  CheckCircle2,
  X,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'
import {
  fetchContentBank,
  fetchExamCategories,
  archiveContent,
  makeInactive,
  restoreContent,
  type ContentBankItem,
  type ExamCategory,
} from '@/lib/supabase/content-bank'
import { MakeLiveModal } from '@/components/content-bank/MakeLiveModal'
import { ReclassifyModal } from '@/components/content-bank/ReclassifyModal'
import { useToast } from '@/components/ui/Toast'

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    LIVE:     'bg-green-50 text-green-700 border border-green-200',
    INACTIVE: 'bg-amber-50 text-amber-700 border border-amber-200',
    ARCHIVED: 'bg-zinc-50 text-zinc-400 border border-zinc-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.ARCHIVED}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

function AudienceBadge({ audienceType }: { audienceType: string | null }) {
  if (!audienceType) return <span className="text-xs text-zinc-400">—</span>
  const styles: Record<string, string> = {
    B2C_ONLY: 'bg-blue-50 text-blue-700 border border-blue-200',
    B2B_ONLY: 'bg-violet-50 text-violet-700 border border-violet-200',
    BOTH:     'bg-teal-50 text-teal-700 border border-teal-200',
  }
  const labels: Record<string, string> = {
    B2C_ONLY: 'B2C Only', B2B_ONLY: 'B2B Only', BOTH: 'Both',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[audienceType] ?? ''}`}>
      {labels[audienceType] ?? audienceType}
    </span>
  )
}

// ─── How It Works tooltip ─────────────────────────────────────────────────────

function HowItWorksButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const steps = [
    'Content Creator submits content',
    'Content Bank (SA review)',
    'SA Makes Live',
    'SA goes to Plans & Pricing',
    'Selects or creates a plan → Adds content to plan',
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        aria-label="How it works"
      >
        <HelpCircle className="w-4 h-4" />
        How it works
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-20 w-80 bg-white border border-zinc-200 rounded-md shadow-lg p-4">
          <p className="text-xs font-semibold text-zinc-700 mb-3">Content Flow</p>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-xs text-zinc-600 leading-snug">{step}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-zinc-300 shrink-0 mt-0.5 ml-auto" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-100">
            Any content here is from keySkillset content creators only.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Warning modal ────────────────────────────────────────────────────────────

type WarningAction = 'make-live' | 'make-inactive' | 'archive' | 'reclassify' | 'restore'

const WARNING_COPY: Record<WarningAction, { title: string; body: string; cta: string }> = {
  'make-live': {
    title: 'Make Content Live',
    body: 'You are about to publish this content. It will be visible to learners based on plan membership. Continue to set the audience.',
    cta: 'Continue',
  },
  'make-inactive': {
    title: 'Make Content Inactive',
    body: 'This content will be moved back to the review queue. It will no longer be visible to learners. This action can be undone.',
    cta: 'Make Inactive',
  },
  'archive': {
    title: 'Archive Content',
    body: 'This content will be removed from all plans and archived. Attempt history is retained. This action cannot be undone.',
    cta: 'Archive',
  },
  'reclassify': {
    title: 'Reclassify Audience',
    body: 'This is a destructive action. Reclassifying will remove this content from incompatible plans which will affect learners in that plan. Continue?',
    cta: 'Continue',
  },
  'restore': {
    title: 'Restore Content',
    body: 'This content will be restored to Inactive status and moved back to the review queue.',
    cta: 'Restore',
  },
}

function WarningModal({
  item,
  action,
  onCancel,
  onConfirm,
  loading,
}: {
  item: ContentBankItem
  action: WarningAction
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const copy = WARNING_COPY[action]
  const isDestructive = action === 'archive' || action === 'reclassify'

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">{copy.title}</h2>
            <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className={`flex items-start gap-3 p-3 rounded-md border ${
              isDestructive ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
            }`}>
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${isDestructive ? 'text-rose-600' : 'text-amber-600'}`} />
              <p className={`text-xs font-medium ${isDestructive ? 'text-rose-700' : 'text-amber-700'}`}>{item.title}</p>
            </div>
            <p className="text-sm text-zinc-700">{copy.body}</p>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 flex items-center gap-2 ${
                isDestructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {copy.cta}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Row actions 3-dot menu ───────────────────────────────────────────────────

type ActionTrigger = {
  item: ContentBankItem
  action: WarningAction
}

function ContentActionsMenu({
  item,
  onTrigger,
}: {
  item: ContentBankItem
  onTrigger: (trigger: ActionTrigger) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function trigger(action: WarningAction) {
    setOpen(false)
    onTrigger({ item, action })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-20 w-40 bg-white border border-zinc-200 rounded-md shadow-md py-1">
          {item.status === 'INACTIVE' && (
            <>
              <button onClick={() => trigger('make-live')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Make Live
              </button>
              <button onClick={() => trigger('archive')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                <AlertTriangle className="w-3.5 h-3.5" /> Archive
              </button>
            </>
          )}
          {item.status === 'LIVE' && (
            <>
              <button onClick={() => trigger('make-inactive')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                <X className="w-3.5 h-3.5 text-zinc-400" /> Make Inactive
              </button>
              <button onClick={() => trigger('reclassify')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" /> Reclassify
              </button>
              <button onClick={() => trigger('archive')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                <AlertTriangle className="w-3.5 h-3.5" /> Archive
              </button>
            </>
          )}
          {item.status === 'ARCHIVED' && (
            <button onClick={() => trigger('restore')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">
              <CheckCircle2 className="w-3.5 h-3.5" /> Restore
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Status tabs — no DRAFT ───────────────────────────────────────────────────

const STATUS_TABS = ['ALL', 'INACTIVE', 'LIVE', 'ARCHIVED'] as const
type StatusFilter = (typeof STATUS_TABS)[number]

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ContentBankPage() {
  const { showToast } = useToast()
  const [items, setItems]           = useState<ContentBankItem[]>([])
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('INACTIVE')
  const [typeFilter, setTypeFilter]         = useState<'ALL' | 'ASSESSMENT' | 'COURSE'>('ALL')
  const [audienceFilter, setAudienceFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [search, setSearch]                 = useState('')

  // Warning modal state
  const [pendingTrigger, setPendingTrigger] = useState<ActionTrigger | null>(null)
  const [warningLoading, setWarningLoading] = useState(false)

  // Second-step modals (Make Live, Reclassify) — shown after warning confirmed
  const [makeLiveItem, setMakeLiveItem]     = useState<ContentBankItem | null>(null)
  const [reclassifyItem, setReclassifyItem] = useState<ContentBankItem | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [bankData, catData] = await Promise.all([fetchContentBank(), fetchExamCategories()])
      setItems(bankData)
      setCategories(catData)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load content bank.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Warning confirmed — either execute directly or open second modal
  async function handleWarningConfirm() {
    if (!pendingTrigger) return
    const { item, action } = pendingTrigger

    if (action === 'make-live') {
      setPendingTrigger(null)
      setMakeLiveItem(item)
      return
    }
    if (action === 'reclassify') {
      setPendingTrigger(null)
      setReclassifyItem(item)
      return
    }

    // Direct actions — execute immediately
    setWarningLoading(true)
    try {
      if (action === 'make-inactive') {
        await makeInactive(item.id, item.contentType)
        showToast(`"${item.title}" moved to Inactive.`)
      } else if (action === 'archive') {
        await archiveContent(item.id, item.contentType)
        showToast(`"${item.title}" archived.`)
      } else if (action === 'restore') {
        await restoreContent(item.id, item.contentType)
        showToast(`"${item.title}" restored to Inactive.`)
      }
      setPendingTrigger(null)
      loadData()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Action failed.', 'error')
    } finally {
      setWarningLoading(false)
    }
  }

  // Apply filters — exclude DRAFT items entirely
  const filtered = items.filter((item) => {
    if (item.status === 'DRAFT') return false
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
    if (typeFilter !== 'ALL' && item.contentType !== typeFilter) return false
    if (audienceFilter !== 'ALL') {
      if (audienceFilter === 'UNSET' && item.audienceType !== null) return false
      if (audienceFilter !== 'UNSET' && item.audienceType !== audienceFilter) return false
    }
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (!item.title.toLowerCase().includes(q)) return false
    }
    return true
  })

  const nonDraftItems = items.filter(i => i.status !== 'DRAFT')
  const countsPerStatus = STATUS_TABS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === 'ALL'
      ? nonDraftItems.length
      : nonDraftItems.filter((i) => i.status === s).length
    return acc
  }, {})

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Content Bank</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Review, promote, and manage all platform content assets — assessments and courses.
          </p>
          <div className="mt-2">
            <HowItWorksButton />
          </div>
        </div>
      </div>

      {/* Status tabs — no DRAFT */}
      <div className="flex gap-1 mb-4 border-b border-zinc-200">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              statusFilter === s
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            <span className={`ml-1.5 text-xs ${statusFilter === s ? 'text-blue-700' : 'text-zinc-400'}`}>
              {countsPerStatus[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-700 min-w-48"
        />
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 pr-7 outline-none focus:ring-1 focus:ring-blue-700 appearance-none"
          >
            <option value="ALL">All Types</option>
            <option value="ASSESSMENT">Assessment</option>
            <option value="COURSE">Course</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 pr-7 outline-none focus:ring-1 focus:ring-blue-700 appearance-none"
          >
            <option value="ALL">All Audiences</option>
            <option value="B2C_ONLY">B2C Only</option>
            <option value="B2B_ONLY">B2B Only</option>
            <option value="BOTH">Both</option>
            <option value="UNSET">Unset</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
        </div>
        {categories.length > 0 && (
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 pr-7 outline-none focus:ring-1 focus:ring-blue-700 appearance-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-zinc-100 animate-pulse rounded-md" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && loadError && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-md px-4 py-3">
          <p className="text-sm text-rose-600">{loadError}</p>
          <button onClick={loadData} className="text-xs font-medium text-rose-600 underline ml-4 shrink-0">Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !loadError && filtered.length === 0 && (
        <div className="flex flex-col items-center py-20 gap-3">
          <FileSearch className="w-10 h-10 text-zinc-300" />
          <p className="text-sm font-semibold text-zinc-900">No content found</p>
          <p className="text-sm text-zinc-500">
            {nonDraftItems.length === 0
              ? 'No content in the bank yet.'
              : 'Try adjusting your filters.'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !loadError && filtered.length > 0 && (
        <div className="border border-zinc-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5 w-1/4">TITLE</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">TYPE</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">CATEGORY</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">STATUS</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">AUDIENCE</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">PLANS</th>
                <th className="text-left text-xs font-medium text-zinc-500 px-4 py-2.5">CREATED</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`${idx < filtered.length - 1 ? 'border-b border-zinc-100' : ''} ${
                    item.status === 'ARCHIVED' ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 max-w-0">
                    <span className="block truncate" title={item.title}>{item.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-md px-2 py-0.5 ${
                      item.contentType === 'ASSESSMENT'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {item.contentType === 'ASSESSMENT' ? 'Assessment' : 'Course'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.contentType === 'ASSESSMENT' ? (
                      <span>
                        {item.category ?? '—'}
                        {item.testType && (
                          <span className="text-zinc-400 ml-1 text-xs">· {item.testType}</span>
                        )}
                      </span>
                    ) : (
                      <span>{item.courseType ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3"><AudienceBadge audienceType={item.audienceType} /></td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {item.planCount > 0 ? (
                      <span className="font-medium text-zinc-700">{item.planCount} plan{item.planCount !== 1 ? 's' : ''}</span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ContentActionsMenu
                      item={item}
                      onTrigger={setPendingTrigger}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result count */}
      {!loading && !loadError && nonDraftItems.length > 0 && (
        <p className="text-xs text-zinc-400 mt-3">
          Showing {filtered.length} of {nonDraftItems.length} items
        </p>
      )}

      {/* Warning modal (step 1 for all actions) */}
      {pendingTrigger && (
        <WarningModal
          item={pendingTrigger.item}
          action={pendingTrigger.action}
          onCancel={() => setPendingTrigger(null)}
          onConfirm={handleWarningConfirm}
          loading={warningLoading}
        />
      )}

      {/* Make Live modal (step 2, after warning) */}
      {makeLiveItem && (
        <MakeLiveModal
          item={makeLiveItem}
          onClose={() => setMakeLiveItem(null)}
          onMadeLive={() => {
            setMakeLiveItem(null)
            showToast(`"${makeLiveItem.title}" is now Live.`)
            loadData()
          }}
        />
      )}

      {/* Reclassify modal (step 2, after warning) */}
      {reclassifyItem && (
        <ReclassifyModal
          item={reclassifyItem}
          onClose={() => setReclassifyItem(null)}
          onReclassified={() => {
            setReclassifyItem(null)
            showToast(`"${reclassifyItem.title}" audience updated.`)
            loadData()
          }}
        />
      )}
    </div>
  )
}
