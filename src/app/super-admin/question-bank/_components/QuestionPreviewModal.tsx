'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import RichTextRenderer from '@/components/ui/RichTextRenderer'
import { ensureDoc } from '@/components/ui/RichTextEditor'
import type { JSONContent } from '@tiptap/core'

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'PASSAGE_SINGLE' | 'PASSAGE_MULTI' | 'NUMERIC'
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed'
type NumericAnswerType = 'EXACT' | 'RANGE'

interface OptionEntry { key: string; text: JSONContent }

interface SubQuestion {
  id: string
  question_text: JSONContent
  options: OptionEntry[]
  correct_answer: string[]
  explanation: JSONContent | null
  marks: number
  negative_marks: number
  order_index: number
}

interface FullQuestion {
  id: string
  question_type: QuestionType
  difficulty: Difficulty
  question_text: JSONContent
  passage_text: JSONContent | null
  options: OptionEntry[] | null
  correct_answer: string[] | null
  acceptable_answers: string[] | null
  explanation: JSONContent | null
  marks: number
  negative_marks: number
  concept_tag: string | null
  video_url: string | null
  numeric_answer_type: NumericAnswerType | null
  numeric_min: number | null
  numeric_max: number | null
  source_name: string | null
  chapter_name: string | null
  creator_name: string | null
  created_at: string
  editor_name: string | null
  updated_at: string
  sub_questions: SubQuestion[]
}

