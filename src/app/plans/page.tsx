'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Flame, Zap, Map, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageWrapper from '@/components/layout/PageWrapper';
import PlanCard from '@/components/shared/PlanCard';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useAppContext } from '@/context/AppContext';
import type { Tier } from '@/types';

// -------------------------------------------------------
// Plan data
// -------------------------------------------------------

type PaidTier = 'basic' | 'professional' | 'premium';

const PLAN_PRICES: Record<PaidTier, number> = {
  basic: 299,
  professional: 599,
  premium: 999,
};

const PLAN_NAMES: Record<Tier, string> = {
  free: 'Free',
  basic: 'Basic',
  professional: 'Professional',
  premium: 'Premium',
};

const PLAN_DEFAULT_CTA: Record<PaidTier, string> = {
  basic: 'Start with Basic',
  professional: 'Choose Professional',
  premium: 'Go Premium',
};

const TIER_RANK: Record<Tier, number> = {
  free: 0, basic: 1, professional: 2, premium: 3,
};

interface PlanDef {
  tier: PaidTier;
  name: string;
  badge?: string;
  bestFor: string;
  features: string[];
  isHighlighted?: boolean;
}

const PLANS: PlanDef[] = [
  {
    tier: 'basic',
    name: 'Basic',
    bestFor: 'Full-length mock practice',
    features: [
      'Full Tests (all 4 exams)',
      'Daily Quiz included',
      'XP, Streaks, Levels 1–5',
      'Basic Quest Map',
      'Basic Badges',
      '1 free + 5 paid attempts per assessment',
    ],
  },
  {
    tier: 'professional',
    name: 'Professional',
    badge: 'Most Popular',
    isHighlighted: true,
    bestFor: 'Topic mastery + full practice',
    features: [
      'Full Tests + Subject Tests',
      'Puzzle Mode on Subject Tests',
      'Daily Quiz included',
      'XP, Streaks, Levels 1–8',
      'Full Quest Map',
      'Full Badge Set',
      'Squad Leaderboard',
      '1 free + 5 paid attempts per assessment',
      'Streak Freeze: 1/week',
    ],
  },
  {
    tier: 'premium',
    name: 'Premium',
    bestFor: 'Concept precision + full exam readiness',
    features: [
      'Full Tests + Subject Tests + Chapter Tests',
      'Puzzle Mode on all test types',
      'Daily Quiz included',
      'XP, Streaks, Levels 1–10',
      'Full Quest Map',
      'Full + Rare Badges',
      'Squad Leaderboard',
      '1 free + 5 paid attempts per assessment',
      'Streak Freeze: 2/week',
    ],
  },
];

const GAMIFICATION_ITEMS = [
  { icon: Flame, label: 'Streaks' },
  { icon: Zap, label: 'XP' },
  { icon: Map, label: 'Quest Map' },
  { icon: Trophy, label: 'Badges' },
  { icon: Users, label: 'Squad' },
];

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function getLockedFeatures(from: PaidTier, to: PaidTier): string {
  if (from === 'premium' && to === 'professional') return 'Chapter Tests and Puzzle Mode on Full Tests';
  if (from === 'premium' && to === 'basic') return 'Chapter Tests, Subject Tests, and Puzzle Mode';
  if (from === 'professional' && to === 'basic') return 'Subject Tests and Puzzle Mode';
  return 'some features';
}

function getCtaConfig(
  planTier: PaidTier,
  userTier: Tier,
): { label: string; variant: 'primary' | 'outline' | 'disabled' } {
  if (userTier === planTier) return { label: 'Current Plan', variant: 'disabled' };
  if (TIER_RANK[userTier] < TIER_RANK[planTier]) {
    return { label: PLAN_DEFAULT_CTA[planTier], variant: 'primary' };
  }
  return {
    label: `Downgrade to ${PLAN_NAMES[planTier]}`,
    variant: 'outline',
  };
}

// -------------------------------------------------------
// Confirmation modal
// -------------------------------------------------------

interface ModalProps {
  fromTier: Tier;
  toTier: PaidTier;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmModal({ fromTier, toTier, onConfirm, onCancel, loading }: ModalProps) {
  const isUpgrade = TIER_RANK[fromTier] < TIER_RANK[toTier];
  const fromName = PLAN_NAMES[fromTier];
  const toName = PLAN_NAMES[toTier];
  const priceDiff = Math.abs((PLAN_PRICES[toTier] ?? 0) - (PLAN_PRICES[fromTier as PaidTier] ?? 0));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-lg shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-zinc-900 mb-3">
          {isUpgrade ? 'Confirm Upgrade' : 'Confirm Downgrade'}
        </h2>

        <p className="text-sm text-zinc-600 leading-relaxed">
          {isUpgrade ? (
            <>
              Upgrading from <strong>{fromName}</strong> → <strong>{toName}</strong>. Your new
              plan activates immediately.{' '}
              <span className="text-zinc-400">
                (₹{priceDiff}/month difference — billing simulated)
              </span>
            </>
          ) : (
            <>
              Downgrading from <strong>{fromName}</strong> → <strong>{toName}</strong>. Takes
              effect immediately. Access to{' '}
              <strong>
                {getLockedFeatures(fromTier as PaidTier, toTier)}
              </strong>{' '}
              will be removed now.{' '}
              <span className="text-zinc-400">(Proration simulated — no actual charge adjustment)</span>
            </>
          )}
        </p>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-md border-zinc-200 text-zinc-600"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-md bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-60"
          >
            {loading ? 'Confirming…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Plans page
// -------------------------------------------------------

function PlansContent() {
  const router = useRouter();
  const { user, simulateTierChange } = useAppContext();
  const [pendingTier, setPendingTier] = useState<PaidTier | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  function handleConfirm() {
    if (!pendingTier || loading) return;
    setLoading(true);

    simulateTierChange(pendingTier);

    sessionStorage.setItem(
      'plan_banner',
      `You're now on the ${PLAN_NAMES[pendingTier]} plan. Welcome aboard!`,
    );

    setPendingTier(null);
    setLoading(false);
    router.push('/assessments');
  }

  return (
    <div className="min-h-screen bg-zinc-50">
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

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-zinc-900">Choose Your Plan</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Unlock assessments for SAT, JEE, NEET, and PMP
          </p>
        </div>

        {/* 3 plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const { label, variant } = getCtaConfig(plan.tier, user.subscriptionTier);
            return (
              <PlanCard
                key={plan.tier}
                name={plan.name}
                price={PLAN_PRICES[plan.tier]}
                features={plan.features}
                bestFor={plan.bestFor}
                badge={plan.badge}
                isCurrent={user.subscriptionTier === plan.tier}
                isHighlighted={plan.isHighlighted}
                ctaLabel={label}
                ctaVariant={variant}
                onSelect={() => setPendingTier(plan.tier)}
              />
            );
          })}
        </div>

        {/* Gamification strip */}
        <div className="mt-10 rounded-md bg-white border border-zinc-200 px-6 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="text-sm font-medium text-zinc-700">Every plan unlocks:</span>
          {GAMIFICATION_ITEMS.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1 text-sm text-zinc-600">
              <Icon className="w-4 h-4 text-amber-500" />
              {label}
            </span>
          ))}
        </div>

      </PageWrapper>

      {/* Confirmation modal */}
      {pendingTier && (
        <ConfirmModal
          fromTier={user.subscriptionTier}
          toTier={pendingTier}
          onConfirm={handleConfirm}
          onCancel={() => setPendingTier(null)}
          loading={loading}
        />
      )}
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
