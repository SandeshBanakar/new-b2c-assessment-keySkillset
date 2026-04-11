'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'PASSAGE_SINGLE' | 'PASSAGE_MULTI' | 'NUMERIC'
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

interface Source {
  id: string
  name: string
  exam_category: string
}

interface Chapter {
  id: string
  source_id: string
  name: string
  order_index: number
}

interface SubQuestionDraft {
  id?: string          // only when editing
  question_text: string
  options: string[]    // always 4
  correct_answer: string[]
  explanation: string
  order_index: number
}

interface FormState {
  source_id: string
  chapter_id: string
  question_type: QuestionType
  difficulty: Difficulty
  question_text: string
  passage_text: string
  options: string[]        // 4 options for MCQ types
  correct_answer: string[] // e.g. ["A"] or ["A","C"]
  numeric_answer: string   // for NUMERIC type
  explanation: string
  concept_tag: string
  marks: string
  negative_marks: string
  sub_questions: SubQuestionDraft[]
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const DEMO_SA_ID = '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'

function emptySubQuestion(orderIndex: number): SubQuestionDraft {
  return {
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: [],
    explanation: '',
    order_index: orderIndex,
  }
}

function defaultForm(chapterId?: string, sourceId?: string): FormState {
  return {
    source_id: sourceId ?? '',
    chapter_id: chapterId ?? '',
    question_type: 'MCQ_SINGLE',
    difficulty: 'MEDIUM',
    question_text: '',
    passage_text: '',
    options: ['', '', '', ''],
    correct_answer: [],
    numeric_answer: '',
    explanation: '',
    concept_tag: '',
    marks: '4',
    negative_marks: '1',
    sub_questions: [],
  }
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

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

const textareaCls = `${inputCls} resize-none`

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">{children}</p>
  )
}

// ─── SubQuestion editor ───────────────────────────────────────────────────────

function SubQuestionEditor({
  sub,
  index,
  onChange,
  onRemove,
  type,
}: {
  sub: SubQuestionDraft
  index: number
  onChange: (updated: SubQuestionDraft) => void
  onRemove: () => void
  type: 'PASSAGE_SINGLE' | 'PASSAGE_MULTI'
}) {
  const isMulti = type === 'PASSAGE_MULTI'

  function toggleCorrect(label: string) {
    if (isMulti) {
      const next = sub.correct_answer.includes(label)
        ? sub.correct_answer.filter((l) => l !== label)
        : [...sub.correct_answer, label]
      onChange({ ...sub, correct_answer: next })
    } else {
      onChange({ ...sub, correct_answer: [label] })
    }
  }

  return (
    <div className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-zinc-50">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-600">Sub-question {index + 1}</p>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <FieldLabel label="Question Text" required />
        <textarea
          className={textareaCls}
          rows={2}
          value={sub.question_text}
          onChange={(e) => onChange({ ...sub, question_text: e.target.value })}
          placeholder="Sub-question text…"
        />
      </div>

      <div className="space-y-2">
        <FieldLabel label={isMulti ? 'Options (select all correct)' : 'Options (select correct)'} required />
        {OPTION_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {isMulti ? (
              <input
                type="checkbox"
                checked={sub.correct_answer.includes(label)}
                onChange={() => toggleCorrect(label)}
                className="accent-blue-700"
              />
            ) : (
              <input
                type="radio"
                name={`sub-correct-${index}`}
                checked={sub.correct_answer[0] === label}
                onChange={() => toggleCorrect(label)}
                className="accent-blue-700"
              />
            )}
            <span className="text-xs font-medium text-zinc-500 w-4">{label}.</span>
            <input
              className={inputCls}
              placeholder={`Option ${label}`}
              value={sub.options[i]}
              onChange={(e) => {
                const opts = [...sub.options]
                opts[i] = e.target.value
                onChange({ ...sub, options: opts })
              }}
            />
          </div>
        ))}
      </div>

      <div>
        <FieldLabel label="Explanation" />
        <textarea
          className={textareaCls}
          rows={2}
          value={sub.explanation}
          onChange={(e) => onChange({ ...sub, explanation: e.target.value })}
          placeholder="Explanation for this sub-question…"
        />
      </div>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────

