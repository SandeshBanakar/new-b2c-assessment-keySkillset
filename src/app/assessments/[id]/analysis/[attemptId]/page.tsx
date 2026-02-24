'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Target,
  XCircle,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import MCQSingleReview from '@/components/question-review/MCQSingleReview';
import MCQMultipleReview from '@/components/question-review/MCQMultipleReview';
import NumericReview from '@/components/question-review/NumericReview';
import PassageSingleReview from '@/components/question-review/PassageSingleReview';
import { mockAssessments } from '@/utils/assessmentUtils';
import { mockAttempts, mockQuestionResults, mockQuestions } from '@/data/assessments';
import type { MockQuestion, QuestionAttemptResult } from '@/types';

// -------------------------------------------------------
// Question review dispatcher
// -------------------------------------------------------

function QuestionReview({
  question,
  result,
}: {
  question: MockQuestion;
  result: QuestionAttemptResult;
}) {
  if (question.type === 'mcq-single') {
    return <MCQSingleReview question={question} userAnswer={result.userAnswer} />;
  }
  if (question.type === 'mcq-multiple') {
    const userAnswers = result.userAnswer ? [result.userAnswer] : [];
    return <MCQMultipleReview question={question} userAnswers={userAnswers} />;
  }
  if (question.type === 'numeric') {
    return <NumericReview question={question} userAnswer={result.userAnswer} />;
  }
  if (question.type === 'passage-single') {
    return <PassageSingleReview question={question} userAnswer={result.userAnswer} />;
  }
  // passage-multi — fallback to single for now
  return <PassageSingleReview question={question} userAnswer={result.userAnswer} />;
}

// -------------------------------------------------------
// Module tabs (SAT only)
// -------------------------------------------------------

const SAT_MODULES = ['RW-M1', 'RW-M2', 'Math-M1', 'Math-M2'] as const;
type SATModule = (typeof SAT_MODULES)[number];

// -------------------------------------------------------
// Page
// -------------------------------------------------------

