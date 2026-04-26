'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PaginationBar } from '@/components/ui/PaginationBar'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ArrowLeft,
  X,
  FileText,
  Info,
  BookOpen,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChapterDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'

interface Source {
  id: string
  name: string
  exam_category_name: string | null
}

interface Chapter {
  id: string
  source_id: string
  name: string
  order_index: number
  difficulty: ChapterDifficulty
  created_by: string | null
  created_by_name: string | null
  last_modified_by: string | null
  last_modified_by_name: string | null
  question_count: number
  created_at: string
  updated_at: string
}

interface ChapterFormData {
  name: string
  difficulty: ChapterDifficulty | ''
}

const DEMO_SA_ID = '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'
const PAGE_SIZE_OPTIONS = [25, 50, 100]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function DifficultyBadge({ difficulty }: { difficulty: ChapterDifficulty }) {
  const cls: Record<ChapterDifficulty, string> = {
    easy: 'bg-green-50 text-green-700',
    medium: 'bg-amber-50 text-amber-700',
    hard: 'bg-rose-50 text-rose-600',
    mixed: 'bg-zinc-100 text-zinc-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[difficulty]}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  )
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-zinc-700 mb-1">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

const inputCls =
  'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  width = 'max-w-lg',
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  width?: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={`bg-white rounded-xl shadow-xl w-full ${width} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 shrink-0">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// ─── Chapter Form Modal ───────────────────────────────────────────────────────

function ChapterFormModal({
  open,
  onClose,
  onSaved,
  sourceId,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  sourceId: string
  initial?: Chapter
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<ChapterFormData>({ name: '', difficulty: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        difficulty: initial?.difficulty ?? '',
      })
      setError(null)
    }
  }, [open, initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Chapter name is required.'); return }
    if (!form.difficulty) { setError('Please select a difficulty level.'); return }
    setSaving(true)
    setError(null)
    try {
      if (isEdit && initial) {
        const { error: err } = await supabase
          .from('chapters')
          .update({
            name: form.name.trim(),
            difficulty: form.difficulty,
            last_modified_by: DEMO_SA_ID,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initial.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('chapters')
          .insert({
            source_id: sourceId,
            name: form.name.trim(),
            difficulty: form.difficulty,
            created_by: DEMO_SA_ID,
            // NOTE: last_modified_by intentionally NOT set on INSERT
          })
        if (err) throw err
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save chapter.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Chapter' : 'Create New Chapter'}>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <FieldLabel label="Chapter Name" required />
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="e.g. Atomic Structure"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <FieldLabel label="Difficulty" required />
          <select
            className={inputCls}
            value={form.difficulty}
            onChange={(e) =>
              setForm((f) => ({ ...f, difficulty: e.target.value as ChapterDifficulty | '' }))
            }
          >
            <option value="">Select difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Update Chapter' : 'Create Chapter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Preview Chapter Modal ────────────────────────────────────────────────────

function PreviewChapterModal({
  open,
  onClose,
  chapter,
  sourceName,
}: {
  open: boolean
  onClose: () => void
  chapter: Chapter | null
  sourceName: string
}) {
  if (!chapter) return null
  return (
    <Modal open={open} onClose={onClose} title={`Preview Chapter: ${chapter.name}`} width="max-w-md">
      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Source</p>
          <p className="text-sm font-medium text-zinc-900">{sourceName}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Difficulty</p>
          <DifficultyBadge difficulty={chapter.difficulty} />
        </div>
        <div className="bg-zinc-50 rounded-lg px-4 py-3 border border-zinc-200">
          <p className="text-xs text-zinc-500 mb-1">Total Questions</p>
          <p className="text-2xl font-semibold text-zinc-900">{chapter.question_count}</p>
        </div>
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  open,
  onClose,
  onConfirm,
  chapter,
  deleting,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  chapter: Chapter | null
  deleting: boolean
}) {
  if (!chapter) return null
  return (
    <Modal open={open} onClose={onClose} title="Delete Chapter" width="max-w-sm">
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-zinc-700">
          Are you sure you want to delete{' '}
          <span className="font-medium text-zinc-900">&ldquo;{chapter.name}&rdquo;</span>? This
          action cannot be undone.
        </p>
        {chapter.question_count > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <span className="text-amber-600 text-xs mt-0.5">⚠</span>
            <p className="text-xs text-amber-700">
              This chapter contains {chapter.question_count} question
              {chapter.question_count !== 1 ? 's' : ''}. Questions will remain in the Question
              Bank.
            </p>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete Chapter'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SourceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sourceId = params.sourceId as string

  const [source, setSource] = useState<Source | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [createOpen, setCreateOpen] = useState(false)
  const [viewChapter, setViewChapter] = useState<Chapter | null>(null)
  const [editChapter, setEditChapter] = useState<Chapter | null>(null)
  const [deleteChapter, setDeleteChapter] = useState<Chapter | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(() => {
    Promise.all([
      supabase
        .from('sources')
        .select('id, name, exam_categories(name)')
        .eq('id', sourceId)
        .single(),
      supabase
        .from('chapters')
        .select(
          'id, source_id, name, order_index, difficulty, created_by, last_modified_by, created_at, updated_at, questions(count)',
        )
        .eq('source_id', sourceId)
        .is('deleted_at', null)
        .order('order_index', { ascending: true }),
    ]).then(([sourceRes, chaptersRes]) => {
      if (sourceRes.data) {
        const d = sourceRes.data as Record<string, unknown>
        const cat = d.exam_categories as { name?: string } | null
        setSource({ id: d.id as string, name: d.name as string, exam_category_name: cat?.name ?? null })
      }

      if (!chaptersRes.data) {
        setLoading(false)
        return
      }

      const chaptersRaw = chaptersRes.data as Record<string, unknown>[]
      const adminIds = [
        ...new Set([
          ...chaptersRaw.map((c) => c.created_by as string | null).filter(Boolean),
          ...chaptersRaw.map((c) => c.last_modified_by as string | null).filter(Boolean),
        ]),
      ] as string[]

      const applyChapters = (adminMap: Map<string, string>) => {
        setChapters(
          chaptersRaw.map((row) => {
            const qArr = Array.isArray(row.questions) ? row.questions : []
            const questionCount =
              qArr.length > 0 && typeof qArr[0] === 'object' && qArr[0] !== null
                ? (qArr[0] as { count?: number }).count ?? 0
                : 0
            const createdById = row.created_by as string | null
            const modifiedById = row.last_modified_by as string | null
            return {
              id: row.id as string,
              source_id: row.source_id as string,
              name: row.name as string,
              order_index: (row.order_index as number) ?? 0,
              difficulty: (row.difficulty as ChapterDifficulty) ?? 'medium',
              created_by: createdById,
              created_by_name: createdById ? (adminMap.get(createdById) ?? null) : null,
              last_modified_by: modifiedById,
              last_modified_by_name: modifiedById ? (adminMap.get(modifiedById) ?? null) : null,
              question_count: questionCount,
              created_at: row.created_at as string,
              updated_at: row.updated_at as string,
            }
          }),
        )
        setLoading(false)
      }

      if (adminIds.length === 0) {
        applyChapters(new Map())
        return
      }

      supabase.from('admin_users').select('id, name').in('id', adminIds)
        .then(({ data: admins }) => {
          const adminMap = new Map<string, string>()
          for (const a of admins ?? []) {
            const admin = a as { id: string; name: string }
            adminMap.set(admin.id, admin.name)
          }
          applyChapters(adminMap)
        })
    })
  }, [sourceId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete() {
    if (!deleteChapter) return
    setDeleting(true)
    const { error } = await supabase
      .from('chapters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deleteChapter.id)
    setDeleting(false)
    if (!error) { setDeleteChapter(null); fetchData() }
  }

  // Derive unique creators from loaded chapter data
  const creatorOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const c of chapters) {
      if (c.created_by && c.created_by_name) seen.set(c.created_by, c.created_by_name)
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [chapters])

  const filtered = chapters.filter((c) => {
    if (search.trim() && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (difficultyFilter && c.difficulty !== difficultyFilter) return false
    if (creatorFilter && c.created_by !== creatorFilter) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const effectivePage = Math.min(page, totalPages)
  const paginated = filtered.slice((effectivePage - 1) * pageSize, effectivePage * pageSize)
  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, filtered.length)

  return (
    <div className="px-6 py-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/super-admin/sources-chapters')}
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Source
      </button>

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-zinc-900">
            {source ? source.name : 'Loading…'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">Manage chapters and organize content</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Chapter
        </button>
      </div>

      {/* Info banner */}
      {source && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-4">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700">
            Chapters added here will be tagged directly to{' '}
            <span className="font-medium">&ldquo;{source.name}&rdquo;</span>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search chapters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-zinc-700"
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="mixed">Mixed</option>
        </select>
        <select
          className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-zinc-700"
          value={creatorFilter}
          onChange={(e) => setCreatorFilter(e.target.value)}
        >
          <option value="">All Creators</option>
          {creatorOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Chapter Name
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Difficulty
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Questions
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Created By
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Last Edited
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-400">
                  Loading chapters…
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">
                    {search || difficultyFilter || creatorFilter
                      ? 'No chapters match your filters.'
                      : 'No chapters yet. Create the first chapter for this source.'}
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((chapter) => (
                <tr
                  key={chapter.id}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-900">{chapter.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={chapter.difficulty} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-zinc-700">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      {chapter.question_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-zinc-700">{chapter.created_by_name ?? '—'}</p>
                    <p className="text-xs text-zinc-400">{formatDateTime(chapter.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {chapter.last_modified_by ? (
                      <>
                        <p className="text-sm text-zinc-700">
                          {chapter.last_modified_by_name ?? '—'}
                        </p>
                        <p className="text-xs text-zinc-400">{formatDateTime(chapter.updated_at)}</p>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">Never edited</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          router.push(
                            `/super-admin/sources-chapters/${sourceId}/${chapter.id}`,
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Questions
                      </button>
                      <button
                        onClick={() => setViewChapter(chapter)}
                        title="Preview"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditChapter(chapter)}
                        title="Edit"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteChapter(chapter)}
                        title="Delete"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-3 text-xs text-zinc-500">
          Showing {showingFrom}–{showingTo} of {filtered.length} result
          {filtered.length !== 1 ? 's' : ''}
        </div>
      )}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />

      {/* Modals */}
      <ChapterFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={fetchData}
        sourceId={sourceId}
      />
      <ChapterFormModal
        open={!!editChapter}
        onClose={() => setEditChapter(null)}
        onSaved={fetchData}
        sourceId={sourceId}
        initial={editChapter ?? undefined}
      />
      <PreviewChapterModal
        open={!!viewChapter}
        onClose={() => setViewChapter(null)}
        chapter={viewChapter}
        sourceName={source?.name ?? ''}
      />
      <DeleteModal
        open={!!deleteChapter}
        onClose={() => setDeleteChapter(null)}
        onConfirm={handleDelete}
        chapter={deleteChapter}
        deleting={deleting}
      />
    </div>
  )
}
