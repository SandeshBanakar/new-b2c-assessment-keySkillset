'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Plus, X, Construction } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamCategory {
  id: string
  name: string
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-zinc-700 mb-1">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-rose-500">{message}</p>
}

function inputCls(err?: string) {
  return `w-full border rounded-md px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none ${
    err ? 'border-rose-400' : 'border-zinc-200'
  }`
}

// ─── Select dropdown ──────────────────────────────────────────────────────────

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  error?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(error)} appearance-none pr-8 bg-white`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
    </div>
  )
}

// ─── Bullet list editor ───────────────────────────────────────────────────────

function BulletListEditor({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string[]
  onChange: (v: string[]) => void
}) {
  function updateItem(idx: number, val: string) {
    const next = [...value]
    next[idx] = val
    onChange(next)
  }
  function removeItem(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }
  function addItem() {
    onChange([...value, ''])
  }

  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="text-xs text-zinc-400 mb-2">{hint}</p>}
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              placeholder={`Item ${idx + 1}`}
              className="flex-1 border border-zinc-200 rounded-md px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>
    </div>
  )
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg">
      <div className="px-6 py-4 border-b border-zinc-100">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  )
}

// ─── Coming Soon stub ─────────────────────────────────────────────────────────

function ComingSoonStub({ label }: { label: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg">
      <div className="px-6 py-4 border-b border-zinc-100">
        <p className="text-sm font-semibold text-zinc-900">{label}</p>
      </div>
      <div className="px-6 py-10 flex flex-col items-center text-center">
        <Construction className="w-8 h-8 text-zinc-200 mb-3" />
        <p className="text-sm font-medium text-zinc-500">Coming Soon</p>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          Section & question pool configuration will be available in an upcoming release.
        </p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateLinearAssessmentPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Basic Info
  const [title, setTitle] = useState('')
  const [examCategoryId, setExamCategoryId] = useState('')
  const [testType, setTestType] = useState('')
  const [duration, setDuration] = useState('')
  const [navigationPolicy, setNavigationPolicy] = useState('')

  // Display Config
  const [description, setDescription] = useState('')
  const [whatYoullGet, setWhatYoullGet] = useState<string[]>([''])
  const [syllabusSections, setSyllabusSections] = useState<string[]>([''])

  useEffect(() => {
    supabase.from('exam_categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data as ExamCategory[])
    })
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required.'
    if (!examCategoryId) e.examCategoryId = 'Exam category is required.'
    if (!testType) e.testType = 'Test type is required.'
    if (!duration.trim()) e.duration = 'Duration is required.'
    else if (isNaN(Number(duration)) || Number(duration) <= 0) e.duration = 'Enter a valid duration in minutes.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave(asDraft = true) {
    if (!validate()) return
    setSaving(true)

    const displayConfig = {
      what_youll_get: whatYoullGet.filter(Boolean),
      syllabus: syllabusSections.filter(Boolean),
    }

    try {
      const { error } = await supabase.from('content_items').insert({
        title: title.trim(),
        exam_category_id: examCategoryId,
        test_type: testType,
        status: asDraft ? 'INACTIVE' : 'INACTIVE',
        assessment_type: 'LINEAR',
        source: 'PLATFORM',
        description: description.trim() || null,
        display_config: displayConfig,
        audience_type: 'B2C_ONLY',
        visibility_scope: 'GLOBAL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      router.push('/super-admin/create-assessments')
    } catch (err) {
      console.error('Failed to create assessment:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-3xl">
      {/* Back nav */}
      <button
        onClick={() => router.push('/super-admin/create-assessments')}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Create Assessments
      </button>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-zinc-900">New Linear Assessment</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Configure the assessment metadata and display content for learners.
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <SectionCard
          title="Basic Info"
          description="Core details used to identify and classify this assessment."
        >
          {/* Title */}
          <div>
            <Label required>Title</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. NEET Biology Full Mock — Series 1"
              className={inputCls(errors.title)}
            />
            <FieldError message={errors.title} />
          </div>

          {/* Exam category + test type — 2 col */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Exam Category</Label>
              <SelectField
                value={examCategoryId}
                onChange={setExamCategoryId}
                placeholder="Select category"
                error={errors.examCategoryId}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
              <FieldError message={errors.examCategoryId} />
            </div>
            <div>
              <Label required>Test Type</Label>
              <SelectField
                value={testType}
                onChange={setTestType}
                placeholder="Select type"
                error={errors.testType}
                options={[
                  { value: 'FULL_TEST', label: 'Full Test' },
                  { value: 'SUBJECT_TEST', label: 'Subject Test' },
                  { value: 'CHAPTER_TEST', label: 'Chapter Test' },
                ]}
              />
              <FieldError message={errors.testType} />
            </div>
          </div>

          {/* Duration + navigation policy — 2 col */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Duration (minutes)</Label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 180"
                className={inputCls(errors.duration)}
              />
              <FieldError message={errors.duration} />
            </div>
            <div>
              <Label>Navigation Policy</Label>
              <SelectField
                value={navigationPolicy}
                onChange={setNavigationPolicy}
                placeholder="Select policy"
                options={[
                  { value: 'FREE', label: 'Free — jump to any question' },
                  { value: 'LINEAR', label: 'Linear — sequential only' },
                  { value: 'SECTION_LOCKED', label: 'Section-locked' },
                ]}
              />
              <p className="mt-1 text-xs text-zinc-400">Controls how learners navigate between questions.</p>
            </div>
          </div>
        </SectionCard>

        {/* Display Config */}
        <SectionCard
          title="Display Config"
          description="Content shown on the assessment detail/marketing page for learners."
        >
          {/* Description */}
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Briefly describe what this assessment covers and who it's for."
              className={`${inputCls()} resize-none`}
            />
          </div>

          {/* What you'll get */}
          <BulletListEditor
            label="What You'll Get"
            hint="Highlight key benefits or features of this assessment."
            value={whatYoullGet}
            onChange={setWhatYoullGet}
          />

          {/* Syllabus */}
          <BulletListEditor
            label="Syllabus"
            hint="List the topics or chapters covered."
            value={syllabusSections}
            onChange={setSyllabusSections}
          />
        </SectionCard>

        {/* Sections & Question Pools — Coming Soon */}
        <ComingSoonStub label="Sections & Question Pools" />

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
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save Assessment'}
          </button>
        </div>
      </div>
    </div>
  )
}
