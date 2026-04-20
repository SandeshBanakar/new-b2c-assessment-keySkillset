'use client';

interface AttemptPoint {
  attempt_number: number;
  score: number | null;
}

interface Props {
  attempts: AttemptPoint[];
  scoreMax: number;
  target?: number | null;
}

const W = 280;
const H = 72;
const PAD_X = 24;
const PAD_Y = 10;

export default function ScoreTrajectoryChart({ attempts, scoreMax, target }: Props) {
  const scored = attempts.filter((a) => a.score !== null);
  if (scored.length < 2) return null;

  const scoreMin = scoreMax === 1600 ? 400 : 200;
  const range = scoreMax - scoreMin;

  const toX = (i: number) =>
    PAD_X + (i / (scored.length - 1)) * (W - PAD_X * 2);
  const toY = (score: number) =>
    H - PAD_Y - ((score - scoreMin) / range) * (H - PAD_Y * 2);

  const points = scored.map((a, i) => ({ x: toX(i), y: toY(a.score!), n: a.attempt_number, s: a.score! }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  const targetY = target ? toY(Math.min(target, scoreMax)) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((f) => {
        const y = PAD_Y + f * (H - PAD_Y * 2);
        return (
          <line key={f} x1={PAD_X} y1={y} x2={W - PAD_X} y2={y}
            stroke="#f4f4f5" strokeWidth="1" />
        );
      })}

      {/* Target line */}
      {targetY !== null && (
        <>
          <line x1={PAD_X} y1={targetY} x2={W - PAD_X} y2={targetY}
            stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
          <text x={W - PAD_X + 3} y={targetY + 4} fontSize="9" fill="#7c3aed" opacity="0.8">
            Target
          </text>
        </>
      )}

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#1d4ed8" />
          <text
            x={p.x}
            y={p.y - 7}
            textAnchor="middle"
            fontSize="9"
            fill="#71717a"
          >
            {p.s}
          </text>
        </g>
      ))}

      {/* X axis attempt labels */}
      {points.map((p, i) => (
        <text key={`lbl-${i}`} x={p.x} y={H - 1} textAnchor="middle" fontSize="8" fill="#a1a1aa">
          A{p.n}
        </text>
      ))}
    </svg>
  );
}