export default function AttemptAnalysisPage() {
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();

  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<SATModule>('RW-M1');

  const assessment = mockAssessments.find((a) => a.id === params.id);
  const attempt = mockAttempts.find((a) => a.id === params.attemptId);

  if (!assessment || !attempt) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Attempt not found.</p>
      </div>
    );
  }

  const results = mockQuestionResults;
  const questions = mockQuestions;
  const isSAT = assessment.exam === 'SAT';

  const totalAnswered = attempt.correctCount + attempt.incorrectCount;
  const accuracy =
    totalAnswered > 0 ? Math.round((attempt.correctCount / totalAnswered) * 100) : 0;

  // Filter questions by module for SAT
  const visibleResults = isSAT
    ? results.filter((r) => r.module === activeModule)
    : results;

  return (
    <div className="min-h-screen bg-zinc-50">
      <PageWrapper>
        {/* Back link */}
        <button
          onClick={() => router.push(`/assessments/${params.id}?tab=attempts`)}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to {assessment.title}
        </button>

        {/* Score header card */}
        <div className="bg-white shadow-sm rounded-md p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold text-zinc-900">{attempt.score}</p>
              {isSAT && attempt.scoreRw != null && attempt.scoreMath != null && (
                <p className="text-sm text-zinc-500 mt-1">
                  R&amp;W: {attempt.scoreRw} &nbsp;|&nbsp; Math: {attempt.scoreMath}
                </p>
              )}
            </div>
            <div className="text-sm text-zinc-500">
              {attempt.attemptNumber === 0 ? 'Free Attempt' : `Attempt ${attempt.attemptNumber}`}
              {attempt.completedAt && (
                <span className="ml-2 text-zinc-400">
                  · {new Date(attempt.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Performance stats row */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-md px-6 py-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              {
                icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
                value: attempt.correctCount,
                label: 'Correct',
              },
              {
                icon: <XCircle className="w-4 h-4 text-rose-600" />,
                value: attempt.incorrectCount,
                label: 'Incorrect',
              },
              {
                icon: <Target className="w-4 h-4 text-zinc-500" />,
                value: totalAnswered,
                label: 'Attempted',
              },
              {
                icon: <CheckCircle className="w-4 h-4 text-zinc-500" />,
                value: `${accuracy}%`,
                label: 'Accuracy',
              },
              {
                icon: <Clock className="w-4 h-4 text-zinc-500" />,
                value: attempt.durationMinutes ? `${Math.round((attempt.durationMinutes * 60) / Math.max(totalAnswered, 1))}s` : '—',
                label: 'Avg Time/Q',
              },
            ].map(({ icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                {icon}
                <span className="text-base font-semibold text-zinc-900">{value}</span>
                <span className="text-xs text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sectional summary — SAT */}
        {isSAT && attempt.scoreRw != null && attempt.scoreMath != null && (
          <div className="bg-white shadow-sm rounded-md p-6 mb-4">
            <h2 className="text-base font-medium text-zinc-900 mb-4">Sectional Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-zinc-200 rounded-md p-4">
                <p className="text-sm font-medium text-zinc-700">Reading &amp; Writing</p>
                <p className="text-xl font-semibold text-zinc-900 mt-1">{attempt.scoreRw}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Score (200–800)</p>
              </div>
              <div className="border border-zinc-200 rounded-md p-4">
                <p className="text-sm font-medium text-zinc-700">Math</p>
                <p className="text-xl font-semibold text-zinc-900 mt-1">{attempt.scoreMath}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Score (200–800)</p>
              </div>
            </div>
          </div>
        )}

        {/* Module tabs — SAT only */}
        {isSAT && (
          <div className="bg-white border-b border-zinc-200 rounded-t-md mb-0 px-4">
            <div className="flex items-center">
              {SAT_MODULES.map((mod) => (
                <button
                  key={mod}
                  onClick={() => setActiveModule(mod)}
                  className={`px-4 py-3 text-sm transition-colors border-b-2 -mb-px ${
                    activeModule === mod
                      ? 'text-blue-700 border-blue-700 font-medium'
                      : 'text-zinc-500 border-transparent hover:text-zinc-700'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question-wise analysis list */}
        <div className={`bg-white shadow-sm ${isSAT ? 'rounded-b-md' : 'rounded-md'} mt-4`}>
          {visibleResults.length === 0 ? (
            <p className="text-sm text-zinc-500 p-6 text-center">
              No questions for this module in demo data.
            </p>
          ) : (
            visibleResults.map((result) => {
              const question = questions.find((q) => q.id === result.questionId);
              const isExpanded = expandedQ === result.questionId;

              return (
                <div key={result.questionId} className="border-b border-zinc-100 last:border-0">
                  <div className="flex items-center gap-3 py-3 px-6">
                    {/* Q number */}
                    <span className="text-xs text-zinc-400 w-8 flex-shrink-0">
                      Q{result.questionNumber}
                    </span>

                    {/* Status badge */}
                    {result.isCorrect ? (
                      <span className="text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 flex-shrink-0">
                        Correct
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-rose-50 text-rose-600 rounded-full px-2 py-0.5 flex-shrink-0">
                        Incorrect
                      </span>
                    )}

                    {/* Meta */}
                    <span className="text-xs text-zinc-400 hidden sm:block">
                      Time: {result.timeSpentSeconds}s
                    </span>
                    <span className="text-xs text-zinc-500 hidden sm:block">
                      Selected: {result.userAnswer ?? '—'}
                    </span>
                    {question && (
                      <span className="text-xs text-emerald-600 hidden sm:block">
                        Correct: {question.correctAnswer}
                      </span>
                    )}

                    <div className="flex-1" />

                    {/* Expand toggle */}
                    {question && (
                      <button
                        onClick={() => setExpandedQ(isExpanded ? null : result.questionId)}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-md px-2 py-1 transition-colors flex-shrink-0"
                      >
                        View {isExpanded ? 'Less' : 'Question & Explanation'}
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded question review */}
                  {isExpanded && question && (
                    <div className="px-6 pb-4 border-t border-zinc-100">
                      <QuestionReview question={question} result={result} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
