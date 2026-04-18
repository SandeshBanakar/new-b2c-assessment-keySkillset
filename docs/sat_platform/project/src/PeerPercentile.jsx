// Peer percentile — how you compare to other repeaters
function PeerPercentile({ peer }) {
  const { Trophy, TrendingUp } = window.LUCIDE;
  const rows = [
    { label:'Overall', pct: peer.percentileOverall, color:'blue' },
    { label:'R&W',     pct: peer.percentileRw,      color:'emerald' },
    { label:'Math',    pct: peer.percentileMath,    color:'violet' },
    { label:'Improvement rate', pct: peer.improvementPercentile, color:'amber', highlight:true },
  ];
  const toneMap = {
    blue:'bg-blue-500', emerald:'bg-emerald-500', violet:'bg-violet-500', amber:'bg-amber-500',
  };
  return (
    <SATCard className="p-5">
      <SATSectionTitle eyebrow="Peer Percentile" title="vs SAT repeaters like you" desc={`Among ${peer.cohortSize.toLocaleString()} learners who've taken 3+ attempts.`}/>
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-zinc-900 inline-flex items-center gap-1.5">
                {r.label}
                {r.highlight && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full"><TrendingUp className="w-2.5 h-2.5"/>top 10%</span>}
              </span>
              <span className="text-sm font-semibold text-zinc-900 tabular-nums">{r.pct}th</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 overflow-hidden relative">
              <div className={`h-full ${toneMap[r.color]}`} style={{width: `${r.pct}%`}}/>
              <div className="absolute inset-y-0" style={{left:'50%', width:'1px', background:'#a1a1aa'}}/>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-700 shrink-0"/>
        <div className="text-xs text-amber-900">You're improving <span className="font-semibold">faster than 92%</span> of repeaters on the platform. Keep the streak.</div>
      </div>
    </SATCard>
  );
}
window.PeerPercentile = PeerPercentile;
