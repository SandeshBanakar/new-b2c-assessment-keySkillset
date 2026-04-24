'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Building2, AlertTriangle, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getTenantId } from '@/lib/client-admin/tenants';
import { useB2BLearner, type B2BLearner } from '@/context/B2BLearnerContext';

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
];

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function B2BLoginPage() {
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params.tenant;
  const tenantId = getTenantId(tenantSlug);
  const router = useRouter();
  const { login, learner, tenantInfo } = useB2BLearner();

  const [learners, setLearners] = useState<B2BLearner[]>([]);
  const [loading, setLoading] = useState(true);

  // Already logged in — go to dashboard
  useEffect(() => {
    if (learner) {
      router.replace(`/b2b-learner/${tenantSlug}`);
    }
  }, [learner, tenantSlug, router]);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    supabase
      .from('learners')
      .select('id, full_name, email, tenant_id, department_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE')
      .order('full_name')
      .then(({ data }) => {
        setLearners((data ?? []) as B2BLearner[]);
        setLoading(false);
      });
  }, [tenantId]);

  function handleSelect(l: B2BLearner) {
    login(l);
    router.push(`/b2b-learner/${tenantSlug}`);
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <p className="text-sm text-zinc-500">Unknown tenant: {tenantSlug}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {tenantInfo?.logo_url ? (
            <img src={tenantInfo.logo_url} alt={tenantInfo.name} className="h-8 w-auto object-contain" />
          ) : (
            <div className="h-8 w-8 bg-teal-700 rounded-md flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-sm font-semibold text-zinc-900">
            {tenantInfo?.name ?? tenantSlug}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Demo warning */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Demo login only.</span> Click any learner card to sign in as that person. This flow is not intended for production use.
          </p>
        </div>

        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Select your profile</h1>
          <p className="text-sm text-zinc-500 mt-1">Who are you learning as today?</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : learners.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No active learners found for this organisation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {learners.map((l, i) => (
              <button
                key={l.id}
                onClick={() => handleSelect(l)}
                className="flex items-center gap-4 bg-white border border-zinc-200 rounded-lg p-4 text-left hover:border-teal-300 hover:shadow-sm transition-all group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor(i)}`}>
                  {getInitials(l.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate group-hover:text-teal-700 transition-colors">
                    {l.full_name}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{l.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
