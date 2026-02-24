'use client';

import { createClient } from '@/lib/supabase/client';
import { useAppContext } from '@/context/AppContext';
import type { Tier } from '@/types';

const TIERS: { label: string; value: Tier }[] = [
  { label: 'Free',    value: 'free'         },
  { label: 'Basic',   value: 'basic'        },
  { label: 'Pro',     value: 'professional' },
  { label: 'Premium', value: 'premium'      },
];

// -------------------------------------------------------
// Inner component — hooks are always called here
// -------------------------------------------------------

function DevTierSwitcherInner() {
  const { user, setUser } = useAppContext();

  if (!user) return null;

  async function switchTier(tier: Tier) {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from('users')
      .update({ subscription_tier: tier })
      .eq('id', user.id);
    setUser({ ...user, subscriptionTier: tier });
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 rounded-md shadow-lg p-1.5 flex items-center gap-1">
      <span className="text-xs text-zinc-500 px-2 select-none">DEV</span>
      {TIERS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => void switchTier(value)}
          className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
            user.subscriptionTier === value
              ? 'bg-blue-700 text-white'
              : 'text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// -------------------------------------------------------
// Public export — guards against non-dev environments
// -------------------------------------------------------

export default function DevTierSwitcher() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <DevTierSwitcherInner />;
}
