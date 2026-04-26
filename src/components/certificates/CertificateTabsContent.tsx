"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import CertificateCard from './CertificateCard';

type CertRow = {
  id: string;
  content_id: string;
  content_title: string;
  certificate_number?: string | null;
  issued_at?: string | null;
  content_type?: string | null;
};

type AttemptRow = {
  id: string;
  content_id: string;
  score_pct: number;
  passed: boolean;
  attempted_at: string;
};

export default function CertificateTabsContent() {
  const { learner, tenantId, tenantSlug } = useB2BLearner();
  const learnerId = learner!.id;

  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<CertRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'assessments'>('courses');

  useEffect(() => {
    if (!tenantId || !learnerId) return;

    Promise.all([
      supabase
        .from('certificates')
        .select('id, content_id, content_title, certificate_number, issued_at, content_type')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .order('issued_at', { ascending: false }),
      supabase
        .from('learner_attempts')
        .select('id, content_id, score_pct, passed, attempted_at')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .eq('content_type', 'ASSESSMENT')
        .order('attempted_at', { ascending: false }),
    ]).then(([certsRes, attemptsRes]) => {
      setCertificates(certsRes.data ?? []);
      setAttempts((attemptsRes.data ?? []) as AttemptRow[]);
      setLoading(false);
    });
  }, [tenantId, learnerId]);

  const courseCerts = certificates.filter((c) => (c.content_type ?? 'COURSE') === 'COURSE');
  const assessmentCerts = certificates.filter((c) => (c.content_type ?? '') === 'ASSESSMENT');

  const passed = attempts.filter((a) => a.passed).length;
  const failed = attempts.filter((a) => !a.passed).length;
  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.score_pct, 0) / attempts.length) : 0;

  function handleDownload(id: string) {
    if (!tenantSlug) return;
    // Open cert preview/download in a new tab (preview route handled by app)
    window.open(`/b2b-learner/${tenantSlug}/certificates/${id}/preview`, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${activeTab === 'courses' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white border border-zinc-200 text-zinc-700'}`}
        >
          Course Certificates
        </button>
        <button
          onClick={() => setActiveTab('assessments')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${activeTab === 'assessments' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white border border-zinc-200 text-zinc-700'}`}
        >
          Assessment Certificates
        </button>
      </div>

      {activeTab === 'courses' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-teal-50 rounded-lg p-4">
              <p className="text-2xl font-semibold text-teal-700">{courseCerts.length}</p>
              <p className="text-xs text-teal-600 mt-0.5">Certificates</p>
            </div>
            <div className="bg-zinc-50 rounded-lg p-4">
              <p className="text-2xl font-semibold text-zinc-700">—</p>
              <p className="text-xs text-zinc-500 mt-0.5">Courses In Progress</p>
            </div>
            <div className="bg-zinc-50 rounded-lg p-4">
              <p className="text-2xl font-semibold text-zinc-700">—</p>
              <p className="text-xs text-zinc-500 mt-0.5">Avg Progress</p>
            </div>
            <div className="bg-zinc-50 rounded-lg p-4">
              <p className="text-2xl font-semibold text-zinc-700">—</p>
              <p className="text-xs text-zinc-500 mt-0.5">—</p>
            </div>
          </div>

          {courseCerts.length === 0 ? (
            <div className="text-center py-16 bg-zinc-50 rounded-xl border border-zinc-200">
              <p className="text-sm text-zinc-500">No course certificates yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseCerts.map((c) => (
                <CertificateCard key={c.id} certificate={c} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-teal-50 rounded-lg p-4">
              <p className="text-2xl font-semibold text-teal-700">{attempts.length}</p>
              <p className="text-xs text-teal-600 mt-0.5">Total Attempts</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-2xl font-semibold text-emerald-700">{passed}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Passed</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-4">
              <p className="text-2xl font-semibold text-rose-700">{failed}</p>
              <p className="text-xs text-rose-600 mt-0.5">Failed</p>
            </div>
            <div className="bg-zinc-50 rounded-lg p-4">
              <p className="text-2xl font-semibold text-zinc-700">{avgScore}%</p>
              <p className="text-xs text-zinc-500 mt-0.5">Avg Score</p>
            </div>
          </div>

          {attempts.length === 0 && assessmentCerts.length === 0 ? (
            <div className="text-center py-16 bg-zinc-50 rounded-xl border border-zinc-200">
              <p className="text-sm text-zinc-500">No assessment attempts or certificates yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* show assessment certificates first */}
              {assessmentCerts.map((c) => (
                <CertificateCard key={c.id} certificate={c} onDownload={handleDownload} />
              ))}

              {/* then show attempts as lightweight cards */}
              {attempts.map((a) => (
                <div key={a.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-zinc-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1"/></svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 truncate">{a.content_id}</h4>
                      <div className="text-xs text-zinc-500 mt-1">{a.score_pct}% • {a.passed ? 'Passed' : 'Failed'}</div>
                    </div>
                    <div className="ml-auto text-xs text-zinc-400">{new Date(a.attempted_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
