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
  ArrowLeft,
  X,
  BookOpen,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'PASSAGE_SINGLE' | 'PASSAGE_MULTI' | 'NUMERIC'
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed'
type QuestionStatus = 'ACTIVE' | 'DRAFT' | 'FLAGGED'

interface Question {
  id: string
  chapter_id: string
  source_id: string | null
  question_type: QuestionType
  difficulty: Difficulty
  status: QuestionStatus
  question_text: string | Record<string, unknown>
  passage_text: string | Record<string, unknown> | null
  marks: number
  negative_marks: number
  concept_tag: string | null
  created_at: string
  updated_at: string
}

interface Source {
  id: string
  name: string
}

interface Chapter {
  id: string
  name: string
  source_id: string
  difficulty: Difficulty
}

const PAGE_SIZE_OPTIONS = [25, 50, 100]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function extractPlainText(value: string | Record<string, unknown> | null): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  try {
    const doc = value as { content?: { content?: { text?: string }[] }[] }
    const texts: string[] = []
    for (const block of doc.content ?? []) {
      for (const inline of block.content ?? []) {
        if (inline.text) texts.push(inline.text)
      }
    }
    return texts.join(' ')
  } catch {
    return ''
  }
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const cls: Record<Difficulty, string> = {
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

function TypeBadge({ type }: { type: QuestionType }) {
  const labels: Record<QuestionType, string> = {
    MCQ_SINGLE: 'MCQ Single',
    MCQ_MULTI: 'MCQ Multi',
    PASSAGE_SINGLE: 'Passage Single',
    PASSAGE_MULTI: 'Passage Multi',
    NUMERIC: 'Numeric',
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600">
      {labels[type]}
    </span>
  )
}

function StatusBadge({ status }: { status: QuestionStatus }) {
  const cls: Record<QuestionStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    DRAFT: 'bg-zinc-100 text-zinc-500',
    FLAGGED: 'bg-amber-50 text-amber-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  width = 'max-w-2xl',
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

// ─── View Question Modal ──────────────────────────────────────────────────────

function ViewQuestionModal({
  open,
  onClose,
  question,
}: {
  open: boolean
  onClose: () => void
  question: Question | null
}) {
  if (!question) return null

  const questionText = extractPlainText(question.question_text)
  const passageText = extractPlainText(question.passage_text)

  return (
    <Modal open={open} onClose={onClose} title="View Question">
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={question.question_type} />
          <DifficultyBadge difficulty={question.difficulty} />
          <StatusBadge status={question.status} />
          {question.concept_tag && (
            <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
              {question.concept_tag}
            </span>
          )}
          <span className="text-xs text-zinc-400 ml-auto">
            +{question.marks}m / -{question.negative_marks}m
          </span>
        </div>

        {passageText && (
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Passage</p>
            <div className="text-sm text-zinc-700 bg-zinc-50 rounded-md px-3 py-2 border border-zinc-200 whitespace-pre-wrap">
              {passageText}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Question</p>
          <div className="text-sm text-zinc-900 bg-zinc-50 rounded-md px-3 py-2 border border-zinc-200 whitespace-pre-wrap">
            {questionText || <span className="text-zinc-400 italic">No question text</span>}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-zinc-400">Created {formatDate(question.created_at)}</p>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChapterQuestionsPage() {
  const router = useRouter()
  const params = useParams()
  const sourceId = params.sourceId as string
  const chapterId = params.chapterId as string

  const [source, setSource] = useState<Source | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [viewQuestion, setViewQuestion] = useState<Question | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [sourceRes, chapterRes, questionsRes] = await Promise.all([
      supabase.from('sources').select('id, name').eq('id', sourceId).single(),
      supabase
        .from('chapters')
        .select('id, name, source_id, difficulty')
        .eq('id', chapterId)
        .single(),
      supabase
        .from('questions')
        .select(
          'id, chapter_id, source_id, question_type, difficulty, status, question_text, passage_text, marks, negative_marks, concept_tag, created_at, updated_at',
        )
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false }),
    ])

    if (sourceRes.data) setSource(sourceRes.data as Source)
    if (chapterRes.data) setChapter(chapterRes.data as Chapter)
    if (questionsRes.data) setQuestions(questionsRes.data as Question[])
    setLoading(false)
  }, [sourceId, chapterId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, diffFilter, statusFilter])

  const conceptOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const q of questions) {
      if (q.concept_tag) seen.add(q.concept_tag)
    }
    return Array.from(seen).sort()
  }, [questions])

  const filtered = questions.filter((q) => {
    const plainText = extractPlainText(q.question_text)
    const matchSearch =
      search.trim() === '' ||
      plainText.toLowerCase().includes(search.toLowerCase()) ||
      (q.concept_tag ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === '' || q.question_type === typeFilter
    const matchDiff = diffFilter === '' || q.difficulty === diffFilter
    const matchStatus = statusFilter === '' || q.status === statusFilter
    return matchSearch && matchType && matchDiff && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, filtered.length)

  const createUrl = `/super-admin/question-bank/new?chapterId=${chapterId}&sourceId=${sourceId}`

  return (
    <div className="px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-1 text-xs text-zinc-400">
        <button
          onClick={() => router.push('/super-admin/sources-chapters')}
          className="hover:text-zinc-700 transition-colors"
        >
          Sources &amp; Chapters
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/super-admin/sources-chapters/${sourceId}`)}
          className="hover:text-zinc-700 transition-colors"
        >
          {source?.name ?? '…'}
        </button>
        <span>/</span>
        <span className="text-zinc-600">{chapter?.name ?? '…'}</span>
      </div>

      <button
        onClick={() => router.push(`/super-admin/sources-chapters/${sourceId}`)}
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {source?.name ?? 'Source'}
      </button>

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-zinc-900">
            {chapter?.name ?? 'Loading…'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
            {chapter && (
              <span className="ml-2">
                &middot; <span className="capitalize">{chapter.difficulty}</span>
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => router.push(createUrl)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search questions or concepts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-zinc-700"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="MCQ_SINGLE">MCQ Single</option>
          <option value="MCQ_MULTI">MCQ Multi</option>
          <option value="PASSAGE_SINGLE">Passage Single</option>
          <option value="PASSAGE_MULTI">Passage Multi</option>
          <option value="NUMERIC">Numeric</option>
        </select>
        <select
          className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-zinc-700"
          value={diffFilter}
          onChange={(e) => setDiffFilter(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="mixed">Mixed</option>
        </select>
        <select
          className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-zinc-700"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="FLAGGED">Flagged</option>
        </select>
        {conceptOptions.length > 0 && (
          <select
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-zinc-700"
            value={search.startsWith('concept:') ? search.replace('concept:', '') : ''}
            onChange={(e) => setSearch(e.target.value ? `concept:${e.target.value}` : '')}
          >
            <option value="">All Concepts</option>
            {conceptOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Question
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Type
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Difficulty
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Marks
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Concept
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Added
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-zinc-400">
                  Loading questions…
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">
                    {search || typeFilter || diffFilter || statusFilter
                      ? 'No questions match your filters.'
                      : 'No questions yet. Create the first question for this chapter.'}
                  </p>
                  {!search && !typeFilter && !diffFilter && !statusFilter && (
                    <button
                      onClick={() => router.push(createUrl)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Question
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              paginated.map((q) => {
                const plainText = extractPlainText(q.question_text)
                return (
                  <tr
                    key={q.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-zinc-900 line-clamp-2 text-sm">
                        {plainText || <span className="text-zinc-400 italic">No text</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={q.question_type} />
                    </td>
                    <td className="px-4 py-3">
                      <DifficultyBadge difficulty={q.difficulty} />
                    </td>
                    <td className="px-4 py-3 text-zinc-700 text-xs whitespace-nowrap">
                      +{q.marks} / -{q.negative_marks}
                    </td>
                    <td className="px-4 py-3">
                      {q.concept_tag ? (
                        <span className="text-xs text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                          {q.concept_tag}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {formatDate(q.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewQuestion(q)}
                          title="View"
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/super-admin/question-bank/${q.id}/edit`)
                          }
                          title="Edit"
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
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
      <ViewQuestionModal
        open={!!viewQuestion}
        onClose={() => setViewQuestion(null)}
        question={viewQuestion}
      />
    </div>
  )
}
