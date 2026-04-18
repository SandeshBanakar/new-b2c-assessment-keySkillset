// Study Plan — curated weekly plan with YouTube + drills
function StudyPlan({ plan }) {
  const { Calendar, Play, Dumbbell, CheckCircle2, Clock } = window.LUCIDE;
  const [done, setDone] = React.useState({});
  const toggle = (i) => setDone(d => ({ ...d, [i]: !d[i] }));
  const completed = Object.values(done).filter(Boolean).length;

  return (
    <SATCard className="p-5">
      <SATSectionTitle
        eyebrow="Coach · Free study plan"
        title="Your week · built from your weakest concepts"
        desc="Short videos first, drills second. Check off each day — we adapt next week's plan from what you practised."
        right={<div className="text-xs text-zinc-500"><span className="font-semibold text-zinc-900 tabular-nums">{completed}/7</span> days done · projected <span className="font-semibold text-emerald-700">+{plan.projectedGain} pts</span></div>}
      />
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
        {plan.days.map((d,i) => {
          const isDone = done[i];
          return (
            <div key={i} className={`rounded-md border p-3 transition ${isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-zinc-200 hover:shadow-sm'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold uppercase tracking-wide ${isDone ? 'text-emerald-700' : 'text-zinc-400'}`}>{d.day}</span>
                <button onClick={() => toggle(i)} className={`w-5 h-5 rounded-full flex items-center justify-center transition ${isDone ? 'bg-emerald-600 text-white' : 'border border-zinc-300 text-zinc-300 hover:border-blue-500'}`}>
                  {isDone && <CheckCircle2 className="w-3 h-3"/>}
                </button>
              </div>
              <div className="text-xs font-medium text-zinc-900 line-clamp-2 min-h-[32px]">{d.focus}</div>
              {d.videoId ? (
                <div className="mt-2 relative rounded-sm overflow-hidden aspect-video bg-zinc-200">
                  <img src={ytThumb(d.videoId)} alt="" className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center"><Play className="w-3 h-3 text-white fill-current"/></div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 rounded-sm aspect-video bg-zinc-50 border border-dashed border-zinc-200 flex items-center justify-center text-[10px] text-zinc-400">drill only</div>
              )}
              <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500 font-mono tabular-nums">
                <span className="inline-flex items-center gap-0.5"><Clock className="w-2.5 h-2.5"/>{d.minutes}m</span>
                {d.drills > 0 && <span className="inline-flex items-center gap-0.5"><Dumbbell className="w-2.5 h-2.5"/>{d.drills}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </SATCard>
  );
}
window.StudyPlan = StudyPlan;
