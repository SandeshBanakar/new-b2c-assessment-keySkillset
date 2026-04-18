// Highest-leverage weaknesses — the "fix these, gain X points" module
function Leverage({ concepts, currentScore, target }) {
  const { Rocket, ArrowRight, Dumbbell, Play } = window.LUCIDE;
  const top3 = [...concepts].sort((a,b) => b.impact - a.impact).slice(0, 3);
  const totalGain = top3.reduce((s,c) => s + c.impact, 0);

  return (
    <SATCard className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border-zinc-800">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-medium text-amber-400 uppercase tracking-wide inline-flex items-center gap-1.5"><Rocket className="w-3 h-3"/> Highest leverage</div>
          <h2 className="text-lg font-semibold mt-1">Fix these 3 concepts · projected <span className="text-emerald-400">+{totalGain} points</span></h2>
          <p className="text-xs text-zinc-400 mt-0.5">Based on frequency on the SAT and your current mastery. Starting with the biggest first.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-zinc-500">If fixed, you reach</div>
          <div className="text-2xl font-semibold tabular-nums">{currentScore + totalGain}</div>
          <div className="text-xs text-zinc-500">of target {target}</div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {top3.map((c,i) => (
          <div key={c.concept} className="rounded-md bg-zinc-900/60 border border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-semibold flex items-center justify-center">{i+1}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{c.section} · {c.domain}</span>
            </div>
            <div className="text-sm font-semibold text-white">{c.concept}</div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-zinc-400">Mastery</span>
              <span className="font-mono tabular-nums text-white">{c.mastery}%</span>
              <span className="text-zinc-600">·</span>
              <span className="text-emerald-400 font-medium">+{c.impact} pts potential</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400" style={{width:`${c.mastery}%`}}/>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <button className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-500"><Dumbbell className="w-3 h-3"/> Drill</button>
              <button className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-rose-600/90 text-white text-xs font-medium hover:bg-rose-600"><Play className="w-3 h-3 fill-current"/> {c.youtube.duration}</button>
            </div>
          </div>
        ))}
      </div>
    </SATCard>
  );
}
window.Leverage = Leverage;
