'use client'

import { useState, useEffect } from 'react'
import { X, GripVertical, Plus, Trash2, Info, Search } from 'lucide-react'
import { updatePlan, writePlanAuditLog, addContentToPlan, fetchAllLiveB2CAssessments, updateSingleCoursePlan, type PlanRow, type SingleCoursePlanRow } from '@/lib/supabase/plans'

type AssessmentType = 'FULL_TEST' | 'SUBJECT_TEST' | 'CHAPTER_TEST'

const ASSESSMENT_TYPE_OPTIONS: { value: AssessmentType; label: string; desc: string }[] = [
  { value: 'FULL_TEST',    label: 'Full Tests',    desc: 'Complete mock exams' },
  { value: 'SUBJECT_TEST', label: 'Subject Tests', desc: 'Single-subject assessments' },
  { value: 'CHAPTER_TEST', label: 'Chapter Tests', desc: 'Topic-level short tests' },
]

const EXAM_CATEGORIES = ['SAT', 'NEET', 'JEE', 'CLAT', 'PMP', 'UPSC']

function SectionHeading({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-100 text-zinc-600 text-xs font-semibold shrink-0 mt-0.5">
        {number}
      </span>
      <div>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

type Props = {
  plan: PlanRow
  onClose: () => void
  onSaved: () => void
}

// ─── B2B Edit form — name, description, max_attempts only ─────────────────────
function B2BEditForm({
  plan,
  onClose,
  onSaved,
}: Props) {
  const [name, setName]           = useState(plan.name)
  const [description, setDesc]    = useState(plan.description ?? '')
  const [maxAttempts, setMaxAttempts] = useState(plan.max_attempts_per_assessment ?? 10)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) { setError('Plan name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      await updatePlan(plan.id, {
        name:                        name.trim(),
        description:                 description.trim() || null,
        max_attempts_per_assessment: maxAttempts,
      })
      await writePlanAuditLog(plan.id, 'PLAN_UPDATED', { updated_by: 'super_admin' })
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-120 bg-white border-l border-zinc-200 z-50 flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Edit B2B Plan</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{plan.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Section 1 — Identity */}
          <div>
            <SectionHeading number="1" title="Plan Identity" />
            <div className="space-y-4">
              <div>
                <FieldLabel label="Plan name (internal)" required />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <div>
                <FieldLabel label="Description" />
                <textarea
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  placeholder="Plan description for internal reference"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2 — Scope (read-only) */}
          <div>
            <SectionHeading number="2" title="Scope" />
            <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-md">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Platform-Wide
              </span>
              <span className="text-xs text-zinc-400">B2B plans are always platform-wide.</span>
            </div>
          </div>

          {/* Section 3 — Pricing (read-only) */}
          <div>
            <SectionHeading number="3" title="Pricing" />
            <div className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-md">
              <p className="text-sm text-zinc-600">Pricing is managed per tenant via the Contract tab.</p>
              <p className="text-xs text-zinc-400 mt-1">No price is set on B2B plans.</p>
            </div>
          </div>

          {/* Section 4 — Max Attempts */}
          <div>
            <SectionHeading number="4" title="Access Rules" />
            <div className="space-y-4">
              <div className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-md">
                <p className="text-xs font-medium text-zinc-600 mb-1">Assessment types</p>
                <p className="text-xs text-zinc-400">B2B plans grant access to all assessment types.</p>
              </div>
              <div>
                <FieldLabel label="Max paid attempts per assessment" />
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    className="w-20 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Info className="w-3.5 h-3.5" />
                    Free attempt always included — 1 per assessment, all tiers
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 shrink-0">
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── B2C Edit form — full 5-section form ──────────────────────────────────────
function B2CEditForm({ plan, onClose, onSaved }: Props) {
  const [name, setName]               = useState(plan.name)
  const [displayName, setDisplayName] = useState(plan.display_name ?? '')
  const [tagline, setTagline]         = useState(plan.tagline ?? '')
  const [isPopular, setIsPopular]     = useState(plan.is_popular)
  const [ctaLabel, setCtaLabel]       = useState(plan.cta_label ?? '')
  const [scope, setScope]             = useState<'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'>(plan.scope)
  const [category, setCategory]       = useState<string | null>(plan.category)
  const [price, setPrice]             = useState(plan.price)
  const [allowedTypes, setAllowedTypes] = useState<AssessmentType[]>(
    (plan.allowed_assessment_types ?? []) as AssessmentType[]
  )
  const [maxAttempts, setMaxAttempts] = useState(plan.max_attempts_per_assessment ?? 5)
  const initialBullets = Array.isArray(plan.feature_bullets) && plan.feature_bullets.length > 0
    ? plan.feature_bullets
    : ['', '', '']
  const [bullets, setBullets]     = useState<string[]>(initialBullets)
  const [footnote, setFootnote]   = useState(plan.footnote ?? '')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Section 6 — Assessments (additive only; removals via plan detail page)
  const [assessments, setAssessments]                 = useState<{ id: string; title: string; assessmentType: string }[]>([])
  const [assessmentSearch, setAssessmentSearch]       = useState('')
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set())
  const [assessmentsLoading, setAssessmentsLoading]   = useState(true)

  useEffect(() => {
    fetchAllLiveB2CAssessments()
      .then(setAssessments)
      .finally(() => setAssessmentsLoading(false))
  }, [])

  function toggleType(type: AssessmentType) {
    setAllowedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  function toggleAssessment(id: string) {
    setSelectedAssessments((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function addBullet() {
    if (bullets.length < 7) setBullets((b) => [...b, ''])
  }

  function removeBullet(i: number) {
    if (bullets.length <= 1) return
    setBullets((b) => b.filter((_, idx) => idx !== i))
  }

  function updateBullet(i: number, val: string) {
    setBullets((b) => b.map((v, idx) => (idx === i ? val.slice(0, 80) : v)))
  }

  async function handleSave() {
    if (!name.trim()) { setError('Plan name is required.'); return }
    if (allowedTypes.length === 0) { setError('Select at least one assessment type.'); return }
    if (scope === 'CATEGORY_BUNDLE' && !category) { setError('Select an exam category.'); return }

    setSaving(true)
    setError(null)
    try {
      const cleanBullets = bullets.map((b) => b.trim()).filter(Boolean)
      await updatePlan(plan.id, {
        name:                        name.trim(),
        description:                 plan.description ?? '',
        display_name:                displayName.trim() || null,
        tagline:                     tagline.trim() || null,
        is_popular:                  isPopular,
        cta_label:                   ctaLabel.trim() || null,
        scope,
        category:                    scope === 'CATEGORY_BUNDLE' ? category : null,
        price,
        max_attempts_per_assessment: maxAttempts,
        feature_bullets:             cleanBullets,
        footnote:                    footnote.trim() || null,
      })
      if (selectedAssessments.size > 0) {
        await Promise.all(
          Array.from(selectedAssessments).map((id) => addContentToPlan(plan.id, id, 'ASSESSMENT'))
        )
      }
      await writePlanAuditLog(plan.id, 'PLAN_UPDATED', { updated_by: 'super_admin' })
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-120 bg-white border-l border-zinc-200 z-50 flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Edit Plan</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{plan.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Section 1 — Plan Identity */}
          <div>
            <SectionHeading number="1" title="Plan Identity" subtitle="Internal name and customer-facing display fields." />
            <div className="space-y-4">
              <div>
                <FieldLabel label="Plan name (internal)" required />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <div>
                <FieldLabel label="Display name (customer-facing)" />
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. All Access Pro"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <div>
                <FieldLabel label="Tagline" />
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="One-sentence pricing card subtitle"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-600">Most Popular badge</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Shows "Most Popular" badge on pricing card</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPopular((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isPopular ? 'bg-blue-700' : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      isPopular ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div>
                <FieldLabel label="CTA button label" />
                <input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder='Default: "Get Started"'
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Section 2 — Scope */}
          <div>
            <SectionHeading number="2" title="Scope" subtitle="Platform-wide or single exam category." />
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'PLATFORM_WIDE',   label: 'Platform-wide',  desc: 'All exam categories' },
                  { value: 'CATEGORY_BUNDLE', label: 'Category Bundle', desc: 'One exam category only' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setScope(opt.value); if (opt.value === 'PLATFORM_WIDE') setCategory(null) }}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-md border text-left transition-colors ${
                    scope === opt.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <span className={`text-sm font-medium ${scope === opt.value ? 'text-blue-900' : 'text-zinc-700'}`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-zinc-400 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
            {scope === 'CATEGORY_BUNDLE' && (
              <div className="mt-3">
                <FieldLabel label="Exam category" required />
                <div className="flex flex-wrap gap-2">
                  {EXAM_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                        category === cat
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3 — Pricing */}
          <div>
            <SectionHeading number="3" title="Pricing" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Price (₹/month)" required />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <FieldLabel label="Billing cycle" />
                <div className="flex items-center px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md h-9.5">
                  <span className="text-sm text-zinc-500">Monthly</span>
                  <span className="text-xs text-zinc-400 ml-2">— Annual V2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 — Access Rules */}
          <div>
            <SectionHeading number="4" title="Access Rules" />
            <div className="space-y-4">
              <div>
                <FieldLabel label="Allowed assessment types" required />
                <div className="grid grid-cols-3 gap-2">
                  {ASSESSMENT_TYPE_OPTIONS.map((opt) => {
                    const selected = allowedTypes.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleType(opt.value)}
                        className={`flex flex-col items-start px-3 py-2.5 rounded-md border text-left transition-colors ${
                          selected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        <span className={`text-sm font-medium ${selected ? 'text-blue-900' : 'text-zinc-700'}`}>
                          {opt.label}
                        </span>
                        <span className="text-xs text-zinc-400 mt-0.5">{opt.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <FieldLabel label="Max paid attempts per assessment" />
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    className="w-20 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Info className="w-3.5 h-3.5" />
                    Free attempt always included
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 — Feature Bullets + Footnote */}
          <div>
            <SectionHeading number="5" title="Feature Bullets" subtitle={`${bullets.length} of 7 max · 80 chars each`} />
            <div className="space-y-2 mb-3">
              {bullets.map((bullet, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-zinc-300 shrink-0" />
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => updateBullet(i, e.target.value)}
                    maxLength={80}
                    placeholder={`Feature ${i + 1}`}
                    className="flex-1 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <span className="text-xs text-zinc-400 w-8 text-right shrink-0">{bullet.length}/80</span>
                  <button
                    type="button"
                    onClick={() => removeBullet(i)}
                    disabled={bullets.length <= 1}
                    className="text-zinc-400 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addBullet}
              disabled={bullets.length >= 7}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {bullets.length >= 7 ? '7 of 7 max' : 'Add Bullet'}
            </button>

            <div className="mt-4">
              <FieldLabel label="Footnote" />
              <input
                value={footnote}
                onChange={(e) => setFootnote(e.target.value)}
                placeholder="Small print below CTA on pricing card"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Section 6 — Add Assessments */}
          <div>
            <SectionHeading number="6" title="Add Assessments" subtitle="Optionally add more LIVE B2C assessments. Existing content managed via plan detail page." />
            <div className="border border-zinc-200 rounded-md overflow-hidden">
              <div className="relative border-b border-zinc-200">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={assessmentSearch}
                  onChange={(e) => setAssessmentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
              <div className="max-h-44 overflow-y-auto">
                {assessmentsLoading ? (
                  <div className="p-3 space-y-2">
                    {[0, 1, 2].map((i) => <div key={i} className="h-8 rounded bg-zinc-100 animate-pulse" />)}
                  </div>
                ) : assessments.filter((a) => a.title.toLowerCase().includes(assessmentSearch.toLowerCase())).length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-5">
                    {assessments.length === 0 ? 'No live B2C assessments available.' : 'No matches.'}
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {assessments
                      .filter((a) => a.title.toLowerCase().includes(assessmentSearch.toLowerCase()))
                      .map((a) => (
                        <label key={a.id} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAssessments.has(a.id)}
                            onChange={() => toggleAssessment(a.id)}
                            className="accent-blue-700"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-900 truncate">{a.title}</p>
                            <p className="text-xs text-zinc-400">{a.assessmentType}</p>
                          </div>
                        </label>
                      ))}
                  </div>
                )}
              </div>
              {selectedAssessments.size > 0 && (
                <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-xs text-blue-700 font-medium">
                    {selectedAssessments.size} assessment{selectedAssessments.size !== 1 ? 's' : ''} will be added on save
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 shrink-0">
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}

// ─── Course Bundle Edit form ──────────────────────────────────────────────────
function CourseBundleEditForm({ plan, onClose, onSaved }: Props) {
  const [name, setName]               = useState(plan.name)
  const [displayName, setDisplayName] = useState(plan.display_name ?? '')
  const [tagline, setTagline]         = useState(plan.tagline ?? '')
  const [price, setPrice]             = useState(plan.price)
  const [billingCycle, setBillingCycle] = useState<'ANNUAL' | 'MONTHLY'>(
    (plan.billing_cycle as 'ANNUAL' | 'MONTHLY') ?? 'ANNUAL'
  )
  const initialBullets = Array.isArray(plan.feature_bullets) && plan.feature_bullets.length > 0
    ? plan.feature_bullets
    : ['', '', '']
  const [bullets, setBullets]     = useState<string[]>(initialBullets)
  const [footnote, setFootnote]   = useState(plan.footnote ?? '')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function addBullet() { if (bullets.length < 7) setBullets((p) => [...p, '']) }
  function removeBullet(i: number) { if (bullets.length > 1) setBullets((p) => p.filter((_, idx) => idx !== i)) }
  function updateBullet(i: number, v: string) { setBullets((p) => p.map((b, idx) => idx === i ? v.slice(0, 80) : b)) }

  async function handleSave() {
    if (!name.trim()) { setError('Plan name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      await updatePlan(plan.id, {
        name:            name.trim(),
        display_name:    displayName.trim() || null,
        tagline:         tagline.trim() || null,
        price,
        billing_cycle:   billingCycle,
        feature_bullets: bullets.filter((b) => b.trim()),
        footnote:        footnote.trim() || null,
      } as Parameters<typeof updatePlan>[1])
      await writePlanAuditLog(plan.id, 'PLAN_UPDATED', { updated_by: 'super_admin' })
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-120 bg-white border-l border-zinc-200 z-50 flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Edit Course Bundle Plan</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{plan.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Section 1 — Identity */}
          <div>
            <SectionHeading number="1" title="Plan Identity" />
            <div className="space-y-4">
              <div>
                <FieldLabel label="Plan name (internal)" required />
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <div>
                <FieldLabel label="Display name (customer-facing)" />
                <input
                  value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Shown on pricing page"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <div>
                <FieldLabel label="Tagline" />
                <input
                  value={tagline} onChange={(e) => setTagline(e.target.value)}
                  placeholder="One-line subtitle for the pricing card"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Section 2 — Pricing */}
          <div>
            <SectionHeading number="2" title="Pricing" />
            <div className="space-y-4">
              <div>
                <FieldLabel label="Price (₹/year)" required />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
                  <input
                    type="number" min={0} value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <FieldLabel label="Billing cycle" />
                <div className="grid grid-cols-2 gap-2">
                  {(['ANNUAL', 'MONTHLY'] as const).map((cycle) => (
                    <button
                      key={cycle} type="button" onClick={() => setBillingCycle(cycle)}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                        billingCycle === cycle
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {cycle === 'ANNUAL' ? 'Annual' : 'Monthly'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 — Feature Bullets */}
          <div>
            <SectionHeading number="3" title="Feature Bullets & Footnote" subtitle="Max 7 bullets, 80 chars each." />
            <div className="space-y-4">
              <div>
                <FieldLabel label="Feature bullets" />
                <div className="space-y-2">
                  {bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-zinc-300 shrink-0" />
                      <div className="relative flex-1">
                        <input
                          type="text" value={bullet} onChange={(e) => updateBullet(idx, e.target.value)}
                          placeholder={`Feature ${idx + 1}`} maxLength={80}
                          className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent pr-12"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-300">{bullet.length}/80</span>
                      </div>
                      <button
                        type="button" onClick={() => removeBullet(idx)} disabled={bullets.length <= 1}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button" onClick={addBullet} disabled={bullets.length >= 7}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Bullet <span className="text-zinc-400 ml-0.5">({bullets.length} of 7 max)</span>
                </button>
              </div>
              <div>
                <FieldLabel label="Footnote" />
                <input
                  value={footnote} onChange={(e) => setFootnote(e.target.value)}
                  placeholder="e.g. Annual subscription. Renews automatically."
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 shrink-0">
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Public export: routes by plan_audience + plan_category ─────────────────
export function EditPlanSlideOver(props: Props) {
  if (props.plan.plan_audience === 'B2B') return <B2BEditForm {...props} />
  if (props.plan.plan_category === 'COURSE_BUNDLE') return <CourseBundleEditForm {...props} />
  return <B2CEditForm {...props} />
}

// ─── Single Course Plan Edit Slide-Over ───────────────────────────────────────

export function SingleCoursePlanEditSlideOver({
  plan,
  onClose,
  onSaved,
}: {
  plan: SingleCoursePlanRow
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]               = useState(plan.name)
  const [displayName, setDisplayName] = useState(plan.display_name ?? '')
  const [pricingMode, setPricingMode] = useState<'paid' | 'free'>(plan.is_free ? 'free' : 'paid')
  const [price, setPrice]             = useState<number | ''>(plan.price ?? '')
  const [priceUsd, setPriceUsd]       = useState<number | ''>(plan.price_usd ?? '')
  const [stripeId, setStripeId]       = useState(plan.stripe_price_id ?? '')
  const [status, setStatus]           = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(
    plan.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  )
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [showFreeWarning, setShowFreeWarning] = useState(false)
  const [pendingFreeSwitch, setPendingFreeSwitch] = useState(false)

  const isFree = pricingMode === 'free'

  function handlePricingModeChange(mode: 'paid' | 'free') {
    if (mode === 'free' && pricingMode === 'paid') {
      // Warn before switching a paid plan to free
      setPendingFreeSwitch(true)
      setShowFreeWarning(true)
    } else {
      setPricingMode(mode)
    }
  }

  function confirmFreeSwitch() {
    setPricingMode('free')
    setShowFreeWarning(false)
    setPendingFreeSwitch(false)
  }

  function validate(): string | null {
    if (!name.trim()) return 'Plan name is required.'
    if (!isFree) {
      if (price === '' || Number(price) < 0) return 'Price (₹) must be a valid number.'
      if (priceUsd === '' || Number(priceUsd) < 0) return 'Price (USD) must be a valid number.'
    }
    return null
  }

  async function handleSave() {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setSaving(true)
    try {
      await updateSingleCoursePlan(plan.id, {
        name:            name.trim(),
        display_name:    displayName.trim() || null,
        price:           isFree ? 0 : price as number,
        price_usd:       isFree ? 0 : priceUsd as number,
        stripe_price_id: isFree ? null : (stripeId.trim() || null),
        status,
        is_free:         isFree,
      })
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Edit Single Course Plan</p>
            <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[340px]">{plan.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Linked course — read-only */}
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Linked Course</p>
            <p className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2">
              {plan.course_name ?? <span className="text-zinc-400">No course linked</span>}
            </p>
            <p className="text-xs text-zinc-400 mt-1">The linked course cannot be changed after creation.</p>
          </div>

          {/* Plan Identity */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Plan Identity</p>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Plan name (internal) <span className="text-rose-500">*</span></label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Display name (customer-facing)</label>
              <input
                type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Pricing</p>

            {/* Pricing Mode toggle */}
            <div className="flex gap-2">
              {(['paid', 'free'] as const).map((mode) => (
                <button
                  key={mode} type="button"
                  onClick={() => handlePricingModeChange(mode)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                    pricingMode === mode
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {mode === 'paid' ? 'Paid Plan' : 'Free Plan'}
                </button>
              ))}
            </div>

            {isFree ? (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-sm font-medium text-green-800">Free access — no payment required</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Prices will be set to ₹0 / $0. No Stripe product will be linked. The course will be individually accessible at no charge.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Price (₹) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
                      <input
                        type="number" min={0} value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Price (USD) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                      <input
                        type="number" min={0} step="0.01" value={priceUsd}
                        onChange={(e) => setPriceUsd(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Stripe Price ID</label>
                  <input
                    type="text" value={stripeId} onChange={(e) => setStripeId(e.target.value)}
                    placeholder="price_annual_..."
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-400 mt-1">Auto-synced to course record on save.</p>
                </div>
              </>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</p>
            <div className="flex gap-2">
              {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    status === s
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {status === 'PUBLISHED' && (
              <p className="text-xs text-emerald-600">Publishing will set the course as individually purchasable and sync prices.</p>
            )}
            {status === 'ARCHIVED' && (
              <p className="text-xs text-amber-600">Archiving will remove the individually purchasable flag from the course.</p>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-md px-4 py-3">
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Paid → Free warning modal */}
      {showFreeWarning && pendingFreeSwitch && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Switch to Free Plan?</h2>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-zinc-700">
                  This will set prices to <span className="font-medium">₹0 / $0</span> and remove the Stripe link on the course. Are you sure?
                </p>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
                <button
                  onClick={() => { setShowFreeWarning(false); setPendingFreeSwitch(false) }}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmFreeSwitch}
                  className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors"
                >
                  Yes, switch to Free
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
