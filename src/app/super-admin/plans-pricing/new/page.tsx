'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Info } from 'lucide-react'
import {
  createPlan,
  assignContentToPlan,
} from '@/lib/supabase/plans'
import { ContentAssignmentPicker } from '@/components/plans/ContentAssignmentPicker'

type AssessmentType = 'FULL_TEST' | 'SUBJECT_TEST' | 'CHAPTER_TEST'

const ASSESSMENT_TYPE_OPTIONS: {
  value: AssessmentType
  label: string
  description: string
}[] = [
  {
    value: 'FULL_TEST',
    label: 'Full Tests',
    description: 'Complete mock exams',
  },
  {
    value: 'SUBJECT_TEST',
    label: 'Subject Tests',
    description: 'Single-subject assessments',
  },
  {
    value: 'CHAPTER_TEST',
    label: 'Chapter Tests',
    description: 'Topic-level short tests',
  },
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
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

function FieldLabel({
  label,
  required,
}: {
  label: string
  required?: boolean
}) {
  return (
    <label className="block text-xs font-medium text-zinc-600 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

export default function NewPlanPage() {
  const router = useRouter()

  // Section 1 — Identity
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // Section 2 — Pricing
  const [price, setPrice] = useState<number | ''>('')
  const billingCycle = 'MONTHLY'

  // Section 3 — Assessment Access
  const [scope, setScope] = useState<'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'>(
    'PLATFORM_WIDE'
  )
  const [category, setCategory] = useState<string | null>(null)
  const [allowedTypes, setAllowedTypes] = useState<AssessmentType[]>([])
  const [maxAttempts, setMaxAttempts] = useState<number>(5)

  // Section 4 — Content
  const [selectedContent, setSelectedContent] = useState<string[]>([])

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showStripeToast, setShowStripeToast] = useState(false)
  const [showEmptyContentWarning, setShowEmptyContentWarning] = useState(false)

  function toggleAssessmentType(type: AssessmentType) {
    setAllowedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    )
  }

  function validate(): string | null {
    if (!name.trim()) return 'Plan name is required.'
    if (price === '' || price < 0) return 'Price must be 0 or a positive number.'
    if (allowedTypes.length === 0)
      return 'Select at least one allowed assessment type.'
    if (scope === 'CATEGORY_BUNDLE' && !category)
      return 'Select an exam category for this Category Bundle plan.'
    if (maxAttempts < 1 || maxAttempts > 20)
      return 'Max attempts must be between 1 and 20.'
    return null
  }

  async function handleSubmit(status: 'DRAFT' | 'PUBLISHED') {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    if (status === 'PUBLISHED' && selectedContent.length === 0) {
      setShowEmptyContentWarning(true)
      // Non-blocking — user can still proceed after seeing the warning
    } else {
      setShowEmptyContentWarning(false)
    }

    setError(null)
    setSubmitting(true)

    try {
      // Step 1 — Insert plan row, capture UUID
      const planId = await createPlan({
        name:                        name.trim(),
        description:                 description.trim(),
        price:                       price as number,
        billing_cycle:               billingCycle,
        status,
        max_attempts_per_assessment: maxAttempts,
        allowed_assessment_types:    allowedTypes,
        scope,
        category: scope === 'CATEGORY_BUNDLE' ? category : null,
      })

      // Step 2 — Insert content map rows using the UUID from Step 1
      await assignContentToPlan(planId, selectedContent)

      // Stripe simulation — only on Publish
      if (status === 'PUBLISHED') {
        setShowStripeToast(true)
        setTimeout(() => {
          setShowStripeToast(false)
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
    <div className="p-8 max-w-3xl mx-auto">

      {/* Stripe simulation toast */}
      {showStripeToast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-3 rounded-md shadow-lg flex items-center gap-2">
          <span className="text-emerald-400">✓</span>
          Stripe Product created (simulated) — plan is live
        </div>
      )}

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
          Create New Plan
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Define the plan identity, pricing, access rules, and content.
        </p>
      </div>

      <div className="space-y-0">

        {/* SECTION 1 — Plan Identity */}
        <div className="bg-white border border-zinc-200 rounded-md p-6 mb-4">
          <SectionHeading
            number="1"
            title="Plan Identity"
            subtitle="Name and describe this plan."
          />
          <div className="space-y-4">
            <div>
              <FieldLabel label="Plan name" required />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. All Exams Pro"
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <FieldLabel label="Description" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this plan includes..."
                rows={3}
                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 — Pricing */}
        <div className="bg-white border border-zinc-200 rounded-md p-6 mb-4">
          <SectionHeading
            number="2"
            title="Pricing"
            subtitle="Set the monthly price. Stripe Product is created on publish."
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel label="Price (₹/month)" required />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  placeholder="299"
                  className="w-full border border-zinc-200 rounded-md pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Enter 0 for a free plan
              </p>
            </div>

            <div>
              <FieldLabel label="Billing cycle" />
              <div className="flex items-center px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md h-[38px]">
                <span className="text-sm text-zinc-500">Monthly</span>
                <span className="text-xs text-zinc-400 ml-2">
                  — Annual billing V2
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 — Assessment Access */}
        <div className="bg-white border border-zinc-200 rounded-md p-6 mb-4">
          <SectionHeading
            number="3"
            title="Assessment Access"
            subtitle="Define the scope, allowed assessment types, and attempt limits."
          />
          <div className="space-y-5">

            {/* Scope toggle */}
            <div>
              <FieldLabel label="Plan scope" required />
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      value: 'PLATFORM_WIDE',
                      label: 'Platform-wide',
                      description: 'All exam categories included',
                    },
                    {
                      value: 'CATEGORY_BUNDLE',
                      label: 'Category Bundle',
                      description: 'One exam category only',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setScope(opt.value)
                      if (opt.value === 'PLATFORM_WIDE') setCategory(null)
                    }}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-md border text-left transition-colors ${
                      scope === opt.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        scope === opt.value ? 'text-blue-900' : 'text-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs text-zinc-400 mt-0.5">
                      {opt.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category selector — only when CATEGORY_BUNDLE */}
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

            {/* Assessment type checkboxes */}
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
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? 'text-blue-900' : 'text-zinc-700'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-xs text-zinc-400 mt-0.5">
                        {opt.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Max attempts */}
            <div>
              <FieldLabel label="Max paid attempts per assessment" />
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={20}
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

        {/* SECTION 4 — Content Assignment */}
        <div className="bg-white border border-zinc-200 rounded-md p-6 mb-6">
          <SectionHeading
            number="4"
            title="Content Assignment"
            subtitle="Optional at creation. Assign live assessments to this plan. Courses coming soon."
          />

          <ContentAssignmentPicker
            selected={selectedContent}
            onChange={setSelectedContent}
          />

          {selectedContent.length > 0 && (
            <p className="text-xs text-zinc-500 mt-3">
              {selectedContent.length} assessment
              {selectedContent.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Empty content warning — non-blocking */}
        {showEmptyContentWarning && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-4 py-3 mb-4">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              No content assigned. Learners will see this plan but cannot
              access any assessments. You can assign content from the plan
              detail page after publishing.
            </p>
          </div>
        )}

        {/* Validation error */}
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-md px-4 py-3 mb-4">
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        )}

        {/* Action buttons */}
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
    </div>
  )
}
