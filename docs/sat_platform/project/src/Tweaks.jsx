// Tweaks panel
function Tweaks({ open, values, onChange, onClose }) {
  const { Settings2, X } = window.LUCIDE;
  if (!open) return null;
  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-100 last:border-0">
      <span className="text-xs text-zinc-600">{label}</span>
      {children}
    </div>
  );
  const Seg = ({ k, options }) => (
    <div className="inline-flex rounded-md border border-zinc-200 bg-white overflow-hidden">
      {options.map(([v,l]) => (
        <button key={v} onClick={() => onChange({[k]:v})} className={`h-7 px-2.5 text-xs font-medium ${values[k]===v ? 'bg-blue-700 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}>{l}</button>
      ))}
    </div>
  );
  const Toggle = ({ k }) => (
    <button onClick={() => onChange({[k]: !values[k]})} className={`w-9 h-5 rounded-full relative transition ${values[k] ? 'bg-blue-700' : 'bg-zinc-200'}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${values[k] ? 'left-4' : 'left-0.5'}`}/>
    </button>
  );

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 bg-white border border-zinc-200 rounded-md shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="inline-flex items-center gap-2"><Settings2 className="w-4 h-4 text-zinc-500"/><span className="text-sm font-semibold text-zinc-900">Tweaks</span></div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900"><X className="w-4 h-4"/></button>
      </div>
      <div className="px-4 py-2">
        <Row label="Hero style">
          <Seg k="heroStyle" options={[['combo','Combo'],['ladderFirst','Ladder first']]}/>
        </Row>
        <Row label="Target score">
          <Seg k="target" options={[[1400,'1400'],[1500,'1500'],[1600,'1600']]}/>
        </Row>
        <Row label="College context">
          <Seg k="collegeContext" options={[['all','Both'],['us','US'],['in','India']]}/>
        </Row>
        <Row label="Show Study Plan">
          <Toggle k="showStudyPlan"/>
        </Row>
        <Row label="Show Peer Percentile">
          <Toggle k="showPeer"/>
        </Row>
        <Row label="Coach tone (directive copy)">
          <Toggle k="coachTone"/>
        </Row>
        <Row label="Density">
          <Seg k="density" options={[['spacious','Spacious'],['compact','Compact']]}/>
        </Row>
      </div>
    </div>
  );
}
window.Tweaks = Tweaks;
