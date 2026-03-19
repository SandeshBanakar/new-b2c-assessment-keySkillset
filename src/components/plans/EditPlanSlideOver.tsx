'use client'

import { useState } from 'react'
import { X, GripVertical, Plus, Trash2, Info } from 'lucide-react'
import { updatePlan, writePlanAuditLog, type PlanRow } from '@/lib/supabase/plans'

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

export function EditPlanSlideOver({ plan, onClose, onSaved }: Props) {
  // Section 1 — Identity
  const [name, setName]               = useState(plan.name)
  const [displayName, setDisplayName] = useState(plan.display_name ?? '')
  const [tagline, setTagline]         = useState(plan.tagline ?? '')
  const [isPopular, setIsPopular]     = useState(plan.is_popular)
  const [ctaLabel, setCtaLabel]       = useState(plan.cta_label ?? '')

  // Section 2 — Scope
  const [scope, setScope]       = useState<'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'>(plan.scope)
  const [category, setCategory] = useState<string | null>(plan.category)

  // Section 3 — Pricing
  const [price, setPrice] = useState(plan.price)

  // Section 4 — Access Rules
  const [allowedTypes, setAllowedTypes] = useState<AssessmentType[]>(
    (plan.allowed_assessment_types ?? []) as AssessmentType[]
  )
  const [maxAttempts, setMaxAttempts] = useState(plan.max_attempts_per_assessment ?? 5)

  // Section 5 — Feature Bullets + Footnote
  const initialBullets = Array.isArray(plan.feature_bullets) && plan.feature_bullets.length > 0
    ? plan.feature_bullets
    : ['', '', '']
  const [bullets, setBullets] = useState<string[]>(initialBullets)
  const [footnote, setFootnote] = useState(plan.footnote ?? '')

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  function toggleType(type: AssessmentType) {
    setAllowedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
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
        allowed_assessment_types:    allowedTypes,
        feature_bullets:             cleanBullets,
        footnote:                    footnote.trim() || null,
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
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white border-l border-zinc-200 z-50 flex flex-col shadow-xl">

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
