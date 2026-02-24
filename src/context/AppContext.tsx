'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
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

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserProfile(userId: string) {
      setIsAuthLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser(mapRow(data as Record<string, unknown>));
      } else {
        console.error('Profile fetch error:', error);
        setUser(null);
      }
      setIsAuthLoading(false);
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsAuthLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsAuthLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ user, isAuthLoading, setUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
}
