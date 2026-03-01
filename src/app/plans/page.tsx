'use client';

import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Flame,
  Zap,
  Map,
  Trophy,
  Users,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useAppContext } from '@/context/AppContext';
import type { Tier } from '@/types';

// -------------------------------------------------------
// Plan data
// -------------------------------------------------------

type PaidTier = 'basic' | 'professional' | 'premium';

const TIER_RANK: Record<Tier, number> = {
  free: 0, basic: 1, professional: 2, premium: 3,
};

const PLAN_PRICES: Record<PaidTier, string> = {
  basic:        '₹299',
  professional: '₹599',
  premium:      '₹999',
};

interface PlanDef {
  tier:          PaidTier;
  name:          string;
  features:      string[];
  isHighlighted?: boolean;
}

const PLANS: PlanDef[] = [
  {
    tier: 'basic',
    name: 'Basic',
    features: [
      'Full Tests included',
      'Daily Quiz included',
      'XP, Streaks, Levels 1–5',
      'Basic Quest Map',
      '1 Free + 5 Paid attempts per assessment',
    ],
  },
  {
    tier: 'professional',
    name: 'Professional',
    isHighlighted: true,
    features: [
      'Full Tests + Subject Tests',
      'Daily Quiz included',
      'XP, Streaks, Levels 1–8',
      'Full Quest Map + Badge Set',
      'Puzzle Mode on Subject Tests',
      '1 week Streak Freeze',
      '1 Free + 5 Paid attempts per assessment',
    ],
  },
  {
    tier: 'premium',
    name: 'Premium',
    features: [
      'Full Tests + Subject Tests + Chapter Tests',
      'Daily Quiz included',
      'All levels 1–10 + Rare Badges',
      'Puzzle Mode on all types',
      '2 week Streak Freeze',
      'Priority support + Early access',
      '1 Free + 5 Paid attempts per assessment',
    ],
  },
];

const GAMIFICATION_ITEMS = [
  { icon: Flame,  label: 'Streaks'   },
  { icon: Zap,    label: 'XP'        },
  { icon: Map,    label: 'Quest Map' },
  { icon: Trophy, label: 'Badges'    },
  { icon: Users,  label: 'Squad'     },
];

// -------------------------------------------------------
// Helper
// -------------------------------------------------------

function getUpgradeLabel(userTier: Tier, planTier: PaidTier): string {
  if (userTier === 'free') {
    if (planTier === 'basic')        return 'Start with Basic';
    if (planTier === 'professional') return 'Choose Professional';
    return 'Go Premium';
  }
  if (userTier === 'basic') {
    if (planTier === 'professional') return 'Upgrade to Professional';
    return 'Upgrade to Premium';
  }
  return 'Upgrade to Premium';
}

// -------------------------------------------------------
// Plans content
// -------------------------------------------------------

function PlansContent() {
  const router = useRouter();
  const { user } = useAppContext();

  if (!user) return null;

  const userTier = user.subscriptionTier;

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* Back link */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Assessments
        </button>
      </div>

      <PageWrapper>

        {/* Page header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">Choose Your Plan</h1>
          <p className="text-zinc-500 text-sm mt-2">
            Unlock assessments for SAT, JEE, NEET, and PMP
          </p>
        </div>

        {/* Warning banner — always shown to all users */}
        <div className="mt-2 mb-8 max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-sm text-center">
            Currently, you cannot downgrade your plan. Choose wisely.
          </p>
        </div>

        {/* Plan cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const isCurrent = userTier === plan.tier;
            const isLower   = TIER_RANK[userTier] > TIER_RANK[plan.tier];
            const isHigher  = TIER_RANK[userTier] < TIER_RANK[plan.tier];

            return (
              <div
                key={plan.tier}
                className={`bg-white rounded-2xl p-6 shadow-sm relative ${
                  plan.isHighlighted
                    ? 'border-2 border-violet-500'
                    : 'border border-zinc-200'
                }`}
              >
                {/* Most Popular badge */}
                {plan.isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <p className="text-xl font-bold text-zinc-900">{plan.name}</p>

                {/* Price */}
                <p className="text-3xl font-bold text-zinc-900 mt-1">
                  {PLAN_PRICES[plan.tier]}
                  <span className="text-base font-normal text-zinc-500">/month</span>
                </p>

                {/* Billing note */}
                <p className="text-xs text-zinc-400 mt-0.5 mb-4">Billed monthly</p>

                {/* Feature list */}
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-zinc-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {isCurrent && (
                  <button
                    disabled
                    className="w-full mt-6 rounded-xl py-3 font-semibold text-base bg-zinc-100 text-zinc-400 cursor-not-allowed pointer-events-none"
                  >
                    Current Plan
                  </button>
                )}

                {isLower && (
                  <button
                    disabled
                    title="Downgrade is not available. Contact support."
                    className="w-full mt-6 rounded-xl py-3 font-semibold text-base opacity-50 cursor-not-allowed pointer-events-none border border-zinc-300 text-zinc-500"
                  >
                    Unable to Downgrade
                  </button>
                )}

                {isHigher && (
                  <button
                    onClick={() => router.push(`/checkout?plan=${plan.tier}`)}
                    className="w-full mt-6 rounded-xl py-3 font-semibold text-base bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                  >
                    {getUpgradeLabel(userTier, plan.tier)}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Gamification strip */}
        <div className="mt-12 bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-5 text-center max-w-5xl mx-auto">
          <p className="text-sm font-medium text-zinc-700 mb-3">Every plan unlocks:</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {GAMIFICATION_ITEMS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-zinc-600">
                <Icon className="w-4 h-4 text-amber-500" />
                {label}
              </span>
            ))}
          </div>
        </div>

      </PageWrapper>
    </div>
  );
}

export default function PlansPage() {
  return (
    <AuthGuard>
      <PlansContent />
    </AuthGuard>
  );
}
