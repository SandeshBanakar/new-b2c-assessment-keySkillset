'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  BarChart2,
  Award,
  Zap,
  Target,
  FileText,
  CheckCircle2,
  XCircle,
  Info,
  Download,
  TrendingUp,
  Layers,
  Brain,
  Timer,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Lock,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentMeta {
  duration_minutes: number | null;
  total_questions: number | null;
  total_marks: number | null;
  difficulty: string | null;
}

interface AssessmentItemDetail {
  id: string;
  title: string;
  description: string | null;
  test_type: string;
  assessments_id: string | null;
  display_config: { what_youll_get?: string[] } | null;
  exam_categories: { name: string; display_name: string | null }[] | null;
  assessments: AssessmentMeta | null;
}

interface LearnerAttempt {
  id: string;
  content_id: string;
  score_pct: number;
  passed: boolean;
  attempted_at: string;
  time_taken_seconds: number | null;
}

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
}

type Tab = 'overview' | 'attempts' | 'analytics';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'attempts', label: 'Attempts' },
  { id: 'analytics', label: 'Analytics' },
];

const MAX_ATTEMPTS = 5;

const WHAT_YOULL_LEARN_FALLBACK = [
  'Core concept mastery through structured question sets',
  'Detailed performance insights after each attempt',
  'Progressive difficulty to sharpen your skills',
  'Certificate of achievement on successful completion',
];

