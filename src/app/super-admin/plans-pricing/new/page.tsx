'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, GripVertical, Info, Plus, Trash2 } from 'lucide-react'
import { createPlan, createB2BPlan } from '@/lib/supabase/plans'

type AssessmentType = 'FULL_TEST' | 'SUBJECT_TEST' | 'CHAPTER_TEST'

const ASSESSMENT_TYPE_OPTIONS: { value: AssessmentType; label: string; description: string }[] = [
  { value: 'FULL_TEST',    label: 'Full Tests',    description: 'Complete mock exams' },
  { value: 'SUBJECT_TEST', label: 'Subject Tests', description: 'Single-subject assessments' },
  { value: 'CHAPTER_TEST', label: 'Chapter Tests', description: 'Topic-level short tests' },
]

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-zinc-100 text-zinc-600 text-xs font-semibold shrink-0 mt-0.5">
        {number}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

// ─── B2C Form ─────────────────────────────────────────────────────────────────

function B2CForm() {
  const router = useRouter()

  // Section 1 — Identity
  const [name, setName]             = useState('')
  const [displayName, setDisplayName] = useState('')
  const [tagline, setTagline]       = useState('')
  const [isPopular, setIsPopular]   = useState(false)
  const [ctaLabel, setCtaLabel]     = useState('')

  // Section 2 — Scope
  const [scope, setScope]       = useState<'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'>('PLATFORM_WIDE')
  const [category, setCategory] = useState<string | null>(null)

  // Section 3 — Pricing
  const [price, setPrice] = useState<number | ''>('')

  // Section 4 — Access Rules
  const [allowedTypes, setAllowedTypes] = useState<AssessmentType[]>([])
  const [maxAttempts, setMaxAttempts]   = useState<number>(5)

  // Section 5 — Feature Bullets + Footnote
  const [bullets, setBullets]   = useState<string[]>(['', '', ''])
  const [footnote, setFootnote] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [showToast, setShowToast]   = useState(false)

  function toggleAssessmentType(type: AssessmentType) {
    setAllowedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  function addBullet() {
    if (bullets.length < 7) setBullets((prev) => [...prev, ''])
  }

  function removeBullet(index: number) {
    if (bullets.length <= 1) return
    setBullets((prev) => prev.filter((_, i) => i !== index))
  }

  function updateBullet(index: number, value: string) {
    setBullets((prev) => prev.map((b, i) => (i === index ? value.slice(0, 80) : b)))
  }

  function validate(): string | null {
    if (!name.trim()) return 'Plan name is required.'
    if (price === '' || price < 0) return 'Price must be 0 or a positive number.'
    if (allowedTypes.length === 0) return 'Select at least one allowed assessment type.'
    if (scope === 'CATEGORY_BUNDLE' && !category)
      return 'Select an exam category for this Category Bundle plan.'
    if (maxAttempts < 1 || maxAttempts > 99) return 'Max attempts must be between 1 and 99.'
    return null
  }

  async function handleSubmit(status: 'DRAFT' | 'PUBLISHED') {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setSubmitting(true)
    try {
      await createPlan({
        name:                        name.trim(),
        display_name:                displayName.trim() || null,
        description:                 null,
        tagline:                     tagline.trim() || null,
        is_popular:                  isPopular,
        cta_label:                   ctaLabel.trim() || null,
        scope,
        category:                    scope === 'CATEGORY_BUNDLE' ? category : null,
        price:                       price as number,
        billing_cycle:               'MONTHLY',
        status,
        max_attempts_per_assessment: maxAttempts,
        feature_bullets:             bullets.filter((b) => b.trim()),
        footnote:                    footnote.trim() || null,
        plan_audience:               'B2C',
      })
      if (status === 'PUBLISHED') {
        setShowToast(true)
        setTimeout(() => {
          setShowToast(false)
          router.push('/super-admin/plans-pricing')
        }, 3000)
      } else {
        router.push('/super-admin/plans-pricing')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-3 rounded-md shadow-lg flex items-center gap-2">
          <span className="text-emerald-400">✓</span>
          Stripe Product created (simulated) — plan is live
        </div>
      )}

      <div className="space-y-4">

        {/* SECTION 1 — Plan Identity */}
        <div className="bg-white border border-zinc-200 rounded-md p-6">
          <SectionHeading
            number="1"
            title="Plan Identity"
            subtitle="Internal name, customer-facing name, and marketing copy."
          />
          <div className="space-y-4">
            <div>
              <FieldLabel label="Plan name (internal)" required />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. All Exams Pro"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <FieldLabel label="Display name (customer-facing)" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Pro Plan"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Shown on pricing page. Defaults to plan name if blank.
              </p>
            </div>
            <div>
              <FieldLabel label="Tagline" />
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Everything you need to crack the exam"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsPopular((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${isPopular ? 'bg-blue-700' : 'bg-zinc-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPopular ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
              <span className="text-sm text-zinc-700">Mark as &ldquo;Most Popular&rdquo;</span>
            </div>
            <div>
              <FieldLabel label="CTA button label override" />
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Get Started (default)"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 — Plan Scope */}
        <div className="bg-white border border-zinc-200 rounded-md p-6">
          <SectionHeading
            number="2"
            title="Plan Scope"
            subtitle="Platform-wide covers all categories. Category Bundle is locked to one exam."
          />
          <div className="space-y-4">
            <div>
              <FieldLabel label="Plan scope" required />
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'PLATFORM_WIDE',    label: 'Platform-wide',    description: 'All exam categories included' },
                    { value: 'CATEGORY_BUNDLE',  label: 'Category Bundle',  description: 'One exam category only' },
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
                    <span className="text-xs text-zinc-400 mt-0.5">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
            {scope === 'CATEGORY_BUNDLE' && (
              <div>
                <FieldLabel label="Exam category" required />
                <div className="flex flex-wrap gap-2">
                  {['SAT', 'NEET', 'JEE', 'CLAT', 'PMP'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                        category === cat
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3 — Pricing */}
        <div className="bg-white border border-zinc-200 rounded-md p-6">
          <SectionHeading
            number="3"
            title="Pricing"
            subtitle="Set the monthly price. Stripe Product is created on publish."
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel label="Price (₹/month)" required />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="299"
                  className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-zinc-400 mt-1">Enter 0 for a free plan</p>
            </div>
            <div>
              <FieldLabel label="Billing cycle" />
              <div className="flex items-center px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md h-9">
                <span className="text-sm text-zinc-500">Monthly</span>
                <span className="text-xs text-zinc-400 ml-2">— Annual billing V2</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4 — Access Rules */}
        <div className="bg-white border border-zinc-200 rounded-md p-6">
          <SectionHeading
            number="4"
            title="Access Rules"
            subtitle="Define allowed assessment types and attempt limits."
          />
          <div className="space-y-5">
            <div>
              <FieldLabel label="Allowed assessment types" required />
              <div className="grid grid-cols-3 gap-2 mt-1">
                {ASSESSMENT_TYPE_OPTIONS.map((opt) => {
                  const isSelected = allowedTypes.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleAssessmentType(opt.value)}
                      className={`flex flex-col items-start px-3 py-2.5 rounded-md border text-left transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-zinc-700'}`}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-zinc-400 mt-0.5">{opt.description}</span>
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
                  className="w-24 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Info className="w-3.5 h-3.5" />
                  Free attempt always included (1 per assessment, all tiers)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5 — Feature Bullets + Footnote */}
        <div className="bg-white border border-zinc-200 rounded-md p-6">
          <SectionHeading
            number="5"
            title="Feature Bullets & Footnote"
            subtitle="Marketing copy for the pricing card. Max 7 bullets, 80 chars each."
          />
          <div className="space-y-4">
            <div>
              <FieldLabel label="Feature bullets" />
              <div className="space-y-2">
                {bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-zinc-300 shrink-0" />
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => updateBullet(idx, e.target.value)}
                        placeholder={`Feature ${idx + 1}`}
                        maxLength={80}
                        className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent pr-12"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-300">
                        {bullet.length}/80
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBullet(idx)}
                      disabled={bullets.length <= 1}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addBullet}
                disabled={bullets.length >= 7}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Bullet
                <span className="text-zinc-400 ml-0.5">({bullets.length} of 7 max)</span>
              </button>
            </div>
            <div>
              <FieldLabel label="Footnote" />
              <input
                type="text"
                value={footnote}
                onChange={(e) => setFootnote(e.target.value)}
                placeholder="e.g. Cancel anytime. No credit card required."
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Small print below the CTA button on the pricing card.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-md px-4 py-3">
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push('/super-admin/plans-pricing')}
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('DRAFT')}
              className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('PUBLISHED')}
              className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Publishing...' : 'Publish Plan'}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}

