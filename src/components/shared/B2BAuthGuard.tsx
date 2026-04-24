'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useB2BLearner } from '@/context/B2BLearnerContext';

export function B2BAuthGuard({ children }: { children: React.ReactNode }) {
  const { learner, isLoading, tenantSlug } = useB2BLearner();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !learner) {
      router.replace(`/b2b-learner/${tenantSlug}/login`);
    }
  }, [learner, isLoading, tenantSlug, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!learner) return null;

  return <>{children}</>;
}
