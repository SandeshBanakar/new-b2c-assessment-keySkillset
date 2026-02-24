'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!user.userOnboarded) {
      router.push('/onboarding');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !user.userOnboarded) return null;

  return <>{children}</>;
}
