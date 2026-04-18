// Page header — dark band + breadcrumbs + tabs
function PageHeader({ meta }) {
  const { ChevronLeft, Star, Users } = window.LUCIDE;
  return (
    <div className="bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-5 pb-6">
        <a href="#" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white mb-3">
          <ChevronLeft className="w-3.5 h-3.5"/> Back to Assessments
        </a>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{meta.assessment}</h1>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400"/> 4.8</span>
              <span className="inline-flex items-center gap-1"><Users className="w-3 h-3"/> 500+ Users</span>
              <span className="inline-block h-3 w-px bg-zinc-700"/>
              <span>{meta.badge} · adaptive</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center gap-6 border-b border-zinc-800">
        {['Overview','Attempts','Analytics'].map((t,i) => (
          <button key={t} className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${t==='Analytics' ? 'text-white border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>{t}</button>
        ))}
      </div>
    </div>
  );
}
window.PageHeader = PageHeader;
