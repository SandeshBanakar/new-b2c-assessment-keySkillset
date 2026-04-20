'use client';

import { AlertTriangle } from 'lucide-react';

interface Category {
  key: string;
  label: string;
  count: number;
  color: string;
  bar: string;
  examples: string[];
}

// Demo data — hardcoded until classification engine is live
const DEMO_TOTAL = 29;
const DEMO_CATEGORIES: Category[] = [
  {
    key: 'careless',
    label: 'Careless',
    count: 11,
    color: 'text-amber-700',
    bar: 'bg-amber-400',
    examples: ['Sign error on −3x', 'Misread "NOT" in question', 'Ticked C meant to tick B'],
  },
  {
    key: 'conceptual',
    label: 'Conceptual gap',
    count: 9,
    color: 'text-rose-700',
    bar: 'bg-rose-400',
    examples: ['Didn\'t know combining equations trick', 'Parabola vertex form unfamiliar', 'Gerund vs participle'],
  },
  {
    key: 'timing',
    label: 'Time pressure',
    count: 6,
    color: 'text-blue-700',
    bar: 'bg-blue-400',
    examples: ['Last 4 Qs of Math Module 2 rushed', 'Ran out of time on Reading passage 3'],
  },
  {
    key: 'strategy',
    label: 'Strategy',
    count: 3,
    color: 'text-violet-700',
    bar: 'bg-violet-400',
    examples: ['Spent 4 min on 1 hard Q — should have flagged', 'Didn\'t use process of elimination'],
  },
];

export default function SATMistakeTaxonomy() {
  return (
    <div className="bg-white shadow-sm rounded-md p-6">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-blue-600" />
        <h3 className="text-base font-medium text-zinc-900">Mistake Taxonomy</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-5">
        {DEMO_TOTAL} mistakes classified by root cause
      </p>

      <div className="space-y-4">
        {DEMO_CATEGORIES.map((cat) => {
          const pct = Math.round((cat.count / DEMO_TOTAL) * 100);
          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-sm font-medium ${cat.color}`}>{cat.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">{cat.count} mistakes</span>
                  <span className={`text-xs font-medium ${cat.color}`}>{pct}%</span>
                </div>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-2 mb-1.5">
                <div
                  className={`h-2 rounded-full transition-all ${cat.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.examples.map((ex, i) => (
                  <span key={i} className="text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-100 rounded px-1.5 py-0.5">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
