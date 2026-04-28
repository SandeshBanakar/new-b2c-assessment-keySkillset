'use client'

import { useState, useEffect } from 'react'
import { Plus, X, ChevronRight, RotateCcw, AlertCircle } from 'lucide-react'
import { SourceChapterPicker, Source, Chapter } from '../linear/_components'
export type { Source, Chapter }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QTDist {
  mcq_single: number
  mcq_multi: number
  passage_single: number
  passage_multi: number
  numeric: number
}

export interface VariantModule {
  id: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  name: string
  time_minutes: string
  source_ids: string[]
  chapter_ids: string[]
  questions_per_attempt: string
  question_type_distribution: QTDist
}

export interface BreakScreen {
  id: string
  title: string
  message: string
}

export interface FoundationModule {
  id: string
  order: number
  name: string
  time_minutes: string
  source_ids: string[]
  chapter_ids: string[]
  questions_per_attempt: string
  question_type_distribution: QTDist
  branching: { high_threshold: number; low_threshold: number }
  break_screen: BreakScreen | null
  allow_calculator: boolean
  variant_modules: VariantModule[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  EASY:   { label: 'Easy',   color: 'bg-emerald-100 text-emerald-700' },
  MEDIUM: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  HARD:   { label: 'Hard',   color: 'bg-rose-100 text-rose-700' },
}

const DEFAULT_QTD: QTDist = { mcq_single: 0, mcq_multi: 0, passage_single: 0, passage_multi: 0, numeric: 0 }

export function newVariantModule(difficulty: 'EASY' | 'MEDIUM' | 'HARD'): VariantModule {
  return {
    id: crypto.randomUUID(),
    difficulty,
    name: '',
    time_minutes: '',
    source_ids: [],
    chapter_ids: [],
    questions_per_attempt: '',
    question_type_distribution: { ...DEFAULT_QTD },
  }
}

export function newFoundationModule(order: number): FoundationModule {
  return {
    id: crypto.randomUUID(),
    order,
    name: '',
    time_minutes: '',
    source_ids: [],
    chapter_ids: [],
    questions_per_attempt: '',
    question_type_distribution: { ...DEFAULT_QTD },
    branching: { high_threshold: 70, low_threshold: 40 },
    break_screen: null,
    allow_calculator: false,
    variant_modules: [
      newVariantModule('EASY'),
      newVariantModule('MEDIUM'),
      newVariantModule('HARD'),
    ],
  }
}

// ─── Design primitives ────────────────────────────────────────────────────────

export function inputCls(err?: string) {
  return `w-full border rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none ${err ? 'border-rose-400' : 'border-zinc-200'}`
}

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-zinc-600 mb-1">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-zinc-400">{children}</p>
}

// ─── Question Type Distribution ───────────────────────────────────────────────

