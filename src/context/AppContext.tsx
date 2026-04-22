'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { DEMO_USERS, STORAGE_KEY } from '@/data/demoUsers';
import { SUBSCRIBED_ASSESSMENTS } from '@/data/assessments';
import { supabase } from '@/lib/supabase/client';
import type { User, Exam, Tier, ActivePlanInfo } from '@/types';

interface AppContextValue {
  user: User | null;
  switchPersona: (userId: string) => void;
  simulateTierChange: (newTier: string) => void;
  updateUser: (fields: Partial<User>) => void;
  updateTargetScore: (exam: 'NEET' | 'JEE' | 'CLAT', score: number) => void;
  logout: () => void;
  isSubscribed: (assessmentId: string) => boolean;
  subscribeToAssessment: (assessmentId: string) => void;
  subscribeVersion: number;
}

const AppContext = createContext<AppContextValue | null>(null);

function demoUserToUser(demo: (typeof DEMO_USERS)[number]): User {
  return {
    id: demo.id,
    email: demo.email,
    displayName: demo.display_name,
    subscriptionTier: demo.subscription_tier as Tier,
    subscriptionStatus: demo.subscription_status,
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    razorpaySubscriptionId: null,
    razorpayPlanId: null,
    razorpayCustomerId: null,
    userOnboarded: demo.user_onboarded,
    selectedExams: demo.selected_exams as Exam[],
    goal: demo.goal,
    xp: demo.xp,
    streak: demo.streak,
    createdAt: '',
    updatedAt: '',
    activePlanInfo: (demo.active_plan_info ?? null) as ActivePlanInfo | null,
    targetSatScore: demo.target_sat_score ?? null,
    targetSatSubjectScore: demo.target_sat_subject_score ?? null,
    targetNeetScore: demo.target_neet_score ?? null,
    targetJeeScore: demo.target_jee_score ?? null,
    targetClatScore: demo.target_clat_score ?? null,
  };
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load persisted persona after hydration — null on SSR keeps server/client HTML in sync
  useEffect(() => {
    const loadStoredPersona = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const demo = DEMO_USERS.find((u) => u.id === stored);
      if (demo) setUser(demoUserToUser(demo));
    };
    void loadStoredPersona();
  }, []);
  const [subscribeVersion, setSubscribeVersion] = useState(0);

  const switchPersona = (userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (!found) return;
    localStorage.setItem(STORAGE_KEY, userId);
    setUser(demoUserToUser(found));
  };

  const simulateTierChange = (newTier: string) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            subscriptionTier: newTier as Tier,
            subscriptionStatus: newTier === 'free' ? 'free' : 'active',
          }
        : prev,
    );
  };

  const updateUser = (fields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  };

  const updateTargetScore = (exam: 'NEET' | 'JEE' | 'CLAT', score: number) => {
    const fieldMap = {
      NEET: 'targetNeetScore',
      JEE: 'targetJeeScore',
      CLAT: 'targetClatScore',
    } as const;
    const dbColMap = {
      NEET: 'target_neet_score',
      JEE: 'target_jee_score',
      CLAT: 'target_clat_score',
    } as const;
    setUser((prev) => (prev ? { ...prev, [fieldMap[exam]]: score } : prev));
    if (user?.id) {
      supabase.from('users').update({ [dbColMap[exam]]: score }).eq('id', user.id);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const isSubscribed = (assessmentId: string): boolean => {
    if (!user) return false;
    return (SUBSCRIBED_ASSESSMENTS[user.id] ?? []).includes(assessmentId);
  };

  const subscribeToAssessment = (assessmentId: string) => {
    if (!user) return;
    SUBSCRIBED_ASSESSMENTS[user.id] = [
      ...(SUBSCRIBED_ASSESSMENTS[user.id] ?? []),
      assessmentId,
    ];
    setSubscribeVersion((v) => v + 1);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        switchPersona,
        simulateTierChange,
        updateUser,
        updateTargetScore,
        logout,
        isSubscribed,
        subscribeToAssessment,
        subscribeVersion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
}
