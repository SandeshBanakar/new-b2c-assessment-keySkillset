// Section breakdown — compact bars per module
function SectionBreakdown({ data }) {
  const toneMap = { emerald:'bg-emerald-500', amber:'bg-amber-500', rose:'bg-rose-500' };
  return (
    <SATCard className="p-5">
      <SATSectionTitle eyebrow="Attempt 6 · 14 Mar" title="Section breakdown" desc="Module-level correct count and time."/>
      <div className="space-y-3">
        {data.map(s => {
          const pct = Math.round((s.correct/s.total)*100);
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-zinc-900">{s.label}</span>
                <span className="text-xs text-zinc-500 tabular-nums">{s.correct}/{s.total} · {s.time}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div className={`h-full ${toneMap[s.color]}`} style={{width:`${pct}%`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </SATCard>
  );
}
window.SectionBreakdown = SectionBreakdown;
