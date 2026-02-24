import Link from 'next/link';
import { BookOpen, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Assessment, CardStatus, Difficulty, Exam, UserAssessmentProgress } from '@/types';

// -------------------------------------------------------
// Design tokens per design-system.md
// -------------------------------------------------------

const examColors: Record<Exam, string> = {
  SAT: 'bg-blue-100 text-blue-700',
  JEE: 'bg-blue-100 text-blue-700',
  NEET: 'bg-emerald-100 text-emerald-700',
  PMP: 'bg-amber-100 text-amber-700',
};

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-orange-100 text-orange-700',
  hard: 'bg-rose-100 text-rose-700',
};

const typeLabels: Record<string, string> = {
  'full-test': 'Full Test',
  'subject-test': 'Subject Test',
  'chapter-test': 'Chapter Test',
  'daily-quiz': 'Daily Quiz',
};

const ctaLabel: Record<CardStatus, string> = {
  start: 'Start',
  continue: 'Continue',
  locked: 'Unlock',
  upgrade: 'Upgrade',
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// -------------------------------------------------------
// Props
// -------------------------------------------------------

interface AssessmentCardProps {
  assessment: Assessment;
  progress: UserAssessmentProgress | null;
  status: CardStatus;
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

export default function AssessmentCard({ assessment, progress, status }: AssessmentCardProps) {
  const isLocked = status === 'locked';
  const attemptsUsed = progress?.attemptsUsed ?? 0;

  const ctaHref =
    status === 'locked' || status === 'upgrade'
      ? '/plans'
      : `/assessments/${assessment.id}`;

  const isPrimary = status === 'start' || status === 'continue';

  return (
    <div className="relative">
      <Card
        className={`bg-white border border-zinc-200 rounded-md transition-opacity ${
          isLocked ? 'opacity-60' : ''
        }`}
      >
        <CardContent className="p-6 flex flex-col gap-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${examColors[assessment.exam]}`}
            >
              {assessment.exam}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
              {typeLabels[assessment.type]}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColors[assessment.difficulty]}`}
            >
              {assessment.difficulty.charAt(0).toUpperCase() + assessment.difficulty.slice(1)}
            </span>
          </div>

          {/* Title + subject */}
          <div>
            <h3 className="text-base font-semibold text-zinc-900">{assessment.title}</h3>
            {assessment.subject && (
              <p className="text-sm text-zinc-500 mt-0.5">{assessment.subject}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              {assessment.questionCount} questions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {formatDuration(assessment.duration)}
            </span>
          </div>

          {/* Attempt counter — hidden when locked */}
          {!isLocked && (
            <p className="text-xs text-zinc-500">{attemptsUsed} / 5 attempts used</p>
          )}

          {/* CTA */}
          <Button
            asChild
            className={`w-full rounded-md ${
              isPrimary
                ? 'bg-blue-700 hover:bg-blue-800 text-white'
                : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <Link href={ctaHref}>{ctaLabel[status]}</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Lock overlay */}
      {isLocked && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <Lock className="w-6 h-6 text-zinc-400" />
        </div>
      )}
    </div>
  );
}
