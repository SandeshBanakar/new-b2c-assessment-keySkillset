'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  X,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChapterDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'
type ChapterStatus = 'DRAFT' | 'ACTIVE'

interface Source {
  id: string
  name: string
  exam_category_name: string | null
}

interface Chapter {
  id: string
  source_id: string
  name: string
  description: string | null
  order_index: number
  difficulty: ChapterDifficulty
  status: ChapterStatus
  question_count: number
  created_at: string
  updated_at: string
}

interface ChapterFormData {
  name: string
  description: string
  order_index: number
  difficulty: ChapterDifficulty
  status: ChapterStatus
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

function DifficultyBadge({ difficulty }: { difficulty: ChapterDifficulty }) {
  const cls: Record<ChapterDifficulty, string> = {
    easy: 'bg-green-50 text-green-700',
    medium: 'bg-amber-50 text-amber-700',
    hard: 'bg-rose-50 text-rose-700',
    mixed: 'bg-zinc-100 text-zinc-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[difficulty]}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  )
}

function StatusBadge({ status }: { status: ChapterStatus }) {
  return status === 'ACTIVE' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">Active</span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-500">Draft</span>
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
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
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
  open, onClose, onSaved, sourceId, initial, nextOrderIndex,
}: {
  open: boolean; onClose: () => void; onSaved: () => void
  sourceId: string; initial?: Chapter; nextOrderIndex: number
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<ChapterFormData>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    order_index: initial?.order_index ?? nextOrderIndex,
    difficulty: initial?.difficulty ?? 'medium',
    status: initial?.status ?? 'DRAFT',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        description: initial?.description ?? '',
        order_index: initial?.order_index ?? nextOrderIndex,
        difficulty: initial?.difficulty ?? 'medium',
        status: initial?.status ?? 'DRAFT',
      })
      setError(null)
    }
  }, [open, initial, nextOrderIndex])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Chapter name is required.'); return }
    setSaving(true); setError(null)
    try {
      if (isEdit && initial) {
        const { error: err } = await supabase.from('chapters').update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          order_index: form.order_index,
          difficulty: form.difficulty,
          status: form.status,
          last_modified_by: DEMO_SA_ID,
          updated_at: new Date().toISOString(),
        }).eq('id', initial.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('chapters').insert({
          source_id: sourceId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          order_index: form.order_index,
          difficulty: form.difficulty,
          status: form.status,
          created_by: DEMO_SA_ID,
          last_modified_by: DEMO_SA_ID,
        })
        if (err) throw err
      }
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save chapter.')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Chapter' : 'Add Chapter'}>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">{error}</div>}
        <div>
          <FieldLabel label="Chapter Name" required />
          <input className={inputCls} placeholder="e.g. Chapter 1 — Atomic Structure" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Order Index" />
            <input type="number" min={1} className={inputCls} value={form.order_index}
              onChange={(e) => setForm((f) => ({ ...f, order_index: parseInt(e.target.value) || 1 }))} />
          </div>
          <div>
            <FieldLabel label="Difficulty" />
            <select className={inputCls} value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as ChapterDifficulty }))}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
        <div>
          <FieldLabel label="Status" />
          <select className={inputCls} value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ChapterStatus }))}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>
        <div>
          <FieldLabel label="Description" />
          <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Optional description"
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Chapter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── View Chapter Modal ───────────────────────────────────────────────────────

