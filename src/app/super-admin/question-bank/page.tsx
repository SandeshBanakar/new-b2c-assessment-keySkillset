'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Search, Eye, Pencil, BookMarked, Plus, X, Calendar } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'PASSAGE_SINGLE' | 'PASSAGE_MULTI' | 'NUMERIC'
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed'
type QuestionStatus = 'ACTIVE' | 'DRAFT' | 'FLAGGED'

interface Question {
  id: string
  chapter_id: string | null
  source_id: string | null
  question_type: QuestionType
  difficulty: Difficulty
  status: QuestionStatus
  question_text: string
  passage_text: string | null
  marks: number
  negative_marks: number
  concept_tag: string | null
  created_at: string
  updated_at: string
  source_name: string | null
  chapter_name: string | null
  creator_name: string | null
}

interface Source { id: string; name: string }
interface Creator { id: string; name: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const cls: Record<Difficulty, string> = {
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

function TypeBadge({ type }: { type: QuestionType }) {
  const labels: Record<QuestionType, string> = {
    MCQ_SINGLE: 'MCQ Single', MCQ_MULTI: 'MCQ Multi',
    PASSAGE_SINGLE: 'Passage Single', PASSAGE_MULTI: 'Passage Multi', NUMERIC: 'Numeric',
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600">{labels[type]}</span>
}

function StatusBadge({ status }: { status: QuestionStatus }) {
  const cls: Record<QuestionStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    DRAFT: 'bg-zinc-100 text-zinc-500',
    FLAGGED: 'bg-amber-50 text-amber-700',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[status]}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
}

// ─── View Question Modal ──────────────────────────────────────────────────────

function ViewQuestionModal({ open, onClose, question }: { open: boolean; onClose: () => void; question: Question | null }) {
  if (!question) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 shrink-0">
          <h2 className="text-sm font-semibold text-zinc-900">View Question</h2>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={question.question_type} />
            <DifficultyBadge difficulty={question.difficulty} />
            <StatusBadge status={question.status} />
            {question.concept_tag && (
              <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{question.concept_tag}</span>
            )}
            <span className="text-xs text-zinc-400 ml-auto">+{question.marks}m / -{question.negative_marks}m</span>
          </div>
          {(question.source_name || question.chapter_name) && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              {question.source_name && <span>{question.source_name}</span>}
              {question.source_name && question.chapter_name && <span>›</span>}
              {question.chapter_name && <span>{question.chapter_name}</span>}
            </div>
          )}
          {question.passage_text && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Passage</p>
              <div className="text-sm text-zinc-700 bg-zinc-50 rounded-md px-3 py-2 border border-zinc-200 whitespace-pre-wrap">{question.passage_text}</div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Question</p>
            <div className="text-sm text-zinc-900 bg-zinc-50 rounded-md px-3 py-2 border border-zinc-200 whitespace-pre-wrap">{question.question_text}</div>
          </div>
          <p className="text-xs text-zinc-400">Created {formatDate(question.created_at)}{question.creator_name ? ` by ${question.creator_name}` : ''}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

export default function QuestionBankPage() {
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  // Filter state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'ALL'>('ALL')
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | 'ALL'>('ACTIVE')
  const [sourceFilter, setSourceFilter] = useState<string>('ALL')
  const [creatorFilter, setCreatorFilter] = useState<string>('ALL')
  const [createdOn, setCreatedOn] = useState('')
  const [lastEdited, setLastEdited] = useState('')

  // Lookup data
  const [sources, setSources] = useState<Source[]>([])
  const [creators, setCreators] = useState<Creator[]>([])

  const [viewQuestion, setViewQuestion] = useState<Question | null>(null)

  // Load sources and creators for filter dropdowns
  useEffect(() => {
    supabase.from('sources').select('id, name').order('name').then(({ data }) => {
      if (data) setSources(data as Source[])
    })
    supabase.from('admin_users').select('id, name').in('role', ['CONTENT_CREATOR', 'SUPER_ADMIN'])
      .eq('is_active', true).order('name').then(({ data }) => {
        if (data) setCreators(data as Creator[])
      })
  }, [])

  const fetchQuestions = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('questions')
      .select(`
        id, chapter_id, source_id, question_type, difficulty, status,
        question_text, passage_text, marks, negative_marks, concept_tag,
        created_at, updated_at,
        chapters(name, sources(name)),
        admin_users!questions_created_by_fkey(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (typeFilter !== 'ALL') query = query.eq('question_type', typeFilter)
    if (diffFilter !== 'ALL') query = query.eq('difficulty', diffFilter)
    if (statusFilter !== 'ALL') query = query.eq('status', statusFilter)
    if (sourceFilter !== 'ALL') query = query.eq('source_id', sourceFilter)
    if (creatorFilter !== 'ALL') query = query.eq('created_by', creatorFilter)
    if (search.trim()) query = query.ilike('question_text', `%${search.trim()}%`)
    if (createdOn) {
      const day = new Date(createdOn)
      const next = new Date(day); next.setDate(next.getDate() + 1)
      query = query.gte('created_at', day.toISOString()).lt('created_at', next.toISOString())
    }
    if (lastEdited) {
      const day = new Date(lastEdited)
      const next = new Date(day); next.setDate(next.getDate() + 1)
      query = query.gte('updated_at', day.toISOString()).lt('updated_at', next.toISOString())
    }

    const { data, count, error } = await query

    if (!error && data) {
      const mapped: Question[] = data.map((row: Record<string, unknown>) => {
        const ch = row.chapters as Record<string, unknown> | null
        const src = ch?.sources as Record<string, unknown> | null
        const creator = row.admin_users as { name?: string } | null
        return {
          id: row.id as string,
          chapter_id: (row.chapter_id as string | null) ?? null,
          source_id: (row.source_id as string | null) ?? null,
          question_type: row.question_type as QuestionType,
          difficulty: row.difficulty as Difficulty,
          status: row.status as QuestionStatus,
          question_text: row.question_text as string,
          passage_text: (row.passage_text as string | null) ?? null,
          marks: row.marks as number,
          negative_marks: row.negative_marks as number,
          concept_tag: (row.concept_tag as string | null) ?? null,
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
          chapter_name: (ch?.name as string | null) ?? null,
          source_name: (src?.name as string | null) ?? null,
          creator_name: creator?.name ?? null,
        }
      })
      setQuestions(mapped)
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [page, typeFilter, diffFilter, statusFilter, sourceFilter, creatorFilter, search, createdOn, lastEdited])

  useEffect(() => { setPage(0) }, [typeFilter, diffFilter, statusFilter, sourceFilter, creatorFilter, search, createdOn, lastEdited])
  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  const hasActiveFilters = typeFilter !== 'ALL' || diffFilter !== 'ALL' || statusFilter !== 'ACTIVE'
    || sourceFilter !== 'ALL' || creatorFilter !== 'ALL' || search || createdOn || lastEdited

  function clearFilters() {
    setTypeFilter('ALL'); setDiffFilter('ALL'); setStatusFilter('ACTIVE')
    setSourceFilter('ALL'); setCreatorFilter('ALL'); setSearch(''); setCreatedOn(''); setLastEdited('')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-zinc-900">Question Bank</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Browse and manage your question library</p>
        </div>
        <button
          onClick={() => router.push('/super-admin/question-bank/new')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Question
        </button>
      </div>

      {/* Filter panel — two rows */}
      <div className="bg-white rounded-xl border border-zinc-200 p-3 mb-4 space-y-2.5">
        {/* Row 1: Search + Type + Difficulty + Status */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="text-sm border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700 shrink-0"
            value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as QuestionType | 'ALL')}>
            <option value="ALL">All Types</option>
            <option value="MCQ_SINGLE">MCQ Single</option>
            <option value="MCQ_MULTI">MCQ Multi</option>
            <option value="PASSAGE_SINGLE">Passage Single</option>
            <option value="PASSAGE_MULTI">Passage Multi</option>
            <option value="NUMERIC">Numeric</option>
          </select>
          <select className="text-sm border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700 shrink-0"
            value={diffFilter} onChange={(e) => setDiffFilter(e.target.value as Difficulty | 'ALL')}>
            <option value="ALL">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>
          <select className="text-sm border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700 shrink-0"
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as QuestionStatus | 'ALL')}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="FLAGGED">Flagged</option>
          </select>
        </div>

        {/* Row 2: Sources + Creators + Created on + Last edited + Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          <select className="text-sm border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700"
            value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="ALL">All Sources</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="text-sm border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700"
            value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)}>
            <option value="ALL">All Creators</option>
            {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="flex items-center gap-1.5 border border-zinc-200 rounded-md px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs text-zinc-500 shrink-0">Created on</span>
            <input type="date" className="text-sm text-zinc-700 focus:outline-none bg-transparent"
              value={createdOn} onChange={(e) => setCreatedOn(e.target.value)} />
          </div>

          <div className="flex items-center gap-1.5 border border-zinc-200 rounded-md px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs text-zinc-500 shrink-0">Last edited</span>
            <input type="date" className="text-sm text-zinc-700 focus:outline-none bg-transparent"
              value={lastEdited} onChange={(e) => setLastEdited(e.target.value)} />
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 transition-colors ml-auto">
              <X className="w-3 h-3" />Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-400 mb-3">{total} question{total !== 1 ? 's' : ''} found</p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Question</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Source / Chapter</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Difficulty</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Marks</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Added</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-zinc-400">Loading questions…</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center">
                <BookMarked className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No questions match your filters.</p>
              </td></tr>
            ) : questions.map((q) => (
              <tr key={q.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-zinc-900 line-clamp-2 text-sm">{q.question_text}</p>
                  {q.concept_tag && <span className="text-xs text-zinc-400">{q.concept_tag}</span>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-zinc-600">{q.source_name ?? '—'}</p>
                  <p className="text-xs text-zinc-400">{q.chapter_name ?? '—'}</p>
                </td>
                <td className="px-4 py-3"><TypeBadge type={q.question_type} /></td>
                <td className="px-4 py-3"><DifficultyBadge difficulty={q.difficulty} /></td>
                <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                <td className="px-4 py-3 text-zinc-700 text-xs">+{q.marks} / -{q.negative_marks}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{formatDate(q.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setViewQuestion(q)} title="View" className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => router.push(`/super-admin/question-bank/${q.id}/edit`)} title="Edit" className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
            <p className="text-xs text-zinc-500">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 text-xs font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 text-xs font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      <ViewQuestionModal open={!!viewQuestion} onClose={() => setViewQuestion(null)} question={viewQuestion} />
    </div>
  )
}
