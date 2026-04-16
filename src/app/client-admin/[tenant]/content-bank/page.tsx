'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Library,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  Lock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getTenantId } from '@/lib/client-admin/tenants'
import { formatCourseType } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentStatus = 'INACTIVE' | 'LIVE' | 'ARCHIVED'
type FilterStatus = 'ALL' | ContentStatus
type ContentKind = 'ASSESSMENT' | 'COURSE'

interface ContentItem {
  id: string
  title: string
  item_type: string        // test_type for ASSESSMENT, course_type for COURSE
  status: ContentStatus
  content_type: ContentKind
  created_at: string
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ContentStatus }) {
  if (status === 'LIVE')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        Live
      </span>
    )
  if (status === 'INACTIVE')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-md px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        Pending Review
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200 rounded-md px-2 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 inline-block" />
      Archived
    </span>
  )
}

// ─── Content Type Badge ───────────────────────────────────────────────────────

function ContentTypeBadge({ kind }: { kind: ContentKind }) {
  if (kind === 'COURSE')
    return (
      <span className="inline-flex items-center text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-md px-2 py-0.5">
        Course
      </span>
    )
  return (
    <span className="inline-flex items-center text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-0.5">
      Assessment
    </span>
  )
}

// ─── Make Live Modal ──────────────────────────────────────────────────────────

