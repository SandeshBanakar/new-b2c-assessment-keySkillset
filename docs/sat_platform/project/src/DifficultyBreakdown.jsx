// Difficulty breakdown — easy / medium / hard performance
function DifficultyBreakdown({ difficulty }) {
  const { Gauge } = window.LUCIDE;
  const toneFor = { emerald:{bar:'bg-emerald-500', bg:'bg-emerald-50', text:'text-emerald-700'},
                    amber:  {bar:'bg-amber-500',   bg:'bg-amber-50',   text:'text-amber-700'},
                    rose:   {bar:'bg-rose-500',    bg:'bg-rose-50',    text:'text-rose-700'} };
  return (
    <SATCard className="p-5">
      <SATSectionTitle eyebrow="Difficulty" title="How you performed by question difficulty" desc="SAT is adaptive — you only see Module 2 hard questions if Module 1 went well. Fewer hard Qs here = ceiling."/>
      <div className="space-y-3">
        {difficulty.map(d => {
          const pct = Math.round((d.correct/d.total)*100);
          const t = toneFor[d.color];
          return (
            <div key={d.tier}>
              <div className="flex items-end justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-1.5 h-4 rounded-sm ${t.bar}`}/>
                  <span className="font-medium text-zinc-900">{d.tier}</span>
                  <span className={`text-xs font-mono tabular-nums ${t.text}`}>{d.correct}/{d.total}</span>
                </div>
                <span className="text-sm font-semibold text-zinc-900 tabular-nums">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div className={`h-full ${t.bar} transition-all`} style={{width:`${pct}%`}}/>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-500 flex items-center gap-1.5">
        <Gauge className="w-3.5 h-3.5"/> Adaptive ceiling hit — unlock harder Module 2 by gaining +4% in Math Module 1.
      </div>
    </SATCard>
  );
}
window.DifficultyBreakdown = DifficultyBreakdown;