export function QTDistEditor({
  value, onChange, questionsPerAttempt,
}: {
  value: QTDist
  onChange: (v: QTDist) => void
  questionsPerAttempt: string
}) {
  const total = Object.values(value).reduce((a, b) => a + b, 0)
  const target = Number(questionsPerAttempt) || 0
  const isValid = target === 0 || total === target

  const fields: { key: keyof QTDist; label: string }[] = [
    { key: 'mcq_single',     label: 'MCQ Single' },
    { key: 'mcq_multi',      label: 'MCQ Multi' },
    { key: 'passage_single', label: 'Passage Single' },
    { key: 'passage_multi',  label: 'Passage Multi' },
    { key: 'numeric',        label: 'Numeric' },
  ]

  return (
    <div>
      <Label>Question Type Distribution</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
            <input
              type="number" min={0}
              value={value[key] || ''}
              onChange={e => onChange({ ...value, [key]: Number(e.target.value) || 0 })}
              placeholder="0"
              className="w-full border border-zinc-200 rounded-md px-2.5 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
            />
          </div>
        ))}
      </div>
      <div className={`mt-2 flex items-center gap-1.5 text-xs ${isValid ? 'text-zinc-400' : 'text-amber-600'}`}>
        <span>Total: {total}</span>
        {target > 0 && (
          <>
            <span>·</span>
            <span>{isValid ? `matches ${target} questions` : `should sum to ${target}`}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Branching Config ─────────────────────────────────────────────────────────

export function BranchingConfig({
  value, onChange,
}: {
  value: { high_threshold: number; low_threshold: number }
  onChange: (v: { high_threshold: number; low_threshold: number }) => void
}) {
  const medLow = value.low_threshold
  const medHigh = value.high_threshold

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-md px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-blue-900">Branching Configuration</p>
        <button
          type="button"
          onClick={() => onChange({ high_threshold: 70, low_threshold: 40 })}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to Default
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-blue-700 mb-1">High Threshold % → Hard</p>
          <div className="flex items-center gap-1.5">
            <input
              type="number" min={1} max={100}
              value={value.high_threshold}
              onChange={e => onChange({ ...value, high_threshold: Number(e.target.value) || 70 })}
              className="w-full border border-blue-200 rounded-md px-2.5 py-1.5 text-sm text-zinc-900 bg-white focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
            />
            <span className="text-xs text-blue-600 shrink-0">%</span>
          </div>
          <p className="text-xs text-blue-500 mt-0.5">accuracy ≥ {value.high_threshold}%</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 mb-1">Low Threshold % → Easy</p>
          <div className="flex items-center gap-1.5">
            <input
              type="number" min={1} max={100}
              value={value.low_threshold}
              onChange={e => onChange({ ...value, low_threshold: Number(e.target.value) || 40 })}
              className="w-full border border-blue-200 rounded-md px-2.5 py-1.5 text-sm text-zinc-900 bg-white focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
            />
            <span className="text-xs text-blue-600 shrink-0">%</span>
          </div>
          <p className="text-xs text-blue-500 mt-0.5">accuracy &lt; {value.low_threshold}%</p>
        </div>
      </div>

      <div className="bg-white border border-blue-100 rounded-md px-3 py-2">
        <p className="text-xs text-blue-700">
          Medium Range (auto): <span className="font-medium">{medLow}% – {medHigh}%</span>
        </p>
      </div>

      <p className="text-xs text-blue-500">
        Engine routes learners after minimum 30% of questions attempted
      </p>
    </div>
  )
}

// ─── Variant Module Card ──────────────────────────────────────────────────────

export function VariantModuleCard({
  vm, sources, chaptersMap, onChange,
}: {
  vm: VariantModule
  sources: Source[]
  chaptersMap: Record<string, Chapter[]>
  onChange: (updated: VariantModule) => void
}) {
  const diff = DIFFICULTY_LABELS[vm.difficulty]
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-zinc-50 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff.color}`}>
          {diff.label}
        </span>
        <span className="flex-1 text-sm font-medium text-zinc-700">
          {vm.name || `${diff.label} Variant Module`}
        </span>
        <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </div>

      {open && (
        <div className="px-4 py-4 space-y-4 border-t border-zinc-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label required>Module Name</Label>
              <input
                type="text"
                value={vm.name}
                onChange={e => onChange({ ...vm, name: e.target.value })}
                placeholder={`e.g. Module — ${diff.label}`}
                className={inputCls()}
              />
            </div>
            <div>
              <Label required>Time (minutes)</Label>
              <input
                type="number" min={1}
                value={vm.time_minutes}
                onChange={e => onChange({ ...vm, time_minutes: e.target.value })}
                placeholder="e.g. 35"
                className={inputCls()}
              />
            </div>
          </div>

          <div>
            <Label required>Questions Per Attempt</Label>
            <input
              type="number" min={1}
              value={vm.questions_per_attempt}
              onChange={e => onChange({ ...vm, questions_per_attempt: e.target.value })}
              placeholder="e.g. 27"
              className={inputCls()}
            />
          </div>

          <div>
            <Label>Sources & Chapters</Label>
            <SourceChapterPicker
              sources={sources}
              chaptersMap={chaptersMap}
              selectedSourceIds={vm.source_ids}
              selectedChapterIds={vm.chapter_ids}
              onSourcesChange={ids => onChange({ ...vm, source_ids: ids })}
              onChaptersChange={ids => onChange({ ...vm, chapter_ids: ids })}
            />
          </div>

          <QTDistEditor
            value={vm.question_type_distribution}
            onChange={v => onChange({ ...vm, question_type_distribution: v })}
            questionsPerAttempt={vm.questions_per_attempt}
          />
        </div>
      )}
    </div>
  )
}

// ─── Break Screen Card ────────────────────────────────────────────────────────

function BreakScreenCard({
  value, onChange, onRemove,
}: {
  value: BreakScreen
  onChange: (v: BreakScreen) => void
  onRemove: () => void
}) {
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-amber-800">Break Screen</p>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-amber-400 hover:text-amber-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div>
        <Label>Title</Label>
        <input
          type="text"
          value={value.title}
          onChange={e => onChange({ ...value, title: e.target.value })}
          placeholder="e.g. Break Time"
          className="w-full border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white"
        />
      </div>
      <div>
        <Label>Message</Label>
        <textarea
          value={value.message}
          onChange={e => onChange({ ...value, message: e.target.value })}
          rows={2}
          placeholder="e.g. Take a short break before the next module."
          className="w-full border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white resize-none"
        />
      </div>
    </div>
  )
}

// ─── Foundation Module Card ───────────────────────────────────────────────────

export function FoundationModuleCard({
  fm, sources, chaptersMap, onUpdate, onRemove, canRemove,
}: {
  fm: FoundationModule
  sources: Source[]
  chaptersMap: Record<string, Chapter[]>
  onUpdate: (updated: FoundationModule) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [open, setOpen] = useState(true)

  function updateVM(diff: 'EASY' | 'MEDIUM' | 'HARD', updated: VariantModule) {
    onUpdate({
      ...fm,
      variant_modules: fm.variant_modules.map(v => v.difficulty === diff ? updated : v),
    })
  }

  return (
    <div className="border border-zinc-300 rounded-xl overflow-hidden">
      {/* FM header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-zinc-900">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setOpen(o => !o)}>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            Foundation Module {fm.order}
          </span>
          <span className="text-sm font-medium text-white flex-1">
            {fm.name || `Foundation Module ${fm.order}`}
          </span>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-zinc-400 transition-transform cursor-pointer ${open ? 'rotate-90' : ''}`}
          onClick={() => setOpen(o => !o)}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="divide-y divide-zinc-100">
          {/* FM fields */}
          <div className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>Module Name</Label>
                <input
                  type="text"
                  value={fm.name}
                  onChange={e => onUpdate({ ...fm, name: e.target.value })}
                  placeholder={`e.g. Module ${fm.order}`}
                  className={inputCls()}
                />
              </div>
              <div>
                <Label required>Time (minutes)</Label>
                <input
                  type="number" min={1}
                  value={fm.time_minutes}
                  onChange={e => onUpdate({ ...fm, time_minutes: e.target.value })}
                  placeholder="e.g. 32"
                  className={inputCls()}
                />
              </div>
            </div>

            <div>
              <Label required>Questions Per Attempt</Label>
              <input
                type="number" min={1}
                value={fm.questions_per_attempt}
                onChange={e => onUpdate({ ...fm, questions_per_attempt: e.target.value })}
                placeholder="e.g. 27"
                className={inputCls()}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-medium text-zinc-700">Allow Calculator</p>
                <p className="text-xs text-zinc-400 mt-0.5">Variant Modules inherit this setting.</p>
              </div>
              <button
                type="button"
                onClick={() => onUpdate({ ...fm, allow_calculator: !fm.allow_calculator })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${fm.allow_calculator ? 'bg-blue-600' : 'bg-zinc-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${fm.allow_calculator ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div>
              <Label>Sources & Chapters</Label>
              <SourceChapterPicker
                sources={sources}
                chaptersMap={chaptersMap}
                selectedSourceIds={fm.source_ids}
                selectedChapterIds={fm.chapter_ids}
                onSourcesChange={ids => onUpdate({ ...fm, source_ids: ids })}
                onChaptersChange={ids => onUpdate({ ...fm, chapter_ids: ids })}
              />
            </div>

            <QTDistEditor
              value={fm.question_type_distribution}
              onChange={v => onUpdate({ ...fm, question_type_distribution: v })}
              questionsPerAttempt={fm.questions_per_attempt}
            />

            <BranchingConfig
              value={fm.branching}
              onChange={b => onUpdate({ ...fm, branching: b })}
            />
          </div>

          {/* Break Screen slot */}
          <div className="px-5 py-4">
            <p className="text-xs text-zinc-400 mb-3">
              Break screens can only be placed between a Foundation Module and its Variant Modules
            </p>
            {fm.break_screen ? (
              <BreakScreenCard
                value={fm.break_screen}
                onChange={bs => onUpdate({ ...fm, break_screen: bs })}
                onRemove={() => onUpdate({ ...fm, break_screen: null })}
              />
            ) : (
              <button
                type="button"
                onClick={() => onUpdate({
                  ...fm,
                  break_screen: { id: crypto.randomUUID(), title: '', message: '' },
                })}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 border border-dashed border-zinc-200 rounded-md px-3 py-2 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Break Screen
              </button>
            )}
          </div>

          {/* Variant Modules */}
          <div className="px-5 py-5 space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Variant Modules</p>
            {fm.variant_modules.map(vm => (
              <VariantModuleCard
                key={vm.difficulty}
                vm={vm}
                sources={sources}
                chaptersMap={chaptersMap}
                onChange={updated => updateVM(vm.difficulty, updated)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Adaptive Preview Tab ─────────────────────────────────────────────────────

export function AdaptivePreviewTab({ modules }: { modules: FoundationModule[] }) {
  if (modules.length === 0) {
    return (
      <div className="border border-dashed border-zinc-200 rounded-lg py-12 text-center">
        <p className="text-sm text-zinc-400">Add a Foundation Module to see the assessment flow.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {modules.map((fm, idx) => (
        <div key={fm.id} className="space-y-2">
          {/* FM node */}
          <div className="bg-zinc-900 text-white rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded text-zinc-300">FM {fm.order}</span>
              <span className="text-sm font-medium">{fm.name || `Foundation Module ${fm.order}`}</span>
            </div>
            {fm.questions_per_attempt && (
              <p className="text-xs text-zinc-400 mt-1">
                {fm.questions_per_attempt} Qs · {fm.time_minutes || '—'} min
                · Branch: &lt;{fm.branching.low_threshold}% Easy / {fm.branching.low_threshold}–{fm.branching.high_threshold}% Med / ≥{fm.branching.high_threshold}% Hard
              </p>
            )}
          </div>

          {/* Arrow + Break Screen */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-4 bg-zinc-200" />
            {fm.break_screen && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-2 text-center w-full max-w-xs">
                  <p className="text-xs font-medium text-amber-700">{fm.break_screen.title || 'Break Screen'}</p>
                  {fm.break_screen.message && (
                    <p className="text-xs text-amber-600 mt-0.5 line-clamp-1">{fm.break_screen.message}</p>
                  )}
                </div>
                <div className="w-0.5 h-4 bg-zinc-200" />
              </>
            )}
          </div>

          {/* VM cards side by side */}
          <div className="grid grid-cols-3 gap-2">
            {(['EASY', 'MEDIUM', 'HARD'] as const).map(diff => {
              const vm = fm.variant_modules.find(v => v.difficulty === diff)
              const d = DIFFICULTY_LABELS[diff]
              return (
                <div key={diff} className="border border-zinc-200 rounded-lg px-3 py-2.5">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${d.color}`}>
                    {d.label}
                  </span>
                  <p className="text-sm text-zinc-700 mt-1 truncate">{vm?.name || '—'}</p>
                  {vm?.questions_per_attempt && (
                    <p className="text-xs text-zinc-400 mt-0.5">{vm.questions_per_attempt} Qs · {vm.time_minutes || '—'} min</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Connector to next FM */}
          {idx < modules.length - 1 && (
            <div className="flex flex-col items-center py-1">
              <div className="w-0.5 h-6 bg-zinc-200" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Scale Score Tab ──────────────────────────────────────────────────────────

interface ScoreRow { raw_score: number; scaled_score: string }

interface ScoreModule {
  module_id: string
  module_type: string
  label: string
  rows: ScoreRow[]
}

interface ScoreChangeWarning {
  module_id: string
  module_type: string
  newCount: number
}

export function ScoreScoreTab({
  assessmentId,
  modules,
  scoreMin,
  scoreMax,
}: {
  assessmentId: string | null
  modules: FoundationModule[]
  scoreMin: number | null
  scoreMax: number | null
}) {
  // Build initial score modules from FM/VM structure
  function buildScoreModules(): ScoreModule[] {
    const result: ScoreModule[] = []
    modules.forEach(fm => {
      const fmCount = Number(fm.questions_per_attempt) || 0
      result.push({
        module_id: fm.id,
        module_type: 'FOUNDATION',
        label: `FM ${fm.order}: ${fm.name || 'Foundation Module'}`,
        rows: Array.from({ length: fmCount + 1 }, (_, i) => ({ raw_score: i, scaled_score: '' })),
      })
      fm.variant_modules.forEach(vm => {
        const vmCount = Number(vm.questions_per_attempt) || 0
        result.push({
          module_id: vm.id,
          module_type: `VARIANT_${vm.difficulty}`,
          label: `FM ${fm.order} → ${vm.difficulty}: ${vm.name || `${vm.difficulty} Variant`}`,
          rows: Array.from({ length: vmCount + 1 }, (_, i) => ({ raw_score: i, scaled_score: '' })),
        })
      })
    })
    return result
  }

  // scoreData is the source of truth — initialized from module structure, then populated from DB
  const [scoreData, setScoreData] = useState<ScoreModule[]>(() => buildScoreModules())
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [warning, setWarning] = useState<ScoreChangeWarning | null>(null)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  // Load existing scores from DB when assessmentId is available
  useEffect(() => {
    if (!assessmentId) return
    async function loadScores() {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data } = await supabase
          .from('assessment_scale_scores')
          .select('module_id, raw_score, scaled_score')
          .eq('assessment_id', assessmentId)

        if (data && data.length > 0) {
          const rows = data as { module_id: string; raw_score: number; scaled_score: number }[]
          setScoreData(prev => prev.map(mod => ({
            ...mod,
            rows: mod.rows.map(row => {
              const dbRow = rows.find(d => d.module_id === mod.module_id && d.raw_score === row.raw_score)
              return dbRow ? { ...row, scaled_score: String(dbRow.scaled_score) } : row
            }),
          })))
        }
      } catch (err) {
        console.error('Failed to load scale scores:', err)
      } finally {
        setLoaded(true)
      }
    }
    loadScores()
  }, [assessmentId])

  if (!assessmentId) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-6 py-10 text-center">
        <p className="text-sm font-medium text-zinc-700">Save this assessment first</p>
        <p className="text-xs text-zinc-400 mt-1">
          Scale Score tables are available after saving the assessment as draft.
        </p>
      </div>
    )
  }

  // Derive display modules from state — never rebuild from props (that discards edits)
  const allModules = scoreData
  const active = activeModuleId ?? allModules[0]?.module_id ?? null

  const currentModule = allModules.find(m => m.module_id === active)
  const scoreHint = scoreMin != null && scoreMax != null ? `Range: ${scoreMin}–${scoreMax}` : null

  async function handleSave() {
    if (!active || !assessmentId) return
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const mod = scoreData.find(m => m.module_id === active)
      if (!mod) return
      const foundationOrder = modules.findIndex(fm =>
        fm.id === active || fm.variant_modules.some(v => v.id === active)
      ) + 1

      const rows = mod.rows
        .filter(r => r.scaled_score !== '')
        .map(r => ({
          assessment_id: assessmentId,
          module_id: active,
          module_type: mod.module_type,
          foundation_module_order: foundationOrder,
          raw_score: r.raw_score,
          scaled_score: Number(r.scaled_score),
        }))

      await supabase.from('assessment_scale_scores')
        .delete()
        .eq('assessment_id', assessmentId)
        .eq('module_id', active)

      if (rows.length > 0) {
        await supabase.from('assessment_scale_scores').insert(rows)
      }
    } catch (err) {
      console.error('Scale score save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  function updateScaledScore(rawScore: number, scaled: string) {
    setScoreData(prev => prev.map(m =>
      m.module_id === active
        ? { ...m, rows: m.rows.map(r => r.raw_score === rawScore ? { ...r, scaled_score: scaled } : r) }
        : m
    ))
  }

  return (
    <div className="space-y-4">
      {/* Module selector */}
      <div className="flex flex-wrap gap-2">
        {allModules.map(m => (
          <button
            key={m.module_id}
            type="button"
            onClick={() => setActiveModuleId(m.module_id)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              active === m.module_id
                ? 'border-blue-700 bg-blue-50 text-blue-700'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {currentModule && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-zinc-800">{currentModule.label}</p>
              {scoreHint && <p className="text-xs text-zinc-400">{scoreHint}</p>}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Scores'}
            </button>
          </div>

          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-zinc-50 border-b border-zinc-200 px-4 py-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Raw Score</p>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Scaled Score</p>
            </div>
            <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
              {currentModule.rows.map(row => (
                <div key={row.raw_score} className="grid grid-cols-2 items-center px-4 py-1.5">
                  <span className="text-sm text-zinc-700">{row.raw_score}</span>
                  <input
                    type="number"
                    value={row.scaled_score}
                    min={scoreMin ?? 0}
                    max={scoreMax ?? undefined}
                    onChange={e => updateScaledScore(row.raw_score, e.target.value)}
                    placeholder="—"
                    className="w-32 border border-zinc-200 rounded-md px-2.5 py-1 text-sm text-zinc-900 placeholder-zinc-300 focus:ring-1 focus:ring-blue-700 focus:border-transparent outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {allModules.length === 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">Add Foundation Modules on the Edit tab first to configure scale scores.</p>
        </div>
      )}
    </div>
  )
}
