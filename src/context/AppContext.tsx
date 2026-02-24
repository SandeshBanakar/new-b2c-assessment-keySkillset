'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Exam } from '@/types';

interface AppContextValue {
  user: User | null;
  isAuthLoading: boolean;
  setUser: (user: User) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      async function resolve() {
        if (!session) {
          if (!mounted) return;
          setUser(null);
          setIsAuthLoading(false);
          if (pathname !== '/onboarding') {
            router.replace('/onboarding');
          }
          return;
        }

        const { data: row } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!mounted) return;

        if (!row) {
          setUser(null);
          setIsAuthLoading(false);
          if (pathname !== '/onboarding') {
            router.replace('/onboarding');
          }
          return;
        }

        const mapped: User = {
          id: row.id,
          email: row.email,
          displayName: row.display_name,
          subscriptionTier: row.subscription_tier,
          subscriptionStatus: row.subscription_status,
          subscriptionStartDate: row.subscription_start_date,
          subscriptionEndDate: row.subscription_end_date,
          razorpaySubscriptionId: row.razorpay_subscription_id,
          razorpayPlanId: row.razorpay_plan_id,
          razorpayCustomerId: row.razorpay_customer_id,
          userOnboarded: row.user_onboarded,
          selectedExams: (row.selected_exams ?? []) as Exam[],
          goal: row.goal,
          xp: row.xp ?? 0,
          streak: row.streak ?? 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        setUser(mapped);
        setIsAuthLoading(false);

        if (!row.user_onboarded && pathname !== '/onboarding') {
          router.replace('/onboarding');
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
