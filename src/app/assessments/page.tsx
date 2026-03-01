'use client';

import { useState } from 'react';
import { CheckCircle2, CheckCircle, X } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import TierGateBanner from '@/components/assessment/TierGateBanner';
import AssessmentLibrarySection from '@/components/assessment/AssessmentLibrarySection';

export default function AssessmentsPage() {
  const [planBanner, setPlanBanner] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const msg = sessionStorage.getItem('plan_banner');
    if (msg) sessionStorage.removeItem('plan_banner');
    return msg;
  });

  const [successPlan, setSuccessPlan] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const plan = sessionStorage.getItem('justSubscribed');
    if (plan) sessionStorage.removeItem('justSubscribed');
    return plan;
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <PageWrapper>
        {/* Plan success banner */}
        {planBanner && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {planBanner}
            </p>
            <button
              onClick={() => setPlanBanner(null)}
              className="text-emerald-500 hover:text-emerald-700 flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Checkout success banner */}
        {successPlan && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
              <p className="text-emerald-800 text-sm font-medium">
                Your {successPlan} plan is active. Your learning quest begins now.
              </p>
            </div>
            <button onClick={() => setSuccessPlan(null)}>
              <X className="w-4 h-4 text-emerald-500 cursor-pointer" />
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
