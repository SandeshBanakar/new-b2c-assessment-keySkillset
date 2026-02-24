'use client';

import Link from 'next/link';
import { Flame, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/assessments', label: 'Assessments' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAppContext();

  if (!user) return null;

  const initials = (user.displayName ?? user.email)
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Hide Navbar on pages that manage their own full-screen layout
  if (pathname === '/onboarding') return null;

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">

        {/* Left — logo + nav links */}
        <div className="flex items-center gap-6">
          <span className="text-blue-700 font-bold text-base">keySkillset</span>
          <div className="hidden sm:flex items-center gap-4">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-700 underline underline-offset-4'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right — streak, XP, upgrade badge, avatar */}
        <div className="flex items-center gap-3">
          <span
            data-tour="streak"
            className="flex items-center gap-1 text-sm font-medium text-amber-500"
          >
            <Flame className="w-4 h-4 text-amber-500" /> {user.streak} days
          </span>

          <span className="hidden sm:flex items-center gap-1 text-sm font-medium text-zinc-600">
            <Zap className="w-4 h-4 text-amber-500" /> {user.xp} XP
          </span>

          {user.subscriptionTier === 'free' && (
            <span data-tour="upgrade-badge">
              <Button
                asChild
                size="sm"
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-full text-xs px-3 h-7"
              >
                <Link href="/plans">Upgrade</Link>
              </Button>
            </span>
          )}

          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

      </div>
    </nav>
  );
}
