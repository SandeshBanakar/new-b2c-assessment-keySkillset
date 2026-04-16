'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PaginationBar } from '@/components/ui/PaginationBar'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Layers,
  BookOpen,
  GitBranch,
  X,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'
type SourceStatus = 'DRAFT' | 'ACTIVE'

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
  difficulty: SourceDifficulty
  target_exam: string | null
  status: SourceStatus
  chapter_count: number
  question_count: number
  created_at: string
  updated_at: string
}

interface ChapterPreview {
  id: string
  name: string
  difficulty: SourceDifficulty
}

interface SourceFormData {
  name: string
  exam_category_id: string
  description: string
  difficulty: SourceDifficulty
  target_exam: string
  status: SourceStatus
}

const DEMO_SA_ID = '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'

const DIFFICULTY_OPTIONS: { value: SourceDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
]

const PAGE_SIZE_OPTIONS = [25, 50, 100]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DifficultyBadge({ value }: { value: SourceDifficulty }) {
  const cls: Record<SourceDifficulty, string> = {
    easy: 'bg-green-50 text-green-700',
    medium: 'bg-amber-50 text-amber-700',
    hard: 'bg-rose-50 text-rose-600',
    mixed: 'bg-zinc-100 text-zinc-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${cls[value]}`}>
      {value}
    </span>
  )
}

