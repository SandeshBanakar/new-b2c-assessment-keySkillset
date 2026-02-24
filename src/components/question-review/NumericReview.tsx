import type { MockQuestion } from '@/types';
import ExplanationBlock from './ExplanationBlock';

interface NumericReviewProps {
  question: MockQuestion;
  userAnswer: string | null;
}

export default function NumericReview({ question, userAnswer }: NumericReviewProps) {
  const isCorrect = userAnswer === question.correctAnswer;

  const userRowClass = isCorrect
    ? 'bg-emerald-50 border-emerald-300'
    : 'bg-rose-50 border-rose-300';

  return (
    <div className="py-4">
      <p
        className="text-sm text-zinc-900 mb-3"
        dangerouslySetInnerHTML={{ __html: question.questionText }}
      />

      <div className="space-y-2">
        <div className={`rounded-md border py-3 px-4 text-sm ${userRowClass}`}>
          Your answer: <span className="font-medium">{userAnswer ?? '—'}</span>
        </div>
        <div className="rounded-md border py-3 px-4 text-sm bg-emerald-50 border-emerald-300">
          Correct answer: <span className="font-medium">{question.correctAnswer}</span>
        </div>
      </div>

      <ExplanationBlock {...question.explanation} />
    </div>
  );
}
