import { CheckCircle, XCircle } from 'lucide-react';
import type { MockQuestion } from '@/types';
import ExplanationBlock from './ExplanationBlock';

interface PassageSingleReviewProps {
  question: MockQuestion;
  userAnswer: string | null;
}

export default function PassageSingleReview({ question, userAnswer }: PassageSingleReviewProps) {
  const correct = question.correctAnswer;

  return (
    <div className="py-4">
      {/* 2-col grid on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT — Passage */}
        <div className="bg-zinc-50 p-6 rounded-md">
          <p className="text-xs font-medium text-zinc-500 tracking-wide uppercase mb-3">
            Passage:
          </p>
          <p className="text-sm text-zinc-700 leading-relaxed">{question.passageText}</p>
        </div>

        {/* RIGHT — Question + options */}
        <div className="p-6">
          <p className="text-xs font-medium text-zinc-500 tracking-wide uppercase mb-3">
            Question:
          </p>
          <p
            className="text-sm text-zinc-900 mb-3"
            dangerouslySetInnerHTML={{ __html: question.questionText }}
          />

          <div className="space-y-2">
            {(question.options ?? []).map((opt) => {
              const letter = opt.charAt(0);
              const isCorrect = letter === correct;
              const isUserWrong = letter === userAnswer && !isCorrect;

              let rowClass = 'bg-white border-zinc-200';
              if (isCorrect) rowClass = 'bg-emerald-50 border-emerald-300';
              else if (isUserWrong) rowClass = 'bg-rose-50 border-rose-300';

              return (
                <div
                  key={letter}
                  className={`flex items-center justify-between rounded-md border py-3 px-4 text-sm ${rowClass}`}
                >
                  <span
                    className="text-zinc-800"
                    dangerouslySetInnerHTML={{ __html: opt }}
                  />
                  {isCorrect && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
                  )}
                  {isUserWrong && (
                    <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explanation — full width below grid */}
      <ExplanationBlock {...question.explanation} />
    </div>
  );
}
