'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { DEMO_USERS, STORAGE_KEY } from '@/data/demoUsers';
import { SUBSCRIBED_ASSESSMENTS } from '@/data/assessments';
import type { User, Exam, Tier } from '@/types';

interface AppContextValue {
  user: User | null;
  switchPersona: (userId: string) => void;
  simulateTierChange: (newTier: string) => void;
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
  };
}

const getActiveUser = (): User | null => {
  if (typeof window === 'undefined') return demoUserToUser(DEMO_USERS[2]); // SSR fallback = Priya
  const stored = localStorage.getItem(STORAGE_KEY);
  const demo = DEMO_USERS.find((u) => u.id === stored);
  return demo ? demoUserToUser(demo) : null;
};

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getActiveUser);
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