function StatusBadge({ value }: { value: SourceStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      value === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-600'
    }`}>
      {value === 'ACTIVE' ? 'Active' : 'Draft'}
    </span>
  )
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

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

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

// ─── Source Form Modal (Create + Edit) ───────────────────────────────────────

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
    name: '',
    exam_category_id: '',
    description: '',
    difficulty: 'easy',
    target_exam: '',
    status: 'DRAFT',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        exam_category_id: initial?.exam_category_id ?? '',
        description: initial?.description ?? '',
        difficulty: initial?.difficulty ?? 'easy',
        target_exam: initial?.target_exam ?? '',
        status: initial?.status ?? 'DRAFT',
      })
      setError(null)
    }
  }, [open, initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Source name is required.'); return }
    if (!form.exam_category_id) { setError('Exam category is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name.trim(),
        exam_category_id: form.exam_category_id,
        description: form.description.trim() || null,
        difficulty: form.difficulty,
        target_exam: form.target_exam.trim() || null,
        status: form.status,
        last_modified_by: DEMO_SA_ID,
        updated_at: new Date().toISOString(),
      }
      if (isEdit && initial) {
        const { error: err } = await supabase.from('sources').update(payload).eq('id', initial.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('sources')
          .insert({ ...payload, created_by: DEMO_SA_ID })
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Source' : 'Create New Source'}>
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
            placeholder="e.g. NEET Physics XI"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div>
          <FieldLabel label="Description" />
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel label="Category" required />
            <select
              className={inputCls}
              value={form.exam_category_id}
              onChange={(e) => setForm((f) => ({ ...f, exam_category_id: e.target.value }))}
            >
              <option value="">Select category…</option>
              {examCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel label="Target Exam" />
            <input
              className={inputCls}
              placeholder="e.g. NEET 2025"
              value={form.target_exam}
              onChange={(e) => setForm((f) => ({ ...f, target_exam: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel label="Difficulty Level" />
            <select
              className={inputCls}
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as SourceDifficulty }))}
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel label="Status" />
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SourceStatus }))}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            You can add chapters from the Actions column in the Source Table.
          </p>
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
            {saving ? 'Saving…' : isEdit ? 'Update Source' : 'Create Source'}
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
  const [chapters, setChapters] = useState<ChapterPreview[]>([])
  const [loadingChapters, setLoadingChapters] = useState(false)

  useEffect(() => {
    if (!open || !source) { setChapters([]); return }
    setLoadingChapters(true)
    supabase
      .from('chapters')
      .select('id, name, difficulty')
      .eq('source_id', source.id)
      .is('deleted_at', null)
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setChapters((data ?? []) as ChapterPreview[])
        setLoadingChapters(false)
      })
  }, [open, source])

  if (!source) return null

  return (
    <Modal open={open} onClose={onClose} title="Source Details" width="max-w-xl">
      <div className="px-5 py-4 space-y-4">
        {/* Name */}
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Name</p>
          <p className="text-base font-semibold text-zinc-900">{source.name}</p>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Description</p>
          <p className="text-sm text-zinc-700">{source.description || '—'}</p>
        </div>

        {/* Category + Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Category</p>
            <CategoryBadge name={source.exam_category_name} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Difficulty Level</p>
            <DifficultyBadge value={source.difficulty} />
          </div>
        </div>

        {/* Target Exam */}
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Target Exam</p>
          <p className="text-sm text-zinc-700">{source.target_exam || '—'}</p>
        </div>

        {/* Chapters list */}
        <div className="border-t border-zinc-100 pt-4">
          <p className="text-xs font-semibold text-zinc-700 mb-2">
            Chapters ({source.chapter_count})
          </p>
          {loadingChapters ? (
            <p className="text-xs text-zinc-400 py-2">Loading chapters…</p>
          ) : chapters.length === 0 ? (
            <p className="text-xs text-zinc-400 py-2">No chapters yet.</p>
          ) : (
            <div className="space-y-1.5">
              {chapters.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-zinc-50 border border-zinc-100"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{ch.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Difficulty: {ch.difficulty.charAt(0).toUpperCase() + ch.difficulty.slice(1)}
                    </p>
                  </div>
                  <DifficultyBadge value={ch.difficulty} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="border-t border-zinc-100 pt-4">
          <p className="text-xs font-semibold text-zinc-700 mb-2">Statistics</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-zinc-50 border border-zinc-100 px-3 py-2.5">
              <p className="text-xs text-zinc-500">Total Chapters</p>
              <p className="text-lg font-semibold text-zinc-900 mt-0.5">{source.chapter_count}</p>
            </div>
            <div className="rounded-md bg-zinc-50 border border-zinc-100 px-3 py-2.5">
              <p className="text-xs text-zinc-500">Total Questions</p>
              <p className="text-lg font-semibold text-zinc-900 mt-0.5">{source.question_count}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  open,
  onClose,
  onConfirm,
  source,
  deleting,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  source: Source | null
  deleting: boolean
}) {
  if (!source) return null
  return (
    <Modal open={open} onClose={onClose} title="Delete Source" width="max-w-sm">
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-zinc-700">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-zinc-900">&ldquo;{source.name}&rdquo;</span>?
          This action cannot be undone.
        </p>
        {source.chapter_count > 0 && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              {source.chapter_count} chapter{source.chapter_count !== 1 ? 's' : ''} within this source will also be removed.
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

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
      .then(({ data }) => { if (data) setExamCategories(data as ExamCategory[]) })
  }, [])

  const fetchSources = useCallback(async () => {
    setLoading(true)

    // Two parallel queries: sources + chapter/question counts (filtered to non-deleted chapters)
    const [sourcesRes, chaptersRes] = await Promise.all([
      supabase
        .from('sources')
        .select('id, name, exam_category_id, description, difficulty, target_exam, status, created_at, updated_at, exam_categories(name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('chapters')
        .select('source_id, questions(count)')
        .is('deleted_at', null),
    ])

    if (sourcesRes.error) {
      console.error('Failed to fetch sources:', sourcesRes.error)
      setLoading(false)
      return
    }

    // Aggregate chapter count + question count per source
    const countMap = new Map<string, { chapterCount: number; questionCount: number }>()
    for (const ch of (chaptersRes.data ?? []) as { source_id: string; questions: { count: number }[] }[]) {
      const entry = countMap.get(ch.source_id) ?? { chapterCount: 0, questionCount: 0 }
      entry.chapterCount++
      if (Array.isArray(ch.questions) && ch.questions.length > 0) {
        entry.questionCount += ch.questions[0].count ?? 0
      }
      countMap.set(ch.source_id, entry)
    }

    const mapped: Source[] = (sourcesRes.data ?? []).map((row: Record<string, unknown>) => {
      const examCat = row.exam_categories as { name?: string } | null
      const counts = countMap.get(row.id as string) ?? { chapterCount: 0, questionCount: 0 }
      return {
        id: row.id as string,
        name: row.name as string,
        exam_category_id: (row.exam_category_id as string | null) ?? null,
        exam_category_name: examCat?.name ?? null,
        description: (row.description as string | null) ?? null,
        difficulty: (row.difficulty as SourceDifficulty) ?? 'mixed',
        target_exam: (row.target_exam as string | null) ?? null,
        status: (row.status as SourceStatus) ?? 'DRAFT',
        chapter_count: counts.chapterCount,
        question_count: counts.questionCount,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      }
    })

    setSources(mapped)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSources() }, [fetchSources])

  async function handleDelete() {
    if (!deleteSource) return
    setDeleting(true)
    const now = new Date().toISOString()

    // 1. Soft-delete all non-deleted chapters of this source
    const { error: chapErr } = await supabase
      .from('chapters')
      .update({ deleted_at: now })
      .eq('source_id', deleteSource.id)
      .is('deleted_at', null)

    if (chapErr) {
      console.error('Failed to soft-delete chapters:', chapErr)
      setDeleting(false)
      return
    }

    // 2. Soft-delete the source
    const { error: srcErr } = await supabase
      .from('sources')
      .update({ deleted_at: now })
      .eq('id', deleteSource.id)

    setDeleting(false)
    if (!srcErr) {
      setDeleteSource(null)
      fetchSources()
    } else {
      console.error('Failed to soft-delete source:', srcErr)
    }
  }

  // Client-side filter
  const filtered = sources.filter((s) => {
    const matchSearch =
      search.trim() === '' || s.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      categoryFilter === 'ALL' || s.exam_category_id === categoryFilter
    return matchSearch && matchCategory
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handlePageChange(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages))
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setPage(1)
  }

  function resetPage() {
    setPage(1)
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-5 h-5 text-zinc-400" />
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Sources &amp; Chapters</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Organise educational content by sources and chapters
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Source
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
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
          />
        </div>
        <select
          className="text-sm border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); resetPage() }}
        >
          <option value="ALL">All Categories</option>
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
                Category
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Difficulty
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Chapters
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Questions
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
              paginated.map((source) => (
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
                  <td className="px-4 py-3">
                    <DifficultyBadge value={source.difficulty} />
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{source.chapter_count}</td>
                  <td className="px-4 py-3 text-zinc-700">{source.question_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewSource(source)}
                        title="View source details"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => router.push(`/super-admin/sources-chapters/${source.id}`)}
                        title="View chapters"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditSource(source)}
                        title="Edit source"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteSource(source)}
                        title="Delete source"
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

      {/* Row count + Pagination */}
      {!loading && filtered.length > 0 && (
        <>
          <p className="mt-3 text-xs text-zinc-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

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
        source={deleteSource}
        deleting={deleting}
      />
    </div>
  )
}
