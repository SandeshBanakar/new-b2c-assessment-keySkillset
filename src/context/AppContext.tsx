'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import { mockUser } from '@/utils/assessmentUtils';

interface AppContextValue {
  user: User;
  setUser: (user: User) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(mockUser);
  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
}
