import { CheckCircle, XCircle } from 'lucide-react';
import type { MockQuestion, QuestionAttemptResult } from '@/types';
import ExplanationBlock from './ExplanationBlock';

interface PassageMultiReviewProps {
  questions: MockQuestion[];
  results: QuestionAttemptResult[];
}

export default function PassageMultiReview({ questions, results }: PassageMultiReviewProps) {
  const passageText = questions[0]?.passageText ?? '';

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT — Passage */}
        <div className="bg-zinc-50 p-6 rounded-md self-start">
          <p className="text-xs font-medium text-zinc-500 tracking-wide uppercase mb-3">
            Passage:
          </p>
          <p className="text-sm text-zinc-700 leading-relaxed">{passageText}</p>
        </div>

        {/* RIGHT — Multiple questions */}
        <div className="p-6 space-y-8">
          {questions.map((q, idx) => {
            const result = results.find((r) => r.questionId === q.id);
            const userAnswer = result?.userAnswer ?? null;
            const correct = q.correctAnswer;

            return (
              <div key={q.id}>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                  Question {idx + 1}:
                </p>
                <p
                  className="text-sm text-zinc-900 mb-3"
                  dangerouslySetInnerHTML={{ __html: q.questionText }}
                />

                <div className="space-y-2">
                  {(q.options ?? []).map((opt) => {
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

                <ExplanationBlock {...q.explanation} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
