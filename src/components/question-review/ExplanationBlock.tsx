import type { ExplanationData } from '@/types';

type ExplanationBlockProps = ExplanationData;

export default function ExplanationBlock({
  correctAnswerLabel,
  optionBreakdowns,
  steps,
  videoUrl,
}: ExplanationBlockProps) {
  const videoEnabled = process.env.NEXT_PUBLIC_VIDEO_EXPLANATIONS_ENABLED === 'true';

  return (
    <div className="bg-zinc-50 border-t border-zinc-200 p-6 mt-4">
      {/* Header */}
      <p className="text-xs font-medium text-blue-700 tracking-widest uppercase mb-3">
        Explanation:
      </p>

      {/* Correct answer statement */}
      <p className="text-sm font-semibold text-zinc-900 mb-3">{correctAnswerLabel}</p>

      {/* Option breakdowns */}
      {optionBreakdowns && optionBreakdowns.length > 0 && (
        <div className="space-y-2 mb-3">
          {optionBreakdowns.map((ob) => (
            <p key={ob.option} className="text-sm text-zinc-600">
              <span className="font-medium text-zinc-700">Option {ob.option}:</span> {ob.text}
            </p>
          ))}
        </div>
      )}

      {/* Step-by-step */}
      {steps && steps.length > 0 && (
        <ol className="space-y-2 mb-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-700 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <span className="text-sm text-zinc-700 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}

      {/* VIDEO_SLOT: set NEXT_PUBLIC_VIDEO_EXPLANATIONS_ENABLED=true to activate */}
      {videoEnabled && videoUrl && (
        <div className="mt-4 rounded-md overflow-hidden border border-zinc-200">
          <iframe
            src={videoUrl}
            className="w-full aspect-video"
            allowFullScreen
            title="Video explanation"
          />
        </div>
      )}
    </div>
  );
}
