'use client';

import { GraduationCap } from 'lucide-react';

export interface TierBand {
  id: string;
  name: string;
  label: string;
  min_score: number;
  max_score: number;
  color: string;
  display_order: number;
}

export interface College {
  id: string;
  name: string;
  country: string;
  cutoff_score: number;
  aid_pct: number;
  logo_initials: string | null;
  is_active: boolean;
  display_order: number;
}

interface Props {
  score: number;
  target: number | null;
  tiers: TierBand[];
  colleges: College[];
}

// Static color map — avoids dynamic Tailwind class generation
const TIER_COLORS: Record<string, { bg: string; text: string; border: string; badge: string; dot: string }> = {
  zinc:   { bg: 'bg-zinc-50',    text: 'text-zinc-700',   border: 'border-zinc-200',   badge: 'bg-zinc-100 text-zinc-600 border-zinc-300',     dot: 'bg-zinc-400'   },
  teal:   { bg: 'bg-teal-50',    text: 'text-teal-700',   border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-700 border-teal-300',     dot: 'bg-teal-500'   },
  blue:   { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700 border-blue-300',     dot: 'bg-blue-500'   },
  violet: { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700 border-violet-300', dot: 'bg-violet-500' },
  amber:  { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700 border-amber-300',   dot: 'bg-amber-500'  },
};

function tierForScore(score: number, tiers: TierBand[]): TierBand | null {
  return tiers.find((t) => score >= t.min_score && score <= t.max_score) ?? null;
}

export default function SATCollegeLadder({ score, target, tiers, colleges }: Props) {
  if (tiers.length === 0) return null;

  // Sort tiers Elite-first (descending display_order)
  const sortedTiers = [...tiers].sort((a, b) => b.display_order - a.display_order);

  const currentTier = tierForScore(score, tiers);
  const targetTier  = target ? tierForScore(target, tiers) : null;

  return (
    <div className="bg-white shadow-sm rounded-md p-6">
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap className="w-4 h-4 text-blue-600" />
        <h3 className="text-base font-medium text-zinc-900">College Ladder</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-5">
        Colleges within reach of your score · US &amp; Indian international programs
      </p>

      {/* Score context */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          <span className="text-zinc-600">Your score: <span className="font-medium text-zinc-900">{score}</span></span>
        </div>
        {target && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
            <span className="text-zinc-600">Target: <span className="font-medium text-zinc-900">{target}</span></span>
          </div>
        )}
        {!target && (
          <span className="text-zinc-400 italic">Set a target score to highlight your goal tier</span>
        )}
      </div>

      <div className="space-y-4">
        {sortedTiers.map((tier) => {
          const c = TIER_COLORS[tier.color] ?? TIER_COLORS.zinc;
          const tierColleges = colleges
            .filter((col) => col.cutoff_score >= tier.min_score && col.cutoff_score <= tier.max_score)
            .sort((a, b) => b.cutoff_score - a.cutoff_score);

          const isCurrentTier = currentTier?.name === tier.name;
          const isTargetTier  = targetTier?.name === tier.name;

          return (
            <div
              key={tier.id}
              className={`rounded-md border ${c.border} ${c.bg} p-3 ${
                isCurrentTier ? 'ring-2 ring-blue-500 ring-offset-1' :
                isTargetTier  ? 'ring-2 ring-violet-400 ring-offset-1' : ''
              }`}
            >
              {/* Tier header */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.badge}`}>
                  {tier.label}
                </span>
                <span className="text-xs text-zinc-400">{tier.min_score}–{tier.max_score}</span>
                {isCurrentTier && (
                  <span className="ml-auto text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                    You are here
                  </span>
                )}
                {!isCurrentTier && isTargetTier && (
                  <span className="ml-auto text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                    Your target
                  </span>
                )}
              </div>

              {/* College cards */}
              {tierColleges.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No colleges in this tier</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tierColleges.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center gap-2.5 bg-white rounded border border-zinc-100 px-2.5 py-2"
                    >
                      {/* Logo initials */}
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-semibold shrink-0 ${c.badge} border`}>
                        {col.logo_initials ?? col.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-800 truncate">{col.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-zinc-500">{col.cutoff_score}+</span>
                          {col.aid_pct > 0 && (
                            <>
                              <span className="text-zinc-300">·</span>
                              <span className="text-[10px] text-emerald-600">{col.aid_pct}% aid</span>
                            </>
                          )}
                          <span className="text-zinc-300">·</span>
                          <span className="text-[10px] text-zinc-400">{col.country === 'IN' ? '🇮🇳' : '🇺🇸'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
