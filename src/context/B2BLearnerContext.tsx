'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getTenantId } from '@/lib/client-admin/tenants';

export interface B2BLearner {
  id: string;
  full_name: string;
  email: string;
  tenant_id: string;
  department_id: string | null;
}

interface TenantInfo {
  name: string;
  logo_url: string | null;
}

interface B2BLearnerContextValue {
  learner: B2BLearner | null;
  tenantSlug: string;
  tenantId: string | null;
  tenantInfo: TenantInfo | null;
  login: (learner: B2BLearner) => void;
  logout: () => void;
  isLoading: boolean;
}

const B2BLearnerContext = createContext<B2BLearnerContextValue | null>(null);

function storageKey(slug: string) {
  return `b2b_learner_${slug}`;
}

export function B2BLearnerProvider({ children, tenantSlug }: { children: ReactNode; tenantSlug: string }) {
  const [learner, setLearner] = useState<B2BLearner | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tenantId = getTenantId(tenantSlug);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(tenantSlug));
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as B2BLearner;
        if (parsed.tenant_id === tenantId) {
          setLearner(parsed);
        } else {
          localStorage.removeItem(storageKey(tenantSlug));
        }
      } catch {
        localStorage.removeItem(storageKey(tenantSlug));
      }
    }
    setIsLoading(false);
  }, [tenantSlug, tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from('tenants')
      .select('name, logo_url')
      .eq('id', tenantId)
      .single()
      .then(({ data }) => {
        if (data) setTenantInfo({ name: data.name, logo_url: data.logo_url ?? null });
      });
  }, [tenantId]);

  function login(learnerData: B2BLearner) {
    localStorage.setItem(storageKey(tenantSlug), JSON.stringify(learnerData));
    setLearner(learnerData);
  }

  function logout() {
    localStorage.removeItem(storageKey(tenantSlug));
    setLearner(null);
  }

  return (
    <B2BLearnerContext.Provider value={{ learner, tenantSlug, tenantId, tenantInfo, login, logout, isLoading }}>
      {children}
    </B2BLearnerContext.Provider>
  );
}

export function useB2BLearner() {
  const ctx = useContext(B2BLearnerContext);
  if (!ctx) throw new Error('useB2BLearner must be used within B2BLearnerProvider');
  return ctx;
}
