// Solutions — filtered tabs (Wrong / Skipped / Flagged / All), compact list with expansion
function Solutions({ questions }) {
  const { Check, X, Flag, Clock, Play, ChevronDown, ChevronUp, Bookmark } = window.LUCIDE;
  const [tab, setTab] = React.useState('wrong');
  const [expanded, setExpanded] = React.useState(null);

  const counts = {
    all:     questions.length,
    wrong:   questions.filter(q => q.status==='wrong').length,
    skipped: questions.filter(q => q.status==='skipped').length,
    flagged: questions.filter(q => q.flagged).length,
  };
  const filtered = questions.filter(q =>
    tab==='all' ? true :
    tab==='flagged' ? q.flagged :
    q.status === tab
  );

  const difficultyTone = { easy:'text-emerald-700 bg-emerald-50', medium:'text-amber-700 bg-amber-50', hard:'text-rose-700 bg-rose-50' };
  const statusIcon = (s) => s==='correct' ? <Check className="w-3.5 h-3.5 text-emerald-600"/> : s==='wrong' ? <X className="w-3.5 h-3.5 text-rose-600"/> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 inline-block"/>;

  return (
    <SATCard className="p-0">
      <div className="px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Review Questions</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Start with what you got wrong. Each comes with a solution and a linked video.</p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {[['wrong','Wrong',counts.wrong],['skipped','Skipped',counts.skipped],['flagged','Flagged',counts.flagged],['all','All',counts.all]].map(([k,l,c]) => (
              <button key={k} onClick={() => setTab(k)} className={`h-8 px-3 rounded-full text-xs font-medium transition inline-flex items-center gap-1.5 ${tab===k ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-700 hover:border-blue-300 hover:text-blue-700'}`}>
                {l} <span className={`tabular-nums ${tab===k ? 'text-zinc-400' : 'text-zinc-400'}`}>{c}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="divide-y divide-zinc-100">
        {filtered.map((q) => (
          <div key={q.n}>
            <button onClick={() => setExpanded(expanded===q.n ? null : q.n)} className="w-full px-5 py-3 flex items-center gap-3 hover:bg-zinc-50 text-left">
              <span className="w-7 text-xs font-mono text-zinc-400 tabular-nums">#{q.n}</span>
              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-zinc-50">{statusIcon(q.status)}</span>
              <span className="text-sm font-medium text-zinc-900 flex-1 truncate">{q.concept}</span>
              <span className="text-[10px] font-medium text-zinc-500">{q.section}·M{q.module}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${difficultyTone[q.difficulty]}`}>{q.difficulty}</span>
              {q.flagged && <Flag className="w-3 h-3 text-amber-600 fill-amber-100"/>}
              <span className="text-[11px] font-mono text-zinc-400 tabular-nums inline-flex items-center gap-0.5"><Clock className="w-3 h-3"/>{q.time}s</span>
              {expanded===q.n ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400"/> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400"/>}
            </button>
            {expanded === q.n && q.q && (
              <div className="px-5 pb-5 pt-1 bg-zinc-50/60">
                <div className="text-sm text-zinc-800 whitespace-pre-line">{q.q}</div>
                <div className="mt-3 space-y-1.5">
                  {q.choices.map((c,i) => {
                    const letter = 'ABCD'[i];
                    const correct = letter === q.correctAns;
                    const picked  = letter === q.pickedAns;
                    return (
                      <div key={i} className={`px-3 py-2 rounded-md border text-sm flex items-start gap-2 ${correct ? 'bg-emerald-50 border-emerald-200' : picked ? 'bg-rose-50 border-rose-200' : 'bg-white border-zinc-200'}`}>
                        <span className="font-mono font-semibold w-5 shrink-0">{letter}.</span>
                        <span className="flex-1">{c}</span>
                        {correct && <span className="text-[10px] font-semibold text-emerald-700 px-1.5 py-0.5 rounded bg-white">CORRECT</span>}
                        {picked && !correct && <span className="text-[10px] font-semibold text-rose-700 px-1.5 py-0.5 rounded bg-white">YOUR PICK</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-md bg-blue-50 border border-blue-100 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">Solution</div>
                  <div className="mt-1 text-sm text-zinc-800">{q.explanation}</div>
                </div>
                {q.videoId && (
                  <div className="mt-3 flex items-center gap-2">
                    <VideoChip videoId={q.videoId} title="Concept walkthrough" duration="watch"/>
                    <button className="h-7 px-2.5 rounded-md bg-white border border-zinc-200 text-zinc-700 text-xs font-medium hover:border-blue-300">Try similar Q</button>
                    <button className="h-7 px-2.5 rounded-md bg-white border border-zinc-200 text-zinc-700 text-xs font-medium hover:border-blue-300 inline-flex items-center gap-1"><Bookmark className="w-3 h-3"/>Save to review</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">Nothing in this tab — good work.</div>
        )}
      </div>
    </SATCard>
  );
}
window.Solutions = Solutions;