function ViewChapterModal({ open, onClose, chapter }: { open: boolean; onClose: () => void; chapter: Chapter | null }) {
  if (!chapter) return null
  return (
    <Modal open={open} onClose={onClose} title="View Chapter">
      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <p className="text-xs text-zinc-500 mb-0.5">Chapter Name</p>
            <p className="text-sm font-medium text-zinc-900">{chapter.name}</p>
          </div>
          <div><p className="text-xs text-zinc-500 mb-0.5">Order</p><p className="text-sm text-zinc-700">{chapter.order_index}</p></div>
          <div><p className="text-xs text-zinc-500 mb-0.5">Questions</p><p className="text-sm font-medium text-zinc-900">{chapter.question_count}</p></div>
          <div><p className="text-xs text-zinc-500 mb-0.5">Difficulty</p><DifficultyBadge difficulty={chapter.difficulty} /></div>
          <div><p className="text-xs text-zinc-500 mb-0.5">Status</p><StatusBadge status={chapter.status} /></div>
          <div><p className="text-xs text-zinc-500 mb-0.5">Created</p><p className="text-sm text-zinc-700">{formatDateTime(chapter.created_at)}</p></div>
          <div><p className="text-xs text-zinc-500 mb-0.5">Updated</p><p className="text-sm text-zinc-700">{formatDateTime(chapter.updated_at)}</p></div>
        </div>
        {chapter.description && <div><p className="text-xs text-zinc-500 mb-0.5">Description</p><p className="text-sm text-zinc-700">{chapter.description}</p></div>}
      </div>
    </Modal>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ open, onClose, onConfirm, chapterName, hasQuestions, deleting }: {
  open: boolean; onClose: () => void; onConfirm: () => void
  chapterName: string; hasQuestions: boolean; deleting: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Chapter" width="max-w-sm">
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-zinc-900">Delete &ldquo;{chapterName}&rdquo;?</p>
            {hasQuestions
              ? <p className="text-xs text-rose-600 mt-1">This chapter has questions. Remove all questions before deleting.</p>
              : <p className="text-xs text-zinc-500 mt-1">This action cannot be undone.</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={deleting || hasQuestions}
            className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete'}
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
  const [createOpen, setCreateOpen] = useState(false)
  const [viewChapter, setViewChapter] = useState<Chapter | null>(null)
  const [editChapter, setEditChapter] = useState<Chapter | null>(null)
  const [deleteChapter, setDeleteChapter] = useState<Chapter | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [sourceRes, chaptersRes] = await Promise.all([
      supabase.from('sources').select('id, name, exam_categories(name)').eq('id', sourceId).single(),
      supabase.from('chapters').select(`
        id, source_id, name, description, order_index, difficulty, status, created_at, updated_at,
        questions(count)
      `).eq('source_id', sourceId).order('order_index', { ascending: true }),
    ])

    if (sourceRes.data) {
      const d = sourceRes.data as Record<string, unknown>
      const cat = d.exam_categories as { name?: string } | null
      setSource({ id: d.id as string, name: d.name as string, exam_category_name: cat?.name ?? null })
    }

    if (chaptersRes.data) {
      setChapters(chaptersRes.data.map((row: Record<string, unknown>) => {
        const qArr = Array.isArray(row.questions) ? row.questions : []
        const questionCount = qArr.length > 0 && typeof qArr[0] === 'object' && qArr[0] !== null
          ? (qArr[0] as { count?: number }).count ?? 0 : 0
        return {
          id: row.id as string,
          source_id: row.source_id as string,
          name: row.name as string,
          description: (row.description as string | null) ?? null,
          order_index: (row.order_index as number) ?? 0,
          difficulty: (row.difficulty as ChapterDifficulty) ?? 'medium',
          status: (row.status as ChapterStatus) ?? 'DRAFT',
          question_count: questionCount,
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
        }
      }))
    }
    setLoading(false)
  }, [sourceId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete() {
    if (!deleteChapter) return
    setDeleting(true)
    const { error } = await supabase.from('chapters').delete().eq('id', deleteChapter.id)
    setDeleting(false)
    if (!error) { setDeleteChapter(null); fetchData() }
  }

  const filtered = chapters.filter((c) =>
    search.trim() === '' || c.name.toLowerCase().includes(search.toLowerCase()))

  const nextOrderIndex = chapters.length > 0
    ? Math.max(...chapters.map((c) => c.order_index)) + 1 : 1

  return (
    <div className="px-6 py-6">
      <button onClick={() => router.push('/super-admin/sources-chapters')}
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />Sources &amp; Chapters
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-zinc-900">{source ? source.name : 'Loading…'}</h1>
          {source && (
            <p className="text-xs text-zinc-500 mt-0.5">
              {source.exam_category_name ? `${source.exam_category_name} · ` : ''}
              {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors">
          <Plus className="w-4 h-4" />Add Chapter
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search chapters…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide w-10">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Chapter Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Difficulty</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Questions</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-400">Loading chapters…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center">
                <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">{search ? 'No chapters match your search.' : 'No chapters yet. Add the first chapter to this source.'}</p>
              </td></tr>
            ) : filtered.map((chapter) => (
              <tr key={chapter.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 text-zinc-400 text-xs">{chapter.order_index}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-zinc-900">{chapter.name}</span>
                  {chapter.description && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{chapter.description}</p>}
                </td>
                <td className="px-4 py-3"><DifficultyBadge difficulty={chapter.difficulty} /></td>
                <td className="px-4 py-3"><StatusBadge status={chapter.status} /></td>
                <td className="px-4 py-3 text-zinc-700">{chapter.question_count}</td>
                <td className="px-4 py-3 text-zinc-500">{formatDateTime(chapter.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setViewChapter(chapter)} title="View" className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditChapter(chapter)} title="Edit" className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteChapter(chapter)} title="Delete" className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => router.push(`/super-admin/sources-chapters/${sourceId}/${chapter.id}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors ml-1">
                      Questions<ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ChapterFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={fetchData} sourceId={sourceId} nextOrderIndex={nextOrderIndex} />
      <ChapterFormModal open={!!editChapter} onClose={() => setEditChapter(null)} onSaved={fetchData} sourceId={sourceId} initial={editChapter ?? undefined} nextOrderIndex={nextOrderIndex} />
      <ViewChapterModal open={!!viewChapter} onClose={() => setViewChapter(null)} chapter={viewChapter} />
      <DeleteModal open={!!deleteChapter} onClose={() => setDeleteChapter(null)} onConfirm={handleDelete} chapterName={deleteChapter?.name ?? ''} hasQuestions={(deleteChapter?.question_count ?? 0) > 0} deleting={deleting} />
    </div>
  )
}
