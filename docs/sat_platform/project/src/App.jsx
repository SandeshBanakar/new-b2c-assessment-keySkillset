// Root app
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroStyle": "combo",
  "target": 1500,
  "collegeContext": "all",
  "showStudyPlan": true,
  "showPeer": true,
  "coachTone": true,
  "density": "spacious"
}/*EDITMODE-END*/;

function App() {
  const D = window.DATA;
  const latest = D.attempts[D.attempts.length - 1];
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [editMode, setEditMode] = React.useState(false);

  React.useEffect(() => {
    const h = (ev) => {
      const t = ev.data?.type;
      if (t === '__activate_edit_mode')   setEditMode(true);
      if (t === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', h);
    window.parent.postMessage({type:'__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', h);
  }, []);

  const setTweak = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    window.parent.postMessage({type:'__edit_mode_set_keys', edits: patch}, '*');
  };

  const gap = tweaks.density === 'compact' ? 'gap-3' : 'gap-4';
  const pad = tweaks.density === 'compact' ? 'py-5' : 'py-8';

  // Filter colleges if tweaks set a region
  const filteredColleges = tweaks.collegeContext === 'all' ? D.colleges
    : D.colleges.filter(c => tweaks.collegeContext === 'us' ? c.flag === '🇺🇸' : c.flag === '🇮🇳');

  return (
    <>
      <window.Navbar user={D.meta.student}/>
      <window.PageHeader meta={D.meta}/>
      <div className={`max-w-6xl mx-auto px-4 md:px-8 ${pad} space-y-${tweaks.density === 'compact' ? '4' : '6'}`}>

        {/* 1. Hero: score + target + trajectory */}
        <window.HeroScore attempts={D.attempts} target={tweaks.target} onTargetChange={(v)=>setTweak({target:v})}/>

        {/* 2. College ladder — gamification centerpiece */}
        <window.CollegeLadder currentScore={latest.total} target={tweaks.target} colleges={filteredColleges} tiers={D.tiers}/>

        {/* 3. Highest-leverage weaknesses (dark call-out) */}
        <window.Leverage concepts={D.concepts} currentScore={latest.total} target={tweaks.target}/>

        {/* 4. Study plan */}
        {tweaks.showStudyPlan && <window.StudyPlan plan={D.studyPlan}/>}

        {/* 5. Two-column analytics row: concept mastery | side panels */}
        <div className={`grid md:grid-cols-3 ${gap}`}>
          <div className="md:col-span-2">
            <window.ConceptMastery concepts={D.concepts}/>
          </div>
          <div className={`space-y-${tweaks.density === 'compact' ? '3' : '4'}`}>
            <window.SectionBreakdown data={D.sectionBreakdown}/>
            <window.DifficultyBreakdown difficulty={D.difficulty}/>
          </div>
        </div>

        {/* 6. Pacing */}
        <window.Pacing pacing={D.pacing}/>

        {/* 7. Mistake taxonomy + Peer percentile */}
        <div className={`grid md:grid-cols-3 ${gap}`}>
          <div className="md:col-span-2"><window.MistakeTaxonomy mistakes={D.mistakes}/></div>
          {tweaks.showPeer && <window.PeerPercentile peer={D.peer}/>}
        </div>

        {/* 8. Solutions — behind tabs, wrong-first */}
        <window.Solutions questions={D.questions}/>

        <div className="text-center text-xs text-zinc-400 pt-6 pb-2">— end of analysis · next attempt opens 18 Mar —</div>
      </div>

      <window.Tweaks open={editMode} values={tweaks} onChange={setTweak} onClose={() => { setEditMode(false); window.parent.postMessage({type:'__edit_mode_deactivate'},'*'); }}/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
