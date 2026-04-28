'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LogOut } from 'lucide-react';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { useRouter } from 'next/navigation';

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function B2BNavbar() {
  const { learner, tenantSlug, tenantInfo, logout } = useB2BLearner();
  const pathname = usePathname();
  const router = useRouter();

  if (!learner) return null;

  const base = `/b2b-learner/${tenantSlug}`;

  const tabs = [
    { label: 'My Learning',  href: base },
    { label: 'Courses',      href: `${base}/courses` },
    { label: 'Assessments',  href: `${base}/assessments` },
    { label: 'Certificates', href: `${base}/certificates` },
  ];

  function isActive(href: string) {
    if (href === base) return pathname === base;
    return pathname.startsWith(href);
  }

  function handleLogout() {
    logout();
    router.replace(`${base}/login`);
  }

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Single row — brand | tabs centered | learner */}
        <div className="h-14 grid items-stretch" style={{ gridTemplateColumns: 'auto 1fr auto' }}>

          {/* Brand */}
          <div className="flex items-center gap-2 pr-4">
            {tenantInfo?.logo_url ? (
              <img
                src={tenantInfo.logo_url}
                alt={tenantInfo.name}
                className="h-7 w-auto object-contain"
              />
            ) : (
              <div className="h-7 w-7 bg-teal-700 rounded-md flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <span className="text-sm font-semibold text-zinc-900 hidden md:block max-w-[140px] truncate">
              {tenantInfo?.name ?? tenantSlug}
            </span>
          </div>


          {/* Tabs — centered within their column */}
          <div className="flex items-stretch justify-center overflow-x-auto scrollbar-none">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 md:px-4 flex items-center text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive(tab.href)
                    ? 'border-teal-700 text-teal-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Learner + logout */}
          <div className="flex items-center gap-2 pl-3 shrink-0">
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold flex items-center justify-center shrink-0">
              {getInitials(learner.full_name)}
            </div>
            <span className="hidden lg:block text-sm text-zinc-600 max-w-[100px] truncate">
              {learner.full_name}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