function MakeLiveModal({
  item,
  onConfirm,
  onClose,
  saving,
}: {
  item: ContentItem
  onConfirm: () => void
  onClose: () => void
  saving: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-xl">
        <div className="px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-md bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Make content live?</p>
              <p className="text-sm text-zinc-500 mt-1">
                <span className="font-medium text-zinc-700">{item.title}</span> will
                become visible to learners when assigned via the Catalog.
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Publishing…' : 'Make Live'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Archive Modal ────────────────────────────────────────────────────────────

function ArchiveModal({
  item,
  onConfirm,
  onClose,
  saving,
}: {
  item: ContentItem
  onConfirm: () => void
  onClose: () => void
  saving: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md border border-zinc-200 w-full max-w-sm mx-4 shadow-xl">
        <div className="px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Archive this content?</p>
              <p className="text-sm text-zinc-500 mt-1">
                <span className="font-medium text-zinc-700">{item.title}</span> will
                be removed from the Catalog and become inaccessible to learners.
                Existing assignment records are retained.
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Archiving…' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentBankPage() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenant as string
  const tenantId = getTenantId(tenantSlug)

  const [featureMode, setFeatureMode] = useState<string | null>(null)
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('INACTIVE')
  const [search, setSearch] = useState('')
  const [makeLiveTarget, setMakeLiveTarget] = useState<ContentItem | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<ContentItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Guard: redirect RUN_ONLY tenants away from this page
  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('tenants')
      .select('feature_toggle_mode')
      .eq('id', tenantId)
      .single()
      .then(({ data }) => {
        if (data) {
          setFeatureMode(data.feature_toggle_mode as string)
          if (data.feature_toggle_mode !== 'FULL_CREATOR') {
            router.replace(`/client-admin/${tenantSlug}/catalog`)
          }
        }
      })
  }, [tenantId, tenantSlug, router])

  const loadItems = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)

    // Fetch both TENANT_PRIVATE assessment_items and tenant-owned courses in parallel
    const [assessmentRes, courseRes] = await Promise.all([
      supabase
        .from('assessment_items')
        .select('id, title, test_type, status, created_at')
        .eq('tenant_scope_id', tenantId)
        .in('status', ['INACTIVE', 'LIVE', 'ARCHIVED'])
        .order('created_at', { ascending: false }),
      supabase
        .from('courses')
        .select('id, title, course_type, status, created_at')
        .eq('tenant_id', tenantId)
        .in('status', ['INACTIVE', 'LIVE', 'ARCHIVED'])
        .order('created_at', { ascending: false }),
    ])

    const assessmentItems: ContentItem[] = (
      (assessmentRes.data ?? []) as {
        id: string
        title: string
        test_type: string | null
        status: string
        created_at: string
      }[]
    ).map((c) => ({
      id: c.id,
      title: c.title,
      item_type: c.test_type ?? '',
      status: c.status as ContentStatus,
      content_type: 'ASSESSMENT' as ContentKind,
      created_at: c.created_at,
    }))

    const courseItems: ContentItem[] = (
      (courseRes.data ?? []) as {
        id: string
        title: string
        course_type: string | null
        status: string
        created_at: string
      }[]
    ).map((c) => ({
      id: c.id,
      title: c.title,
      item_type: c.course_type ?? '',
      status: c.status as ContentStatus,
      content_type: 'COURSE' as ContentKind,
      created_at: c.created_at,
    }))

    // Merge and sort by created_at descending
    const merged = [...assessmentItems, ...courseItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    setItems(merged)
    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function handleMakeLive() {
    if (!makeLiveTarget) return
    setSaving(true)
    const table = makeLiveTarget.content_type === 'COURSE' ? 'courses' : 'assessment_items'
    await supabase
      .from(table)
      .update({ status: 'LIVE', updated_at: new Date().toISOString() })
      .eq('id', makeLiveTarget.id)
    setSaving(false)
    setMakeLiveTarget(null)
    void loadItems()
  }

  async function handleArchive() {
    if (!archiveTarget) return
    setSaving(true)
    const table = archiveTarget.content_type === 'COURSE' ? 'courses' : 'assessment_items'
    await supabase
      .from(table)
      .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
      .eq('id', archiveTarget.id)
    setSaving(false)
    setArchiveTarget(null)
    void loadItems()
  }

  // ── Filtering ─────────────────────────────────────────────────────────────────

  const filtered = items.filter((item) => {
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus
    const matchesSearch =
      !search || item.title.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const counts = {
    ALL: items.length,
    INACTIVE: items.filter((i) => i.status === 'INACTIVE').length,
    LIVE: items.filter((i) => i.status === 'LIVE').length,
    ARCHIVED: items.filter((i) => i.status === 'ARCHIVED').length,
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatItemType(item: ContentItem): string {
    if (!item.item_type) return '—'
    if (item.content_type === 'COURSE') {
      return formatCourseType(item.item_type) ?? '—'
    }
    return item.item_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Don't render until FULL_CREATOR is confirmed (prevents flash before redirect)
  if (featureMode !== null && featureMode !== 'FULL_CREATOR') return null

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="px-8 py-8">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Library className="w-5 h-5 text-zinc-400" />
            <h1 className="text-xl font-semibold text-zinc-900">Content Bank</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Review and publish your organisation&rsquo;s private content. Once live,
            it can be assigned to learners via the Catalog.
          </p>
        </div>

        {/* Info callout */}
        <div className="mb-6 bg-violet-50 border border-violet-200 rounded-md px-4 py-3 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
          <p className="text-sm text-violet-800">
            This content is private to your organisation and is never visible to other
            tenants or the general platform. Content created by your Content Creators
            appears here for review before being made live.
          </p>
        </div>

        {/* Filter + search bar */}
        <div className="flex items-center gap-3 mb-5">
          {/* Status filter tabs */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-md overflow-hidden text-sm font-medium">
            {(
              [
                { key: 'INACTIVE' as FilterStatus, label: 'Pending Review' },
                { key: 'LIVE' as FilterStatus, label: 'Live' },
                { key: 'ARCHIVED' as FilterStatus, label: 'Archived' },
                { key: 'ALL' as FilterStatus, label: 'All' },
              ]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={
                  filterStatus === key
                    ? 'px-3 py-1.5 bg-violet-50 text-violet-700 border-r border-zinc-200 last:border-r-0'
                    : 'px-3 py-1.5 text-zinc-600 hover:bg-zinc-50 border-r border-zinc-200 last:border-r-0 transition-colors'
                }
              >
                {label}
                <span
                  className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${
                    filterStatus === key
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-700 w-56"
            />
          </div>
        </div>

        {/* Content table */}
        <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-400">
              Loading content…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto w-10 h-10 rounded-md bg-zinc-100 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-700">
                {filterStatus === 'INACTIVE'
                  ? 'No content pending review'
                  : filterStatus === 'LIVE'
                  ? 'No live content yet'
                  : filterStatus === 'ARCHIVED'
                  ? 'No archived content'
                  : 'No content in your bank yet'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {filterStatus === 'INACTIVE'
                  ? 'Content submitted by your Content Creators will appear here.'
                  : filterStatus === 'LIVE'
                  ? 'Publish items from the Pending Review tab to see them here.'
                  : 'Archived items will appear here.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide w-[36%]">
                    Title
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Content Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Created
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((item) => (
                  <tr key={`${item.content_type}-${item.id}`} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{item.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ContentTypeBadge kind={item.content_type} />
                    </td>
                    <td className="px-4 py-3">
                      {formatItemType(item) !== '—' ? (
                        <span className="text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-md px-2 py-0.5">
                          {formatItemType(item)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'INACTIVE' && (
                          <>
                            <button
                              onClick={() => setMakeLiveTarget(item)}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
                            >
                              Make Live
                            </button>
                            <button
                              onClick={() => setArchiveTarget(item)}
                              className="px-2.5 py-1 text-xs font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-md transition-colors"
                            >
                              Archive
                            </button>
                          </>
                        )}
                        {item.status === 'LIVE' && (
                          <button
                            onClick={() => setArchiveTarget(item)}
                            className="px-2.5 py-1 text-xs font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 rounded-md transition-colors"
                          >
                            Archive
                          </button>
                        )}
                        {item.status === 'ARCHIVED' && (
                          <span className="text-xs text-zinc-400 italic">Read-only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Row count footer */}
        {!loading && filtered.length > 0 && (
          <p className="mt-3 text-xs text-zinc-400">
            Showing {filtered.length} of {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Make Live confirm modal */}
      {makeLiveTarget && (
        <MakeLiveModal
          item={makeLiveTarget}
          onConfirm={() => void handleMakeLive()}
          onClose={() => setMakeLiveTarget(null)}
          saving={saving}
        />
      )}

      {/* Archive confirm modal */}
      {archiveTarget && (
        <ArchiveModal
          item={archiveTarget}
          onConfirm={() => void handleArchive()}
          onClose={() => setArchiveTarget(null)}
          saving={saving}
        />
      )}
    </div>
  )
}
