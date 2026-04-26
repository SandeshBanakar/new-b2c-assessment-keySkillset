'use client';

import { useState } from 'react';

interface ConceptMastery {
  concept_tag: string;
  attempt_number: number;
  correct_count: number;
  total_count: number;
  mastery_percent: number | null;
}

export interface ConceptMasteryPanelProps {
  conceptMastery: ConceptMastery[];
  tagSectionMap: Record<string, string>;
  sections: string[];
  attempts: Array<{ attempt_number: number; completed_at: string | null }>;
}

function masteryBadgeClass(pct: number | null): string {
  if (pct === null) return 'bg-zinc-100 text-zinc-400';
  if (pct >= 80) return 'bg-emerald-100 text-emerald-700';
  if (pct >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function ConceptMasteryPanel({
  conceptMastery,
  tagSectionMap,
  sections,
  attempts,
}: ConceptMasteryPanelProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0] ?? '');

  if (sections.length === 0 || conceptMastery.length === 0) return null;

  const attemptNumbers = attempts.map((a) => a.attempt_number);
  const latestAttemptNumber = Math.max(...attemptNumbers);

  const sectionTags = [
    ...new Set(
      conceptMastery
        .filter((m) => tagSectionMap[m.concept_tag] === activeSection)
        .map((m) => m.concept_tag),
    ),
  ];

  const sortedTags = [...sectionTags].sort((a, b) => {
    const aPct =
      conceptMastery.find((m) => m.concept_tag === a && m.attempt_number === latestAttemptNumber)
        ?.mastery_percent ?? null;
    const bPct =
      conceptMastery.find((m) => m.concept_tag === b && m.attempt_number === latestAttemptNumber)
        ?.mastery_percent ?? null;
    if (aPct === null && bPct === null) return 0;
    if (aPct === null) return -1;
    if (bPct === null) return 1;
    return aPct - bPct;
  });

  return (
    <div className="bg-white shadow-sm rounded-md p-6">
      <div className="mb-4">
        <h3 className="text-base font-medium text-zinc-900">Concept Mastery</h3>
        <p className="text-xs text-zinc-500 mt-1">Progress across all attempts</p>
      </div>

      {sections.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {sections.map((section) => {
            const isActive = section === activeSection;
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {section === 'Reading & Writing' ? (
                  <>
                    <span className="sm:hidden">R&amp;W</span>
                    <span className="hidden sm:inline">Reading &amp; Writing</span>
                  </>
                ) : (
                  section
                )}
              </button>
            );
          })}
        </div>
      )}

      {sortedTags.length === 0 ? (
        <p className="text-sm text-zinc-400">No concept data for this section.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-10 text-left text-xs font-medium text-zinc-400 pb-2 pr-4 min-w-40">
                  Skill
                </th>
                {attempts.map((a) => (
                  <th
                    key={a.attempt_number}
                    className="text-center text-xs font-medium text-zinc-400 pb-2 px-2 whitespace-nowrap min-w-22.5"
                  >
                    <div>Attempt {a.attempt_number}</div>
                    {a.completed_at && (
                      <div className="font-normal">{formatDate(a.completed_at)}</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTags.map((tag) => (
                <tr key={tag} className="border-t border-zinc-50">
                  <td className="sticky left-0 bg-white z-10 text-xs text-zinc-600 py-2 pr-4 leading-snug">
                    {tag}
                  </td>
                  {attemptNumbers.map((n) => {
                    const pct =
                      conceptMastery.find(
                        (m) => m.concept_tag === tag && m.attempt_number === n,
                      )?.mastery_percent ?? null;
                    return (
                      <td key={n} className="text-center py-2 px-2">
                        <span
                          className={`inline-block text-xs font-medium rounded px-2 py-0.5 ${masteryBadgeClass(pct)}`}
                        >
                          {pct !== null ? `${Math.round(pct)}%` : '—'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-zinc-100">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />&ge;80% — strong
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />60–79% — developing
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />&lt;60% — needs work
        </span>
      </div>
    </div>
  );
}
