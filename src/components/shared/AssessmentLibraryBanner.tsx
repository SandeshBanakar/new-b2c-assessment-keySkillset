'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, X, Zap } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function AssessmentLibraryBanner() {
  const router = useRouter();
  const { user } = useAppContext();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('banner_dismissed') === 'true';
  });

  const tier = user?.subscriptionTier ?? 'free';

  // Premium — render nothing (badge appears inline in page heading instead)
  if (tier === 'premium') return null;

  // Free — full dismissable banner
  if (tier === 'free') {
    if (dismissed) return null;

    return (
      <div className="mb-6 flex items-center justify-between gap-3 rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <Lock className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-blue-900">
              You&apos;re on the Free plan. Daily Quiz is free.
            </p>
            <p className="text-sm text-blue-900 mt-0.5">
              Upgrade to unlock Full Tests, Subject Tests, and Chapter Tests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => router.push('/plans')}
            className="bg-blue-700 text-white text-sm rounded-md px-4 py-2 hover:bg-blue-800 transition-colors whitespace-nowrap"
          >
            Compare Plans →
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('banner_dismissed', 'true');
              setDismissed(true);
            }}
            className="text-blue-400 hover:text-blue-700 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Basic or Professional — slim non-dismissable strip
  return (
    <div className="mb-6 flex items-center rounded-md bg-amber-50 border border-amber-200 px-4 py-2">
      <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mr-2" />
      <span className="text-sm text-amber-900">Unlock everything with Premium</span>
      <button
        onClick={() => router.push('/plans#premium')}
        className="text-amber-700 font-medium underline text-sm ml-2 hover:text-amber-800"
      >
        Go Premium →
      </button>
    </div>
  );
}
