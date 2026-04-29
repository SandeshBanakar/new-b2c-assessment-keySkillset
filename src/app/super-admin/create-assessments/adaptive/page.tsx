'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { TopicEntry, DisplayConfig } from '@/types'
import {
  LANGUAGES,
  TEST_TYPE_OPTIONS,
  Label, FieldHint, inputCls, SelectField, SectionCard,
  SortableBulletList, TopicsCoveredBuilder,
} from '../linear/_components'
import {
  FoundationModule, Source, Chapter,
  newFoundationModule,
  FoundationModuleCard,
  AdaptivePreviewTab,
  ScaleScoreTemplatePicker,
} from './_components'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamCategory { id: string; name: string; score_min: number | null; score_max: number | null }

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateAdaptiveAssessmentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [scaleScoreTemplateId, setScaleScoreTemplateId] = useState<string | null>(null)
  const [templateMaxFM, setTemplateMaxFM] = useState<number | null>(null)

  // Catalog
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [chaptersMap, setChaptersMap] = useState<Record<string, Chapter[]>>({})

  // Basic Info
  const [title, setTitle] = useState('')
  const [testType, setTestType] = useState('')
  const [examCategoryId, setExamCategoryId] = useState('')

  // Modules
  const [foundationModules, setFoundationModules] = useState<FoundationModule[]>([newFoundationModule(1)])

  // Display Config
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('English')
  const [whatYoullGet, setWhatYoullGet] = useState<string[]>([''])
  const [topicsCovered, setTopicsCovered] = useState<TopicEntry[]>([])

  const selectedCategory = categories.find(c => c.id === examCategoryId) ?? null
  const isSubjectTest = testType === 'SUBJECT_TEST'
  const fmCap = templateMaxFM ?? 5
  const canAddMoreFMs = !isSubjectTest && foundationModules.length < fmCap

  // Analytics Config widget — SAT only
  const [satBandCount, setSatBandCount] = useState<number | null>(null)
  const [satCollegeCounts, setSatCollegeCounts] = useState<{ us: number; in: number } | null>(null)
  const [satCatId, setSatCatId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedCategory?.name !== 'SAT') return
    setSatCatId(selectedCategory.id)
    supabase.from('sat_tier_bands').select('id').then(({ data }) => setSatBandCount((data ?? []).length))
    supabase.from('sat_colleges').select('country').then(({ data }) => {
      const rows = (data ?? []) as { country: string }[]
      setSatCollegeCounts({ us: rows.filter(r => r.country === 'US').length, in: rows.filter(r => r.country === 'IN').length })
    })
  }, [selectedCategory?.name, selectedCategory?.id])

  // Load categories on mount
  useEffect(() => {
    supabase.from('exam_categories')
      .select('id, name, score_min, score_max')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data, error }) => {
        if (error) console.error('Failed to load categories:', error)
        if (data) setCategories(data as ExamCategory[])
      })
  }, [])

  // Load sources when category changes
  useEffect(() => {
    if (!examCategoryId) { setSources([]); setChaptersMap({}); return }
    supabase.from('sources')
      .select('id, name, exam_category_id')
      .eq('exam_category_id', examCategoryId)
      .order('name')
      .then(({ data }) => {
        const srcs = (data ?? []) as Source[]
        setSources(srcs)
        // Load all chapters for these sources in one query
        if (srcs.length === 0) { setChaptersMap({}); return }
        supabase.from('chapters')
          .select('id, source_id, name, order_index')
          .in('source_id', srcs.map(s => s.id))
          .order('order_index')
          .then(({ data: cData }) => {
            const map: Record<string, Chapter[]> = {}
            for (const ch of (cData ?? []) as Chapter[]) {
              if (!map[ch.source_id]) map[ch.source_id] = []
              map[ch.source_id].push(ch)
            }
            setChaptersMap(map)
          })
      })
  }, [examCategoryId])

  function updateModule(id: string, updated: FoundationModule) {
    setFoundationModules(prev => prev.map(fm => fm.id === id ? updated : fm))
  }

  function removeModule(id: string) {
    setFoundationModules(prev =>
      prev.filter(fm => fm.id !== id).map((fm, i) => ({ ...fm, order: i + 1 }))
    )
  }

  function addModule() {
    if (!canAddMoreFMs) return
    setFoundationModules(prev => [...prev, newFoundationModule(prev.length + 1)])
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Assessment Title is required.'
    if (!testType) e.testType = 'Assessment Length is required.'
    if (!examCategoryId) e.examCategoryId = 'Category is required.'
    if (foundationModules.some(fm => !fm.name.trim())) {
      e.modules = 'All Foundation Modules must have a name.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    const displayConfig: DisplayConfig = {
      what_youll_get: whatYoullGet.filter(Boolean),
      topics_covered: topicsCovered,
      language: language || 'English',
    }

    const assessmentConfig = {
      assessment_type: 'ADAPTIVE',
      foundation_modules: foundationModules.map(fm => ({
        id: fm.id,
        order: fm.order,
        name: fm.name.trim(),
        time_minutes: fm.time_minutes ? Number(fm.time_minutes) : null,
        allow_calculator: fm.allow_calculator,
        source_ids: fm.source_ids,
        chapter_ids: fm.chapter_ids,
        questions_per_attempt: fm.questions_per_attempt ? Number(fm.questions_per_attempt) : null,
        question_type_distribution: fm.question_type_distribution,
        branching: fm.branching,
        break_screen: fm.break_screen,
        variant_modules: fm.variant_modules.map(vm => ({
          id: vm.id,
          difficulty: vm.difficulty,
          name: vm.name.trim(),
          time_minutes: vm.time_minutes ? Number(vm.time_minutes) : null,
          source_ids: vm.source_ids,
          chapter_ids: vm.chapter_ids,
          questions_per_attempt: vm.questions_per_attempt ? Number(vm.questions_per_attempt) : null,
          question_type_distribution: vm.question_type_distribution,
        })),
      })),
      display_config: {
        description: description.trim(),
        language: language || 'English',
        what_youll_get: whatYoullGet.filter(Boolean),
        topics_covered: topicsCovered,
      },
      maintenance_window: null,
    }

    try {
      const { error } = await supabase.from('assessment_items').insert({
        title: title.trim(),
        exam_category_id: examCategoryId,
        test_type: testType,
        status: 'INACTIVE',
        assessment_type: 'ADAPTIVE',
        source: 'PLATFORM',
        description: description.trim() || null,
        display_config: displayConfig,
        assessment_config: assessmentConfig,
        audience_type: 'B2C_ONLY',
        visibility_scope: 'GLOBAL',
        scale_score_template_id: scaleScoreTemplateId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      router.push('/super-admin/create-assessments')
    } catch (err) {
      console.error('Failed to create adaptive assessment:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      <button
        onClick={() => router.push('/super-admin/create-assessments')}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Create Assessments
      </button>

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-zinc-900">New Adaptive Assessment</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Build branching assessments with Foundation and Variant modules — the engine routes learners based on accuracy.
        </p>
      </div>

      {/* Tab bar */}
      <div className="inline-flex items-center bg-zinc-100 border border-zinc-200 rounded-md p-0.5 mb-6">
        {([
          { key: 'edit',    label: 'Edit' },
          { key: 'preview', label: 'Preview' },
        ] as const).map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm rounded-[5px] transition-all ${
              tab === t.key
                ? 'bg-white shadow-sm font-medium text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Preview tab ──────────────────────────────────────────────────────── */}
      {tab === 'preview' && (
        <div>
          <p className="text-sm font-medium text-zinc-700 mb-4">Assessment Flow</p>
          <AdaptivePreviewTab modules={foundationModules} />
        </div>
      )}

      {/* ── Edit tab ─────────────────────────────────────────────────────────── */}
      {tab === 'edit' && (
        <div className="space-y-6">
          {/* Basic Info */}
          <SectionCard
            title="Basic Info"
            description="Core details for this adaptive assessment."
          >
            <div>
              <Label required>Assessment Title</Label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. SAT Full Practice Test — Series 1"
                className={inputCls(errors.title)}
              />
              {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Assessment Length</Label>
                <SelectField
                  value={testType}
                  onChange={val => {
                    setTestType(val)
                    if (val === 'SUBJECT_TEST' && foundationModules.length > 1) {
                      setFoundationModules([{ ...foundationModules[0], order: 1 }])
                    }
                  }}
                  placeholder="Select length"
                  error={errors.testType}
                  options={TEST_TYPE_OPTIONS.filter(o => o.value !== 'CHAPTER_TEST')}
                />
                {errors.testType && <p className="mt-1 text-xs text-rose-500">{errors.testType}</p>}
                {isSubjectTest && (
                  <FieldHint>Subject Test: exactly 1 Foundation Module + 3 Variant Modules.</FieldHint>
                )}
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
                {errors.examCategoryId && <p className="mt-1 text-xs text-rose-500">{errors.examCategoryId}</p>}
              </div>
            </div>

          </SectionCard>

          {/* Scale Score Template */}
          <ScaleScoreTemplatePicker
            examCategoryId={examCategoryId}
            templateId={scaleScoreTemplateId}
            onSelect={setScaleScoreTemplateId}
            onTemplateSelect={t => setTemplateMaxFM(t?.max_foundation_modules ?? null)}
            foundationModules={foundationModules}
            onModulesChange={setFoundationModules}
          />

          {/* Analytics Config reference — SAT only */}
          {selectedCategory?.name === 'SAT' && (
            <div className="rounded-md border border-zinc-200 bg-white px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 mb-1">Analytics Config</p>
                {satBandCount === null ? (
                  <p className="text-xs text-zinc-400">Loading…</p>
                ) : satBandCount === 0 ? (
                  <p className="text-xs text-zinc-400">Not configured — set up tier bands and colleges in Platform Config.</p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    {satBandCount} tier {satBandCount === 1 ? 'band' : 'bands'} configured
                    {satCollegeCounts && satCollegeCounts.us + satCollegeCounts.in > 0
                      ? ` · ${satCollegeCounts.us + satCollegeCounts.in} colleges (${satCollegeCounts.us} US · ${satCollegeCounts.in} IN)`
                      : ' · No colleges configured'}
                  </p>
                )}
              </div>
              <a
                href={satCatId ? `/super-admin/platform-config?cat=${satCatId}` : '/super-admin/platform-config'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 text-xs font-medium border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Edit in Platform Config <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Foundation Modules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Foundation Modules</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isSubjectTest ? 'Subject Test: exactly 1 FM' : `Full Test: 1–${fmCap} FMs (${foundationModules.length}/${fmCap})`}
                </p>
              </div>
              {canAddMoreFMs && (
                <button
                  type="button"
                  onClick={addModule}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Foundation Module
                </button>
              )}
            </div>

            {errors.modules && (
              <p className="text-xs text-rose-500">{errors.modules}</p>
            )}

            {foundationModules.map(fm => (
              <FoundationModuleCard
                key={fm.id}
                fm={fm}
                sources={sources}
                chaptersMap={chaptersMap}
                onUpdate={updated => updateModule(fm.id, updated)}
                onRemove={() => removeModule(fm.id)}
                canRemove={foundationModules.length > 1 && !isSubjectTest}
                qpaLocked={!!scaleScoreTemplateId}
              />
            ))}
          </div>

          {/* Display Config */}
          <SectionCard
            title="Display Config"
            description="Content shown on the assessment detail page for learners."
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
                <p className="text-xs text-zinc-400 mt-1">Select an Assessment Length above to configure topics.</p>
              </div>
            )}
          </SectionCard>

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
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
