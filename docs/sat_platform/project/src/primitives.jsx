// Shared primitives for SAT Analytics page.
// NOTE: unique names to avoid window scope collisions.

const SATCard = ({ className='', children, ...rest }) => (
  <div {...rest} className={`bg-white border border-zinc-200 rounded-md ${className}`}>{children}</div>
);

const SATSectionTitle = ({ eyebrow, title, desc, right }) => (
  <div className="flex items-end justify-between gap-4 mb-4">
    <div>
      {eyebrow && <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{eyebrow}</div>}
      <h2 className="text-lg font-semibold text-zinc-900 mt-1">{title}</h2>
      {desc && <p className="text-sm text-zinc-500 mt-0.5">{desc}</p>}
    </div>
    {right}
  </div>
);

const SATBadge = ({ tone='zinc', children, className='' }) => {
  const toneMap = {
    zinc:'bg-zinc-100 text-zinc-700',
    blue:'bg-blue-50 text-blue-700',
    rose:'bg-rose-50 text-rose-700',
    amber:'bg-amber-50 text-amber-700',
    emerald:'bg-emerald-50 text-emerald-700',
    violet:'bg-violet-50 text-violet-700',
    teal:'bg-teal-50 text-teal-700',
    green:'bg-green-50 text-green-700',
  };
  return <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${toneMap[tone]} ${className}`}>{children}</span>;
};

const SATPill = ({ active, onClick, children, className='' }) => (
  <button onClick={onClick} className={`h-8 px-3 rounded-full text-xs font-medium transition ${active ? 'bg-blue-700 text-white' : 'bg-white border border-zinc-200 text-zinc-700 hover:border-blue-300 hover:text-blue-700'} ${className}`}>{children}</button>
);

const SATButton = ({ variant='primary', size='md', className='', children, ...rest }) => {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors';
  const v = {
    primary:'bg-blue-700 text-white hover:bg-blue-800',
    outline:'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
    ghost:  'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50',
    dark:   'bg-zinc-900 text-white hover:bg-zinc-800',
  }[variant];
  const s = { sm:'h-8 px-3 text-xs', md:'h-9 px-4 text-sm', lg:'h-10 px-6 text-sm' }[size];
  return <button {...rest} className={`${base} ${v} ${s} ${className}`}>{children}</button>;
};

// Mastery color
const satMasteryTone = (v) =>
  v == null ? 'bg-zinc-100 text-zinc-400' :
  v >= 80 ? 'bg-emerald-50 text-emerald-700' :
  v >= 60 ? 'bg-amber-50 text-amber-700' :
            'bg-rose-50 text-rose-700';

// Simple YouTube thumbnail via hq default
const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Video chip — opens inline player
function VideoChip({ videoId, title, duration, className='' }) {
  const { Play } = window.LUCIDE;
  const [open, setOpen] = React.useState(false);
  if (!videoId) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 transition ${className}`}>
        <Play className="w-3 h-3 fill-current"/> Watch · {duration || '—'}
      </button>
      {open && <VideoModal videoId={videoId} title={title} onClose={() => setOpen(false)}/>}
    </>
  );
}

function VideoModal({ videoId, title, onClose }) {
  const { X } = window.LUCIDE;
  React.useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-md overflow-hidden max-w-3xl w-full" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="text-sm font-medium text-white truncate">{title}</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-4 h-4"/></button>
        </div>
        <div className="aspect-video bg-black flex items-center justify-center text-zinc-500">
          {/* Placeholder — real embed would be <iframe src={`https://www.youtube.com/embed/${videoId}`} /> */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div className="text-sm text-zinc-400">YouTube video · {videoId}</div>
            <div className="text-xs text-zinc-600 mt-1">(placeholder · embed would play here)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SATCard, SATSectionTitle, SATBadge, SATPill, SATButton, satMasteryTone, ytThumb, VideoChip, VideoModal });
