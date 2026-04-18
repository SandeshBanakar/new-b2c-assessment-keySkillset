// Hero — big score + target progress + trajectory line chart
function HeroScore({ attempts, target, onTargetChange }) {
  const { TrendingUp, Target, Flame, Sparkles, Trophy } = window.LUCIDE;
  const latest = attempts[attempts.length - 1];
  const first  = attempts[0];
  const delta  = latest.total - first.total;
  const toTarget = target - latest.total;
  const pct     = Math.min(100, Math.max(0, ((latest.total - 400) / (target - 400)) * 100));

  // Line chart geometry
  const W = 560, H = 180, P = 28;
  const xs = (i) => P + (i / (attempts.length - 1)) * (W - P*2);
  const ymin = 800, ymax = 1600;
  const ys = (v) => H - P - ((v - ymin) / (ymax - ymin)) * (H - P*2);
  const linePath = attempts.map((a,i) => `${i===0?'M':'L'} ${xs(i).toFixed(1)} ${ys(a.total).toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L ${xs(attempts.length-1).toFixed(1)} ${H - P} L ${xs(0).toFixed(1)} ${H - P} Z`;
  const targetY = ys(target);

  return (
    <div className="grid md:grid-cols-12 gap-4">
      {/* Score + progress */}
      <div className="md:col-span-5 bg-gradient-to-br from-blue-700 to-blue-900 rounded-md p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-500/20 blur-2xl"/>
        <div className="absolute -right-16 bottom-0 w-56 h-56 rounded-full bg-violet-500/20 blur-3xl"/>
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-200">
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 softpulse"/> Latest attempt · {latest.date}</span>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <div className="text-6xl font-semibold tracking-tight tabular-nums">{latest.total}</div>
            <div className="mb-2 text-sm text-blue-200">/ 1600</div>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
              <TrendingUp className="w-3.5 h-3.5"/> +{delta} since Attempt 1
            </span>
            <span className="text-blue-300">·</span>
            <span className="text-blue-200">+{latest.total - attempts[attempts.length-2].total} this attempt</span>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-blue-200">
            <span className="inline-flex items-center gap-1"><Target className="w-3.5 h-3.5"/> Target {target}</span>
            <span>{toTarget > 0 ? `${toTarget} points to go` : 'Target reached ·'}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-blue-950/50 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-amber-300" style={{width: `${pct}%`}}/>
          </div>

          {/* Score breakdown */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="border-t border-blue-400/30 pt-3">
              <div className="text-xs text-blue-200">Reading & Writing</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{latest.rw} <span className="text-xs font-normal text-blue-300">/ 800</span></div>
            </div>
            <div className="border-t border-blue-400/30 pt-3">
              <div className="text-xs text-blue-200">Math</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{latest.math} <span className="text-xs font-normal text-blue-300">/ 800</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Trajectory chart */}
      <div className="md:col-span-7 bg-white border border-zinc-200 rounded-md p-5 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Trajectory</div>
            <div className="text-sm text-zinc-700 mt-1">Six attempts · rising steadily</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Target</span>
            <TargetStepper target={target} onChange={onTargetChange}/>
          </div>
        </div>

        <div className="mt-3 flex-1">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            <defs>
              <linearGradient id="fill1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stopColor="#1d4ed8" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {/* horizontal gridlines */}
            {[1000, 1200, 1400, 1600].map(v => (
              <g key={v}>
                <line x1={P} x2={W-P} y1={ys(v)} y2={ys(v)} stroke="#f4f4f5" strokeWidth="1"/>
                <text x={W-P+4} y={ys(v)+3} fontSize="9" fill="#a1a1aa">{v}</text>
              </g>
            ))}
            {/* target line */}
            {targetY > P && targetY < H-P && (
              <g>
                <line x1={P} x2={W-P} y1={targetY} y2={targetY} stroke="#d97706" strokeWidth="1.25" strokeDasharray="4 4"/>
                <rect x={P-2} y={targetY-8} width="36" height="14" rx="7" fill="#fffbeb" stroke="#fde68a"/>
                <text x={P+16} y={targetY+2} fontSize="9" fill="#b45309" fontWeight="600" textAnchor="middle">GOAL</text>
              </g>
            )}
            {/* area */}
            <path d={fillPath} fill="url(#fill1)"/>
            {/* line */}
            <path d={linePath} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            {/* points */}
            {attempts.map((a,i) => (
              <g key={a.n}>
                <circle cx={xs(i)} cy={ys(a.total)} r={i===attempts.length-1 ? 5 : 3.5} fill={i===attempts.length-1 ? '#1d4ed8' : 'white'} stroke="#1d4ed8" strokeWidth="2"/>
                {i===attempts.length-1 && <circle cx={xs(i)} cy={ys(a.total)} r="9" fill="none" stroke="#1d4ed8" strokeWidth="1" opacity="0.3"/>}
                <text x={xs(i)} y={ys(a.total) - 10} fontSize="10" fill="#18181b" fontWeight="600" textAnchor="middle">{a.total}</text>
                <text x={xs(i)} y={H - P + 14} fontSize="9" fill="#71717a" textAnchor="middle">#{a.n}</text>
                <text x={xs(i)} y={H - P + 25} fontSize="8" fill="#a1a1aa" textAnchor="middle">{a.date}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* projection hint */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-zinc-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500"/>
            <span>Projected next attempt · <span className="text-zinc-900 font-semibold tabular-nums">{latest.total + 46}</span> — if you follow this week's plan</span>
          </span>
          <span className="text-zinc-400">Avg gain per attempt: <span className="text-zinc-700 font-medium">+{Math.round(delta / (attempts.length-1))}</span></span>
        </div>
      </div>
    </div>
  );
}

function TargetStepper({ target, onChange }) {
  const { Minus, Plus } = window.LUCIDE;
  const step = 10;
  return (
    <div className="inline-flex items-center rounded-md border border-zinc-200 bg-white h-8 overflow-hidden">
      <button onClick={() => onChange(Math.max(1000, target - step))} className="w-7 h-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"><Minus className="w-3 h-3 mx-auto"/></button>
      <span className="px-2 text-sm font-semibold tabular-nums text-zinc-900 min-w-[46px] text-center">{target}</span>
      <button onClick={() => onChange(Math.min(1600, target + step))} className="w-7 h-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"><Plus className="w-3 h-3 mx-auto"/></button>
    </div>
  );
}
window.HeroScore = HeroScore;
