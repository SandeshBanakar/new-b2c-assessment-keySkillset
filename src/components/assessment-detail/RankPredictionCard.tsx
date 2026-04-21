'use client';

import { TrendingUp } from 'lucide-react';

type NeetClatRow = { marks: number; rank: number };
type JeeRow = { marks: number; percentile_low: number; percentile_high: number };
export type RankLookupRow = NeetClatRow | JeeRow;

function isJeeRow(row: RankLookupRow): row is JeeRow {
  return 'percentile_low' in row;
}

function interpolate(marks: number, table: RankLookupRow[]): RankLookupRow | null {
  if (table.length === 0) return null;
  const sorted = [...table].sort((a, b) => b.marks - a.marks);
  if (marks >= sorted[0].marks) return sorted[0];
  if (marks <= sorted[sorted.length - 1].marks) return sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    const hi = sorted[i];
    const lo = sorted[i + 1];
    if (marks <= hi.marks && marks >= lo.marks) {
      const t = (hi.marks - marks) / (hi.marks - lo.marks);
      if (isJeeRow(hi) && isJeeRow(lo)) {
        return {
          marks,
          percentile_low: +(hi.percentile_low + t * (lo.percentile_low - hi.percentile_low)).toFixed(1),
          percentile_high: +(hi.percentile_high + t * (lo.percentile_high - hi.percentile_high)).toFixed(1),
        };
      }
      const hiRank = (hi as NeetClatRow).rank;
      const loRank = (lo as NeetClatRow).rank;
      return { marks, rank: Math.round(hiRank + t * (loRank - hiRank)) };
    }
  }
  return null;
}

function formatRank(rank: number): string {
  if (rank >= 100000) return `${(rank / 100000).toFixed(1)}L`;
  if (rank >= 1000) return rank.toLocaleString('en-IN');
  return String(rank);
}

interface RankPredictionCardProps {
  exam: 'NEET' | 'JEE' | 'CLAT';
  currentScore: number | null;
  targetScore: number | null;
  lookupData: RankLookupRow[];
  dataYear: number;
}

const EXAM_SCORE_MAX: Record<string, number> = { NEET: 720, JEE: 300, CLAT: 120 };

export default function RankPredictionCard({
  exam,
  currentScore,
  targetScore,
  lookupData,
  dataYear,
}: RankPredictionCardProps) {
  if (lookupData.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-md p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900">Rank Prediction</h3>
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          Rank prediction data not configured for this exam.
        </p>
      </div>
    );
  }

  if (currentScore === null) {
    return (
      <div className="bg-white shadow-sm rounded-md p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900">Rank Prediction</h3>
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          Score data unavailable for prediction.
        </p>
      </div>
    );
  }

  const result = interpolate(currentScore, lookupData);
  const targetResult = targetScore !== null ? interpolate(targetScore, lookupData) : null;
  const scoreMax = EXAM_SCORE_MAX[exam] ?? 100;

  // Gap to target calculation
  let gapLine: string | null = null;
  if (targetScore !== null && targetResult && result) {
    if (exam === 'JEE') {
      const curLow = (result as JeeRow).percentile_low ?? 0;
      const tarLow = (targetResult as JeeRow).percentile_low ?? 0;
      if (tarLow > curLow) {
        gapLine = `Need ~${targetScore - currentScore} more marks to reach ${tarLow}th percentile`;
      }
    } else {
      const curRank = (result as NeetClatRow).rank ?? 0;
      const tarRank = (targetResult as NeetClatRow).rank ?? 0;
      if (tarRank < curRank) {
        gapLine = `Need ~${targetScore - currentScore} more marks to reach AIR ${formatRank(tarRank)}`;
      }
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-md p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-zinc-900">Rank Prediction</h3>
        <span className="ml-auto text-xs text-zinc-400">{exam} · {dataYear}</span>
      </div>

      {result ? (
        <>
          {exam === 'JEE' ? (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Predicted Percentile</p>
              <p className="text-2xl font-semibold text-blue-700">
                {(result as JeeRow).percentile_low}
                <span className="text-base font-normal">th</span>
                {' – '}
                {(result as JeeRow).percentile_high}
                <span className="text-base font-normal">th</span>
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Based on {dataYear} NTA normalised data. Varies by exam shift.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Predicted AIR</p>
              <p className="text-2xl font-semibold text-blue-700">
                ~{formatRank((result as NeetClatRow).rank)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Based on {dataYear} official data. Actual ranks vary by exam difficulty.
              </p>
            </div>
          )}

          {/* Score bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>0</span>
              <span className="text-zinc-600 font-medium">{currentScore} / {scoreMax}</span>
              <span>{scoreMax}</span>
            </div>
            <div className="relative w-full bg-zinc-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${(currentScore / scoreMax) * 100}%` }}
              />
              {targetScore !== null && (
                <div
                  className="absolute top-0 h-2 w-0.5 bg-emerald-500"
                  style={{ left: `${(targetScore / scoreMax) * 100}%` }}
                  title={`Target: ${targetScore}`}
                />
              )}
            </div>
          </div>

          {gapLine && (
            <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 rounded px-2.5 py-1.5">
              {gapLine}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-zinc-400">Could not compute prediction for score {currentScore}.</p>
      )}
    </div>
  );
}
