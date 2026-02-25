'use client';

import { useRouter } from 'next/navigation';
import { Lock, Star, Zap, Trophy } from 'lucide-react';
import { DEMO_USERS } from '@/data/demoUsers';
import { useAppContext } from '@/context/AppContext';
import type { DemoUser } from '@/data/demoUsers';

const TIER_AVATAR_BG: Record<DemoUser['subscription_tier'], string> = {
  free:         'bg-zinc-600',
  basic:        'bg-blue-700',
  professional: 'bg-violet-700',
  premium:      'bg-amber-600',
};

const TIER_BADGE_CLASSES: Record<DemoUser['subscription_tier'], string> = {
  free:         'bg-zinc-700 text-zinc-300',
  basic:        'bg-blue-900 text-blue-300',
  professional: 'bg-violet-900 text-violet-300',
  premium:      'bg-amber-900 text-amber-300',
};

const TIER_ICONS: Record<DemoUser['subscription_tier'], React.ElementType> = {
  free:         Lock,
  basic:        Star,
  professional: Zap,
  premium:      Trophy,
};

export default function PersonaSelectorPage() {
  const router = useRouter();
  const { switchPersona } = useAppContext();

  function handleSelect(userId: string) {
    switchPersona(userId);
    router.push('/assessments');
  }

  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col items-center justify-center gap-10">
      <h1 className="text-3xl font-semibold text-white text-center">
        Who&apos;s learning today?
      </h1>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
        {DEMO_USERS.map((persona) => {
          const Icon = TIER_ICONS[persona.subscription_tier];
          return (
            <div
              key={persona.id}
              onClick={() => handleSelect(persona.id)}
              className="cursor-pointer group flex flex-col items-center gap-3"
            >
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 ${TIER_AVATAR_BG[persona.subscription_tier]}`}
              >
                <Icon className="w-10 h-10 text-white" />
              </div>

              <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
                {persona.display_name}
              </span>

              <span
                className={`text-xs rounded-full px-2.5 py-0.5 font-medium capitalize ${TIER_BADGE_CLASSES[persona.subscription_tier]}`}
              >
                {persona.subscription_tier}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-600 text-center mt-4">
        Demo mode — select a persona to explore
      </p>
    </div>
  );
}
