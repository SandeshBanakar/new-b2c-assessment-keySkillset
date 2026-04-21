'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, ExternalLink, AlertTriangle, Info, GripVertical } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import RichTextEditor, {
  type JSONContent,
  emptyDoc,
  isDocEmpty,
  ensureDoc,
} from '@/components/ui/RichTextEditor'
import RichTextRenderer from '@/components/ui/RichTextRenderer'

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'PASSAGE_SINGLE' | 'PASSAGE_MULTI' | 'NUMERIC'
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed'
type NumericAnswerType = 'EXACT' | 'RANGE'

interface OptionEntry { key: string; text: JSONContent }
interface ExamCategory { id: string; name: string }
interface Source { id: string; name: string; exam_category_id: string | null }
interface Chapter { id: string; source_id: string; name: string; order_index: number }
interface ConceptTagOption { id: string; exam_category: string; subject: string; concept_name: string }

interface SubQuestionDraft {
  id?: string
  question_text: JSONContent
  options: OptionEntry[]
  correct_answer: string[]
  explanation: JSONContent
  marks: string
  negative_marks: string
  order_index: number
}

interface FormState {
  source_id: string
  chapter_id: string
  question_type: QuestionType
  difficulty: Difficulty
  question_text: JSONContent
  passage_text: JSONContent
  options: OptionEntry[]
  correct_answer: string[]
  numeric_answer: string
  numeric_answer_type: NumericAnswerType
  numeric_min: string
  numeric_max: string
  explanation: JSONContent
  concept_tag_id: string
  marks: string
  negative_marks: string
  video_url: string
  sub_questions: SubQuestionDraft[]
}

const ALL_OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F']
const MIN_OPTIONS = 4
const MAX_OPTIONS = 6
const DEMO_SA_ID = '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'

function emptyOptions(): OptionEntry[] {
  return ALL_OPTION_KEYS.slice(0, MIN_OPTIONS).map((key) => ({ key, text: emptyDoc() }))
}

// After reordering or removing, reassign keys A–F sequentially and update correct_answer
function reflowOptions(
  ordered: OptionEntry[],
  prevOpts: OptionEntry[],
  prevCorrect: string[]
): { options: OptionEntry[]; correct_answer: string[] } {
  const correctSet = new Set(prevOpts.filter((o) => prevCorrect.includes(o.key)))
  const newOpts = ordered.map((o, i) => ({ ...o, key: ALL_OPTION_KEYS[i] }))
  const newCorrect = newOpts.filter((_, i) => correctSet.has(ordered[i])).map((o) => o.key)
  return { options: newOpts, correct_answer: newCorrect }
}

function emptySubQuestion(orderIndex: number): SubQuestionDraft {
  return {
    question_text: emptyDoc(),
    options: emptyOptions(),
    correct_answer: [],
    explanation: emptyDoc(),
    marks: '1',
    negative_marks: '0',
    order_index: orderIndex,
  }
}

function defaultForm(): FormState {
  return {
    source_id: '',
    chapter_id: '',
    question_type: 'MCQ_SINGLE',
    difficulty: 'medium',
    question_text: emptyDoc(),
    passage_text: emptyDoc(),
    options: emptyOptions(),
    correct_answer: [],
    numeric_answer: '',
    numeric_answer_type: 'EXACT',
    numeric_min: '',
    numeric_max: '',
    explanation: emptyDoc(),
    concept_tag_id: '',
    marks: '4',
    negative_marks: '1',
    video_url: '',
    sub_questions: [],
  }
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function FieldLabel({ label, required, children }: {
  label: string; required?: boolean; children?: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 mb-1">
      {label}{required && <span className="text-rose-500">*</span>}
      {children}
    </label>
  )
}

const inputCls = 'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  )
}

// ─── Marks validation helpers ─────────────────────────────────────────────────

function marksError(val: string): string | null {
  const n = parseFloat(val)
  if (isNaN(n) || n <= 0) return 'Must be > 0'
  if (n > 10) return 'Cannot exceed 10'
  return null
}

function negMarksError(neg: string, marks: string): string | null {
  const n = parseFloat(neg)
  const m = parseFloat(marks)
  if (isNaN(n) || n < 0) return 'Must be ≥ 0'
  if (!isNaN(m) && n > m) return 'Cannot exceed marks'
  return null
}

// ─── Sortable Option Row ──────────────────────────────────────────────────────

function SortableOptionItem({ opt, isMultiCorrect, isCorrect, canRemove, onToggle, onChange, onRemove, radioName }: {
  opt: OptionEntry
  isMultiCorrect: boolean
  isCorrect: boolean
  canRemove: boolean
  onToggle: () => void
  onChange: (doc: JSONContent) => void
  onRemove: () => void
  radioName: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: opt.key })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button type="button" {...attributes} {...listeners}
        className="pt-2.5 shrink-0 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 touch-none">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="pt-2.5 shrink-0">
        {isMultiCorrect
          ? <input type="checkbox" checked={isCorrect} onChange={onToggle} className="accent-blue-700" />
          : <input type="radio" name={radioName} checked={isCorrect} onChange={onToggle} className="accent-blue-700" />
        }
      </div>
      <span className="text-xs font-medium text-zinc-500 w-4 shrink-0 pt-2.5">{opt.key}.</span>
      <div className="flex-1 min-w-0">
        <RichTextEditor value={opt.text} onChange={onChange} minHeight="44px" />
      </div>
      <button type="button" onClick={onRemove} disabled={!canRemove}
        title={!canRemove ? (isCorrect ? 'Change correct answer before removing' : `Minimum ${MIN_OPTIONS} options`) : 'Remove option'}
        className="pt-2.5 shrink-0 text-zinc-300 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Sub-question Editor ──────────────────────────────────────────────────────

