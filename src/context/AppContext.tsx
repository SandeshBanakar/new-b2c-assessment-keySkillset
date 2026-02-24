'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DEMO_SESSION_KEY, getDemoUserById } from '@/lib/demoAuth';
import type { User, Exam } from '@/types';

interface AppContextValue {
  user: User | null;
  isAuthLoading: boolean;
  setUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

/** Maps a public.users row → our User type */
function mapRow(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string,
    subscriptionTier: row.subscription_tier as User['subscriptionTier'],
    subscriptionStatus: row.subscription_status as User['subscriptionStatus'],
    subscriptionStartDate: row.subscription_start_date as string | null,
    subscriptionEndDate: row.subscription_end_date as string | null,
    razorpaySubscriptionId: row.razorpay_subscription_id as string | null,
    razorpayPlanId: row.razorpay_plan_id as string | null,
    razorpayCustomerId: row.razorpay_customer_id as string | null,
    userOnboarded: row.user_onboarded as boolean,
    selectedExams: ((row.selected_exams ?? []) as Exam[]),
    goal: row.goal as string | null,
    xp: (row.xp as number) ?? 0,
    streak: (row.streak as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    const AUTH_PATHS = ['/auth', '/onboarding'];

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      async function resolve() {
        // ── Path A: Real Supabase session ──────────────────────────────────
        if (session) {
          const { data: row } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;

          if (!row) {
            setUser(null);
            setIsAuthLoading(false);
            if (!AUTH_PATHS.includes(pathname)) router.replace('/auth');
            return;
          }

          setUser(mapRow(row as Record<string, unknown>));
          setIsAuthLoading(false);

          if (!row.user_onboarded && pathname !== '/onboarding' && pathname !== '/auth') {
            router.replace('/onboarding');
          }
          return;
        }

        // ── Path B: No Supabase session — check for demo session ───────────
        // Profile is embedded in demoAuth.ts — no DB query needed (avoids RLS block).
        const demoUserId = localStorage.getItem(DEMO_SESSION_KEY);

        if (demoUserId) {
          const demoUser = getDemoUserById(demoUserId);

          if (!mounted) return;

          if (demoUser) {
            setUser(demoUser);
            setIsAuthLoading(false);

            if (!demoUser.userOnboarded && pathname !== '/onboarding' && pathname !== '/auth') {
              router.replace('/onboarding');
            }
            return;
          }

          // Stale / unrecognised demo ID — clear and fall through
          localStorage.removeItem(DEMO_SESSION_KEY);
        }

        // ── Path C: No session at all — redirect to /auth ──────────────────
        if (!mounted) return;
        setUser(null);
        setIsAuthLoading(false);
        if (!AUTH_PATHS.includes(pathname)) {
          router.replace('/auth');
        }
      }

      void resolve();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider value={{ user, isAuthLoading, setUser }}>
      {isAuthLoading ? null : children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
}