const EXAM_BADGE: Record<string, string> = {
  SAT:  'bg-blue-50 text-blue-700 border border-blue-200',
  JEE:  'bg-orange-50 text-orange-700 border border-orange-200',
  NEET: 'bg-green-50 text-green-700 border border-green-200',
  PMP:  'bg-purple-50 text-purple-700 border border-purple-200',
  CLAT: 'bg-rose-50 text-rose-700 border border-rose-200',
  BANK: 'bg-teal-50 text-teal-700 border border-teal-200',
  SSC:  'bg-amber-50 text-amber-700 border border-amber-200',
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function B2BOverviewTab({
  assessment,
  attemptCount,
  tenantSlug,
}: {
  assessment: AssessmentItemDetail;
  attemptCount: number;
  tenantSlug: string;
}) {
  const router = useRouter();
  const meta = assessment.assessments;
  const categoryName = assessment.exam_categories?.[0]?.name ?? '';
  const testTypeLabel = assessment.test_type?.replace(/_/g, ' ') ?? '';
  const examBadgeClass =
    EXAM_BADGE[categoryName] ?? 'bg-zinc-100 text-zinc-600 border border-zinc-200';
  const isExhausted = attemptCount >= MAX_ATTEMPTS;

  const whatYoullLearn =
    assessment.display_config?.what_youll_get?.length
      ? assessment.display_config.what_youll_get
      : WHAT_YOULL_LEARN_FALLBACK;

  function handleCta() {
    if (isExhausted) {
      router.push(`/b2b-learner/${tenantSlug}/assessments/${assessment.id}?tab=attempts`);
    }
    // Non-exhausted states: exam engine routing is deferred (B2B auth not wired to exam engine)
  }

  return (
    <div className="space-y-6">
      {/* Dark hero */}
      <div className="bg-zinc-900 rounded-xl px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {categoryName && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${examBadgeClass}`}>
              {categoryName}
            </span>
          )}
          {testTypeLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 capitalize">
              {testTypeLabel}
            </span>
          )}
        </div>
        <h1 className="text-xl md:text-2xl font-semibold text-white leading-snug">
          {assessment.title}
        </h1>
        {assessment.description && (
          <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{assessment.description}</p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
          <Clock className="w-5 h-5 text-zinc-400 mb-2" />
          <p className="text-lg font-bold text-zinc-900">
            {meta?.duration_minutes ?? '—'}
            {meta?.duration_minutes ? <span className="text-sm font-normal text-zinc-500 ml-1">min</span> : null}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Duration</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
          <HelpCircle className="w-5 h-5 text-zinc-400 mb-2" />
          <p className="text-lg font-bold text-zinc-900">{meta?.total_questions ?? '—'}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Questions</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
          <Target className="w-5 h-5 text-zinc-400 mb-2" />
          <p className="text-lg font-bold text-zinc-900">{meta?.total_marks ?? meta?.total_questions ?? '—'}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Total Marks</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
          <Zap className="w-5 h-5 text-zinc-400 mb-2" />
          <p className="text-lg font-bold text-zinc-900 capitalize">
            {meta?.difficulty ?? '—'}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Difficulty</p>
        </div>
      </div>

      {/* About */}
      {assessment.description && (
        <div>
          <h2 className="text-base font-semibold text-zinc-900 mb-2">About this assessment</h2>
          <p className="text-sm text-zinc-600 leading-relaxed">{assessment.description}</p>
        </div>
      )}

      {/* What you'll learn */}
      <div>
        <h2 className="text-base font-semibold text-zinc-900 mb-3">What you&apos;ll learn</h2>
        <ul className="space-y-2">
          {whatYoullLearn.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div>
        <button
          onClick={handleCta}
          disabled={!isExhausted && attemptCount < MAX_ATTEMPTS}
          className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
            isExhausted
              ? 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              : 'bg-blue-700 text-white opacity-60 cursor-not-allowed'
          }`}
          title={!isExhausted ? 'Exam engine integration coming soon' : undefined}
        >
          {attemptCount === 0
            ? 'Start Assessment'
            : isExhausted
            ? 'View Analysis'
            : 'Start New Attempt'}
        </button>
        {!isExhausted && (
          <p className="text-xs text-zinc-400 mt-1.5">
            In-app exam launching coming soon.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Attempts Tab ─────────────────────────────────────────────────────────────

function B2BAttemptsTab({
  attempts,
  onSwitchTab,
}: {
  attempts: LearnerAttempt[];
  onSwitchTab: (tab: Tab) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        {attempts.length}/{MAX_ATTEMPTS} attempts used ·{' '}
        {MAX_ATTEMPTS - attempts.length} remaining
      </p>

      {Array.from({ length: MAX_ATTEMPTS }).map((_, index) => {
        const attempt = attempts[index];
        const attemptLabel = `Attempt ${index + 1}`;

        if (attempt) {
          const timeTakenMin =
            attempt.time_taken_seconds !== null
              ? Math.ceil(attempt.time_taken_seconds / 60)
              : null;
          return (
            <div
              key={attempt.id}
              className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-3"
            >
              {/* Left — attempt label + date */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">{attemptLabel}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date(attempt.attempted_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {timeTakenMin !== null && ` · ${timeTakenMin} min`}
                </p>
              </div>

              {/* Right — score + badge + View Analysis */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-lg font-bold ${
                    attempt.passed ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {attempt.score_pct}%
                </span>
                {attempt.passed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Pass
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" />
                    Fail
                  </span>
                )}
                <button
                  onClick={() => onSwitchTab('analytics')}
                  className="text-xs text-zinc-500 border border-zinc-200 px-2.5 py-1 rounded-lg hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
                >
                  View Analysis
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={`empty-${index}`}
            className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
              <p className="text-sm text-zinc-400">{attemptLabel}</p>
            </div>
            <span className="text-xs text-zinc-400">Not yet attempted</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Report Card Modal ────────────────────────────────────────────────────────

const REPORT_CARD_PAYLOAD_FIELDS: { label: string; field: string; note?: string }[] = [
  { label: 'Learner name & email',       field: 'learner_name, learner_email' },
  { label: 'Institution (co-branded)',   field: 'company_name + platform_name' },
  { label: 'Assessment title',           field: 'assessment_title' },
  { label: 'Attempt number',             field: 'attempt_number' },
  { label: 'Score percentage',           field: 'score_pct' },
  { label: 'Pass / Fail outcome',        field: 'passed' },
  { label: 'Total time taken',           field: 'time_taken_seconds' },
  { label: 'Per-question time (raw)',    field: 'time_per_question[]', note: 'Production exam engine only' },
  { label: 'Avg · Slowest · Fastest time', field: 'avg / slowest / fastest_question_time_seconds' },
  { label: 'All attempt scores (trend)', field: 'attempt_history[]' },
  { label: 'Average & best score',       field: 'average_score_pct, best_score_pct' },
  { label: 'Certificate eligibility',   field: 'certificate_eligible' },
  { label: 'Certificate number',         field: 'certificate_number' },
];

function ReportCardModal({
  onClose,
  onResend,
  hasAttempts,
}: {
  onClose: () => void;
  onResend: () => void;
  hasAttempts: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Assessment Report Card</h2>
              <p className="text-xs text-zinc-500">Auto-delivered via Salesforce after every attempt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Delivery status */}
          {hasAttempts ? (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                Your report card was <span className="font-semibold">automatically emailed</span> to
                your registered address after completing this attempt. Please check your inbox.
                <br />
                <span className="text-blue-600 mt-1 block">
                  Didn&apos;t receive it? Use &ldquo;Request Re-send&rdquo; below.
                </span>
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
              <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-600 leading-relaxed">
                Your report card will be automatically emailed to your registered address after
                you complete your first attempt. No action needed — it&apos;s sent by Salesforce.
              </p>
            </div>
          )}

          {/* Salesforce payload fields */}
          <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
              What&apos;s in your report card
            </p>
            <p className="text-xs text-zinc-400">
              Salesforce generates a PDF from these data fields and emails it to you.
            </p>
            <ul className="space-y-1.5">
              {REPORT_CARD_PAYLOAD_FIELDS.map((item) => (
                <li key={item.field} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-xs text-zinc-700">{item.label}</span>
                    {item.note && (
                      <span className="ml-1.5 text-xs text-amber-600 font-medium">· {item.note}</span>
                    )}
                    <code className="block text-xs text-zinc-400 font-mono">{item.field}</code>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Placeholder sections note */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-teal-800 mb-0.5">Coming in V2</p>
            <p className="text-xs text-teal-700">
              Section Breakdown · Concept Mastery · Pacing Analysis · Mistake Taxonomy —
              these will be added once the exam engine surfaces per-question analytics.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onResend}
            disabled={!hasAttempts}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Request Re-send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function B2BAnalyticsTab({
  attempts,
  certificate,
  tenantSlug,
  assessmentId,
}: {
  attempts: LearnerAttempt[];
  certificate: Certificate | null;
  tenantSlug: string;
  assessmentId: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [requested, setRequested] = useState(false);

  const hasQualifyingScore = attempts.some((a) => a.score_pct >= 80);
  const passedCount = attempts.filter((a) => a.passed).length;
  const failedCount = attempts.length - passedCount;
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.score_pct, 0) / attempts.length)
      : null;

  function handleDownload() {
    if (certificate) {
      window.open(
        `/b2b-learner/${tenantSlug}/certificates/${certificate.id}/preview`,
        '_blank',
      );
    }
  }

  function handleResend() {
    setRequested(true);
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      {/* Report Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-900">Report Card</p>
            <p className="text-xs text-blue-700 mt-0.5">
              {requested
                ? 'Re-send requested — check your registered email inbox.'
                : attempts.length === 0
                ? 'Will be automatically emailed after your first attempt.'
                : 'Sent to your email after each attempt via Salesforce.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-blue-300 text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          Details
        </button>
      </div>

      {showModal && (
        <ReportCardModal
          onClose={() => setShowModal(false)}
          onResend={handleResend}
          hasAttempts={attempts.length > 0}
        />
      )}

      {/* Certificate Status */}
      {certificate ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">Certificate Earned</p>
              <p className="text-xs text-amber-700 mt-0.5">
                #{certificate.certificate_number} · Issued{' '}
                {new Date(certificate.issued_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      ) : hasQualifyingScore ? (
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center gap-3">
          <Award className="w-5 h-5 text-zinc-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-zinc-700">Certificate Pending</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              You may be eligible. Your certificate is being processed.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-400">
          Complete an assessment with ≥80% score to earn a certificate.
        </p>
      )}

      {/* Score trend + pass/fail stats */}
      {attempts.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-900">Score Trajectory</h2>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
              <div className="flex items-end gap-2 h-28">
                {attempts.map((attempt, index) => (
                  <div key={attempt.id} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <span className="text-xs font-medium text-zinc-600">
                      {attempt.score_pct}%
                    </span>
                    <div className="w-full flex items-end" style={{ height: '72px' }}>
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          attempt.passed ? 'bg-emerald-500' : 'bg-rose-400'
                        }`}
                        style={{ height: `${Math.max(attempt.score_pct, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 truncate w-full text-center">
                      A{index + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-200">
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  Pass
                </span>
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
                  Fail
                </span>
              </div>
            </div>
          </div>

          {/* Pass / fail / avg summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-emerald-600">{passedCount}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Passed</p>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-rose-500">{failedCount}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Failed</p>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-zinc-800">
                {avgScore !== null ? `${avgScore}%` : '—'}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">Avg Score</p>
            </div>
          </div>
        </>
      )}

      {/* Detailed analytics placeholders */}
      {(
        [
          { icon: Layers,        label: 'Section Breakdown',  desc: 'Per-section accuracy rates, correct vs incorrect breakdown, and time distribution across exam sections.' },
          { icon: Brain,         label: 'Concept Mastery',    desc: 'Concept-level proficiency scores grouped by topic, highlighting strengths and gaps across the syllabus.' },
          { icon: Timer,         label: 'Pacing Analysis',    desc: 'Time-per-question distribution, rushed vs slow question patterns, and overall pacing efficiency.' },
          { icon: AlertTriangle, label: 'Mistake Taxonomy',   desc: 'Error classification by type — conceptual gaps, careless mistakes, and unattempted questions.' },
        ] as const
      ).map(({ icon: Icon, label, desc }) => (
        <div key={label} className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-700">{label}</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
          <p className="text-xs text-teal-600 font-medium">
            Everything in B2C is finalised — we use the same sections here.
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main detail component ────────────────────────────────────────────────────

function B2bAssessmentDetail() {
  const params = useParams<{ tenant: string; id: string }>();
  const assessmentId = params.id;
  const searchParams = useSearchParams();
  const { tenantSlug, learner, tenantId } = useB2BLearner();
  const router = useRouter();

  const [assessment, setAssessment] = useState<AssessmentItemDetail | null>(null);
  const [attempts, setAttempts] = useState<LearnerAttempt[]>([]);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  const rawTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<Tab>(
    rawTab === 'attempts' || rawTab === 'analytics' ? rawTab : 'overview',
  );

  const learnerId = learner?.id;

  // Access gate
  useEffect(() => {
    if (!tenantId || !assessmentId || !learnerId) return;
    supabase
      .from('learner_content_access')
      .select('content_id', { count: 'exact', head: true })
      .eq('learner_id', learnerId)
      .eq('tenant_id', tenantId)
      .eq('content_id', assessmentId)
      .eq('content_type', 'ASSESSMENT')
      .is('revoked_at', null)
      .then(({ count }) => {
        if (!count || count === 0) {
          router.replace(`/b2b-learner/${tenantSlug}/assessments`);
        }
      });
  }, [tenantId, assessmentId, learnerId, tenantSlug, router]);

  useEffect(() => {
    if (!tenantId || !assessmentId || !learnerId) return;

    async function doFetch() {
      // Step 1 — fetch assessment_items, attempts, and certificate in parallel
      const [itemRes, attemptsRes, certRes] = await Promise.all([
        supabase
          .from('assessment_items')
          .select('id, title, description, test_type, assessments_id, display_config, exam_categories(name, display_name)')
          .eq('id', assessmentId)
          .single(),
        supabase
          .from('learner_attempts')
          .select('id, content_id, score_pct, passed, attempted_at, time_taken_seconds')
          .eq('learner_id', learnerId)
          .eq('tenant_id', tenantId)
          .eq('content_id', assessmentId)
          .eq('content_type', 'ASSESSMENT')
          .order('attempted_at', { ascending: true }),
        supabase
          .from('certificates')
          .select('id, certificate_number, issued_at')
          .eq('learner_id', learnerId)
          .eq('tenant_id', tenantId)
          .eq('content_id', assessmentId)
          .eq('content_type', 'ASSESSMENT')
          .limit(1)
          .maybeSingle(),
      ]);

      const rawItem = itemRes.data as (typeof itemRes.data & { assessments_id?: string | null }) | null;

      // Step 2 — fetch assessments metadata if linked
      let assessmentMeta: AssessmentMeta | null = null;
      if (rawItem?.assessments_id) {
        const metaRes = await supabase
          .from('assessments')
          .select('duration_minutes, total_questions, total_marks, difficulty')
          .eq('id', rawItem.assessments_id)
          .single();
        assessmentMeta = (metaRes.data ?? null) as AssessmentMeta | null;
      }

      const assessment: AssessmentItemDetail | null = rawItem
        ? { ...(rawItem as unknown as AssessmentItemDetail), assessments: assessmentMeta }
        : null;

      return {
        assessment,
        attempts: (attemptsRes.data ?? []) as LearnerAttempt[],
        certificate: (certRes.data ?? null) as Certificate | null,
      };
    }

    doFetch().then(({ assessment, attempts, certificate }) => {
      setAssessment(assessment);
      setAttempts(attempts);
      setCertificate(certificate);
      setLoading(false);
    });
  }, [tenantId, assessmentId, learnerId]);

  if (loading) {
    return (
      <>
        <B2BNavbar />
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </>
    );
  }

  if (!assessment) {
    return (
      <>
        <B2BNavbar />
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-sm text-zinc-500">Assessment not found.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <B2BNavbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <button
            onClick={() => router.push(`/b2b-learner/${tenantSlug}/assessments`)}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </button>

          {/* Tab strip */}
          <div className="border-b border-zinc-200 mb-6">
            <div className="flex items-center gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-700 text-teal-700'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'attempts' && attempts.length > 0 && (
                    <span className="ml-1.5 text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full">
                      {attempts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <B2BOverviewTab
              assessment={assessment}
              attemptCount={attempts.length}
              tenantSlug={tenantSlug}
            />
          )}
          {activeTab === 'attempts' && (
            <B2BAttemptsTab attempts={attempts} onSwitchTab={setActiveTab} />
          )}
          {activeTab === 'analytics' && (
            <B2BAnalyticsTab
              attempts={attempts}
              certificate={certificate}
              tenantSlug={tenantSlug}
              assessmentId={assessmentId}
            />
          )}
        </div>
      </main>
    </>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function B2bAssessmentDetailPage() {
  return (
    <B2BAuthGuard>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <B2bAssessmentDetail />
      </Suspense>
    </B2BAuthGuard>
  );
}
