'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';

// -------------------------------------------------------
// Types
// -------------------------------------------------------

interface TourStep {
  target: string; // data-tour attribute value
  text: string;
}

interface TooltipPosition {
  top: number;
  left: number;
}

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const TOOLTIP_WIDTH = 280;
const TOOLTIP_MARGIN = 14;

function buildSteps(isFree: boolean): TourStep[] {
  return [
    {
      target: 'streak',
      text: "Your streak resets if you miss a day. Keep it alive!",
    },
    {
      target: 'daily-quiz',
      text: "Start here every day. It's free for everyone.",
    },
    {
      target: 'quest-preview',
      text: "Unlock your full learning path with any plan.",
    },
    {
      target: isFree ? 'upgrade-badge' : 'stats-bar',
      text: "Track your XP and level up as you practice.",
    },
  ];
}

function computePosition(rect: DOMRect): TooltipPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Prefer placing the tooltip below the target; fall back to above
  let top = rect.bottom + TOOLTIP_MARGIN;
  if (top + 140 > vh && rect.top > 160) {
    top = rect.top - 140 - TOOLTIP_MARGIN;
  }

  // Centre horizontally on the target, then clamp to viewport
  let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  left = Math.max(12, Math.min(left, vw - TOOLTIP_WIDTH - 12));

  return { top, left };
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

export default function WelcomeTour() {
  const { user } = useAppContext();
  const [isDone, setIsDone] = useState(false);

  const isFree = user?.subscriptionTier === 'free';
  const steps = useMemo(() => buildSteps(isFree), [isFree]);

  const [step, setStep] = useState(0);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const positionTooltip = useCallback(() => {
    const target = steps[step]?.target;
    if (!target) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) return;
    setPosition(computePosition(el.getBoundingClientRect()));
  }, [step, steps]);

  useEffect(() => {
    const id = setTimeout(positionTooltip, 80);
    window.addEventListener('resize', positionTooltip);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', positionTooltip);
    };
  }, [positionTooltip]);

  if (!user || isDone) return null;

  function completeTour() {
    setIsDone(true);
  }

  function handleNext() {
    if (step < steps.length - 1) {
      setPosition(null); // clear while repositioning
      setStep((s) => s + 1);
    } else {
      completeTour();
    }
  }

  function handleBack() {
    if (step > 0) {
      setPosition(null);
      setStep((s) => s - 1);
    }
  }

  // Don't render anything until the position has been computed
  if (!position) {
    return null;
  }

  const isLast = step === steps.length - 1;

  return (
    <>
      {/* Dimmed backdrop — click to skip */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={completeTour}
        aria-hidden="true"
      />

      {/* Tooltip card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tour step ${step + 1} of ${steps.length}`}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-zinc-200 p-4"
        style={{ top: position.top, left: position.left, width: TOOLTIP_WIDTH }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full ${
                  i === step ? 'bg-blue-700' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={completeTour}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Skip tour
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-zinc-700 leading-relaxed mb-4">{steps[step].text}</p>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="rounded-md border-zinc-200 text-zinc-600 text-xs h-8"
            >
              Back
            </Button>
          )}
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={handleNext}
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs h-8"
          >
            {isLast ? 'Got it!' : 'Next →'}
          </Button>
        </div>
      </div>
    </>
  );
}