interface QuestionFormProps {
  mode: 'create' | 'edit'
  questionId?: string
  defaultChapterId?: string
  defaultSourceId?: string
}

export default function QuestionForm({
  mode,
  questionId,
  defaultChapterId,
  defaultSourceId,
}: QuestionFormProps) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>(defaultForm(defaultChapterId, defaultSourceId))
  const [sources, setSources] = useState<Source[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(mode === 'edit')

  // Load sources
  useEffect(() => {
    supabase
      .from('sources')
      .select('id, name, exam_category')
      .order('name')
      .then(({ data }) => {
        if (data) setSources(data as Source[])
      })
  }, [supabase])

  // Load chapters when source changes
  useEffect(() => {
    if (!form.source_id) {
      setChapters([])
      return
    }
    supabase
      .from('chapters')
      .select('id, source_id, name, order_index')
      .eq('source_id', form.source_id)
      .order('order_index')
      .then(({ data }) => {
        if (data) setChapters(data as Chapter[])
      })
  }, [supabase, form.source_id])

  // Load existing question for edit
  const loadQuestion = useCallback(async () => {
    if (mode !== 'edit' || !questionId) return
    setLoadingEdit(true)
    const { data, error: err } = await supabase
      .from('questions')
      .select(`
        id,
        chapter_id,
        source_id,
        question_type,
        difficulty,
        question_text,
        passage_text,
        options,
        correct_answer,
        explanation,
        concept_tag,
        marks,
        negative_marks,
        passage_sub_questions(id, question_text, options, correct_answer, explanation, order_index)
      `)
      .eq('id', questionId)
      .single()

    if (err || !data) { setLoadingEdit(false); return }

    const d = data as Record<string, unknown>
    const subQs: SubQuestionDraft[] = Array.isArray(d.passage_sub_questions)
      ? (d.passage_sub_questions as Record<string, unknown>[]).map((sq) => ({
          id: sq.id as string,
          question_text: sq.question_text as string,
          options: Array.isArray(sq.options) ? sq.options as string[] : ['', '', '', ''],
          correct_answer: Array.isArray(sq.correct_answer) ? sq.correct_answer as string[] : [],
          explanation: (sq.explanation as string | null) ?? '',
          order_index: sq.order_index as number,
        }))
      : []

    const qType = d.question_type as QuestionType
    const correctAnswer = Array.isArray(d.correct_answer) ? d.correct_answer as string[] : []

    setForm({
      source_id: d.source_id as string,
      chapter_id: d.chapter_id as string,
      question_type: qType,
      difficulty: d.difficulty as Difficulty,
      question_text: (d.question_text as string) ?? '',
      passage_text: (d.passage_text as string | null) ?? '',
      options: Array.isArray(d.options) ? d.options as string[] : ['', '', '', ''],
      correct_answer: qType === 'NUMERIC' ? [] : correctAnswer,
      numeric_answer: qType === 'NUMERIC' ? (correctAnswer[0] ?? '') : '',
      explanation: (d.explanation as string | null) ?? '',
      concept_tag: (d.concept_tag as string | null) ?? '',
      marks: String(d.marks ?? 4),
      negative_marks: String(d.negative_marks ?? 1),
      sub_questions: subQs,
    })
    setLoadingEdit(false)
  }, [supabase, mode, questionId])

  useEffect(() => { loadQuestion() }, [loadQuestion])

  // ─── Derived state ────────────────────────────────────────────────────────

  const isPassage = form.question_type === 'PASSAGE_SINGLE' || form.question_type === 'PASSAGE_MULTI'
  const isMcq = form.question_type === 'MCQ_SINGLE' || form.question_type === 'MCQ_MULTI'
  const isMultiCorrect = form.question_type === 'MCQ_MULTI'
  const isNumeric = form.question_type === 'NUMERIC'

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleTypeChange(newType: QuestionType) {
    setForm((f) => ({
      ...f,
      question_type: newType,
      correct_answer: [],
      numeric_answer: '',
      sub_questions:
        newType === 'PASSAGE_SINGLE' || newType === 'PASSAGE_MULTI'
          ? f.sub_questions.length > 0 ? f.sub_questions : [emptySubQuestion(1)]
          : [],
    }))
  }

  function toggleCorrect(label: string) {
    if (isMultiCorrect) {
      const next = form.correct_answer.includes(label)
        ? form.correct_answer.filter((l) => l !== label)
        : [...form.correct_answer, label]
      setField('correct_answer', next)
    } else {
      setField('correct_answer', [label])
    }
  }

  function addSubQuestion() {
    const next = emptySubQuestion(form.sub_questions.length + 1)
    setField('sub_questions', [...form.sub_questions, next])
  }

  function updateSubQuestion(index: number, updated: SubQuestionDraft) {
    const subs = [...form.sub_questions]
    subs[index] = updated
    setField('sub_questions', subs)
  }

  function removeSubQuestion(index: number) {
    setField(
      'sub_questions',
      form.sub_questions.filter((_, i) => i !== index).map((s, i) => ({ ...s, order_index: i + 1 })),
    )
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!form.source_id) return 'Select a source.'
    if (!form.chapter_id) return 'Select a chapter.'
    if (!form.question_text.trim()) return 'Question text is required.'
    if (isPassage && !form.passage_text.trim()) return 'Passage text is required for passage questions.'
    if (isMcq) {
      if (form.options.some((o) => !o.trim())) return 'All 4 options must be filled.'
      if (form.correct_answer.length === 0) return 'Select the correct answer(s).'
    }
    if (isNumeric && !form.numeric_answer.trim()) return 'Numeric answer is required.'
    if (isPassage && form.sub_questions.length === 0) return 'Add at least one sub-question for passage types.'
    if (isPassage) {
      for (let i = 0; i < form.sub_questions.length; i++) {
        const sq = form.sub_questions[i]
        if (!sq.question_text.trim()) return `Sub-question ${i + 1} is missing question text.`
        if (sq.options.some((o) => !o.trim())) return `Sub-question ${i + 1} needs all 4 options filled.`
        if (sq.correct_answer.length === 0) return `Sub-question ${i + 1} needs a correct answer.`
      }
    }
    const marksNum = parseFloat(form.marks)
    if (isNaN(marksNum) || marksNum <= 0) return 'Marks must be a positive number.'
    const negNum = parseFloat(form.negative_marks)
    if (isNaN(negNum) || negNum < 0) return 'Negative marks must be 0 or positive.'
    return null
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setSaving(true)
    setError(null)

    const correctAnswerJsonb = isNumeric
      ? [form.numeric_answer.trim()]
      : form.correct_answer

    const questionPayload = {
      source_id: form.source_id,
      chapter_id: form.chapter_id,
      question_type: form.question_type,
      difficulty: form.difficulty,
      question_text: form.question_text.trim(),
      passage_text: isPassage ? form.passage_text.trim() : null,
      options: isMcq ? form.options.map((o) => o.trim()) : null,
      correct_answer: correctAnswerJsonb,
      explanation: form.explanation.trim() || null,
      concept_tag: form.concept_tag.trim() || null,
      marks: parseFloat(form.marks),
      negative_marks: parseFloat(form.negative_marks),
      status: 'ACTIVE',
      last_modified_by: DEMO_SA_ID,
    }

    try {
      let qId = questionId

      if (mode === 'create') {
        const { data, error: err } = await supabase
          .from('questions')
          .insert({ ...questionPayload, created_by: DEMO_SA_ID })
          .select('id')
          .single()
        if (err) throw err
        qId = (data as { id: string }).id
      } else {
        const { error: err } = await supabase
          .from('questions')
          .update({ ...questionPayload, updated_at: new Date().toISOString() })
          .eq('id', questionId!)
        if (err) throw err
      }

      // Handle sub-questions for passage types
      if (isPassage && qId) {
        if (mode === 'edit') {
          // Delete removed sub-questions
          const existingIds = form.sub_questions.filter((s) => s.id).map((s) => s.id!)
          if (existingIds.length > 0) {
            await supabase
              .from('passage_sub_questions')
              .delete()
              .eq('question_id', qId)
              .not('id', 'in', `(${existingIds.join(',')})`)
          } else {
            await supabase.from('passage_sub_questions').delete().eq('question_id', qId)
          }
        }

        for (const sq of form.sub_questions) {
          const sqPayload = {
            question_id: qId,
            question_text: sq.question_text.trim(),
            options: sq.options.map((o) => o.trim()),
            correct_answer: sq.correct_answer,
            explanation: sq.explanation.trim() || null,
            order_index: sq.order_index,
          }

          if (sq.id) {
            await supabase
              .from('passage_sub_questions')
              .update(sqPayload)
              .eq('id', sq.id)
          } else {
            await supabase.from('passage_sub_questions').insert(sqPayload)
          }
        }
      }

      // Navigate back to chapter questions page
      if (form.source_id && form.chapter_id) {
        router.push(
          `/super-admin/sources-chapters/${form.source_id}/${form.chapter_id}`,
        )
      } else {
        router.push('/super-admin/question-bank')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question.')
      setSaving(false)
    }
  }

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loadingEdit) {
    return (
      <div className="px-6 py-6 text-sm text-zinc-400">Loading question…</div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const backHref =
    form.source_id && form.chapter_id
      ? `/super-admin/sources-chapters/${form.source_id}/${form.chapter_id}`
      : '/super-admin/question-bank'

  return (
    <div className="px-6 py-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push(backHref)}
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <h1 className="text-base font-semibold text-zinc-900 mb-6">
        {mode === 'create' ? 'Create Question' : 'Edit Question'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* ── Source & Chapter ── */}
        <div>
          <SectionLabel>Source &amp; Chapter</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel label="Source" required />
              <select
                className={inputCls}
                value={form.source_id}
                onChange={(e) => {
                  setForm((f) => ({ ...f, source_id: e.target.value, chapter_id: '' }))
                }}
              >
                <option value="">Select source…</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.exam_category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel label="Chapter" required />
              <select
                className={inputCls}
                value={form.chapter_id}
                disabled={!form.source_id}
                onChange={(e) => setField('chapter_id', e.target.value)}
              >
                <option value="">Select chapter…</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.order_index}. {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Question Type & Difficulty ── */}
        <div>
          <SectionLabel>Question Details</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel label="Question Type" required />
              <select
                className={inputCls}
                value={form.question_type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              >
                <option value="MCQ_SINGLE">MCQ — Single Correct</option>
                <option value="MCQ_MULTI">MCQ — Multiple Correct</option>
                <option value="PASSAGE_SINGLE">Passage — Single Correct (per sub-Q)</option>
                <option value="PASSAGE_MULTI">Passage — Multiple Correct (per sub-Q)</option>
                <option value="NUMERIC">Numeric</option>
              </select>
            </div>
            <div>
              <FieldLabel label="Difficulty" required />
              <select
                className={inputCls}
                value={form.difficulty}
                onChange={(e) => setField('difficulty', e.target.value as Difficulty)}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Marks ── */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Marks (+)" required />
            <input
              type="number"
              min={0}
              step={0.5}
              className={inputCls}
              value={form.marks}
              onChange={(e) => setField('marks', e.target.value)}
            />
          </div>
          <div>
            <FieldLabel label="Negative Marks" required />
            <input
              type="number"
              min={0}
              step={0.25}
              className={inputCls}
              value={form.negative_marks}
              onChange={(e) => setField('negative_marks', e.target.value)}
            />
          </div>
          <div>
            <FieldLabel label="Concept Tag" />
            <input
              className={inputCls}
              placeholder="e.g. Organic Chemistry"
              value={form.concept_tag}
              onChange={(e) => setField('concept_tag', e.target.value)}
            />
          </div>
        </div>

        {/* ── Passage text (only for passage types) ── */}
        {isPassage && (
          <div>
            <SectionLabel>Passage</SectionLabel>
            <FieldLabel label="Passage Text" required />
            <textarea
              className={textareaCls}
              rows={6}
              placeholder="Enter the passage text…"
              value={form.passage_text}
              onChange={(e) => setField('passage_text', e.target.value)}
            />
          </div>
        )}

        {/* ── Question text ── */}
        <div>
          <SectionLabel>{isPassage ? 'Sub-Questions' : 'Question'}</SectionLabel>
          {!isPassage && (
            <div className="mb-4">
              <FieldLabel label="Question Text" required />
              <textarea
                className={textareaCls}
                rows={4}
                placeholder="Enter the question text…"
                value={form.question_text}
                onChange={(e) => setField('question_text', e.target.value)}
              />
            </div>
          )}

          {/* ── MCQ Options ── */}
          {isMcq && (
            <div className="space-y-2 mb-4">
              <FieldLabel
                label={
                  isMultiCorrect
                    ? 'Options (check all correct answers)'
                    : 'Options (select correct answer)'
                }
                required
              />
              {OPTION_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  {isMultiCorrect ? (
                    <input
                      type="checkbox"
                      checked={form.correct_answer.includes(label)}
                      onChange={() => toggleCorrect(label)}
                      className="accent-blue-700 shrink-0"
                    />
                  ) : (
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={form.correct_answer[0] === label}
                      onChange={() => toggleCorrect(label)}
                      className="accent-blue-700 shrink-0"
                    />
                  )}
                  <span className="text-xs font-medium text-zinc-500 w-4 shrink-0">{label}.</span>
                  <input
                    className={inputCls}
                    placeholder={`Option ${label}`}
                    value={form.options[i]}
                    onChange={(e) => {
                      const opts = [...form.options]
                      opts[i] = e.target.value
                      setField('options', opts)
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Numeric answer ── */}
          {isNumeric && (
            <div className="mb-4">
              <FieldLabel label="Correct Numeric Answer" required />
              <input
                className={inputCls}
                placeholder="e.g. 42 or 3.14"
                value={form.numeric_answer}
                onChange={(e) => setField('numeric_answer', e.target.value)}
              />
            </div>
          )}

          {/* ── Passage sub-questions ── */}
          {isPassage && (
            <div className="space-y-4">
              {form.sub_questions.map((sq, i) => (
                <SubQuestionEditor
                  key={i}
                  sub={sq}
                  index={i}
                  onChange={(updated) => updateSubQuestion(i, updated)}
                  onRemove={() => removeSubQuestion(i)}
                  type={form.question_type as 'PASSAGE_SINGLE' | 'PASSAGE_MULTI'}
                />
              ))}
              <button
                type="button"
                onClick={addSubQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Sub-question
              </button>
            </div>
          )}
        </div>

        {/* ── Explanation (for non-passage types, one global explanation) ── */}
        {!isPassage && (
          <div>
            <FieldLabel label="Explanation" />
            <textarea
              className={textareaCls}
              rows={3}
              placeholder="Explain the correct answer…"
              value={form.explanation}
              onChange={(e) => setField('explanation', e.target.value)}
            />
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pt-2 border-t border-zinc-200">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {saving
              ? 'Saving…'
              : mode === 'create'
                ? 'Create Question'
                : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
