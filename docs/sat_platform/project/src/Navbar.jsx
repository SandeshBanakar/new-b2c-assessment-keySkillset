// Top navbar — matches existing learner navbar
function Navbar({ user }) {
  const { Flame, Zap, Users } = window.LUCIDE;
  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-blue-700 font-semibold text-base">keySkillset</span>
          <div className="hidden sm:flex items-center gap-5">
            <a className="text-sm font-medium text-zinc-500 hover:text-zinc-700" href="#">Dashboard</a>
            <a className="text-sm font-medium text-blue-700" href="#">Assessments</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm font-medium text-amber-500"><Flame className="w-4 h-4"/>{user.streak} days</span>
          <span className="hidden sm:flex items-center gap-1 text-sm font-medium text-zinc-600"><Zap className="w-4 h-4 text-amber-500"/>{user.xp.toLocaleString()} XP</span>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">{user.initials}</div>
          <button className="text-zinc-400 hover:text-zinc-600" aria-label="Switch profile"><Users className="w-4 h-4"/></button>
        </div>
      </div>
    </nav>
  );
}
window.Navbar = Navbar;
