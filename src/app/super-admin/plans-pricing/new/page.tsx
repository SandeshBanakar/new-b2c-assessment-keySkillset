'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, GripVertical, Info, Plus, Trash2, Search } from 'lucide-react'
import {
  createPlan,
  createB2BPlan,
  createCourseBundlePlan,
  createSingleCoursePlan,
  addContentToPlan,
  fetchAllLiveB2BAssessments,
  fetchAllLiveB2BCourses,
  fetchAllLiveB2CAssessments,
  fetchAllLiveB2CCoursesForBundle,
  type B2CCourseBundlePickerItem,
} from '@/lib/supabase/plans'

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

  // Section 6 — Assessments
  const [assessments, setAssessments]           = useState<{ id: string; title: string; assessmentType: string }[]>([])
  const [assessmentSearch, setAssessmentSearch] = useState('')
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set())
  const [assessmentsLoading, setAssessmentsLoading]   = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [showToast, setShowToast]   = useState(false)

  useEffect(() => {
    fetchAllLiveB2CAssessments()
      .then(setAssessments)
      .finally(() => setAssessmentsLoading(false))
  }, [])

  function toggleAssessmentType(type: AssessmentType) {
    setAllowedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  function toggleAssessment(id: string) {
    setSelectedAssessments((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
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
      const planId = await createPlan({
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
      if (selectedAssessments.size > 0) {
        await Promise.all(
          Array.from(selectedAssessments).map((id) => addContentToPlan(planId, id, 'ASSESSMENT'))
        )
      }
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

        {/* SECTION 6 — Assessments */}
        <div className="bg-white border border-zinc-200 rounded-md p-6">
          <SectionHeading
            number="6"
            title="Assessments"
            subtitle="Optionally add LIVE B2C assessments now. You can always add more from the plan detail page."
          />
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
            <div className="max-h-52 overflow-y-auto">
              {assessmentsLoading ? (
                <div className="p-3 space-y-2">
                  {[0, 1, 2].map((i) => <div key={i} className="h-9 rounded bg-zinc-100 animate-pulse" />)}
                </div>
              ) : assessments.filter((a) => a.title.toLowerCase().includes(assessmentSearch.toLowerCase())).length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">
                  {assessments.length === 0 ? 'No live B2C assessments available.' : 'No matches.'}
                </p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {assessments
                    .filter((a) => a.title.toLowerCase().includes(assessmentSearch.toLowerCase()))
                    .map((a) => (
                      <label key={a.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 cursor-pointer">
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
                  {selectedAssessments.size} assessment{selectedAssessments.size !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
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

// ─── Inline content picker (used inside B2BForm Section 5) ──────────────────
function ContentPicker({
  label,
  items,
  loading,
  selected,
  onToggle,
}: {
  label: string
  items: { id: string; title: string; sub: string }[]
  loading: boolean
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</p>
        {selected.size > 0 && (
          <span className="text-xs font-medium text-blue-700">{selected.size} selected</span>
        )}
      </div>
      <div className="border border-zinc-200 rounded-md overflow-hidden">
        <div className="relative border-b border-zinc-200">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder={`Search ${label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-8 rounded bg-zinc-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">
              {items.length === 0 ? `No live B2B ${label.toLowerCase()} available.` : 'No matches.'}
            </p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filtered.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => onToggle(item.id)}
                    className="accent-blue-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">{item.title}</p>
                    <p className="text-xs text-zinc-400">{item.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function B2BForm() {
  const router = useRouter()

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [maxAttempts, setMaxAttempts] = useState<number>(10)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Section 5 — Content
  const [assessments, setAssessments] = useState<{ id: string; title: string; sub: string }[]>([])
  const [courses, setCourses]         = useState<{ id: string; title: string; sub: string }[]>([])
  const [contentLoading, setContentLoading] = useState(true)
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set())
  const [selectedCourses, setSelectedCourses]         = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([fetchAllLiveB2BAssessments(), fetchAllLiveB2BCourses()])
      .then(([a, c]) => {
        setAssessments(a.map((x) => ({ id: x.id, title: x.title, sub: x.assessmentType })))
        setCourses(c.map((x) => ({ id: x.id, title: x.title, sub: x.courseType })))
      })
      .finally(() => setContentLoading(false))
  }, [])

  function toggleAssessment(id: string) {
    setSelectedAssessments((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function toggleCourse(id: string) {
    setSelectedCourses((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

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
      const planId = await createB2BPlan({
        name:                        name.trim(),
        description:                 description.trim(),
        max_attempts_per_assessment: maxAttempts,
        status,
      })
      // Add selected content after plan creation
      await Promise.all([
        ...Array.from(selectedAssessments).map((id) => addContentToPlan(planId, id, 'ASSESSMENT')),
        ...Array.from(selectedCourses).map((id) => addContentToPlan(planId, id, 'COURSE')),
      ])
      router.push(`/super-admin/plans-pricing/${planId}`)
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

      {/* SECTION 5 — Content */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading
          number="5"
          title="Content"
          subtitle="Optionally add assessments and courses now. You can always add more from the plan detail page."
        />
        <div className="space-y-5">
          <ContentPicker
            label="Assessments"
            items={assessments}
            loading={contentLoading}
            selected={selectedAssessments}
            onToggle={toggleAssessment}
          />
          <ContentPicker
            label="Courses"
            items={courses}
            loading={contentLoading}
            selected={selectedCourses}
            onToggle={toggleCourse}
          />
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

// ─── Course Bundle Form ────────────────────────────────────────────────────────

function CourseBundleForm() {
  const router = useRouter()

  // Section 1 — Identity
  const [name, setName]               = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [tagline, setTagline]         = useState('')

  // Section 2 — Pricing
  const [price, setPrice]               = useState<number | ''>('')
  const [billingCycle, setBillingCycle] = useState<'ANNUAL' | 'MONTHLY'>('ANNUAL')
  const [stripePriceId, setStripePriceId] = useState('')

  // Section 3 — Feature Bullets
  const [bullets, setBullets]   = useState<string[]>(['', '', ''])
  const [footnote, setFootnote] = useState('')

  // Section 4 — Courses
  const [courseItems, setCourseItems]         = useState<B2CCourseBundlePickerItem[]>([])
  const [contentLoading, setContentLoading]   = useState(true)
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [courseSearch, setCourseSearch]       = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    fetchAllLiveB2CCoursesForBundle()
      .then(setCourseItems)
      .finally(() => setContentLoading(false))
  }, [])

  function addBullet() { if (bullets.length < 7) setBullets((p) => [...p, '']) }
  function removeBullet(i: number) { if (bullets.length > 1) setBullets((p) => p.filter((_, idx) => idx !== i)) }
  function updateBullet(i: number, v: string) { setBullets((p) => p.map((b, idx) => idx === i ? v.slice(0, 80) : b)) }

  function toggleCourse(id: string) {
    setSelectedCourses((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const filteredCourses = courseItems.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  )

  function validate(): string | null {
    if (!name.trim()) return 'Plan name is required.'
    if (price === '' || price < 0) return 'Price must be 0 or a positive number.'
    return null
  }

  async function handleSubmit(status: 'DRAFT' | 'PUBLISHED') {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setSubmitting(true)
    try {
      const planId = await createCourseBundlePlan({
        name:            name.trim(),
        display_name:    displayName.trim() || null,
        description:     description.trim() || null,
        tagline:         tagline.trim() || null,
        price:           price as number,
        billing_cycle:   billingCycle,
        feature_bullets: bullets.filter((b) => b.trim()),
        stripe_price_id: stripePriceId.trim() || null,
        status,
      })
      await Promise.all(
        Array.from(selectedCourses).map((id) => addContentToPlan(planId, id, 'COURSE'))
      )
      router.push(`/super-admin/plans-pricing/${planId}`)
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
        <SectionHeading number="1" title="Plan Identity" subtitle="Internal name, customer-facing name, and marketing copy." />
        <div className="space-y-4">
          <div>
            <FieldLabel label="Plan name (internal)" required />
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Healthcare Learning Bundle"
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <div>
            <FieldLabel label="Display name (customer-facing)" />
            <input
              type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Healthcare Bundle"
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <p className="text-xs text-zinc-400 mt-1">Shown on pricing page. Defaults to plan name if blank.</p>
          </div>
          <div>
            <FieldLabel label="Description" />
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this bundle includes..."
              rows={2}
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>
          <div>
            <FieldLabel label="Tagline" />
            <input
              type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Master compliance in one go"
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2 — Pricing */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading number="2" title="Pricing" subtitle="Annual subscription price. Stripe Price ID is the recurring annual price." />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Price (₹/year)" required />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
              <input
                type="number" min={0} value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="4999"
                className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
        <div className="mt-4">
          <FieldLabel label="Stripe Price ID" />
          <input
            type="text" value={stripePriceId} onChange={(e) => setStripePriceId(e.target.value)}
            placeholder="price_annual_..."
            className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <p className="text-xs text-zinc-400 mt-1">Recurring annual Stripe Price ID for checkout.</p>
        </div>
      </div>

      {/* SECTION 3 — Feature Bullets */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading number="3" title="Feature Bullets & Footnote" subtitle="Marketing copy for the pricing card. Max 7 bullets, 80 chars each." />
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
              type="text" value={footnote} onChange={(e) => setFootnote(e.target.value)}
              placeholder="e.g. Annual subscription. Renews automatically."
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4 — Courses */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading
          number="4"
          title="Courses"
          subtitle="Select LIVE B2C courses to include in this bundle. You can add more from the plan detail page."
        />
        <div className="border border-zinc-200 rounded-md overflow-hidden">
          <div className="relative border-b border-zinc-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text" placeholder="Search courses..."
              value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {contentLoading ? (
              <div className="p-3 space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-10 rounded bg-zinc-100 animate-pulse" />)}
              </div>
            ) : filteredCourses.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">
                {courseItems.length === 0 ? 'No live B2C courses available.' : 'No matches.'}
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filteredCourses.map((course) => (
                  <label key={course.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 cursor-pointer">
                    <input
                      type="checkbox" checked={selectedCourses.has(course.id)}
                      onChange={() => toggleCourse(course.id)} className="accent-blue-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 truncate">{course.title}</p>
                      <p className="text-xs text-zinc-400">
                        {course.courseType}
                        {course.isIndividuallyPurchasable && (
                          <span className="ml-2 text-amber-600">· Also sold individually</span>
                        )}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedCourses.size > 0 && (
            <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-2">
              <p className="text-xs text-blue-700 font-medium">
                {selectedCourses.size} course{selectedCourses.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
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
            type="button" disabled={submitting} onClick={() => handleSubmit('DRAFT')}
            className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
          <button
            type="button" disabled={submitting} onClick={() => handleSubmit('PUBLISHED')}
            className="px-4 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Publishing...' : 'Publish Plan'}
          </button>
        </div>
      </div>

    </div>
  )
}

// ─── Single Course Plan Form ───────────────────────────────────────────────────

function SingleCoursePlanForm() {
  const router = useRouter()

  const [name, setName]               = useState('')
  const [displayName, setDisplayName] = useState('')
  const [price, setPrice]             = useState<number | ''>('')
  const [priceUsd, setPriceUsd]       = useState<number | ''>('')
  const [stripePriceId, setStripePriceId] = useState('')

  const [courseItems, setCourseItems]         = useState<B2CCourseBundlePickerItem[]>([])
  const [contentLoading, setContentLoading]   = useState(true)
  const [selectedCourse, setSelectedCourse]   = useState<string | null>(null)
  const [courseSearch, setCourseSearch]       = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    fetchAllLiveB2CCoursesForBundle()
      .then(setCourseItems)
      .finally(() => setContentLoading(false))
  }, [])

  const filteredCourses = courseItems.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  )

  function validate(): string | null {
    if (!name.trim()) return 'Plan name is required.'
    if (price === '' || Number(price) < 0) return 'Price (₹) must be 0 or a positive number.'
    if (priceUsd === '' || Number(priceUsd) < 0) return 'Price (USD) must be 0 or a positive number.'
    return null
  }

  async function handleSubmit(status: 'DRAFT' | 'PUBLISHED') {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setSubmitting(true)
    try {
      const planId = await createSingleCoursePlan({
        name:            name.trim(),
        display_name:    displayName.trim() || null,
        price:           price as number,
        price_usd:       priceUsd as number,
        stripe_price_id: stripePriceId.trim() || null,
        status,
      })
      if (selectedCourse) {
        await addContentToPlan(planId, selectedCourse, 'COURSE')
        // Sync purchasable flag + prices to course when publishing
        if (status === 'PUBLISHED') {
          const { syncCourseFromPlan } = await import('@/lib/supabase/plans')
          await syncCourseFromPlan(selectedCourse, {
            price:           price as number,
            price_usd:       priceUsd as number,
            stripe_price_id: stripePriceId.trim() || null,
            status,
          })
        }
      }
      router.push(`/super-admin/plans-pricing/${planId}`)
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
        <SectionHeading number="1" title="Plan Identity" subtitle="Name for this single-course plan." />
        <div className="space-y-4">
          <div>
            <FieldLabel label="Plan name (internal)" required />
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HIPAA Compliance — Individual"
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <div>
            <FieldLabel label="Display name (customer-facing)" />
            <input
              type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. HIPAA Compliance"
              className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2 — Course */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading number="2" title="Course" subtitle="Select the single B2C course this plan provides access to." />
        <div className="border border-zinc-200 rounded-md overflow-hidden">
          <div className="relative border-b border-zinc-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text" placeholder="Search courses..."
              value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {contentLoading ? (
              <div className="p-3 space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-9 rounded bg-zinc-100 animate-pulse" />)}
              </div>
            ) : filteredCourses.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">
                {courseItems.length === 0 ? 'No live B2C courses available.' : 'No matches.'}
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filteredCourses.map((course) => (
                  <label key={course.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 cursor-pointer">
                    <input
                      type="radio" name="single-course" value={course.id}
                      checked={selectedCourse === course.id}
                      onChange={() => setSelectedCourse(course.id)}
                      className="accent-blue-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 truncate">{course.title}</p>
                      <p className="text-xs text-zinc-400">{course.courseType}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3 — Pricing */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <SectionHeading number="3" title="Pricing" subtitle="Set the INR and USD prices and Stripe Price ID for this individual course plan." />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <FieldLabel label="Price (₹)" required />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
              <input
                type="number" min={0} value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="999"
                className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <FieldLabel label="Price (USD)" required />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
              <input
                type="number" min={0} step="0.01" value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="12.99"
                className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <div>
          <FieldLabel label="Stripe Price ID" />
          <input
            type="text" value={stripePriceId} onChange={(e) => setStripePriceId(e.target.value)}
            placeholder="price_annual_..."
            className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <p className="text-xs text-zinc-400 mt-1">Auto-synced to the course record on Publish.</p>
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
            type="button" disabled={submitting} onClick={() => handleSubmit('DRAFT')}
            className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
          <button
            type="button" disabled={submitting} onClick={() => handleSubmit('PUBLISHED')}
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
  const category     = searchParams.get('category')
  const isCourseBundlePlan    = audience === 'B2C' && category === 'COURSE_BUNDLE'
  const isSingleCoursePlan    = audience === 'B2C' && category === 'SINGLE_COURSE_PLAN'

  const pageTitle = audience === 'B2B'
    ? 'Create B2B Plan'
    : isCourseBundlePlan
      ? 'Create Bundle Plan'
      : isSingleCoursePlan
        ? 'Create Single Course Plan'
        : 'Create Assessment Plan'

  const pageSubtitle = audience === 'B2B'
    ? 'Define a platform-wide B2B plan. Assign it to tenants from their Plans tab.'
    : isCourseBundlePlan
      ? 'Define a B2C course bundle plan with annual subscription pricing.'
      : isSingleCoursePlan
        ? 'Create a plan for individual access to a single B2C course.'
        : 'Define the plan identity, scope, pricing, and access rules.'

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
        <h1 className="text-xl font-semibold text-zinc-900">{pageTitle}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{pageSubtitle}</p>
      </div>

      {audience === 'B2B'
        ? <B2BForm />
        : isCourseBundlePlan
          ? <CourseBundleForm />
          : isSingleCoursePlan
            ? <SingleCoursePlanForm />
            : <B2CForm />}

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
