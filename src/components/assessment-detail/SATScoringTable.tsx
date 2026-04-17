'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

// ─── Raw → Scaled Score Conversion Table (Practice Test #4, College Board) ────

interface ScoreRow {
  raw: number;
  rwLower: number;
  rwUpper: number;
  mathLower: number | null;
  mathUpper: number | null;
}

const SCORE_TABLE: ScoreRow[] = [
  { raw: 0,  rwLower: 200, rwUpper: 200, mathLower: 200, mathUpper: 200 },
  { raw: 7,  rwLower: 200, rwUpper: 210, mathLower: 200, mathUpper: 220 },
  { raw: 8,  rwLower: 200, rwUpper: 220, mathLower: 200, mathUpper: 230 },
  { raw: 9,  rwLower: 210, rwUpper: 230, mathLower: 220, mathUpper: 250 },
  { raw: 10, rwLower: 230, rwUpper: 250, mathLower: 250, mathUpper: 280 },
  { raw: 11, rwLower: 240, rwUpper: 260, mathLower: 280, mathUpper: 310 },
  { raw: 12, rwLower: 250, rwUpper: 270, mathLower: 290, mathUpper: 320 },
  { raw: 13, rwLower: 260, rwUpper: 280, mathLower: 300, mathUpper: 330 },
  { raw: 14, rwLower: 280, rwUpper: 300, mathLower: 310, mathUpper: 340 },
  { raw: 15, rwLower: 290, rwUpper: 310, mathLower: 320, mathUpper: 350 },
  { raw: 16, rwLower: 320, rwUpper: 340, mathLower: 330, mathUpper: 360 },
  { raw: 17, rwLower: 340, rwUpper: 360, mathLower: 330, mathUpper: 360 },
  { raw: 18, rwLower: 350, rwUpper: 370, mathLower: 340, mathUpper: 370 },
  { raw: 19, rwLower: 360, rwUpper: 380, mathLower: 350, mathUpper: 380 },
  { raw: 20, rwLower: 370, rwUpper: 390, mathLower: 360, mathUpper: 390 },
  { raw: 21, rwLower: 370, rwUpper: 390, mathLower: 370, mathUpper: 400 },
  { raw: 22, rwLower: 380, rwUpper: 400, mathLower: 370, mathUpper: 400 },
  { raw: 23, rwLower: 390, rwUpper: 410, mathLower: 380, mathUpper: 410 },
  { raw: 24, rwLower: 400, rwUpper: 420, mathLower: 390, mathUpper: 420 },
  { raw: 25, rwLower: 410, rwUpper: 430, mathLower: 400, mathUpper: 430 },
  { raw: 26, rwLower: 420, rwUpper: 440, mathLower: 420, mathUpper: 450 },
  { raw: 27, rwLower: 420, rwUpper: 440, mathLower: 430, mathUpper: 460 },
  { raw: 28, rwLower: 430, rwUpper: 450, mathLower: 440, mathUpper: 470 },
  { raw: 29, rwLower: 440, rwUpper: 460, mathLower: 460, mathUpper: 490 },
  { raw: 30, rwLower: 450, rwUpper: 470, mathLower: 470, mathUpper: 500 },
  { raw: 31, rwLower: 460, rwUpper: 480, mathLower: 480, mathUpper: 510 },
  { raw: 32, rwLower: 460, rwUpper: 480, mathLower: 500, mathUpper: 530 },
  { raw: 33, rwLower: 470, rwUpper: 490, mathLower: 510, mathUpper: 540 },
  { raw: 34, rwLower: 480, rwUpper: 500, mathLower: 520, mathUpper: 550 },
  { raw: 35, rwLower: 490, rwUpper: 510, mathLower: 530, mathUpper: 560 },
  { raw: 36, rwLower: 490, rwUpper: 510, mathLower: 550, mathUpper: 580 },
  { raw: 37, rwLower: 500, rwUpper: 520, mathLower: 560, mathUpper: 590 },
  { raw: 38, rwLower: 510, rwUpper: 530, mathLower: 570, mathUpper: 600 },
  { raw: 39, rwLower: 520, rwUpper: 540, mathLower: 580, mathUpper: 610 },
  { raw: 40, rwLower: 530, rwUpper: 550, mathLower: 590, mathUpper: 620 },
  { raw: 41, rwLower: 540, rwUpper: 560, mathLower: 600, mathUpper: 630 },
  { raw: 42, rwLower: 540, rwUpper: 560, mathLower: 620, mathUpper: 650 },
  { raw: 43, rwLower: 550, rwUpper: 570, mathLower: 630, mathUpper: 660 },
  { raw: 44, rwLower: 560, rwUpper: 580, mathLower: 650, mathUpper: 680 },
  { raw: 45, rwLower: 570, rwUpper: 590, mathLower: 670, mathUpper: 700 },
  { raw: 46, rwLower: 580, rwUpper: 600, mathLower: 690, mathUpper: 720 },
  { raw: 47, rwLower: 590, rwUpper: 610, mathLower: 710, mathUpper: 740 },
  { raw: 48, rwLower: 590, rwUpper: 610, mathLower: 730, mathUpper: 760 },
  { raw: 49, rwLower: 600, rwUpper: 620, mathLower: 740, mathUpper: 770 },
  { raw: 50, rwLower: 610, rwUpper: 630, mathLower: 750, mathUpper: 780 },
  { raw: 51, rwLower: 620, rwUpper: 640, mathLower: 760, mathUpper: 790 },
  { raw: 52, rwLower: 630, rwUpper: 650, mathLower: 770, mathUpper: 800 },
  { raw: 53, rwLower: 630, rwUpper: 650, mathLower: 780, mathUpper: 800 },
  { raw: 54, rwLower: 640, rwUpper: 660, mathLower: 790, mathUpper: 800 },
  { raw: 55, rwLower: 650, rwUpper: 670, mathLower: null, mathUpper: null },
  { raw: 56, rwLower: 660, rwUpper: 680, mathLower: null, mathUpper: null },
  { raw: 57, rwLower: 670, rwUpper: 690, mathLower: null, mathUpper: null },
  { raw: 58, rwLower: 680, rwUpper: 700, mathLower: null, mathUpper: null },
  { raw: 59, rwLower: 690, rwUpper: 710, mathLower: null, mathUpper: null },
  { raw: 60, rwLower: 700, rwUpper: 720, mathLower: null, mathUpper: null },
  { raw: 61, rwLower: 710, rwUpper: 730, mathLower: null, mathUpper: null },
  { raw: 62, rwLower: 720, rwUpper: 740, mathLower: null, mathUpper: null },
  { raw: 63, rwLower: 730, rwUpper: 750, mathLower: null, mathUpper: null },
  { raw: 64, rwLower: 750, rwUpper: 770, mathLower: null, mathUpper: null },
  { raw: 65, rwLower: 770, rwUpper: 790, mathLower: null, mathUpper: null },
  { raw: 66, rwLower: 790, rwUpper: 800, mathLower: null, mathUpper: null },
];

