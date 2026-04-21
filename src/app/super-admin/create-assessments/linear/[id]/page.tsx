'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { TopicEntry, DisplayConfig, AssessmentConfig } from '@/types'
import {
  LANGUAGES, TEST_TYPE_OPTIONS,
  ToggleRow, Label, FieldError, FieldHint, inputCls, SelectField,
  SectionCard, SortableBulletList,
  SectionEntry, SectionsBuilder,
  TopicsCoveredBuilder,
  AssessmentPreviewPanel, TestTypeChangeModal,
} from '../_components'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamCategory { id: string; name: string }

interface DBAssessment {
  id: string
  title: string
  exam_category_id: string
  test_type: string
  status: string
  description: string | null
  assessment_config: AssessmentConfig | null
  display_config: {
    language?: string
    what_youll_get?: string[]
    topics_covered?: TopicEntry[]
  } | null
}

// ─── Hydrate section entries from DB config ───────────────────────────────────

function hydrateSection(
  s: { id?: string; name?: string; questions_per_attempt?: number; duration_minutes?: number }
): SectionEntry {
  return {
    id: s.id ?? crypto.randomUUID(),
    name: s.name ?? '',
    questionCount: String(s.questions_per_attempt ?? ''),
    durationMinutes: String(s.duration_minutes ?? ''),
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EditLinearAssessmentPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [assessmentStatus, setAssessmentStatus] = useState('')
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  // Basic Info
  const [title, setTitle] = useState('')
  const [testType, setTestType] = useState('')
  const [examCategoryId, setExamCategoryId] = useState('')
  const [totalQuestions, setTotalQuestions] = useState('')
  const [totalMarks, setTotalMarks] = useState('')

  // Display Config
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('English')
  const [whatYoullGet, setWhatYoullGet] = useState<string[]>([''])
  const [topicsCovered, setTopicsCovered] = useState<TopicEntry[]>([])

  // Sections (FULL_TEST only)
  const [sections, setSections] = useState<SectionEntry[]>([])

  // Timings
  const [duration, setDuration] = useState('')
  const [allowSectionalNavigation, setAllowSectionalNavigation] = useState(false)
  const [allowBackNavigation, setAllowBackNavigation] = useState(true)
  const [allowCalculator, setAllowCalculator] = useState(false)

  // Derived
  const navigationPolicy = allowSectionalNavigation ? 'FREE' : 'SECTION_LOCKED'
  const timerMode: 'FULL' | 'SECTIONAL' = allowSectionalNavigation ? 'FULL' : 'SECTIONAL'

  // Marks config
  const [overrideMarks, setOverrideMarks] = useState(false)
  const [marksPerQuestion, setMarksPerQuestion] = useState('')
  const [negativeMarks, setNegativeMarks] = useState('')

  // Test type change modal
  const [pendingTestType, setPendingTestType] = useState<string | null>(null)

  // Derived — computed totals
  const isFullTest = testType === 'FULL_TEST'
  const hasSections = isFullTest && sections.some(s => s.name.trim())
  const computedTotalQ = hasSections
    ? sections.reduce((sum, s) => sum + (Number(s.questionCount) || 0), 0)
    : null
  const computedTotalM = hasSections && overrideMarks && Number(marksPerQuestion) > 0
    ? (computedTotalQ ?? 0) * Number(marksPerQuestion)
    : null

  const isReadOnly = assessmentStatus === 'MAINTENANCE'

  useEffect(() => {
    async function load() {
      const [{ data: catData }, { data: row, error }] = await Promise.all([
        supabase.from('exam_categories').select('id, name').eq('is_active', true).order('display_order'),
        supabase.from('assessment_items').select('*').eq('id', id).single(),
      ])
      if (catData) setCategories(catData as ExamCategory[])
      if (error || !row) { setNotFound(true); setLoading(false); return }

      const a = row as DBAssessment
      const cfg = a.assessment_config ?? {}
      const disp = a.display_config ?? {}

      setAssessmentStatus(a.status)
      setTitle(a.title)
      setTestType(a.test_type ?? '')
      setExamCategoryId(a.exam_category_id ?? '')
      setDescription(a.description ?? '')
      setLanguage(disp.language ?? 'English')
      setWhatYoullGet(disp.what_youll_get?.length ? disp.what_youll_get : [''])
      setTopicsCovered(disp.topics_covered ?? [])
      setDuration(cfg.duration_minutes != null ? String(cfg.duration_minutes) : '')
      setAllowSectionalNavigation(cfg.navigation_policy === 'FREE')
      setAllowBackNavigation(cfg.allow_back_navigation !== false)
      setAllowCalculator(cfg.allow_calculator === true)
      setOverrideMarks(cfg.override_marks === true)
      setMarksPerQuestion(cfg.marks_per_question != null ? String(cfg.marks_per_question) : '')
      setNegativeMarks(cfg.negative_marks != null ? String(cfg.negative_marks) : '')
      setTotalQuestions(cfg.total_questions != null ? String(cfg.total_questions) : '')
      setTotalMarks(cfg.total_marks != null ? String(cfg.total_marks) : '')
      if (a.test_type === 'FULL_TEST' && Array.isArray(cfg.sections)) {
        setSections((cfg.sections as Parameters<typeof hydrateSection>[0][]).map(hydrateSection))
      }
      setLoading(false)
    }
    load()
  }, [id])

  const examCategoryName = categories.find(c => c.id === examCategoryId)?.name ?? ''

  function handleTestTypeChange(val: string) {
    if (val === testType) return
    const willClear = topicsCovered.length > 0 || (testType === 'FULL_TEST' && sections.length > 0)
    if (willClear) { setPendingTestType(val) } else {
      setTestType(val)
      if (val !== 'FULL_TEST') setSections([])
    }
  }

  function confirmTestTypeChange() {
    if (pendingTestType) {
      setTestType(pendingTestType)
      setTopicsCovered([])
      if (pendingTestType !== 'FULL_TEST') setSections([])
      setPendingTestType(null)
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Assessment Title is required.'
    if (!testType) e.testType = 'Assessment Length is required.'
    if (!examCategoryId) e.examCategoryId = 'Category is required.'
    if (!allowSectionalNavigation && isFullTest) {
      const named = sections.filter(s => s.name.trim())
      if (named.length < 2) {
        e.sections = 'Section Lock requires at least 2 sections. Enable Sectional Navigation or add more sections.'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (isReadOnly || !validate()) return
    setSaving(true)

    const displayConfig: DisplayConfig = {
      what_youll_get: whatYoullGet.filter(Boolean),
      topics_covered: topicsCovered,
      language: language || 'English',
    }

    const namedSections = sections.filter(s => s.name.trim())
    const showSectionDuration = !allowSectionalNavigation
    const assessmentConfig: AssessmentConfig = {
      duration_minutes:      duration ? Number(duration) : null,
      navigation_policy:     (navigationPolicy as AssessmentConfig['navigation_policy']) || null,
      timer_mode:            timerMode,
      allow_back_navigation: allowBackNavigation,
      allow_calculator:      allowCalculator,
      override_marks:        overrideMarks,
      total_questions:       computedTotalQ ?? (totalQuestions ? Number(totalQuestions) : null),
      total_marks:           computedTotalM ?? (totalMarks ? Number(totalMarks) : null),
      marks_per_question:    overrideMarks && marksPerQuestion ? Number(marksPerQuestion) : null,
      negative_marks:        overrideMarks && negativeMarks ? Number(negativeMarks) : null,
      sections: isFullTest && namedSections.length > 0
        ? namedSections.map(s => ({
            id: s.id,
            name: s.name.trim(),
            source_ids: [],
            chapter_ids: [],
            questions_per_attempt: Number(s.questionCount) || 0,
            ...(showSectionDuration && s.durationMinutes
              ? { duration_minutes: Number(s.durationMinutes) }
              : {}),
          }))
        : undefined,
    }

    try {
      const { error } = await supabase.from('assessment_items').update({
        title: title.trim(),
        exam_category_id: examCategoryId,
        test_type: testType,
        description: description.trim() || null,
        display_config: displayConfig,
        assessment_config: assessmentConfig,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
      router.push('/super-admin/create-assessments')
    } catch (err) {
      console.error('Failed to update assessment:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-8 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-100 rounded w-48" />
          <div className="h-8 bg-zinc-100 rounded w-72" />
          <div className="h-48 bg-zinc-100 rounded" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="px-8 py-8 max-w-4xl">
        <button
          onClick={() => router.push('/super-admin/create-assessments')}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Create Assessments
        </button>
        <p className="text-sm text-zinc-500">Assessment not found.</p>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      {pendingTestType && (
        <TestTypeChangeModal
          onConfirm={confirmTestTypeChange}
          onCancel={() => setPendingTestType(null)}
          hasSections={sections.length > 0}
        />
      )}

      <button
        onClick={() => router.push('/super-admin/create-assessments')}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Create Assessments
      </button>

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-zinc-900">Edit Linear Assessment</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{title}</p>
      </div>

      {isReadOnly && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Assessment is under maintenance</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This assessment is currently offline for maintenance. Changes are locked until the maintenance window ends. Use "End Maintenance" from the assessments list to unlock editing.
            </p>
          </div>
        </div>
      )}

      {/* Edit / Preview segmented control */}
      <div className="inline-flex items-center bg-zinc-100 border border-zinc-200 rounded-md p-0.5 mb-6">
        {(['edit', 'preview'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-sm rounded-[5px] transition-all ${
              mode === m
                ? 'bg-white shadow-sm font-medium text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {m === 'edit' ? 'Edit Mode' : 'Preview Mode'}
          </button>
        ))}
      </div>

      {mode === 'preview' ? (
        <AssessmentPreviewPanel
          title={title}
          examCategoryName={examCategoryName}
          testType={testType}
          durationMinutes={duration}
          totalQuestions={computedTotalQ ?? totalQuestions}
          totalMarks={computedTotalM ?? totalMarks}
          navigationPolicy={navigationPolicy}
          description={description}
          language={language}
          whatYoullGet={whatYoullGet}
          topicsCovered={topicsCovered}
          sections={sections}
        />
      ) : (
        <fieldset disabled={isReadOnly} className="space-y-6 disabled:opacity-60">
          {/* Basic Info */}
          <SectionCard
            title="Basic Info"
            description="Core details used to identify, classify, and configure this assessment."
          >
            <div>
              <Label required>Assessment Title</Label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. NEET Biology Full Mock — Series 1"
                className={inputCls(errors.title)}
              />
              <FieldError message={errors.title} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Assessment Length</Label>
                <SelectField
                  value={testType}
                  onChange={handleTestTypeChange}
                  placeholder="Select length"
                  error={errors.testType}
                  options={TEST_TYPE_OPTIONS}
                />
                <FieldError message={errors.testType} />
              </div>
              <div>
                <Label required>Category</Label>
                <SelectField
                  value={examCategoryId}
                  onChange={setExamCategoryId}
                  placeholder="Select category"
                  error={errors.examCategoryId}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />
                <FieldError message={errors.examCategoryId} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Questions</Label>
                {hasSections ? (
                  <div className="border border-zinc-100 bg-zinc-50 rounded-md px-3 py-2 text-sm text-zinc-600">
                    {computedTotalQ} <span className="text-xs text-zinc-400 ml-1">computed from sections</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="number" min={1} value={totalQuestions}
                      onChange={e => setTotalQuestions(e.target.value)}
                      placeholder="e.g. 180" className={inputCls()}
                    />
                    {isFullTest && <FieldHint>Auto-computed once sections are added below.</FieldHint>}
                  </>
                )}
              </div>
              <div>
                <Label>Total Marks</Label>
                {hasSections && computedTotalM != null ? (
                  <div className="border border-zinc-100 bg-zinc-50 rounded-md px-3 py-2 text-sm text-zinc-600">
                    {computedTotalM} <span className="text-xs text-zinc-400 ml-1">computed from sections × marks</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="number" min={1} value={totalMarks}
                      onChange={e => setTotalMarks(e.target.value)}
                      placeholder="e.g. 720" className={inputCls()}
                    />
                    {isFullTest && <FieldHint>Auto-computed once sections and marks per question are set.</FieldHint>}
                  </>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Timings */}
          <SectionCard
            title="Timings"
            description="Configure duration and navigation behaviour for this assessment."
          >
            <div>
              <Label>Duration (minutes)</Label>
              <input
                type="number" min={1} max={500} value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="e.g. 180"
                className={inputCls()}
              />
              <FieldHint>Maximum 500 minutes. Used as the overall timer when Sectional Navigation is off.</FieldHint>
            </div>

            <div className="space-y-4 pt-1">
              <ToggleRow
                label="Allow Sectional Navigation"
                hint={allowSectionalNavigation
                  ? 'On — learners can move freely between sections (single overall timer).'
                  : 'Off — each section is locked; learners cannot return to previous sections (per-section timers).'}
                checked={allowSectionalNavigation}
                onChange={setAllowSectionalNavigation}
              />
              <ToggleRow
                label="Allow Back Navigation"
                hint="When on, learners can revisit and change previous answers within a section."
                checked={allowBackNavigation}
                onChange={setAllowBackNavigation}
              />
              <ToggleRow
                label="Allow Calculator"
                hint="When off, the calculator tool is hidden for all learners on this assessment."
                checked={allowCalculator}
                onChange={setAllowCalculator}
              />
            </div>

            <div className="bg-zinc-50 border border-zinc-100 rounded-md px-4 py-2.5">
              <p className="text-xs text-zinc-500">
                Navigation: <span className="font-medium text-zinc-700">{allowSectionalNavigation ? 'Free' : 'Sectional'}</span>
                <span className="mx-2 text-zinc-300">·</span>
                Timer: <span className="font-medium text-zinc-700">{allowSectionalNavigation ? 'Single overall' : 'Per-section'}</span>
              </p>
            </div>
          </SectionCard>

          {/* Marks Configuration */}
          <SectionCard
            title="Marks Configuration"
            description="Control how marks are calculated. By default the exam engine uses per-question marks from the question bank."
          >
            <ToggleRow
              label="Override question bank marks"
              hint="When on, all questions use the uniform marks and deduction values below, ignoring per-question marks set in the bank."
              checked={overrideMarks}
              onChange={setOverrideMarks}
            />
            {overrideMarks && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <Label>Marks per Question</Label>
                  <input
                    type="number" min={0} step={0.25} value={marksPerQuestion}
                    onChange={e => setMarksPerQuestion(e.target.value)}
                    placeholder="e.g. 4"
                    className={inputCls()}
                  />
                  <FieldHint>Applied uniformly to every question in this assessment.</FieldHint>
                </div>
                <div>
                  <Label>Negative Marks</Label>
                  <input
                    type="number" min={0} step={0.25} value={negativeMarks}
                    onChange={e => setNegativeMarks(e.target.value)}
                    placeholder="e.g. 1"
                    className={inputCls()}
                  />
                  <FieldHint>Deducted per wrong answer. Enter 0 for no penalty.</FieldHint>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Display Config */}
          <SectionCard
            title="Display Config"
            description="Content shown on the assessment detail page for learners. Switch to Preview Mode to see how this renders."
          >
            <div>
              <Label>Description</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Briefly describe what this assessment covers and who it's for."
                className={`${inputCls()} resize-none`}
              />
            </div>

            <div>
              <Label>Language</Label>
              <SelectField
                value={language}
                onChange={setLanguage}
                placeholder="Select language"
                options={LANGUAGES.map(l => ({ value: l, label: l }))}
              />
            </div>

            <SortableBulletList
              label="What You'll Get"
              hint="Highlight key benefits or features of this assessment."
              value={whatYoullGet}
              onChange={setWhatYoullGet}
            />

            {testType ? (
              <TopicsCoveredBuilder
                testType={testType}
                value={topicsCovered}
                onChange={setTopicsCovered}
              />
            ) : (
              <div>
                <Label>Topics Covered</Label>
                <p className="text-xs text-zinc-400 mt-1">
                  Select an Assessment Length above to configure topics.
                </p>
              </div>
            )}
          </SectionCard>

          {/* Sections & Question Pools */}
          {isFullTest ? (
            <SectionCard
              title="Sections & Question Pools"
              description="Define the sections of this full test. Each section maps to a group of questions from your question bank."
            >
              <SectionsBuilder
                sections={sections}
                onChange={setSections}
                timerMode={timerMode}
                navigationPolicy={navigationPolicy}
                overrideMarks={overrideMarks}
                marksPerQuestion={marksPerQuestion}
                error={errors.sections}
              />
            </SectionCard>
          ) : testType ? (
            <div className="bg-white border border-zinc-200 rounded-lg">
              <div className="px-6 py-4 border-b border-zinc-100">
                <p className="text-sm font-semibold text-zinc-900">Sections & Question Pools</p>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-zinc-500">
                  {testType === 'SUBJECT_TEST'
                    ? 'Subject tests have a single section. Configure question pools after saving this assessment.'
                    : 'Chapter tests have a single section. Configure question pools after saving this assessment.'}
                </p>
              </div>
            </div>
          ) : null}

          {/* Action bar */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-4">
            <button
              type="button"
              onClick={() => router.push('/super-admin/create-assessments')}
              className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || isReadOnly}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </fieldset>
      )}
    </div>
  )
}