// Minimal shape passed from the list page (just id needed to fetch full data)
export interface PreviewQuestion { id: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function DifficultyBadge({ d }: { d: Difficulty }) {
  const cls: Record<Difficulty, string> = {
    easy: 'bg-green-50 text-green-700',
    medium: 'bg-amber-50 text-amber-700',
    hard: 'bg-rose-50 text-rose-700',
    mixed: 'bg-zinc-100 text-zinc-600',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${cls[d]}`}>
      {d}
    </span>
  )
}

function TypeBadge({ t }: { t: QuestionType }) {
  const labels: Record<QuestionType, string> = {
    MCQ_SINGLE: 'MCQ Single', MCQ_MULTI: 'MCQ Multiple',
    PASSAGE_SINGLE: 'Passage Single', PASSAGE_MULTI: 'Passage Multiple', NUMERIC: 'Numeric',
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-white uppercase tracking-wide">
      {labels[t]}
    </span>
  )
}

function CorrectAnswerBar({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border-l-4 border-green-500 rounded-r-md">
      <span className="text-xs font-medium text-green-800">Correct Answer:</span>
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-semibold">
          {k}
        </span>
      ))}
    </div>
  )
}

// ─── MCQ Renderer ─────────────────────────────────────────────────────────────

function MCQPreview({
  question_text, options, correct_answer, explanation, isMulti,
}: {
  question_text: JSONContent
  options: OptionEntry[]
  correct_answer: string[]
  explanation: JSONContent | null
  isMulti: boolean
}) {
  return (
    <div className="space-y-4">
      <RichTextRenderer content={question_text} />

      <div className="space-y-2">
        {options.map((opt) => {
          const isCorrect = correct_answer.includes(opt.key)
          return (
            <div key={opt.key}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-md border transition-colors ${
                isCorrect
                  ? 'border-green-300 bg-green-50'
                  : 'border-zinc-200 bg-white'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {isMulti
                  ? <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isCorrect ? 'border-green-600 bg-green-600' : 'border-zinc-300'}`}>
                      {isCorrect && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                  : <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isCorrect ? 'border-green-600' : 'border-zinc-300'}`}>
                      {isCorrect && <div className="w-2 h-2 bg-green-600 rounded-full" />}
                    </div>
                }
              </div>
              <span className="text-xs font-semibold text-zinc-500 w-4 shrink-0 pt-0.5">{opt.key}.</span>
              <div className="flex-1 min-w-0">
                <RichTextRenderer content={opt.text} />
              </div>
            </div>
          )
        })}
      </div>

      {correct_answer.length > 0 && <CorrectAnswerBar keys={correct_answer} />}

      {explanation && (
        <div className="border border-zinc-200 rounded-md p-3 bg-zinc-50">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Explanation</p>
          <RichTextRenderer content={explanation} />
        </div>
      )}
    </div>
  )
}

// ─── NUMERIC Renderer ─────────────────────────────────────────────────────────

function NumericPreview({
  question_text, acceptable_answers, numeric_answer_type, numeric_min, numeric_max, explanation,
}: {
  question_text: JSONContent
  acceptable_answers: string[] | null
  numeric_answer_type: NumericAnswerType | null
  numeric_min: number | null
  numeric_max: number | null
  explanation: JSONContent | null
}) {
  const isRange = numeric_answer_type === 'RANGE'
  return (
    <div className="space-y-4">
      <RichTextRenderer content={question_text} />

      <div className="border border-green-200 rounded-md p-3 bg-green-50 space-y-1.5">
        <p className="text-xs font-semibold text-zinc-600">Answer Details</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Answer Type:</span>
          <span className="text-xs font-medium text-zinc-900">{isRange ? 'Range' : 'Exact'}</span>
        </div>
        {isRange ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Minimum:</span>
              <span className="text-xs font-medium text-green-800">{numeric_min ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Maximum:</span>
              <span className="text-xs font-medium text-green-800">{numeric_max ?? '—'}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Correct Answer:</span>
            <span className="text-xs font-medium text-green-800">
              {acceptable_answers?.[0] ?? '—'}
            </span>
          </div>
        )}
      </div>

      {explanation && (
        <div className="border border-zinc-200 rounded-md p-3 bg-zinc-50">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Explanation</p>
          <RichTextRenderer content={explanation} />
        </div>
      )}
    </div>
  )
}

// ─── Passage Sub-question panel ───────────────────────────────────────────────

function PassageSubQuestionPanel({
  sub, subIndex, subTotal, onPrev, onNext, isMulti,
  showNav,
}: {
  sub: SubQuestion
  subIndex: number
  subTotal: number
  onPrev: () => void
  onNext: () => void
  isMulti: boolean
  showNav: boolean
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {showNav && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <button onClick={onPrev} disabled={subIndex === 0}
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-zinc-600">
            Question {subIndex + 1} of {subTotal}
          </span>
          <button onClick={onNext} disabled={subIndex === subTotal - 1}
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{sub.marks}m</span>
          {sub.negative_marks > 0 && <span>/ -{sub.negative_marks}m</span>}
        </div>
        <RichTextRenderer content={sub.question_text} />

        <div className="space-y-2">
          {sub.options.map((opt) => {
            const isCorrect = sub.correct_answer.includes(opt.key)
            return (
              <div key={opt.key}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-md border ${
                  isCorrect ? 'border-green-300 bg-green-50' : 'border-zinc-200 bg-white'
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  {isMulti
                    ? <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isCorrect ? 'border-green-600 bg-green-600' : 'border-zinc-300'}`}>
                        {isCorrect && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                    : <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isCorrect ? 'border-green-600' : 'border-zinc-300'}`}>
                        {isCorrect && <div className="w-2 h-2 bg-green-600 rounded-full" />}
                      </div>
                  }
                </div>
                <span className="text-xs font-semibold text-zinc-500 w-4 shrink-0 pt-0.5">{opt.key}.</span>
                <div className="flex-1 min-w-0"><RichTextRenderer content={opt.text} /></div>
              </div>
            )
          })}
        </div>

        {sub.correct_answer.length > 0 && <CorrectAnswerBar keys={sub.correct_answer} />}

        {sub.explanation && (
          <div className="border border-zinc-200 rounded-md p-3 bg-zinc-50">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Explanation</p>
            <RichTextRenderer content={sub.explanation} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({
  open, questionId, onCancel, onDeleted,
}: {
  open: boolean
  questionId: string
  onCancel: () => void
  onDeleted: () => void
}) {
  const [count, setCount] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) return
    supabase
      .from('assessment_question_map')
      .select('id', { count: 'exact', head: true })
      .eq('question_id', questionId)
      .then(({ count: c }) => setCount(c ?? 0))
  }, [open, questionId])

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('questions').delete().eq('id', questionId)
    setDeleting(false)
    onDeleted()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Delete Question</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {count === null
                ? 'Checking assessment usage…'
                : count > 0
                  ? `This question is currently used in ${count} assessment${count > 1 ? 's' : ''}. Deleting it is permanent and cannot be undone.`
                  : 'This action is permanent and cannot be undone.'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting || count === null}
            className="px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-50 transition-colors">
            {deleting ? 'Deleting…' : 'Delete Question'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Preview Modal ───────────────────────────────────────────────────────

interface QuestionPreviewModalProps {
  open: boolean
  onClose: () => void
  questionId: string | null
  onDeleted?: () => void
}

export default function QuestionPreviewModal({
  open, onClose, questionId, onDeleted,
}: QuestionPreviewModalProps) {
  const router = useRouter()
  const [question, setQuestion] = useState<FullQuestion | null>(null)
  const [subIndex, setSubIndex] = useState(0)
  const [showDelete, setShowDelete] = useState(false)

  const fetchQuestion = useCallback(() => {
    if (!questionId) return

    supabase
      .from('questions')
      .select(`
        id, question_type, difficulty,
        question_text, passage_text,
        options, correct_answer, acceptable_answers, explanation,
        marks, negative_marks, concept_tag, video_url,
        numeric_answer_type, numeric_min, numeric_max,
        created_at, updated_at,
        chapters(name, sources(name)),
        creator:admin_users!questions_created_by_fkey(name),
        editor:admin_users!questions_last_modified_by_fkey(name),
        passage_sub_questions(
          id, question_text, options, correct_answer, explanation,
          marks, negative_marks, order_index
        )
      `)
      .eq('id', questionId)
      .single()
      .then(({ data, error }) => {
    if (!error && data) {
      const d = data as Record<string, unknown>
      const ch = d.chapters as Record<string, unknown> | null
      const src = ch?.sources as Record<string, unknown> | null
      const creator = d.creator as { name?: string } | null
      const editor = d.editor as { name?: string } | null

      const rawOpts = Array.isArray(d.options) ? d.options as { key: string; text: unknown }[] : []
      const options: OptionEntry[] = rawOpts.map((o) => ({ key: o.key, text: ensureDoc(o.text) }))

      const rawSubs = Array.isArray(d.passage_sub_questions)
        ? (d.passage_sub_questions as Record<string, unknown>[])
            .sort((a, b) => (a.order_index as number) - (b.order_index as number))
        : []

      const sub_questions: SubQuestion[] = rawSubs.map((sq) => {
        const sqOpts = Array.isArray(sq.options) ? sq.options as { key: string; text: unknown }[] : []
        return {
          id: sq.id as string,
          question_text: ensureDoc(sq.question_text),
          options: sqOpts.map((o) => ({ key: o.key, text: ensureDoc(o.text) })),
          correct_answer: Array.isArray(sq.correct_answer) ? sq.correct_answer as string[] : [],
          explanation: sq.explanation ? ensureDoc(sq.explanation) : null,
          marks: (sq.marks as number) ?? 1,
          negative_marks: (sq.negative_marks as number) ?? 0,
          order_index: sq.order_index as number,
        }
      })

      setQuestion({
        id: d.id as string,
        question_type: d.question_type as QuestionType,
        difficulty: d.difficulty as Difficulty,
        question_text: ensureDoc(d.question_text),
        passage_text: d.passage_text ? ensureDoc(d.passage_text) : null,
        options: rawOpts.length > 0 ? options : null,
        correct_answer: Array.isArray(d.correct_answer) ? d.correct_answer as string[] : null,
        acceptable_answers: Array.isArray(d.acceptable_answers) ? d.acceptable_answers as string[] : null,
        explanation: d.explanation ? ensureDoc(d.explanation) : null,
        marks: (d.marks as number) ?? 1,
        negative_marks: (d.negative_marks as number) ?? 0,
        concept_tag: (d.concept_tag as string | null) ?? null,
        video_url: (d.video_url as string | null) ?? null,
        numeric_answer_type: (d.numeric_answer_type as NumericAnswerType | null) ?? 'EXACT',
        numeric_min: (d.numeric_min as number | null) ?? null,
        numeric_max: (d.numeric_max as number | null) ?? null,
        source_name: (src?.name as string | null) ?? null,
        chapter_name: (ch?.name as string | null) ?? null,
        creator_name: creator?.name ?? null,
        created_at: d.created_at as string,
        editor_name: editor?.name ?? null,
        updated_at: d.updated_at as string,
        sub_questions,
      })
      setSubIndex(0)
    }
  })
  }, [questionId])

  useEffect(() => {
    if (open && questionId) fetchQuestion()
  }, [open, questionId, fetchQuestion])

  if (!open) return null

  const loading = !question
  const isPassage = question?.question_type === 'PASSAGE_SINGLE' || question?.question_type === 'PASSAGE_MULTI'
  const isMulti = question?.question_type === 'MCQ_MULTI' || question?.question_type === 'PASSAGE_MULTI'
  const showSubNav = question?.question_type === 'PASSAGE_MULTI'

  const modalWidth = isPassage ? 'max-w-5xl' : 'max-w-2xl'

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div className={`bg-white rounded-xl shadow-xl w-full ${modalWidth} flex flex-col`}
          style={{ maxHeight: '92vh' }}>

          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-200 shrink-0">
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-zinc-900">Question Details</h2>
              {question && (
                <div className="flex items-center gap-2 flex-wrap">
                  <TypeBadge t={question.question_type} />
                  <DifficultyBadge d={question.difficulty} />
                  {question.source_name && (
                    <span className="text-xs text-zinc-500">
                      Source: {question.source_name}
                    </span>
                  )}
                  {question.chapter_name && (
                    <span className="text-xs text-zinc-500">
                      · Chapter: {question.chapter_name}
                    </span>
                  )}
                  {question.concept_tag && (
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                      {question.concept_tag}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors ml-3 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden min-h-0">
            {loading || !question ? (
              <div className="flex items-center justify-center h-48 text-sm text-zinc-400">
                {loading ? 'Loading question…' : 'No question selected.'}
              </div>
            ) : isPassage ? (
              /* ── Passage: split layout ── */
              <div className="flex h-full divide-x divide-zinc-200">
                {/* Left — fixed passage */}
                <div className="w-1/2 overflow-y-auto p-5">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Passage</p>
                  {question.passage_text
                    ? <RichTextRenderer content={question.passage_text} />
                    : <p className="text-xs text-zinc-400 italic">No passage text.</p>
                  }
                </div>
                {/* Right — sub-question navigation */}
                <div className="w-1/2 flex flex-col min-h-0">
                  {question.sub_questions.length > 0 ? (
                    <PassageSubQuestionPanel
                      sub={question.sub_questions[subIndex]}
                      subIndex={subIndex}
                      subTotal={question.sub_questions.length}
                      onPrev={() => setSubIndex((i) => Math.max(0, i - 1))}
                      onNext={() => setSubIndex((i) => Math.min(question.sub_questions.length - 1, i + 1))}
                      isMulti={!!isMulti}
                      showNav={!!showSubNav}
                    />
                  ) : (
                    <div className="p-5 text-xs text-zinc-400 italic">No sub-questions.</div>
                  )}
                </div>
              </div>
            ) : question.question_type === 'NUMERIC' ? (
              <div className="overflow-y-auto p-5">
                <NumericPreview
                  question_text={question.question_text}
                  acceptable_answers={question.acceptable_answers}
                  numeric_answer_type={question.numeric_answer_type}
                  numeric_min={question.numeric_min}
                  numeric_max={question.numeric_max}
                  explanation={question.explanation}
                />
              </div>
            ) : (
              <div className="overflow-y-auto p-5">
                <MCQPreview
                  question_text={question.question_text}
                  options={question.options ?? []}
                  correct_answer={question.correct_answer ?? []}
                  explanation={question.explanation}
                  isMulti={!!isMulti}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          {question && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 bg-zinc-50 shrink-0">
              <div className="text-xs text-zinc-400">
                {question.creator_name && (
                  <span>Created by {question.creator_name} · {formatDateTime(question.created_at)}</span>
                )}
                {question.editor_name && (
                  <span className="ml-3">Edited by {question.editor_name} · {formatDateTime(question.updated_at)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
                <button onClick={() => router.push(`/super-admin/question-bank/${question.id}/edit`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />Edit Question
                </button>
                <button onClick={onClose}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-white transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        open={showDelete}
        questionId={question?.id ?? ''}
        onCancel={() => setShowDelete(false)}
        onDeleted={() => {
          setShowDelete(false)
          onClose()
          onDeleted?.()
        }}
      />
    </>
  )
}
