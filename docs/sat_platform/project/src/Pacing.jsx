// Pacing — per-question seconds, module by module, with target line
function Pacing({ pacing }) {
  const { Timer, AlertTriangle } = window.LUCIDE;
  const [tab, setTab] = React.useState(pacing.modules[0].key);
  const mod = pacing.modules.find(m => m.key === tab);

  // Geometry
  const W = 720, H = 180, P = 28;
  const maxSec = Math.max(...mod.data.map(d => d.sec)) + 10;
  const xs = (i) => P + (i / (mod.data.length - 1)) * (W - P*2);
  const ys = (v) => H - P - (v / maxSec) * (H - P*2);
  const barWidth = (W - P*2) / mod.data.length * 0.7;

  const avg = Math.round(mod.data.reduce((s,d) => s + d.sec, 0) / mod.data.length);
  const overPace = mod.data.filter(d => d.sec > mod.target * 1.3).length;

  return (
    <SATCard className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Pacing</div>
          <h2 className="text-lg font-semibold text-zinc-900 mt-1">Where you're spending time</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Seconds per question. Dashed line is the pace you need to finish comfortably.</p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {pacing.modules.map(m => (
            <SATPill key={m.key} active={tab === m.key} onClick={() => setTab(m.key)}>{m.label}</SATPill>
          ))}
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-4 gap-3 text-sm">
        <div className="border-l-2 border-blue-700 pl-3">
          <div className="text-xs text-zinc-500">Target pace</div>
          <div className="font-semibold text-zinc-900 tabular-nums">{mod.target}s<span className="text-xs font-normal text-zinc-500">/q</span></div>
        </div>
        <div className="border-l-2 border-zinc-300 pl-3">
          <div className="text-xs text-zinc-500">Your avg</div>
          <div className={`font-semibold tabular-nums ${avg > mod.target ? 'text-amber-700' : 'text-emerald-700'}`}>{avg}s<span className="text-xs font-normal text-zinc-500">/q</span></div>
        </div>
        <div className="border-l-2 border-rose-500 pl-3">
          <div className="text-xs text-zinc-500">Time-bleed Qs</div>
          <div className="font-semibold text-rose-700 tabular-nums">{overPace}</div>
        </div>
        <div className="border-l-2 border-amber-400 pl-3">
          <div className="text-xs text-zinc-500">End-rush risk</div>
          <div className="font-semibold text-amber-700">{mod.data.slice(-5).some(d => d.sec < mod.target * 0.6) ? 'High' : 'Low'}</div>
        </div>
      </div>

      <div className="mt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* gridlines */}
          {[30,60,90,120,150].filter(v => v < maxSec).map(v => (
            <g key={v}>
              <line x1={P} x2={W-P} y1={ys(v)} y2={ys(v)} stroke="#f4f4f5"/>
              <text x={W-P+4} y={ys(v)+3} fontSize="9" fill="#a1a1aa">{v}s</text>
            </g>
          ))}
          {/* target line */}
          <line x1={P} x2={W-P} y1={ys(mod.target)} y2={ys(mod.target)} stroke="#1d4ed8" strokeDasharray="4 4" strokeWidth="1.25"/>
          <text x={W-P} y={ys(mod.target)-4} fontSize="9" fill="#1d4ed8" fontWeight="600" textAnchor="end">target {mod.target}s</text>
          {/* bars */}
          {mod.data.map((d,i) => {
            const x = xs(i) - barWidth/2;
            const y = ys(d.sec);
            const over = d.sec > mod.target * 1.3;
            const wrong = !d.correct;
            const fill = wrong ? '#fb7185' : over ? '#f59e0b' : '#60a5fa';
            return (
              <g key={i}>
                <rect x={x} y={y} width={barWidth} height={H - P - y} rx="2" fill={fill} opacity={0.9}/>
              </g>
            );
          })}
          {/* x axis labels every 5 */}
          {mod.data.filter((_,i)=>i%5===0 || i===mod.data.length-1).map((d,i) => (
            <text key={d.i} x={xs(d.i-1)} y={H - P + 12} fontSize="9" fill="#a1a1aa" textAnchor="middle">Q{d.i}</text>
          ))}
          {/* baseline */}
          <line x1={P} x2={W-P} y1={H-P} y2={H-P} stroke="#e4e4e7"/>
        </svg>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400"/> correct</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"/> over-pace</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400"/> wrong</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-amber-700"><AlertTriangle className="w-3 h-3"/> {overPace > 0 ? `${overPace} questions ate > 30% of target pace` : 'Pacing clean.'}</span>
      </div>
    </SATCard>
  );
}
window.Pacing = Pacing;
