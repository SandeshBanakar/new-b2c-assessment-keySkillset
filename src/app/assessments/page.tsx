'use client';

import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import AssessmentLibraryBanner from '@/components/shared/AssessmentLibraryBanner';
import YourAssessmentsSection from '@/components/assessment/YourAssessmentsSection';
import AssessmentLibrarySection from '@/components/assessment/AssessmentLibrarySection';

export default function AssessmentsPage() {
  const [planBanner, setPlanBanner] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const msg = sessionStorage.getItem('plan_banner');
    if (msg) sessionStorage.removeItem('plan_banner');
    return msg;
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

        {/* Tier upgrade banner */}
        <AssessmentLibraryBanner />

        {/* Section 1 — subscribed assessments */}
        <YourAssessmentsSection />

        {/* Section 2 — full library */}
        <AssessmentLibrarySection />
      </PageWrapper>
    </div>
  );
}
