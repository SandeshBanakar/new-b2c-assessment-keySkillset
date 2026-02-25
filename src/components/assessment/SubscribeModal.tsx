'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import type { LibraryAssessment } from '@/data/assessments';

const TYPE_LABEL: Record<LibraryAssessment['type'], string> = {
  'full-test':    'Full Test',
  'subject-test': 'Subject Test',
  'chapter-test': 'Chapter Test',
};

const EXAM_BADGE: Record<LibraryAssessment['exam'], string> = {
  SAT:  'bg-blue-100 text-blue-700',
  JEE:  'bg-amber-100 text-amber-700',
  NEET: 'bg-emerald-100 text-emerald-700',
  PMP:  'bg-violet-100 text-violet-700',
};

const INFO_ROWS = [
  '1 free attempt included',
  '5 total attempts',
  'Full analytics after each attempt',
  'Resume interrupted attempts',
];

interface SubscribeModalProps {
  assessment: LibraryAssessment;
  onClose: () => void;
}

export default function SubscribeModal({ assessment, onClose }: SubscribeModalProps) {
  const router = useRouter();
  const { user, subscribeToAssessment } = useAppContext();

  function handleSubscribe() {
    subscribeToAssessment(assessment.id);
    onClose();
    router.push(`/assessments/${assessment.id}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-lg shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-base font-semibold text-zinc-900">{assessment.title}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EXAM_BADGE[assessment.exam]}`}>
            {assessment.exam}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
            {TYPE_LABEL[assessment.type]}
          </span>
        </div>

        {/* Info rows */}
        <ul className="mt-4 space-y-2">
          {INFO_ROWS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-600">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {/* Note */}
        <p className="bg-blue-50 rounded-md px-4 py-3 mt-4 text-xs text-blue-800 leading-relaxed">
          Subscribing to this assessment uses your{' '}
          <span className="font-medium capitalize">{user?.subscriptionTier}</span> plan access.
          No additional charge — included in your plan.
        </p>

        {/* Buttons */}
        <div className="mt-5 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-md border-zinc-200 text-zinc-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubscribe}
            className="text-sm px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white"
          >
            Subscribe &amp; Start
          </Button>
        </div>
      </div>
    </div>
  );
}
