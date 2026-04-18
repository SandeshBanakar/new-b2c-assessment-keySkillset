// Mistake taxonomy — donut + breakdown with actionable fix for each type
function MistakeTaxonomy({ mistakes }) {
  const { AlertTriangle, Brain, Clock, Layers, CheckCircle2 } = window.LUCIDE;
  const items = [
    { k:'careless',   ...mistakes.careless,   Icon: AlertTriangle, fix:'Slow down on Qs 1–3 of each module · double-check signs' },
    { k:'conceptual', ...mistakes.conceptual, Icon: Brain,         fix:'Drill the 3 weakest concepts this week' },
    { k:'timing',     ...mistakes.timing,     Icon: Clock,         fix:'Flag & skip when > 1.5× target; return at end' },
    { k:'strategy',   ...mistakes.strategy,   Icon: Layers,        fix:'Use process of elimination before computing' },
  ];
  const total = mistakes.total;
  // donut
  let cumulative = 0;
  const R = 42, C = 2 * Math.PI * R;
  const segments = items.map(it => {
    const frac = it.count / total;
    const seg = { ...it, offset: -cumulative * C, length: frac * C };
    cumulative += frac;
    return seg;
  });

  const toneFill = { amber:'#f59e0b', rose:'#e11d48', blue:'#1d4ed8', violet:'#7c3aed' };
  const toneBg   = { amber:'bg-amber-50 text-amber-700 border-amber-200', rose:'bg-rose-50 text-rose-700 border-rose-200', blue:'bg-blue-50 text-blue-700 border-blue-200', violet:'bg-violet-50 text-violet-700 border-violet-200' };

  return (
    <SATCard className="p-5">
      <SATSectionTitle eyebrow="Mistake Taxonomy" title="Why you got 29 questions wrong" desc="Every wrong answer classified. Careless mistakes are easiest to fix — start there."/>
      <div className="grid md:grid-cols-5 gap-5 items-center">
        <div className="md:col-span-2 flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="w-44 h-44 -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#f4f4f5" strokeWidth="14"/>
            {segments.map(s => (
              <circle key={s.k} cx="60" cy="60" r={R} fill="none" stroke={toneFill[s.color]} strokeWidth="14"
                strokeDasharray={`${s.length} ${C}`} strokeDashoffset={s.offset}/>
            ))}
            <g transform="rotate(90 60 60)">
              <text x="60" y="57" fontSize="18" fontWeight="600" fill="#18181b" textAnchor="middle">{total}</text>
              <text x="60" y="72" fontSize="8" fill="#71717a" textAnchor="middle">wrong total</text>
            </g>
          </svg>
        </div>
        <div className="md:col-span-3 space-y-2">
          {items.map(it => (
            <div key={it.k} className={`rounded-md border p-3 ${toneBg[it.color]}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <it.Icon className="w-4 h-4"/>
                  <span className="text-sm font-semibold">{it.label}</span>
                  <span className="text-xs font-mono tabular-nums opacity-70">{it.count} · {Math.round(it.count/total*100)}%</span>
                </div>
                <span className="text-[11px] opacity-60">e.g. "{it.examples[0]}"</span>
              </div>
              <div className="mt-1.5 text-xs flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0"/>Fix: {it.fix}</div>
            </div>
          ))}
        </div>
      </div>
    </SATCard>
  );
}
window.MistakeTaxonomy = MistakeTaxonomy;
