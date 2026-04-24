'use client';

import { useEffect, useState } from 'react';
import { Award, CheckCircle2, XCircle, Download, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';

interface AssessmentAttempt {
  id: string;
  content_id: string;
  content_title: string;
  score_pct: number;
  passed: boolean;
  attempted_at: string;
  time_taken_seconds: number;
}

interface CourseCertificate {
  id: string;
  content_id: string;
  content_title: string;
  certificate_number: string;
  issued_at: string;
}

function CertificatesContent() {
  const { learner, tenantId } = useB2BLearner();

  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [certificates, setCertificates] = useState<CourseCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  const learnerId = learner!.id;

  useEffect(() => {
    if (!tenantId || !learnerId) return;

    Promise.all([
      supabase
        .from('learner_attempts')
        .select('id, content_id, content_title, score_pct, passed, attempted_at, time_taken_seconds')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .eq('content_type', 'ASSESSMENT')
        .order('attempted_at', { ascending: false }),
      supabase
        .from('certificates')
        .select('id, content_id, content_title, certificate_number, issued_at')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .order('issued_at', { ascending: false }),
    ]).then(([attemptsRes, certsRes]) => {
      setAttempts(attemptsRes.data ?? []);
      setCertificates(certsRes.data ?? []);
      setLoading(false);
    });
  }, [tenantId, learnerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const passCount = attempts.filter((a) => a.passed).length;
  const failCount = attempts.filter((a) => !a.passed).length;
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score_pct, 0) / attempts.length)
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Report Card</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Your assessment performance summary</p>
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Pass any assessment with <strong>60% or higher</strong> to show here. Your best attempt counts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-teal-50 rounded-lg p-4">
          <p className="text-2xl font-semibold text-teal-700">{attempts.length}</p>
          <p className="text-xs text-teal-600 mt-0.5">Total Attempts</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <p className="text-2xl font-semibold text-emerald-700">{passCount}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Passed</p>
        </div>
        <div className="bg-rose-50 rounded-lg p-4">
          <p className="text-2xl font-semibold text-rose-700">{failCount}</p>
          <p className="text-xs text-rose-600 mt-0.5">Failed</p>
        </div>
        <div className="bg-zinc-50 rounded-lg p-4">
          <p className="text-2xl font-semibold text-zinc-700">{avgScore}%</p>
          <p className="text-xs text-zinc-500 mt-0.5">Avg Score</p>
        </div>
      </div>

      {/* Assessment attempts table */}
      {attempts.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200">
            <h2 className="text-sm font-medium text-zinc-900">Assessment Attempts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Assessment</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Score</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Date</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-900 max-w-[200px] truncate">{attempt.content_title}</td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">{attempt.score_pct}%</td>
                    <td className="px-4 py-3">
                      {attempt.passed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-600">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(attempt.attempted_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {Math.floor(attempt.time_taken_seconds / 60)} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course certificates */}
      {certificates.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 border-b border-zinc-200">
            <h2 className="text-sm font-medium text-emerald-900">Course Certificates</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Course</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Certificate ID</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Issued</th>
                  <th className="px-4 py-2 text-xs font-medium text-zinc-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-900 max-w-[180px] truncate">{cert.content_title}</td>
                    <td className="px-4 py-3 text-xs font-mono text-zinc-600">{cert.certificate_number}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{new Date(cert.issued_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-800 transition-colors">
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {attempts.length === 0 && certificates.length === 0 && (
        <div className="text-center py-16 bg-zinc-50 rounded-xl border border-zinc-200">
          <Award className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">No records yet</p>
          <p className="text-xs text-zinc-400 mt-1">Complete assessments or courses to see your report card.</p>
        </div>
      )}
    </div>
  );
}

export default function B2bCertificatesPage() {
  return (
    <B2BAuthGuard>
      <B2BNavbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <CertificatesContent />
      </main>
    </B2BAuthGuard>
  );
}