function SubQuestionEditor({ sub, index, onChange, onRemove, isMulti, showMarks }: {
  sub: SubQuestionDraft
  index: number
  onChange: (updated: SubQuestionDraft) => void
  onRemove: () => void
  isMulti: boolean
  showMarks: boolean
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function toggleCorrect(key: string) {
    if (isMulti) {
      const next = sub.correct_answer.includes(key)
        ? sub.correct_answer.filter((k) => k !== key)
        : [...sub.correct_answer, key]
      onChange({ ...sub, correct_answer: next })
    } else {
      onChange({ ...sub, correct_answer: [key] })
    }
  }

  function handleOptDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = sub.options.findIndex((o) => o.key === active.id)
    const newIdx = sub.options.findIndex((o) => o.key === over.id)
    const reordered = arrayMove(sub.options, oldIdx, newIdx)
    const { options, correct_answer } = reflowOptions(reordered, sub.options, sub.correct_answer)
    onChange({ ...sub, options, correct_answer })
  }

  function addSubOpt() {
    const newKey = ALL_OPTION_KEYS[sub.options.length]
    onChange({ ...sub, options: [...sub.options, { key: newKey, text: emptyDoc() }] })
  }

  function removeSubOpt(key: string) {
    const filtered = sub.options.filter((o) => o.key !== key)
    const { options, correct_answer } = reflowOptions(filtered, sub.options, sub.correct_answer)
    onChange({ ...sub, options, correct_answer })
  }

  return (
    <div className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-zinc-50">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-600">Sub-question {index + 1}</p>
        <button type="button" onClick={onRemove}
          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <FieldLabel label="Question Text" required />
        <RichTextEditor value={sub.question_text}
          onChange={(doc) => onChange({ ...sub, question_text: doc })} minHeight="60px" />
      </div>

      {showMarks && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel label="Marks (+)" required />
            <input type="number" min={0.5} max={10} step={0.5} className={inputCls}
              value={sub.marks}
              onChange={(e) => onChange({ ...sub, marks: e.target.value })} />
            {marksError(sub.marks) && (
              <p className="text-xs text-rose-600 mt-0.5">{marksError(sub.marks)}</p>
            )}
          </div>
          <div>
            <FieldLabel label="Negative Marks" required />
            <input type="number" min={0} step={0.25} className={inputCls}
              value={sub.negative_marks}
              onChange={(e) => onChange({ ...sub, negative_marks: e.target.value })} />
            {negMarksError(sub.negative_marks, sub.marks) && (
              <p className="text-xs text-rose-600 mt-0.5">{negMarksError(sub.negative_marks, sub.marks)}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FieldLabel label={isMulti ? 'Options (check all correct)' : 'Options (select correct)'} required />
          <span className="text-xs text-zinc-400">{sub.options.length}/{MAX_OPTIONS}</span>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOptDragEnd}>
          <SortableContext items={sub.options.map((o) => o.key)} strategy={verticalListSortingStrategy}>
            {sub.options.map((opt) => {
              const isCorrect = sub.correct_answer.includes(opt.key)
              const canRemove = sub.options.length > MIN_OPTIONS && !isCorrect
              return (
                <SortableOptionItem
                  key={opt.key}
                  opt={opt}
                  isMultiCorrect={isMulti}
                  isCorrect={isCorrect}
                  canRemove={canRemove}
                  radioName={`sub-correct-${index}`}
                  onToggle={() => toggleCorrect(opt.key)}
                  onChange={(doc) => {
                    const opts = [...sub.options]
                    opts[sub.options.indexOf(opt)] = { ...opt, text: doc }
                    onChange({ ...sub, options: opts })
                  }}
                  onRemove={() => removeSubOpt(opt.key)}
                />
              )
            })}
          </SortableContext>
        </DndContext>
        {sub.options.length < MAX_OPTIONS && (
          <button type="button" onClick={addSubOpt}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 mt-1 transition-colors">
            <Plus className="w-3 h-3" />Add option
          </button>
        )}
      </div>

      <div>
        <FieldLabel label="Explanation" />
        <RichTextEditor value={sub.explanation}
          onChange={(doc) => onChange({ ...sub, explanation: doc })} minHeight="56px" />
      </div>
    </div>
  )
}

// ─── Inline Preview ───────────────────────────────────────────────────────────

function OptionPreviewRow({ opt, isCorrect, isMulti }: {
  opt: OptionEntry; isCorrect: boolean; isMulti: boolean
}) {
  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 rounded-md border ${
      isCorrect ? 'border-green-300 bg-green-50' : 'border-zinc-200 bg-white'
    }`}>
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
}

function FormPreview({ form }: { form: FormState }) {
  const [subIdx, setSubIdx] = useState(0)
  const isPassage = form.question_type === 'PASSAGE_SINGLE' || form.question_type === 'PASSAGE_MULTI'
  const isMulti = form.question_type === 'MCQ_MULTI' || form.question_type === 'PASSAGE_MULTI'
  const isMultiPassage = form.question_type === 'PASSAGE_MULTI'
  const isNumeric = form.question_type === 'NUMERIC'

  useEffect(() => { setSubIdx(0) }, [form.question_type])

  const diffCls: Record<Difficulty, string> = {
    easy: 'bg-green-50 text-green-700', medium: 'bg-amber-50 text-amber-700',
    hard: 'bg-rose-50 text-rose-700', mixed: 'bg-zinc-100 text-zinc-600',
  }

  return (
    <div className="space-y-4 py-2">
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-white uppercase tracking-wide">
          {form.question_type.replace('_', ' ')}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${diffCls[form.difficulty]}`}>
          {form.difficulty}
        </span>
        <span className="text-xs text-zinc-500">{form.marks}m / -{form.negative_marks}m</span>
      </div>

      {isPassage ? (
        <div className="grid grid-cols-2 gap-4 border border-zinc-200 rounded-lg overflow-hidden">
          {/* Left: passage */}
          <div className="p-4 bg-zinc-50 border-r border-zinc-200">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Passage</p>
            {isDocEmpty(form.passage_text)
              ? <p className="text-xs text-zinc-400 italic">No passage text yet…</p>
              : <RichTextRenderer content={form.passage_text} />
            }
          </div>
          {/* Right: sub-question */}
          <div className="p-4">
            {isMultiPassage && form.sub_questions.length > 1 && (
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setSubIdx((i) => Math.max(0, i - 1))}
                  disabled={subIdx === 0} className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-30">← Prev</button>
                <span className="text-xs text-zinc-500">Question {subIdx + 1} of {form.sub_questions.length}</span>
                <button onClick={() => setSubIdx((i) => Math.min(form.sub_questions.length - 1, i + 1))}
                  disabled={subIdx === form.sub_questions.length - 1} className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-30">Next →</button>
              </div>
            )}
            {form.sub_questions.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No sub-questions yet…</p>
            ) : (() => {
              const sq = form.sub_questions[subIdx]
              if (!sq) return null
              return (
                <div className="space-y-3">
                  {isDocEmpty(sq.question_text)
                    ? <p className="text-xs text-zinc-400 italic">No question text yet…</p>
                    : <RichTextRenderer content={sq.question_text} />
                  }
                  <div className="space-y-1.5">
                    {sq.options.map((opt) => (
                      <OptionPreviewRow key={opt.key} opt={opt}
                        isCorrect={sq.correct_answer.includes(opt.key)} isMulti={isMultiPassage} />
                    ))}
                  </div>
                  {sq.correct_answer.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border-l-4 border-green-500 rounded-r-md">
                      <span className="text-xs font-medium text-green-800">Correct:</span>
                      {sq.correct_answer.map((k) => (
                        <span key={k} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-semibold">{k}</span>
                      ))}
                    </div>
                  )}
                  {!isDocEmpty(sq.explanation) && (
                    <div className="border border-zinc-200 rounded-md p-3 bg-zinc-50">
                      <p className="text-xs font-semibold text-zinc-500 mb-1">Explanation</p>
                      <RichTextRenderer content={sq.explanation} />
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      ) : isNumeric ? (
        <div className="space-y-3">
          {isDocEmpty(form.question_text)
            ? <p className="text-xs text-zinc-400 italic">No question text yet…</p>
            : <RichTextRenderer content={form.question_text} />
          }
          <div className="border border-green-200 rounded-md p-3 bg-green-50 space-y-1.5">
            <p className="text-xs font-semibold text-zinc-600">Answer Details</p>
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-500">Answer Type:</span>
              <span className="font-medium text-zinc-900">{form.numeric_answer_type === 'RANGE' ? 'Range' : 'Exact'}</span>
            </div>
            {form.numeric_answer_type === 'RANGE' ? (
              <>
                <div className="flex gap-2 text-xs">
                  <span className="text-zinc-500">Minimum:</span>
                  <span className="font-medium text-green-800">{form.numeric_min || '—'}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-zinc-500">Maximum:</span>
                  <span className="font-medium text-green-800">{form.numeric_max || '—'}</span>
                </div>
              </>
            ) : (
              <div className="flex gap-2 text-xs">
                <span className="text-zinc-500">Correct Answer:</span>
                <span className="font-medium text-green-800">{form.numeric_answer || '—'}</span>
              </div>
            )}
          </div>
          {!isDocEmpty(form.explanation) && (
            <div className="border border-zinc-200 rounded-md p-3 bg-zinc-50">
              <p className="text-xs font-semibold text-zinc-500 mb-1">Explanation</p>
              <RichTextRenderer content={form.explanation} />
            </div>
          )}
        </div>
      ) : (
        /* MCQ */
        <div className="space-y-3">
          {isDocEmpty(form.question_text)
            ? <p className="text-xs text-zinc-400 italic">No question text yet…</p>
            : <RichTextRenderer content={form.question_text} />
          }
          <div className="space-y-1.5">
            {form.options.map((opt) => (
              <OptionPreviewRow key={opt.key} opt={opt}
                isCorrect={form.correct_answer.includes(opt.key)} isMulti={isMulti} />
            ))}
          </div>
          {form.correct_answer.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border-l-4 border-green-500 rounded-r-md">
              <span className="text-xs font-medium text-green-800">Correct Answer:</span>
              {form.correct_answer.map((k) => (
                <span key={k} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-semibold">{k}</span>
              ))}
            </div>
          )}
          {!isDocEmpty(form.explanation) && (
            <div className="border border-zinc-200 rounded-md p-3 bg-zinc-50">
              <p className="text-xs font-semibold text-zinc-500 mb-1">Explanation</p>
              <RichTextRenderer content={form.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Save Warning Modal ───────────────────────────────────────────────────────

function SaveWarningModal({ open, assessmentCount, onCancel, onConfirm, saving }: {
  open: boolean
  assessmentCount: number
  onCancel: () => void
  onConfirm: () => void
  saving: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Save Changes</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {assessmentCount > 0
                ? `This question is currently used in ${assessmentCount} assessment${assessmentCount > 1 ? 's' : ''}. All edits are saved immediately and will reflect in those assessments.`
                : 'Saving will update this question immediately.'
              }
              {' '}Do you want to continue?
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
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

export default function QuestionForm({ mode, questionId, defaultChapterId, defaultSourceId }: QuestionFormProps) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>(defaultForm())
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  const optionSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Lookup data
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [allSources, setAllSources] = useState<Source[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [conceptTags, setConceptTags] = useState<ConceptTagOption[]>([])

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(mode === 'edit')
  const [showSaveWarning, setShowSaveWarning] = useState(false)
  const [assessmentCount, setAssessmentCount] = useState(0)

  // ─── Load lookups ────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.from('exam_categories').select('id, name').order('name')
      .then(({ data }) => { if (data) setExamCategories(data as ExamCategory[]) })

    supabase.from('sources').select('id, name, exam_category_id').order('name')
      .then(({ data }) => { if (data) setAllSources(data as Source[]) })

    supabase.from('concept_tags').select('id, exam_category, subject, concept_name')
      .order('exam_category').order('subject').order('concept_name')
      .then(({ data }) => { if (data) setConceptTags(data as ConceptTagOption[]) })
  }, [])

  // Filter sources by selected categories
  const filteredSources = useMemo(
    () => selectedCategories.length === 0
      ? allSources
      : allSources.filter((s) => {
          const cat = examCategories.find((c) => c.id === s.exam_category_id)
          return cat ? selectedCategories.includes(cat.name) : false
        }),
    [allSources, examCategories, selectedCategories]
  )

  // Reset source if no longer visible — gate on allSources loaded to avoid wiping edit-mode values
  useEffect(() => {
    if (allSources.length === 0) return
    if (form.source_id && !filteredSources.find((s) => s.id === form.source_id)) {
      setForm((f) => ({ ...f, source_id: '', chapter_id: '' }))
    }
  }, [filteredSources, form.source_id, allSources.length])

  // Load chapters when source changes
  useEffect(() => {
    if (!form.source_id) { setChapters([]); return }
    supabase.from('chapters').select('id, source_id, name, order_index')
      .eq('source_id', form.source_id).order('order_index')
      .then(({ data }) => { if (data) setChapters(data as Chapter[]) })
  }, [form.source_id])

  // Load question for edit mode
  const loadQuestion = useCallback(async () => {
    if (mode !== 'edit' || !questionId) return
    setLoadingEdit(true)

    const { data, error: err } = await supabase
      .from('questions')
      .select(`
        id, chapter_id, source_id, question_type, difficulty,
        question_text, passage_text, options, correct_answer,
        acceptable_answers, explanation, concept_tag_id, marks, negative_marks,
        video_url, numeric_answer_type, numeric_min, numeric_max,
        passage_sub_questions(id, question_text, options, correct_answer, explanation, marks, negative_marks, order_index)
      `)
      .eq('id', questionId)
      .single()

    if (err || !data) { setLoadingEdit(false); return }

    const d = data as Record<string, unknown>
    const qType = d.question_type as QuestionType
    const rawOptions = Array.isArray(d.options) ? d.options as { key: string; text: unknown }[] : []
    const normOptions: OptionEntry[] = rawOptions.length >= MIN_OPTIONS
      ? rawOptions.map((o) => ({ key: o.key, text: ensureDoc(o.text) }))
      : ALL_OPTION_KEYS.slice(0, MIN_OPTIONS).map((key, i) => ({ key, text: ensureDoc(rawOptions[i]?.text) }))
    const correctAnswer = Array.isArray(d.correct_answer) ? d.correct_answer as string[] : []
    const acceptableAnswers = Array.isArray(d.acceptable_answers) ? d.acceptable_answers as string[] : []
    const numType = (d.numeric_answer_type as NumericAnswerType | null) ?? 'EXACT'

    const subQs: SubQuestionDraft[] = Array.isArray(d.passage_sub_questions)
      ? (d.passage_sub_questions as Record<string, unknown>[])
          .sort((a, b) => (a.order_index as number) - (b.order_index as number))
          .map((sq) => {
            const sqOpts = Array.isArray(sq.options) ? sq.options as { key: string; text: unknown }[] : []
            return {
              id: sq.id as string,
              question_text: ensureDoc(sq.question_text),
              options: sqOpts.length >= MIN_OPTIONS
              ? sqOpts.map((o) => ({ key: o.key, text: ensureDoc(o.text) }))
              : ALL_OPTION_KEYS.slice(0, MIN_OPTIONS).map((key, i) => ({ key, text: ensureDoc(sqOpts[i]?.text) })),
              correct_answer: Array.isArray(sq.correct_answer) ? sq.correct_answer as string[] : [],
              explanation: ensureDoc(sq.explanation),
              marks: String(sq.marks ?? 1),
              negative_marks: String(sq.negative_marks ?? 0),
              order_index: sq.order_index as number,
            }
          })
      : []

    setForm({
      source_id: (d.source_id as string) ?? '',
      chapter_id: (d.chapter_id as string) ?? '',
      question_type: qType,
      difficulty: (d.difficulty as Difficulty) ?? 'medium',
      question_text: ensureDoc(d.question_text),
      passage_text: ensureDoc(d.passage_text),
      options: normOptions,
      correct_answer: qType === 'NUMERIC' ? [] : correctAnswer,
      numeric_answer: qType === 'NUMERIC' && numType === 'EXACT' ? (acceptableAnswers[0] ?? correctAnswer[0] ?? '') : '',
      numeric_answer_type: numType,
      numeric_min: numType === 'RANGE' ? String(d.numeric_min ?? '') : '',
      numeric_max: numType === 'RANGE' ? String(d.numeric_max ?? '') : '',
      explanation: ensureDoc(d.explanation),
      concept_tag_id: (d.concept_tag_id as string | null) ?? '',
      marks: String(d.marks ?? 4),
      negative_marks: String(d.negative_marks ?? 1),
      video_url: (d.video_url as string | null) ?? '',
      sub_questions: subQs,
    })
    setLoadingEdit(false)
  }, [mode, questionId])

  useEffect(() => { loadQuestion() }, [loadQuestion])

  // ─── Set defaults from URL params ────────────────────────────────────────

  useEffect(() => {
    if (defaultSourceId) setForm((f) => ({ ...f, source_id: defaultSourceId }))
    if (defaultChapterId) setForm((f) => ({ ...f, chapter_id: defaultChapterId }))
  }, [defaultSourceId, defaultChapterId])

  // ─── Derived ─────────────────────────────────────────────────────────────

  const isPassage = form.question_type === 'PASSAGE_SINGLE' || form.question_type === 'PASSAGE_MULTI'
  const isPassageMulti = form.question_type === 'PASSAGE_MULTI'
  const isPassageSingle = form.question_type === 'PASSAGE_SINGLE'
  const isMcq = form.question_type === 'MCQ_SINGLE' || form.question_type === 'MCQ_MULTI'
  const isMultiCorrect = form.question_type === 'MCQ_MULTI'
  const isNumeric = form.question_type === 'NUMERIC'

  // PASSAGE_MULTI: parent marks = sum of sub-question marks
  const computedParentMarks = isPassageMulti
    ? form.sub_questions.reduce((sum, sq) => sum + (parseFloat(sq.marks) || 0), 0)
    : null

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleTypeChange(newType: QuestionType) {
    setForm((f) => ({
      ...f,
      question_type: newType,
      correct_answer: [],
      numeric_answer: '',
      numeric_answer_type: 'EXACT',
      numeric_min: '',
      numeric_max: '',
      options: emptyOptions(),
      sub_questions:
        newType === 'PASSAGE_SINGLE' || newType === 'PASSAGE_MULTI'
          ? f.sub_questions.length > 0 ? f.sub_questions : [emptySubQuestion(1)]
          : [],
    }))
  }

  function toggleCorrect(key: string) {
    if (isMultiCorrect) {
      const next = form.correct_answer.includes(key)
        ? form.correct_answer.filter((k) => k !== key)
        : [...form.correct_answer, key]
      setField('correct_answer', next)
    } else {
      setField('correct_answer', [key])
    }
  }

  function toggleCategory(name: string) {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )
  }

  function handleOptionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = form.options.findIndex((o) => o.key === active.id)
    const newIdx = form.options.findIndex((o) => o.key === over.id)
    const reordered = arrayMove(form.options, oldIdx, newIdx)
    const { options, correct_answer } = reflowOptions(reordered, form.options, form.correct_answer)
    setForm((f) => ({ ...f, options, correct_answer }))
  }

  function addOption() {
    if (form.options.length >= MAX_OPTIONS) return
    const newKey = ALL_OPTION_KEYS[form.options.length]
    setField('options', [...form.options, { key: newKey, text: emptyDoc() }])
  }

  function removeOption(key: string) {
    if (form.options.length <= MIN_OPTIONS) return
    const filtered = form.options.filter((o) => o.key !== key)
    const { options, correct_answer } = reflowOptions(filtered, form.options, form.correct_answer)
    setForm((f) => ({ ...f, options, correct_answer }))
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!form.source_id) return 'Select a source.'
    if (!form.chapter_id) return 'Select a chapter.'

    // Marks validation (non-PASSAGE_MULTI)
    if (!isPassageMulti) {
      if (marksError(form.marks)) return `Marks: ${marksError(form.marks)}`
      if (negMarksError(form.negative_marks, form.marks)) return `Negative marks: ${negMarksError(form.negative_marks, form.marks)}`
    }

    if (isMcq) {
      if (isDocEmpty(form.question_text)) return 'Question text is required.'
      if (form.options.some((o) => isDocEmpty(o.text))) return 'All options must be filled.'
      if (form.correct_answer.length === 0) return 'Select the correct answer(s).'
    }

    if (isNumeric) {
      if (isDocEmpty(form.question_text)) return 'Question text is required.'
      if (form.numeric_answer_type === 'EXACT') {
        if (!form.numeric_answer.trim()) return 'Numeric answer is required.'
      } else {
        if (!form.numeric_min.trim() || !form.numeric_max.trim()) return 'Min and max values are required for range.'
        const min = parseFloat(form.numeric_min)
        const max = parseFloat(form.numeric_max)
        if (isNaN(min) || isNaN(max)) return 'Min and max must be valid numbers.'
        if (min >= max) return 'Min must be less than max.'
      }
    }

    if (isPassage) {
      if (isDocEmpty(form.passage_text)) return 'Passage text is required.'
      if (form.sub_questions.length === 0) return 'Add at least one sub-question.'
      for (let i = 0; i < form.sub_questions.length; i++) {
        const sq = form.sub_questions[i]
        if (isDocEmpty(sq.question_text)) return `Sub-question ${i + 1} needs question text.`
        if (sq.options.some((o) => isDocEmpty(o.text))) return `Sub-question ${i + 1} needs all 4 options.`
        if (sq.correct_answer.length === 0) return `Sub-question ${i + 1} needs a correct answer selected.`
        if (isPassage) {
          if (marksError(sq.marks)) return `Sub-question ${i + 1} marks: ${marksError(sq.marks)}`
          if (negMarksError(sq.negative_marks, sq.marks)) return `Sub-question ${i + 1} negative marks: ${negMarksError(sq.negative_marks, sq.marks)}`
        }
      }
    }

    if (form.video_url.trim() && !form.video_url.trim().startsWith('http')) {
      return 'Video URL must be a valid URL starting with http.'
    }

    return null
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function checkAssessmentCount(): Promise<number> {
    if (!questionId) return 0
    const { count } = await supabase
      .from('assessment_question_map')
      .select('id', { count: 'exact', head: true })
      .eq('question_id', questionId)
    return count ?? 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    // Edit mode: always show warning before saving
    if (mode === 'edit') {
      const count = await checkAssessmentCount()
      setAssessmentCount(count)
      setShowSaveWarning(true)
      return
    }

    await doSave()
  }

  async function doSave() {
    setSaving(true); setError(null); setShowSaveWarning(false)

    const finalMarks = isPassageMulti ? computedParentMarks ?? 0 : parseFloat(form.marks)
    const finalNegMarks = isPassageMulti ? 0 : parseFloat(form.negative_marks)

    const questionPayload = {
      source_id: form.source_id,
      chapter_id: form.chapter_id,
      question_type: form.question_type,
      difficulty: form.difficulty,
      question_text: form.question_text,
      passage_text: isPassage ? form.passage_text : null,
      options: isMcq ? form.options.map((o) => ({ key: o.key, text: o.text })) : null,
      correct_answer: isNumeric ? null : (isMcq ? form.correct_answer : null),
      acceptable_answers: isNumeric && form.numeric_answer_type === 'EXACT'
        ? [form.numeric_answer.trim()] : null,
      numeric_answer_type: isNumeric ? form.numeric_answer_type : null,
      numeric_min: isNumeric && form.numeric_answer_type === 'RANGE' ? parseFloat(form.numeric_min) : null,
      numeric_max: isNumeric && form.numeric_answer_type === 'RANGE' ? parseFloat(form.numeric_max) : null,
      explanation: (!isPassage && !isDocEmpty(form.explanation)) ? form.explanation : null,
      concept_tag_id: form.concept_tag_id || null,
      marks: finalMarks,
      negative_marks: finalNegMarks,
      video_url: form.video_url.trim() || null,
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

      // Handle passage sub-questions
      if (isPassage && qId) {
        if (mode === 'edit') {
          const keepIds = form.sub_questions.filter((s) => s.id).map((s) => s.id!)
          if (keepIds.length > 0) {
            await supabase.from('passage_sub_questions').delete()
              .eq('parent_question_id', qId).not('id', 'in', `(${keepIds.join(',')})`)
          } else {
            await supabase.from('passage_sub_questions').delete().eq('parent_question_id', qId)
          }
        }

        for (const sq of form.sub_questions) {
          const sqMarks = isPassageMulti ? parseFloat(sq.marks) : finalMarks
          const sqNegMarks = isPassageMulti ? parseFloat(sq.negative_marks) : finalNegMarks

          const sqPayload = {
            parent_question_id: qId,
            question_text: sq.question_text,
            options: sq.options.map((o) => ({ key: o.key, text: o.text })),
            correct_answer: sq.correct_answer,
            explanation: !isDocEmpty(sq.explanation) ? sq.explanation : null,
            marks: sqMarks,
            negative_marks: sqNegMarks,
            order_index: sq.order_index,
          }

          if (sq.id) {
            await supabase.from('passage_sub_questions').update(sqPayload).eq('id', sq.id)
          } else {
            await supabase.from('passage_sub_questions').insert(sqPayload)
          }
        }
      }

      router.push('/super-admin/question-bank')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question.')
      setSaving(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loadingEdit) return <div className="px-6 py-6 text-sm text-zinc-400">Loading question…</div>

  return (
    <>
      <div className="px-6 py-6 max-w-4xl">
        {/* Back */}
        <button onClick={() => router.push('/super-admin/question-bank')}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Question Bank
        </button>

        <h1 className="text-base font-semibold text-zinc-900 mb-1">
          {mode === 'create' ? 'Create New Question' : 'Edit Question'}
        </h1>
        <p className="text-xs text-zinc-500 mb-5">
          {mode === 'create' ? 'Build questions for your assessments' : 'Update your question details'}
        </p>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-zinc-200">
          {(['edit', 'preview'] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}>
              {tab === 'edit' ? 'Edit Mode' : 'Preview Mode'}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* ── Preview Mode ── */}
        {activeTab === 'preview' ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <FormPreview form={form} />
          </div>
        ) : (
          /* ── Edit Mode ── */
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Basic Information */}
            <SectionCard title="Basic Information">
              {/* Exam category filter */}
              <div>
                <FieldLabel label="Filter by Exam Category" />
                <div className="flex items-center gap-2 flex-wrap">
                  {examCategories.map((cat) => (
                    <label key={cat.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="accent-blue-700"
                        checked={selectedCategories.includes(cat.name)}
                        onChange={() => toggleCategory(cat.name)} />
                      <span className="text-xs text-zinc-700">{cat.name}</span>
                    </label>
                  ))}
                  {selectedCategories.length > 0 && (
                    <button type="button" onClick={() => setSelectedCategories([])}
                      className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Filters the Sources list below. Not saved against the question.
                </p>
              </div>

              {/* Source & Chapter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Source" required />
                  <select className={inputCls} value={form.source_id}
                    onChange={(e) => setForm((f) => ({ ...f, source_id: e.target.value, chapter_id: '' }))}>
                    <option value="">Select source…</option>
                    {filteredSources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Chapter" required />
                  <select className={inputCls} value={form.chapter_id} disabled={!form.source_id}
                    onChange={(e) => setField('chapter_id', e.target.value)}>
                    <option value="">Select chapter…</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>{c.order_index}. {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Type & Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Question Type" required />
                  <select className={inputCls} value={form.question_type}
                    onChange={(e) => handleTypeChange(e.target.value as QuestionType)}>
                    <option value="MCQ_SINGLE">MCQ — Single Correct</option>
                    <option value="MCQ_MULTI">MCQ — Multiple Correct</option>
                    <option value="PASSAGE_SINGLE">Passage — Single Correct</option>
                    <option value="PASSAGE_MULTI">Passage — Multiple Correct</option>
                    <option value="NUMERIC">Numeric</option>
                  </select>
                </div>
                <div>
                  <FieldLabel label="Difficulty" required />
                  <select className={inputCls} value={form.difficulty}
                    onChange={(e) => setField('difficulty', e.target.value as Difficulty)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              {/* Marks — hidden for PASSAGE_MULTI (auto-computed) */}
              {isPassageMulti ? (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-md">
                  <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    <span className="font-medium">Auto-computed marks:</span> Parent question marks = sum of all sub-question marks
                    {computedParentMarks !== null && ` (currently ${computedParentMarks}m)`}.
                    Set marks per sub-question below.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Marks (+)" required />
                    <input type="number" min={0.5} max={10} step={0.5} className={inputCls}
                      value={form.marks} onChange={(e) => setField('marks', e.target.value)} />
                    {marksError(form.marks) && (
                      <p className="text-xs text-rose-600 mt-0.5">{marksError(form.marks)}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel label="Negative Marks" required />
                    <input type="number" min={0} step={0.25} className={inputCls}
                      value={form.negative_marks} onChange={(e) => setField('negative_marks', e.target.value)} />
                    {negMarksError(form.negative_marks, form.marks) && (
                      <p className="text-xs text-rose-600 mt-0.5">{negMarksError(form.negative_marks, form.marks)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Concept Tag */}
              <div>
                <FieldLabel label="Concept Tag">
                  <a href="/super-admin/platform-config" target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 font-normal">
                    Manage tags <ExternalLink className="w-3 h-3" />
                  </a>
                </FieldLabel>
                <select className={inputCls} value={form.concept_tag_id}
                  onChange={(e) => setField('concept_tag_id', e.target.value)}>
                  <option value="">— None —</option>
                  {Array.from(new Set(conceptTags.map((t) => `${t.exam_category}|||${t.subject}`))).map((key) => {
                    const [exam, subject] = key.split('|||')
                    const group = conceptTags.filter((t) => t.exam_category === exam && t.subject === subject)
                    return (
                      <optgroup key={key} label={`${exam} — ${subject}`}>
                        {group.map((t) => (
                          <option key={t.id} value={t.id}>{t.concept_name}</option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>
            </SectionCard>

            {/* Passage Information */}
            {isPassage && (
              <SectionCard title="Passage Information">
                <FieldLabel label="Passage Text" required />
                <RichTextEditor value={form.passage_text}
                  onChange={(doc) => setField('passage_text', doc)} minHeight="120px" />
              </SectionCard>
            )}

            {/* Question Content */}
            <SectionCard title={isPassage ? 'Sub-Questions' : 'Question'}>
              {!isPassage && (
                <div className="mb-2">
                  <FieldLabel label="Question Text" required />
                  <RichTextEditor value={form.question_text}
                    onChange={(doc) => setField('question_text', doc)} minHeight="100px" />
                </div>
              )}

              {/* MCQ Options */}
              {isMcq && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FieldLabel label={isMultiCorrect ? 'Options — check all correct' : 'Options — select correct'} required />
                    <span className="text-xs text-zinc-400">{form.options.length}/{MAX_OPTIONS}</span>
                  </div>
                  <DndContext sensors={optionSensors} collisionDetection={closestCenter} onDragEnd={handleOptionDragEnd}>
                    <SortableContext items={form.options.map((o) => o.key)} strategy={verticalListSortingStrategy}>
                      {form.options.map((opt) => {
                        const isCorrect = form.correct_answer.includes(opt.key)
                        const canRemove = form.options.length > MIN_OPTIONS && !isCorrect
                        return (
                          <SortableOptionItem
                            key={opt.key}
                            opt={opt}
                            isMultiCorrect={isMultiCorrect}
                            isCorrect={isCorrect}
                            canRemove={canRemove}
                            radioName="correct_answer"
                            onToggle={() => toggleCorrect(opt.key)}
                            onChange={(doc) => {
                              const opts = [...form.options]
                              opts[form.options.indexOf(opt)] = { ...opt, text: doc }
                              setField('options', opts)
                            }}
                            onRemove={() => removeOption(opt.key)}
                          />
                        )
                      })}
                    </SortableContext>
                  </DndContext>
                  {form.options.length < MAX_OPTIONS && (
                    <button type="button" onClick={addOption}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors">
                      <Plus className="w-3 h-3" />Add option
                    </button>
                  )}
                </div>
              )}

              {/* NUMERIC */}
              {isNumeric && (
                <div className="space-y-4">
                  {/* Exact / Range toggle */}
                  <div>
                    <FieldLabel label="Answer Type" required />
                    <div className="flex items-center gap-4">
                      {(['EXACT', 'RANGE'] as NumericAnswerType[]).map((t) => (
                        <label key={t} className="inline-flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="numeric_answer_type" className="accent-blue-700"
                            checked={form.numeric_answer_type === t}
                            onChange={() => setField('numeric_answer_type', t)} />
                          <span className="text-sm text-zinc-700">{t === 'EXACT' ? 'Exact Value' : 'Range'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {form.numeric_answer_type === 'EXACT' ? (
                    <div>
                      <FieldLabel label="Correct Answer" required />
                      <input className={inputCls} placeholder="e.g. 42 or 3.14"
                        value={form.numeric_answer}
                        onChange={(e) => setField('numeric_answer', e.target.value)} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel label="Minimum Value" required />
                        <input type="number" step="any" className={inputCls} placeholder="e.g. 10"
                          value={form.numeric_min}
                          onChange={(e) => setField('numeric_min', e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel label="Maximum Value" required />
                        <input type="number" step="any" className={inputCls} placeholder="e.g. 20"
                          value={form.numeric_max}
                          onChange={(e) => setField('numeric_max', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PASSAGE Sub-questions */}
              {isPassage && (
                <div className="space-y-4">
                  {isPassageSingle && (
                    <div className="mb-2">
                      <FieldLabel label="Question Stem (optional — displayed in exam player above the sub-question)" />
                      <RichTextEditor value={form.question_text}
                        onChange={(doc) => setField('question_text', doc)} minHeight="60px" />
                    </div>
                  )}

                  {form.sub_questions.map((sq, i) => (
                    <SubQuestionEditor key={i} sub={sq} index={i}
                      isMulti={form.question_type === 'PASSAGE_MULTI'}
                      showMarks={isPassageMulti}
                      onChange={(updated) => {
                        const subs = [...form.sub_questions]; subs[i] = updated
                        setField('sub_questions', subs)
                      }}
                      onRemove={() => setField('sub_questions',
                        form.sub_questions
                          .filter((_, idx) => idx !== i)
                          .map((s, idx) => ({ ...s, order_index: idx + 1 }))
                      )}
                    />
                  ))}

                  <button type="button"
                    onClick={() => setField('sub_questions', [
                      ...form.sub_questions,
                      emptySubQuestion(form.sub_questions.length + 1),
                    ])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                    <Plus className="w-3.5 h-3.5" />Add Sub-question
                  </button>
                </div>
              )}
            </SectionCard>

            {/* Explanation (non-passage) */}
            {!isPassage && (
              <SectionCard title="Explanation">
                <FieldLabel label="Text Explanation" />
                <RichTextEditor value={form.explanation}
                  onChange={(doc) => setField('explanation', doc)} minHeight="80px" />
              </SectionCard>
            )}

            {/* Video URL */}
            <SectionCard title="Video Explanation (Optional)">
              <FieldLabel label="YouTube / Video URL" />
              <div className="relative">
                <ExternalLink className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input className={`${inputCls} pl-8`}
                  placeholder="https://youtube.com/watch?v=…"
                  value={form.video_url}
                  onChange={(e) => setField('video_url', e.target.value)} />
              </div>
            </SectionCard>

            {/* Form actions */}
            <div className="flex items-center gap-3 pt-2 pb-6">
              <button type="button" onClick={() => router.push('/super-admin/question-bank')}
                className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : mode === 'create' ? 'Save Question' : 'Update Question'}
              </button>
            </div>
          </form>
        )}
      </div>

      <SaveWarningModal
        open={showSaveWarning}
        assessmentCount={assessmentCount}
        onCancel={() => setShowSaveWarning(false)}
        onConfirm={doSave}
        saving={saving}
      />
    </>
  )
}
