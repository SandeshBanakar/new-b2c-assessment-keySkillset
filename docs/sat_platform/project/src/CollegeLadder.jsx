// College ladder — the core gamification module.
// Shows tiers on a vertical ladder with learner position,
// colleges unlocked at current score, and next unlock distance.
function CollegeLadder({ currentScore, target, colleges, tiers }) {
  const { Lock, Unlock, Trophy, ArrowRight, GraduationCap, MapPin, Sparkles } = window.LUCIDE;
  const [filter, setFilter] = React.useState('all'); // all | us | in

  const filtered = colleges.filter(c => filter === 'all' || (filter === 'us' ? c.flag === '🇺🇸' : c.flag === '🇮🇳'));
  const unlocked = filtered.filter(c => currentScore >= c.cutoff).sort((a,b) => b.cutoff - a.cutoff);
  const locked   = filtered.filter(c => currentScore <  c.cutoff).sort((a,b) => a.cutoff - b.cutoff);
  const nextUnlock = locked[0];

  // Compute tier progress
  const currentTier = [...tiers].reverse().find(t => currentScore >= t.min) || tiers[0];
  const nextTier    = tiers.find(t => t.min > currentScore);

  return (
    <SATCard className="p-5">
      <SATSectionTitle
        eyebrow="College Eligibility"
        title={`Colleges you can reach with ${currentScore}`}
        desc="Updated after every attempt. Cutoffs use published 25th–75th percentile bands."
        right={
          <div className="flex items-center gap-1">
            {[['all','All'],['us','🇺🇸 US'],['in','🇮🇳 India']].map(([k,l]) => (
              <SATPill key={k} active={filter===k} onClick={() => setFilter(k)}>{l}</SATPill>
            ))}
          </div>
        }
      />

      <div className="grid md:grid-cols-12 gap-5">
        {/* Ladder rail */}
        <div className="md:col-span-4">
          <TierRail tiers={tiers} currentScore={currentScore} target={target}/>
        </div>

        {/* Unlocked + next unlock */}
        <div className="md:col-span-8 space-y-4">
          {/* Next unlock call-out */}
          {nextUnlock && (
            <div className="rounded-md border border-amber-200 bg-amber-50/60 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-white border border-amber-200 flex items-center justify-center text-xs font-semibold text-zinc-700">
                <Lock className="w-4 h-4 text-amber-700"/>
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-amber-700 uppercase tracking-wide">Next unlock</div>
                <div className="mt-0.5 text-sm font-semibold text-zinc-900">
                  {nextUnlock.name} <span className="text-zinc-500 font-normal">· {nextUnlock.flag}</span>
                </div>
                <div className="text-xs text-zinc-600 mt-0.5">
                  <span className="font-medium text-zinc-900 tabular-nums">+{nextUnlock.cutoff - currentScore} points</span> · reach {nextUnlock.cutoff}
                  {' · '}
                  <span className="text-zinc-500">scholarship up to {nextUnlock.aidPct}%</span>
                </div>
              </div>
              <button className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800">
                Plan path <ArrowRight className="w-3 h-3"/>
              </button>
            </div>
          )}

          {/* Unlocked grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide inline-flex items-center gap-1.5">
                <Unlock className="w-3 h-3"/> Unlocked · {unlocked.length}
              </div>
              <div className="text-xs text-zinc-500">Sorted by cutoff, highest first</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {unlocked.slice(0, 9).map(c => (
                <CollegeCard key={c.name} college={c} unlocked={true}/>
              ))}
            </div>
          </div>

          {/* Locked — next tier preview */}
          {locked.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3"/> Locked · {locked.length}
                </div>
                {nextTier && <div className="text-xs text-zinc-500">Next tier <span className="font-medium text-zinc-700">{nextTier.label}</span> at {nextTier.min}+</div>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {locked.slice(0, 6).map(c => (
                  <CollegeCard key={c.name} college={c} unlocked={false} pointsAway={c.cutoff - currentScore}/>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SATCard>
  );
}

// Vertical tier ladder with learner dot
function TierRail({ tiers, currentScore, target }) {
  const H = 360, Wd = 180;
  const ymin = 1000, ymax = 1600;
  const ys = (v) => 20 + ((ymax - v) / (ymax - ymin)) * (H - 40);

  const toneBand = {
    zinc:'#f4f4f5', teal:'#f0fdfa', blue:'#eff6ff', violet:'#f5f3ff', amber:'#fffbeb'
  };
  const toneLabel = {
    zinc:'text-zinc-700', teal:'text-teal-700', blue:'text-blue-700', violet:'text-violet-700', amber:'text-amber-700'
  };

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${Wd} ${H}`} className="w-full h-auto">
        {/* tier bands */}
        {tiers.map((t,i) => {
          const y1 = ys(t.max), y2 = ys(t.min);
          return (
            <g key={t.key}>
              <rect x="40" y={y1} width="90" height={y2-y1} fill={toneBand[t.color]} stroke="#e4e4e7"/>
              <text x="85" y={(y1+y2)/2 - 4} fontSize="10" fontWeight="600" fill="#18181b" textAnchor="middle">{t.label}</text>
              <text x="85" y={(y1+y2)/2 + 8} fontSize="9" fill="#71717a" textAnchor="middle">{t.min}–{t.max}</text>
            </g>
          );
        })}
        {/* scale ticks */}
        {[1000,1100,1200,1300,1400,1500,1600].map(v => (
          <g key={v}>
            <line x1="30" x2="40" y1={ys(v)} y2={ys(v)} stroke="#d4d4d8"/>
            <text x="26" y={ys(v)+3} fontSize="9" fill="#71717a" textAnchor="end">{v}</text>
          </g>
        ))}
        {/* target marker */}
        <g>
          <line x1="40" x2="150" y1={ys(target)} y2={ys(target)} stroke="#d97706" strokeDasharray="3 3" strokeWidth="1.25"/>
          <circle cx="135" cy={ys(target)} r="4" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5"/>
          <text x="155" y={ys(target)+3} fontSize="9" fontWeight="600" fill="#b45309">Goal {target}</text>
        </g>
        {/* learner marker */}
        <g>
          <line x1="25" x2="140" y1={ys(currentScore)} y2={ys(currentScore)} stroke="#1d4ed8" strokeWidth="1.5"/>
          <circle cx="40" cy={ys(currentScore)} r="6" fill="#1d4ed8"/>
          <circle cx="40" cy={ys(currentScore)} r="10" fill="#1d4ed8" fillOpacity="0.2"/>
          <rect x="140" y={ys(currentScore)-10} rx="4" width="36" height="18" fill="#1d4ed8"/>
          <text x="158" y={ys(currentScore)+3} fontSize="10" fontWeight="700" fill="white" textAnchor="middle">{currentScore}</text>
        </g>
      </svg>
    </div>
  );
}

function CollegeCard({ college, unlocked, pointsAway }) {
  const { Lock, Check, MapPin } = window.LUCIDE;
  return (
    <div className={`rounded-md border p-2.5 flex items-center gap-2.5 transition ${unlocked ? 'bg-white border-zinc-200 hover:shadow-sm' : 'bg-zinc-50 border-zinc-200 opacity-90'}`}>
      <div className={`w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 ${unlocked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white border border-zinc-200 text-zinc-400'}`}>
        {unlocked
          ? <Check className="w-4 h-4"/>
          : <span className="tabular-nums">+{pointsAway}</span>
        }
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${unlocked ? 'text-zinc-900' : 'text-zinc-600'}`}>{college.name}</div>
        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
          <span>{college.flag}</span>
          <span>·</span>
          <span className="tabular-nums">{college.cutoff}+</span>
          {college.aidPct >= 60 && <><span>·</span><span className="text-emerald-700 font-medium">aid {college.aidPct}%</span></>}
        </div>
      </div>
    </div>
  );
}

window.CollegeLadder = CollegeLadder;
