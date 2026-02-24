'use client';

import { useAppContext } from '@/context/AppContext';
import type { User } from '@/types';

export function useUser(): User | null {
  return useAppContext().user;
}