function scoreRangeLabel(lower: number | null, upper: number | null): string {
  if (lower === null || upper === null) return '—';
  if (lower === upper) return `${lower}`;
  return `${lower}–${upper}`;
}

function scoreBandClass(lower: number | null): string {
  if (lower === null) return '';
  if (lower >= 700) return 'bg-emerald-50 text-emerald-800';
  if (lower >= 500) return 'bg-blue-50 text-blue-800';
  if (lower >= 350) return 'bg-amber-50 text-amber-800';
  return 'bg-rose-50 text-rose-800';
}

export default function SATScoringTable() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white shadow-sm rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <p className="text-base font-medium text-zinc-900">SAT Scoring Reference</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Official College Board raw → scaled score table · Practice Test #4
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
        }
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 px-6 pb-6 pt-4">

          {/* Calculation explained */}
          <div className="rounded-md bg-blue-50 border border-blue-100 p-4 mb-5">
            <p className="text-sm font-medium text-blue-800 mb-2">How SAT scores are calculated</p>
            <ol className="space-y-1.5 text-sm text-blue-700">
              <li className="flex gap-2">
                <span className="font-medium shrink-0">1.</span>
                <span>Count correct answers: <span className="font-medium">R&W raw = M1 correct + M2 correct</span> (max 66)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium shrink-0">2.</span>
                <span>Count correct answers: <span className="font-medium">Math raw = M1 correct + M2 correct</span> (max 54)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium shrink-0">3.</span>
                <span>Look up each raw score in the table below to get a <span className="font-medium">section score range</span> (200–800)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium shrink-0">4.</span>
                <span><span className="font-medium">Total score range = R&W range + Math range</span> (400–1600)</span>
              </li>
            </ol>
            <p className="text-xs text-blue-600 mt-3">
              Scores are expressed as ranges because this simplified scoring method cannot pinpoint
              the exact College Board adaptive scaled score.
            </p>
          </div>

          {/* Two-column layout: R&W (all 67 rows) + Math (54 rows) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* R&W table */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Reading & Writing (max raw: 66)
              </p>
              <div className="overflow-hidden rounded-md border border-zinc-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-3 py-2 font-medium text-zinc-600">Raw</th>
                      <th className="text-center px-3 py-2 font-medium text-zinc-600">Section Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCORE_TABLE.map((row) => (
                      <tr
                        key={`rw-${row.raw}`}
                        className="border-b border-zinc-100 last:border-0"
                      >
                        <td className="px-3 py-1.5 font-medium text-zinc-700">{row.raw}</td>
                        <td className={`px-3 py-1.5 text-center font-medium rounded-sm mx-1 ${scoreBandClass(row.rwLower)}`}>
                          {scoreRangeLabel(row.rwLower, row.rwUpper)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Math table */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Math (max raw: 54)
              </p>
              <div className="overflow-hidden rounded-md border border-zinc-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-3 py-2 font-medium text-zinc-600">Raw</th>
                      <th className="text-center px-3 py-2 font-medium text-zinc-600">Section Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCORE_TABLE.filter((r) => r.mathLower !== null).map((row) => (
                      <tr
                        key={`math-${row.raw}`}
                        className="border-b border-zinc-100 last:border-0"
                      >
                        <td className="px-3 py-1.5 font-medium text-zinc-700">{row.raw}</td>
                        <td className={`px-3 py-1.5 text-center font-medium ${scoreBandClass(row.mathLower)}`}>
                          {scoreRangeLabel(row.mathLower, row.mathUpper)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-100">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300 shrink-0" />
              700–800
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-300 shrink-0" />
              500–699
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300 shrink-0" />
              350–499
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300 shrink-0" />
              200–349
            </span>
            <span className="ml-auto text-xs text-zinc-400">
              Source: College Board Practice Test #4 (2324-BB-852)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
