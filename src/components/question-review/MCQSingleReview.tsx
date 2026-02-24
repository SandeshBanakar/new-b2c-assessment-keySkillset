import { CheckCircle, XCircle } from 'lucide-react';
import type { MockQuestion } from '@/types';
import ExplanationBlock from './ExplanationBlock';

interface MCQSingleReviewProps {
  question: MockQuestion;
  userAnswer: string | null;
}

export default function MCQSingleReview({ question, userAnswer }: MCQSingleReviewProps) {
  const correct = question.correctAnswer;

  return (
    <div className="py-4">
      <p
        className="text-sm text-zinc-900 mb-3"
        dangerouslySetInnerHTML={{ __html: question.questionText }}
      />

      <div className="space-y-2">
        {(question.options ?? []).map((opt) => {
          const letter = opt.charAt(0); // 'A', 'B', 'C', 'D'
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
              {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />}
              {isUserWrong && <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 ml-2" />}
            </div>
          );
        })}
      </div>

      <ExplanationBlock {...question.explanation} />
    </div>
  );
}
