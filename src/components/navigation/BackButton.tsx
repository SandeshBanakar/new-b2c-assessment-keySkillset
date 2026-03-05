'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const BACK_MAP: Record<string, { label: string; href: string }> = {
  assessments: { label: 'Back to Assessments', href: '/assessments' },
  dashboard:   { label: 'Back to Dashboard',   href: '/' },
  plans:       { label: 'Back to Plans',        href: '/plans' },
};

const FALLBACK = { label: 'Back to Assessments', href: '/assessments' };

interface BackButtonProps {
  className?: string;
}

function BackButtonInner({ className }: BackButtonProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '';
  const { label, href } = BACK_MAP[from] ?? FALLBACK;

  return (
    <Link
      href={href}
      className={`flex items-center gap-1 text-sm transition-colors ${className ?? 'text-zinc-500 hover:text-zinc-800'}`}
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}

export function BackButton({ className }: BackButtonProps) {
  return (
    <Suspense fallback={<div className="h-5 w-40" />}>
      <BackButtonInner className={className} />
    </Suspense>
  );
}