// ─── B2B Form ─────────────────────────────────────────────────────────────────

function B2BForm() {
  const router = useRouter()

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [maxAttempts, setMaxAttempts] = useState<number>(10)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function validate(): string | null {
    if (!name.trim()) return 'Plan name is required.'
    if (maxAttempts < 1 || maxAttempts > 99) return 'Max attempts must be between 1 and 99.'
    return null
  }

  async function handleSubmit(status: 'DRAFT' | 'PUBLISHED') {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setSubmitting(true)
    try {
      await createB2BPlan({
        name:                        name.trim(),
        description:                 description.trim(),
        max_attempts_per_assessment: maxAttempts,
        status,
      })
      router.push('/super-admin/plans-pricing')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* SECTION 1 — Plan Identity */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading
          number="1"
          title="Plan Identity"
          subtitle="Name and describe this B2B plan."
        />
        <div className="space-y-4">
          <div>
            <FieldLabel label="Plan name" required />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Akash Standard"
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <div>
            <FieldLabel label="Description" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this plan provides to the tenant's learners..."
              rows={3}
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2 — Scope (read-only) */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading
          number="2"
          title="Plan Scope"
          subtitle="B2B plans are always platform-wide. This cannot be changed."
        />
        <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-md w-fit">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Platform-wide
          </span>
          <span className="text-xs text-zinc-500">All assessment types and categories included</span>
        </div>
      </div>

      {/* SECTION 3 — Pricing (read-only callout) */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading
          number="3"
          title="Pricing"
          subtitle="B2B plan pricing is managed per-tenant via the Contract tab."
        />
        <div className="flex items-start gap-2.5 bg-zinc-50 border border-zinc-200 rounded-md px-4 py-3">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-600">
            B2B plans are billed via tenant contracts (ARR). No price is stored on the plan itself.
            Set and manage billing in the tenant&apos;s{' '}
            <span className="font-medium text-zinc-700">Contract tab</span>.
          </p>
        </div>
      </div>

      {/* SECTION 4 — Access Rules */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading
          number="4"
          title="Access Rules"
          subtitle="B2B plans grant access to all assessment types. Set the attempt limit."
        />
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {ASSESSMENT_TYPE_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md"
              >
                <span className="text-xs font-medium text-blue-700">{opt.label}</span>
              </div>
            ))}
            <span className="text-xs text-zinc-400">All types included — not configurable</span>
          </div>
          <div>
            <FieldLabel label="Max attempts per assessment" />
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={99}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-24 border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Info className="w-3.5 h-3.5" />
                Editable after creation from the plan detail page
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-md px-4 py-3">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push('/super-admin/plans-pricing')}
          className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('DRAFT')}
            className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('PUBLISHED')}
            className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Publishing...' : 'Publish Plan'}
          </button>
        </div>
      </div>

    </div>
  )
}

// ─── Inner component (uses useSearchParams — must be wrapped in Suspense) ─────

function NewPlanInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const audience     = searchParams.get('audience') === 'B2B' ? 'B2B' : 'B2C'

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/super-admin/plans-pricing')}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Plans
        </button>
        <h1 className="text-xl font-semibold text-zinc-900">
          {audience === 'B2B' ? 'Create B2B Plan' : 'Create B2C Plan'}
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {audience === 'B2B'
            ? 'Define a platform-wide B2B plan. Assign it to tenants from their Plans tab.'
            : 'Define the plan identity, scope, pricing, and access rules.'}
        </p>
      </div>

      {audience === 'B2B' ? <B2BForm /> : <B2CForm />}

    </div>
  )
}

// ─── Page export ───────────────────────────────────────────────────────────────

export default function NewPlanPage() {
  return (
    <Suspense>
      <NewPlanInner />
    </Suspense>
  )
}
