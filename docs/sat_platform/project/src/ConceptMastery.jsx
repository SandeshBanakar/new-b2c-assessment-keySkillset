// Concept mastery — heatmap + actions (replaces old flat table)
function ConceptMastery({ concepts }) {
  const { Play, Dumbbell, ArrowRight } = window.LUCIDE;
  const [section, setSection] = React.useState('all');
  const rows = section === 'all' ? concepts : concepts.filter(c => c.section === section);
  const sorted = [...rows].sort((a,b) => a.mastery - b.mastery);

  const toneFor = (v) =>
    v == null ? '#f4f4f5'
    : v >= 85 ? '#10b981' // emerald-500
    : v >= 70 ? '#22c55e' // green-500 lighter
    : v >= 55 ? '#f59e0b' // amber-500
    : v >= 40 ? '#fb923c' // orange-400
    :           '#fb7185'; // rose-400

  return (
    <SATCard className="p-0">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Concept Mastery · 6-attempt heatmap</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Weakest first. Darker green = stronger grasp.</p>
        </div>
        <div className="flex items-center gap-1">
          {[['all','All'],['R&W','R&W'],['Math','Math']].map(([k,l]) => (
            <SATPill key={k} active={section===k} onClick={() => setSection(k)}>{l}</SATPill>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Concept</th>
              {[1,2,3,4,5,6].map(n => <th key={n} className="text-center px-2 py-3 font-medium">#{n}</th>)}
              <th className="text-center px-3 py-3 font-medium">Now</th>
              <th className="text-center px-3 py-3 font-medium">+ pts</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted.map((r,i) => (
              <tr key={i} className="hover:bg-zinc-50/60">
                <td className="px-5 py-3">
                  <div className="text-sm font-medium text-zinc-900">{r.concept}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{r.section} · {r.domain}</div>
                </td>
                {r.history.map((v,ci) => (
                  <td key={ci} className="text-center px-1 py-2">
                    <div className="w-8 h-8 rounded mx-auto flex items-center justify-center text-[10px] font-semibold text-white tabular-nums" style={{background: toneFor(v), opacity: 0.4 + (v/100)*0.6}}>
                      {v}
                    </div>
                  </td>
                ))}
                <td className="text-center px-3 py-3">
                  <span className={`inline-block min-w-[44px] px-2 py-1 rounded-md text-xs font-semibold tabular-nums ${satMasteryTone(r.mastery)}`}>{r.mastery}%</span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className="text-xs font-semibold text-emerald-700 tabular-nums">+{r.impact}</span>
                </td>
                <td className="text-right px-5 py-3">
                  <div className="inline-flex items-center gap-1">
                    <VideoChip videoId={r.youtube.id} title={r.youtube.title} duration={r.youtube.duration}/>
                    <button className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-blue-700 text-white text-xs font-medium hover:bg-blue-800">
                      <Dumbbell className="w-3 h-3"/> Drill
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
        <div>
          <span className="text-emerald-700 font-medium">≥80%</span> &mdash; strong &nbsp;·&nbsp;
          <span className="text-amber-700 font-medium">60–79%</span> &mdash; developing &nbsp;·&nbsp;
          <span className="text-rose-700 font-medium">&lt;60%</span> &mdash; needs work
        </div>
        <span className="text-zinc-400">Data from attempts 1–6 · latest 14 Mar</span>
      </div>
    </SATCard>
  );
}
window.ConceptMastery = ConceptMastery;
