'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { CheckCircle2, X, ChevronRight, Zap, Target, Crown } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import TierGateBanner from '@/components/assessment/TierGateBanner';
import AssessmentLibrarySection from '@/components/assessment/AssessmentLibrarySection';

type UpgradePlan = 'basic' | 'professional' | 'premium';

// Computed once at module load — avoids calling Date.now() during render
const PLAN_ACTIVE_UNTIL = new Date(
  Date.now() + 30 * 24 * 60 * 60 * 1000
).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const planConfig: Record<
  UpgradePlan,
  { icon: React.ReactNode; color: string; bg: string; name: string; unlocks: string }
> = {
  basic: {
    icon: <Zap className="w-8 h-8 text-blue-600" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    name: 'Basic Plan',
    unlocks: 'Full Tests',
  },
  professional: {
    icon: <Target className="w-8 h-8 text-violet-600" />,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    name: 'Professional Plan',
    unlocks: 'Subject Tests',
  },
  premium: {
    icon: <Crown className="w-8 h-8 text-amber-500" />,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    name: 'Premium Plan',
    unlocks: 'all assessments',
  },
};

export default function AssessmentsPage() {
  const [planBanner, setPlanBanner] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const msg = sessionStorage.getItem('plan_banner');
    if (msg) sessionStorage.removeItem('plan_banner');
    return msg;
  });

  // Lazy initialisers — same pattern as planBanner above; runs once at mount
  const [showModal, setShowModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    return params.get('upgraded') === 'true' && !!plan && plan in planConfig;
  });

  const [modalPlan] = useState<UpgradePlan>(() => {
    if (typeof window === 'undefined') return 'basic';
    const plan = new URLSearchParams(window.location.search).get('plan') as UpgradePlan | null;
    return plan && plan in planConfig ? plan : 'basic';
  });

  // Clear URL params — side effect only, no setState
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('upgraded') === 'true') {
      window.history.replaceState({}, '', '/assessments');
    }
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const t = setTimeout(() => setShowModal(false), 8000);
    return () => clearTimeout(t);
  }, [showModal]);

  const current = planConfig[modalPlan];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Upgrade success modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full">
            {/* Plan icon */}
            <div
              className={`w-16 h-16 ${current.bg} rounded-full flex items-center justify-center mx-auto mb-4`}
            >
              {current.icon}
            </div>

            {/* Heading */}
            <h2 className="text-xl font-semibold text-zinc-900 text-center mb-1">
              You&apos;re on {current.name}
            </h2>

            {/* Subtext */}
            <p className="text-sm text-zinc-400 text-center mb-6">
              Active until: {PLAN_ACTIVE_UNTIL}
            </p>

            <hr className="border-zinc-100 mb-5" />

            {/* Start here list */}
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
              Start here
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-zinc-600">
                <ChevronRight className={`w-4 h-4 ${current.color}`} />
                Try a {current.unlocks} now
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-600">
                <ChevronRight className={`w-4 h-4 ${current.color}`} />
                Set your daily streak goal
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-600">
                <ChevronRight className={`w-4 h-4 ${current.color}`} />
                Explore the Quest Map
              </li>
            </ul>

            {/* Primary CTA */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-3 rounded-md transition-colors mb-3"
            >
              Go to Assessments
            </button>

            {/* Dismiss */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      <PageWrapper>
        {/* Plan success banner */}
        {planBanner && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {planBanner}
            </p>
            <button
              onClick={() => setPlanBanner(null)}
              className="text-emerald-500 hover:text-emerald-700 shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tier upgrade / awareness banner */}
        <TierGateBanner />

        {/* Assessment library with category grouping */}
        <AssessmentLibrarySection />
      </PageWrapper>
    </div>
  );
}
