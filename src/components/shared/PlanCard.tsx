'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanCardProps {
  name: string;
  price: number;
  features: string[];
  bestFor: string;
  badge?: string;
  isCurrent: boolean;
  isHighlighted?: boolean;
  ctaLabel: string;
  ctaVariant: 'primary' | 'outline' | 'disabled';
  onSelect: () => void;
}

export default function PlanCard({
  name,
  price,
  features,
  bestFor,
  badge,
  isCurrent,
  isHighlighted = false,
  ctaLabel,
  ctaVariant,
  onSelect,
}: PlanCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
        isHighlighted
          ? 'border-violet-600 shadow-md ring-1 ring-violet-600/20'
          : 'border-zinc-200 shadow-sm'
      }`}
    >
      {/* Most Popular badge */}
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
          ★ {badge}
        </span>
      )}

      {/* Current Plan badge */}
      {isCurrent && (
        <span className="absolute top-4 right-4 bg-violet-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          Current Plan
        </span>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-900">{name}</h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-zinc-900">₹{price}</span>
          <span className="text-sm text-zinc-500">/month</span>
        </div>
        <p className="mt-2 text-xs text-zinc-500 italic">&ldquo;{bestFor}&rdquo;</p>
      </div>

      {/* Feature list */}
      <ul className="flex-1 space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-zinc-700">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {ctaVariant === 'disabled' ? (
        <Button
          disabled
          className="w-full rounded-xl bg-zinc-100 text-zinc-400 cursor-not-allowed"
        >
          {ctaLabel}
        </Button>
      ) : ctaVariant === 'primary' ? (
        <Button
          onClick={onSelect}
          className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
        >
          {ctaLabel}
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={onSelect}
          className="w-full rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
