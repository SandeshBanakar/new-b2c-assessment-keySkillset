'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  FileSearch,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import {
  fetchContentBank,
  fetchExamCategories,
  archiveContent,
  type ContentBankItem,
  type ExamCategory,
} from '@/lib/supabase/content-bank'
import { MakeLiveModal } from '@/components/content-bank/MakeLiveModal'
import { ReclassifyModal } from '@/components/content-bank/ReclassifyModal'

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    LIVE:     'bg-green-50 text-green-700 border border-green-200',
    INACTIVE: 'bg-amber-50 text-amber-700 border border-amber-200',
    DRAFT:    'bg-zinc-100 text-zinc-600 border border-zinc-200',
    ARCHIVED: 'bg-zinc-50 text-zinc-400 border border-zinc-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.DRAFT}`}>
      {status}
    </span>
  )
}

function AudienceBadge({ audienceType }: { audienceType: string | null }) {
  if (!audienceType) {
    return <span className="text-xs text-zinc-400">—</span>
  }
  const styles: Record<string, string> = {
    B2C_ONLY: 'bg-blue-50 text-blue-700 border border-blue-200',
    B2B_ONLY: 'bg-violet-50 text-violet-700 border border-violet-200',
    BOTH:     'bg-teal-50 text-teal-700 border border-teal-200',
  }
  const labels: Record<string, string> = {
    B2C_ONLY: 'B2C Only',
    B2B_ONLY: 'B2B Only',
    BOTH:     'Both',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[audienceType] ?? ''}`}>
      {labels[audienceType] ?? audienceType}
    </span>
  )
}

// ─── Archive confirmation modal ────────────────────────────────────────────────

function ArchiveModal({
  item,
  onCancel,
  onConfirm,
  loading,
}: {
  item: ContentBankItem
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-sm p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 mb-1">Archive content?</p>
              <p className="text-sm text-zinc-500">
                <span className="font-medium text-zinc-900">{item.title}</span> will be removed from all plans and
                marked as archived. Attempt history is retained. This cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md px-4 py-2 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-md px-4 py-2 flex items-center gap-2 disabled:opacity-60 transition-colors"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Archive
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Filter helpers ────────────────────────────────────────────────────────────

const STATUS_TABS = ['ALL', 'INACTIVE', 'LIVE', 'DRAFT', 'ARCHIVED'] as const
type StatusFilter = (typeof STATUS_TABS)[number]

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ContentBankPage() {
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

  // Modals
  const [makeLiveItem, setMakeLiveItem]         = useState<ContentBankItem | null>(null)
  const [reclassifyItem, setReclassifyItem]     = useState<ContentBankItem | null>(null)
  const [archiveItem, setArchiveItem]           = useState<ContentBankItem | null>(null)
  const [archiving, setArchiving]               = useState(false)

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

  async function handleArchiveConfirm() {
    if (!archiveItem) return
    setArchiving(true)
    try {
      await archiveContent(archiveItem.id, archiveItem.contentType)
      setArchiveItem(null)
      loadData()
    } finally {
      setArchiving(false)
    }
  }

  // Apply filters
  const filtered = items.filter((item) => {
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

  const countsPerStatus = STATUS_TABS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === 'ALL' ? items.length : items.filter((i) => i.status === s).length
    return acc
  }, {})

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-900">Content Bank</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Review, promote, and manage all platform content assets — assessments and courses.
        </p>
      </div>

      {/* Status tabs */}
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
        {/* Search */}
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-700 min-w-48"
        />

        {/* Type filter */}
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

        {/* Audience filter */}
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

        {/* Category filter (assessments only) */}
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
            {items.length === 0
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
                <th className="px-4 py-2.5" />
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
                  {/* Title */}
                  <td className="px-4 py-3 font-medium text-zinc-900 max-w-0">
                    <span className="block truncate" title={item.title}>{item.title}</span>
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-md px-2 py-0.5 ${
                      item.contentType === 'ASSESSMENT'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {item.contentType === 'ASSESSMENT' ? 'Assessment' : 'Course'}
                    </span>
                  </td>

                  {/* Category */}
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

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Audience */}
                  <td className="px-4 py-3">
                    <AudienceBadge audienceType={item.audienceType} />
                  </td>

                  {/* Plan count */}
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {item.planCount > 0 ? (
                      <span className="font-medium text-zinc-700">{item.planCount} plan{item.planCount !== 1 ? 's' : ''}</span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>

                  {/* Created date */}
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 min-w-42">
                    <div className="flex items-center gap-2 justify-end">
                      {item.status === 'INACTIVE' && (
                        <>
                          <button
                            onClick={() => setMakeLiveItem(item)}
                            className="text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md px-2.5 py-1 transition-colors whitespace-nowrap"
                          >
                            Make Live
                          </button>
                          <button
                            onClick={() => setArchiveItem(item)}
                            className="text-xs font-medium text-zinc-600 border border-zinc-200 rounded-md px-2.5 py-1 hover:bg-zinc-50 transition-colors whitespace-nowrap"
                          >
                            Archive
                          </button>
                        </>
                      )}

                      {item.status === 'LIVE' && (
                        <>
                          <button
                            onClick={() => setReclassifyItem(item)}
                            className="text-xs font-medium text-zinc-600 border border-zinc-200 rounded-md px-2.5 py-1 hover:bg-zinc-50 transition-colors whitespace-nowrap"
                          >
                            Reclassify
                          </button>
                          <button
                            onClick={() => setArchiveItem(item)}
                            className="text-xs font-medium text-zinc-600 border border-zinc-200 rounded-md px-2.5 py-1 hover:bg-zinc-50 transition-colors whitespace-nowrap"
                          >
                            Archive
                          </button>
                        </>
                      )}

                      {(item.status === 'DRAFT' || item.status === 'ARCHIVED') && (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result count */}
      {!loading && !loadError && items.length > 0 && (
        <p className="text-xs text-zinc-400 mt-3">
          Showing {filtered.length} of {items.length} items
        </p>
      )}

      {/* Make Live modal */}
      {makeLiveItem && (
        <MakeLiveModal
          item={makeLiveItem}
          onClose={() => setMakeLiveItem(null)}
          onMadeLive={() => { setMakeLiveItem(null); loadData() }}
        />
      )}

      {/* Reclassify modal */}
      {reclassifyItem && (
        <ReclassifyModal
          item={reclassifyItem}
          onClose={() => setReclassifyItem(null)}
          onReclassified={() => { setReclassifyItem(null); loadData() }}
        />
      )}

      {/* Archive modal */}
      {archiveItem && (
        <ArchiveModal
          item={archiveItem}
          onCancel={() => setArchiveItem(null)}
          onConfirm={handleArchiveConfirm}
          loading={archiving}
        />
      )}
    </div>
  )
}
