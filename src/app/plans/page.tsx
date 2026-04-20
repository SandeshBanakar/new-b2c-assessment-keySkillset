'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { BackButton } from '@/components/navigation/BackButton'
import PageWrapper from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { useAppContext } from '@/context/AppContext'
import {
  fetchLivePlatformPlans,
  fetchLiveCategoryPlansGrouped,
  fetchActivePlanForUser,
  type PlanRow,
  type ActivePlanInfo,
} from '@/lib/supabase/plans'
import type { ActivePlanInfo as UserActivePlanInfo } from '@/types'

// ─── Tier rank for upgrade/downgrade comparisons ──────────────────────────────

const TIER_RANK: Record<string, number> = { BASIC: 1, PRO: 2, PREMIUM: 3 }

// ─── CTA logic ────────────────────────────────────────────────────────────────

type CTAState = {
  label: string
  disabled: boolean
  style: 'primary' | 'current' | 'muted' | 'blocked'
}

function getPlanCTA(plan: PlanRow, active: ActivePlanInfo | null): CTAState {
  const defaultLabel = plan.cta_label ?? `Get ${plan.display_name ?? plan.tier}`

  if (!active) {
    return { label: defaultLabel, disabled: false, style: 'primary' }
  }

  // Current plan — match by planId (real DB users) OR by scope+tier+category (demo users with no planId)
  const isCurrentPlan =
    (active.planId !== '' && active.planId === plan.id) ||
    (active.planId === '' &&
      active.scope === plan.scope &&
      active.tier === plan.tier &&
      (plan.scope === 'PLATFORM_WIDE' || active.category === plan.category))

  if (isCurrentPlan) {
    return { label: 'Current Plan', disabled: true, style: 'current' }
  }

  // Same group = same scope + same category (or both platform-wide)
  const sameGroup =
    active.scope === plan.scope &&
    (plan.scope === 'PLATFORM_WIDE' || active.category === plan.category)

  if (sameGroup) {
    const activeRank = TIER_RANK[active.tier ?? ''] ?? 0
    const planRank   = TIER_RANK[plan.tier ?? ''] ?? 0
    if (planRank < activeRank) return { label: 'Unable to Downgrade', disabled: true,  style: 'muted'    }
    if (planRank > activeRank) return { label: `Upgrade to ${plan.display_name ?? plan.tier}`, disabled: false, style: 'primary' }
    // Same rank, same group — treat as current (safety net)
    return { label: 'Current Plan', disabled: true, style: 'current' }
  }

  // Different scope or different category
  return { label: 'Cancel current plan first', disabled: true, style: 'blocked' }
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  active,
  onUpgrade,
}: {
  plan: PlanRow
  active: ActivePlanInfo | null
  onUpgrade: (plan: PlanRow) => void
}) {
  const cta = getPlanCTA(plan, active)

  const ctaClass =
    cta.style === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : cta.style === 'current'
      ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed pointer-events-none'
      : cta.style === 'muted'
      ? 'opacity-50 cursor-not-allowed pointer-events-none border border-zinc-300 text-zinc-500'
      : 'opacity-50 cursor-not-allowed pointer-events-none border border-zinc-300 text-zinc-500'

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-sm relative flex flex-col ${
        plan.is_popular ? 'border-2 border-blue-500' : 'border border-zinc-200'
      }`}
    >
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
            Most Popular
          </span>
        </div>
      )}

      <p className="text-xl font-semibold text-zinc-900">{plan.display_name ?? plan.name}</p>

      {plan.tagline && (
        <p className="text-xs text-zinc-500 mt-1">{plan.tagline}</p>
      )}

      <p className="text-3xl font-semibold text-zinc-900 mt-3">
        ₹{plan.price.toLocaleString('en-IN')}
        <span className="text-base font-normal text-zinc-500">/month</span>
      </p>
      <p className="text-xs text-zinc-400 mt-0.5 mb-4">Billed monthly</p>

      <ul className="mt-2 space-y-2 flex-1">
        {(plan.feature_bullets ?? []).map((bullet, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            {bullet}
          </li>
        ))}
      </ul>

      <button
        onClick={() => !cta.disabled && onUpgrade(plan)}
        disabled={cta.disabled}
        className={`w-full mt-6 rounded-xl py-3 font-semibold text-base transition-colors ${ctaClass}`}
      >
        {cta.label}
      </button>

      {plan.footnote && (
        <p className="text-xs text-zinc-400 text-center mt-2">{plan.footnote}</p>
      )}
    </div>
  )
}

// ─── Category accordion ───────────────────────────────────────────────────────

function CategoryAccordion({
  category,
  plans,
  active,
  onUpgrade,
  highlighted,
}: {
  category: string
  plans: PlanRow[]
  active: ActivePlanInfo | null
  onUpgrade: (plan: PlanRow) => void
  highlighted?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [ring, setRing] = useState(highlighted ?? false)

  useEffect(() => {
    if (!highlighted) return
    const t = setTimeout(() => setRing(false), 2000)
    return () => clearTimeout(t)
  }, [highlighted])

  const basicPlan  = plans.find((p) => p.tier === 'BASIC')
  const proPlan    = plans.find((p) => p.tier === 'PRO')
  const premiumPlan = plans.find((p) => p.tier === 'PREMIUM')

  const isActiveCategory = active?.scope === 'CATEGORY_BUNDLE' && active.category === category

  return (
    <div
      id={`category-${category.toLowerCase()}`}
      className={`border rounded-2xl overflow-hidden transition-shadow duration-300 ${isActiveCategory ? 'border-blue-300 bg-blue-50/30' : 'border-zinc-200 bg-white'} ${ring ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-zinc-900">{category}</span>
          {isActiveCategory && (
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
          <span className="text-sm text-zinc-400">
            {basicPlan && proPlan && premiumPlan
              ? `Basic ₹${basicPlan.price} · Pro ₹${proPlan.price} · Premium ₹${premiumPlan.price}`
              : `from ₹${plans[0]?.price ?? 0}/mo`}
          </span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} active={active} onUpgrade={onUpgrade} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function PlansContent() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const highlight     = searchParams.get('highlight')?.toUpperCase() ?? null
  const { user }      = useAppContext()
  const scrolledRef   = useRef(false)

  const [platformPlans, setPlatformPlans]   = useState<PlanRow[]>([])
  const [categoryPlans, setCategoryPlans]   = useState<Record<string, PlanRow[]>>({})
  const [activePlan, setActivePlan]         = useState<ActivePlanInfo | null>(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    Promise.all([
      fetchLivePlatformPlans(),
      fetchLiveCategoryPlansGrouped(),
      fetchActivePlanForUser(user.id),
    ])
      .then(([platform, category, active]) => {
        setPlatformPlans(platform)
        setCategoryPlans(category)

        // Real DB subscription found — use it
        if (active) {
          setActivePlan(active)
          return
        }

        // Fallback for demo users: build ActivePlanInfo from user context (no DB record)
        // planId='' is a sentinel — matched by scope+tier+category in getPlanCTA
        const upi = user.activePlanInfo as UserActivePlanInfo | null | undefined
        if (upi) {
          setActivePlan({
            planId: '',
            scope: upi.scope,
            category: upi.category,
            tier: upi.tier as ActivePlanInfo['tier'],
          })
        } else {
          setActivePlan(null)
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  // Scroll to highlighted category after load
  useEffect(() => {
    if (!highlight || loading || scrolledRef.current) return
    const el = document.getElementById(`category-${highlight.toLowerCase()}`)
    if (el) {
      scrolledRef.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlight, loading])

  if (!user) return null

  function handleUpgrade(plan: PlanRow) {
    router.push(`/checkout?plan=${plan.id}`)
  }

  const categoryEntries = Object.entries(categoryPlans)

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <BackButton />
      </div>

      <PageWrapper>
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-zinc-900">Choose Your Plan</h1>
          <p className="text-zinc-500 text-sm mt-2">
            Unlock assessments for SAT, JEE, NEET, and more
          </p>
        </div>

        {/* Global warning banner */}
        <div className="mt-2 mb-8 max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-sm text-center">
            Currently, you cannot downgrade your plan. Choose wisely.
          </p>
        </div>

        {/* Loading / error states */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-600 text-center py-10">{error}</p>
        )}

        {!loading && !error && (
          <>
            {/* ── Platform-wide plans ── */}
            <div className="mb-4">
              <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
                Platform Plans — All Exams
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {platformPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    active={activePlan}
                    onUpgrade={handleUpgrade}
                  />
                ))}
              </div>
            </div>

            {/* ── Category plans ── */}
            {categoryEntries.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
                  Category Plans — Exam Specific
                </h2>
                <p className="text-sm text-zinc-500 mb-6">
                  Focused plans for a single exam — AI-powered analytics, concept mastery, and personalised next steps.
                </p>
                <div className="space-y-3">
                  {categoryEntries.map(([category, plans]) => (
                    <CategoryAccordion
                      key={category}
                      category={category}
                      plans={plans}
                      active={activePlan}
                      onUpgrade={handleUpgrade}
                      highlighted={highlight === category.toUpperCase()}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </PageWrapper>
    </div>
  )
}

export default function PlansPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
        <PlansContent />
      </Suspense>
    </AuthGuard>
  )
}
