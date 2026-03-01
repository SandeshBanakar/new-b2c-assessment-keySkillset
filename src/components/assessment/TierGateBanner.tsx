'use client';

import { useRouter } from 'next/navigation';
import { Lock, ArrowUp, Trophy } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import type { Tier } from '@/types';

// -------------------------------------------------------
// Per-tier content map
// -------------------------------------------------------

type BannerConfig = {
  iconName: 'lock' | 'arrowUp' | 'trophy';
  iconClass: string;
  text: string;
  cta: string | null;
};

const CONTENT: Record<Tier, BannerConfig> = {
  free: {
    iconName: 'lock',
    iconClass: 'text-violet-500',
    text: "You're on the Free plan. Upgrade to unlock Full Tests, Subject Tests, and Chapter Tests.",
    cta: 'Compare Plans →',
  },
  basic: {
    iconName: 'arrowUp',
    iconClass: 'text-violet-500',
    text: 'Unlock more with Professional — add Subject Tests and Puzzle Mode to your practice.',
    cta: 'Upgrade Plan →',
  },
  professional: {
    iconName: 'arrowUp',
    iconClass: 'text-violet-500',
    text: 'Go Premium for complete access — unlock Chapter Tests and rare badges.',
    cta: 'Upgrade to Premium →',
  },
  premium: {
    iconName: 'trophy',
    iconClass: 'text-amber-500',
    text: 'Welcome to Premium Experience! You have access to priority support, early access to all assessments, and the full learning suite.',
    cta: null,
  },
};

function BannerIcon({ name, className }: { name: BannerConfig['iconName']; className: string }) {
  const cls = `w-4 h-4 flex-shrink-0 ${className}`;
  if (name === 'lock')    return <Lock    className={cls} />;
  if (name === 'arrowUp') return <ArrowUp className={cls} />;
  return                          <Trophy className={cls} />;
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

export default function TierGateBanner() {
  const router = useRouter();
  const { user } = useAppContext();

  const tier: Tier = user?.subscriptionTier ?? 'free';
  const c = CONTENT[tier];

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-md bg-violet-50 border border-violet-200 px-4 py-3">
      {/* Left — icon + text */}
      <div className="flex items-center gap-3 min-w-0">
        <BannerIcon name={c.iconName} className={c.iconClass} />
        <p className="text-sm text-violet-900">{c.text}</p>
      </div>

      {/* Right — CTA or badge */}
      <div className="flex-shrink-0">
        {tier === 'premium' ? (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-medium">
            You&apos;re all set ✓
          </span>
        ) : (
          <button
            onClick={() => router.push('/plans')}
            className="bg-violet-600 text-white text-sm rounded-md px-4 py-2 hover:bg-violet-700 transition-colors whitespace-nowrap"
          >
            {c.cta}
          </button>
        )}
      </div>
    </div>
  );
}
