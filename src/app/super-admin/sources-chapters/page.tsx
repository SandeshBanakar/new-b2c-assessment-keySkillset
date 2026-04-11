'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  BookOpen,
  GitBranch,
  X,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamCategory {
  id: string
  name: string
  slug: string
}

interface Source {
  id: string
  name: string
  exam_category_id: string | null
  exam_category_name: string | null
  description: string | null
  chapter_count: number
  question_count: number
  created_at: string
  updated_at: string
}

interface SourceFormData {
  name: string
  exam_category_id: string
  description: string
}

const DEMO_SA_ID = '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function CategoryBadge({ name }: { name: string | null }) {
  if (!name) return <span className="text-xs text-zinc-400">—</span>
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
      {name}
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

// ─── Source Form Modal ────────────────────────────────────────────────────────

function SourceFormModal({
  open,
  onClose,
  onSaved,
  examCategories,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  examCategories: ExamCategory[]
  initial?: Source
}) {
  const isEdit = !!initial

  const [form, setForm] = useState<SourceFormData>({
    name: initial?.name ?? '',
    exam_category_id: initial?.exam_category_id ?? '',
    description: initial?.description ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        exam_category_id: initial?.exam_category_id ?? '',
        description: initial?.description ?? '',
      })
      setError(null)
    }
  }, [open, initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      if (isEdit && initial) {
        const { error: err } = await supabase
          .from('sources')
          .update({
            name: form.name.trim(),
            exam_category_id: form.exam_category_id || null,
            description: form.description.trim() || null,
            last_modified_by: DEMO_SA_ID,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initial.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('sources')
          .insert({
            name: form.name.trim(),
            exam_category_id: form.exam_category_id || null,
            description: form.description.trim() || null,
            created_by: DEMO_SA_ID,
            last_modified_by: DEMO_SA_ID,
          })
        if (err) throw err
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save source.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Source' : 'Create Source'}>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <FieldLabel label="Source Name" required />
          <input
            className={inputCls}
            placeholder="e.g. NCERT Chemistry Part 1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div>
          <FieldLabel label="Exam Category" />
          <select
            className={inputCls}
            value={form.exam_category_id}
            onChange={(e) => setForm((f) => ({ ...f, exam_category_id: e.target.value }))}
          >
            <option value="">Select exam category…</option>
            {examCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel label="Description" />
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Optional description of this source"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Source'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── View Source Modal ────────────────────────────────────────────────────────

function ViewSourceModal({
  open,
  onClose,
  source,
}: {
  open: boolean
  onClose: () => void
  source: Source | null
}) {
  if (!source) return null
  return (
    <Modal open={open} onClose={onClose} title="View Source">
      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Source Name</p>
            <p className="text-sm font-medium text-zinc-900">{source.name}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Exam Category</p>
            <CategoryBadge name={source.exam_category_name} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Chapters</p>
            <p className="text-sm font-medium text-zinc-900">{source.chapter_count}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Questions</p>
            <p className="text-sm font-medium text-zinc-900">{source.question_count}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Created</p>
            <p className="text-sm text-zinc-700">{formatDateTime(source.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Last Updated</p>
            <p className="text-sm text-zinc-700">{formatDateTime(source.updated_at)}</p>
          </div>
        </div>
        {source.description && (
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Description</p>
            <p className="text-sm text-zinc-700">{source.description}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  open,
  onClose,
  onConfirm,
  sourceName,
  hasContent,
  deleting,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  sourceName: string
  hasContent: boolean
  deleting: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Source" width="max-w-sm">
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Delete &ldquo;{sourceName}&rdquo;?
            </p>
            {hasContent ? (
              <p className="text-xs text-rose-600 mt-1">
                This source has chapters or questions. Remove all content before deleting.
              </p>
            ) : (
              <p className="text-xs text-zinc-500 mt-1">
                This action cannot be undone.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting || hasContent}
            className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SourcesChaptersPage() {
  const router = useRouter()

  const [sources, setSources] = useState<Source[]>([])
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const [createOpen, setCreateOpen] = useState(false)
  const [viewSource, setViewSource] = useState<Source | null>(null)
  const [editSource, setEditSource] = useState<Source | null>(null)
  const [deleteSource, setDeleteSource] = useState<Source | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load exam categories once
  useEffect(() => {
    supabase
      .from('exam_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) setExamCategories(data as ExamCategory[])
      })
  }, [])

  const fetchSources = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sources')
      .select(`
        id,
        name,
        exam_category_id,
        description,
        created_at,
        updated_at,
        exam_categories(name),
        chapters(id, questions(count))
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch sources:', error)
      setLoading(false)
      return
    }

    const mapped: Source[] = (data ?? []).map((row: Record<string, unknown>) => {
      const chaptersArr = Array.isArray(row.chapters) ? row.chapters : []
      const chapterCount = chaptersArr.length

      let questionCount = 0
      for (const ch of chaptersArr) {
        if (typeof ch === 'object' && ch !== null && 'questions' in ch) {
          const qArr = (ch as { questions: unknown }).questions
          if (Array.isArray(qArr) && qArr.length > 0 && typeof qArr[0] === 'object' && qArr[0] !== null) {
            questionCount += (qArr[0] as { count?: number }).count ?? 0
          }
        }
      }

      const examCat = row.exam_categories as { name?: string } | null

      return {
        id: row.id as string,
        name: row.name as string,
        exam_category_id: (row.exam_category_id as string | null) ?? null,
        exam_category_name: examCat?.name ?? null,
        description: (row.description as string | null) ?? null,
        chapter_count: chapterCount,
        question_count: questionCount,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      }
    })

    setSources(mapped)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  async function handleDelete() {
    if (!deleteSource) return
    setDeleting(true)
    const { error } = await supabase.from('sources').delete().eq('id', deleteSource.id)
    setDeleting(false)
    if (!error) {
      setDeleteSource(null)
      fetchSources()
    }
  }

  const filtered = sources.filter((s) => {
    const matchSearch =
      search.trim() === '' ||
      s.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      categoryFilter === 'ALL' || s.exam_category_id === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-5 h-5 text-zinc-400" />
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Sources &amp; Chapters</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Organise your question bank by source and chapter
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Source
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search sources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">All Exams</option>
          {examCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Source Name
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Exam
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Chapters
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Questions
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Created
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
                  Loading sources…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">
                    {search || categoryFilter !== 'ALL'
                      ? 'No sources match your filters.'
                      : 'No sources yet. Create your first source to get started.'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((source) => (
                <tr
                  key={source.id}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-900">{source.name}</span>
                    {source.description && (
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{source.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CategoryBadge name={source.exam_category_name} />
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{source.chapter_count}</td>
                  <td className="px-4 py-3 text-zinc-700">{source.question_count}</td>
                  <td className="px-4 py-3 text-zinc-500">{formatDateTime(source.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewSource(source)}
                        title="View"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditSource(source)}
                        title="Edit"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteSource(source)}
                        title="Delete"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => router.push(`/super-admin/sources-chapters/${source.id}`)}
                        title="View Chapters"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors ml-1"
                      >
                        Chapters
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <SourceFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={fetchSources}
        examCategories={examCategories}
      />
      <SourceFormModal
        open={!!editSource}
        onClose={() => setEditSource(null)}
        onSaved={fetchSources}
        examCategories={examCategories}
        initial={editSource ?? undefined}
      />
      <ViewSourceModal
        open={!!viewSource}
        onClose={() => setViewSource(null)}
        source={viewSource}
      />
      <DeleteModal
        open={!!deleteSource}
        onClose={() => setDeleteSource(null)}
        onConfirm={handleDelete}
        sourceName={deleteSource?.name ?? ''}
        hasContent={(deleteSource?.chapter_count ?? 0) > 0 || (deleteSource?.question_count ?? 0) > 0}
        deleting={deleting}
      />
    </div>
  )
}
